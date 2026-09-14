"use client";

import React, { useState, useEffect } from "react";
import {
  Code2,
  Copy,
  Check,
  Play,
  Edit3,
  X,
  Zap,
  Cpu,
  Coins,
  ShieldCheck,
  Maximize2,
  Minimize2,
  Sparkles,
  Loader2,
  FileSpreadsheet,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface SqlOutputProps {
  sql: string;
  graphql?: string;
  onUpdateSql?: (updatedSql: string) => void;
  onRunQuery?: (queryText: string) => void;
  isGenerating?: boolean;
  isExecuting?: boolean;
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
  onUpdateSql,
  onRunQuery,
  isGenerating = false,
  isExecuting = false,
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
  const [isEditing, setIsEditing] = useState(false);
  const [editedContent, setEditedContent] = useState("");

  const activeContent = queryFormat === "graphql" && graphql ? graphql : sql;

  // Sync edited content when active query changes
  useEffect(() => {
    setEditedContent(activeContent);
  }, [activeContent]);

  const handleCopy = () => {
    navigator.clipboard.writeText(isEditing ? editedContent : activeContent);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleStartEdit = () => {
    setEditedContent(activeContent);
    setIsEditing(true);
  };

  const handleCancelEdit = () => {
    setEditedContent(activeContent);
    setIsEditing(false);
  };

  const handleSaveEdit = () => {
    if (onUpdateSql) {
      onUpdateSql(editedContent);
    }
    setIsEditing(false);
  };

  const handleSaveAndRun = () => {
    if (onUpdateSql) {
      onUpdateSql(editedContent);
    }
    setIsEditing(false);
    if (onRunQuery) {
      onRunQuery(editedContent);
    }
  };

  const handleRunClick = () => {
    if (onRunQuery) {
      onRunQuery(isEditing ? editedContent : activeContent);
    }
  };

  const renderHighlightedCode = (text: string) => {
    const lines = text.split("\n");
    return lines.map((line, idx) => {
      const formatted = line
        .replace(
          /\b(SELECT|FROM|WHERE|JOIN|LEFT JOIN|RIGHT JOIN|INNER JOIN|GROUP BY|ORDER BY|LIMIT|HAVING|AND|OR|AS|ON|COUNT|SUM|AVG|ROUND|CASE|WHEN|THEN|ELSE|END|DISTINCT|INSERT|INTO|UPDATE|SET|DELETE|DROP|TABLE|CASCADE|RETURNING|NOW|INTERVAL|DESC|ASC)\b/g,
          '<span class="text-[#38bdf8] font-semibold">$1</span>'
        )
        .replace(
          /\b(query|mutation|subscription|fragment)\b/g,
          '<span class="text-purple-400 font-semibold">$1</span>'
        )
        .replace(
          /('[\s\S]*?')/g,
          '<span class="text-amber-300 font-normal">$1</span>'
        )
        .replace(
          /(--.*$)/g,
          '<span class="text-zinc-500 italic">$1</span>'
        );

      return (
        <div key={idx} className="flex leading-6 font-mono text-xs sm:text-sm hover:bg-white/[0.02] px-2 rounded-lg min-w-0">
          <span className="code-line-number text-zinc-600 select-none w-7 sm:w-8 text-right pr-3 sm:pr-4 shrink-0 font-mono text-xs">
            {idx + 1}
          </span>
          <span
            className="text-zinc-100 flex-1 whitespace-pre font-mono"
            dangerouslySetInnerHTML={{ __html: formatted }}
          />
        </div>
      );
    });
  };

  return (
    <div className="flex flex-col h-full min-h-[220px] rounded-2xl bg-[#16161a] border border-[#222226] shadow-2xl overflow-hidden select-none">
      {/* Editor Header Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-2 px-4 py-3 bg-[#121215] border-b border-[#222226] backdrop-blur-xl shrink-0">
        <div className="flex items-center space-x-2.5 sm:space-x-3.5 min-w-0">
          {/* Terminal Window Dots */}
          <div className="hidden sm:flex items-center space-x-1.5 pr-2.5 border-r border-[#222226] shrink-0">
            <span className="w-2.5 h-2.5 rounded-full bg-rose-500/80" />
            <span className="w-2.5 h-2.5 rounded-full bg-amber-500/80" />
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500/80" />
          </div>

          <div className="flex items-center space-x-2 px-3 py-1.5 rounded-xl bg-[#38bdf8]/10 border border-[#38bdf8]/25 text-[#38bdf8] text-sm font-medium shrink-0">
            <Code2 className="w-4 h-4 shrink-0" />
            <span className="font-mono">Generated Query</span>
          </div>

          {/* Dialect Switcher Segmented Control */}
          <div className="flex items-center p-0.5 rounded-xl bg-[#1b1b20] border border-[#26262b] text-xs font-medium shadow-inner shrink-0">
            <button
              onClick={() => setQueryFormat("sql")}
              className={cn(
                "px-3 py-1 rounded-lg transition-all text-xs font-medium cursor-pointer",
                queryFormat === "sql"
                  ? "bg-[#121215] text-[#38bdf8] font-semibold border border-[#38bdf8]/30 shadow-sm"
                  : "text-zinc-400 hover:text-white"
              )}
            >
              SQL
            </button>
            <button
              onClick={() => setQueryFormat("graphql")}
              className={cn(
                "px-3 py-1 rounded-lg transition-all text-xs font-medium cursor-pointer",
                queryFormat === "graphql"
                  ? "bg-[#121215] text-purple-300 font-semibold border border-purple-500/30 shadow-sm"
                  : "text-zinc-400 hover:text-white"
              )}
            >
              GraphQL
            </button>
          </div>
        </div>

        {/* Action Buttons: Run Query, Copy, Edit */}
        <div className="flex items-center space-x-2 shrink-0">
          {isEditing ? (
            /* Editing Controls */
            <div className="flex items-center space-x-2">
              <button
                onClick={handleCancelEdit}
                className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl text-sm font-medium border border-[#26262b] bg-[#1b1b20] text-zinc-400 hover:text-white transition-all cursor-pointer"
                title="Cancel changes"
              >
                <X className="w-4 h-4" />
                <span className="hidden sm:inline">Cancel</span>
              </button>

              <button
                onClick={handleSaveEdit}
                className="flex items-center space-x-1.5 px-3.5 py-1.5 rounded-xl text-sm font-medium border border-[#38bdf8]/30 bg-[#38bdf8]/15 text-[#38bdf8] hover:bg-[#38bdf8]/25 transition-all cursor-pointer"
                title="Save SQL edits"
              >
                <Check className="w-4 h-4" />
                <span>Save</span>
              </button>

              <button
                onClick={handleSaveAndRun}
                disabled={isExecuting}
                className="flex items-center space-x-2 px-4 py-1.5 rounded-xl text-sm font-bold bg-[#38bdf8] hover:bg-[#0284c7] text-black shadow-md shadow-[#38bdf8]/20 transition-all cursor-pointer disabled:opacity-50"
              >
                {isExecuting ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Play className="w-4 h-4 fill-current" />
                )}
                <span>Save & Run</span>
              </button>
            </div>
          ) : (
            /* Default Code Controls */
            <>
              {/* EDIT BUTTON */}
              <button
                onClick={handleStartEdit}
                className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl text-sm font-medium border border-[#26262b] bg-[#1b1b20] text-zinc-300 hover:text-white hover:bg-[#25252e] transition-all shadow-sm cursor-pointer"
                title="Edit query code"
              >
                <Edit3 className="w-4 h-4 text-zinc-400" />
                <span>Edit</span>
              </button>

              {/* COPY BUTTON */}
              <button
                onClick={handleCopy}
                className={cn(
                  "flex items-center space-x-1.5 px-3 py-1.5 rounded-xl text-sm font-medium border transition-all shadow-sm cursor-pointer",
                  copied
                    ? "bg-[#38bdf8]/15 border-[#38bdf8]/40 text-[#38bdf8]"
                    : "bg-[#1b1b20] border-[#26262b] text-zinc-300 hover:text-white hover:bg-[#25252e]"
                )}
                title="Copy query to clipboard"
              >
                {copied ? (
                  <>
                    <Check className="w-4 h-4 text-[#38bdf8] shrink-0" />
                    <span>Copied</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4 text-zinc-400 shrink-0" />
                    <span>Copy</span>
                  </>
                )}
              </button>

              {/* RUN QUERY BUTTON */}
              {onRunQuery && (
                <button
                  onClick={handleRunClick}
                  disabled={isExecuting || isGenerating}
                  className="flex items-center space-x-2 px-4 py-1.5 rounded-xl text-sm font-semibold bg-[#38bdf8] hover:bg-[#0284c7] text-black shadow-md shadow-[#38bdf8]/25 transition-all duration-150 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                  title="Run query to fetch database records & view output"
                >
                  {isExecuting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin text-black shrink-0" />
                      <span>Fetching...</span>
                    </>
                  ) : (
                    <>
                      <Play className="w-4 h-4 fill-current text-black shrink-0" />
                      <span>Run Query</span>
                    </>
                  )}
                </button>
              )}

              {onToggleMaximize && (
                <button
                  onClick={onToggleMaximize}
                  className={cn(
                    "p-1.5 rounded-xl border transition-all shadow-sm shrink-0 cursor-pointer",
                    isMaximized
                      ? "bg-[#38bdf8]/20 border-[#38bdf8]/50 text-[#38bdf8]"
                      : "bg-[#1b1b20] border-[#26262b] text-zinc-400 hover:text-white hover:bg-[#25252e]"
                  )}
                  title={isMaximized ? "Restore view" : "Maximize Code View"}
                >
                  {isMaximized ? (
                    <Minimize2 className="w-4 h-4" />
                  ) : (
                    <Maximize2 className="w-4 h-4" />
                  )}
                </button>
              )}
            </>
          )}
        </div>
      </div>

      {/* Code Area */}
      <div className="p-4 sm:p-5 overflow-x-auto bg-[#0e0e11] relative font-mono select-text">
        {isGenerating ? (
          <div className="py-8 flex flex-col items-center justify-center space-y-3 bg-black/50 backdrop-blur-md z-10 rounded-xl">
            <div className="relative flex items-center justify-center">
              <div className="w-8 h-8 border-2 border-[#38bdf8]/20 border-t-[#38bdf8] rounded-full animate-spin" />
              <Sparkles className="w-4 h-4 text-[#38bdf8] absolute" />
            </div>
            <p className="text-sm font-mono text-[#38bdf8] animate-pulse px-2 text-center">
              Synthesizing relational AST & optimizing joins...
            </p>
          </div>
        ) : null}

        {isEditing ? (
          <div className="w-full flex flex-col">
            <div className="text-xs text-[#38bdf8] font-mono mb-2.5 flex items-center gap-2">
              <Edit3 className="w-4 h-4" />
              <span>Direct SQL Editor Mode (Modify query and click Save & Run)</span>
            </div>
            <textarea
              value={editedContent}
              onChange={(e) => setEditedContent(e.target.value)}
              rows={Math.max(6, editedContent.split("\n").length + 2)}
              className="w-full bg-[#1b1b20] border border-[#38bdf8]/40 rounded-xl p-3.5 text-zinc-100 font-mono text-sm focus:outline-none focus:ring-2 focus:ring-[#38bdf8]/20 resize-y leading-relaxed"
              spellCheck={false}
            />
          </div>
        ) : (
          <div className="py-1 min-w-0">{renderHighlightedCode(activeContent)}</div>
        )}
      </div>

      {/* Telemetry Footer */}
      <div className="px-4 py-2.5 bg-[#121215] border-t border-[#222226] flex items-center justify-between text-xs sm:text-sm text-zinc-400 shrink-0">
        <div className="flex items-center space-x-3 sm:space-x-5 min-w-0 truncate">
          <span className="flex items-center space-x-1.5 text-zinc-300 font-mono shrink-0">
            <Zap className="w-3.5 h-3.5 text-amber-400 shrink-0" />
            <span>{executionTime}ms</span>
          </span>
          <span className="flex items-center space-x-1.5 text-zinc-300 font-mono shrink-0">
            <Cpu className="w-3.5 h-3.5 text-[#38bdf8] shrink-0" />
            <span>{tokens} tokens</span>
          </span>
          <span className="hidden sm:flex items-center space-x-1.5 text-zinc-300 font-mono shrink-0">
            <Coins className="w-3.5 h-3.5 text-amber-400 shrink-0" />
            <span>{cost}</span>
          </span>
          <span className="hidden md:inline font-mono text-zinc-400 bg-[#1b1b20] px-2.5 py-1 rounded-lg border border-[#26262b] text-xs">
            {queryFormat === "sql" ? dialect : "GraphQL v16"}
          </span>
        </div>

        <div className="flex items-center space-x-2 text-xs text-zinc-400 font-mono shrink-0">
          <ShieldCheck className="w-4 h-4 text-[#38bdf8] shrink-0 inline" />
          <span className="text-[#38bdf8] font-medium hidden sm:inline">AST Verified Safe</span>
        </div>
      </div>
    </div>
  );
};
