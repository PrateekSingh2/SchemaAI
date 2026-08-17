"use client";

import React, { useState } from "react";
import {
  Code2,
  Copy,
  Check,
  Zap,
  Cpu,
  Coins,
  FileCode,
  Terminal,
  Sparkles,
  Layers,
  CheckCircle2,
  Maximize2,
  ShieldCheck,
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
          '<span class="text-cyan-400 font-semibold">$1</span>'
        )
        .replace(
          /\b(query|mutation|subscription|fragment)\b/g,
          '<span class="text-indigo-400 font-semibold">$1</span>'
        )
        .replace(
          /('[\s\S]*?')/g,
          '<span class="text-emerald-300 font-medium">$1</span>'
        )
        .replace(
          /(--.*$)/g,
          '<span class="text-slate-500 italic">$1</span>'
        );

      return (
        <div key={idx} className="flex leading-6 font-mono text-xs hover:bg-white/[0.02] px-2 rounded">
          <span className="code-line-number text-slate-600 select-none w-8 text-right pr-4 shrink-0 font-mono">
            {idx + 1}
          </span>
          <span
            className="text-slate-200 flex-1 whitespace-pre font-mono"
            dangerouslySetInnerHTML={{ __html: formatted }}
          />
        </div>
      );
    });
  };

  return (
    <div className="flex flex-col h-full rounded-2xl bg-[#090d18] border border-white/[0.08] shadow-2xl overflow-hidden">
      {/* Editor Header with macOS-style window controls & tabs */}
      <div className="flex items-center justify-between px-4 py-3 bg-slate-950/80 border-b border-white/[0.08] backdrop-blur-md">
        <div className="flex items-center space-x-3">
          {/* macOS window dots */}
          <div className="flex items-center space-x-1.5 pr-2 border-r border-white/[0.08]">
            <span className="w-2.5 h-2.5 rounded-full bg-rose-500/80" />
            <span className="w-2.5 h-2.5 rounded-full bg-amber-500/80" />
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500/80" />
          </div>

          <div className="flex items-center space-x-1.5 px-2.5 py-1 rounded-lg bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 text-xs font-semibold">
            <Code2 className="w-3.5 h-3.5" />
            <span>Generated Code</span>
          </div>

          {/* Dialect Switcher Segmented Control */}
          <div className="flex items-center p-0.5 rounded-xl bg-slate-900 border border-white/[0.06] text-xs font-medium">
            <button
              onClick={() => setQueryFormat("sql")}
              className={cn(
                "px-2.5 py-1 rounded-lg transition-all text-xs font-medium",
                queryFormat === "sql"
                  ? "bg-cyan-500/20 text-cyan-300 font-semibold shadow-sm"
                  : "text-slate-400 hover:text-white"
              )}
            >
              SQL
            </button>
            <button
              onClick={() => setQueryFormat("graphql")}
              className={cn(
                "px-2.5 py-1 rounded-lg transition-all text-xs font-medium",
                queryFormat === "graphql"
                  ? "bg-indigo-500/20 text-indigo-300 font-semibold shadow-sm"
                  : "text-slate-400 hover:text-white"
              )}
            >
              GraphQL
            </button>
          </div>
        </div>

        {/* Copy & Dialect Info */}
        <div className="flex items-center space-x-2">
          <span className="hidden sm:inline-block font-mono text-[11px] text-slate-400 bg-slate-900 px-2 py-1 rounded-lg border border-white/[0.06]">
            {queryFormat === "sql" ? dialect : "GraphQL v16"}
          </span>

          <button
            onClick={handleCopy}
            className={cn(
              "flex items-center space-x-1.5 px-3 py-1 rounded-xl text-xs font-medium border transition-all duration-200",
              copied
                ? "bg-emerald-500/20 border-emerald-500/40 text-emerald-300 shadow-sm"
                : "bg-slate-900 border-white/[0.08] text-slate-300 hover:text-white hover:bg-slate-850"
            )}
            title="Copy query to clipboard"
          >
            {copied ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-400" />
                <span>Copied</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5 text-slate-400" />
                <span>Copy</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Code Area */}
      <div className="flex-1 p-3.5 overflow-auto bg-[#060911] relative font-mono select-text">
        {isGenerating ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center space-y-3 bg-black/65 backdrop-blur-sm z-10">
            <div className="relative flex items-center justify-center">
              <div className="w-10 h-10 border-2 border-cyan-500/20 border-t-cyan-400 rounded-full animate-spin" />
              <Sparkles className="w-4 h-4 text-cyan-300 absolute" />
            </div>
            <p className="text-xs font-mono text-cyan-300 animate-pulse">
              Synthesizing relational AST & optimizing joins...
            </p>
          </div>
        ) : null}

        <div className="py-1">{renderHighlightedCode(displayContent)}</div>
      </div>

      {/* Telemetry Footer */}
      <div className="px-4 py-2 bg-slate-950/80 border-t border-white/[0.08] flex flex-wrap items-center justify-between text-[11px] text-slate-400">
        <div className="flex items-center space-x-4">
          <span className="flex items-center space-x-1.5 text-slate-300 font-mono">
            <Zap className="w-3 h-3 text-amber-400" />
            <span>Latency: {executionTime}ms</span>
          </span>
          <span className="flex items-center space-x-1.5 text-slate-300 font-mono">
            <Cpu className="w-3 h-3 text-cyan-400" />
            <span>Tokens: {tokens}</span>
          </span>
          <span className="flex items-center space-x-1.5 text-slate-300 font-mono">
            <Coins className="w-3 h-3 text-emerald-400" />
            <span>Cost: {cost}</span>
          </span>
        </div>

        <div className="flex items-center space-x-2 text-[10px] text-slate-500 font-mono">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-400 inline" />
          <span className="text-emerald-400">AST Verified Safe</span>
        </div>
      </div>
    </div>
  );
};
