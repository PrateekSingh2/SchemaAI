"use client";

import React, { useState, useEffect } from "react";
import {
  Sparkles,
  Play,
  CornerDownLeft,
  Loader2,
  Wand2,
  AlertTriangle,
  Lightbulb,
  Cpu,
} from "lucide-react";
import { samplePresets, QueryPreset } from "@/lib/mockData";
import { cn } from "@/lib/utils";

interface PromptInputProps {
  onGenerateAndRun: (promptText: string) => void;
  isLoading?: boolean;
}

export const PromptInput: React.FC<PromptInputProps> = ({
  onGenerateAndRun,
  isLoading = false,
}) => {
  const [prompt, setPrompt] = useState(
    "Find the top 5 users who scored highest in weekly quizzes with their average submission execution time"
  );

  const handleSubmit = () => {
    if (!prompt.trim() || isLoading) return;
    onGenerateAndRun(prompt.trim());
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
      e.preventDefault();
      handleSubmit();
    }
  };

  const selectPreset = (preset: QueryPreset) => {
    setPrompt(preset.prompt);
  };

  return (
    <div className="w-full bg-[#0a0f1e]/95 backdrop-blur-xl border border-slate-800/90 rounded-2xl p-4 shadow-2xl space-y-3">
      {/* Preset Suggestions Bar */}
      <div className="flex items-center space-x-2 overflow-x-auto pb-1 scrollbar-none">
        <span className="text-[11px] font-semibold uppercase tracking-wider text-cyan-400 shrink-0 flex items-center gap-1">
          <Lightbulb className="w-3.5 h-3.5 text-amber-400" /> Presets:
        </span>

        {samplePresets.map((preset) => {
          const isDanger = preset.isMutation;
          const isGql = preset.category === "GraphQL";

          return (
            <button
              key={preset.id}
              onClick={() => selectPreset(preset)}
              className={cn(
                "px-2.5 py-1 rounded-lg text-xs font-medium whitespace-nowrap transition-all border shrink-0 flex items-center space-x-1.5",
                isDanger
                  ? "bg-rose-950/40 hover:bg-rose-900/60 border-rose-800/60 text-rose-300 hover:border-rose-600"
                  : isGql
                  ? "bg-indigo-950/40 hover:bg-indigo-900/60 border-indigo-800/60 text-indigo-300 hover:border-indigo-600"
                  : "bg-slate-900 hover:bg-slate-800 border-slate-800 text-slate-300 hover:text-white hover:border-slate-700"
              )}
            >
              <span>{preset.title}</span>
              {isDanger && (
                <span className="text-[9px] font-mono px-1 py-0.2 rounded bg-rose-500/20 text-rose-400 uppercase font-bold">
                  MUTATION
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Main Textarea Input Container */}
      <div className="relative rounded-xl bg-slate-950/90 border border-slate-800 focus-within:border-cyan-500 focus-within:ring-1 focus-within:ring-cyan-500 transition-all p-3 shadow-inner">
        <textarea
          rows={3}
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Ask SchemaAI in plain English... (e.g. 'Show active quizzes with problem difficulty count' or 'DELETE FROM users WHERE ...')"
          className="w-full bg-transparent text-slate-100 placeholder:text-slate-500 text-sm focus:outline-none resize-none font-sans leading-relaxed"
        />

        {/* Action Controls & Run Button */}
        <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-900">
          <div className="flex items-center space-x-3 text-xs text-slate-400">
            <span className="flex items-center gap-1">
              <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
              <span>Semantic Schema Resolution Active</span>
            </span>
            <span className="hidden sm:inline-block text-slate-600">|</span>
            <span className="hidden sm:flex items-center gap-1 text-[11px] font-mono text-slate-500">
              <kbd className="px-1.5 py-0.5 rounded bg-slate-900 border border-slate-800 text-slate-400 text-[10px]">
                Ctrl/Cmd + ↵
              </kbd>{" "}
              to run
            </span>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={handleSubmit}
              disabled={isLoading || !prompt.trim()}
              className="flex items-center space-x-2 px-5 py-2 rounded-xl bg-gradient-to-r from-cyan-500 via-indigo-600 to-violet-600 hover:from-cyan-400 hover:via-indigo-500 hover:to-violet-500 text-white font-medium text-xs shadow-lg shadow-cyan-500/25 hover:shadow-cyan-500/40 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed group"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin text-white" />
                  <span>Synthesizing Query...</span>
                </>
              ) : (
                <>
                  <Wand2 className="w-4 h-4 text-cyan-200 group-hover:rotate-12 transition-transform" />
                  <span className="font-semibold">Generate & Run</span>
                  <CornerDownLeft className="w-3.5 h-3.5 text-cyan-200 opacity-70" />
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
