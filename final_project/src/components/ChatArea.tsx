import React, { useRef, useEffect } from "react";
import { Send, RefreshCw, AlertTriangle, Play, HelpCircle, Terminal, ChevronLeft, ChevronRight, Menu, Sliders } from "lucide-react";
import { ChatMessage, ModelControls } from "../types";

interface ChatAreaProps {
  messages: ChatMessage[];
  inputValue: string;
  onInputChange: (val: string) => void;
  onSendMessage: () => void;
  onClearHistory: () => void;
  controls: ModelControls;
  isLoading: boolean;
  onSelectPrompt: (prompt: string) => void;
  isLeftSidebarOpen: boolean;
  isRightSidebarOpen: boolean;
  onToggleLeftSidebar: () => void;
  onToggleRightSidebar: () => void;
}

export default function ChatArea({
  messages,
  inputValue,
  onInputChange,
  onSendMessage,
  onClearHistory,
  controls,
  isLoading,
  onSelectPrompt,
  isLeftSidebarOpen,
  isRightSidebarOpen,
  onToggleLeftSidebar,
  onToggleRightSidebar,
}: ChatAreaProps) {
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom of chat
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isLoading]);

  // Suggested technical prompts
  const samplePrompts = [
    {
      title: "CUDA Core Verify",
      prompt: "How do I verify if my current environment is utilizing the Tesla T4's Tensor Cores?",
    },
    {
      title: "Optimize kernel",
      prompt: "Write a CUDA kernel for matrix multiplication optimized for a small memory footprint.",
    },
    {
      title: "FlashAttention SwiGLU",
      prompt: "Explain how SwiGLU activation functions can be implemented efficiently at the GPU hardware level.",
    },
    {
      title: "Avoid bank conflicts",
      prompt: "Provide a quick guide to avoiding shared memory bank conflicts in CUDA.",
    },
  ];

  // Simple formatter to detect code blocks (```code```) or uppercase titles (# HEADER)
  const renderMessageContent = (text: string) => {
    const lines = text.split("\n");
    let inCodeBlock = false;
    let codeContent: string[] = [];
    const elements: React.ReactNode[] = [];

    lines.forEach((line, idx) => {
      if (line.trim().startsWith("```")) {
        if (inCodeBlock) {
          // End of code block
          elements.push(
            <pre
              key={`code-${idx}`}
              className="bg-black text-[#ff5f1f] p-4 font-mono text-xs border border-[#5b4138] overflow-x-auto my-3 select-all"
            >
              {codeContent.join("\n")}
            </pre>
          );
          codeContent = [];
          inCodeBlock = false;
        } else {
          // Start of code block
          inCodeBlock = true;
        }
      } else if (inCodeBlock) {
        codeContent.push(line);
      } else {
        // Look for custom header style (# SOMETHING)
        if (line.trim().startsWith("# ") || line.trim().startsWith("## ")) {
          const title = line.replace(/^#+\s+/, "");
          elements.push(
            <p
              key={`header-${idx}`}
              className="font-mono text-xs text-[#ff5f1f] font-bold mt-4 mb-2 tracking-wide uppercase"
            >
              # {title}
            </p>
          );
        } else if (line.trim().startsWith("$ ") || line.trim().toUpperCase().includes("NVIDIA-SMI") || (line.trim().startsWith("nvidia-smi"))) {
          // Render as a CLI line if it resembles command line and is outside a code block
          elements.push(
            <pre
              key={`cli-${idx}`}
              className="bg-black text-[#e2e2e2] p-3 font-mono text-xs border border-[#5b4138]/50 my-2"
            >
              {line}
            </pre>
          );
        } else {
          elements.push(
            <p key={`p-${idx}`} className="font-sans text-sm leading-relaxed mb-2 text-[#e2e2e2]">
              {line}
            </p>
          );
        }
      }
    });

    // If still in code block when text ends
    if (inCodeBlock && codeContent.length > 0) {
      elements.push(
        <pre
          key="code-end"
          className="bg-black text-[#ff5f1f] p-4 font-mono text-xs border border-[#5b4138] overflow-x-auto my-3"
        >
          {codeContent.join("\n")}
        </pre>
      );
    }

    return elements;
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      onSendMessage();
    }
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-[#131313] overflow-hidden">
      {/* Top Header Bar */}
      <header className="sticky top-0 z-30 flex justify-between items-center w-full px-6 py-4 border-b-2 border-[#e2e2e2] bg-[#131313]">
        <div className="flex items-center gap-2">
          <button
            onClick={onToggleLeftSidebar}
            className="flex items-center justify-center border border-[#e2e2e2] hover:bg-[#ff5f1f] hover:text-black hover:border-[#ff5f1f] p-1.5 transition-all cursor-pointer mr-1"
            title={isLeftSidebarOpen ? "Collapse Left Panel" : "Expand Left Panel"}
          >
            {isLeftSidebarOpen ? (
              <ChevronLeft className="w-4 h-4" />
            ) : (
              <Menu className="w-4 h-4" />
            )}
          </button>
          
          <Terminal className="text-[#ff5f1f] w-4 h-4 animate-pulse" />
          <span className="font-mono text-xs uppercase font-bold text-[#ff5f1f] tracking-wide">
            Inference Mode: Active
          </span>
        </div>
        
        <div className="flex items-center gap-2">
          <button
            onClick={onClearHistory}
            className="font-mono text-xs uppercase border border-[#e2e2e2] px-3 py-1.5 hover:bg-[#ff5f1f] hover:text-black hover:border-[#ff5f1f] transition-all cursor-pointer"
          >
            Clear History
          </button>
          
          <button
            onClick={onToggleRightSidebar}
            className="flex items-center justify-center border border-[#e2e2e2] hover:bg-[#ff5f1f] hover:text-black hover:border-[#ff5f1f] p-1.5 transition-all cursor-pointer"
            title={isRightSidebarOpen ? "Collapse Model Controls" : "Expand Model Controls"}
          >
            {isRightSidebarOpen ? (
              <ChevronRight className="w-4 h-4" />
            ) : (
              <Sliders className="w-4 h-4" />
            )}
          </button>
        </div>
      </header>

      {/* Main Chat Stream */}
      <div className="flex-1 overflow-y-auto p-6 space-y-6 scroll-smooth">
        
        {/* System Introduction / Constant Header */}
        <div className="max-w-3xl mx-auto flex flex-col gap-2">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-[#ff5f1f] text-sm">memory</span>
            <span className="font-mono text-xs uppercase text-[#ff5f1f]">System_v1.0.4</span>
          </div>
          <div className="bg-[#1f1f1f] p-4 border border-[#e2e2e2]">
            <p className="font-sans text-sm text-[#e2e2e2] leading-relaxed">
              Mini-GPT specialized weights loaded. Optimized for{" "}
              <span className="text-[#ff5f1f] font-semibold">technical reasoning</span> and{" "}
              <span className="text-[#ff5f1f] font-semibold">hardware-level code generation</span>. Ready for instructions.
            </p>
          </div>
        </div>

        {/* Message List */}
        {messages.map((msg) => {
          if (msg.role === "user") {
            return (
              <div key={msg.id} className="max-w-3xl mx-auto flex flex-col items-end gap-2">
                <div className="glassmorphic-user p-4 max-w-[80%] border border-[#ff5f1f]/35">
                  <p className="font-sans text-sm text-white select-text">{msg.text}</p>
                </div>
                <span className="font-mono text-[9px] text-[#e3bfb3] opacity-50 px-1">
                  {msg.timestamp}
                </span>
              </div>
            );
          } else {
            // Assistant message
            return (
              <div key={msg.id} className="max-w-3xl mx-auto flex flex-col gap-2">
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-[#ff5f1f] text-sm">memory</span>
                  <span className="font-mono text-xs uppercase text-[#ff5f1f]">
                    {msg.isError ? "System Alert" : "Assistant"}
                  </span>
                </div>
                
                <div
                  className={`p-4 border ${
                    msg.isError
                      ? "bg-[#93000a]/30 border-red-600 text-[#ffdad6]"
                      : "bg-[#1f1f1f] border-[#e2e2e2]"
                  }`}
                >
                  {msg.isError ? (
                    <div className="flex items-start gap-2.5">
                      <AlertTriangle className="text-red-500 w-5 h-5 flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="font-mono text-xs text-[#ffb4ab] font-bold uppercase mb-1">
                          ERROR_CONNECTION_FAILED
                        </p>
                        <p className="font-sans text-sm">{msg.text}</p>
                      </div>
                    </div>
                  ) : (
                    renderMessageContent(msg.text)
                  )}
                </div>
                
                <span className="font-mono text-[9px] text-[#e3bfb3] opacity-50">
                  {msg.timestamp}
                </span>
              </div>
            );
          }
        })}

        {/* Loading Spinner */}
        {isLoading && (
          <div className="max-w-3xl mx-auto flex flex-col gap-2">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-[#ff5f1f] text-sm animate-spin">
                sync
              </span>
              <span className="font-mono text-xs uppercase text-[#ff5f1f] tracking-widest animate-pulse">
                INFERENCING...
              </span>
            </div>
            <div className="bg-[#1f1f1f] p-4 border border-[#ff5f1f] border-dashed">
              <div className="flex items-center gap-3">
                <div className="w-1.5 h-6 bg-[#ff5f1f] animate-pulse"></div>
                <p className="font-mono text-xs text-[#e3bfb3]">
                  Computing attention matrices... RoPE scaling active... Temp: {controls.temperature}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Empty State / Suggested Prompt helper */}
        {messages.length === 0 && !isLoading && (
          <div className="max-w-3xl mx-auto py-6">
            <div className="border border-[#5b4138]/40 p-4 bg-[#1b1b1b] mb-4">
              <h3 className="font-mono text-xs text-[#ff5f1f] uppercase font-bold mb-2 flex items-center gap-1.5">
                <HelpCircle className="w-3.5 h-3.5" />
                Select Hardware & Low-Level Kernels Prompt
              </h3>
              <p className="font-sans text-xs text-[#e3bfb3] mb-4">
                Click a preset low-level hardware or optimization query below to inject it directly into the SLM:
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {samplePrompts.map((p, idx) => (
                  <button
                    key={idx}
                    onClick={() => onSelectPrompt(p.prompt)}
                    className="text-left p-3 border border-[#5b4138]/40 hover:border-[#ff5f1f] hover:bg-[#1f1f1f] text-[#e2e2e2] hover:text-[#ff5f1f] transition-all group"
                  >
                    <div className="flex justify-between items-center mb-1">
                      <span className="font-mono text-[10px] uppercase font-bold text-[#ff5f1f]">
                        {p.title}
                      </span>
                      <Play className="w-2.5 h-2.5 opacity-0 group-hover:opacity-100 transition-opacity text-[#ff5f1f]" />
                    </div>
                    <p className="font-sans text-[11px] text-[#e3bfb3] line-clamp-2">
                      {p.prompt}
                    </p>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Sticky Bottom Input Dock */}
      <div className="sticky bottom-0 bg-[#131313]/90 backdrop-blur-md p-6 border-t-2 border-[#e2e2e2]">
        <div className="max-w-3xl mx-auto relative group">
          {/* Neon orange background glow */}
          <div className="absolute inset-0 bg-[#ff5f1f]/5 -m-1 blur-lg opacity-0 group-focus-within:opacity-100 transition-opacity"></div>
          
          <div className="relative bg-black border-2 border-[#e2e2e2] group-focus-within:border-[#ff5f1f] transition-colors flex flex-col">
            <textarea
              id="chat-input"
              value={inputValue}
              onChange={(e) => onInputChange(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Type instruction for MINI-GPT..."
              className="w-full bg-transparent border-none focus:ring-0 focus:outline-none font-sans p-4 text-white resize-none min-h-[56px] text-sm"
              rows={2}
            />
            
            <div className="flex justify-between items-center px-4 py-2 border-t border-[#e2e2e2]/15">
              <span
                id="char-counter"
                className={`font-mono text-xs ${
                  inputValue.length > 1800 ? "text-[#ff5f1f]" : "text-[#e3bfb3] opacity-60"
                }`}
              >
                {inputValue.length} / 2048
              </span>
              
              <button
                id="send-btn"
                onClick={onSendMessage}
                disabled={isLoading || !inputValue.trim()}
                className="bg-[#ff5f1f] disabled:bg-[#353535] text-black disabled:text-gray-500 px-4 py-1.5 flex items-center gap-2 font-bold uppercase transition-all hover:bg-white hover:text-black active:translate-y-0.5 cursor-pointer disabled:cursor-not-allowed text-xs"
              >
                Send
                <Send className="w-3 h-3" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
