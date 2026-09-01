"use client";

import React, { useState } from "react";
import {
  Sparkles,
  CornerDownLeft,
  Loader2,
  Wand2,
  Lightbulb,
  Maximize2,
  Minimize2,
} from "lucide-react";
import { samplePresets, QueryPreset } from "@/lib/mockData";
import { cn } from "@/lib/utils";

interface PromptInputProps {
  onGenerateAndRun: (promptText: string) => void;
  isLoading?: boolean;
  isMaximized?: boolean;
  onToggleMaximize?: () => void;
}

export const PromptInput: React.FC<PromptInputProps> = ({
  onGenerateAndRun,
  isLoading = false,
  isMaximized = false,
  onToggleMaximize,
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
    <div className="w-full h-full min-h-0 min-w-0 bg-[#171412]/95 backdrop-blur-2xl border border-[#292524] rounded-2xl p-2.5 sm:p-3 shadow-2xl flex flex-col justify-between overflow-hidden supabase-panel space-y-1.5 sm:space-y-2">
      {/* Preset Suggestions Bar & Maximize Trigger */}
      <div className="flex items-center justify-between gap-1.5 shrink-0 min-w-0">
        <div className="flex items-center space-x-1.5 overflow-x-auto pb-0.5 scrollbar-none flex-1 min-w-0">
          <span className="text-[10px] font-semibold uppercase tracking-wider text-[#3ecf8e] shrink-0 flex items-center gap-1 pl-0.5">
            <Lightbulb className="w-3 h-3 text-amber-400 shrink-0" />
            <span className="hidden sm:inline">Presets:</span>
          </span>

          {samplePresets.map((preset) => {
            const isDanger = preset.isMutation;
            const isGql = preset.category === "GraphQL";

            return (
              <button
                key={preset.id}
                onClick={() => selectPreset(preset)}
                className={cn(
                  "px-2 py-0.5 sm:px-2.5 sm:py-1 rounded-xl text-[10px] sm:text-[11px] font-medium whitespace-nowrap transition-all border shrink-0 flex items-center space-x-1 shadow-sm",
                  isDanger
                    ? "bg-rose-950/30 hover:bg-rose-900/50 border-rose-800/40 text-rose-300 hover:border-rose-600"
                    : isGql
                    ? "bg-purple-950/30 hover:bg-purple-900/50 border-purple-800/40 text-purple-300 hover:border-purple-600"
                    : "bg-[#141210] hover:bg-[#1c1917] border-[#292524] text-stone-300 hover:text-stone-100 hover:border-stone-600"
                )}
              >
                <span>{preset.title}</span>
                {isDanger && (
                  <span className="text-[8px] font-mono px-1 py-0.2 rounded-full bg-rose-500/20 text-rose-400 uppercase font-bold">
                    MUTATION
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {onToggleMaximize && (
          <button
            onClick={onToggleMaximize}
            className={cn(
              "p-1 rounded-xl border transition-all duration-200 shadow-sm shrink-0",
              isMaximized
                ? "bg-[#3ecf8e]/20 border-[#3ecf8e]/50 text-[#3ecf8e]"
                : "bg-[#141210] border-[#292524] text-stone-400 hover:text-stone-100 hover:bg-[#1c1917]"
            )}
            title={isMaximized ? "Restore view (minimize)" : "Maximize Prompt Box"}
          >
            {isMaximized ? (
              <Minimize2 className="w-3 h-3" />
            ) : (
              <Maximize2 className="w-3 h-3" />
            )}
          </button>
        )}
      </div>

      {/* Main Textarea Input Container */}
      <div className="flex-1 min-h-[50px] min-w-0 flex flex-col justify-between rounded-xl bg-[#141210] border border-[#292524] focus-within:border-[#3ecf8e] focus-within:ring-1 focus-within:ring-[#3ecf8e]/20 transition-all p-2 sm:p-2.5 shadow-inner overflow-hidden">
        <textarea
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Ask SchemaAI in plain English... (e.g. 'Show active quizzes with problem difficulty count')"
          className="w-full flex-1 min-h-0 bg-transparent text-stone-100 placeholder:text-stone-500 text-xs sm:text-sm focus:outline-none resize-none font-sans leading-relaxed overflow-y-auto"
        />

        {/* Action Controls & Run Button */}
        <div className="flex items-center justify-between gap-2 pt-1.5 border-t border-[#292524]/60 shrink-0 min-w-0">
          <div className="flex items-center space-x-2 text-[10px] sm:text-[11px] text-stone-400 min-w-0 truncate">
            <span className="flex items-center gap-1 text-[#3ecf8e] shrink-0">
              <Sparkles className="w-3 h-3 text-[#3ecf8e] shrink-0" />
              <span className="hidden md:inline">NL to SQL AST</span>
            </span>
            <span className="hidden md:inline text-stone-700">•</span>
            <span className="hidden sm:flex items-center gap-1 text-[10px] font-mono text-stone-500 shrink-0">
              <kbd className="px-1 py-0.2 rounded bg-[#1c1917] border border-[#292524] text-stone-400">
                ⌘↵
              </kbd>{" "}
              Run
            </span>
          </div>

          <button
            onClick={handleSubmit}
            disabled={isLoading || !prompt.trim()}
            className="flex items-center space-x-1.5 px-3 py-1 sm:px-4 sm:py-1.5 rounded-xl bg-gradient-to-r from-[#3ecf8e] via-[#22c55e] to-emerald-500 hover:from-[#34d399] hover:to-[#16a34a] text-[#0a1a12] font-bold text-xs shadow-md shadow-[#3ecf8e]/20 hover:shadow-[#3ecf8e]/35 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed group shrink-0"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin text-[#0a1a12] shrink-0" />
                <span className="hidden sm:inline">Synthesizing...</span>
              </>
            ) : (
              <>
                <Wand2 className="w-3.5 h-3.5 text-[#0a1a12] group-hover:rotate-12 transition-transform shrink-0" />
                <span>Generate & Run</span>
                <CornerDownLeft className="w-3 h-3 text-[#0a1a12] opacity-80 shrink-0 hidden sm:inline" />
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
