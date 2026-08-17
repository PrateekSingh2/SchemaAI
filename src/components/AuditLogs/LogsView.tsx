"use client";

import React, { useState } from "react";
import {
  Shield,
  ShieldAlert,
  ShieldCheck,
  Search,
  Clock,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Eye,
  RefreshCw,
  Copy,
  Check,
} from "lucide-react";
import { AuditLogEntry } from "@/lib/mockData";
import { cn } from "@/lib/utils";

interface LogsViewProps {
  logs: AuditLogEntry[];
  onRefresh?: () => void;
}

export const LogsView: React.FC<LogsViewProps> = ({ logs, onRefresh }) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [selectedLog, setSelectedLog] = useState<AuditLogEntry | null>(null);
  const [copiedSql, setCopiedSql] = useState(false);

  const filteredLogs = logs.filter((log) => {
    const matchesStatus =
      statusFilter === "ALL" || log.status === statusFilter;
    const q = searchTerm.toLowerCase();
    const matchesSearch =
      log.userPrompt.toLowerCase().includes(q) ||
      log.generatedSql.toLowerCase().includes(q) ||
      log.ipAddress.toLowerCase().includes(q) ||
      log.id.toLowerCase().includes(q);

    return matchesStatus && matchesSearch;
  });

  const getStatusBadge = (status: AuditLogEntry["status"]) => {
    switch (status) {
      case "SUCCESS":
        return (
          <span className="inline-flex items-center space-x-1.5 px-2.5 py-0.5 rounded-full bg-[#3ecf8e]/10 text-[#3ecf8e] border border-[#3ecf8e]/20 text-[11px] font-semibold">
            <CheckCircle2 className="w-3 h-3" />
            <span>SUCCESS</span>
          </span>
        );
      case "BLOCKED":
        return (
          <span className="inline-flex items-center space-x-1.5 px-2.5 py-0.5 rounded-full bg-rose-500/15 text-rose-400 border border-rose-500/30 text-[11px] font-semibold">
            <XCircle className="w-3 h-3" />
            <span>BLOCKED</span>
          </span>
        );
      case "MUTATION_APPROVED":
        return (
          <span className="inline-flex items-center space-x-1.5 px-2.5 py-0.5 rounded-full bg-amber-500/15 text-amber-300 border border-amber-500/30 text-[11px] font-semibold">
            <AlertTriangle className="w-3 h-3" />
            <span>MUTATION APPROVED</span>
          </span>
        );
      case "FAILED":
        return (
          <span className="inline-flex items-center space-x-1.5 px-2.5 py-0.5 rounded-full bg-stone-800 text-stone-400 border border-stone-700 text-[11px] font-semibold">
            <span>FAILED</span>
          </span>
        );
    }
  };

  const handleCopySql = (sql: string) => {
    navigator.clipboard.writeText(sql);
    setCopiedSql(true);
    setTimeout(() => setCopiedSql(false), 2000);
  };

  return (
    <div className="flex-1 p-6 bg-[#121110] space-y-6 max-w-7xl mx-auto w-full">
      {/* Header & Metrics Overview */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-3">
            <div className="p-2.5 rounded-2xl bg-[#3ecf8e]/10 border border-[#3ecf8e]/20 text-[#3ecf8e]">
              <Shield className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-stone-100 tracking-tight">
                Security & Query Audit Logs
              </h1>
              <p className="text-xs text-stone-400">
                Cryptographic audit trail of all natural language prompts, generated SQL, and mutation overrides.
              </p>
            </div>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center space-x-3">
          <button
            onClick={onRefresh}
            className="flex items-center space-x-1.5 px-3.5 py-2 rounded-2xl bg-[#1c1917] border border-[#292524] hover:border-stone-700 text-stone-300 hover:text-stone-100 text-xs font-medium transition-all shadow-sm"
          >
            <RefreshCw className="w-3.5 h-3.5 text-[#3ecf8e]" />
            <span>Refresh Telemetry</span>
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-4 rounded-2xl bg-[#171412] border border-[#292524] shadow-lg supabase-panel">
          <div className="flex items-center justify-between">
            <span className="text-xs text-stone-400 font-medium">Total Interceptions</span>
            <ShieldCheck className="w-4 h-4 text-[#3ecf8e]" />
          </div>
          <p className="text-2xl font-bold font-mono text-stone-100 mt-2">
            {logs.length} Queries
          </p>
          <span className="text-[10px] text-[#3ecf8e] font-mono">100% Policy Enforced</span>
        </div>

        <div className="p-4 rounded-2xl bg-[#171412] border border-[#292524] shadow-lg supabase-panel">
          <div className="flex items-center justify-between">
            <span className="text-xs text-stone-400 font-medium">Blocked Mutations</span>
            <ShieldAlert className="w-4 h-4 text-rose-400" />
          </div>
          <p className="text-2xl font-bold font-mono text-rose-400 mt-2">
            {logs.filter((l) => l.status === "BLOCKED").length} Blocked
          </p>
          <span className="text-[10px] text-rose-400/80 font-mono">Zero Unauthorized Writes</span>
        </div>

        <div className="p-4 rounded-2xl bg-[#171412] border border-[#292524] shadow-lg supabase-panel">
          <div className="flex items-center justify-between">
            <span className="text-xs text-stone-400 font-medium">Escalated Approvals</span>
            <AlertTriangle className="w-4 h-4 text-amber-400" />
          </div>
          <p className="text-2xl font-bold font-mono text-amber-300 mt-2">
            {logs.filter((l) => l.status === "MUTATION_APPROVED").length} Granted
          </p>
          <span className="text-[10px] text-amber-400/80 font-mono">Signed Admin Overrides</span>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-3 rounded-2xl bg-[#171412] border border-[#292524] shadow-md supabase-panel">
        <div className="flex items-center space-x-2 flex-1 min-w-[240px]">
          <div className="relative w-full max-w-md">
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by prompt, SQL, IP or log ID..."
              className="w-full pl-9 pr-3 py-2 rounded-xl bg-[#141210] border border-[#292524] text-xs text-stone-200 placeholder:text-stone-500 focus:outline-none focus:border-[#3ecf8e] font-mono shadow-inner"
            />
            <Search className="w-4 h-4 text-stone-400 absolute left-3 top-2.5" />
          </div>
        </div>

        {/* Status Segmented Buttons */}
        <div className="flex items-center space-x-1 p-1 rounded-xl bg-[#141210] border border-[#292524] text-xs font-medium shadow-inner">
          {[
            { id: "ALL", label: "ALL" },
            { id: "SUCCESS", label: "SUCCESS" },
            { id: "BLOCKED", label: "BLOCKED" },
            { id: "MUTATION_APPROVED", label: "MUTATIONS" },
          ].map((status) => (
            <button
              key={status.id}
              onClick={() => setStatusFilter(status.id)}
              className={cn(
                "px-3 py-1.5 rounded-lg transition-all text-xs font-medium",
                statusFilter === status.id
                  ? "bg-[#1c1917] text-[#3ecf8e] font-semibold border border-[#3ecf8e]/30 shadow-sm"
                  : "text-stone-400 hover:text-stone-200"
              )}
            >
              {status.label}
            </button>
          ))}
        </div>
      </div>

      {/* Audit Log Table */}
      <div className="rounded-2xl bg-[#171412] border border-[#292524] shadow-xl overflow-hidden supabase-panel">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs font-mono">
            <thead>
              <tr className="bg-[#141210]/95 border-b border-[#292524] text-stone-400 text-[11px] uppercase tracking-wider">
                <th className="px-4 py-3">Log ID & Timestamp</th>
                <th className="px-4 py-3">Client IP / Origin</th>
                <th className="px-4 py-3">Natural Language Prompt</th>
                <th className="px-4 py-3">Generated SQL</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Duration</th>
                <th className="px-4 py-3 text-right">Inspect</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#292524]/60">
              {filteredLogs.map((log) => (
                <tr
                  key={log.id}
                  className="hover:bg-[#1f1c19] transition-colors group cursor-pointer"
                  onClick={() => setSelectedLog(log)}
                >
                  <td className="px-4 py-3 whitespace-nowrap">
                    <span className="font-semibold text-[#3ecf8e] block">{log.id}</span>
                    <span className="text-[10px] text-stone-500 flex items-center gap-1 mt-0.5">
                      <Clock className="w-2.5 h-2.5" /> {log.timestamp}
                    </span>
                  </td>

                  <td className="px-4 py-3 whitespace-nowrap">
                    <span className="text-stone-200 block font-medium">{log.ipAddress}</span>
                    <span className="text-[10px] text-stone-500 truncate max-w-[120px] block">
                      {log.clientDevice || "Web Client"}
                    </span>
                  </td>

                  <td className="px-4 py-3 max-w-xs truncate font-sans text-stone-300">
                    {log.userPrompt}
                  </td>

                  <td className="px-4 py-3 max-w-xs truncate text-[#3ecf8e] font-mono text-[11px]">
                    <code>{log.generatedSql.replace(/\n/g, " ")}</code>
                  </td>

                  <td className="px-4 py-3 whitespace-nowrap">
                    {getStatusBadge(log.status)}
                  </td>

                  <td className="px-4 py-3 whitespace-nowrap font-mono text-stone-300">
                    {log.durationMs}ms
                  </td>

                  <td className="px-4 py-3 text-right whitespace-nowrap">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedLog(log);
                      }}
                      className="p-1.5 rounded-xl bg-[#141210] hover:bg-[#1f1c19] text-stone-300 hover:text-stone-100 border border-[#292524] transition-colors"
                      title="Inspect full audit record"
                    >
                      <Eye className="w-3.5 h-3.5 text-[#3ecf8e]" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Log Detail Inspector Modal */}
      {selectedLog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
          <div
            className="relative w-full max-w-2xl rounded-2xl bg-[#171412] border border-[#292524] shadow-2xl p-6 text-stone-200 space-y-4 supabase-modal"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-3 border-b border-[#292524]">
              <div className="flex items-center space-x-3">
                <div className="p-2 rounded-xl bg-[#3ecf8e]/10 text-[#3ecf8e]">
                  <Shield className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-base text-stone-100 font-mono">
                    Audit Inspection: {selectedLog.id}
                  </h3>
                  <p className="text-xs text-stone-400">{selectedLog.timestamp}</p>
                </div>
              </div>
              <button
                onClick={() => setSelectedLog(null)}
                className="p-1 rounded-xl text-stone-400 hover:text-stone-100 hover:bg-stone-800"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3 p-3.5 rounded-xl bg-[#141210] border border-[#292524] shadow-inner">
                <div>
                  <span className="text-stone-400 block text-[11px]">Execution Status</span>
                  <div className="mt-1">{getStatusBadge(selectedLog.status)}</div>
                </div>
                <div>
                  <span className="text-stone-400 block text-[11px]">Client IP</span>
                  <span className="font-mono text-[#3ecf8e] font-semibold">{selectedLog.ipAddress}</span>
                </div>
                <div>
                  <span className="text-stone-400 block text-[11px]">Execution Latency</span>
                  <span className="font-mono text-stone-200">{selectedLog.durationMs}ms</span>
                </div>
                <div>
                  <span className="text-stone-400 block text-[11px]">AI Model</span>
                  <span className="font-mono text-stone-200">{selectedLog.model}</span>
                </div>
              </div>

              <div>
                <span className="font-semibold text-stone-300 block mb-1">User Prompt</span>
                <div className="p-3 rounded-xl bg-[#141210] border border-[#292524] text-stone-200 font-sans leading-relaxed shadow-inner">
                  {selectedLog.userPrompt}
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <span className="font-semibold text-stone-300">Generated SQL Payload</span>
                  <button
                    onClick={() => handleCopySql(selectedLog.generatedSql)}
                    className="flex items-center space-x-1 text-[11px] text-[#3ecf8e] hover:text-[#6ee7b7]"
                  >
                    {copiedSql ? (
                      <>
                        <Check className="w-3 h-3 text-[#3ecf8e]" />
                        <span>Copied</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3 h-3" />
                        <span>Copy SQL</span>
                      </>
                    )}
                  </button>
                </div>
                <div className="p-3.5 rounded-xl bg-black/90 border border-[#292524] font-mono text-xs text-[#3ecf8e] max-h-48 overflow-y-auto shadow-inner">
                  <pre className="whitespace-pre-wrap leading-relaxed">{selectedLog.generatedSql}</pre>
                </div>
              </div>
            </div>

            <div className="pt-3 border-t border-[#292524] flex justify-end">
              <button
                onClick={() => setSelectedLog(null)}
                className="px-4 py-2 rounded-xl bg-[#141210] hover:bg-[#1c1917] text-stone-100 text-xs font-semibold border border-[#292524]"
              >
                Close Inspector
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
