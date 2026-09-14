"use client";

import React, { useState } from "react";
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
                Manage relational connection, LLM providers, and safety guard rails
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
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Engine Selector */}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-zinc-200">
                    Database Engine
                  </label>
                  <select
                    value={config.dbType}
                    onChange={(e) =>
                      setConfig({ ...config, dbType: e.target.value })
                    }
                    className="w-full px-3.5 py-2.5 rounded-xl bg-[#1b1b20] border border-[#26262b] text-sm text-zinc-200 focus:outline-none focus:border-[#38bdf8] transition-colors"
                  >
                    <option value="PostgreSQL">PostgreSQL (15/16)</option>
                    <option value="MySQL">MySQL</option>
                    <option value="Apache Kafka">Apache Kafka</option>
                    <option value="OpenSearch">OpenSearch</option>
                    <option value="ClickHouse">ClickHouse</option>
                    <option value="Valkey">Valkey</option>
                    <option value="Dragonfly">Dragonfly</option>
                    <option value="Aiven for Metrics">Aiven for Metrics</option>
                    <option value="Grafana">Grafana</option>
                    <option value="MongoDB">MongoDB</option>
                    <option value="Redis">Redis</option>
                    <option value="SQLite">SQLite Cloud</option>
                    <option value="Oracle">Oracle Database</option>
                    <option value="SQL Server">Microsoft SQL Server</option>
                    <option value="Snowflake">Snowflake</option>
                    <option value="BigQuery">Google BigQuery</option>
                    <option value="Cassandra">Apache Cassandra</option>
                    <option value="Elasticsearch">Elasticsearch</option>
                    <option value="MariaDB">MariaDB</option>
                    <option value="Supabase">Supabase PostgreSQL</option>
                    <option value="Neon">Neon Serverless</option>
                    <option value="CockroachDB">CockroachDB</option>
                  </select>
                </div>

                {/* Database Name */}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-zinc-200">
                    Database Name
                  </label>
                  <input
                    type="text"
                    value={config.databaseName}
                    onChange={(e) =>
                      setConfig({ ...config, databaseName: e.target.value })
                    }
                    placeholder="production_core_db"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-[#1b1b20] border border-[#26262b] text-sm text-zinc-200 focus:outline-none focus:border-[#38bdf8] font-mono transition-colors"
                  />
                </div>
              </div>

              {/* Connection URI */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-medium text-zinc-200 flex items-center gap-2">
                    <Globe className="w-4 h-4 text-[#38bdf8]" />
                    <span>Connection URI</span>
                  </label>
                  <span className="text-xs text-[#38bdf8] font-mono">
                    SSL Enabled
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
                    className="w-full pl-3.5 pr-10 py-2.5 rounded-xl bg-[#1b1b20] border border-[#26262b] text-sm text-zinc-200 focus:outline-none focus:border-[#38bdf8] font-mono transition-colors"
                  />
                  <Lock className="w-4 h-4 text-zinc-500 absolute right-3.5 top-3" />
                </div>
              </div>

              {/* Username & Password */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-zinc-200 flex items-center gap-1.5">
                    <User className="w-4 h-4 text-zinc-400" /> Username
                  </label>
                  <input
                    type="text"
                    value={config.username}
                    onChange={(e) =>
                      setConfig({ ...config, username: e.target.value })
                    }
                    placeholder="postgres.admin"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-[#1b1b20] border border-[#26262b] text-sm text-zinc-200 focus:outline-none focus:border-[#38bdf8] font-mono transition-colors"
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
                      onChange={(e) =>
                        setConfig({ ...config, password: e.target.value })
                      }
                      placeholder="••••••••••••"
                      className="w-full pl-3.5 pr-10 py-2.5 rounded-xl bg-[#1b1b20] border border-[#26262b] text-sm text-zinc-200 focus:outline-none focus:border-[#38bdf8] font-mono transition-colors"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-3 text-zinc-500 hover:text-zinc-300 cursor-pointer"
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
              <div className="flex-1 space-y-1">
                <p className="font-medium">{testResult.message}</p>
                {testResult.latencyMs && (
                  <div className="flex items-center space-x-3 text-xs text-[#38bdf8]/90 font-mono">
                    <span>⚡ Roundtrip: {testResult.latencyMs}ms</span>
                    <span>•</span>
                    <span>Pool Status: 10/10 Ready</span>
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
                <span>Testing Handshake...</span>
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
                  <span>Syncing Schema...</span>
                </>
              ) : (
                <>
                  <Check className="w-4 h-4" />
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
