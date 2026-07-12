import React, { useEffect, useState } from "react";
import { Cpu, Plus, History, Trash2 } from "lucide-react";
import { ChatSession, HardwareState } from "../types";

interface SidebarProps {
  sessions: ChatSession[];
  activeSessionId: string | null;
  onSelectSession: (id: string) => void;
  onNewChat: () => void;
  onDeleteSession: (id: string, e: React.MouseEvent) => void;
  hardware: HardwareState;
  isOpen?: boolean;
}

export default function Sidebar({
  sessions,
  activeSessionId,
  onSelectSession,
  onNewChat,
  onDeleteSession,
  hardware,
  isOpen = true,
}: SidebarProps) {
  // Let's fluctuate VRAM usage slightly when model is active to make it feel real!
  const [vramOffset, setVramOffset] = useState(0);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (hardware.active) {
      interval = setInterval(() => {
        setVramOffset((Math.random() - 0.5) * 0.4); // +/- 0.2 GB fluctuation
      }, 600);
    } else {
      setVramOffset(0);
    }
    return () => clearInterval(interval);
  }, [hardware.active]);

  const currentVramUsed = Math.min(
    hardware.vramTotal,
    Math.max(0, hardware.vramUsed + vramOffset)
  );
  const vramPercentage = Math.round((currentVramUsed / hardware.vramTotal) * 100);

  return (
    <aside className={`fixed left-0 top-0 h-full w-64 z-40 flex flex-col border-r-2 border-[#e2e2e2] bg-[#131313] transition-transform duration-300 ${
      isOpen ? "translate-x-0" : "-translate-x-full"
    }`}>
      {/* Sidebar Header */}
      <div className="p-6 border-b-2 border-[#e2e2e2]">
        <div className="flex items-center gap-2 mb-2">
          <Cpu className="text-[#ff5f1f] w-6 h-6" />
          <h1 className="font-sans text-xl font-black text-[#ff5f1f] uppercase tracking-tighter">
            MINI-GPT
          </h1>
        </div>
        <div className="flex items-center gap-2">
          <span className={`w-2 h-2 rounded-full bg-[#ff5f1f] ${hardware.active ? "animate-pulse" : "animate-pulse-fast"}`}></span>
          <span className="font-mono text-xs uppercase tracking-widest text-[#e3bfb3] opacity-80">
            80.9M - RoPE/SwiGLU
          </span>
        </div>
      </div>

      {/* New Chat Action */}
      <div className="p-4">
        <button
          onClick={onNewChat}
          className="w-full py-2 px-4 bg-[#ff5f1f] text-[#131313] font-sans font-bold text-sm uppercase flex items-center justify-center gap-2 hover:bg-white hover:text-black transition-colors border-2 border-[#ff5f1f] hover:border-white cursor-pointer select-none active:translate-y-0.5"
        >
          <Plus className="w-4 h-4" />
          New Chat
        </button>
      </div>

      {/* Chat History List */}
      <nav className="flex-1 overflow-y-auto px-4 space-y-1 py-2">
        <div className="font-mono text-xs text-[#e3bfb3] uppercase px-2 mb-2 opacity-50 tracking-wider">
          Chat History
        </div>
        
        {sessions.length === 0 ? (
          <div className="text-xs text-[#e3bfb3] opacity-40 px-2 py-4 italic font-mono">
            No history. Launch a context.
          </div>
        ) : (
          sessions.map((session) => {
            const isActive = session.id === activeSessionId;
            return (
              <div
                key={session.id}
                className={`group flex items-center justify-between border-b border-[#5b4138]/20 transition-all ${
                  isActive
                    ? "bg-[#ff5f1f] text-black"
                    : "text-[#e2e2e2] hover:bg-[#2a2a2a] hover:text-[#ff5f1f]"
                }`}
              >
                <button
                  onClick={() => onSelectSession(session.id)}
                  className="flex-1 text-left px-3 py-2 flex items-center gap-2 overflow-hidden cursor-pointer"
                >
                  <History className="w-4 h-4 flex-shrink-0" />
                  <span className="truncate font-mono text-xs uppercase font-medium">
                    {session.title}
                  </span>
                </button>
                
                <button
                  onClick={(e) => onDeleteSession(session.id, e)}
                  className={`p-2 transition-opacity opacity-0 group-hover:opacity-100 ${
                    isActive ? "hover:text-red-900 text-black" : "hover:text-red-500 text-gray-500"
                  }`}
                  title="Delete Session"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            );
          })
        )}
      </nav>

      {/* Bottom Hardware Monitor */}
      <div className="p-6 mt-auto border-t-2 border-[#e2e2e2] bg-[#1b1b1b]">
        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between font-mono text-xs uppercase">
            <span className="text-[#e3bfb3]">Device:</span>
            <span className="text-[#ff5f1f] font-bold">{hardware.device}</span>
          </div>
          
          <div className="w-full bg-[#353535] h-1.5 overflow-hidden border border-black">
            <div
              className="bg-[#ff5f1f] h-full transition-all duration-500"
              style={{ width: `${vramPercentage}%` }}
            ></div>
          </div>
          
          <div className="flex justify-between font-mono text-[10px] text-[#e3bfb3] opacity-85">
            <span>VRAM: {currentVramUsed.toFixed(1)} / {hardware.vramTotal} GB</span>
            <span>{vramPercentage}%</span>
          </div>
        </div>
      </div>
    </aside>
  );
}
