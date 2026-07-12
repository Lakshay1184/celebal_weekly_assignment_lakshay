import React, { useState, useEffect } from "react";
import { ChatSession, ChatMessage, ModelControls, HardwareState } from "./types";
import Sidebar from "./components/Sidebar";
import ControlPanel from "./components/ControlPanel";
import ChatArea from "./components/ChatArea";

const LOCAL_STORAGE_KEY = "mini-gpt-sessions";
const LOCAL_STORAGE_CONTROLS_KEY = "mini-gpt-controls";

// Pre-seeded sessions matching the user's screenshot exactly!
const DEFAULT_SESSIONS: ChatSession[] = [
  {
    id: "optimize-cuda-ops",
    title: "OPTIMIZE_CUDA_OPS",
    createdAt: new Date(Date.now() - 3600000 * 2).toISOString(),
    messages: [
      {
        id: "sys-init",
        role: "system",
        text: "Mini-GPT specialized weights loaded. Optimized for technical reasoning and hardware-level code generation. Ready for instructions.",
        timestamp: new Date(Date.now() - 3600000 * 2).toLocaleTimeString(),
      },
      {
        id: "msg-1",
        role: "user",
        text: "How do I verify if my current environment is utilizing the Tesla T4's Tensor Cores?",
        timestamp: new Date(Date.now() - 3600000 * 2 + 60000).toLocaleTimeString(),
      },
      {
        id: "msg-2",
        role: "assistant",
        text: `# SHELL COMMAND\n\nnvidia-smi -q -d PERFORMANCE\n\nLook for the "Precision Statistics" section. On a Tesla T4 (Turing architecture), usage of FP16 or INT8 matrix operations automatically engages Tensor Cores.`,
        timestamp: new Date(Date.now() - 3600000 * 2 + 120000).toLocaleTimeString(),
      }
    ]
  },
  {
    id: "tensor-core-bench",
    title: "TENSOR_CORE_BENCH",
    createdAt: new Date(Date.now() - 3600000 * 24).toISOString(),
    messages: [
      {
        id: "msg-tc-1",
        role: "user",
        text: "Write a short PyTorch script to benchmark GEMM performance with FP16 precision.",
        timestamp: new Date(Date.now() - 3600000 * 24 + 1000).toLocaleTimeString(),
      },
      {
        id: "msg-tc-2",
        role: "assistant",
        text: `# PYTORCH FP16 BENCHMARK\n\n\`\`\`python\nimport torch\nimport time\n\n# Warmup\na = torch.randn(4096, 4096, device='cuda', dtype=torch.float16)\nb = torch.randn(4096, 4096, device='cuda', dtype=torch.float16)\nfor _ in range(10):\n    torch.matmul(a, b)\n\ntorch.cuda.synchronize()\nstart = time.time()\nfor _ in range(100):\n    torch.matmul(a, b)\ntorch.cuda.synchronize()\nend = time.time()\n\ntflops = (2 * (4096 ** 3) * 100) / (end - start) / 1e12\nprint(f"FP16 Matrix Multiplication performance: {tflops:.2f} TFLOPS")\n\`\`\``,
        timestamp: new Date(Date.now() - 3600000 * 24 + 12000).toLocaleTimeString(),
      }
    ]
  },
  {
    id: "gradient-clip-exp",
    title: "GRADIENT_CLIP_EXP",
    createdAt: new Date(Date.now() - 3600000 * 48).toISOString(),
    messages: [
      {
        id: "msg-gc-1",
        role: "user",
        text: "What gradient clipping value do you recommend to stabilize SwiGLU-based 80M models?",
        timestamp: new Date(Date.now() - 3600000 * 48 + 1000).toLocaleTimeString(),
      },
      {
        id: "msg-gc-2",
        role: "assistant",
        text: `# GRADIENT CLIPPING CRITERIA\n\nFor an 80.9M parameter model utilizing SwiGLU activations, gradients are highly non-linear. Use a max norm value of 1.0 using L2 norm.\n\n\`\`\`python\ntorch.nn.utils.clip_grad_norm_(model.parameters(), max_norm=1.0)\n\`\`\``,
        timestamp: new Date(Date.now() - 3600000 * 48 + 5000).toLocaleTimeString(),
      }
    ]
  }
];

