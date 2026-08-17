"use client";

import React, { useState } from "react";
import {
  Shield,
  ShieldAlert,
  ShieldCheck,
  Search,
  Filter,
  Terminal,
  Clock,
  Laptop,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  FileCode,
  Eye,
  ExternalLink,
  RefreshCw,
  Sparkles,
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
          <span className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 text-[11px] font-semibold">
            <CheckCircle2 className="w-3 h-3" />
            <span>SUCCESS</span>
          </span>
        );
      case "BLOCKED":
        return (
          <span className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-full bg-rose-500/15 text-rose-400 border border-rose-500/30 text-[11px] font-semibold">
            <XCircle className="w-3 h-3" />
            <span>BLOCKED</span>
          </span>
        );
      case "MUTATION_APPROVED":
        return (
          <span className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-full bg-amber-500/15 text-amber-300 border border-amber-500/30 text-[11px] font-semibold">
            <AlertTriangle className="w-3 h-3" />
            <span>MUTATION APPROVED</span>
          </span>
        );
      case "FAILED":
        return (
          <span className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-full bg-slate-800 text-slate-400 border border-slate-700 text-[11px] font-semibold">
            <span>FAILED</span>
          </span>
        );
    }
  };

  return (
    <div className="flex-1 p-6 bg-[#070a12] space-y-6 max-w-7xl mx-auto w-full">
      {/* Header & Metrics Overview */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <div className="p-2 rounded-xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-400">
              <Shield className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-white tracking-tight">
                Security & Query Audit Logs
              </h1>
              <p className="text-xs text-slate-400">
                Immutable telemetry record of all generated SQL executions, IP origins, and mutation overrides.
              </p>
            </div>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center space-x-3">
          <button
            onClick={onRefresh}
            className="flex items-center space-x-1.5 px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 hover:border-slate-700 text-slate-300 hover:text-white text-xs font-medium transition-all"
          >
            <RefreshCw className="w-3.5 h-3.5 text-cyan-400" />
            <span>Refresh Telemetry</span>
          </button>
        </div>
      </div>

      {/* Security Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800/90 shadow-lg">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-400 font-medium">Total Interceptions</span>
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
          </div>
          <p className="text-2xl font-bold font-mono text-white mt-2">
            {logs.length} Queries
          </p>
          <span className="text-[10px] text-emerald-400 font-mono">100% Policy Enforced</span>
        </div>

        <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800/90 shadow-lg">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-400 font-medium">Blocked Mutations</span>
            <ShieldAlert className="w-4 h-4 text-rose-400" />
          </div>
          <p className="text-2xl font-bold font-mono text-rose-400 mt-2">
            {logs.filter((l) => l.status === "BLOCKED").length} Blocked
          </p>
          <span className="text-[10px] text-rose-400/80 font-mono">Zero Unauthorized Writes</span>
        </div>

        <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800/90 shadow-lg">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-400 font-medium">Escalated Approvals</span>
            <AlertTriangle className="w-4 h-4 text-amber-400" />
          </div>
          <p className="text-2xl font-bold font-mono text-amber-300 mt-2">
            {logs.filter((l) => l.status === "MUTATION_APPROVED").length} Granted
          </p>
          <span className="text-[10px] text-amber-400/80 font-mono">Signed Admin Overrides</span>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-3 rounded-2xl bg-slate-900/90 border border-slate-800/80 shadow-md">
        <div className="flex items-center space-x-2 flex-1 min-w-[240px]">
          <div className="relative w-full max-w-md">
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by prompt, SQL, IP or log ID..."
              className="w-full pl-9 pr-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-200 placeholder:text-slate-500 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 font-mono"
            />
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          </div>
        </div>

        {/* Status Filters */}
        <div className="flex items-center space-x-1.5 p-1 rounded-xl bg-slate-950 border border-slate-800 text-xs font-medium">
          {["ALL", "SUCCESS", "BLOCKED", "MUTATION_APPROVED"].map((status) => (
            <button
              key={status}
              onClick={() => setStatusFilter(status)}
              className={cn(
                "px-3 py-1.5 rounded-lg transition-all text-xs font-medium",
                statusFilter === status
                  ? "bg-cyan-500/20 text-cyan-300 font-semibold border border-cyan-500/30 shadow-sm"
                  : "text-slate-400 hover:text-white"
              )}
            >
              {status === "MUTATION_APPROVED" ? "MUTATIONS" : status}
            </button>
          ))}
        </div>
      </div>

      {/* Audit Log Table */}
      <div className="rounded-2xl bg-slate-900/90 border border-slate-800 shadow-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs font-mono">
            <thead>
              <tr className="bg-slate-950/80 border-b border-slate-800 text-slate-400 text-[11px] uppercase tracking-wider">
                <th className="px-4 py-3">Log ID & Timestamp</th>
                <th className="px-4 py-3">Client IP / Origin</th>
                <th className="px-4 py-3">Natural Language Prompt</th>
                <th className="px-4 py-3">Generated SQL</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Duration</th>
                <th className="px-4 py-3 text-right">Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {filteredLogs.map((log) => (
                <tr
                  key={log.id}
                  className="hover:bg-slate-850/50 transition-colors group cursor-pointer"
                  onClick={() => setSelectedLog(log)}
                >
                  <td className="px-4 py-3 whitespace-nowrap">
                    <span className="font-semibold text-cyan-400 block">{log.id}</span>
                    <span className="text-[10px] text-slate-500 flex items-center gap-1 mt-0.5">
                      <Clock className="w-2.5 h-2.5" /> {log.timestamp}
                    </span>
                  </td>

                  <td className="px-4 py-3 whitespace-nowrap">
                    <span className="text-slate-200 block font-medium">{log.ipAddress}</span>
                    <span className="text-[10px] text-slate-500 truncate max-w-[120px] block">
                      {log.clientDevice || "Web Client"}
                    </span>
                  </td>

                  <td className="px-4 py-3 max-w-xs truncate font-sans text-slate-300">
                    {log.userPrompt}
                  </td>

                  <td className="px-4 py-3 max-w-xs truncate text-cyan-300 font-mono text-[11px]">
                    <code>{log.generatedSql.replace(/\n/g, " ")}</code>
                  </td>

                  <td className="px-4 py-3 whitespace-nowrap">
                    {getStatusBadge(log.status)}
                  </td>

                  <td className="px-4 py-3 whitespace-nowrap font-mono text-slate-300">
                    {log.durationMs}ms
                  </td>

                  <td className="px-4 py-3 text-right whitespace-nowrap">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedLog(log);
                      }}
                      className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 transition-colors"
                      title="Inspect full audit record"
                    >
                      <Eye className="w-3.5 h-3.5 text-cyan-400" />
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
            className="relative w-full max-w-2xl rounded-2xl glass-modal border border-slate-700 shadow-2xl p-6 text-slate-200 space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center space-x-2.5">
                <Shield className="w-5 h-5 text-cyan-400" />
                <div>
                  <h3 className="font-bold text-base text-white font-mono">
                    Audit Inspection: {selectedLog.id}
                  </h3>
                  <p className="text-xs text-slate-400">{selectedLog.timestamp}</p>
                </div>
              </div>
              <button
                onClick={() => setSelectedLog(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3 p-3 rounded-xl bg-slate-900/90 border border-slate-800">
                <div>
                  <span className="text-slate-400 block text-[11px]">Execution Status</span>
                  <div className="mt-1">{getStatusBadge(selectedLog.status)}</div>
                </div>
                <div>
                  <span className="text-slate-400 block text-[11px]">Client IP</span>
                  <span className="font-mono text-cyan-300 font-semibold">{selectedLog.ipAddress}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[11px]">Execution Latency</span>
                  <span className="font-mono text-slate-200">{selectedLog.durationMs}ms</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[11px]">AI Model</span>
                  <span className="font-mono text-slate-200">{selectedLog.model}</span>
                </div>
              </div>

              <div>
                <span className="font-semibold text-slate-300 block mb-1">User Prompt</span>
                <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-slate-200 font-sans">
                  {selectedLog.userPrompt}
                </div>
              </div>

              <div>
                <span className="font-semibold text-slate-300 block mb-1">Generated SQL Payload</span>
                <div className="p-3 rounded-xl bg-black/90 border border-slate-800 font-mono text-xs text-cyan-300 max-h-48 overflow-y-auto">
                  <pre className="whitespace-pre-wrap">{selectedLog.generatedSql}</pre>
                </div>
              </div>
            </div>

            <div className="pt-3 border-t border-slate-800 flex justify-end">
              <button
                onClick={() => setSelectedLog(null)}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold"
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
