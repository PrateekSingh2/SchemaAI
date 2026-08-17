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
      badge: "6 Tables",
    },
    {
      id: "query" as ActiveTab,
      label: "Query Studio",
      icon: TerminalSquare,
      badge: "AI Powered",
    },
    {
      id: "logs" as ActiveTab,
      label: "Audit Logs",
      icon: ShieldCheck,
      badge: "Security Guard",
    },
  ];

  return (
    <header className="h-16 border-b border-slate-800/80 bg-[#0a0f1d]/90 backdrop-blur-md px-4 sm:px-6 flex items-center justify-between z-30 sticky top-0">
      {/* Brand & Logo */}
      <div className="flex items-center space-x-6">
        <div className="flex items-center space-x-3 cursor-pointer group">
          <div className="relative flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-tr from-cyan-600 via-indigo-600 to-violet-600 shadow-lg shadow-cyan-500/20 group-hover:shadow-cyan-500/40 transition-all duration-300">
            <Database className="w-5 h-5 text-white" />
            <Sparkles className="w-3.5 h-3.5 text-amber-300 absolute -top-1 -right-1 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center space-x-1.5">
              <span className="font-bold text-lg tracking-tight bg-gradient-to-r from-white via-slate-100 to-cyan-300 bg-clip-text text-transparent">
                SchemaAI
              </span>
              <span className="text-[10px] uppercase font-semibold tracking-wider px-1.5 py-0.5 rounded bg-cyan-500/10 text-cyan-400 border border-cyan-500/30">
                v1.0
              </span>
            </div>
            <p className="text-[11px] text-slate-400 hidden sm:block">
              Intelligent Natural Language Query Engine
            </p>
          </div>
        </div>

        {/* Tab Navigation Controls */}
        <nav className="flex items-center space-x-1 bg-slate-900/90 p-1 rounded-xl border border-slate-800/80 shadow-inner">
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
                    ? "bg-gradient-to-r from-cyan-500/15 to-indigo-500/15 text-cyan-300 border border-cyan-500/30 shadow-sm"
                    : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/50"
                )}
              >
                <Icon
                  className={cn(
                    "w-4 h-4 transition-colors",
                    isActive ? "text-cyan-400" : "text-slate-400"
                  )}
                />
                <span>{tab.label}</span>
                {isActive && (
                  <span className="hidden md:inline-flex text-[10px] px-1.5 py-0.2 rounded-full bg-cyan-500/20 text-cyan-300 font-mono">
                    {tab.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Right Controls: Connection Status, Settings & Avatar */}
      <div className="flex items-center space-x-3 sm:space-x-4">
        {/* Database Connection Pill */}
        <div
          onClick={onOpenSettings}
          className="hidden md:flex items-center space-x-2.5 px-3 py-1.5 rounded-lg bg-slate-900/80 border border-slate-800 hover:border-slate-700 text-xs text-slate-300 cursor-pointer transition-all hover:bg-slate-850 group"
          title="Click to configure Database settings"
        >
          <div className="flex items-center space-x-1.5">
            <span
              className={cn(
                "w-2 h-2 rounded-full",
                isConnected
                  ? "bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.8)] animate-live-pulse"
                  : "bg-rose-500"
              )}
            />
            <span className="font-medium text-slate-200">{dbType}</span>
          </div>
          <span className="text-slate-600">|</span>
          <div className="flex items-center space-x-1 text-slate-400 group-hover:text-cyan-300 transition-colors">
            <Server className="w-3.5 h-3.5" />
            <span className="font-mono text-[11px] truncate max-w-[110px]">
              {dbName}
            </span>
          </div>
          <ChevronDown className="w-3 h-3 text-slate-500 group-hover:text-slate-300 transition-transform" />
        </div>

        {/* Settings Gear Button */}
        <button
          onClick={onOpenSettings}
          className="relative p-2 rounded-lg bg-slate-900 border border-slate-800 hover:border-slate-700 text-slate-400 hover:text-cyan-400 hover:bg-slate-800 transition-all duration-200 shadow-sm group"
          title="Open Database & LLM Configuration"
        >
          <Settings className="w-4 h-4 group-hover:rotate-45 transition-transform duration-300" />
          <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-cyan-400 shadow-[0_0_6px_#38bdf8]" />
        </button>

        {/* User Profile Avatar */}
        <div className="flex items-center space-x-2 pl-1">
          <div className="relative w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 p-[1.5px] cursor-pointer shadow-md">
            <div className="w-full h-full rounded-[6px] bg-slate-950 flex items-center justify-center font-semibold text-xs text-indigo-200">
              AD
            </div>
            <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-emerald-500 border-2 border-slate-950" />
          </div>
        </div>
      </div>
    </header>
  );
};
