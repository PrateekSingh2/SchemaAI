"use client";

import React from "react";
import {
  Database,
  AlertTriangle,
  ArrowRight,
  X,
  CheckCircle2,
  Settings,
} from "lucide-react";

interface DatabaseRequiredModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenSettings: () => void;
  cachedPrompt?: string;
}

export const DatabaseRequiredModal: React.FC<DatabaseRequiredModalProps> = ({
  isOpen,
  onClose,
  onOpenSettings,
  cachedPrompt = "",
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200 select-none">
      <div
        className="relative w-full max-w-md rounded-[22px] bg-[#141418]/95 backdrop-blur-2xl border border-white/[0.1] shadow-[0_32px_64px_-16px_rgba(0,0,0,0.8),0_1px_0_rgba(255,255,255,0.08)_inset] p-6 sm:p-7 space-y-6 text-[#f4f4f5] animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Accent Line */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-amber-500 via-sky-500 to-indigo-500 rounded-t-[22px]" />

        {/* Header with Icon and Close Button */}
        <div className="flex items-start justify-between">
          <div className="flex items-center space-x-3.5">
            <div className="p-3 rounded-2xl bg-amber-500/15 border border-amber-500/30 text-amber-400 shadow-lg shadow-amber-500/10 shrink-0">
              <Database className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-semibold text-zinc-100 tracking-tight">
                Database Not Connected
              </h3>
              <p className="text-xs text-zinc-400">
                Connection required before generating queries
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-zinc-400 hover:text-white hover:bg-white/[0.08] transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Explanation Message */}
        <p className="text-xs sm:text-sm text-zinc-300 leading-relaxed">
          SchemaAI needs an active database connection to inspect your schema tables, validate column types, and safely execute SQL queries.
        </p>

        {/* Prompt Saved Assurance Banner */}
        {cachedPrompt && (
          <div className="p-3.5 rounded-xl bg-white/[0.04] border border-white/[0.08] space-y-1.5">
            <div className="flex items-center space-x-2 text-xs font-medium text-sky-400">
              <CheckCircle2 className="w-3.5 h-3.5 text-sky-400 shrink-0" />
              <span>Prompt safely saved in cache</span>
            </div>
            <p className="text-xs text-zinc-400 italic line-clamp-2 pl-5 font-mono select-text">
              &quot;{cachedPrompt}&quot;
            </p>
            <p className="text-[11px] text-zinc-500 pl-5">
              You will not lose your work. Your prompt will be waiting right here when you return.
            </p>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex items-center space-x-3 pt-2">
          <button
            onClick={onClose}
            className="flex-1 py-2.5 px-4 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.08] text-zinc-300 hover:text-white text-xs sm:text-sm font-medium transition-all cursor-pointer"
          >
            Cancel
          </button>

          <button
            onClick={() => {
              onClose();
              onOpenSettings();
            }}
            className="flex-1 flex items-center justify-center space-x-2 py-2.5 px-4 rounded-xl bg-gradient-to-b from-sky-400 to-sky-500 hover:from-sky-300 hover:to-sky-400 active:scale-95 text-slate-950 text-xs sm:text-sm font-semibold shadow-lg shadow-sky-500/25 transition-all cursor-pointer"
          >
            <Settings className="w-4 h-4 text-slate-950" />
            <span>Connect Database</span>
          </button>
        </div>
      </div>
    </div>
  );
};
