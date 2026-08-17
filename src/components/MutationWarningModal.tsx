"use client";

import React from "react";
import {
  AlertTriangle,
  ShieldAlert,
  X,
  Check,
  Ban,
  Server,
  Terminal,
  Laptop,
  Flame,
} from "lucide-react";

interface MutationWarningModalProps {
  isOpen: boolean;
  onDeny: () => void;
  onGrant: () => void;
  sqlSnippet: string;
  targetTable?: string;
  mutationType?: string;
  clientIp?: string;
  clientDevice?: string;
}

export const MutationWarningModal: React.FC<MutationWarningModalProps> = ({
  isOpen,
  onDeny,
  onGrant,
  sqlSnippet,
  targetTable = "users",
  mutationType = "DML Mutation / Deletion",
  clientIp = "192.168.1.104",
  clientDevice = "Chrome 128 (macOS Sequoia) / Session ID: #SEC-984",
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-200">
      <div
        className="relative w-full max-w-xl rounded-2xl bg-[#0d121f] border border-rose-500/40 shadow-2xl shadow-rose-950/60 overflow-hidden text-slate-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Warning Banner Glow */}
        <div className="h-1.5 w-full bg-gradient-to-r from-amber-500 via-rose-500 to-red-600 animate-pulse" />

        {/* Modal Header */}
        <div className="p-6 pb-4">
          <div className="flex items-start justify-between">
            <div className="flex items-start space-x-3.5">
              <div className="p-3 rounded-xl bg-rose-500/15 border border-rose-500/40 text-rose-400 shadow-inner">
                <ShieldAlert className="w-7 h-7 animate-bounce" />
              </div>
              <div>
                <div className="inline-flex items-center space-x-1.5 px-2.5 py-0.5 rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/40 text-[11px] font-semibold tracking-wide uppercase mb-1">
                  <Flame className="w-3 h-3 text-rose-400" />
                  <span>Permission Escalation Required: Mutation Detected</span>
                </div>
                <h2 className="text-lg font-bold text-white tracking-tight">
                  Dangerous Operation Intercepted
                </h2>
                <p className="text-xs text-slate-400 mt-0.5">
                  SchemaAI Query Guard blocked an unprivileged DDL/DML mutation from executing automatically.
                </p>
              </div>
            </div>
            <button
              onClick={onDeny}
              className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Content Details */}
        <div className="px-6 py-2 space-y-4">
          {/* Metadata Grid */}
          <div className="grid grid-cols-2 gap-3 p-3.5 rounded-xl bg-slate-900/90 border border-slate-800 text-xs">
            <div className="space-y-1">
              <span className="text-slate-400 text-[11px] flex items-center gap-1">
                <Server className="w-3 h-3 text-cyan-400" /> Target Table
              </span>
              <p className="font-mono font-semibold text-cyan-300">
                public.{targetTable}
              </p>
            </div>

            <div className="space-y-1">
              <span className="text-slate-400 text-[11px] flex items-center gap-1">
                <AlertTriangle className="w-3 h-3 text-amber-400" /> Operation Type
              </span>
              <p className="font-mono font-semibold text-rose-400">
                {mutationType}
              </p>
            </div>

            <div className="space-y-1">
              <span className="text-slate-400 text-[11px] flex items-center gap-1">
                <Terminal className="w-3 h-3 text-indigo-400" /> Client IP
              </span>
              <p className="font-mono text-slate-300">{clientIp}</p>
            </div>

            <div className="space-y-1">
              <span className="text-slate-400 text-[11px] flex items-center gap-1">
                <Laptop className="w-3 h-3 text-purple-400" /> Origin Device
              </span>
              <p className="font-mono text-slate-300 truncate" title={clientDevice}>
                {clientDevice}
              </p>
            </div>
          </div>

          {/* SQL Payload Code Preview */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-xs text-slate-400">
              <span className="font-medium text-slate-300">Intercepted SQL Payload</span>
              <span className="text-[10px] text-rose-400 font-mono">
                Risk Level: CRITICAL
              </span>
            </div>
            <div className="relative rounded-xl bg-black/80 border border-slate-800 p-3.5 font-mono text-xs text-rose-200 overflow-x-auto">
              <pre className="whitespace-pre-wrap">{sqlSnippet}</pre>
            </div>
          </div>

          {/* Warning Message */}
          <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-300/90 text-xs flex items-start space-x-2">
            <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
            <p>
              Granting execution will permanently alter or delete database records. Ensure this operation is compliant with audit logging policies.
            </p>
          </div>
        </div>

        {/* Modal Actions */}
        <div className="p-6 pt-4 flex items-center justify-end space-x-3 bg-slate-900/60 border-t border-slate-800/80 mt-2">
          <button
            type="button"
            onClick={onDeny}
            className="flex items-center space-x-2 px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-rose-950 hover:text-rose-200 hover:border-rose-700/80 border border-slate-700 text-slate-300 text-xs font-semibold transition-all duration-200"
          >
            <Ban className="w-4 h-4 text-rose-400" />
            <span>Deny Query (Block & Log)</span>
          </button>

          <button
            type="button"
            onClick={onGrant}
            className="flex items-center space-x-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-semibold shadow-lg shadow-emerald-600/30 transition-all duration-200"
          >
            <Check className="w-4 h-4" />
            <span>Grant Privilege & Execute</span>
          </button>
        </div>
      </div>
    </div>
  );
};
