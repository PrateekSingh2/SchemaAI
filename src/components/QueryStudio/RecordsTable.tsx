"use client";

import React, { useState } from "react";
import {
  Table2,
  Download,
  Search,
  FileSpreadsheet,
  ArrowUpDown,
  FileJson,
  Maximize2,
  Minimize2,
  Play,
  Database,
  Check,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface RecordsTableProps {
  columns: string[];
  records: Array<Record<string, unknown>>;
  isLoading?: boolean;
  isMaximized?: boolean;
  onToggleMaximize?: () => void;
  onRunQuery?: () => void;
  hasRun?: boolean;
}

export const RecordsTable: React.FC<RecordsTableProps> = ({
  columns = [],
  records = [],
  isLoading = false,
  isMaximized = false,
  onToggleMaximize,
  onRunQuery,
  hasRun = true,
}) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [downloadSuccess, setDownloadSuccess] = useState<string | null>(null);

  const filteredRecords = records.filter((row) => {
    if (!searchTerm.trim()) return true;
    const q = searchTerm.toLowerCase();
    return Object.values(row).some((val) =>
      String(val).toLowerCase().includes(q)
    );
  });

  const exportCSV = () => {
    if (!records.length) return;
    const headers = columns.join(",");
    const rows = records.map((row) =>
      columns.map((c) => JSON.stringify(row[c] ?? "")).join(",")
    );
    const csvContent = "data:text/csv;charset=utf-8," + [headers, ...rows].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `schema_ai_records_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    setDownloadSuccess("csv");
    setTimeout(() => setDownloadSuccess(null), 2000);
  };

  const exportJSON = () => {
    if (!records.length) return;
    const jsonString = `data:text/json;charset=utf-8,${encodeURIComponent(
      JSON.stringify(records, null, 2)
    )}`;
    const link = document.createElement("a");
    link.setAttribute("href", jsonString);
    link.setAttribute("download", `schema_ai_records_${Date.now()}.json`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    setDownloadSuccess("json");
    setTimeout(() => setDownloadSuccess(null), 2000);
  };

  return (
    <div className="flex flex-col h-full min-h-[220px] rounded-2xl bg-[#16161a] border border-[#222226] shadow-2xl overflow-hidden select-none">
      {/* Table Header Controls */}
      <div className="flex flex-wrap items-center justify-between gap-2 px-3 sm:px-4 py-2.5 bg-[#121215] border-b border-[#222226] backdrop-blur-xl shrink-0">
        <div className="flex items-center space-x-2">
          <div className="flex items-center space-x-1.5 px-2.5 py-1 rounded-xl bg-[#38bdf8]/10 border border-[#38bdf8]/25 text-[#38bdf8] text-xs font-medium shrink-0">
            <FileSpreadsheet className="w-3.5 h-3.5 shrink-0" />
            <span>Fetched Output</span>
          </div>

          {hasRun && (
            <div className="flex items-center space-x-1.5 px-2 py-1 rounded-xl bg-[#1b1b20] border border-[#26262b] text-[11px] font-mono text-zinc-300 shadow-inner shrink-0">
              <span className="w-1.5 h-1.5 rounded-full bg-[#38bdf8]" />
              <span>
                {filteredRecords.length} {filteredRecords.length === 1 ? "row" : "rows"}
              </span>
              <span className="text-zinc-600">•</span>
              <span className="text-zinc-400">{columns.length} columns</span>
            </div>
          )}

          {downloadSuccess && (
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#38bdf8]/20 text-[#38bdf8] font-mono animate-in fade-in duration-200 shrink-0 flex items-center gap-1">
              <Check className="w-2.5 h-2.5" />
              Exported {downloadSuccess.toUpperCase()}
            </span>
          )}
        </div>

        {/* Search & Export Buttons */}
        <div className="flex items-center space-x-1.5 shrink-0">
          {hasRun && records.length > 0 && (
            <div className="relative w-28 sm:w-40 md:w-48">
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Filter output..."
                className="w-full pl-6 pr-2 py-1 rounded-xl bg-[#1b1b20] border border-[#26262b] text-xs text-zinc-200 placeholder:text-zinc-500 focus:outline-none focus:border-[#38bdf8] font-mono shadow-inner"
              />
              <Search className="w-3 h-3 text-zinc-400 absolute left-2 top-2 shrink-0" />
            </div>
          )}

          {hasRun && (
            <div className="flex items-center space-x-1 shrink-0">
              <button
                onClick={exportCSV}
                disabled={records.length === 0}
                className="flex items-center space-x-1 px-2.5 py-1 rounded-xl bg-[#1b1b20] hover:bg-[#25252e] text-zinc-300 hover:text-white border border-[#26262b] text-xs font-medium transition-colors disabled:opacity-30 shadow-sm cursor-pointer"
                title="Export as CSV"
              >
                <Download className="w-3 h-3 text-zinc-400 shrink-0" />
                <span className="hidden sm:inline">CSV</span>
              </button>

              <button
                onClick={exportJSON}
                disabled={records.length === 0}
                className="flex items-center space-x-1 px-2.5 py-1 rounded-xl bg-[#1b1b20] hover:bg-[#25252e] text-zinc-300 hover:text-white border border-[#26262b] text-xs font-medium transition-colors disabled:opacity-30 shadow-sm cursor-pointer"
                title="Export as JSON"
              >
                <FileJson className="w-3 h-3 text-zinc-400 shrink-0" />
                <span className="hidden sm:inline">JSON</span>
              </button>
            </div>
          )}

          {onToggleMaximize && (
            <button
              onClick={onToggleMaximize}
              className={cn(
                "p-1 sm:p-1.5 rounded-xl border transition-all duration-200 shadow-sm shrink-0 cursor-pointer",
                isMaximized
                  ? "bg-[#38bdf8]/20 border-[#38bdf8]/50 text-[#38bdf8]"
                  : "bg-[#1b1b20] border-[#26262b] text-zinc-400 hover:text-white hover:bg-[#25252e]"
              )}
              title={isMaximized ? "Restore view" : "Maximize Results Table"}
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

      {/* Grid Table Container */}
      <div className="flex-1 min-h-0 overflow-y-auto overflow-x-auto bg-[#0e0e11] relative">
        {isLoading ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center space-y-3 bg-black/75 backdrop-blur-md z-10">
            <div className="w-9 h-9 border-2 border-[#38bdf8]/20 border-t-[#38bdf8] rounded-full animate-spin" />
            <p className="text-xs font-mono text-[#38bdf8]">
              Executing query & streaming database cursor...
            </p>
          </div>
        ) : null}

        {!hasRun ? (
          /* Empty state before running */
          <div className="flex flex-col items-center justify-center h-full min-h-[160px] py-12 text-center p-6 space-y-3">
            <div className="p-3 rounded-2xl bg-[#16161a] border border-[#222226] text-[#38bdf8]">
              <Database className="w-6 h-6 stroke-[1.5]" />
            </div>
            <div>
              <p className="text-sm font-semibold text-zinc-200">Query Not Executed Yet</p>
              <p className="text-xs text-zinc-500 mt-1 max-w-sm">
                The query has been synthesized. Click <strong>Run Query</strong> to execute and inspect the fetched database tables and columns.
              </p>
            </div>
            {onRunQuery && (
              <button
                onClick={onRunQuery}
                className="flex items-center space-x-1.5 px-4 py-2 rounded-xl text-xs font-semibold bg-[#38bdf8] hover:bg-[#0284c7] text-[#0a0a0d] shadow-lg shadow-[#38bdf8]/20 hover:scale-105 transition-all cursor-pointer"
              >
                <Play className="w-3.5 h-3.5 fill-current" />
                <span>Execute & Fetch Output</span>
              </button>
            )}
          </div>
        ) : filteredRecords.length > 0 ? (
          <table className="min-w-full w-full text-left border-collapse text-xs font-mono">
            <thead>
              <tr className="sticky top-0 bg-[#16161a]/95 border-b border-[#222226] z-10 backdrop-blur-xl">
                <th className="w-10 px-3 py-2 text-zinc-500 text-center font-normal border-r border-[#222226] bg-[#121215] shrink-0">
                  #
                </th>
                {columns.map((col) => (
                  <th
                    key={col}
                    className="px-3.5 py-2 font-medium text-zinc-300 tracking-wider text-[11px] border-r border-[#222226] uppercase group cursor-pointer hover:bg-zinc-800/40 transition-colors whitespace-nowrap"
                  >
                    <div className="flex items-center justify-between space-x-1.5">
                      <span className="truncate">{col}</span>
                      <ArrowUpDown className="w-2.5 h-2.5 text-zinc-600 opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-[#222226]">
              {filteredRecords.map((row, rowIdx) => (
                <tr
                  key={rowIdx}
                  className="hover:bg-[#1a1a20] transition-colors group"
                >
                  <td className="w-10 px-3 py-2 text-zinc-500 text-center font-mono text-[10px] border-r border-[#222226] bg-[#121215]/60 select-none shrink-0">
                    {rowIdx + 1}
                  </td>
                  {columns.map((col) => {
                    const cellValue = row[col];
                    const isNum = typeof cellValue === "number";
                    const isBool = typeof cellValue === "boolean";
                    const isStatus = col.toLowerCase().includes("status");

                    return (
                      <td
                        key={col}
                        className={cn(
                          "px-3.5 py-2 text-zinc-200 border-r border-[#222226] truncate max-w-[240px] whitespace-nowrap",
                          isNum && "text-sky-300 font-medium",
                          isBool && (cellValue ? "text-emerald-400 font-medium" : "text-rose-400 font-medium")
                        )}
                        title={String(cellValue)}
                      >
                        {isStatus ? (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[9px] font-medium uppercase bg-[#38bdf8]/10 text-[#38bdf8] border border-[#38bdf8]/25">
                            {String(cellValue)}
                          </span>
                        ) : typeof cellValue === "object" ? (
                          JSON.stringify(cellValue)
                        ) : (
                          String(cellValue ?? "null")
                        )}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <div className="flex flex-col items-center justify-center h-full py-12 text-zinc-500 space-y-2">
            <Table2 className="w-7 h-7 stroke-[1.5] text-zinc-600" />
            <p className="text-xs font-mono">No records match the filter query.</p>
          </div>
        )}
      </div>

      {/* Table Footer */}
      <div className="px-3 sm:px-4 py-2 bg-[#121215] border-t border-[#222226] flex items-center justify-between text-[10px] sm:text-[11px] text-zinc-400 shrink-0">
        <span className="font-mono">
          {hasRun ? `Showing ${filteredRecords.length} of ${records.length} records` : "Awaiting execution"}
        </span>
        <span className="text-[10px] text-zinc-500 font-mono hidden sm:inline">PostgreSQL Relational Buffer</span>
      </div>
    </div>
  );
};
