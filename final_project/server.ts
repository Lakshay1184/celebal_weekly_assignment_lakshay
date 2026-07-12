import express, { Request, Response } from "express";
import path from "path";
import dotenv from "dotenv";
import { GoogleGenAI } from "@google/genai";
import { createServer as createViteServer } from "vite";

// Load environment variables
dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json());

// Lazy-initialized Gemini client to prevent crashing on startup if key is missing
let aiClient: GoogleGenAI | null = null;

function getGeminiClient(): GoogleGenAI {
  if (!aiClient) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error("GEMINI_API_KEY is not configured in the environment. Please add it in the Secrets panel.");
    }
    aiClient = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          "User-Agent": "aistudio-build",
        },
      },
    });
  }
  return aiClient;
}

// API Routes
app.post("/api/chat", async (req: Request, res: Response): Promise<void> => {
  try {
    const { message, history, temperature, topP, maxTokens } = req.body;

    if (!message) {
       res.status(400).json({ error: "Message is required." });
       return;
    }

    const ai = getGeminiClient();

    // Map roles to Gemini roles ('user' or 'model')
    const formattedContents = [];
    if (history && Array.isArray(history)) {
      for (const msg of history) {
        formattedContents.push({
          role: msg.role === "assistant" ? "model" : "user",
          parts: [{ text: msg.text }],
        });
      }
    }

    // Append current message
    formattedContents.push({
      role: "user",
      parts: [{ text: message }],
    });

    const systemInstruction = `You are MINI-GPT, an advanced Small Language Model (SLM) with 80.9M parameters, featuring Rotary Position Embeddings (RoPE) and SwiGLU activation functions.
You are running locally on a Tesla T4 GPU with active CUDA acceleration.
Your specialty is hardware-level code optimization, CUDA kernels, GPU performance benchmarks, memory alignment, assembly reasoning, and general low-level systems engineering.

Follow these response constraints:
1. Speak in a cold, precise, and authoritative computer-terminal style. 
2. Use precise hardware and systems jargon (e.g., register pressure, shared memory bank conflicts, cache line size, warp occupancy).
3. If the user asks for code, provide highly optimized, correct, and ready-to-run scripts.
4. Structure your response with UPPERCASE headers (e.g., '# SHELL COMMAND', '# CUDA KERNEL', '# OPTIMIZATION ANALYSIS', '# ASSEMBLY').
5. Be concise and technical. Avoid conversational fluff or introductory greetings (like "Sure, here is..."). Get straight to the analysis and code.
6. Emphasize your small footprint (80.9M parameters) and extreme execution efficiency.`;

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: formattedContents,
      config: {
        systemInstruction,
        temperature: typeof temperature === "number" ? temperature : 0.8,
        topP: typeof topP === "number" ? topP : 0.9,
        maxOutputTokens: typeof maxTokens === "number" ? maxTokens : 256,
      },
    });

    const replyText = response.text || "MINI-GPT: System idle. Zero tokens returned.";
    res.json({ text: replyText });
  } catch (error: any) {
    console.error("Gemini API Error:", error);
    res.status(500).json({
      error: error.message || "Internal server error occurred while querying MINI-GPT.",
    });
  }
});

// Serve Frontend using Vite Middleware in Development, Static in Production
async function setupVite() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }
}

setupVite().then(() => {
  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });
});
