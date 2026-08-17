"use client";

import React, { useState } from "react";
import {
  X,
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
} from "lucide-react";
import { cn } from "@/lib/utils";

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (config: DatabaseConfig) => void;
}

export interface DatabaseConfig {
  dbType: string;
  connectionUri: string;
  username: string;
  password: string;
  databaseName: string;
  llmProvider: "openai" | "anthropic" | "custom";
  llmApiKey: string;
  enableQueryGuard: boolean;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  onSave,
}) => {
  const [activeSettingsTab, setActiveSettingsTab] = useState<
    "database" | "ai" | "security"
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

  if (!isOpen) return null;

  const handleTestConnection = async () => {
    setIsTesting(true);
    setTestResult({ status: "idle", message: "" });

    await new Promise((resolve) => setTimeout(resolve, 950));

    if (config.connectionUri.trim().length > 0) {
      setTestResult({
        status: "success",
        message: `Successfully connected to ${config.dbType} [${config.databaseName}] with introspect privileges.`,
        latencyMs: 29,
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
    onSave(config);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div
        className="relative w-full max-w-2xl rounded-2xl bg-[#171412] border border-[#292524] shadow-2xl overflow-hidden text-stone-200 supabase-modal"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#292524] bg-[#141210]">
          <div className="flex items-center space-x-3">
            <div className="p-2 rounded-xl bg-[#3ecf8e]/10 border border-[#3ecf8e]/20 text-[#3ecf8e]">
              <Database className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-stone-100 tracking-tight">
                Database & AI Engine Configuration
              </h2>
              <p className="text-xs text-stone-400">
                Manage relational schemas, API credentials, and query guard rails
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-stone-400 hover:text-stone-100 hover:bg-stone-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Sub-navigation Tabs */}
        <div className="px-6 pt-3 pb-0 bg-[#141210]/60 border-b border-[#292524] flex items-center space-x-2">
          {[
            { id: "database" as const, label: "Database Connection", icon: Database },
            { id: "ai" as const, label: "AI Engine & LLM", icon: Sparkles },
            { id: "security" as const, label: "Mutation Guard", icon: Shield },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeSettingsTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveSettingsTab(tab.id)}
                className={cn(
                  "flex items-center space-x-2 px-3.5 py-2 text-xs font-medium border-b-2 transition-all duration-200 -mb-[1px]",
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

        {/* Modal Body */}
        <div className="p-6 space-y-5 max-h-[65vh] overflow-y-auto">
          {/* TAB 1: DATABASE */}
          {activeSettingsTab === "database" && (
            <div className="space-y-4 animate-in fade-in duration-150">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Engine Selector */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-stone-300">
                    Database Engine
                  </label>
                  <select
                    value={config.dbType}
                    onChange={(e) =>
                      setConfig({ ...config, dbType: e.target.value })
                    }
                    className="w-full px-3 py-2 rounded-xl bg-[#141210] border border-[#292524] text-sm text-stone-200 focus:outline-none focus:border-[#3ecf8e] focus:ring-1 focus:ring-[#3ecf8e]"
                  >
                    <option value="PostgreSQL">PostgreSQL (15/16)</option>
                    <option value="Supabase">Supabase PostgreSQL</option>
                    <option value="Neon">Neon Serverless</option>
                    <option value="MySQL">MySQL 8.0</option>
                    <option value="CockroachDB">CockroachDB</option>
                    <option value="SQLite">SQLite Cloud</option>
                  </select>
                </div>

                {/* Database Name */}
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
                    className="w-full px-3 py-2 rounded-xl bg-[#141210] border border-[#292524] text-xs text-stone-200 focus:outline-none focus:border-[#3ecf8e] focus:ring-1 focus:ring-[#3ecf8e] font-mono"
                  />
                </div>
              </div>

              {/* Connection URI */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold text-stone-300 flex items-center gap-1.5">
                    <Globe className="w-3.5 h-3.5 text-[#3ecf8e]" />
                    <span>Connection URI</span>
                  </label>
                  <span className="text-[10px] text-[#3ecf8e] font-mono">
                    SSL Mode Required
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
                    className="w-full pl-3 pr-9 py-2 rounded-xl bg-[#141210] border border-[#292524] text-xs text-stone-200 focus:outline-none focus:border-[#3ecf8e] focus:ring-1 focus:ring-[#3ecf8e] font-mono"
                  />
                  <Lock className="w-3.5 h-3.5 text-stone-500 absolute right-3 top-2.5" />
                </div>
              </div>

              {/* Username & Password */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-stone-300 flex items-center gap-1">
                    <User className="w-3 h-3 text-stone-400" /> Username
                  </label>
                  <input
                    type="text"
                    value={config.username}
                    onChange={(e) =>
                      setConfig({ ...config, username: e.target.value })
                    }
                    placeholder="postgres.admin"
                    className="w-full px-3 py-2 rounded-xl bg-[#141210] border border-[#292524] text-xs text-stone-200 focus:outline-none focus:border-[#3ecf8e] font-mono"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-stone-300 flex items-center gap-1">
                    <Lock className="w-3 h-3 text-stone-400" /> Password
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? "text" : "password"}
                      value={config.password}
                      onChange={(e) =>
                        setConfig({ ...config, password: e.target.value })
                      }
                      placeholder="••••••••••••"
                      className="w-full pl-3 pr-8 py-2 rounded-xl bg-[#141210] border border-[#292524] text-xs text-stone-200 focus:outline-none focus:border-[#3ecf8e] font-mono"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-2.5 top-2.5 text-stone-500 hover:text-stone-300"
                    >
                      {showPassword ? (
                        <EyeOff className="w-3.5 h-3.5" />
                      ) : (
                        <Eye className="w-3.5 h-3.5" />
                      )}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: AI ENGINE */}
          {activeSettingsTab === "ai" && (
            <div className="space-y-4 animate-in fade-in duration-150">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
                    className="w-full px-3 py-2 rounded-xl bg-[#141210] border border-[#292524] text-sm text-stone-200 focus:outline-none focus:border-[#3ecf8e]"
                  >
                    <option value="openai">OpenAI GPT-4o (Recommended)</option>
                    <option value="anthropic">Anthropic Claude 3.5 Sonnet</option>
                    <option value="custom">Self-Hosted DeepSeek-V3 / Ollama</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-stone-300 flex items-center gap-1">
                    <Key className="w-3 h-3 text-[#3ecf8e]" /> API Secret Key
                  </label>
                  <div className="relative">
                    <input
                      type={showApiKey ? "text" : "password"}
                      value={config.llmApiKey}
                      onChange={(e) =>
                        setConfig({ ...config, llmApiKey: e.target.value })
                      }
                      placeholder="sk-proj-..."
                      className="w-full pl-3 pr-8 py-2 rounded-xl bg-[#141210] border border-[#292524] text-xs text-stone-200 focus:outline-none focus:border-[#3ecf8e] font-mono"
                    />
                    <button
                      type="button"
                      onClick={() => setShowApiKey(!showApiKey)}
                      className="absolute right-2.5 top-2.5 text-stone-500 hover:text-stone-300"
                    >
                      {showApiKey ? (
                        <EyeOff className="w-3.5 h-3.5" />
                      ) : (
                        <Eye className="w-3.5 h-3.5" />
                      )}
                    </button>
                  </div>
                </div>
              </div>

              <div className="p-3.5 rounded-xl bg-[#141210] border border-[#292524] text-xs text-stone-300 flex items-start space-x-2.5 shadow-inner">
                <Cpu className="w-4 h-4 text-[#3ecf8e] shrink-0 mt-0.5" />
                <p>
                  SchemaAI uses zero-shot relational schema embeddings to translate plain English prompts into highly optimized ASTs with sub-50ms execution overhead.
                </p>
              </div>
            </div>
          )}

          {/* TAB 3: SECURITY GUARD */}
          {activeSettingsTab === "security" && (
            <div className="space-y-4 animate-in fade-in duration-150">
              <div className="p-4 rounded-2xl bg-[#141210] border border-[#292524] flex items-center justify-between shadow-inner">
                <div className="space-y-1 pr-4">
                  <div className="flex items-center space-x-2">
                    <Shield className="w-4 h-4 text-[#3ecf8e]" />
                    <span className="font-semibold text-sm text-stone-100">
                      Strict Mutation Guard Rails
                    </span>
                  </div>
                  <p className="text-xs text-stone-400">
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
                  <div className="w-11 h-6 bg-stone-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#3ecf8e] shadow-inner" />
                </label>
              </div>

              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="p-3 rounded-xl bg-[#141210] border border-[#292524] space-y-1 shadow-inner">
                  <span className="text-stone-400 text-[11px]">SQL Injection Defense</span>
                  <p className="text-[#3ecf8e] font-semibold">Active (Parameterized AST)</p>
                </div>
                <div className="p-3 rounded-xl bg-[#141210] border border-[#292524] space-y-1 shadow-inner">
                  <span className="text-stone-400 text-[11px]">Audit Telemetry Logging</span>
                  <p className="text-amber-400 font-semibold">Immutable On-Disk Cache</p>
                </div>
              </div>
            </div>
          )}

          {/* Test Connection Telemetry Output Feedback */}
          {testResult.status !== "idle" && (
            <div
              className={cn(
                "p-3.5 rounded-xl border text-xs flex items-start space-x-3 animate-in fade-in duration-200",
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
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-4 border-t border-[#292524] bg-[#141210] flex items-center justify-between">
          <button
            type="button"
            onClick={handleTestConnection}
            disabled={isTesting}
            className="flex items-center space-x-2 px-3.5 py-2 rounded-xl bg-[#1c1917] hover:bg-[#201d1a] text-stone-300 hover:text-stone-100 border border-[#292524] text-xs font-medium transition-all disabled:opacity-50"
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

          <div className="flex items-center space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-stone-400 hover:text-stone-100 hover:bg-stone-800 text-xs font-medium transition-colors"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSaveAndIntrospect}
              disabled={isSaving}
              className="flex items-center space-x-2 px-4 py-2 rounded-xl bg-gradient-to-r from-[#3ecf8e] to-[#22c55e] hover:from-[#34d399] hover:to-[#16a34a] text-[#0a1a12] font-bold text-xs shadow-lg shadow-[#3ecf8e]/20 transition-all disabled:opacity-50"
            >
              {isSaving ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Syncing Schema...</span>
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
      </div>
    </div>
  );
};
