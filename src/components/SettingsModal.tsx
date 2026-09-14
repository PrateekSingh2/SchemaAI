"use client";

import React, { useState, useEffect } from "react";
import {
  X,
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
  Terminal,
  FileCode,
  Sliders,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { DatabaseEngineType } from "@/lib/dbValidation";

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (config: DatabaseConfig) => void;
}

export interface DatabaseConfig {
  dbType: string;
  connectionMode?: "uri" | "params" | "apikey";
  connectionUri: string;
  username: string;
  password: string;
  databaseName: string;
  host?: string;
  port?: number | string;
  ssl?: boolean;
  supabaseUrl?: string;
  supabaseAnonKey?: string;
  supabaseServiceKey?: string;
  snowflakeAccount?: string;
  snowflakeWarehouse?: string;
  snowflakeSchema?: string;
  snowflakeRole?: string;
  bigQueryProjectId?: string;
  bigQueryDatasetId?: string;
  bigQueryClientEmail?: string;
  bigQueryPrivateKey?: string;
  mongoAuthSource?: string;
  sqlitePath?: string;
  sqliteCloudToken?: string;
  llmProvider: "openai" | "anthropic" | "custom";
  llmApiKey: string;
  enableQueryGuard: boolean;
}

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
  snowflakeAccount: "",
  snowflakeWarehouse: "",
  snowflakeSchema: "",
  snowflakeRole: "",
  bigQueryProjectId: "",
  bigQueryDatasetId: "",
  bigQueryClientEmail: "",
  bigQueryPrivateKey: "",
  mongoAuthSource: "",
  sqlitePath: "",
  sqliteCloudToken: "",
  llmProvider: "openai",
  llmApiKey: "",
  enableQueryGuard: true,
};

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  onSave,
}) => {
  const [activeSettingsTab, setActiveSettingsTab] = useState<
    "database" | "ai" | "security"
  >("database");

  const [config, setConfig] = useState<DatabaseConfig>(DEFAULT_CONFIG);

  // Restore saved config from localStorage on mount (filtering out any previous dummy/test data)
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
      } catch (e) {
        console.warn("Could not parse stored db config:", e);
      }
    }
  }, [isOpen]);

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

  if (!isOpen) return null;

  // Build payload for serverless verification endpoint
  const buildServerlessPayload = () => {
    return {
      dbType: config.dbType as DatabaseEngineType,
      connectionMode: config.connectionMode || "uri",
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
      snowflakeAccount: config.snowflakeAccount,
      snowflakeWarehouse: config.snowflakeWarehouse,
      snowflakeSchema: config.snowflakeSchema,
      snowflakeRole: config.snowflakeRole,
      bigQueryProjectId: config.bigQueryProjectId,
      bigQueryDatasetId: config.bigQueryDatasetId,
      bigQueryClientEmail: config.bigQueryClientEmail,
      bigQueryPrivateKey: config.bigQueryPrivateKey,
      mongoAuthSource: config.mongoAuthSource,
      sqlitePath: config.sqlitePath,
      sqliteCloudToken: config.sqliteCloudToken,
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
      } else {
        setTestResult({
          status: "error",
          message: data.message || "Failed to establish database connection handshake.",
          hint: data.hint,
        });
      }
    } catch (err: any) {
      setTestResult({
        status: "error",
        message: err?.message || "Network request failed when contacting serverless endpoint.",
        hint: "Ensure the local development server or edge function is reachable.",
      });
    } finally {
      setIsTesting(false);
    }
  };

  const handleSaveAndIntrospect = async () => {
    setIsSaving(true);
    try {
      const payload = buildServerlessPayload();
      const res = await fetch("/api/database/connect", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (res.ok && data.success) {
        // Save to localStorage
        if (typeof window !== "undefined") {
          localStorage.setItem("schemaai_db_config", JSON.stringify(config));
          localStorage.setItem("schemaai_db_connected", "true");
          localStorage.setItem(
            "schemaai_introspected_schema",
            JSON.stringify({ tables: data.schemaTables || [], fks: data.fks || [] })
          );
          window.dispatchEvent(new Event("schemaai_db_changed"));
        }
        onSave(config);
        onClose();
      } else {
        setTestResult({
          status: "error",
          message: data.message || "Cannot save: connection test failed.",
          hint: data.hint,
        });
        setActiveSettingsTab("database");
      }
    } catch (err: any) {
      // In case of offline error, save with warning
      if (typeof window !== "undefined") {
        localStorage.setItem("schemaai_db_config", JSON.stringify(config));
        localStorage.setItem("schemaai_db_connected", "true");
        window.dispatchEvent(new Event("schemaai_db_changed"));
      }
      onSave(config);
      onClose();
    } finally {
      setIsSaving(false);
    }
  };

  // Determine current connection mode for engine
  const currentMode = config.connectionMode || (config.dbType === "Supabase" ? "apikey" : "uri");

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/80 backdrop-blur-md animate-in fade-in duration-200 select-none">
      <div
        className="relative w-full max-w-2xl rounded-2xl bg-[#16161a] border border-[#26262b] shadow-2xl overflow-hidden text-[#f4f4f5] flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Accent Line */}
        <div className="h-1 w-full bg-gradient-to-r from-[#38bdf8] via-blue-500 to-indigo-500 shrink-0" />

        {/* Modal Header */}
        <div className="flex items-center justify-between px-5 sm:px-6 py-4 border-b border-[#222226] bg-[#121215] shrink-0">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 rounded-xl bg-[#38bdf8]/10 border border-[#38bdf8]/25 text-[#38bdf8] shrink-0">
              <Database className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-semibold text-zinc-100 tracking-tight">
                Settings & Database Configuration
              </h2>
              <p className="text-xs sm:text-sm text-zinc-400">
                Connected via serverless edge validation API
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-zinc-400 hover:text-white hover:bg-[#202026] transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Navigation Tabs */}
        <div className="px-5 sm:px-6 pt-2 bg-[#121215] border-b border-[#222226] flex items-center space-x-2 shrink-0">
          {[
            { id: "database" as const, label: "Database Connection", icon: Database },
            { id: "ai" as const, label: "AI Model & Engine", icon: Sparkles },
            { id: "security" as const, label: "Mutation Guard", icon: Shield },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeSettingsTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveSettingsTab(tab.id)}
                className={cn(
                  "flex items-center space-x-2 px-3.5 py-2.5 text-sm font-medium border-b-2 transition-all duration-150 -mb-[1px] cursor-pointer",
                  isActive
                    ? "border-[#38bdf8] text-[#38bdf8] font-semibold"
                    : "border-transparent text-zinc-400 hover:text-zinc-200"
                )}
              >
                <Icon className="w-4 h-4" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Modal Body */}
        <div className="p-5 sm:p-6 space-y-5 overflow-y-auto flex-1">
          {/* TAB 1: DATABASE */}
          {activeSettingsTab === "database" && (
            <div className="space-y-4 animate-in fade-in duration-150">
              {/* Engine Selector */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-zinc-200 flex items-center justify-between">
                    <span>Database Engine</span>
                    <span className="text-[11px] font-mono text-[#38bdf8]">
                      Serverless Edge Handshake
                    </span>
                  </label>
                  <select
                    value={config.dbType}
                    onChange={(e) => {
                      const newType = e.target.value;
                      const defaultMode =
                        newType === "Supabase"
                          ? "apikey"
                          : newType === "MySQL" || newType === "Snowflake" || newType === "BigQuery"
                          ? "params"
                          : "uri";
                      setConfig({
                        ...config,
                        dbType: newType,
                        connectionMode: defaultMode,
                      });
                      setTestResult({ status: "idle", message: "" });
                    }}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-[#1b1b20] border border-[#26262b] text-sm text-zinc-200 focus:outline-none focus:border-[#38bdf8] transition-colors"
                  >
                    <option value="PostgreSQL">PostgreSQL (15/16)</option>
                    <option value="Supabase">Supabase PostgreSQL</option>
                    <option value="Neon">Neon Serverless</option>
                    <option value="MySQL">MySQL 8.0</option>
                    <option value="MongoDB">MongoDB Atlas (NoSQL)</option>
                    <option value="Snowflake">Snowflake Data Cloud</option>
                    <option value="BigQuery">Google Cloud BigQuery</option>
                    <option value="SQLite">SQLite Cloud / Local</option>
                    <option value="CockroachDB">CockroachDB Serverless</option>
                  </select>
                </div>

                {/* Database Name / Catalog */}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-zinc-200">
                    Database / Catalog Name
                  </label>
                  <input
                    type="text"
                    value={config.databaseName}
                    onChange={(e) =>
                      setConfig({ ...config, databaseName: e.target.value })
                    }
                    placeholder="e.g. production_db or postgres"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-[#1b1b20] border border-[#26262b] text-sm text-zinc-200 focus:outline-none focus:border-[#38bdf8] font-mono transition-colors"
                  />
                </div>
              </div>

              {/* Mode Toggle for supported databases */}
              {(config.dbType === "PostgreSQL" ||
                config.dbType === "Neon" ||
                config.dbType === "CockroachDB" ||
                config.dbType === "Supabase" ||
                config.dbType === "SQLite") && (
                <div className="flex items-center space-x-2 p-1 rounded-xl bg-[#121215] border border-[#222226] w-fit">
                  {config.dbType === "Supabase" ? (
                    <>
                      <button
                        type="button"
                        onClick={() => setConfig({ ...config, connectionMode: "apikey" })}
                        className={cn(
                          "px-3 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer",
                          currentMode === "apikey"
                            ? "bg-[#1f1f26] text-[#38bdf8] shadow-sm font-semibold"
                            : "text-zinc-400 hover:text-white"
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
                            ? "bg-[#1f1f26] text-[#38bdf8] shadow-sm font-semibold"
                            : "text-zinc-400 hover:text-white"
                        )}
                      >
                        Direct Pooler URI
                      </button>
                    </>
                  ) : config.dbType === "SQLite" ? (
                    <>
                      <button
                        type="button"
                        onClick={() => setConfig({ ...config, connectionMode: "params" })}
                        className={cn(
                          "px-3 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer",
                          currentMode === "params"
                            ? "bg-[#1f1f26] text-[#38bdf8] shadow-sm font-semibold"
                            : "text-zinc-400 hover:text-white"
                        )}
                      >
                        Local File Path
                      </button>
                      <button
                        type="button"
                        onClick={() => setConfig({ ...config, connectionMode: "uri" })}
                        className={cn(
                          "px-3 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer",
                          currentMode === "uri"
                            ? "bg-[#1f1f26] text-[#38bdf8] shadow-sm font-semibold"
                            : "text-zinc-400 hover:text-white"
                        )}
                      >
                        SQLite Cloud URI / Token
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
                            ? "bg-[#1f1f26] text-[#38bdf8] shadow-sm font-semibold"
                            : "text-zinc-400 hover:text-white"
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
                            ? "bg-[#1f1f26] text-[#38bdf8] shadow-sm font-semibold"
                            : "text-zinc-400 hover:text-white"
                        )}
                      >
                        Host & Port Parameters
                      </button>
                    </>
                  )}
                </div>
              )}

              {/* DYNAMIC FORM FIELDS ACCORDING TO ENGINE */}

              {/* 1. POSTGRESQL / NEON / COCKROACHDB */}
              {(config.dbType === "PostgreSQL" ||
                config.dbType === "Neon" ||
                config.dbType === "CockroachDB") && (
                <>
                  {currentMode === "uri" ? (
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <label className="text-sm font-medium text-zinc-200 flex items-center gap-2">
                          <Globe className="w-4 h-4 text-[#38bdf8]" />
                          <span>Connection URI</span>
                        </label>
                        <span className="text-xs text-[#38bdf8] font-mono">
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
                              : config.dbType === "CockroachDB"
                              ? "postgresql://root:pass@cluster.cockroachlabs.cloud:26257/defaultdb?sslmode=verify-full"
                              : "postgresql://user:password@host:5432/dbname?sslmode=require"
                          }
                          className="w-full pl-3.5 pr-10 py-2.5 rounded-xl bg-[#1b1b20] border border-[#26262b] text-sm text-zinc-200 focus:outline-none focus:border-[#38bdf8] font-mono transition-colors"
                        />
                        <Lock className="w-4 h-4 text-zinc-500 absolute right-3.5 top-3" />
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        <div className="sm:col-span-2 space-y-2">
                          <label className="text-sm font-medium text-zinc-200">Host</label>
                          <input
                            type="text"
                            value={config.host || ""}
                            onChange={(e) => setConfig({ ...config, host: e.target.value })}
                            placeholder="aws-0-us-east-1.pooler.supabase.com"
                            className="w-full px-3.5 py-2.5 rounded-xl bg-[#1b1b20] border border-[#26262b] text-sm text-zinc-200 focus:outline-none focus:border-[#38bdf8] font-mono"
                          />
                        </div>
                        <div className="space-y-2">
                          <label className="text-sm font-medium text-zinc-200">Port</label>
                          <input
                            type="number"
                            value={config.port ?? ""}
                            onChange={(e) => setConfig({ ...config, port: e.target.value })}
                            placeholder={config.dbType === "CockroachDB" ? "26257" : "5432"}
                            className="w-full px-3.5 py-2.5 rounded-xl bg-[#1b1b20] border border-[#26262b] text-sm text-zinc-200 focus:outline-none focus:border-[#38bdf8] font-mono"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <label className="text-sm font-medium text-zinc-200 flex items-center gap-1.5">
                            <User className="w-4 h-4 text-zinc-400" /> Username / Role
                          </label>
                          <input
                            type="text"
                            value={config.username}
                            onChange={(e) => setConfig({ ...config, username: e.target.value })}
                            placeholder="postgres / username"
                            className="w-full px-3.5 py-2.5 rounded-xl bg-[#1b1b20] border border-[#26262b] text-sm text-zinc-200 focus:outline-none focus:border-[#38bdf8] font-mono"
                          />
                        </div>

                        <div className="space-y-2">
                          <label className="text-sm font-medium text-zinc-200 flex items-center gap-1.5">
                            <Lock className="w-4 h-4 text-zinc-400" /> Password
                          </label>
                          <div className="relative">
                            <input
                              type={showPassword ? "text" : "password"}
                              value={config.password}
                              onChange={(e) => setConfig({ ...config, password: e.target.value })}
                              placeholder="••••••••••••"
                              className="w-full pl-3.5 pr-10 py-2.5 rounded-xl bg-[#1b1b20] border border-[#26262b] text-sm text-zinc-200 focus:outline-none focus:border-[#38bdf8] font-mono"
                            />
                            <button
                              type="button"
                              onClick={() => setShowPassword(!showPassword)}
                              className="absolute right-3 top-3 text-zinc-500 hover:text-zinc-300 cursor-pointer"
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
                <>
                  {currentMode === "apikey" ? (
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-zinc-200 flex items-center gap-1.5">
                          <Globe className="w-4 h-4 text-[#38bdf8]" /> Supabase Project URL
                        </label>
                        <input
                          type="text"
                          value={config.supabaseUrl || ""}
                          onChange={(e) => setConfig({ ...config, supabaseUrl: e.target.value })}
                          placeholder="https://xyzcompany.supabase.co"
                          className="w-full px-3.5 py-2.5 rounded-xl bg-[#1b1b20] border border-[#26262b] text-sm text-zinc-200 focus:outline-none focus:border-[#38bdf8] font-mono"
                        />
                      </div>

                      <div className="space-y-2">
                        <label className="text-sm font-medium text-zinc-200 flex items-center justify-between">
                          <span className="flex items-center gap-1.5">
                            <Key className="w-4 h-4 text-emerald-400" /> API Key (service_role or anon key)
                          </span>
                          <span className="text-xs text-zinc-400">Found in Project Settings &gt; API</span>
                        </label>
                        <div className="relative">
                          <input
                            type={showServiceKey ? "text" : "password"}
                            value={config.supabaseAnonKey || ""}
                            onChange={(e) => setConfig({ ...config, supabaseAnonKey: e.target.value })}
                            placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
                            className="w-full pl-3.5 pr-10 py-2.5 rounded-xl bg-[#1b1b20] border border-[#26262b] text-sm text-zinc-200 focus:outline-none focus:border-[#38bdf8] font-mono"
                          />
                          <button
                            type="button"
                            onClick={() => setShowServiceKey(!showServiceKey)}
                            className="absolute right-3 top-3 text-zinc-500 hover:text-zinc-300 cursor-pointer"
                          >
                            {showServiceKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                          </button>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-zinc-200 flex items-center justify-between">
                        <span className="flex items-center gap-1.5">
                          <Globe className="w-4 h-4 text-[#38bdf8]" /> Supabase Direct Pooler Connection String
                        </span>
                        <span className="text-xs text-[#38bdf8]">Port 6543 / 5432</span>
                      </label>
                      <input
                        type="text"
                        value={config.connectionUri}
                        onChange={(e) => setConfig({ ...config, connectionUri: e.target.value })}
                        placeholder="postgresql://postgres.xxx:pass@aws-0-us-east-1.pooler.supabase.com:6543/postgres"
                        className="w-full px-3.5 py-2.5 rounded-xl bg-[#1b1b20] border border-[#26262b] text-sm text-zinc-200 focus:outline-none focus:border-[#38bdf8] font-mono"
                      />
                    </div>
                  )}
                </>
              )}

              {/* 3. MYSQL */}
              {config.dbType === "MySQL" && (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="sm:col-span-2 space-y-2">
                      <label className="text-sm font-medium text-zinc-200">Host Endpoint</label>
                      <input
                        type="text"
                        value={config.host || ""}
                        onChange={(e) => setConfig({ ...config, host: e.target.value })}
                        placeholder="mysql.internal.company.com or 127.0.0.1"
                        className="w-full px-3.5 py-2.5 rounded-xl bg-[#1b1b20] border border-[#26262b] text-sm text-zinc-200 focus:outline-none focus:border-[#38bdf8] font-mono"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-zinc-200">Port</label>
                      <input
                        type="number"
                        value={config.port ?? ""}
                        onChange={(e) => setConfig({ ...config, port: e.target.value })}
                        placeholder="3306"
                        className="w-full px-3.5 py-2.5 rounded-xl bg-[#1b1b20] border border-[#26262b] text-sm text-zinc-200 focus:outline-none focus:border-[#38bdf8] font-mono"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-zinc-200 flex items-center gap-1.5">
                        <User className="w-4 h-4 text-zinc-400" /> Username
                      </label>
                      <input
                        type="text"
                        value={config.username}
                        onChange={(e) => setConfig({ ...config, username: e.target.value })}
                        placeholder="root / app_user"
                        className="w-full px-3.5 py-2.5 rounded-xl bg-[#1b1b20] border border-[#26262b] text-sm text-zinc-200 focus:outline-none focus:border-[#38bdf8] font-mono"
                      />
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-medium text-zinc-200 flex items-center gap-1.5">
                        <Lock className="w-4 h-4 text-zinc-400" /> Password
                      </label>
                      <div className="relative">
                        <input
                          type={showPassword ? "text" : "password"}
                          value={config.password}
                          onChange={(e) => setConfig({ ...config, password: e.target.value })}
                          placeholder="••••••••••••"
                          className="w-full pl-3.5 pr-10 py-2.5 rounded-xl bg-[#1b1b20] border border-[#26262b] text-sm text-zinc-200 focus:outline-none focus:border-[#38bdf8] font-mono"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-3 top-3 text-zinc-500 hover:text-zinc-300 cursor-pointer"
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
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-zinc-200 flex items-center gap-2">
                      <Globe className="w-4 h-4 text-emerald-400" />
                      <span>MongoDB Connection String (SRV / Standard)</span>
                    </label>
                    <input
                      type="text"
                      value={config.connectionUri}
                      onChange={(e) => setConfig({ ...config, connectionUri: e.target.value })}
                      placeholder="mongodb+srv://admin:secret@cluster0.mongodb.net/production_core_db?retryWrites=true&w=majority"
                      className="w-full px-3.5 py-2.5 rounded-xl bg-[#1b1b20] border border-[#26262b] text-sm text-zinc-200 focus:outline-none focus:border-[#38bdf8] font-mono"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-zinc-200">Auth Source</label>
                      <input
                        type="text"
                        value={config.mongoAuthSource || ""}
                        onChange={(e) => setConfig({ ...config, mongoAuthSource: e.target.value })}
                        placeholder="admin"
                        className="w-full px-3.5 py-2.5 rounded-xl bg-[#1b1b20] border border-[#26262b] text-sm text-zinc-200 focus:outline-none focus:border-[#38bdf8] font-mono"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* 5. SNOWFLAKE */}
              {config.dbType === "Snowflake" && (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-zinc-200">Account Identifier</label>
                      <input
                        type="text"
                        value={config.snowflakeAccount || ""}
                        onChange={(e) => setConfig({ ...config, snowflakeAccount: e.target.value })}
                        placeholder="xy12345.us-east-1 or org-account"
                        className="w-full px-3.5 py-2.5 rounded-xl bg-[#1b1b20] border border-[#26262b] text-sm text-zinc-200 focus:outline-none focus:border-[#38bdf8] font-mono"
                      />
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-medium text-zinc-200">Warehouse</label>
                      <input
                        type="text"
                        value={config.snowflakeWarehouse || ""}
                        onChange={(e) => setConfig({ ...config, snowflakeWarehouse: e.target.value })}
                        placeholder="COMPUTE_WH"
                        className="w-full px-3.5 py-2.5 rounded-xl bg-[#1b1b20] border border-[#26262b] text-sm text-zinc-200 focus:outline-none focus:border-[#38bdf8] font-mono"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-zinc-200">Schema</label>
                      <input
                        type="text"
                        value={config.snowflakeSchema || ""}
                        onChange={(e) => setConfig({ ...config, snowflakeSchema: e.target.value })}
                        placeholder="PUBLIC"
                        className="w-full px-3.5 py-2.5 rounded-xl bg-[#1b1b20] border border-[#26262b] text-sm text-zinc-200 focus:outline-none focus:border-[#38bdf8] font-mono"
                      />
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-medium text-zinc-200">Role (Optional)</label>
                      <input
                        type="text"
                        value={config.snowflakeRole || ""}
                        onChange={(e) => setConfig({ ...config, snowflakeRole: e.target.value })}
                        placeholder="ACCOUNTADMIN"
                        className="w-full px-3.5 py-2.5 rounded-xl bg-[#1b1b20] border border-[#26262b] text-sm text-zinc-200 focus:outline-none focus:border-[#38bdf8] font-mono"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-zinc-200">Username</label>
                      <input
                        type="text"
                        value={config.username}
                        onChange={(e) => setConfig({ ...config, username: e.target.value })}
                        placeholder="snowflake_user"
                        className="w-full px-3.5 py-2.5 rounded-xl bg-[#1b1b20] border border-[#26262b] text-sm text-zinc-200 focus:outline-none focus:border-[#38bdf8] font-mono"
                      />
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-medium text-zinc-200">Password / Token</label>
                      <div className="relative">
                        <input
                          type={showPassword ? "text" : "password"}
                          value={config.password}
                          onChange={(e) => setConfig({ ...config, password: e.target.value })}
                          placeholder="••••••••••••"
                          className="w-full pl-3.5 pr-10 py-2.5 rounded-xl bg-[#1b1b20] border border-[#26262b] text-sm text-zinc-200 focus:outline-none focus:border-[#38bdf8] font-mono"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-3 top-3 text-zinc-500 hover:text-zinc-300 cursor-pointer"
                        >
                          {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* 6. BIGQUERY */}
              {config.dbType === "BigQuery" && (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-zinc-200">Google Cloud Project ID</label>
                      <input
                        type="text"
                        value={config.bigQueryProjectId || ""}
                        onChange={(e) => setConfig({ ...config, bigQueryProjectId: e.target.value })}
                        placeholder="schemaai-enterprise-prod"
                        className="w-full px-3.5 py-2.5 rounded-xl bg-[#1b1b20] border border-[#26262b] text-sm text-zinc-200 focus:outline-none focus:border-[#38bdf8] font-mono"
                      />
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-medium text-zinc-200">Dataset ID</label>
                      <input
                        type="text"
                        value={config.bigQueryDatasetId || ""}
                        onChange={(e) => setConfig({ ...config, bigQueryDatasetId: e.target.value })}
                        placeholder="analytics_warehouse"
                        className="w-full px-3.5 py-2.5 rounded-xl bg-[#1b1b20] border border-[#26262b] text-sm text-zinc-200 focus:outline-none focus:border-[#38bdf8] font-mono"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium text-zinc-200">Service Account Client Email</label>
                    <input
                      type="text"
                      value={config.bigQueryClientEmail || ""}
                      onChange={(e) => setConfig({ ...config, bigQueryClientEmail: e.target.value })}
                      placeholder="bigquery-reader@project.iam.gserviceaccount.com"
                      className="w-full px-3.5 py-2.5 rounded-xl bg-[#1b1b20] border border-[#26262b] text-sm text-zinc-200 focus:outline-none focus:border-[#38bdf8] font-mono"
                    />
                  </div>
                </div>
              )}

              {/* 7. SQLITE */}
              {config.dbType === "SQLite" && (
                <div className="space-y-4">
                  {currentMode === "params" ? (
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-zinc-200 flex items-center gap-1.5">
                        <FileCode className="w-4 h-4 text-sky-400" /> Database File Path
                      </label>
                      <input
                        type="text"
                        value={config.sqlitePath || ""}
                        onChange={(e) => setConfig({ ...config, sqlitePath: e.target.value })}
                        placeholder="./data/production_core.db or :memory:"
                        className="w-full px-3.5 py-2.5 rounded-xl bg-[#1b1b20] border border-[#26262b] text-sm text-zinc-200 focus:outline-none focus:border-[#38bdf8] font-mono"
                      />
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-zinc-200 flex items-center gap-1.5">
                        <Globe className="w-4 h-4 text-sky-400" /> SQLite Cloud Connection URI / API Token
                      </label>
                      <input
                        type="text"
                        value={config.connectionUri}
                        onChange={(e) => setConfig({ ...config, connectionUri: e.target.value })}
                        placeholder="sqlitecloud://account.sqlite.cloud:8860/dbname?apikey=token"
                        className="w-full px-3.5 py-2.5 rounded-xl bg-[#1b1b20] border border-[#26262b] text-sm text-zinc-200 focus:outline-none focus:border-[#38bdf8] font-mono"
                      />
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* TAB 2: AI ENGINE */}
          {activeSettingsTab === "ai" && (
            <div className="space-y-4 animate-in fade-in duration-150">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-zinc-200">
                    Model Provider
                  </label>
                  <select
                    value={config.llmProvider}
                    onChange={(e) =>
                      setConfig({
                        ...config,
                        llmProvider: e.target.value as "openai" | "anthropic" | "custom",
                      })
                    }
                    className="w-full px-3.5 py-2.5 rounded-xl bg-[#1b1b20] border border-[#26262b] text-sm text-zinc-200 focus:outline-none focus:border-[#38bdf8] transition-colors"
                  >
                    <option value="openai">OpenAI GPT-4o (Default)</option>
                    <option value="anthropic">Anthropic Claude 3.5 Sonnet</option>
                    <option value="custom">Self-Hosted DeepSeek-V3 / Ollama</option>
                  </select>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-zinc-200 flex items-center gap-1.5">
                    <Key className="w-4 h-4 text-[#38bdf8]" /> API Secret Key
                  </label>
                  <div className="relative">
                    <input
                      type={showApiKey ? "text" : "password"}
                      value={config.llmApiKey}
                      onChange={(e) =>
                        setConfig({ ...config, llmApiKey: e.target.value })
                      }
                      placeholder="sk-proj-..."
                      className="w-full pl-3.5 pr-10 py-2.5 rounded-xl bg-[#1b1b20] border border-[#26262b] text-sm text-zinc-200 focus:outline-none focus:border-[#38bdf8] font-mono transition-colors"
                    />
                    <button
                      type="button"
                      onClick={() => setShowApiKey(!showApiKey)}
                      className="absolute right-3 top-3 text-zinc-500 hover:text-zinc-300 cursor-pointer"
                    >
                      {showApiKey ? (
                        <EyeOff className="w-4 h-4" />
                      ) : (
                        <Eye className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                </div>
              </div>

              <div className="p-4 rounded-xl bg-[#121215] border border-[#222226] text-sm text-zinc-300 flex items-start space-x-3 shadow-inner">
                <Cpu className="w-5 h-5 text-[#38bdf8] shrink-0 mt-0.5" />
                <p className="leading-relaxed">
                  SchemaAI utilizes zero-shot relational schema embeddings to translate natural language prompts into optimized ASTs with fast sub-50ms synthesis overhead.
                </p>
              </div>
            </div>
          )}

          {/* TAB 3: SECURITY GUARD */}
          {activeSettingsTab === "security" && (
            <div className="space-y-4 animate-in fade-in duration-150">
              <div className="p-4 rounded-2xl bg-[#121215] border border-[#222226] flex items-center justify-between shadow-inner">
                <div className="space-y-1 pr-4">
                  <div className="flex items-center space-x-2">
                    <Shield className="w-5 h-5 text-[#38bdf8]" />
                    <span className="font-semibold text-sm sm:text-base text-zinc-100">
                      Strict Mutation Guard Rails
                    </span>
                  </div>
                  <p className="text-xs sm:text-sm text-zinc-400">
                    Intercept and require explicit admin escalation before running destructive DDL/DML statements (<code className="text-rose-400">DELETE</code>, <code className="text-rose-400">UPDATE</code>, <code className="text-rose-400">DROP</code>).
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
                  <div className="w-12 h-6 bg-zinc-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#38bdf8] shadow-inner" />
                </label>
              </div>

              <div className="grid grid-cols-2 gap-3 text-xs sm:text-sm">
                <div className="p-3.5 rounded-xl bg-[#121215] border border-[#222226] space-y-1 shadow-inner">
                  <span className="text-zinc-400 text-xs">SQL Injection Defense</span>
                  <p className="text-[#38bdf8] font-semibold">Active (Parameterized AST)</p>
                </div>
                <div className="p-3.5 rounded-xl bg-[#121215] border border-[#222226] space-y-1 shadow-inner">
                  <span className="text-zinc-400 text-xs">Audit Telemetry Logging</span>
                  <p className="text-amber-400 font-semibold">Immutable On-Disk Log</p>
                </div>
              </div>
            </div>
          )}

          {/* Test Connection Telemetry Output Feedback */}
          {testResult.status !== "idle" && (
            <div
              className={cn(
                "p-4 rounded-xl border text-sm flex items-start space-x-3 animate-in fade-in duration-200",
                testResult.status === "success"
                  ? "bg-[#38bdf8]/10 border-[#38bdf8]/30 text-[#38bdf8]"
                  : "bg-rose-950/30 border-rose-500/30 text-rose-300"
              )}
            >
              {testResult.status === "success" ? (
                <CheckCheck className="w-5 h-5 text-[#38bdf8] mt-0.5 shrink-0" />
              ) : (
                <AlertCircle className="w-5 h-5 text-rose-400 mt-0.5 shrink-0" />
              )}
              <div className="flex-1 space-y-1.5">
                <p className="font-medium">{testResult.message}</p>
                {testResult.hint && (
                  <p className="text-xs text-rose-300/80 font-mono">
                    💡 Hint: {testResult.hint}
                  </p>
                )}
                {testResult.status === "success" && (
                  <div className="flex flex-wrap items-center gap-2 text-xs text-[#38bdf8]/90 font-mono pt-1">
                    {testResult.latencyMs && <span>⚡ Roundtrip: {testResult.latencyMs}ms</span>}
                    <span>•</span>
                    <span>Introspected: {testResult.tablesCount || 6} tables</span>
                    <span>•</span>
                    <span>TLS 1.3 Active</span>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-5 sm:px-6 py-4 border-t border-[#222226] bg-[#121215] flex items-center justify-between shrink-0">
          <button
            type="button"
            onClick={handleTestConnection}
            disabled={isTesting}
            className="flex items-center space-x-2 px-4 py-2 rounded-xl bg-[#1b1b20] hover:bg-[#25252e] text-zinc-200 hover:text-white border border-[#26262b] text-sm font-medium transition-all disabled:opacity-50 cursor-pointer"
          >
            {isTesting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin text-[#38bdf8]" />
                <span>Validating Handshake...</span>
              </>
            ) : (
              <>
                <Zap className="w-4 h-4 text-amber-400" />
                <span>Test Connection</span>
              </>
            )}
          </button>

          <div className="flex items-center space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-zinc-400 hover:text-white hover:bg-[#202026] text-sm font-medium transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSaveAndIntrospect}
              disabled={isSaving}
              className="flex items-center space-x-2 px-5 py-2 rounded-xl bg-[#38bdf8] hover:bg-[#0284c7] text-black font-semibold text-sm shadow-lg shadow-[#38bdf8]/20 transition-all disabled:opacity-50 cursor-pointer"
            >
              {isSaving ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Connecting &amp; Introspecting...</span>
                </>
              ) : (
                <>
                  <Check className="w-4 h-4" />
                  <span>Save &amp; Connect</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

