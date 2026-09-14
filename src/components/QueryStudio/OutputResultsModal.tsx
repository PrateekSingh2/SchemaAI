"use client";

import React, { useEffect } from "react";
import {
  X,
  FileSpreadsheet,
  Download,
  Search,
  ArrowUpDown,
  FileJson,
  Check,
  Table2,
  Maximize2,
  Minimize2,
  Clock,
  Database,
  Layers,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface OutputResultsModalProps {
  isOpen: boolean;
  onClose: () => void;
  columns: string[];
  records: Array<Record<string, unknown>>;
  executionTime?: number;
  tableName?: string;
}

export const OutputResultsModal: React.FC<OutputResultsModalProps> = ({
  isOpen,
  onClose,
  columns = [],
  records = [],
  executionTime = 28,
  tableName = "Query Results",
}) => {
  const [searchTerm, setSearchTerm] = React.useState("");
  const [downloadSuccess, setDownloadSuccess] = React.useState<string | null>(null);

  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

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
    link.setAttribute("download", `schema_ai_output_${Date.now()}.csv`);
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
    link.setAttribute("download", `schema_ai_output_${Date.now()}.json`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    setDownloadSuccess("json");
    setTimeout(() => setDownloadSuccess(null), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div
        className="relative w-full max-w-5xl h-[88vh] max-h-[850px] rounded-2xl bg-[#16161a] border border-[#26262b] shadow-2xl flex flex-col overflow-hidden text-[#f4f4f5]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Accent Gradient Line */}
        <div className="h-1 w-full bg-gradient-to-r from-[#38bdf8] via-blue-500 to-indigo-500 shrink-0" />

        {/* Modal Header */}
        <div className="px-4 sm:px-6 py-3.5 bg-[#121215] border-b border-[#222226] flex items-center justify-between gap-3 shrink-0">
          <div className="flex items-center space-x-2.5 min-w-0">
            <div className="p-2 rounded-xl bg-[#38bdf8]/10 border border-[#38bdf8]/25 text-[#38bdf8] shrink-0">
              <FileSpreadsheet className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h2 className="text-sm sm:text-base font-semibold text-[#f4f4f5] tracking-tight">
                  Fetched Query Output
                </h2>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-[#38bdf8]/15 text-[#38bdf8] font-medium border border-[#38bdf8]/25">
                  {records.length} {records.length === 1 ? "Record" : "Records"}
                </span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-[#1b1b20] text-zinc-400 border border-[#26262b]">
                  {columns.length} Columns
                </span>
              </div>
              <p className="text-[11px] text-zinc-400 truncate mt-0.5">
                Execution finished in {executionTime}ms • Database cursor buffers flushed
              </p>
            </div>
          </div>

          {/* Search, Export & Close */}
          <div className="flex items-center space-x-2 shrink-0">
            <div className="relative w-32 sm:w-48">
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search table..."
                className="w-full pl-7 pr-2.5 py-1 rounded-xl bg-[#1b1b20] border border-[#26262b] text-xs text-zinc-200 placeholder:text-zinc-500 focus:outline-none focus:border-[#38bdf8] font-mono shadow-inner"
              />
              <Search className="w-3 h-3 text-zinc-400 absolute left-2.5 top-2 shrink-0" />
            </div>

            <button
              onClick={exportCSV}
              disabled={records.length === 0}
              className="flex items-center space-x-1 px-2.5 py-1 rounded-xl bg-[#1b1b20] hover:bg-[#24242c] text-zinc-300 hover:text-white border border-[#26262b] text-xs font-medium transition-colors shadow-sm cursor-pointer disabled:opacity-40"
              title="Export as CSV"
            >
              <Download className="w-3 h-3 text-zinc-400" />
              <span className="hidden sm:inline">CSV</span>
            </button>

            <button
              onClick={exportJSON}
              disabled={records.length === 0}
              className="flex items-center space-x-1 px-2.5 py-1 rounded-xl bg-[#1b1b20] hover:bg-[#24242c] text-zinc-300 hover:text-white border border-[#26262b] text-xs font-medium transition-colors shadow-sm cursor-pointer disabled:opacity-40"
              title="Export as JSON"
            >
              <FileJson className="w-3 h-3 text-zinc-400" />
              <span className="hidden sm:inline">JSON</span>
            </button>

            {downloadSuccess && (
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#38bdf8]/20 text-[#38bdf8] font-mono animate-in fade-in duration-200">
                Exported {downloadSuccess.toUpperCase()}!
              </span>
            )}

            <button
              onClick={onClose}
              className="p-1.5 rounded-xl bg-[#1b1b20] hover:bg-[#282832] text-zinc-400 hover:text-white border border-[#26262b] transition-all cursor-pointer ml-1"
              title="Close Output (Esc)"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Modal Body: Scrollable Table View */}
        <div className="flex-1 min-h-0 overflow-y-auto overflow-x-auto bg-[#0e0e11] relative font-mono">
          {filteredRecords.length > 0 ? (
            <table className="min-w-full w-full text-left border-collapse text-xs">
              <thead>
                <tr className="sticky top-0 bg-[#16161a]/95 border-b border-[#222226] z-10 backdrop-blur-xl">
                  <th className="w-12 px-3 py-2.5 text-zinc-500 text-center font-normal border-r border-[#222226] bg-[#121215] shrink-0">
                    #
                  </th>
                  {columns.map((col) => (
                    <th
                      key={col}
                      className="px-3.5 py-2.5 font-medium text-zinc-300 tracking-wider text-[11px] border-r border-[#222226] uppercase group cursor-pointer hover:bg-zinc-800/40 transition-colors whitespace-nowrap"
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
                    <td className="w-12 px-3 py-2 text-zinc-500 text-center font-mono text-[11px] border-r border-[#222226] bg-[#121215]/80 select-none shrink-0">
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
                            "px-3.5 py-2 text-zinc-200 border-r border-[#222226] truncate max-w-[260px] whitespace-nowrap",
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
            <div className="flex flex-col items-center justify-center h-full py-16 text-zinc-500 space-y-2">
              <Table2 className="w-8 h-8 stroke-[1.5] text-zinc-600" />
              <p className="text-xs font-mono">No records match your search filter.</p>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-4 sm:px-6 py-2.5 bg-[#121215] border-t border-[#222226] flex items-center justify-between text-xs text-zinc-400 shrink-0">
          <div className="flex items-center space-x-2 font-mono text-[11px]">
            <span>Showing {filteredRecords.length} of {records.length} rows</span>
            <span className="text-zinc-600">•</span>
            <span className="text-[#38bdf8]">{columns.length} columns fetched</span>
          </div>

          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-xl bg-[#1b1b20] hover:bg-[#25252e] border border-[#26262b] text-zinc-200 text-xs font-medium transition-all cursor-pointer"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
