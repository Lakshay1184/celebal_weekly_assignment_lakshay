import React from "react";
import { Sliders } from "lucide-react";
import { ModelControls } from "../types";

interface ControlPanelProps {
  controls: ModelControls;
  onChange: (controls: ModelControls) => void;
  onReset: () => void;
  isOpen?: boolean;
}

export default function ControlPanel({
  controls,
  onChange,
  onReset,
  isOpen = true,
}: ControlPanelProps) {
  const updateField = (field: keyof ModelControls, value: number) => {
    onChange({
      ...controls,
      [field]: value,
    });
  };

  return (
    <aside className={`fixed right-0 top-0 h-full w-64 z-40 flex flex-col border-l-2 border-[#e2e2e2] bg-[#131313] transition-transform duration-300 ${
      isOpen ? "translate-x-0" : "translate-x-full"
    }`}>
      {/* Panel Header */}
      <div className="p-6 border-b-2 border-[#e2e2e2]">
        <div className="flex items-center gap-2 mb-2">
          <Sliders className="text-[#ff5f1f] w-5 h-5" />
          <h2 className="font-sans text-md font-black uppercase tracking-tight text-[#e2e2e2]">
            MODEL_CONTROLS
          </h2>
        </div>
      </div>

      {/* Sliders Container */}
      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        {/* Temperature */}
        <div className="space-y-2">
          <div className="flex justify-between font-mono text-xs uppercase">
            <label className="text-[#e3bfb3]" htmlFor="temp-slider">
              Temperature
            </label>
            <span className="text-[#ff5f1f] font-bold">
              {controls.temperature.toFixed(2)}
            </span>
          </div>
          <input
            id="temp-slider"
            type="range"
            min="0.1"
            max="2.0"
            step="0.05"
            value={controls.temperature}
            onChange={(e) => updateField("temperature", parseFloat(e.target.value))}
            className="w-full accent-[#ff5f1f] bg-[#1f1f1f] h-2 appearance-none cursor-pointer border border-[#5b4138]/40"
          />
          <p className="font-mono text-[10px] text-[#e3bfb3] opacity-60">
            High = Creative, Low = Deterministic
          </p>
        </div>

        {/* Top-P */}
        <div className="space-y-2">
          <div className="flex justify-between font-mono text-xs uppercase">
            <label className="text-[#e3bfb3]" htmlFor="topp-slider">
              Top-P
            </label>
            <span className="text-[#ff5f1f] font-bold">
              {controls.topP.toFixed(2)}
            </span>
          </div>
          <input
            id="topp-slider"
            type="range"
            min="0.1"
            max="1.0"
            step="0.05"
            value={controls.topP}
            onChange={(e) => updateField("topP", parseFloat(e.target.value))}
            className="w-full accent-[#ff5f1f] bg-[#1f1f1f] h-2 appearance-none cursor-pointer border border-[#5b4138]/40"
          />
          <p className="font-mono text-[10px] text-[#e3bfb3] opacity-60">
            Nucleus sampling probability threshold
          </p>
        </div>

        {/* Max Tokens */}
        <div className="space-y-2">
          <div className="flex justify-between font-mono text-xs uppercase">
            <label className="text-[#e3bfb3]" htmlFor="tokens-slider">
              Max Tokens
            </label>
            <span className="text-[#ff5f1f] font-bold">
              {controls.maxTokens}
            </span>
          </div>
          <input
            id="tokens-slider"
            type="range"
            min="32"
            max="512"
            step="32"
            value={controls.maxTokens}
            onChange={(e) => updateField("maxTokens", parseInt(e.target.value))}
            className="w-full accent-[#ff5f1f] bg-[#1f1f1f] h-2 appearance-none cursor-pointer border border-[#5b4138]/40"
          />
          <p className="font-mono text-[10px] text-[#e3bfb3] opacity-60">
            Limits generated context reply length
          </p>
        </div>

        {/* Repetition Penalty */}
        <div className="space-y-2">
          <div className="flex justify-between font-mono text-xs uppercase">
            <label className="text-[#e3bfb3]" htmlFor="penalty-slider">
              Rep Penalty
            </label>
            <span className="text-[#ff5f1f] font-bold">
              {controls.repetitionPenalty.toFixed(2)}
            </span>
          </div>
          <input
            id="penalty-slider"
            type="range"
            min="1.0"
            max="2.0"
            step="0.05"
            value={controls.repetitionPenalty}
            onChange={(e) => updateField("repetitionPenalty", parseFloat(e.target.value))}
            className="w-full accent-[#ff5f1f] bg-[#1f1f1f] h-2 appearance-none cursor-pointer border border-[#5b4138]/40"
          />
          <p className="font-mono text-[10px] text-[#e3bfb3] opacity-60">
            Penalizes re-generating identical tokens
          </p>
        </div>
      </div>

      {/* Reset Section */}
      <div className="p-6 bg-[#1b1b1b] border-t-2 border-[#e2e2e2]">
        <button
          onClick={onReset}
          className="w-full py-2 border border-[#5b4138] font-mono text-xs uppercase text-[#e2e2e2] hover:bg-white hover:text-black hover:border-white transition-all cursor-pointer"
        >
          Reset Defaults
        </button>
      </div>
    </aside>
  );
}
