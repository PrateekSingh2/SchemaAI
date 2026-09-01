"use client";

import React, { useState } from "react";
import {
  Code2,
  Copy,
  Check,
  Zap,
  Cpu,
  Coins,
  ShieldCheck,
  Maximize2,
  Minimize2,
  Sparkles,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface SqlOutputProps {
  sql: string;
  graphql?: string;
  isGenerating?: boolean;
  queryFormat: "sql" | "graphql";
  setQueryFormat: (format: "sql" | "graphql") => void;
  executionTime?: number;
  tokens?: number;
  cost?: string;
  dialect?: string;
  isMaximized?: boolean;
  onToggleMaximize?: () => void;
}

export const SqlOutput: React.FC<SqlOutputProps> = ({
  sql,
  graphql,
  isGenerating = false,
  queryFormat,
  setQueryFormat,
  executionTime = 34,
  tokens = 285,
  cost = "$0.0011",
  dialect = "PostgreSQL 16",
  isMaximized = false,
  onToggleMaximize,
}) => {
  const [copied, setCopied] = useState(false);

  const displayContent = queryFormat === "graphql" && graphql ? graphql : sql;

  const handleCopy = () => {
    navigator.clipboard.writeText(displayContent);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const renderHighlightedCode = (text: string) => {
    const lines = text.split("\n");
    return lines.map((line, idx) => {
      const formatted = line
        .replace(
          /\b(SELECT|FROM|WHERE|JOIN|LEFT JOIN|RIGHT JOIN|INNER JOIN|GROUP BY|ORDER BY|LIMIT|HAVING|AND|OR|AS|ON|COUNT|SUM|AVG|ROUND|CASE|WHEN|THEN|ELSE|END|DISTINCT|INSERT|INTO|UPDATE|SET|DELETE|DROP|TABLE|CASCADE|RETURNING|NOW|INTERVAL|DESC|ASC)\b/g,
          '<span class="text-[#3ecf8e] font-semibold">$1</span>'
        )
        .replace(
          /\b(query|mutation|subscription|fragment)\b/g,
          '<span class="text-purple-400 font-semibold">$1</span>'
        )
        .replace(
          /('[\s\S]*?')/g,
          '<span class="text-amber-300 font-medium">$1</span>'
        )
        .replace(
          /(--.*$)/g,
          '<span class="text-stone-500 italic">$1</span>'
        );

      return (
        <div key={idx} className="flex leading-6 font-mono text-xs hover:bg-white/[0.02] px-2 rounded-lg min-w-0">
          <span className="code-line-number text-stone-600 select-none w-7 sm:w-8 text-right pr-3 sm:pr-4 shrink-0 font-mono">
            {idx + 1}
          </span>
          <span
            className="text-stone-200 flex-1 whitespace-pre font-mono"
            dangerouslySetInnerHTML={{ __html: formatted }}
          />
        </div>
      );
    });
  };

  return (
    <div className="flex flex-col h-full min-h-0 min-w-0 rounded-2xl bg-[#171412] border border-[#292524] shadow-2xl overflow-hidden supabase-panel">
      {/* Editor Header with robust responsive alignment */}
      <div className="flex items-center justify-between gap-2 px-3 sm:px-4 py-2.5 bg-[#141210]/90 border-b border-[#292524] backdrop-blur-xl shrink-0 min-w-0">
        <div className="flex items-center space-x-2 sm:space-x-3 min-w-0">
          {/* Window dots */}
          <div className="hidden sm:flex items-center space-x-1.5 pr-2 border-r border-[#292524] shrink-0">
            <span className="w-2.5 h-2.5 rounded-full bg-rose-500/80" />
            <span className="w-2.5 h-2.5 rounded-full bg-amber-500/80" />
            <span className="w-2.5 h-2.5 rounded-full bg-[#3ecf8e]/80" />
          </div>

          <div className="flex items-center space-x-1.5 px-2 py-1 rounded-xl bg-[#3ecf8e]/10 border border-[#3ecf8e]/20 text-[#3ecf8e] text-xs font-semibold shrink-0">
            <Code2 className="w-3.5 h-3.5 shrink-0" />
            <span className="hidden md:inline">Generated Code</span>
            <span className="md:hidden">Code</span>
          </div>

          {/* Dialect Switcher Segmented Control */}
          <div className="flex items-center p-0.5 rounded-xl bg-[#1c1917] border border-[#292524] text-xs font-medium shadow-inner shrink-0">
            <button
              onClick={() => setQueryFormat("sql")}
              className={cn(
                "px-2 py-0.5 sm:px-2.5 sm:py-1 rounded-lg transition-all text-xs font-medium",
                queryFormat === "sql"
                  ? "bg-[#141210] text-[#3ecf8e] font-semibold border border-[#3ecf8e]/30 shadow-sm"
                  : "text-stone-400 hover:text-stone-200"
              )}
            >
              SQL
            </button>
            <button
              onClick={() => setQueryFormat("graphql")}
              className={cn(
                "px-2 py-0.5 sm:px-2.5 sm:py-1 rounded-lg transition-all text-xs font-medium",
                queryFormat === "graphql"
                  ? "bg-[#141210] text-purple-300 font-semibold border border-purple-500/30 shadow-sm"
                  : "text-stone-400 hover:text-stone-200"
              )}
            >
              GraphQL
            </button>
          </div>
        </div>

        {/* Action Buttons: Copy, Maximize & Dialect */}
        <div className="flex items-center space-x-1.5 sm:space-x-2 shrink-0">
          <span className="hidden xl:inline-block font-mono text-[11px] text-stone-400 bg-[#141210] px-2 py-0.5 rounded-xl border border-[#292524] shrink-0">
            {queryFormat === "sql" ? dialect : "GraphQL v16"}
          </span>

          <button
            onClick={handleCopy}
            className={cn(
              "flex items-center space-x-1 sm:space-x-1.5 px-2 sm:px-3 py-1 rounded-xl text-xs font-medium border transition-all duration-200 shadow-sm shrink-0",
              copied
                ? "bg-[#3ecf8e]/15 border-[#3ecf8e]/40 text-[#3ecf8e]"
                : "bg-[#1c1917] border-[#292524] text-stone-300 hover:text-stone-100 hover:bg-[#201d1a]"
            )}
            title="Copy query to clipboard"
          >
            {copied ? (
              <>
                <Check className="w-3.5 h-3.5 text-[#3ecf8e] shrink-0" />
                <span className="hidden sm:inline">Copied</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5 text-stone-400 shrink-0" />
                <span className="hidden sm:inline">Copy</span>
              </>
            )}
          </button>

          {onToggleMaximize && (
            <button
              onClick={onToggleMaximize}
              className={cn(
                "p-1 sm:p-1.5 rounded-xl border transition-all duration-200 shadow-sm shrink-0",
                isMaximized
                  ? "bg-[#3ecf8e]/20 border-[#3ecf8e]/50 text-[#3ecf8e]"
                  : "bg-[#1c1917] border-[#292524] text-stone-400 hover:text-stone-100 hover:bg-[#201d1a]"
              )}
              title={isMaximized ? "Restore view (minimize)" : "Maximize SQL Editor"}
            >
              {isMaximized ? (
                <Minimize2 className="w-3.5 h-3.5" />
              ) : (
                <Maximize2 className="w-3.5 h-3.5" />
              )}
            </button>
          )}
        </div>
      </div>

      {/* Code Area with dedicated isolated scrolling */}
      <div className="flex-1 min-h-0 min-w-0 p-3 sm:p-3.5 overflow-y-auto overflow-x-auto bg-[#121110] relative font-mono select-text">
        {isGenerating ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center space-y-3 bg-black/65 backdrop-blur-md z-10">
            <div className="relative flex items-center justify-center">
              <div className="w-8 h-8 sm:w-10 sm:h-10 border-2 border-[#3ecf8e]/20 border-t-[#3ecf8e] rounded-full animate-spin" />
              <Sparkles className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-[#3ecf8e] absolute" />
            </div>
            <p className="text-xs font-mono text-[#3ecf8e] animate-pulse px-2 text-center">
              Synthesizing relational AST & optimizing joins...
            </p>
          </div>
        ) : null}

        <div className="py-1 min-w-0">{renderHighlightedCode(displayContent)}</div>
      </div>

      {/* Telemetry Footer */}
      <div className="px-3 sm:px-4 py-2 bg-[#141210]/90 border-t border-[#292524] flex items-center justify-between text-[10px] sm:text-[11px] text-stone-400 shrink-0 overflow-hidden min-w-0">
        <div className="flex items-center space-x-2 sm:space-x-4 min-w-0 truncate">
          <span className="flex items-center space-x-1 text-stone-300 font-mono shrink-0">
            <Zap className="w-3 h-3 text-amber-400 shrink-0" />
            <span>{executionTime}ms</span>
          </span>
          <span className="flex items-center space-x-1 text-stone-300 font-mono shrink-0">
            <Cpu className="w-3 h-3 text-[#3ecf8e] shrink-0" />
            <span>{tokens} tok</span>
          </span>
          <span className="hidden sm:flex items-center space-x-1 text-stone-300 font-mono shrink-0">
            <Coins className="w-3 h-3 text-[#3ecf8e] shrink-0" />
            <span>{cost}</span>
          </span>
        </div>

        <div className="flex items-center space-x-1.5 text-[10px] text-stone-500 font-mono shrink-0">
          <ShieldCheck className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-[#3ecf8e] shrink-0 inline" />
          <span className="text-[#3ecf8e] hidden md:inline">AST Safe</span>
        </div>
      </div>
    </div>
  );
};
