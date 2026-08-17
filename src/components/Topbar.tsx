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
    <header className="h-16 border-b border-[#292524] bg-[#171513]/90 backdrop-blur-2xl px-4 sm:px-6 flex items-center justify-between z-30 sticky top-0 shadow-sm">
      {/* Brand & Logo */}
      <div className="flex items-center space-x-6">
        <div className="flex items-center space-x-3 cursor-pointer group">
          <div className="relative flex items-center justify-center w-9 h-9 rounded-2xl bg-gradient-to-tr from-[#3ecf8e] via-[#22c55e] to-emerald-600 shadow-md shadow-[#3ecf8e]/20 group-hover:shadow-[#3ecf8e]/35 transition-all duration-300">
            <Database className="w-4.5 h-4.5 text-[#0a1a12]" />
            <Sparkles className="w-3 h-3 text-amber-300 absolute -top-1 -right-1 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="font-bold text-base tracking-tight bg-gradient-to-r from-stone-100 via-stone-200 to-[#3ecf8e] bg-clip-text text-transparent">
                SchemaAI
              </span>
              <span className="text-[10px] font-mono font-semibold tracking-wide px-1.5 py-0.5 rounded-full bg-[#3ecf8e]/10 text-[#3ecf8e] border border-[#3ecf8e]/30">
                PROTOTYPE
              </span>
            </div>
            <p className="text-[11px] text-stone-400 hidden sm:block font-medium">
              Intelligent SQL/GraphQL Generator
            </p>
          </div>
        </div>

        <div className="hidden lg:block h-5 w-[1px] bg-[#292524]" />

        {/* Tab Navigation Segmented Control */}
        <nav className="flex items-center space-x-1 bg-[#141210]/90 p-1 rounded-2xl border border-[#292524] shadow-inner">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  "relative flex items-center space-x-2 px-3.5 py-1.5 rounded-xl text-xs font-medium transition-all duration-200",
                  isActive
                    ? "bg-[#1c1917] text-[#3ecf8e] border border-[#3ecf8e]/30 shadow-md shadow-black/40"
                    : "text-stone-400 hover:text-stone-200 hover:bg-stone-800/40"
                )}
              >
                <Icon
                  className={cn(
                    "w-3.5 h-3.5 transition-colors",
                    isActive ? "text-[#3ecf8e]" : "text-stone-400"
                  )}
                />
                <span className={isActive ? "font-semibold text-stone-100" : ""}>{tab.label}</span>
                {isActive && (
                  <span className="hidden md:inline-flex text-[10px] px-1.5 py-0.2 rounded-full bg-[#3ecf8e]/15 text-[#3ecf8e] font-mono">
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
          className="hidden md:flex items-center space-x-2.5 px-3.5 py-1.5 rounded-2xl bg-[#141210]/90 border border-[#292524] hover:border-stone-700 text-xs text-stone-300 transition-all hover:bg-[#1c1917] group shadow-inner"
          title="Click to configure Database & LLM settings"
        >
          <div className="relative flex items-center justify-center">
            <span
              className={cn(
                "w-2 h-2 rounded-full",
                isConnected ? "bg-[#3ecf8e] shadow-[0_0_8px_#3ecf8e]" : "bg-rose-500"
              )}
            />
            {isConnected && (
              <span className="absolute w-4 h-4 rounded-full bg-[#3ecf8e]/30 animate-emerald-pulse" />
            )}
          </div>
          <span className="font-semibold text-stone-200">{dbType}</span>
          <span className="text-stone-600 font-mono">•</span>
          <div className="flex items-center space-x-1 text-stone-400 group-hover:text-[#3ecf8e] transition-colors">
            <Server className="w-3.5 h-3.5 text-stone-500" />
            <span className="font-mono text-[11px] truncate max-w-[120px]">
              {dbName}
            </span>
          </div>
          <ChevronDown className="w-3 h-3 text-stone-500 group-hover:text-stone-300 transition-transform" />
        </button>

        {/* Settings Gear Button */}
        <button
          onClick={onOpenSettings}
          className="relative p-2 rounded-2xl bg-[#141210]/90 border border-[#292524] hover:border-stone-700 text-stone-400 hover:text-[#3ecf8e] hover:bg-[#1c1917] transition-all duration-200 group shadow-inner"
          title="Database & AI Settings"
        >
          <Settings className="w-4 h-4 group-hover:rotate-45 transition-transform duration-300" />
          <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 rounded-full bg-[#3ecf8e] shadow-[0_0_6px_#3ecf8e]" />
        </button>

        {/* User Profile Avatar */}
        <div className="flex items-center space-x-2 pl-1">
          <div className="relative w-8 h-8 rounded-2xl bg-gradient-to-br from-amber-700 to-stone-800 p-[1.5px] cursor-pointer shadow-md hover:shadow-amber-500/10 transition-shadow">
            <div className="w-full h-full rounded-[14px] bg-[#141210] flex items-center justify-center font-bold text-xs text-stone-200">
              SB
            </div>
            <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-[#3ecf8e] border-2 border-[#141210] shadow-sm" />
          </div>
        </div>
      </div>
    </header>
  );
};
