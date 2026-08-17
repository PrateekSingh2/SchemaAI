"use client";

import React, { useState } from "react";
import {
  Table2,
  Download,
  Search,
  FileSpreadsheet,
  ArrowUpDown,
  FileJson,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface RecordsTableProps {
  columns: string[];
  records: Array<Record<string, any>>;
  isLoading?: boolean;
}

export const RecordsTable: React.FC<RecordsTableProps> = ({
  columns = [],
  records = [],
  isLoading = false,
}) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [downloadSuccess, setDownloadSuccess] = useState(false);

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

    setDownloadSuccess(true);
    setTimeout(() => setDownloadSuccess(false), 2000);
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

    setDownloadSuccess(true);
    setTimeout(() => setDownloadSuccess(false), 2000);
  };

  return (
    <div className="flex flex-col h-full rounded-2xl bg-[#171412] border border-[#292524] shadow-2xl overflow-hidden supabase-panel">
      {/* Table Header Controls */}
      <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 bg-[#141210]/90 border-b border-[#292524] backdrop-blur-xl">
        <div className="flex items-center space-x-3">
          <div className="flex items-center space-x-1.5 px-2.5 py-1 rounded-xl bg-[#3ecf8e]/10 border border-[#3ecf8e]/20 text-[#3ecf8e] text-xs font-semibold">
            <FileSpreadsheet className="w-3.5 h-3.5" />
            <span>Query Results</span>
          </div>

          <div className="flex items-center space-x-1.5 px-2.5 py-1 rounded-xl bg-[#1c1917] border border-[#292524] text-[11px] font-mono text-stone-300 shadow-inner">
            <span className="w-2 h-2 rounded-full bg-[#3ecf8e]" />
            <span>
              {filteredRecords.length} {filteredRecords.length === 1 ? "row" : "rows"} fetched
            </span>
          </div>
        </div>

        {/* Search and Export Buttons */}
        <div className="flex items-center space-x-2">
          <div className="relative">
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search in results..."
              className="w-36 sm:w-48 pl-7 pr-2.5 py-1 rounded-xl bg-[#1c1917] border border-[#292524] text-xs text-stone-200 placeholder:text-stone-500 focus:outline-none focus:border-[#3ecf8e] font-mono shadow-inner"
            />
            <Search className="w-3 h-3 text-stone-400 absolute left-2.5 top-2" />
          </div>

          <div className="flex items-center space-x-1">
            <button
              onClick={exportCSV}
              disabled={records.length === 0}
              className="flex items-center space-x-1 px-2.5 py-1 rounded-xl bg-[#1c1917] hover:bg-[#201d1a] text-stone-300 hover:text-stone-100 border border-[#292524] text-xs font-medium transition-colors disabled:opacity-40 shadow-sm"
              title="Export as CSV"
            >
              <Download className="w-3 h-3 text-stone-400" />
              <span>CSV</span>
            </button>

            <button
              onClick={exportJSON}
              disabled={records.length === 0}
              className="flex items-center space-x-1 px-2.5 py-1 rounded-xl bg-[#1c1917] hover:bg-[#201d1a] text-stone-300 hover:text-stone-100 border border-[#292524] text-xs font-medium transition-colors disabled:opacity-40 shadow-sm"
              title="Export as JSON"
            >
              <FileJson className="w-3 h-3 text-stone-400" />
              <span>JSON</span>
            </button>
          </div>
        </div>
      </div>

      {/* Grid Table */}
      <div className="flex-1 overflow-auto bg-[#121110] relative">
        {isLoading ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center space-y-3 bg-black/60 backdrop-blur-md z-10">
            <div className="w-8 h-8 border-2 border-[#3ecf8e]/20 border-t-[#3ecf8e] rounded-full animate-spin" />
            <p className="text-xs font-mono text-[#3ecf8e]">
              Streaming database cursor buffers...
            </p>
          </div>
        ) : null}

        {filteredRecords.length > 0 ? (
          <table className="w-full text-left border-collapse text-xs font-mono">
            <thead>
              <tr className="sticky top-0 bg-[#171412]/95 border-b border-[#292524] z-10 backdrop-blur-xl">
                <th className="w-10 px-3 py-2.5 text-stone-500 text-center font-normal border-r border-[#292524] bg-[#141210]">
                  #
                </th>
                {columns.map((col) => (
                  <th
                    key={col}
                    className="px-3.5 py-2.5 font-semibold text-stone-300 tracking-wider text-[11px] border-r border-[#292524] uppercase group cursor-pointer hover:bg-stone-800/40 transition-colors"
                  >
                    <div className="flex items-center justify-between space-x-1">
                      <span className="truncate">{col}</span>
                      <ArrowUpDown className="w-3 h-3 text-stone-600 opacity-0 group-hover:opacity-100 transition-opacity" />
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-[#292524]/60">
              {filteredRecords.map((row, rowIdx) => (
                <tr
                  key={rowIdx}
                  className="hover:bg-[#1a1715] transition-colors group"
                >
                  <td className="w-10 px-3 py-2 text-stone-600 text-center font-mono text-[11px] border-r border-[#292524]/60 bg-[#141210]/60 select-none">
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
                          "px-3.5 py-2 text-stone-200 border-r border-[#292524]/40 truncate max-w-[220px]",
                          isNum && "text-amber-300 font-medium",
                          isBool && (cellValue ? "text-[#3ecf8e] font-medium" : "text-rose-400 font-medium")
                        )}
                        title={String(cellValue)}
                      >
                        {isStatus ? (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase bg-[#3ecf8e]/10 text-[#3ecf8e] border border-[#3ecf8e]/20">
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
          <div className="flex flex-col items-center justify-center h-full py-12 text-stone-500 space-y-2">
            <Table2 className="w-8 h-8 stroke-[1.5] text-stone-600" />
            <p className="text-xs font-mono">No records match the current filter.</p>
          </div>
        )}
      </div>

      {/* Table Footer */}
      <div className="px-4 py-2.5 bg-[#141210]/90 border-t border-[#292524] flex items-center justify-between text-[11px] text-stone-400">
        <span className="font-mono">Showing {filteredRecords.length} of {records.length} records</span>
        <span className="text-[10px] text-stone-500 font-mono">Buffered Query Cache</span>
      </div>
    </div>
  );
};