const DEFAULT_CONTROLS: ModelControls = {
  temperature: 0.8,
  topP: 0.9,
  maxTokens: 256,
  repetitionPenalty: 1.15,
};

export default function App() {
  // Load initial sessions from localStorage or default
  const [sessions, setSessions] = useState<ChatSession[]>(() => {
    const saved = localStorage.getItem(LOCAL_STORAGE_KEY);
    return saved ? JSON.parse(saved) : DEFAULT_SESSIONS;
  });

  const [activeSessionId, setActiveSessionId] = useState<string | null>(() => {
    return sessions.length > 0 ? sessions[0].id : null;
  });

  const [controls, setControls] = useState<ModelControls>(() => {
    const saved = localStorage.getItem(LOCAL_STORAGE_CONTROLS_KEY);
    return saved ? JSON.parse(saved) : DEFAULT_CONTROLS;
  });

  const [hardware, setHardware] = useState<HardwareState>({
    device: "CUDA (Tesla T4)",
    vramUsed: 10.2,
    vramTotal: 16.0,
    active: false,
  });

  const [inputValue, setInputValue] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  
  // Set Left Sidebar open by default, and Right Sidebar closed by default!
  const [isLeftSidebarOpen, setIsLeftSidebarOpen] = useState(true);
  const [isRightSidebarOpen, setIsRightSidebarOpen] = useState(false);

  // Sync sessions to local storage
  useEffect(() => {
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(sessions));
  }, [sessions]);

  // Sync controls to local storage
  useEffect(() => {
    localStorage.setItem(LOCAL_STORAGE_CONTROLS_KEY, JSON.stringify(controls));
  }, [controls]);

  // Handle Select Session
  const handleSelectSession = (id: string) => {
    setActiveSessionId(id);
  };

  // Handle New Chat
  const handleNewChat = () => {
    const newId = `session-${Date.now()}`;
    const newSession: ChatSession = {
      id: newId,
      title: "NEW_CHAT",
      createdAt: new Date().toISOString(),
      messages: [],
    };
    setSessions([newSession, ...sessions]);
    setActiveSessionId(newId);
  };

  // Handle Delete Session
  const handleDeleteSession = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const updated = sessions.filter((s) => s.id !== id);
    setSessions(updated);
    if (activeSessionId === id) {
      setActiveSessionId(updated.length > 0 ? updated[0].id : null);
    }
  };

  // Handle Reset Controls
  const handleResetControls = () => {
    setControls(DEFAULT_CONTROLS);
  };

  // Handle Send Message
  const handleSendMessage = async () => {
    if (!inputValue.trim() || !activeSessionId) return;

    const text = inputValue.trim();
    setInputValue("");
    setIsLoading(true);
    setHardware((prev) => ({ ...prev, active: true }));

    // Capture target session
    const currentSession = sessions.find((s) => s.id === activeSessionId);
    if (!currentSession) return;

    // Create user message
    const userMsg: ChatMessage = {
      id: `msg-user-${Date.now()}`,
      role: "user",
      text,
      timestamp: new Date().toLocaleTimeString(),
    };

    // Update session instantly with user message
    const updatedMessages = [...currentSession.messages, userMsg];
    
    // Update session title if it's currently a default
    const currentTitle = currentSession.title === "NEW_CHAT" 
      ? text.substring(0, 20).toUpperCase().replace(/\s+/g, "_") 
      : currentSession.title;

    setSessions((prevSessions) =>
      prevSessions.map((s) =>
        s.id === activeSessionId
          ? { ...s, title: currentTitle, messages: updatedMessages }
          : s
      )
    );

    try {
      // Build previous messages context to keep history aligned
      const historyContext = currentSession.messages.filter(m => m.role !== "system");

      const response = await fetch("/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          message: text,
          history: historyContext,
          temperature: controls.temperature,
          topP: controls.topP,
          maxTokens: controls.maxTokens,
          repetitionPenalty: controls.repetitionPenalty,
        }),
      });

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.error || `HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      
      const assistantMsg: ChatMessage = {
        id: `msg-assistant-${Date.now()}`,
        role: "assistant",
        text: data.text,
        timestamp: new Date().toLocaleTimeString(),
      };

      setSessions((prevSessions) =>
        prevSessions.map((s) =>
          s.id === activeSessionId
            ? { ...s, messages: [...updatedMessages, assistantMsg] }
            : s
        )
      );
    } catch (err: any) {
      console.error(err);
      const errorMsg: ChatMessage = {
        id: `msg-err-${Date.now()}`,
        role: "assistant",
        text: err.message || "Local inference server at 3000 unavailable.",
        timestamp: new Date().toLocaleTimeString(),
        isError: true,
      };

      setSessions((prevSessions) =>
        prevSessions.map((s) =>
          s.id === activeSessionId
            ? { ...s, messages: [...updatedMessages, errorMsg] }
            : s
        )
      );
    } finally {
      setIsLoading(false);
      setHardware((prev) => ({ ...prev, active: false }));
    }
  };

  // Handle Prompt Selection from helpers
  const handleSelectPrompt = (promptText: string) => {
    setInputValue(promptText);
  };

  // Clear Chat History completely (Resets Active Session)
  const handleClearHistory = () => {
    if (!activeSessionId) return;
    setSessions((prevSessions) =>
      prevSessions.map((s) =>
        s.id === activeSessionId
          ? {
              ...s,
              messages: [
                {
                  id: `sys-clear-${Date.now()}`,
                  role: "system",
                  text: "History cleared. Device ready for fresh context.",
                  timestamp: new Date().toLocaleTimeString(),
                },
              ],
            }
          : s
      )
    );
  };

  const activeSession = sessions.find((s) => s.id === activeSessionId) || null;

  return (
    <div className="flex h-screen bg-[#131313] text-[#e2e2e2] overflow-hidden selection:bg-[#ff5f1f] selection:text-black">
      {/* Sidebar Hardware Monitor & Session Navigation */}
      <Sidebar
        sessions={sessions}
        activeSessionId={activeSessionId}
        onSelectSession={handleSelectSession}
        onNewChat={handleNewChat}
        onDeleteSession={handleDeleteSession}
        hardware={hardware}
        isOpen={isLeftSidebarOpen}
      />

      {/* Main Workspace Frame */}
      <main className={`flex-1 flex flex-col h-full bg-[#131313] relative transition-all duration-300 ${
        isLeftSidebarOpen ? "ml-64" : "ml-0"
      } ${
        isRightSidebarOpen ? "mr-64" : "mr-0"
      }`}>
        <ChatArea
          messages={activeSession ? activeSession.messages : []}
          inputValue={inputValue}
          onInputChange={setInputValue}
          onSendMessage={handleSendMessage}
          onClearHistory={handleClearHistory}
          controls={controls}
          isLoading={isLoading}
          onSelectPrompt={handleSelectPrompt}
          isLeftSidebarOpen={isLeftSidebarOpen}
          isRightSidebarOpen={isRightSidebarOpen}
          onToggleLeftSidebar={() => setIsLeftSidebarOpen(!isLeftSidebarOpen)}
          onToggleRightSidebar={() => setIsRightSidebarOpen(!isRightSidebarOpen)}
        />
      </main>

      {/* Right Control Panel: Model Hyperparameters sliders */}
      <ControlPanel
        controls={controls}
        onChange={setControls}
        onReset={handleResetControls}
        isOpen={isRightSidebarOpen}
      />
    </div>
  );
}