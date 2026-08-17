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
  const [config, setConfig] = useState<DatabaseConfig>({
    dbType: "PostgreSQL",
    connectionUri: "postgresql://postgres.user:••••••••@aws-0-us-east-1.pooler.supabase.com:5432/production_core_db",
    username: "postgres.admin",
    password: "••••••••••••••••",
    databaseName: "production_core_db",
    llmProvider: "openai",
    llmApiKey: "sk-proj-••••••••••••••••••••••••••••••••••••••••",
    enableQueryGuard: true,
  });

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

    // Simulate network introspection call
    await new Promise((resolve) => setTimeout(resolve, 1100));

    if (config.connectionUri.trim().length > 0) {
      setTestResult({
        status: "success",
        message: `Successfully connected to ${config.dbType} (${config.databaseName}) with read-write introspect permissions.`,
        latencyMs: 34,
      });
    } else {
      setTestResult({
        status: "error",
        message: "Invalid connection string. Please check hostname and credentials.",
      });
    }
    setIsTesting(false);
  };

  const handleSaveAndIntrospect = async () => {
    setIsSaving(true);
    await new Promise((resolve) => setTimeout(resolve, 800));
    setIsSaving(false);
    onSave(config);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-in fade-in duration-200">
      <div
        className="relative w-full max-w-2xl rounded-2xl glass-modal border border-slate-700/80 shadow-2xl overflow-hidden text-slate-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800/80 bg-slate-900/60">
          <div className="flex items-center space-x-3">
            <div className="p-2 rounded-xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-400">
              <Database className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-white">
                Database Configuration & AI Engine
              </h2>
              <p className="text-xs text-slate-400">
                Configure database connection strings and LLM security parameters
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-5 max-h-[75vh] overflow-y-auto">
          {/* Section: Database Details */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-cyan-400 flex items-center gap-1.5">
                <Globe className="w-3.5 h-3.5" /> Database Connection
              </span>
              <span className="text-[11px] text-slate-400">
                SSL Mode: <strong className="text-emerald-400">Required</strong>
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Database Type */}
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-slate-300">
                  Database Engine
                </label>
                <select
                  value={config.dbType}
                  onChange={(e) =>
                    setConfig({ ...config, dbType: e.target.value })
                  }
                  className="w-full px-3 py-2 rounded-lg bg-slate-900/90 border border-slate-700/80 text-sm text-slate-200 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500"
                >
                  <option value="PostgreSQL">PostgreSQL</option>
                  <option value="Supabase">Supabase (PostgreSQL 16)</option>
                  <option value="MySQL">MySQL 8.0</option>
                  <option value="Neon">Neon Serverless Postgres</option>
                  <option value="CockroachDB">CockroachDB</option>
                  <option value="SQLite">SQLite 3 (Local / Cloud)</option>
                </select>
              </div>

              {/* Database Name */}
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-slate-300">
                  Database Name
                </label>
                <input
                  type="text"
                  value={config.databaseName}
                  onChange={(e) =>
                    setConfig({ ...config, databaseName: e.target.value })
                  }
                  placeholder="production_core_db"
                  className="w-full px-3 py-2 rounded-lg bg-slate-900/90 border border-slate-700/80 text-sm text-slate-200 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 font-mono text-xs"
                />
              </div>
            </div>

            {/* Connection URI */}
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-slate-300 flex items-center justify-between">
                <span>Connection URI</span>
                <span className="text-[10px] text-slate-400">Encrypted at rest</span>
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={config.connectionUri}
                  onChange={(e) =>
                    setConfig({ ...config, connectionUri: e.target.value })
                  }
                  placeholder="postgresql://user:password@host:port/database"
                  className="w-full pl-3 pr-9 py-2 rounded-lg bg-slate-900/90 border border-slate-700/80 text-xs text-slate-200 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 font-mono"
                />
                <Lock className="w-4 h-4 text-slate-500 absolute right-3 top-2.5" />
              </div>
            </div>

            {/* Username & Password */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-slate-300 flex items-center gap-1">
                  <User className="w-3 h-3 text-slate-400" /> Username
                </label>
                <input
                  type="text"
                  value={config.username}
                  onChange={(e) =>
                    setConfig({ ...config, username: e.target.value })
                  }
                  placeholder="postgres.admin"
                  className="w-full px-3 py-2 rounded-lg bg-slate-900/90 border border-slate-700/80 text-xs text-slate-200 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 font-mono"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-slate-300 flex items-center gap-1">
                  <Lock className="w-3 h-3 text-slate-400" /> Password
                </label>
                <input
                  type="password"
                  value={config.password}
                  onChange={(e) =>
                    setConfig({ ...config, password: e.target.value })
                  }
                  placeholder="••••••••••••"
                  className="w-full px-3 py-2 rounded-lg bg-slate-900/90 border border-slate-700/80 text-xs text-slate-200 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 font-mono"
                />
              </div>
            </div>
          </div>

          <div className="h-[1px] bg-slate-800/80 my-2" />

          {/* Section: LLM Model & Security Configuration */}
          <div className="space-y-4">
            <span className="text-xs font-semibold uppercase tracking-wider text-indigo-400 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5" /> LLM Generation Engine
            </span>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-slate-300">
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
                  className="w-full px-3 py-2 rounded-lg bg-slate-900/90 border border-slate-700/80 text-sm text-slate-200 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                >
                  <option value="openai">OpenAI (GPT-4o / GPT-4o-mini)</option>
                  <option value="anthropic">Anthropic (Claude 3.5 Sonnet)</option>
                  <option value="custom">Self-Hosted Ollama / DeepSeek</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-medium text-slate-300 flex items-center gap-1">
                  <Key className="w-3 h-3 text-slate-400" /> API Key
                </label>
                <input
                  type="password"
                  value={config.llmApiKey}
                  onChange={(e) =>
                    setConfig({ ...config, llmApiKey: e.target.value })
                  }
                  placeholder="sk-..."
                  className="w-full px-3 py-2 rounded-lg bg-slate-900/90 border border-slate-700/80 text-xs text-slate-200 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 font-mono"
                />
              </div>
            </div>

            {/* Toggle Query Guard */}
            <div className="flex items-center justify-between p-3 rounded-xl bg-slate-900/60 border border-slate-800">
              <div className="flex items-center space-x-3">
                <div className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-400">
                  <Shield className="w-4 h-4" />
                </div>
                <div>
                  <p className="text-xs font-medium text-slate-200">
                    Strict Mutation Security Guard
                  </p>
                  <p className="text-[11px] text-slate-400">
                    Require approval popup before executing UPDATE / DELETE / DROP
                  </p>
                </div>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={config.enableQueryGuard}
                  onChange={(e) =>
                    setConfig({ ...config, enableQueryGuard: e.target.checked })
                  }
                  className="sr-only peer"
                />
                <div className="w-9 h-5 bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-emerald-500" />
              </label>
            </div>
          </div>

          {/* Test Connection Output Feedback */}
          {testResult.status !== "idle" && (
            <div
              className={cn(
                "p-3 rounded-xl border text-xs flex items-start space-x-2.5 animate-in fade-in duration-200",
                testResult.status === "success"
                  ? "bg-emerald-950/40 border-emerald-500/40 text-emerald-300"
                  : "bg-rose-950/40 border-rose-500/40 text-rose-300"
              )}
            >
              {testResult.status === "success" ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-400 mt-0.5 shrink-0" />
              ) : (
                <AlertCircle className="w-4 h-4 text-rose-400 mt-0.5 shrink-0" />
              )}
              <div className="flex-1">
                <p className="font-medium">{testResult.message}</p>
                {testResult.latencyMs && (
                  <p className="text-[10px] text-emerald-400/80 mt-0.5 font-mono">
                    Roundtrip Latency: {testResult.latencyMs}ms | Connection pool: Active
                  </p>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-4 border-t border-slate-800/80 bg-slate-900/80 flex items-center justify-between">
          <button
            type="button"
            onClick={handleTestConnection}
            disabled={isTesting}
            className="flex items-center space-x-2 px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 text-xs font-medium transition-all disabled:opacity-50"
          >
            {isTesting ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin text-cyan-400" />
                <span>Testing Connection...</span>
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
              className="px-4 py-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 text-xs font-medium transition-colors"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSaveAndIntrospect}
              disabled={isSaving}
              className="flex items-center space-x-2 px-4 py-2 rounded-lg bg-gradient-to-r from-cyan-500 to-indigo-600 hover:from-cyan-400 hover:to-indigo-500 text-white font-medium text-xs shadow-lg shadow-cyan-500/20 transition-all disabled:opacity-50"
            >
              {isSaving ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Saving & Introspecting...</span>
                </>
              ) : (
                <>
                  <Database className="w-3.5 h-3.5" />
                  <span>Save & Introspect Schema</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
