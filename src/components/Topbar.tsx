"use client";

import React, { useState, useRef, useEffect } from "react";
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
  LogIn,
  LogOut,
  User as UserIcon,
  Unplug,
  Zap,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/context/AuthContext";
import { SettingsModal } from "@/components/SettingsModal";

interface TopbarProps {
  dbName?: string;
  dbType?: string;
  isConnected?: boolean;
  isLayoutCustomized?: boolean;
  onResetLayout?: () => void;
  onDisconnect?: () => void;
  onOpenSettings?: () => void;
}

export const Topbar: React.FC<TopbarProps> = ({
  dbName: propDbName,
  dbType: propDbType,
  isConnected: propIsConnected,
  isLayoutCustomized = false,
  onResetLayout,
  onDisconnect,
  onOpenSettings,
}) => {
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const { user, signOutUser } = useAuth();
  const [internalConnected, setInternalConnected] = useState<boolean>(false);
  const [internalDbName, setInternalDbName] = useState<string>(propDbName || "");
  const [internalDbType, setInternalDbType] = useState<string>(propDbType || "");

  const handleOpenSettingsModal = (e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (onOpenSettings) {
      onOpenSettings();
    } else {
      setIsSettingsOpen(true);
    }
  };

  // Sync internal state with localStorage
  useEffect(() => {
    const handleStorageChange = () => {
      if (typeof window !== "undefined") {
        const stored = localStorage.getItem("schemaai_db_connected");
        const isConn = stored === "true";
        setInternalConnected(isConn);
        try {
          const cfg = localStorage.getItem("schemaai_db_config");
          if (cfg) {
            const parsed = JSON.parse(cfg);
            if (parsed && typeof parsed === "object") {
              setInternalDbType(parsed.dbType || "");
              setInternalDbName(
                parsed.databaseName || parsed.sqlitePath || ""
              );
            }
          }
        } catch (_) {}
      }
    };

    handleStorageChange();

    const handleGlobalOpenSettings = () => {
      handleOpenSettingsModal();
    };

    window.addEventListener("schemaai_db_changed", handleStorageChange);
    window.addEventListener("schemaai_open_settings", handleGlobalOpenSettings);
    window.addEventListener("storage", handleStorageChange);
    return () => {
      window.removeEventListener("schemaai_db_changed", handleStorageChange);
      window.removeEventListener("schemaai_open_settings", handleGlobalOpenSettings);
      window.removeEventListener("storage", handleStorageChange);
    };
  }, [onOpenSettings]);

  const isConnected = propIsConnected !== undefined ? propIsConnected : internalConnected;
  const currentDbType = (propDbType && propDbType !== "Database" ? propDbType : internalDbType) || (isConnected ? "Database" : "Database");
  const currentDbName = propDbName || internalDbName || (isConnected ? "Connected" : "Not Connected");

  const handleDisconnect = (e: React.MouseEvent) => {
    e.stopPropagation();
    setInternalConnected(false);
    if (typeof window !== "undefined") {
      localStorage.setItem("schemaai_db_connected", "false");
      localStorage.removeItem("schemaai_introspected_schema");
      window.dispatchEvent(new Event("schemaai_db_changed"));
    }
    if (onDisconnect) {
      onDisconnect();
    }
  };

  // Close dropdown when clicked outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setUserDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

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
      badge: internalConnected ? "Live Schema" : "Not Connected",
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

          {/* Database Connection Status Pill & Disconnect Button */}
          <div
            className="hidden lg:flex items-center space-x-2 px-3 py-1.5 rounded-xl bg-[#151518] border border-[#222226] text-xs sm:text-sm text-zinc-300 shadow-sm shrink-0"
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
            <span className="text-zinc-200 font-mono font-medium">
              {isConnected ? currentDbType : "Database"}
            </span>
            <span className="text-zinc-600">•</span>
            <span className="font-mono text-zinc-400 truncate max-w-[130px]">
              {isConnected ? (currentDbName || "Connected") : "Not Connected"}
            </span>

            {/* Disconnect or Connect Button directly beside the database name */}
            {isConnected ? (
              <button
                type="button"
                onClick={handleDisconnect}
                className="ml-1.5 flex items-center space-x-1 px-2 py-0.5 rounded-md bg-rose-500/10 hover:bg-rose-500/20 active:bg-rose-500/30 border border-rose-500/20 text-rose-300 hover:text-rose-200 text-[11px] font-medium transition-all cursor-pointer select-none"
                title="Disconnect database"
              >
                <Unplug className="w-3 h-3 text-rose-400 shrink-0" />
                <span>Disconnect</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={handleOpenSettingsModal}
                className="ml-1.5 flex items-center space-x-1 px-2 py-0.5 rounded-md bg-[#38bdf8]/10 hover:bg-[#38bdf8]/20 border border-[#38bdf8]/25 text-[#38bdf8] text-[11px] font-medium transition-all cursor-pointer select-none"
                title="Open Settings to connect a database"
              >
                <Zap className="w-3 h-3 text-[#38bdf8] shrink-0" />
                <span>Connect</span>
              </button>
            )}
          </div>

          {/* User Profile Avatar / Sign In Button */}
          {user ? (
            <div className="relative flex items-center pl-1 shrink-0" ref={dropdownRef}>
              <button
                type="button"
                onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                className="w-8 h-8 rounded-full bg-[#18181c] border border-white/[0.12] hover:border-sky-500/50 flex items-center justify-center font-semibold text-xs text-zinc-200 cursor-pointer overflow-hidden transition-all shadow-sm focus:outline-none"
                title={user.displayName || user.email || "User Profile"}
              >
                {user.photoURL ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={user.photoURL}
                    alt={user.displayName || "User"}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <span>
                    {(user.displayName || user.email || "U")
                      .slice(0, 2)
                      .toUpperCase()}
                  </span>
                )}
              </button>

              {/* User Dropdown Menu */}
              {userDropdownOpen && (
                <div className="absolute right-0 top-11 w-56 rounded-2xl bg-[#141418] border border-white/[0.1] shadow-2xl p-2 z-50 animate-in fade-in zoom-in-95 duration-150 select-none">
                  <div className="px-3 py-2 border-b border-white/[0.06] mb-1">
                    <p className="text-xs font-semibold text-zinc-100 truncate">
                      {user.displayName || "Database User"}
                    </p>
                    <p className="text-[11px] text-zinc-400 truncate">
                      {user.email || "Authenticated via Google"}
                    </p>
                  </div>

                  <button
                    onClick={(e) => {
                      setUserDropdownOpen(false);
                      handleOpenSettingsModal(e);
                    }}
                    className="w-full flex items-center space-x-2 px-3 py-2 rounded-xl text-xs font-medium text-zinc-300 hover:text-white hover:bg-white/[0.06] transition-colors cursor-pointer text-left"
                  >
                    <Settings className="w-3.5 h-3.5 text-zinc-400" />
                    <span>Database Settings</span>
                  </button>

                  <button
                    onClick={() => {
                      setUserDropdownOpen(false);
                      signOutUser();
                    }}
                    className="w-full flex items-center space-x-2 px-3 py-2 rounded-xl text-xs font-medium text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 transition-colors cursor-pointer text-left"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    <span>Sign Out</span>
                  </button>
                </div>
              )}
            </div>
          ) : (
            <Link
              href="/login"
              className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-white/[0.05] hover:bg-white/[0.1] border border-white/[0.08] text-zinc-200 hover:text-white text-xs sm:text-sm font-medium transition-all shadow-sm cursor-pointer"
            >
              <LogIn className="w-3.5 h-3.5 text-[#38bdf8]" />
              <span>Sign In</span>
            </Link>
          )}
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
                <span
                  className={cn(
                    "w-2.5 h-2.5 rounded-full",
                    isConnected ? "bg-[#38bdf8] shadow-[0_0_8px_#38bdf8]" : "bg-rose-500"
                  )}
                />
                <span className="font-mono text-[#38bdf8] font-medium">
                  {isConnected ? currentDbType : "Database"}
                </span>
                <span className="text-zinc-500">•</span>
                <span className="font-mono text-zinc-300 text-xs">
                  {isConnected ? (currentDbName || "Connected") : "Not Connected"}
                </span>
              </div>
              {isConnected ? (
                <button
                  type="button"
                  onClick={handleDisconnect}
                  className="flex items-center space-x-1.5 px-2.5 py-1 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/25 text-rose-300 text-xs font-medium cursor-pointer"
                >
                  <Unplug className="w-3.5 h-3.5 text-rose-400" />
                  <span>Disconnect</span>
                </button>
              ) : (
                <button
                  type="button"
                  onClick={(e) => {
                    setMobileMenuOpen(false);
                    handleOpenSettingsModal(e);
                  }}
                  className="flex items-center space-x-1.5 px-2.5 py-1 rounded-lg bg-[#38bdf8]/10 hover:bg-[#38bdf8]/20 border border-[#38bdf8]/25 text-[#38bdf8] text-xs font-medium cursor-pointer"
                >
                  <Zap className="w-3.5 h-3.5 text-[#38bdf8]" />
                  <span>Connect</span>
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Self-contained Settings Modal for routes that do not pass onOpenSettings */}
      {!onOpenSettings && (
        <SettingsModal
          isOpen={isSettingsOpen}
          onClose={() => setIsSettingsOpen(false)}
          onSave={() => {
            setIsSettingsOpen(false);
            setInternalConnected(true);
          }}
        />
      )}
    </>
  );
};

