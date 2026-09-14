"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Database,
  Network,
  TerminalSquare,
  ShieldCheck,
  Settings,
  Sparkles,
  Server,
  ChevronDown,
  RotateCcw,
  Menu,
  X,
  Radio,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface TopbarProps {
  dbName?: string;
  dbType?: string;
  isConnected?: boolean;
  isLayoutCustomized?: boolean;
  onResetLayout?: () => void;
}

export const Topbar: React.FC<TopbarProps> = ({
  dbName = "production_core_db",
  dbType = "PostgreSQL",
  isConnected = true,
  isLayoutCustomized = false,
  onResetLayout,
}) => {
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const tabs = [
    {
      href: "/",
      label: "Query Studio",
      icon: TerminalSquare,
      badge: "AI Copilot",
      isActive: pathname === "/",
    },
    {
      href: "/schema",
      label: "Schema Explorer",
      icon: Network,
      badge: "6 tables",
      isActive: pathname.startsWith("/schema"),
    },
    {
      href: "/logs",
      label: "Audit Logs",
      icon: ShieldCheck,
      badge: "Active Guard",
      isActive: pathname.startsWith("/logs"),
    },
  ];

  return (
    <>
      <header className="h-14 sm:h-16 border-b border-[#1e1e24] bg-[#0e0e11]/95 backdrop-blur-xl px-4 sm:px-6 flex items-center justify-between z-30 sticky top-0 shrink-0 shadow-sm min-w-0">
        {/* Brand & Breadcrumbs */}
        <div className="flex items-center space-x-3 sm:space-x-5 min-w-0">
          {/* Mobile Menu Button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 rounded-xl bg-[#151518] border border-[#222226] text-zinc-300 hover:text-white hover:bg-[#1a1a1f] transition-all cursor-pointer"
            aria-label="Toggle Navigation Menu"
          >
            {mobileMenuOpen ? <X className="w-5 h-5 text-zinc-200" /> : <Menu className="w-5 h-5 text-zinc-200" />}
          </button>

          <Link href="/" className="flex items-center space-x-2.5 cursor-pointer group shrink-0">
            <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-[#18181c] border border-[#27272f] text-zinc-200 group-hover:text-white group-hover:border-zinc-500 transition-all">
              <Database className="w-4.5 h-4.5 text-[#38bdf8]" />
            </div>
            <div className="flex items-center space-x-2 text-sm text-zinc-400">
              <span className="text-zinc-100 font-semibold text-base">SchemaAI</span>
              <span className="text-zinc-600">/</span>
              <span className="text-zinc-300 font-normal hidden sm:inline">Query Studio</span>
            </div>
          </Link>

          <div className="hidden md:block h-5 w-[1px] bg-[#1e1e24] shrink-0" />

          {/* Desktop/Tablet Tab Navigation */}
          <nav className="hidden md:flex items-center space-x-1.5 bg-[#121215] p-1 rounded-xl border border-[#1e1e24] shrink-0">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <Link
                  key={tab.href}
                  href={tab.href}
                  className={cn(
                    "relative flex items-center space-x-2 px-3.5 py-1.5 rounded-lg text-sm transition-all duration-150 shrink-0 cursor-pointer",
                    tab.isActive
                      ? "bg-[#1c1c22] text-[#f4f4f5] font-medium shadow-sm"
                      : "text-zinc-400 hover:text-zinc-200 hover:bg-[#16161a]"
                  )}
                >
                  <Icon
                    className={cn(
                      "w-4 h-4 transition-colors shrink-0",
                      tab.isActive ? "text-[#38bdf8]" : "text-zinc-500"
                    )}
                  />
                  <span>{tab.label}</span>
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Right Controls */}
        <div className="flex items-center space-x-2 sm:space-x-3 shrink-0">
          {/* Reset View Button */}
          {isLayoutCustomized && onResetLayout && (
            <button
              onClick={onResetLayout}
              className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-[#151518] border border-[#222226] hover:border-zinc-600 text-zinc-300 hover:text-white text-xs sm:text-sm transition-all shadow-sm cursor-pointer"
              title="Reset workspace layout"
            >
              <RotateCcw className="w-3.5 h-3.5 text-zinc-400" />
              <span className="hidden md:inline">Reset View</span>
            </button>
          )}

          {/* Database Connection Status Pill */}
          <div
            className="hidden lg:flex items-center space-x-2.5 px-3 py-1.5 rounded-xl bg-[#151518] border border-[#222226] text-xs sm:text-sm text-zinc-300 shadow-sm shrink-0"
            title="Database Connection"
          >
            <div className="relative flex items-center justify-center shrink-0">
              <span
                className={cn(
                  "w-2 h-2 rounded-full",
                  isConnected ? "bg-[#38bdf8] shadow-[0_0_6px_#38bdf8]" : "bg-rose-500"
                )}
              />
            </div>
            <span className="text-zinc-200 font-mono font-medium">{dbType}</span>
            <span className="text-zinc-600">•</span>
            <span className="font-mono text-zinc-400 truncate max-w-[120px]">{dbName}</span>
          </div>

          {/* User Profile Avatar */}
          <div className="flex items-center pl-1 shrink-0">
            <div className="w-8 h-8 rounded-full bg-[#202026] border border-[#27272f] flex items-center justify-center font-semibold text-xs text-zinc-200 cursor-pointer">
              SB
            </div>
          </div>
        </div>
      </header>

      {/* Mobile Slide-Over Navigation Drawer */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-40 md:hidden flex flex-col animate-in fade-in duration-200">
          <div
            className="fixed inset-0 bg-black/75 backdrop-blur-md"
            onClick={() => setMobileMenuOpen(false)}
          />
          <div className="relative w-full bg-[#141210] border-b border-[#26221F] p-4 shadow-2xl space-y-4 z-50 animate-in slide-in-from-top-4 duration-200">
            <div className="flex items-center justify-between pb-3 border-b border-[#26221F]">
              <div className="flex items-center space-x-2">
                <Radio className="w-5 h-5 text-[#38bdf8] animate-pulse" />
                <span className="font-semibold text-sm text-zinc-100 uppercase tracking-wider">
                  SchemaAI Navigation
                </span>
              </div>
              <button
                onClick={() => setMobileMenuOpen(false)}
                className="p-1.5 rounded-xl text-zinc-400 hover:text-white cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Mobile Nav Links */}
            <div className="grid grid-cols-1 gap-2">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                return (
                  <Link
                    key={tab.href}
                    href={tab.href}
                    onClick={() => setMobileMenuOpen(false)}
                    className={cn(
                      "flex items-center justify-between p-3.5 rounded-xl text-sm font-medium transition-all",
                      tab.isActive
                        ? "bg-[#18181c] text-[#38bdf8] border border-[#38bdf8]/30 shadow-md"
                        : "text-zinc-300 hover:bg-[#16161a] border border-transparent"
                    )}
                  >
                    <div className="flex items-center space-x-3">
                      <Icon className={cn("w-5 h-5", tab.isActive ? "text-[#38bdf8]" : "text-zinc-400")} />
                      <span className="font-medium text-zinc-100">{tab.label}</span>
                    </div>
                    <span className="text-xs px-2.5 py-0.5 rounded-full bg-[#38bdf8]/15 text-[#38bdf8] font-mono">
                      {tab.badge}
                    </span>
                  </Link>
                );
              })}
            </div>

            {/* Mobile Database Connection Banner */}
            <div className="flex items-center justify-between p-3.5 rounded-xl bg-[#16161a] border border-[#222226] text-sm text-zinc-300">
              <div className="flex items-center space-x-2.5">
                <span className="w-2.5 h-2.5 rounded-full bg-[#38bdf8] shadow-[0_0_8px_#38bdf8]" />
                <span className="font-mono text-[#38bdf8] font-medium">{dbType}</span>
                <span className="text-zinc-500">•</span>
                <span className="font-mono text-zinc-300 text-xs">{dbName}</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

