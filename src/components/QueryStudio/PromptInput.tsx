"use client";

import React, { useState } from "react";
import {
  Sparkles,
  CornerDownLeft,
  Loader2,
  Wand2,
  Lightbulb,
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
    <div className="w-full bg-[#171412]/95 backdrop-blur-2xl border border-[#292524] rounded-2xl p-4 shadow-2xl space-y-3 supabase-panel">
      {/* Preset Suggestions Bar */}
      <div className="flex items-center space-x-2 overflow-x-auto pb-1 scrollbar-none">
        <span className="text-[11px] font-semibold uppercase tracking-wider text-[#3ecf8e] shrink-0 flex items-center gap-1.5 pl-1">
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
                "px-3 py-1.5 rounded-xl text-xs font-medium whitespace-nowrap transition-all border shrink-0 flex items-center space-x-1.5 shadow-sm",
                isDanger
                  ? "bg-rose-950/30 hover:bg-rose-900/50 border-rose-800/40 text-rose-300 hover:border-rose-600"
                  : isGql
                  ? "bg-purple-950/30 hover:bg-purple-900/50 border-purple-800/40 text-purple-300 hover:border-purple-600"
                  : "bg-[#141210] hover:bg-[#1c1917] border-[#292524] text-stone-300 hover:text-stone-100 hover:border-stone-600"
              )}
            >
              <span>{preset.title}</span>
              {isDanger && (
                <span className="text-[9px] font-mono px-1.5 py-0.2 rounded-full bg-rose-500/20 text-rose-400 uppercase font-bold">
                  MUTATION
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Main Textarea Input Container */}
      <div className="relative rounded-xl bg-[#141210] border border-[#292524] focus-within:border-[#3ecf8e] focus-within:ring-2 focus-within:ring-[#3ecf8e]/20 transition-all p-3 shadow-inner">
        <textarea
          rows={3}
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Ask SchemaAI in plain English... (e.g. 'Show active quizzes with problem difficulty count' or 'DELETE FROM users WHERE ...')"
          className="w-full bg-transparent text-stone-100 placeholder:text-stone-500 text-sm focus:outline-none resize-none font-sans leading-relaxed"
        />

        {/* Action Controls & Run Button */}
        <div className="flex flex-wrap items-center justify-between gap-2 pt-2.5 border-t border-[#292524]">
          <div className="flex items-center space-x-3 text-xs text-stone-400">
            <span className="flex items-center gap-1.5 text-[#3ecf8e]">
              <Sparkles className="w-3.5 h-3.5 text-[#3ecf8e]" />
              <span>Semantic Schema Resolution Active</span>
            </span>
            <span className="hidden sm:inline-block text-stone-700">•</span>
            <span className="hidden sm:flex items-center gap-1 text-[11px] font-mono text-stone-500">
              <kbd className="px-1.5 py-0.5 rounded-md bg-[#1c1917] border border-[#292524] text-stone-400 text-[10px]">
                Ctrl/Cmd + ↵
              </kbd>{" "}
              to run
            </span>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={handleSubmit}
              disabled={isLoading || !prompt.trim()}
              className="flex items-center space-x-2 px-5 py-2 rounded-xl bg-gradient-to-r from-[#3ecf8e] via-[#22c55e] to-emerald-500 hover:from-[#34d399] hover:to-[#16a34a] text-[#0a1a12] font-bold text-xs shadow-lg shadow-[#3ecf8e]/25 hover:shadow-[#3ecf8e]/40 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed group"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin text-[#0a1a12]" />
                  <span>Synthesizing AST...</span>
                </>
              ) : (
                <>
                  <Wand2 className="w-4 h-4 text-[#0a1a12] group-hover:rotate-12 transition-transform" />
                  <span>Generate & Run</span>
                  <CornerDownLeft className="w-3.5 h-3.5 text-[#0a1a12] opacity-80" />
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
