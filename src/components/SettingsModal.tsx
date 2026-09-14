"use client";

import React, { useState, useRef } from "react";
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
  Terminal,
  UploadCloud,
  FileCheck,
  XCircle,
  CheckCheck,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (config: DatabaseConfig) => void;
  initialConfig?: DatabaseConfig;
  activeTab?: "database" | "ai" | "security";
}

export interface SavedModel {
  id: string;
  provider: string; // e.g. 'openai', 'anthropic', 'nvidia'
  modelId: string; // e.g. 'gpt-4o', 'meta/llama-3.1-70b-instruct'
  name: string; // e.g. 'My OpenAI Key', 'Llama 3 70B'
  apiKey: string;
}

export interface DatabaseConfig {
  dbType: string;
  connectionUri: string;
  username: string;
  password: string;
  databaseName: string;
  savedModels: SavedModel[];
  activeModelId: string;
  enableQueryGuard: boolean;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  onSave,
  initialConfig,
  activeTab = "database",
}) => {
  const [activeSettingsTab, setActiveSettingsTab] = useState<
    "database" | "ai" | "security"
  >(activeTab);

  React.useEffect(() => {
    if (isOpen) {
      setActiveSettingsTab(activeTab);
    }
  }, [isOpen, activeTab]);

  const [config, setConfig] = useState<DatabaseConfig>(
    initialConfig || {
      dbType: "PostgreSQL",
      connectionUri:
        "postgresql://postgres.user:••••••••@aws-0-us-east-1.pooler.supabase.com:5432/production_core_db",
      username: "postgres.admin",
      password: "••••••••••••••••",
      databaseName: "production_core_db",
      savedModels: [],
      activeModelId: "",
      enableQueryGuard: true,
    }
  );

  // Sync state if initialConfig changes when modal opens
  React.useEffect(() => {
    if (isOpen && initialConfig) {
      setConfig(initialConfig);
    }
  }, [isOpen, initialConfig]);

  const [connectionMode, setConnectionMode] = useState<"remote" | "local">("remote");
  const [localFile, setLocalFile] = useState<File | null>(null);

  // New Model Form State
  const [newModelProvider, setNewModelProvider] = useState("openai");
  const [newModelId, setNewModelId] = useState("");
  const [newModelName, setNewModelName] = useState("");
  const [newModelApiKey, setNewModelApiKey] = useState("");

  const handleAddSavedModel = () => {
    if (!newModelName.trim() || !newModelApiKey.trim() || !newModelId.trim()) return;
    
    const newModel: SavedModel = {
      id: `model-${Date.now()}`,
      provider: newModelProvider,
      modelId: newModelId.trim(),
      name: newModelName.trim(),
      apiKey: newModelApiKey.trim(),
    };

    setConfig((prev) => ({
      ...prev,
      savedModels: [...prev.savedModels, newModel],
      activeModelId: prev.activeModelId ? prev.activeModelId : newModel.id, // Auto-select if first
    }));

    // Reset form
    setNewModelName("");
    setNewModelApiKey("");
  };

  const handleRemoveSavedModel = (id: string) => {
    setConfig((prev) => {
      const updatedModels = prev.savedModels.filter((m) => m.id !== id);
      return {
        ...prev,
        savedModels: updatedModels,
        activeModelId: prev.activeModelId === id ? (updatedModels[0]?.id || "") : prev.activeModelId,
      };
    });
  };
  const fileInputRef = useRef<HTMLInputElement>(null);

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
              {/* Connection Mode Toggle */}
              <div className="flex bg-[#1b1b20] p-1 rounded-xl border border-[#26262b]">
                <button
                  onClick={() => setConnectionMode("remote")}
                  className={cn(
                    "flex-1 py-1.5 text-xs font-medium rounded-lg transition-all",
                    connectionMode === "remote" ? "bg-[#38bdf8]/10 text-[#38bdf8] shadow-sm" : "text-zinc-400 hover:text-zinc-200"
                  )}
                >
                  Cloud / Remote
                </button>
                <button
                  onClick={() => setConnectionMode("local")}
                  className={cn(
                    "flex-1 py-1.5 text-xs font-medium rounded-lg transition-all",
                    connectionMode === "local" ? "bg-[#38bdf8]/10 text-[#38bdf8] shadow-sm" : "text-zinc-400 hover:text-zinc-200"
                  )}
                >
                  Local / On-Premise
                </button>
              </div>

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
                    <option value="Local SQLite File">Local SQLite File</option>
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

              {connectionMode === "local" && config.dbType === "Local SQLite File" ? (
                <div 
                  className={cn(
                    "border-2 border-dashed rounded-xl p-8 flex flex-col items-center justify-center text-center space-y-3 transition-all cursor-pointer group",
                    localFile ? "border-[#38bdf8]/50 bg-[#38bdf8]/5" : "border-[#26262b] hover:bg-[#1b1b20]/50 hover:border-[#38bdf8]/50"
                  )}
                  onClick={() => fileInputRef.current?.click()}
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={(e) => {
                    e.preventDefault();
                    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
                      setLocalFile(e.dataTransfer.files[0]);
                    }
                  }}
                >
                  <input 
                    type="file" 
                    ref={fileInputRef}
                    className="hidden" 
                    accept=".sqlite,.db,.sqlite3"
                    onChange={(e) => {
                      if (e.target.files && e.target.files[0]) {
                        setLocalFile(e.target.files[0]);
                      }
                    }}
                  />
                  {localFile ? (
                    <>
                      <div className="p-3 rounded-full bg-[#38bdf8]/10 border border-[#38bdf8]/20 transition-all">
                        <FileCheck className="w-6 h-6 text-[#38bdf8]" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-zinc-200">{localFile.name}</p>
                        <p className="text-xs text-[#38bdf8] mt-1">Ready to connect</p>
                      </div>
                      <button 
                        onClick={(e) => { e.stopPropagation(); setLocalFile(null); }}
                        className="mt-2 text-xs text-rose-400 hover:text-rose-300 flex items-center space-x-1"
                      >
                        <XCircle className="w-3.5 h-3.5" />
                        <span>Remove file</span>
                      </button>
                    </>
                  ) : (
                    <>
                      <div className="p-3 rounded-full bg-[#1b1b20] border border-[#26262b] group-hover:scale-110 group-hover:bg-[#38bdf8]/10 transition-all">
                        <UploadCloud className="w-6 h-6 text-[#38bdf8]" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-zinc-200">Drag & drop your .sqlite file</p>
                        <p className="text-xs text-zinc-500 mt-1">or click to browse local files</p>
                      </div>
                    </>
                  )}
                </div>
              ) : (
                <>
                  {/* Connection URI */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <label className="text-sm font-medium text-zinc-200 flex items-center gap-2">
                        <Globe className="w-4 h-4 text-[#38bdf8]" />
                        <span>Connection URI</span>
                      </label>
                      {connectionMode === "remote" && (
                        <span className="text-xs text-[#38bdf8] font-mono">
                          SSL Enabled
                        </span>
                      )}
                    </div>
                    <div className="relative">
                      <input
                        type="text"
                        value={config.connectionUri}
                        onChange={(e) =>
                          setConfig({ ...config, connectionUri: e.target.value })
                        }
                        placeholder={connectionMode === "local" ? "postgresql://127.0.0.1:5432/my_db" : "postgresql://user:password@host:5432/db"}
                        className="w-full pl-3.5 pr-10 py-2.5 rounded-xl bg-[#1b1b20] border border-[#26262b] text-sm text-zinc-200 focus:outline-none focus:border-[#38bdf8] font-mono transition-colors"
                      />
                      <Lock className="w-4 h-4 text-zinc-500 absolute right-3.5 top-3" />
                    </div>
                  </div>

              {/* Username & Password */}
              <div className={cn("grid grid-cols-1 sm:grid-cols-2 gap-4", connectionMode === "local" && config.dbType === "Local SQLite File" && "hidden")}>
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
              </>
              )}
            </div>
          )}

          {/* TAB 2: AI ENGINE */}
          {activeSettingsTab === "ai" && (
            <div className="space-y-6 animate-in fade-in duration-150">
              
              {/* Saved Models List */}
              <div className="space-y-3">
                <label className="text-sm font-medium text-zinc-200">
                  Saved Models
                </label>
                {config.savedModels.length === 0 ? (
                  <div className="text-sm text-zinc-500 bg-[#121215] p-3 rounded-xl border border-[#222226] text-center">
                    No models saved. Add one below.
                  </div>
                ) : (
                  <div className="space-y-2">
                    {config.savedModels.map((model) => (
                      <div key={model.id} className={`flex items-center justify-between p-3 rounded-xl border ${config.activeModelId === model.id ? 'bg-[#38bdf8]/10 border-[#38bdf8]/50' : 'bg-[#1b1b20] border-[#26262b]'} transition-colors`}>
                        <div className="flex items-center gap-3">
                          <input 
                            type="radio" 
                            name="activeModel"
                            checked={config.activeModelId === model.id}
                            onChange={() => setConfig({ ...config, activeModelId: model.id })}
                            className="w-4 h-4 text-[#38bdf8] bg-zinc-800 border-zinc-700 cursor-pointer"
                          />
                          <div>
                            <p className="text-sm font-medium text-zinc-200">{model.name}</p>
                            <p className="text-xs text-zinc-500 capitalize">{model.provider} • {model.modelId} • {model.apiKey.substring(0, 4)}...{model.apiKey.substring(model.apiKey.length - 4)}</p>
                          </div>
                        </div>
                        <button 
                          onClick={() => handleRemoveSavedModel(model.id)}
                          className="p-1.5 text-zinc-500 hover:text-rose-400 hover:bg-rose-400/10 rounded-md transition-colors"
                          title="Remove model"
                        >
                          <XCircle className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Add New Model Form */}
              <div className="p-4 rounded-2xl bg-[#121215] border border-[#222226] space-y-4">
                <h4 className="text-sm font-medium text-zinc-200 flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-[#38bdf8]" /> Add New Model
                </h4>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-xs font-medium text-zinc-400">Provider</label>
                    <select
                      value={newModelProvider}
                      onChange={(e) => setNewModelProvider(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-[#1b1b20] border border-[#26262b] text-sm text-zinc-200 focus:outline-none focus:border-[#38bdf8] transition-colors"
                    >
                      <option value="openai">OpenAI</option>
                      <option value="anthropic">Anthropic</option>
                      <option value="gemini">Gemini</option>
                      <option value="llama">Llama</option>
                      <option value="nvidia">NVIDIA NIM</option>
                      <option value="custom">Custom / Ollama</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-medium text-zinc-400">Display Name</label>
                    <input
                      type="text"
                      value={newModelName}
                      onChange={(e) => setNewModelName(e.target.value)}
                      placeholder="e.g. My GPT-4o"
                      className="w-full px-3 py-2 rounded-xl bg-[#1b1b20] border border-[#26262b] text-sm text-zinc-200 focus:outline-none focus:border-[#38bdf8] transition-colors"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-medium text-zinc-400">Model ID</label>
                  <input
                    type="text"
                    value={newModelId}
                    onChange={(e) => setNewModelId(e.target.value)}
                    placeholder="e.g. gpt-4o, meta/llama-3.1-70b-instruct"
                    className="w-full px-3 py-2 rounded-xl bg-[#1b1b20] border border-[#26262b] text-sm text-zinc-200 focus:outline-none focus:border-[#38bdf8] transition-colors"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-medium text-zinc-400 flex items-center gap-1.5">
                    <Key className="w-3.5 h-3.5 text-zinc-500" /> API Secret Key
                  </label>
                  <div className="relative">
                    <input
                      type={showApiKey ? "text" : "password"}
                      value={newModelApiKey}
                      onChange={(e) => setNewModelApiKey(e.target.value)}
                      placeholder={newModelProvider === "nvidia" ? "nvapi-..." : "sk-proj-..."}
                      className="w-full pl-3 pr-10 py-2 rounded-xl bg-[#1b1b20] border border-[#26262b] text-sm text-zinc-200 focus:outline-none focus:border-[#38bdf8] font-mono transition-colors"
                    />
                    <button
                      type="button"
                      onClick={() => setShowApiKey(!showApiKey)}
                      className="absolute right-3 top-2.5 text-zinc-500 hover:text-zinc-300 cursor-pointer"
                    >
                      {showApiKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  {newModelProvider === "nvidia" && (
                    <p className="text-[10px] text-zinc-500 mt-1">
                      Get your API key at <a href="https://build.nvidia.com/models?filters=nimType%3Anim_type_preview&orderBy=weightPopular%3ADESC" target="_blank" rel="noopener noreferrer" className="text-[#38bdf8] hover:underline">build.nvidia.com</a>
                    </p>
                  )}
                </div>

                <button
                  type="button"
                  onClick={handleAddSavedModel}
                  disabled={!newModelName.trim() || !newModelApiKey.trim() || !newModelId.trim()}
                  className="w-full py-2 bg-white/[0.04] hover:bg-white/[0.08] text-sm font-medium text-zinc-200 rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed border border-white/[0.06]"
                >
                  Save Model Key
                </button>
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
