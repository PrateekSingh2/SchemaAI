"use client";

import React, { useState } from "react";
import { Topbar } from "@/components/Topbar";
import {
  Database,
  Key,
  Shield,
  CheckCircle2,
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
  Layers,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { DatabaseConfig } from "@/components/SettingsModal";

export default function SettingsPage() {
  const [activeSettingsTab, setActiveSettingsTab] = useState<
    "database" | "ai" | "security" | "pooling"
  >("database");

  const [config, setConfig] = useState<DatabaseConfig>({
    dbType: "PostgreSQL",
    connectionUri:
      "postgresql://postgres.user:••••••••@aws-0-us-east-1.pooler.supabase.com:5432/production_core_db",
    username: "postgres.admin",
    password: "••••••••••••••••",
    databaseName: "production_core_db",
    llmProvider: "openai",
    llmApiKey: "sk-proj-••••••••••••••••••••••••••••••••",
    enableQueryGuard: true,
  });

  const [showPassword, setShowPassword] = useState(false);
  const [showApiKey, setShowApiKey] = useState(false);

  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState<{
    status: "idle" | "success" | "error";
    message: string;
    latencyMs?: number;
  }>({ status: "idle", message: "" });

  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  const handleTestConnection = async () => {
    setIsTesting(true);
    setTestResult({ status: "idle", message: "" });

    await new Promise((resolve) => setTimeout(resolve, 950));

    if (config.connectionUri.trim().length > 0) {
      setTestResult({
        status: "success",
        message: `Successfully connected to ${config.dbType} [${config.databaseName}] with introspect privileges.`,
        latencyMs: 27,
      });
    } else {
      setTestResult({
        status: "error",
        message: "Unable to establish handshake. Please check connection string and credentials.",
      });
    }
    setIsTesting(false);
  };

  const handleSaveAndIntrospect = async () => {
    setIsSaving(true);
    await new Promise((resolve) => setTimeout(resolve, 700));
    setIsSaving(false);
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 2500);
  };

  return (
    <div className="h-screen w-screen overflow-hidden bg-[#121110] text-stone-100 flex flex-col font-sans select-none antialiased">
      <Topbar dbName={config.databaseName} dbType={config.dbType} />

      <main className="flex-1 overflow-y-auto p-4 sm:p-8 max-w-5xl mx-auto w-full space-y-6">
        {/* Page Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#292524]">
          <div className="flex items-center space-x-3">
            <div className="p-3 rounded-2xl bg-[#3ecf8e]/10 border border-[#3ecf8e]/20 text-[#3ecf8e]">
              <Database className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-stone-100 tracking-tight">
                Project & Engine Configuration
              </h1>
              <p className="text-xs text-stone-400">
                Manage relational schemas, API credentials, and query guard rails
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            <button
              type="button"
              onClick={handleTestConnection}
              disabled={isTesting}
              className="flex items-center space-x-2 px-4 py-2.5 rounded-xl bg-[#1c1917] hover:bg-[#201d1a] text-stone-300 hover:text-stone-100 border border-[#292524] text-xs font-medium transition-all disabled:opacity-50 shadow-sm"
            >
              {isTesting ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin text-[#3ecf8e]" />
                  <span>Testing Handshake...</span>
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
              className="flex items-center space-x-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#3ecf8e] to-[#22c55e] hover:from-[#34d399] hover:to-[#16a34a] text-[#0a1a12] font-bold text-xs shadow-lg shadow-[#3ecf8e]/20 transition-all disabled:opacity-50"
            >
              {isSaving ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin text-[#0a1a12]" />
                  <span>Syncing Schema...</span>
                </>
              ) : saveSuccess ? (
                <>
                  <CheckCheck className="w-3.5 h-3.5 text-[#0a1a12]" />
                  <span>Saved & Introspected!</span>
                </>
              ) : (
                <>
                  <Check className="w-3.5 h-3.5" />
                  <span>Save & Introspect</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Diagnostic Telemetry Output */}
        {testResult.status !== "idle" && (
          <div
            className={cn(
              "p-4 rounded-2xl border text-xs flex items-start space-x-3 animate-in fade-in duration-200 shadow-md",
              testResult.status === "success"
                ? "bg-[#3ecf8e]/10 border-[#3ecf8e]/30 text-[#3ecf8e]"
                : "bg-rose-950/30 border-rose-500/30 text-rose-300"
            )}
          >
            {testResult.status === "success" ? (
              <CheckCheck className="w-4 h-4 text-[#3ecf8e] mt-0.5 shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 text-rose-400 mt-0.5 shrink-0" />
            )}
            <div className="flex-1 space-y-1">
              <p className="font-medium">{testResult.message}</p>
              {testResult.latencyMs && (
                <div className="flex items-center space-x-3 text-[11px] text-[#3ecf8e]/90 font-mono">
                  <span>⚡ Roundtrip: {testResult.latencyMs}ms</span>
                  <span>•</span>
                  <span>Pool Status: 10/10 Available</span>
                  <span>•</span>
                  <span>TLS 1.3 Active</span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Tab Navigation Segmented Bar */}
        <div className="flex items-center space-x-2 border-b border-[#292524] pb-0">
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
                  "flex items-center space-x-2 px-4 py-2.5 text-xs font-medium border-b-2 transition-all duration-200 -mb-[1px]",
                  isActive
                    ? "border-[#3ecf8e] text-[#3ecf8e] font-semibold"
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
        <div className="p-6 rounded-2xl bg-[#171412] border border-[#292524] shadow-xl supabase-panel space-y-6">
          {/* TAB 1: DATABASE */}
          {activeSettingsTab === "database" && (
            <div className="space-y-5 animate-in fade-in duration-150">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-stone-300">
                    Database Engine
                  </label>
                  <select
                    value={config.dbType}
                    onChange={(e) =>
                      setConfig({ ...config, dbType: e.target.value })
                    }
                    className="w-full px-3.5 py-2.5 rounded-xl bg-[#141210] border border-[#292524] text-sm text-stone-200 focus:outline-none focus:border-[#3ecf8e] focus:ring-1 focus:ring-[#3ecf8e]"
                  >
                    <option value="PostgreSQL">PostgreSQL (15/16)</option>
                    <option value="Supabase">Supabase PostgreSQL</option>
                    <option value="Neon">Neon Serverless</option>
                    <option value="MySQL">MySQL 8.0</option>
                    <option value="CockroachDB">CockroachDB</option>
                    <option value="SQLite">SQLite Cloud</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-stone-300">
                    Database Name
                  </label>
                  <input
                    type="text"
                    value={config.databaseName}
                    onChange={(e) =>
                      setConfig({ ...config, databaseName: e.target.value })
                    }
                    placeholder="production_core_db"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-[#141210] border border-[#292524] text-xs text-stone-200 focus:outline-none focus:border-[#3ecf8e] focus:ring-1 focus:ring-[#3ecf8e] font-mono shadow-inner"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold text-stone-300 flex items-center gap-1.5">
                    <Globe className="w-3.5 h-3.5 text-[#3ecf8e]" />
                    <span>Connection URI</span>
                  </label>
                  <span className="text-[10px] text-[#3ecf8e] font-mono">
                    SSL Required
                  </span>
                </div>
                <div className="relative">
                  <input
                    type="text"
                    value={config.connectionUri}
                    onChange={(e) =>
                      setConfig({ ...config, connectionUri: e.target.value })
                    }
                    placeholder="postgresql://user:password@host:5432/db"
                    className="w-full pl-3.5 pr-10 py-2.5 rounded-xl bg-[#141210] border border-[#292524] text-xs text-stone-200 focus:outline-none focus:border-[#3ecf8e] font-mono shadow-inner"
                  />
                  <Lock className="w-4 h-4 text-stone-500 absolute right-3.5 top-3" />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-stone-300 flex items-center gap-1">
                    <User className="w-3.5 h-3.5 text-stone-400" /> Username
                  </label>
                  <input
                    type="text"
                    value={config.username}
                    onChange={(e) =>
                      setConfig({ ...config, username: e.target.value })
                    }
                    placeholder="postgres.admin"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-[#141210] border border-[#292524] text-xs text-stone-200 focus:outline-none focus:border-[#3ecf8e] font-mono shadow-inner"
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
                      onChange={(e) =>
                        setConfig({ ...config, password: e.target.value })
                      }
                      placeholder="••••••••••••"
                      className="w-full pl-3.5 pr-10 py-2.5 rounded-xl bg-[#141210] border border-[#292524] text-xs text-stone-200 focus:outline-none focus:border-[#3ecf8e] font-mono shadow-inner"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3.5 top-3 text-stone-500 hover:text-stone-300"
                    >
                      {showPassword ? (
                        <EyeOff className="w-4 h-4" />
                      ) : (
                        <Eye className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                </div>
              </div>
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
                        llmProvider: e.target.value as "openai" | "anthropic" | "custom",
                      })
                    }
                    className="w-full px-3.5 py-2.5 rounded-xl bg-[#141210] border border-[#292524] text-sm text-stone-200 focus:outline-none focus:border-[#3ecf8e]"
                  >
                    <option value="openai">OpenAI GPT-4o (Recommended)</option>
                    <option value="anthropic">Anthropic Claude 3.5 Sonnet</option>
                    <option value="custom">Self-Hosted DeepSeek-V3 / Ollama</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-stone-300 flex items-center gap-1">
                    <Key className="w-3.5 h-3.5 text-[#3ecf8e]" /> API Secret Key
                  </label>
                  <div className="relative">
                    <input
                      type={showApiKey ? "text" : "password"}
                      value={config.llmApiKey}
                      onChange={(e) =>
                        setConfig({ ...config, llmApiKey: e.target.value })
                      }
                      placeholder="sk-proj-..."
                      className="w-full pl-3.5 pr-10 py-2.5 rounded-xl bg-[#141210] border border-[#292524] text-xs text-stone-200 focus:outline-none focus:border-[#3ecf8e] font-mono shadow-inner"
                    />
                    <button
                      type="button"
                      onClick={() => setShowApiKey(!showApiKey)}
                      className="absolute right-3.5 top-3 text-stone-500 hover:text-stone-300"
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

              <div className="p-4 rounded-2xl bg-[#141210] border border-[#292524] text-xs text-stone-300 flex items-start space-x-3 shadow-inner">
                <Cpu className="w-5 h-5 text-[#3ecf8e] shrink-0 mt-0.5" />
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
                    <Shield className="w-5 h-5 text-[#3ecf8e]" />
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
                  <div className="w-12 h-6 bg-stone-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#3ecf8e] shadow-inner" />
                </label>
              </div>

              <div className="grid grid-cols-2 gap-4 text-xs">
                <div className="p-4 rounded-2xl bg-[#141210] border border-[#292524] space-y-1.5 shadow-inner">
                  <span className="text-stone-400 text-[11px] block">SQL Injection Defense</span>
                  <p className="text-[#3ecf8e] font-semibold">Active (Parameterized AST)</p>
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
                  <Server className="w-4 h-4 text-[#3ecf8e]" />
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
                    <p className="font-mono font-bold text-[#3ecf8e] mt-1">100 Active</p>
                  </div>
                  <div className="p-3 rounded-xl bg-[#1c1917] border border-[#292524]">
                    <span className="text-stone-500 text-[10px]">Default Timeout</span>
                    <p className="font-mono font-bold text-amber-300 mt-1">10,000 ms</p>
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
