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
  AlertOctagon,
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
  clientDevice = "Chrome 128 (macOS Sequoia) / Session: #SEC-984",
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-xl animate-in fade-in duration-200">
      <div
        className="relative w-full max-w-xl rounded-2xl bg-[#171412] border border-rose-500/40 shadow-2xl shadow-rose-950/60 overflow-hidden text-stone-200 supabase-modal"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Hazard Accent Bar */}
        <div className="h-1.5 w-full bg-gradient-to-r from-amber-500 via-rose-500 to-red-600" />

        {/* Modal Header */}
        <div className="p-6 pb-4">
          <div className="flex items-start justify-between">
            <div className="flex items-start space-x-3.5">
              <div className="p-3 rounded-2xl bg-rose-500/15 border border-rose-500/30 text-rose-400 shadow-inner shrink-0">
                <ShieldAlert className="w-6 h-6 animate-pulse" />
              </div>
              <div className="space-y-1">
                <div className="inline-flex items-center space-x-1.5 px-2.5 py-0.5 rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/40 text-[10px] font-mono font-bold tracking-wider uppercase">
                  <Flame className="w-3 h-3 text-rose-400" />
                  <span>Permission Escalation Required: Mutation Detected</span>
                </div>
                <h2 className="text-base font-bold text-stone-100 tracking-tight">
                  Dangerous Operation Intercepted
                </h2>
                <p className="text-xs text-stone-400">
                  SchemaAI Query Guard intercepted an unprivileged write/drop command before database execution.
                </p>
              </div>
            </div>
            <button
              onClick={onDeny}
              className="p-1 rounded-xl text-stone-400 hover:text-stone-100 hover:bg-stone-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Metadata Details Grid */}
        <div className="px-6 py-2 space-y-4">
          <div className="grid grid-cols-2 gap-3 p-3.5 rounded-xl bg-[#141210] border border-[#292524] text-xs shadow-inner">
            <div className="space-y-1">
              <span className="text-stone-400 text-[11px] flex items-center gap-1.5">
                <Server className="w-3.5 h-3.5 text-[#3ecf8e]" /> Target Table
              </span>
              <p className="font-mono font-bold text-[#3ecf8e]">
                public.{targetTable}
              </p>
            </div>

            <div className="space-y-1">
              <span className="text-stone-400 text-[11px] flex items-center gap-1.5">
                <AlertOctagon className="w-3.5 h-3.5 text-amber-400" /> Operation Type
              </span>
              <p className="font-mono font-bold text-rose-400 truncate">
                {mutationType}
              </p>
            </div>

            <div className="space-y-1">
              <span className="text-stone-400 text-[11px] flex items-center gap-1.5">
                <Terminal className="w-3.5 h-3.5 text-purple-400" /> Client IP
              </span>
              <p className="font-mono text-stone-200">{clientIp}</p>
            </div>

            <div className="space-y-1">
              <span className="text-stone-400 text-[11px] flex items-center gap-1.5">
                <Laptop className="w-3.5 h-3.5 text-amber-400" /> Origin Device
              </span>
              <p className="font-mono text-stone-200 truncate" title={clientDevice}>
                {clientDevice}
              </p>
            </div>
          </div>

          {/* SQL Payload Preview */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-xs text-stone-400">
              <span className="font-semibold text-stone-300">Intercepted SQL Payload</span>
              <span className="text-[10px] text-rose-400 font-mono font-bold bg-rose-500/10 px-2 py-0.5 rounded-full border border-rose-500/20">
                RISK: CRITICAL
              </span>
            </div>
            <div className="relative rounded-xl bg-black/90 border border-[#292524] p-3.5 font-mono text-xs text-rose-200 overflow-x-auto shadow-inner">
              <pre className="whitespace-pre-wrap leading-relaxed">{sqlSnippet}</pre>
            </div>
          </div>

          {/* Warning Message */}
          <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-300 text-xs flex items-start space-x-2.5">
            <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
            <p className="leading-normal">
              Executing this statement will mutate table state. This action is recorded with cryptographic signature in immutable Audit Logs.
            </p>
          </div>
        </div>

        {/* Modal Action Controls */}
        <div className="p-6 pt-4 flex items-center justify-end space-x-3 bg-[#141210] border-t border-[#292524] mt-3">
          <button
            type="button"
            onClick={onDeny}
            className="flex items-center space-x-2 px-4 py-2.5 rounded-xl bg-[#1c1917] hover:bg-rose-950/60 hover:text-rose-200 hover:border-rose-700/60 border border-[#292524] text-stone-300 text-xs font-semibold transition-all duration-200"
          >
            <Ban className="w-4 h-4 text-rose-400" />
            <span>Deny (Block & Log)</span>
          </button>

          <button
            type="button"
            onClick={onGrant}
            className="flex items-center space-x-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#3ecf8e] via-[#22c55e] to-emerald-500 hover:from-[#34d399] hover:to-[#16a34a] text-[#0a1a12] font-bold text-xs shadow-lg shadow-[#3ecf8e]/30 transition-all duration-200"
          >
            <Check className="w-4 h-4" />
            <span>Grant Privilege & Execute</span>
          </button>
        </div>
      </div>
    </div>
  );
};
