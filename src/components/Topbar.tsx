"use client";

import React from "react";
import {
  Database,
  Network,
  TerminalSquare,
  ShieldCheck,
  Settings,
  Sparkles,
  Server,
  ChevronDown,
  Activity,
  Layers,
} from "lucide-react";
import { cn } from "@/lib/utils";

export type ActiveTab = "schema" | "query" | "logs";

interface TopbarProps {
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
  onOpenSettings: () => void;
  dbName?: string;
  dbType?: string;
  isConnected?: boolean;
}

export const Topbar: React.FC<TopbarProps> = ({
  activeTab,
  setActiveTab,
  onOpenSettings,
  dbName = "production_core_db",
  dbType = "PostgreSQL",
  isConnected = true,
}) => {
  const tabs = [
    {
      id: "schema" as ActiveTab,
      label: "Schema Explorer",
      icon: Network,
      badge: "6 tables",
    },
    {
      id: "query" as ActiveTab,
      label: "Query Studio",
      icon: TerminalSquare,
      badge: "AI Copilot",
    },
    {
      id: "logs" as ActiveTab,
      label: "Audit Logs",
      icon: ShieldCheck,
      badge: "Active Guard",
    },
  ];

  return (
    <header className="h-16 border-b border-white/[0.08] bg-[#070b14]/90 backdrop-blur-xl px-4 sm:px-6 flex items-center justify-between z-30 sticky top-0">
      {/* Brand & Logo */}
      <div className="flex items-center space-x-6">
        <div className="flex items-center space-x-3 cursor-pointer group">
          <div className="relative flex items-center justify-center w-9 h-9 rounded-xl bg-gradient-to-tr from-cyan-500 via-indigo-500 to-violet-500 shadow-md shadow-cyan-500/20 group-hover:shadow-cyan-500/35 transition-all duration-300">
            <Database className="w-4.5 h-4.5 text-white" />
            <Sparkles className="w-3 h-3 text-amber-300 absolute -top-1 -right-1 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="font-bold text-base tracking-tight bg-gradient-to-r from-white via-slate-100 to-cyan-200 bg-clip-text text-transparent">
                SchemaAI
              </span>
              <span className="text-[10px] font-mono font-semibold tracking-wide px-1.5 py-0.5 rounded-md bg-cyan-500/10 text-cyan-400 border border-cyan-500/30">
                PROTOTYPE
              </span>
            </div>
            <p className="text-[11px] text-slate-400 hidden sm:block font-medium">
              NL to SQL / GraphQL Query Platform
            </p>
          </div>
        </div>

        <div className="hidden lg:block h-5 w-[1px] bg-white/[0.08]" />

        {/* Tab Navigation Segmented Control */}
        <nav className="flex items-center space-x-1 bg-slate-950/70 p-1 rounded-xl border border-white/[0.06] shadow-inner">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  "relative flex items-center space-x-2 px-3.5 py-1.5 rounded-lg text-xs font-medium transition-all duration-200",
                  isActive
                    ? "bg-gradient-to-r from-cyan-500/15 to-indigo-500/15 text-white border border-cyan-500/40 shadow-sm shadow-cyan-500/10"
                    : "text-slate-400 hover:text-slate-200 hover:bg-white/[0.03]"
                )}
              >
                <Icon
                  className={cn(
                    "w-3.5 h-3.5 transition-colors",
                    isActive ? "text-cyan-400" : "text-slate-400"
                  )}
                />
                <span className={isActive ? "font-semibold text-slate-100" : ""}>{tab.label}</span>
                {isActive && (
                  <span className="hidden md:inline-flex text-[10px] px-1.5 py-0.2 rounded-md bg-cyan-500/20 text-cyan-300 font-mono">
                    {tab.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Right Controls: Connection Status, Settings & Avatar */}
      <div className="flex items-center space-x-3">
        {/* Database Connection Status Pill */}
        <button
          onClick={onOpenSettings}
          className="hidden md:flex items-center space-x-2.5 px-3 py-1.5 rounded-xl bg-slate-950/70 border border-white/[0.08] hover:border-slate-700 text-xs text-slate-300 transition-all hover:bg-slate-900 group"
          title="Click to configure Database & LLM settings"
        >
          <div className="relative flex items-center justify-center">
            <span
              className={cn(
                "w-2 h-2 rounded-full",
                isConnected ? "bg-emerald-400 shadow-[0_0_8px_#34d399]" : "bg-rose-500"
              )}
            />
            {isConnected && (
              <span className="absolute w-4 h-4 rounded-full bg-emerald-400/30 animate-pulse-ring" />
            )}
          </div>
          <span className="font-semibold text-slate-200">{dbType}</span>
          <span className="text-slate-600 font-mono">•</span>
          <div className="flex items-center space-x-1 text-slate-400 group-hover:text-cyan-300 transition-colors">
            <Server className="w-3.5 h-3.5 text-slate-500" />
            <span className="font-mono text-[11px] truncate max-w-[120px]">
              {dbName}
            </span>
          </div>
          <ChevronDown className="w-3 h-3 text-slate-500 group-hover:text-slate-300 transition-transform" />
        </button>

        {/* Settings Gear Button */}
        <button
          onClick={onOpenSettings}
          className="relative p-2 rounded-xl bg-slate-950/70 border border-white/[0.08] hover:border-slate-700 text-slate-400 hover:text-cyan-300 hover:bg-slate-900 transition-all duration-200 group shadow-sm"
          title="Database & AI Settings"
        >
          <Settings className="w-4 h-4 group-hover:rotate-45 transition-transform duration-300" />
          <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 rounded-full bg-cyan-400 shadow-[0_0_6px_#38bdf8]" />
        </button>

        {/* User Profile Avatar */}
        <div className="flex items-center space-x-2 pl-1">
          <div className="relative w-8 h-8 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 p-[1.5px] cursor-pointer shadow-md hover:shadow-indigo-500/20 transition-shadow">
            <div className="w-full h-full rounded-[10px] bg-slate-950 flex items-center justify-center font-bold text-xs text-indigo-200">
              AI
            </div>
            <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-emerald-500 border-2 border-slate-950 shadow-sm" />
          </div>
        </div>
      </div>
    </header>
  );
};
