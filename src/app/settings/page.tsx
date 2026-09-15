"use client";

import React, { useState, useEffect } from "react";
import { Topbar } from "@/components/Topbar";
import {
  Database,
  Key,
  Shield,
  AlertCircle,
  Loader2,
  Zap,
  Globe,
  Lock,
  User,
  Sparkles,
  Eye,
  EyeOff,
  Cpu,
  Check,
  CheckCheck,
  Server,
  LayoutDashboard,
  UploadCloud,
  FileCheck,
  XCircle,
} from "lucide-react";
import { useRef } from "react";
import { cn } from "@/lib/utils";
import { DatabaseConfig } from "@/components/SettingsModal";
import { DatabaseEngineType } from "@/lib/dbValidation";

const DEFAULT_CONFIG: DatabaseConfig = {
  dbType: "PostgreSQL",
  connectionMode: "uri",
  connectionUri: "",
  username: "",
  password: "",
  databaseName: "",
  host: "",
  port: "",
  ssl: true,
  supabaseUrl: "",
  supabaseAnonKey: "",
  supabaseServiceKey: "",
  mongoAuthSource: "admin",
  llmProvider: "openai",
  llmApiKey: "",
  enableQueryGuard: true,
};

export default function SettingsPage() {
  const [activeSettingsTab, setActiveSettingsTab] = useState<
    "database" | "ai" | "security" | "pooling"
  >("database");

  const [config, setConfig] = useState<DatabaseConfig>(DEFAULT_CONFIG);

  useEffect(() => {
    if (typeof window !== "undefined") {
      try {
        const stored = localStorage.getItem("schemaai_db_config");
        if (stored) {
          const parsed = JSON.parse(stored);
          if (parsed.connectionUri && parsed.connectionUri.includes("••••")) {
            parsed.connectionUri = "";
          }
          if (parsed.password && parsed.password.includes("••••")) {
            parsed.password = "";
          }
          if (parsed.username && parsed.username === "postgres.admin") {
            parsed.username = "";
          }
          if (parsed.databaseName && parsed.databaseName === "production_core_db") {
            parsed.databaseName = "";
          }
          if (parsed.supabaseAnonKey && parsed.supabaseAnonKey.includes("••••")) {
            parsed.supabaseAnonKey = "";
          }
          if (parsed.llmApiKey && parsed.llmApiKey.includes("••••")) {
            parsed.llmApiKey = "";
          }
          setConfig((prev) => ({ ...prev, ...parsed }));
        }
      } catch (_) {}
    }
  }, []);

  const [connectionMode, setConnectionMode] = useState<"remote" | "local">("remote");
  const [localFile, setLocalFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [showPassword, setShowPassword] = useState(false);
  const [showApiKey, setShowApiKey] = useState(false);
  const [showServiceKey, setShowServiceKey] = useState(false);

  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState<{
    status: "idle" | "success" | "error";
    message: string;
    latencyMs?: number;
    serverVersion?: string;
    tablesCount?: number;
    hint?: string;
  }>({ status: "idle", message: "" });

  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  const currentMode = config.connectionMode || (config.dbType === "Supabase" ? "apikey" : config.dbType === "MySQL" ? "params" : "uri");

  const buildServerlessPayload = () => {
    let mode = config.connectionMode;
    if (!mode) {
      if (config.dbType === "Supabase") {
        mode = Boolean(config.connectionUri) && !config.supabaseUrl ? "uri" : "apikey";
      } else if (config.dbType === "MySQL") {
        mode = "params";
      } else {
        mode = "uri";
      }
    }

    return {
      dbType: config.dbType as DatabaseEngineType,
      connectionMode: mode,
      connectionUri: config.connectionUri,
      host: config.host,
      port: config.port,
      databaseName: config.databaseName,
      username: config.username,
      password: config.password,
      ssl: config.ssl,
      supabaseUrl: config.supabaseUrl,
      supabaseAnonKey: config.supabaseAnonKey,
      supabaseServiceKey: config.supabaseServiceKey,
      mongoAuthSource: config.mongoAuthSource,
    };
  };

  const handleTestConnection = async () => {
    setIsTesting(true);
    setTestResult({ status: "idle", message: "" });

    try {
      const payload = buildServerlessPayload();
      const res = await fetch("/api/database/connect", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setTestResult({
          status: "success",
          message: data.message || "Connection validated successfully.",
          latencyMs: data.latencyMs,
          serverVersion: data.serverVersion,
          tablesCount: data.tablesCount,
        });

        if (typeof window !== "undefined" && Array.isArray(data.schemaTables) && data.schemaTables.length > 0) {
          localStorage.setItem(
            "schemaai_introspected_schema",
            JSON.stringify({ tables: data.schemaTables, fks: data.fks || [] })
          );
        }
      } else {
        setTestResult({
          status: "error",
          message: data.message || "Unable to establish database handshake.",
          hint: data.hint,
        });
      }
    } catch (err: any) {
      setTestResult({
        status: "error",
        message: err?.message || "Failed to reach serverless API endpoint.",
        hint: "Ensure the local development server is reachable.",
      });
    } finally {
      setIsTesting(false);
    }
  };

  const cleanConfigForEngine = (raw: DatabaseConfig): DatabaseConfig => {
    const base: DatabaseConfig = {
      dbType: raw.dbType,
      connectionMode: raw.connectionMode,
      databaseName: raw.databaseName || "",
      connectionUri: raw.connectionUri || "",
      username: raw.username || "",
      password: raw.password || "",
      llmProvider: raw.llmProvider || "openai",
      llmApiKey: raw.llmApiKey || "",
      savedModels: raw.savedModels || [],
      activeModelId: raw.activeModelId || "",
      enableQueryGuard: raw.enableQueryGuard !== undefined ? raw.enableQueryGuard : true,
    };

    if (raw.dbType === "Supabase") {
      return {
        ...base,
        supabaseUrl: raw.supabaseUrl || "",
        supabaseAnonKey: raw.supabaseAnonKey || "",
        supabaseServiceKey: raw.supabaseServiceKey || "",
        connectionUri: raw.connectionUri || "",
        host: raw.host || "",
        port: raw.port || "",
        username: raw.username || "",
        password: raw.password || "",
        ssl: raw.ssl !== undefined ? raw.ssl : true,
      };
    } else if (raw.dbType === "MongoDB") {
      return {
        ...base,
        connectionUri: raw.connectionUri || "",
        mongoAuthSource: raw.mongoAuthSource || "admin",
      };
    } else if (raw.dbType === "MySQL") {
      return {
        ...base,
        host: raw.host || "",
        port: raw.port || "",
        username: raw.username || "",
        password: raw.password || "",
        connectionUri: raw.connectionUri || "",
        ssl: raw.ssl !== undefined ? raw.ssl : true,
      };
    } else {
      return {
        ...base,
        connectionUri: raw.connectionUri || "",
        host: raw.host || "",
        port: raw.port || "",
        username: raw.username || "",
        password: raw.password || "",
        ssl: raw.ssl !== undefined ? raw.ssl : true,
      };
    }
  };

  const handleSaveAndIntrospect = async () => {
    setIsSaving(true);
    try {
      fetch("http://127.0.0.1:8000/api/v1/agent/reset-connection", { method: "POST" }).catch(() => {});
      const payload = buildServerlessPayload();
      const res = await fetch("/api/database/connect", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        const cleaned = cleanConfigForEngine({
          ...config,
          databaseName: data.databaseName || config.databaseName || `${config.dbType} Database`,
          dbType: config.dbType,
        });
        if (typeof window !== "undefined") {
          localStorage.removeItem("schemaai_introspected_schema");
          localStorage.setItem("schemaai_db_config", JSON.stringify(cleaned));
          localStorage.setItem("schemaai_db_connected", "true");
          if (Array.isArray(data.schemaTables) && data.schemaTables.length > 0) {
            localStorage.setItem(
              "schemaai_introspected_schema",
              JSON.stringify({ tables: data.schemaTables, fks: data.fks || [] })
            );
          }
          window.dispatchEvent(new Event("schemaai_db_changed"));
        }
        setSaveSuccess(true);
        setTimeout(() => setSaveSuccess(false), 2500);
      } else {
        setTestResult({
          status: "error",
          message: data.message || "Cannot save: handshake test failed.",
          hint: data.hint,
        });
      }
    } catch (err) {
      const cleaned = cleanConfigForEngine({
        ...config,
        dbType: config.dbType,
      });
      if (typeof window !== "undefined") {
        localStorage.removeItem("schemaai_introspected_schema");
        localStorage.setItem("schemaai_db_config", JSON.stringify(cleaned));
        localStorage.setItem("schemaai_db_connected", "true");
        window.dispatchEvent(new Event("schemaai_db_changed"));
      }
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 2500);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="h-screen w-screen overflow-hidden bg-[#090A0F] text-slate-100 flex flex-col font-sans select-none antialiased">
      <Topbar dbName={config.databaseName} dbType={config.dbType} />

      <main className="flex-1 overflow-y-auto p-3 sm:p-8 max-w-5xl mx-auto w-full space-y-4 sm:space-y-6">
        {/* Page Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4 pb-4 border-b border-[#292524]">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 sm:p-3 rounded-2xl bg-[#38bdf8]/10 border border-[#38bdf8]/20 text-[#38bdf8]">
              <Database className="w-5 h-5 sm:w-6 sm:h-6" />
            </div>
            <div>
              <h1 className="text-lg sm:text-xl font-bold text-stone-100 tracking-tight">
                Project & Engine Configuration
              </h1>
              <p className="text-[11px] sm:text-xs text-stone-400">
                Manage relational schemas, API credentials, and query guard rails
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2 sm:space-x-3 shrink-0">
            <button
              type="button"
              onClick={handleTestConnection}
              disabled={isTesting}
              className="flex items-center space-x-1.5 px-3 py-2 sm:px-4 sm:py-2.5 rounded-xl bg-[#1c1917] hover:bg-[#201d1a] text-stone-300 hover:text-stone-100 border border-[#292524] text-xs font-medium transition-all disabled:opacity-50 shadow-sm shrink-0 cursor-pointer"
            >
              {isTesting ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin text-[#38bdf8]" />
                  <span className="hidden sm:inline">Testing Handshake...</span>
                  <span className="sm:hidden">Testing...</span>
                </>
              ) : (
                <>
                  <Zap className="w-3.5 h-3.5 text-amber-400" />
                  <span>Test Connection</span>
                </>
              )}
            </button>

            <button
              type="button"
              onClick={handleSaveAndIntrospect}
              disabled={isSaving}
              className="flex items-center space-x-1.5 px-3.5 py-2 sm:px-5 sm:py-2.5 rounded-xl bg-gradient-to-r from-[#38bdf8] to-[#2563eb] hover:from-[#60a5fa] hover:to-[#1d4ed8] text-white font-bold text-xs shadow-lg shadow-blue-500/20 transition-all disabled:opacity-50 shrink-0 cursor-pointer"
            >
              {isSaving ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin text-white" />
                  <span>Syncing...</span>
                </>
              ) : saveSuccess ? (
                <>
                  <CheckCheck className="w-3.5 h-3.5 text-white" />
                  <span>Saved!</span>
                </>
              ) : (
                <>
                  <Check className="w-3.5 h-3.5" />
                  <span>Save & Sync</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Diagnostic Telemetry Output */}
        {testResult.status !== "idle" && (
          <div
            className={cn(
              "p-3.5 sm:p-4 rounded-2xl border text-xs flex items-start space-x-3 animate-in fade-in duration-200 shadow-md",
              testResult.status === "success"
                ? "bg-[#38bdf8]/10 border-[#38bdf8]/30 text-[#38bdf8]"
                : "bg-rose-950/30 border-rose-500/30 text-rose-300"
            )}
          >
            {testResult.status === "success" ? (
              <CheckCheck className="w-4 h-4 text-[#38bdf8] mt-0.5 shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 text-rose-400 mt-0.5 shrink-0" />
            )}
            <div className="flex-1 space-y-1">
              <p className="font-medium">{testResult.message}</p>
              {testResult.hint && (
                <p className="text-[11px] text-zinc-400 mt-0.5">
                  💡 Hint: {testResult.hint}
                </p>
              )}
              {testResult.latencyMs !== undefined && (
                <div className="flex flex-wrap items-center gap-2 text-[11px] text-[#38bdf8]/90 font-mono">
                  <span>⚡ Roundtrip: {testResult.latencyMs}ms</span>
                  {testResult.serverVersion && (
                    <>
                      <span>•</span>
                      <span>Version: {testResult.serverVersion}</span>
                    </>
                  )}
                  {testResult.tablesCount !== undefined && (
                    <>
                      <span>•</span>
                      <span>Tables/Collections: {testResult.tablesCount}</span>
                    </>
                  )}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Tab Navigation Segmented Bar */}
        <div className="flex items-center space-x-1 sm:space-x-2 border-b border-[#292524] pb-0 overflow-x-auto scrollbar-none">
          {[
            { id: "database" as const, label: "Database Connection", icon: Database },
            { id: "ai" as const, label: "AI Engine & LLM", icon: Sparkles },
            { id: "security" as const, label: "Mutation Guard", icon: Shield },
            { id: "pooling" as const, label: "Connection Pooling", icon: Server },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeSettingsTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveSettingsTab(tab.id)}
                className={cn(
                  "flex items-center space-x-2 px-3 sm:px-4 py-2.5 text-xs font-medium border-b-2 transition-all duration-200 -mb-[1px] whitespace-nowrap shrink-0 cursor-pointer",
                  isActive
                    ? "border-[#38bdf8] text-[#38bdf8] font-semibold"
                    : "border-transparent text-stone-400 hover:text-stone-200"
                )}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Tab Contents */}
        <div className="p-4 sm:p-6 rounded-2xl bg-[#171412] border border-[#292524] shadow-xl space-y-6">
          {/* TAB 1: DATABASE */}
          {activeSettingsTab === "database" && (
            <div className="space-y-5 animate-in fade-in duration-150">
              {/* Engine Selector & Database Name */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-stone-300 flex items-center justify-between">
                    <span>Database Engine</span>
                    <span className="text-[11px] font-mono text-[#38bdf8]">
                      5 Supported Engines
                    </span>
                  </label>
                  <select
                    value={config.dbType}
                    onChange={(e) => {
                      const newType = e.target.value;
                      if (newType !== config.dbType) {
                        const defaultMode =
                          newType === "Supabase"
                            ? "apikey"
                            : newType === "MySQL"
                            ? "params"
                            : "uri";
                        setConfig((prev) => ({
                          ...prev,
                          dbType: newType,
                          connectionMode: defaultMode,
                          connectionUri: "",
                          supabaseUrl: "",
                          supabaseAnonKey: "",
                          supabaseServiceKey: "",
                          host: "",
                          port: "",
                          databaseName: "",
                          username: "",
                          password: "",
                          mongoAuthSource: "admin",
                        }));
                        setTestResult({ status: "idle", message: "" });
                        if (typeof window !== "undefined") {
                          localStorage.removeItem("schemaai_introspected_schema");
                        }
                      }
                    }}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-[#141210] border border-[#292524] text-sm text-stone-200 focus:outline-none focus:border-[#38bdf8] focus:ring-1 focus:ring-[#38bdf8]"
                  >
                    <option value="PostgreSQL">PostgreSQL (15/16)</option>
                    <option value="MySQL">MySQL 8.0</option>
                    <option value="Supabase">Supabase PostgreSQL</option>
                    <option value="Neon">Neon Serverless</option>
                    <option value="MongoDB">MongoDB Atlas (NoSQL)</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-stone-300">
                    Database / Catalog Name
                  </label>
                  <input
                    type="text"
                    value={config.databaseName}
                    onChange={(e) =>
                      setConfig({ ...config, databaseName: e.target.value })
                    }
                    placeholder="e.g. production_db or postgres"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-[#141210] border border-[#292524] text-xs text-stone-200 focus:outline-none focus:border-[#38bdf8] font-mono shadow-inner"
                  />
                </div>
              </div>

              {/* Mode Toggle for supported databases */}
              {(config.dbType === "PostgreSQL" ||
                config.dbType === "Neon" ||
                config.dbType === "Supabase") && (
                <div className="flex items-center space-x-2 p-1 rounded-xl bg-[#141210] border border-[#292524] w-fit">
                  {config.dbType === "Supabase" ? (
                    <>
                      <button
                        type="button"
                        onClick={() => setConfig({ ...config, connectionMode: "apikey" })}
                        className={cn(
                          "px-3 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer",
                          currentMode === "apikey"
                            ? "bg-[#1c1917] text-[#38bdf8] shadow-sm font-semibold"
                            : "text-stone-400 hover:text-stone-200"
                        )}
                      >
                        Project URL & API Key
                      </button>
                      <button
                        type="button"
                        onClick={() => setConfig({ ...config, connectionMode: "uri" })}
                        className={cn(
                          "px-3 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer",
                          currentMode === "uri"
                            ? "bg-[#1c1917] text-[#38bdf8] shadow-sm font-semibold"
                            : "text-stone-400 hover:text-stone-200"
                        )}
                      >
                        Direct Pooler URI
                      </button>
                      <button
                        type="button"
                        onClick={() => setConfig({ ...config, connectionMode: "params" })}
                        className={cn(
                          "px-3 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer",
                          currentMode === "params"
                            ? "bg-[#1c1917] text-[#38bdf8] shadow-sm font-semibold"
                            : "text-stone-400 hover:text-stone-200"
                        )}
                      >
                        Host & Parameters
                      </button>
                    </>
                  ) : (
                    <>
                      <button
                        type="button"
                        onClick={() => setConfig({ ...config, connectionMode: "uri" })}
                        className={cn(
                          "px-3 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer",
                          currentMode === "uri"
                            ? "bg-[#1c1917] text-[#38bdf8] shadow-sm font-semibold"
                            : "text-stone-400 hover:text-stone-200"
                        )}
                      >
                        Connection String (URI)
                      </button>
                      <button
                        type="button"
                        onClick={() => setConfig({ ...config, connectionMode: "params" })}
                        className={cn(
                          "px-3 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer",
                          currentMode === "params"
                            ? "bg-[#1c1917] text-[#38bdf8] shadow-sm font-semibold"
                            : "text-stone-400 hover:text-stone-200"
                        )}
                      >
                        Host & Port Parameters
                      </button>
                    </>
                  )}
                </div>
              )}

              {/* 1. POSTGRESQL / NEON */}
              {(config.dbType === "PostgreSQL" || config.dbType === "Neon") && (
                <>
                  {currentMode === "uri" ? (
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between">
                        <label className="text-xs font-semibold text-stone-300 flex items-center gap-1.5">
                          <Globe className="w-3.5 h-3.5 text-[#38bdf8]" />
                          <span>Connection URI</span>
                        </label>
                        <span className="text-[10px] text-[#38bdf8] font-mono">
                          SSL Mode: Require
                        </span>
                      </div>
                      <div className="relative">
                        <input
                          type="text"
                          value={config.connectionUri}
                          onChange={(e) =>
                            setConfig({ ...config, connectionUri: e.target.value })
                          }
                          placeholder={
                            config.dbType === "Neon"
                              ? "postgresql://user:pass@ep-cool-lake-12345.us-east-2.aws.neon.tech/neondb?sslmode=require"
                              : "postgresql://user:password@host:5432/dbname?sslmode=require"
                          }
                          className="w-full pl-3.5 pr-10 py-2.5 rounded-xl bg-[#141210] border border-[#292524] text-xs text-stone-200 focus:outline-none focus:border-[#38bdf8] font-mono shadow-inner"
                        />
                        <Lock className="w-4 h-4 text-stone-500 absolute right-3.5 top-3" />
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        <div className="sm:col-span-2 space-y-1.5">
                          <label className="text-xs font-semibold text-stone-300">Host</label>
                          <input
                            type="text"
                            value={config.host || ""}
                            onChange={(e) => setConfig({ ...config, host: e.target.value })}
                            placeholder="ep-cool-lake-12345.us-east-2.aws.neon.tech"
                            className="w-full px-3.5 py-2.5 rounded-xl bg-[#141210] border border-[#292524] text-xs text-stone-200 focus:outline-none focus:border-[#38bdf8] font-mono shadow-inner"
                          />
                        </div>
                        <div className="space-y-1.5">
                          <label className="text-xs font-semibold text-stone-300">Port</label>
                          <input
                            type="number"
                            value={config.port ?? ""}
                            onChange={(e) => setConfig({ ...config, port: e.target.value })}
                            placeholder="5432"
                            className="w-full px-3.5 py-2.5 rounded-xl bg-[#141210] border border-[#292524] text-xs text-stone-200 focus:outline-none focus:border-[#38bdf8] font-mono shadow-inner"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                          <label className="text-xs font-semibold text-stone-300 flex items-center gap-1">
                            <User className="w-3.5 h-3.5 text-stone-400" /> Username / Role
                          </label>
                          <input
                            type="text"
                            value={config.username}
                            onChange={(e) => setConfig({ ...config, username: e.target.value })}
                            placeholder="postgres / username"
                            className="w-full px-3.5 py-2.5 rounded-xl bg-[#141210] border border-[#292524] text-xs text-stone-200 focus:outline-none focus:border-[#38bdf8] font-mono shadow-inner"
                          />
                        </div>

                        <div className="space-y-1.5">
                          <label className="text-xs font-semibold text-stone-300 flex items-center gap-1">
                            <Lock className="w-3.5 h-3.5 text-stone-400" /> Password
                          </label>
                          <div className="relative">
                            <input
                              type={showPassword ? "text" : "password"}
                              value={config.password}
                              onChange={(e) => setConfig({ ...config, password: e.target.value })}
                              placeholder="Database password"
                              className="w-full pl-3.5 pr-10 py-2.5 rounded-xl bg-[#141210] border border-[#292524] text-xs text-stone-200 focus:outline-none focus:border-[#38bdf8] font-mono shadow-inner"
                            />
                            <button
                              type="button"
                              onClick={() => setShowPassword(!showPassword)}
                              className="absolute right-3.5 top-3 text-stone-500 hover:text-stone-300"
                            >
                              {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </>
              )}

              {/* 2. SUPABASE */}
              {config.dbType === "Supabase" && (
                <div className="space-y-4">
                  {currentMode === "apikey" && (
                    <>
                      <div className="space-y-1.5">
                        <label className="text-xs font-semibold text-stone-300 flex items-center gap-2">
                          <Globe className="w-3.5 h-3.5 text-emerald-400" />
                          <span>Supabase Project URL</span>
                        </label>
                        <input
                          type="text"
                          value={config.supabaseUrl || ""}
                          onChange={(e) => setConfig({ ...config, supabaseUrl: e.target.value })}
                          placeholder="https://xyzproject.supabase.co"
                          className="w-full px-3.5 py-2.5 rounded-xl bg-[#141210] border border-[#292524] text-xs text-stone-200 focus:outline-none focus:border-[#38bdf8] font-mono shadow-inner"
                        />
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                          <label className="text-xs font-semibold text-stone-300 flex items-center gap-1.5">
                            <Key className="w-3.5 h-3.5 text-emerald-400" />
                            <span>Anon / Public API Key</span>
                          </label>
                          <div className="relative">
                            <input
                              type={showApiKey ? "text" : "password"}
                              value={config.supabaseAnonKey || ""}
                              onChange={(e) => setConfig({ ...config, supabaseAnonKey: e.target.value })}
                              placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
                              className="w-full pl-3.5 pr-10 py-2.5 rounded-xl bg-[#141210] border border-[#292524] text-xs text-stone-200 focus:outline-none focus:border-[#38bdf8] font-mono shadow-inner"
                            />
                            <button
                              type="button"
                              onClick={() => setShowApiKey(!showApiKey)}
                              className="absolute right-3.5 top-3 text-stone-500 hover:text-stone-300"
                            >
                              {showApiKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                            </button>
                          </div>
                        </div>

                        <div className="space-y-1.5">
                          <label className="text-xs font-semibold text-stone-300 flex items-center gap-1.5">
                            <Shield className="w-3.5 h-3.5 text-amber-400" />
                            <span>Service Role Key (Optional)</span>
                          </label>
                          <div className="relative">
                            <input
                              type={showServiceKey ? "text" : "password"}
                              value={config.supabaseServiceKey || ""}
                              onChange={(e) => setConfig({ ...config, supabaseServiceKey: e.target.value })}
                              placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
                              className="w-full pl-3.5 pr-10 py-2.5 rounded-xl bg-[#141210] border border-[#292524] text-xs text-stone-200 focus:outline-none focus:border-[#38bdf8] font-mono shadow-inner"
                            />
                            <button
                              type="button"
                              onClick={() => setShowServiceKey(!showServiceKey)}
                              className="absolute right-3.5 top-3 text-stone-500 hover:text-stone-300"
                            >
                              {showServiceKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                            </button>
                          </div>
                        </div>
                      </div>
                    </>
                  )}

                  {currentMode === "uri" && (
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between">
                        <label className="text-xs font-semibold text-stone-300 flex items-center gap-1.5">
                          <Globe className="w-3.5 h-3.5 text-emerald-400" />
                          <span>Supabase Session / Transaction Pooler URI</span>
                        </label>
                        <span className="text-[10px] text-emerald-400 font-mono">Port 6543 / 5432</span>
                      </div>
                      <div className="relative">
                        <input
                          type="text"
                          value={config.connectionUri}
                          onChange={(e) => setConfig({ ...config, connectionUri: e.target.value })}
                          placeholder="postgresql://postgres.[project-ref]:[password]@aws-0-[region].pooler.supabase.com:6543/postgres"
                          className="w-full pl-3.5 pr-10 py-2.5 rounded-xl bg-[#141210] border border-[#292524] text-xs text-stone-200 focus:outline-none focus:border-[#38bdf8] font-mono shadow-inner"
                        />
                        <Lock className="w-4 h-4 text-stone-500 absolute right-3.5 top-3" />
                      </div>
                    </div>
                  )}

                  {currentMode === "params" && (
                    <div className="space-y-4">
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        <div className="sm:col-span-2 space-y-1.5">
                          <label className="text-xs font-semibold text-stone-300">Host (Pooler / Direct)</label>
                          <input
                            type="text"
                            value={config.host || ""}
                            onChange={(e) => setConfig({ ...config, host: e.target.value })}
                            placeholder="aws-0-us-east-1.pooler.supabase.com"
                            className="w-full px-3.5 py-2.5 rounded-xl bg-[#141210] border border-[#292524] text-xs text-stone-200 focus:outline-none focus:border-[#38bdf8] font-mono shadow-inner"
                          />
                        </div>
                        <div className="space-y-1.5">
                          <label className="text-xs font-semibold text-stone-300">Port</label>
                          <input
                            type="number"
                            value={config.port ?? ""}
                            onChange={(e) => setConfig({ ...config, port: e.target.value })}
                            placeholder="6543 or 5432"
                            className="w-full px-3.5 py-2.5 rounded-xl bg-[#141210] border border-[#292524] text-xs text-stone-200 focus:outline-none focus:border-[#38bdf8] font-mono shadow-inner"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                          <label className="text-xs font-semibold text-stone-300 flex items-center gap-1">
                            <User className="w-3.5 h-3.5 text-stone-400" /> Username
                          </label>
                          <input
                            type="text"
                            value={config.username}
                            onChange={(e) => setConfig({ ...config, username: e.target.value })}
                            placeholder="postgres.project-ref"
                            className="w-full px-3.5 py-2.5 rounded-xl bg-[#141210] border border-[#292524] text-xs text-stone-200 focus:outline-none focus:border-[#38bdf8] font-mono shadow-inner"
                          />
                        </div>

                        <div className="space-y-1.5">
                          <label className="text-xs font-semibold text-stone-300 flex items-center gap-1">
                            <Lock className="w-3.5 h-3.5 text-stone-400" /> Password
                          </label>
                          <div className="relative">
                            <input
                              type={showPassword ? "text" : "password"}
                              value={config.password}
                              onChange={(e) => setConfig({ ...config, password: e.target.value })}
                              placeholder="Database password"
                              className="w-full pl-3.5 pr-10 py-2.5 rounded-xl bg-[#141210] border border-[#292524] text-xs text-stone-200 focus:outline-none focus:border-[#38bdf8] font-mono shadow-inner"
                            />
                            <button
                              type="button"
                              onClick={() => setShowPassword(!showPassword)}
                              className="absolute right-3.5 top-3 text-stone-500 hover:text-stone-300"
                            >
                              {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* 3. MYSQL */}
              {config.dbType === "MySQL" && (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="sm:col-span-2 space-y-1.5">
                      <label className="text-xs font-semibold text-stone-300">MySQL Host</label>
                      <input
                        type="text"
                        value={config.host || ""}
                        onChange={(e) => setConfig({ ...config, host: e.target.value })}
                        placeholder="127.0.0.1 or mysql.myhost.com"
                        className="w-full px-3.5 py-2.5 rounded-xl bg-[#141210] border border-[#292524] text-xs text-stone-200 focus:outline-none focus:border-[#38bdf8] font-mono shadow-inner"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-stone-300">Port</label>
                      <input
                        type="number"
                        value={config.port ?? ""}
                        onChange={(e) => setConfig({ ...config, port: e.target.value })}
                        placeholder="3306"
                        className="w-full px-3.5 py-2.5 rounded-xl bg-[#141210] border border-[#292524] text-xs text-stone-200 focus:outline-none focus:border-[#38bdf8] font-mono shadow-inner"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-stone-300 flex items-center gap-1">
                        <User className="w-3.5 h-3.5 text-stone-400" /> User
                      </label>
                      <input
                        type="text"
                        value={config.username}
                        onChange={(e) => setConfig({ ...config, username: e.target.value })}
                        placeholder="root"
                        className="w-full px-3.5 py-2.5 rounded-xl bg-[#141210] border border-[#292524] text-xs text-stone-200 focus:outline-none focus:border-[#38bdf8] font-mono shadow-inner"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-stone-300 flex items-center gap-1">
                        <Lock className="w-3.5 h-3.5 text-stone-400" /> Password
                      </label>
                      <div className="relative">
                        <input
                          type={showPassword ? "text" : "password"}
                          value={config.password}
                          onChange={(e) => setConfig({ ...config, password: e.target.value })}
                          placeholder="MySQL root password"
                          className="w-full pl-3.5 pr-10 py-2.5 rounded-xl bg-[#141210] border border-[#292524] text-xs text-stone-200 focus:outline-none focus:border-[#38bdf8] font-mono shadow-inner"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-3.5 top-3 text-stone-500 hover:text-stone-300"
                        >
                          {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* 4. MONGODB */}
              {config.dbType === "MongoDB" && (
                <div className="space-y-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-stone-300 flex items-center gap-2">
                      <Globe className="w-3.5 h-3.5 text-emerald-400" />
                      <span>MongoDB Connection String (SRV / Standard)</span>
                    </label>
                    <input
                      type="text"
                      value={config.connectionUri}
                      onChange={(e) => setConfig({ ...config, connectionUri: e.target.value })}
                      placeholder="mongodb+srv://admin:secret@cluster0.mongodb.net/production_core_db?retryWrites=true&w=majority"
                      className="w-full px-3.5 py-2.5 rounded-xl bg-[#141210] border border-[#292524] text-xs text-stone-200 focus:outline-none focus:border-[#38bdf8] font-mono shadow-inner"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-stone-300">Auth Source</label>
                      <input
                        type="text"
                        value={config.mongoAuthSource || "admin"}
                        onChange={(e) => setConfig({ ...config, mongoAuthSource: e.target.value })}
                        placeholder="admin"
                        className="w-full px-3.5 py-2.5 rounded-xl bg-[#141210] border border-[#292524] text-xs text-stone-200 focus:outline-none focus:border-[#38bdf8] font-mono shadow-inner"
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 2: AI ENGINE */}
          {activeSettingsTab === "ai" && (
            <div className="space-y-5 animate-in fade-in duration-150">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-stone-300">
                    Model Provider
                  </label>
                  <select
                    value={config.llmProvider}
                    onChange={(e) =>
                      setConfig({
                        ...config,
                        llmProvider: e.target.value,
                      })
                    }
                    className="w-full px-3.5 py-2.5 rounded-xl bg-[#141210] border border-[#292524] text-sm text-stone-200 focus:outline-none focus:border-[#38bdf8]"
                  >
                    <option value="openai">OpenAI GPT-4o (Recommended)</option>
                    <option value="anthropic">Anthropic Claude 3.5 Sonnet</option>
                    <option value="nvidia">NVIDIA NIM (Llama 3, Nemotron, etc)</option>
                    <option value="custom">Self-Hosted DeepSeek-V3 / Ollama</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-stone-300 flex items-center gap-1">
                    <Key className="w-3.5 h-3.5 text-[#38bdf8]" /> API Secret Key
                  </label>
                  <div className="relative">
                    <input
                      type={showApiKey ? "text" : "password"}
                      value={config.llmApiKey}
                      onChange={(e) =>
                        setConfig({ ...config, llmApiKey: e.target.value })
                      }
                      placeholder={config.llmProvider === "nvidia" ? "nvapi-..." : "sk-proj-..."}
                      className="w-full pl-3.5 pr-10 py-2.5 rounded-xl bg-[#141210] border border-[#292524] text-xs text-stone-200 focus:outline-none focus:border-[#3ecf8e] font-mono shadow-inner"
                    />
                    <button
                      type="button"
                      onClick={() => setShowApiKey(!showApiKey)}
                      className="absolute right-3.5 top-3 text-stone-500 hover:text-stone-300 cursor-pointer"
                    >
                      {showApiKey ? (
                        <EyeOff className="w-4 h-4" />
                      ) : (
                        <Eye className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                  {config.llmProvider === "nvidia" && (
                    <p className="text-[10px] text-zinc-500 mt-2">
                      Get your API key at <a href="https://build.nvidia.com/models?filters=nimType%3Anim_type_preview&orderBy=weightPopular%3ADESC" target="_blank" rel="noopener noreferrer" className="text-[#3ecf8e] hover:underline">build.nvidia.com</a>
                    </p>
                  )}
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-[#141210] border border-[#292524] text-xs text-stone-300 flex items-start space-x-3 shadow-inner">
                <Cpu className="w-5 h-5 text-[#38bdf8] shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <h4 className="font-semibold text-stone-100">Relational Embedding Engine</h4>
                  <p className="leading-relaxed text-stone-400">
                    SchemaAI builds lightweight in-memory schema embeddings to translate plain English prompts into verified ASTs with zero prompt-injection risk.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: SECURITY GUARD */}
          {activeSettingsTab === "security" && (
            <div className="space-y-5 animate-in fade-in duration-150">
              <div className="p-5 rounded-2xl bg-[#141210] border border-[#292524] flex items-center justify-between shadow-inner">
                <div className="space-y-1 pr-4">
                  <div className="flex items-center space-x-2">
                    <Shield className="w-5 h-5 text-[#38bdf8]" />
                    <span className="font-bold text-sm text-stone-100">
                      Strict Mutation Guard Rails
                    </span>
                  </div>
                  <p className="text-xs text-stone-400 leading-relaxed">
                    Intercept and require explicit approval before running any destructive DDL/DML statements (`DELETE`, `UPDATE`, `DROP`).
                  </p>
                </div>

                <label className="relative inline-flex items-center cursor-pointer shrink-0">
                  <input
                    type="checkbox"
                    checked={config.enableQueryGuard}
                    onChange={(e) =>
                      setConfig({ ...config, enableQueryGuard: e.target.checked })
                    }
                    className="sr-only peer"
                  />
                  <div className="w-12 h-6 bg-stone-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#38bdf8] shadow-inner" />
                </label>
              </div>

              <div className="grid grid-cols-2 gap-4 text-xs">
                <div className="p-4 rounded-2xl bg-[#141210] border border-[#292524] space-y-1.5 shadow-inner">
                  <span className="text-stone-400 text-[11px] block">SQL Injection Defense</span>
                  <p className="text-[#38bdf8] font-semibold">Active (Parameterized AST)</p>
                  <p className="text-[11px] text-stone-500">All queries execute in read-only transactions by default.</p>
                </div>
                <div className="p-4 rounded-2xl bg-[#141210] border border-[#292524] space-y-1.5 shadow-inner">
                  <span className="text-stone-400 text-[11px] block">Audit Telemetry Logging</span>
                  <p className="text-amber-400 font-semibold">Immutable On-Disk Cache</p>
                  <p className="text-[11px] text-stone-500">Every prompt and output is cryptographically logged.</p>
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: POOLING */}
          {activeSettingsTab === "pooling" && (
            <div className="space-y-5 animate-in fade-in duration-150 text-xs">
              <div className="p-5 rounded-2xl bg-[#141210] border border-[#292524] space-y-3 shadow-inner">
                <h4 className="font-semibold text-sm text-stone-100 flex items-center gap-2">
                  <Server className="w-4 h-4 text-[#38bdf8]" />
                  <span>PgBouncer Connection Pooling</span>
                </h4>
                <p className="text-stone-400 leading-relaxed">
                  SchemaAI maintains low-latency prepared transaction pools for real-time natural language query execution with automatic reconnection failovers.
                </p>
                <div className="grid grid-cols-3 gap-3 pt-2">
                  <div className="p-3 rounded-xl bg-[#1c1917] border border-[#292524]">
                    <span className="text-stone-500 text-[10px]">Pool Mode</span>
                    <p className="font-mono font-bold text-stone-200 mt-1">Transaction</p>
                  </div>
                  <div className="p-3 rounded-xl bg-[#1c1917] border border-[#292524]">
                    <span className="text-stone-500 text-[10px]">Max Client Conns</span>
                    <p className="font-mono font-bold text-[#38bdf8] mt-1">100 Active</p>
                  </div>
                  <div className="p-3 rounded-xl bg-[#1c1917] border border-[#292524]">
                    <span className="text-stone-500 text-[10px]">Default Timeout</span>
                    <p className="font-mono font-bold text-amber-300 mt-1">15,000 ms</p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
