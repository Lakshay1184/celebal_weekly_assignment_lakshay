import torch
import torch.nn as nn
import torch.nn.functional as F
from dataclasses import dataclass

@dataclass
class GPTConfig:
    vocab_size = 24000
    block_size = 256
    n_layer = 10
    n_head = 10
    n_embd = 640
    dropout = 0.1
    expansion_factor = 4
    bias = False

class RotaryEmbedding(nn.Module):
    def __init__(self, dim, base=10000):
        super().__init__()
        inv_freq = 1.0 / (base ** (torch.arange(0, dim, 2).float() / dim))
        self.register_buffer("inv_freq", inv_freq, persistent=False)

    def forward(self, seq_len, device):
        t = torch.arange(seq_len, device=device).float()
        freqs = torch.outer(t, self.inv_freq)
        emb = torch.cat((freqs, freqs), dim=-1)
        return emb.cos(), emb.sin()

def rotate_half(x):
    x1 = x[..., :x.shape[-1]//2]
    x2 = x[..., x.shape[-1]//2:]
    return torch.cat((-x2, x1), dim=-1)

def apply_rotary(q, k, cos, sin):
    q = q * cos + rotate_half(q) * sin
    k = k * cos + rotate_half(k) * sin
    return q, k

class MultiHeadAttention(nn.Module):
    def __init__(self):
        super().__init__()
        self.n_head = GPTConfig.n_head
        self.head_dim = GPTConfig.n_embd // GPTConfig.n_head
        self.qkv = nn.Linear(GPTConfig.n_embd, GPTConfig.n_embd * 3, bias=False)
        self.proj = nn.Linear(GPTConfig.n_embd, GPTConfig.n_embd, bias=False)
        self.dropout = nn.Dropout(GPTConfig.dropout)
        self.rope = RotaryEmbedding(self.head_dim)

    def forward(self, x):
        B, T, C = x.shape
        qkv = self.qkv(x)
        q, k, v = qkv.chunk(3, dim=-1)
        q = q.view(B, T, self.n_head, self.head_dim).transpose(1, 2)
        k = k.view(B, T, self.n_head, self.head_dim).transpose(1, 2)
        v = v.view(B, T, self.n_head, self.head_dim).transpose(1, 2)

        cos, sin = self.rope(T, x.device)
        cos, sin = cos.unsqueeze(0).unsqueeze(0), sin.unsqueeze(0).unsqueeze(0)
        q, k = apply_rotary(q, k, cos, sin)

        out = F.scaled_dot_product_attention(
            q, k, v, is_causal=True,
            dropout_p=GPTConfig.dropout if self.training else 0
        )
        out = out.transpose(1, 2).reshape(B, T, C)
        return self.proj(out)

class SwiGLU(nn.Module):
    def __init__(self):
        super().__init__()
        hidden = GPTConfig.n_embd * GPTConfig.expansion_factor
        self.w1 = nn.Linear(GPTConfig.n_embd, hidden, bias=False)
        self.w2 = nn.Linear(GPTConfig.n_embd, hidden, bias=False)
        self.w3 = nn.Linear(hidden, GPTConfig.n_embd, bias=False)

    def forward(self, x):
        return self.w3(F.silu(self.w1(x)) * self.w2(x))

class Block(nn.Module):
    def __init__(self):
        super().__init__()
        self.ln1 = nn.LayerNorm(GPTConfig.n_embd, bias=False)
        self.attn = MultiHeadAttention()
        self.ln2 = nn.LayerNorm(GPTConfig.n_embd, bias=False)
        self.ffn = SwiGLU()

    def forward(self, x):
        x = x + self.attn(self.ln1(x))
        x = x + self.ffn(self.ln2(x))
        return x

class MiniGPT(nn.Module):
    def __init__(self):
        super().__init__()
        self.embedding = nn.Embedding(GPTConfig.vocab_size, GPTConfig.n_embd)
        self.dropout = nn.Dropout(GPTConfig.dropout)
        self.blocks = nn.ModuleList([Block() for _ in range(GPTConfig.n_layer)])
        self.norm = nn.LayerNorm(GPTConfig.n_embd, bias=False)
        self.lm_head = nn.Linear(GPTConfig.n_embd, GPTConfig.vocab_size, bias=False)
        self.embedding.weight = self.lm_head.weight

    def forward(self, idx, targets=None):
        x = self.embedding(idx)
        x = self.dropout(x)
        for block in self.blocks:
            x = block(x)
        x = self.norm(x)
        logits = self.lm_head(x)
        loss = None
        if targets is not None:
            logits = logits[:, :-1, :].contiguous()
            targets = targets[:, 1:].contiguous()
            loss = F.cross_entropy(logits.view(-1, logits.size(-1)), targets.view(-1), ignore_index=-100)
        return logits, loss