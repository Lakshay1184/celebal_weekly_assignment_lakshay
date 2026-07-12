from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import torch
import torch.nn.functional as F
import sentencepiece as spm
import os

from model_def import MiniGPT, GPTConfig

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

device = "cuda" if torch.cuda.is_available() else "cpu"
print(f"Running inference on device: {device}")

sp = spm.SentencePieceProcessor()
tokenizer_path = "minigpt.model"
checkpoint_path = "final.pt"

if os.path.exists(tokenizer_path):
    sp.load(tokenizer_path)
    print("SentencePiece tokenizer loaded successfully.")
else:
    raise FileNotFoundError("Missing minigpt.model in root folder!")

model = MiniGPT().to(device)
if os.path.exists(checkpoint_path):
    model.load_state_dict(torch.load(checkpoint_path, map_location=device))
    model.eval()
    print("Mini-GPT weights loaded successfully into memory.")
else:
    raise FileNotFoundError("Missing checkpoints/final.pt!")

class ChatRequest(BaseModel):
    message: str
    history: list = []
    temperature: float = 0.8
    topP: float = 0.9
    maxTokens: int = 256
    repetitionPenalty: float = 1.15

@app.post("/api/chat")
@torch.no_grad()
async def chat(req: ChatRequest):
    try:
        formatted_prompt = f"<User>: {req.message}\n<Assistant>: "
        ids = sp.encode(formatted_prompt)
        ids = torch.tensor(ids, device=device).unsqueeze(0)

        for _ in range(req.maxTokens):
            idx = ids[:, -GPTConfig.block_size:]
            logits, _ = model(idx)
            logits = logits[:, -1, :] / req.temperature

            for token in torch.unique(ids):
                logits[:, token] /= req.repetitionPenalty

            probs = F.softmax(logits, dim=-1)
            sorted_probs, sorted_idx = torch.sort(probs, descending=True)
            cumulative = torch.cumsum(sorted_probs, dim=-1)

            mask = cumulative > req.topP
            mask[..., 1:] = mask[..., :-1].clone()
            mask[..., 0] = False

            sorted_probs[mask] = 0
            sorted_probs /= sorted_probs.sum(dim=-1, keepdim=True)

            next_token = torch.multinomial(sorted_probs, 1)
            next_token = sorted_idx.gather(-1, next_token)
            ids = torch.cat([ids, next_token], dim=1)

            if next_token.item() == sp.eos_id():
                break

        full_output = sp.decode(ids[0].tolist())
        assistant_reply = full_output[len(formatted_prompt):].strip()

        return {"text": assistant_reply}

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))