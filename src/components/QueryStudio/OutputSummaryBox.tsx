"use client";

import React, { useState } from "react";
import {
  FileSpreadsheet,
  CheckCircle2,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  Play,
  Table2,
  Copy,
  ThumbsUp,
  ThumbsDown,
  Check,
  AlertCircle,
} from "lucide-react";
import { RecordsTable } from "./RecordsTable";
import { cn } from "@/lib/utils";

interface OutputSummaryBoxProps {
  hasRun: boolean;
  onOpenModal: () => void;
  onRunQuery: () => void;
  records: Array<Record<string, unknown>>;
  columns: string[];
  executionTime?: number;
  maskedColumns?: string[];
  activeChart?: { type: string; key: string } | null;
}

export const OutputSummaryBox: React.FC<OutputSummaryBoxProps> = ({
  hasRun,
  onOpenModal,
  onRunQuery,
  records,
  columns,
  executionTime = 0,
  maskedColumns = [],
  activeChart = null,
}) => {
  const [isInlineExpanded, setIsInlineExpanded] = useState(true);
  const [copied, setCopied] = useState(false);

  const isExecutionError = records.length > 0 && Boolean(records[0]?.error);
  const errorMessage = isExecutionError ? String(records[0].error) : "";

  const handleCopySummary = () => {
    if (records.length === 0 || isExecutionError) return;
    navigator.clipboard.writeText(JSON.stringify(records, null, 2));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (isExecutionError) {
    return (
      <div className="w-full rounded-2xl bg-rose-950/25 border border-rose-500/30 p-4 space-y-3 shadow-md select-none animate-in fade-in duration-200">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="flex items-start space-x-3 max-w-xl">
            <div className="p-2 rounded-xl bg-rose-500/15 text-rose-400 mt-0.5 shrink-0">
              <AlertCircle className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-rose-200">
                Database Execution Issue
              </h3>
              <p className="text-xs sm:text-sm text-rose-300/90 mt-1 font-mono leading-relaxed break-words">
                {errorMessage}
              </p>
            </div>
          </div>

          <button
            onClick={onRunQuery}
            className="flex items-center space-x-1.5 px-3.5 py-2 rounded-xl bg-rose-500/20 hover:bg-rose-500/30 border border-rose-500/40 text-rose-200 text-xs font-semibold cursor-pointer shrink-0 transition-all ml-auto"
          >
            <Play className="w-3.5 h-3.5 fill-current text-rose-300" />
            <span>Retry Query</span>
          </button>
        </div>
      </div>
    );
  }

  if (!hasRun) {
    return (
      <div className="w-full rounded-2xl bg-[#16161a] border border-[#222226] p-4 flex flex-wrap items-center justify-between gap-3 shadow-md select-none">
        <div className="flex items-center space-x-3">
          <div className="p-2 rounded-xl bg-[#202026] text-[#38bdf8]">
            <FileSpreadsheet className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-zinc-200">
              Query Ready for Execution
            </h3>
            <p className="text-xs sm:text-sm text-zinc-400">
              Click <strong>Run Query</strong> above or review to execute against database.
            </p>
          </div>
        </div>

        <button
          onClick={onRunQuery}
          className="flex items-center space-x-2 px-3.5 py-2 rounded-xl bg-[#202026] hover:bg-[#282832] border border-[#2c2c36] text-zinc-200 hover:text-white text-sm font-medium transition-all cursor-pointer"
        >
          <Play className="w-4 h-4 fill-current text-[#38bdf8]" />
          <span>Execute & Review Output</span>
        </button>
      </div>
    );
  }

  // Card Style (Matching Screenshot Walkthrough/File Card)
  return (
    <div className="w-full rounded-2xl bg-[#16161a] border border-[#222226] shadow-md overflow-hidden transition-all select-none">
      <div className="p-4 space-y-3">
        {/* Card Header: Icon + Title */}
        <div className="flex items-center space-x-2.5 text-sm font-semibold text-[#f4f4f5]">
          <FileSpreadsheet className="w-5 h-5 text-[#38bdf8]" />
          <span>Query Output & Relational Results</span>
        </div>

        {/* Card Description */}
        <p className="text-sm text-zinc-400 leading-relaxed">
          Executed in {executionTime}ms. Streamed {records.length} records across {columns.length} columns from database engine.
        </p>

        {/* Bottom Row: Metadata Pill + Action Buttons (Matching Screenshot) */}
        <div className="flex flex-wrap items-center justify-between gap-2.5 pt-2 border-t border-[#1f1f24] text-sm">
          <div
            onClick={onOpenModal}
            className="flex items-center space-x-2 text-zinc-400 hover:text-zinc-200 cursor-pointer font-mono text-xs"
          >
            <span>{records.length} rows fetched</span>
            <span className="text-[#38bdf8]">+{columns.length} cols</span>
            <span className="text-zinc-600">&gt;</span>
          </div>

          <div className="flex items-center space-x-2.5">
            {/* Review Button Pill (Matching Screenshot Review Button) */}
            <button
              onClick={onOpenModal}
              className="flex items-center space-x-2 px-3.5 py-1.5 rounded-xl bg-[#202026] hover:bg-[#282832] border border-[#2a2a34] text-zinc-200 hover:text-white text-sm font-medium transition-all cursor-pointer shadow-sm"
              title="Open full results in popup modal"
            >
              <ExternalLink className="w-4 h-4 text-zinc-400" />
              <span>Review Output</span>
            </button>

            {/* Inline Preview Toggle */}
            <button
              onClick={() => setIsInlineExpanded(!isInlineExpanded)}
              className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-[#1a1a1f] hover:bg-[#222228] border border-[#222228] text-zinc-400 hover:text-zinc-200 text-sm transition-colors cursor-pointer"
              title="Toggle inline preview"
            >
              <Table2 className="w-4 h-4 text-zinc-400" />
              {isInlineExpanded ? (
                <ChevronUp className="w-4 h-4" />
              ) : (
                <ChevronDown className="w-4 h-4" />
              )}
            </button>

            {/* Utility icons */}
            <div className="flex items-center space-x-1 text-zinc-500 pl-2 border-l border-[#222226]">
              <button
                onClick={handleCopySummary}
                className="p-1.5 hover:text-zinc-300 transition-colors"
                title="Copy JSON"
              >
                {copied ? <Check className="w-4 h-4 text-[#38bdf8]" /> : <Copy className="w-4 h-4" />}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Inline Expanded Table View */}
      {isInlineExpanded && (
        <div className="h-[280px] w-full overflow-hidden border-t border-[#222226] animate-in fade-in duration-150">
          {activeChart ? (
            <div className="w-full h-full flex flex-col items-center justify-center bg-[#0c0c0f] text-zinc-400">
              <div className="w-16 h-16 mb-4 opacity-50 bg-gradient-to-t from-emerald-500/20 to-emerald-500 flex items-end justify-between p-2 rounded">
                 <div className="w-2 h-6 bg-emerald-400 rounded-t-sm"></div>
                 <div className="w-2 h-10 bg-emerald-400 rounded-t-sm"></div>
                 <div className="w-2 h-4 bg-emerald-400 rounded-t-sm"></div>
              </div>
              <p className="font-semibold text-zinc-300">Placeholder for {activeChart.type} Chart</p>
              <p className="text-xs">Visualizing: {activeChart.key}</p>
            </div>
          ) : (
            <RecordsTable
              columns={columns}
              records={records}
              hasRun={true}
              maskedColumns={maskedColumns}
            />
          )}
        </div>
      )}
    </div>
  );
};
