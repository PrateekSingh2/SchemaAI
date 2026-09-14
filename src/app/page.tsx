"use client";

import React, { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Topbar } from "@/components/Topbar";
import { MutationWarningModal } from "@/components/MutationWarningModal";
import { OutputResultsModal } from "@/components/QueryStudio/OutputResultsModal";
import { SettingsModal, DatabaseConfig } from "@/components/SettingsModal";
import { DatabaseRequiredModal } from "@/components/QueryStudio/DatabaseRequiredModal";
import { SqlOutput } from "@/components/QueryStudio/SqlOutput";
import { PromptInput } from "@/components/QueryStudio/PromptInput";
import { OutputSummaryBox } from "@/components/QueryStudio/OutputSummaryBox";
import {
  ChatHistoryPanel,
  ChatOperation,
  ChatMessageTurn,
} from "@/components/QueryStudio/ChatHistoryPanel";
import {
  detectMutation,
  generateMockResult,
  AuditLogEntry,
} from "@/lib/mockData";
import {
  Database,
  Cpu,
  User,
  Sparkles,
  RotateCcw,
  Bot,
  Loader2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/context/AuthContext";
import {
  saveChatSessionToFirestore,
  getUserChatSessionsFromFirestore,
  deleteUserChatSessionFromFirestore,
  clearAllUserChatSessionsFromFirestore,
} from "@/lib/chatService";

export default function QueryStudioPage() {
  const router = useRouter();
  const { user, loading } = useAuth();
  const [isMutationModalOpen, setIsMutationModalOpen] = useState(false);
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
  const [isDbModalOpen, setIsDbModalOpen] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  // Database Connection State (Must be configured before executing prompts)
  const [isDbConnected, setIsDbConnected] = useState<boolean>(false);

  // Database config
  const [dbConfig, setDbConfig] = useState({
    dbType: "PostgreSQL",
    connectionUri: "",
    username: "",
    password: "",
    databaseName: "",
    savedModels: [] as { id: string; provider: string; name: string; apiKey: string }[],
    activeModelId: "",
    enableQueryGuard: true,
    llmProvider: "openai",
  });

  useEffect(() => {
    const checkDbStatus = () => {
      if (typeof window !== "undefined") {
        const stored = localStorage.getItem("schemaai_db_connected");
        setIsDbConnected(stored === "true");
        try {
          const cfg = localStorage.getItem("schemaai_db_config");
          if (cfg) {
            const parsed = JSON.parse(cfg);
            if (parsed && typeof parsed === "object") {
              const cleanedDbName = parsed.databaseName || parsed.sqlitePath || "";
              setDbConfig((prev) => ({
                ...prev,
                dbType: parsed.dbType || prev.dbType,
                databaseName: cleanedDbName,
              }));
            }
          }
        } catch (_) {}
      }
    };
    checkDbStatus();

    window.addEventListener("schemaai_db_changed", checkDbStatus);
    window.addEventListener("storage", checkDbStatus);
    return () => {
      window.removeEventListener("schemaai_db_changed", checkDbStatus);
      window.removeEventListener("storage", checkDbStatus);
    };
  }, []);

  // Redirect unauthenticated visitors to /login immediately
  useEffect(() => {
    if (!loading && !user) {
      try {
        const cached = localStorage.getItem("schemaai_user_session");
        if (!cached) {
          router.replace("/login");
        }
      } catch (e) {
        router.replace("/login");
      }
    }
  }, [user, loading, router]);

  // Active Output Results Modal State
  const [modalOutputData, setModalOutputData] = useState<{
    isOpen: boolean;
    columns: string[];
    records: Array<Record<string, unknown>>;
    executionTime: number;
    tableName?: string;
  }>({
    isOpen: false,
    columns: [],
    records: [],
    executionTime: 30,
  });

  const [currentPrompt, setCurrentPrompt] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);

  // Chat conversation turns:
  // If activeTurns is empty => show initial centered prompt screen
  // If activeTurns has >= 1 turn => Gemini layout: turns stream + sticky bottom input
  const [activeTurns, setActiveTurns] = useState<ChatMessageTurn[]>([]);
  const [activeOperationId, setActiveOperationId] = useState<string | null>(null);

  // Operations / Chat History (synced with Firestore for logged-in user)
  const [operations, setOperations] = useState<ChatOperation[]>([]);

  // Load chat history from Firestore when authenticated
  useEffect(() => {
    async function loadUserChats() {
      if (user?.uid) {
        try {
          const remoteChats = await getUserChatSessionsFromFirestore(user.uid);
          if (remoteChats && remoteChats.length > 0) {
            setOperations(remoteChats);
          }
        } catch (err) {
          console.warn("Could not load user chats:", err);
        }
      } else {
        setOperations([]);
      }
    }
    loadUserChats();
  }, [user]);

  // Pending mutation execution state
  const [pendingMutation, setPendingMutation] = useState<{
    prompt: string;
    sql: string;
    turnId: string;
    targetTable?: string;
    mutationType?: string;
  } | null>(null);

  // Agentic UI State
  const [maskedColumns, setMaskedColumns] = useState<string[]>([]);
  const [activeChart, setActiveChart] = useState<{ type: string; key: string } | null>(null);

  // Scroll ref for single unified scrollbar
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const turnsEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom whenever activeTurns updates or generating starts
  useEffect(() => {
    if (activeTurns.length > 0) {
      turnsEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [activeTurns.length, isGenerating]);

  // If user is not authenticated or auth state is loading, show loading screen
  if (loading || !user) {
    return (
      <div className="h-screen w-screen bg-[#0e0e11] flex items-center justify-center select-none">
        <div className="flex flex-col items-center space-y-3 animate-in fade-in duration-300">
          <div className="w-11 h-11 rounded-2xl bg-[#141418] border border-white/[0.1] flex items-center justify-center shadow-2xl">
            <Database className="w-5 h-5 text-[#38bdf8] animate-pulse" />
          </div>
          <div className="flex items-center space-x-2 text-xs text-zinc-400">
            <Loader2 className="w-3.5 h-3.5 animate-spin text-sky-400" />
            <span>Loading SchemaAI session...</span>
          </div>
        </div>
      </div>
    );
  }

  // 1. Submit a prompt:
  // Checks for active database connection first!
  // If not connected, keeps prompt safe in cache and shows Database Required Modal!
  const recordAuditLog = (userPrompt: string, sql: string, durationMs: number, rowCount: number) => {
    try {
      if (typeof window !== "undefined") {
        const mutationCheck = detectMutation(sql);
        const logEntry: AuditLogEntry = {
          id: `LOG-${Date.now().toString().slice(-6)}`,
          timestamp: new Date().toISOString().replace("T", " ").slice(0, 19) + " UTC",
          ipAddress: "127.0.0.1",
          userPrompt,
          generatedSql: sql,
          status: mutationCheck.isMutation ? "MUTATION_APPROVED" : "SUCCESS",
          durationMs: durationMs || 28,
          rowsAffected: rowCount,
          model: "GPT-4o (schema-tuned)",
          clientDevice: typeof navigator !== "undefined" && navigator.userAgent.includes("Mac") ? "Chrome / macOS" : "Browser Client",
        };
        const prevLogs = JSON.parse(localStorage.getItem("schemaai_audit_logs") || "[]");
        localStorage.setItem("schemaai_audit_logs", JSON.stringify([logEntry, ...(Array.isArray(prevLogs) ? prevLogs : [])].slice(0, 100)));
        window.dispatchEvent(new Event("schemaai_audit_logs_changed"));
      }
    } catch (_) {}
  };

  const handleGenerateQuery = async (promptText: string) => {
    if (!promptText.trim()) return;

    // Check if database is configured/connected
    if (!isDbConnected) {
      // Keep prompt safely in state and sessionStorage so user never loses work!
      if (typeof window !== "undefined") {
        sessionStorage.setItem("schemaai_cached_prompt", promptText);
      }
      setCurrentPrompt(promptText);
      setIsDbModalOpen(true);
      return;
    }

    // Clear prompt and cache upon successful execution
    setCurrentPrompt("");
    if (typeof window !== "undefined") {
      sessionStorage.removeItem("schemaai_cached_prompt");
    }
    setIsGenerating(true);

    const turnId = `turn-${Date.now()}`;
    const newTurnPlaceholder: ChatMessageTurn = {
      id: turnId,
      userPrompt: promptText,
      timestamp: "Just now",
      sql: "-- Synthesizing relational AST...",
      queryFormat: "sql",
      hasRun: false,
      records: [],
      columns: [],
      executionTime: 0,
      tokens: 0,
      cost: "$0.0000",
      isGenerating: true,
    };

    // Append turn to the current conversation
    setActiveTurns((prev) => [...prev, newTurnPlaceholder]);

    let generatedSql = "";
    let generatedText = "";
    let responseType: "sql" | "text" = "sql";
    const startTime = performance.now();

    try {
      const activeModel = dbConfig.savedModels.find(m => m.id === dbConfig.activeModelId);
      const provider = activeModel ? activeModel.provider : "openai";
      const apiKey = activeModel ? activeModel.apiKey : "";
      const modelId = activeModel ? activeModel.modelId : "";

      if (!apiKey) {
        throw new Error("No AI Model selected. Please click 'Add AI Model' in the chat bar below to select or add a model.");
      }

      const response = await fetch("http://127.0.0.1:8000/api/v1/agent/command", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: promptText,
          llmProvider: provider,
          llmApiKey: apiKey,
          llmModel: modelId,
          dbType: dbConfig.dbType,
          connectionUri: dbConfig.connectionUri,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        responseType = data.type || "sql";
        
        if (responseType === "tool_call" && data.toolCall) {
          const { tool, args } = data.toolCall;
          if (tool === "apply_data_masking") {
            setMaskedColumns(args.columns || []);
            generatedText = `Applied data masking to columns: ${(args.columns || []).join(", ")}`;
            responseType = "text";
          } else if (tool === "render_visualization") {
            setActiveChart({ type: args.chart_type, key: args.data_key });
            generatedText = `Rendering a ${args.chart_type} chart for column: ${args.data_key}`;
            responseType = "text";
          } else if (tool === "generate_sql") {
            generatedSql = args.query;
            responseType = "sql";
          } else {
            generatedText = `Executed unknown tool: ${tool}`;
            responseType = "text";
          }
        } else if (responseType === "sql") {
          generatedSql = data.content || "-- No SQL generated";
        } else {
          generatedText = data.content || "";
        }
      } else {
        const errorData = await response.json().catch(() => ({}));
        responseType = "text";
        const errorMessage = errorData.detail || errorData.error || response.statusText;
        generatedText = `⚠️ Error: ${errorMessage}`;
      }
    } catch (error: any) {
      console.error("Fetch error:", error);
      responseType = "text";
      generatedText = `⚠️ ${error.message || "Network or Server Error"}`;
    }

    const executionTimeMs = performance.now() - startTime;
    const mockOutput = generateMockResult(promptText, "sql");

    const completedTurn: ChatMessageTurn = {
      id: turnId,
      userPrompt: promptText,
      timestamp: "Just now",
      sql: generatedSql, 
      graphql: mockOutput.graphql,
      queryFormat: "sql",
      type: responseType,
      textContent: generatedText,
      hasRun: false,
      records: mockOutput.records, 
      columns: mockOutput.columns,
      executionTime: executionTimeMs,
      tokens: responseType === "sql" ? generatedSql.length / 4 : generatedText.length / 4, 
      cost: "$0.0001",
      isGenerating: false,
    };

    setActiveTurns((prev) =>
      prev.map((t) => (t.id === turnId ? completedTurn : t))
    );
    setIsGenerating(false);

    // Update or create chat operation in left panel & Firestore
    if (!activeOperationId) {
      const newOpId = `op-${Date.now()}`;
      const newOp: ChatOperation = {
        id: newOpId,
        prompt: promptText,
        sql: generatedSql,
        graphql: mockOutput.graphql,
        timestamp: "Just now",
        format: "sql",
        type: responseType,
        textContent: generatedText,
        status: "generated",
        rowCount: mockOutput.records.length,
        records: mockOutput.records,
        columns: mockOutput.columns,
        executionTime: mockOutput.executionTime,
        turns: [completedTurn],
      };
      // Only push SQL operations to the sidebar to keep it clean from text chat
      if (responseType === "sql") {
        setOperations((prev) => [newOp, ...prev]);
        setActiveOperationId(newOpId);
      }
    } else {
      setOperations((prev) =>
        prev.map((op) =>
          op.id === activeOperationId
            ? {
                ...op,
                sql: responseType === "sql" ? generatedSql : op.sql,
                turns: [...(op.turns || []), completedTurn],
              }
            : op
        )
      );
    }

    recordAuditLog(promptText, mockOutput.sql, mockOutput.executionTime, mockOutput.records.length);
  };

  // 2. Run Query action for a specific turn
  const handleRunQuery = async (turnId: string, customQuery?: string) => {
    const turn = activeTurns.find((t) => t.id === turnId);
    if (!turn) return;

    const queryToExecute = customQuery || turn.sql;
    const promptToCheck = turn.userPrompt;
    const mutationCheck = detectMutation(promptToCheck);

    if (mutationCheck.isMutation && dbConfig.enableQueryGuard) {
      setPendingMutation({
        prompt: promptToCheck,
        sql: queryToExecute,
        turnId: turnId,
        targetTable: mutationCheck.targetTable,
        mutationType: mutationCheck.mutationType,
      });
      setIsMutationModalOpen(true);
      return;
    }

    // Mark turn as executing
    setActiveTurns((prev) =>
      prev.map((t) => (t.id === turnId ? { ...t, isExecuting: true } : t))
    );

    const startTime = performance.now();
    let records: any[] = [];
    let columns: string[] = [];

    try {
      const response = await fetch("http://127.0.0.1:8000/api/v1/agent/execute", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sql: queryToExecute,
          connectionUri: dbConfig.connectionUri,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        records = data.records || [];
        columns = data.columns || [];
      } else {
        console.error("Execute error:", await response.text());
        records = [{ error: "Execution failed" }];
        columns = ["error"];
      }
    } catch (err) {
      console.error("Network error:", err);
      records = [{ error: "Network error" }];
      columns = ["error"];
    }

    const executionTimeMs = performance.now() - startTime;

    // Update turn state
    setActiveTurns((prev) =>
      prev.map((t) =>
        t.id === turnId
          ? {
              ...t,
              hasRun: true,
              isExecuting: false,
              records: records,
              columns: columns,
              executionTime: executionTimeMs,
            }
          : t
      )
    );

    // Automatically open popup modal for fetched output
    setModalOutputData({
      isOpen: true,
      columns: columns,
      records: records,
      executionTime: executionTimeMs,
      tableName: dbConfig.databaseName,
    });

    // Update history session in left panel
    if (activeOperationId) {
      setOperations((prev) =>
        prev.map((op) =>
          op.id === activeOperationId
            ? {
                ...op,
                status: "executed",
                rowCount: records.length,
              }
            : op
        )
      );
    }

    recordAuditLog(promptToCheck, queryToExecute, mockOutput.executionTime, mockOutput.records.length);
  };

  // 3. User edits SQL for a specific turn
  const handleUpdateSql = (turnId: string, updatedSql: string) => {
    setActiveTurns((prev) =>
      prev.map((t) => (t.id === turnId ? { ...t, sql: updatedSql } : t))
    );
  };

  // 4. Change query format (SQL / GraphQL) for a specific turn
  const handleSetFormat = (turnId: string, format: "sql" | "graphql") => {
    setActiveTurns((prev) =>
      prev.map((t) => (t.id === turnId ? { ...t, queryFormat: format } : t))
    );
  };

  // 5. Open output popup modal for a specific turn
  const handleOpenOutputModal = (turn: ChatMessageTurn) => {
    setModalOutputData({
      isOpen: true,
      columns: turn.columns,
      records: turn.records,
      executionTime: turn.executionTime,
      tableName: dbConfig.databaseName,
    });
  };

  // 6. Select a past operation from left panel
  const handleSelectOperation = (op: ChatOperation) => {
    setActiveOperationId(op.id);
    setCurrentPrompt("");

    if (op.turns && op.turns.length > 0) {
      setActiveTurns(op.turns);
    } else {
      const mock = generateMockResult(op.prompt, op.format);
      const reconstructedTurn: ChatMessageTurn = {
        id: `turn-${Date.now()}`,
        userPrompt: op.prompt,
        timestamp: op.timestamp,
        sql: op.sql,
        graphql: op.graphql,
        queryFormat: op.format,
        hasRun: op.status === "executed",
        records: op.records || mock.records,
        columns: op.columns || mock.columns,
        executionTime: op.executionTime || mock.executionTime,
        tokens: 285,
        cost: "$0.0011",
      };
      setActiveTurns([reconstructedTurn]);
    }
  };

  // 7. Start New Query / New Chat -> returns to initial centered prompt screen
  const handleNewChat = () => {
    setActiveOperationId(null);
    setActiveTurns([]);
    setCurrentPrompt("");
  };

  // 8. Delete individual operation
  const handleDeleteOperation = (id: string) => {
    setOperations((prev) => prev.filter((op) => op.id !== id));
    if (user?.uid) {
      deleteUserChatSessionFromFirestore(user.uid, id);
    }
    if (activeOperationId === id) {
      handleNewChat();
    }
  };

  // 9. Clear all history
  const handleClearHistory = () => {
    if (user?.uid) {
      clearAllUserChatSessionsFromFirestore(
        user.uid,
        operations.map((o) => o.id)
      );
    }
    setOperations([]);
    handleNewChat();
  };

  // 10. Mutation Approval Grant
  const handleGrantMutation = () => {
    if (!pendingMutation) return;
    const { turnId, prompt: promptToCheck, sql: queryToExecute } = pendingMutation;
    const mockOutput = generateMockResult(promptToCheck, "sql");

    setActiveTurns((prev) =>
      prev.map((t) =>
        t.id === turnId
          ? {
              ...t,
              hasRun: true,
              isExecuting: false,
              sql: queryToExecute,
              records: mockOutput.records,
              columns: mockOutput.columns,
              executionTime: mockOutput.executionTime,
            }
          : t
      )
    );

    setModalOutputData({
      isOpen: true,
      columns: mockOutput.columns,
      records: mockOutput.records,
      executionTime: mockOutput.executionTime,
      tableName: dbConfig.databaseName,
    });

    setIsMutationModalOpen(false);
    setPendingMutation(null);
  };

  const handleDenyMutation = () => {
    setIsMutationModalOpen(false);
    setPendingMutation(null);
  };

  const hasTurns = activeTurns.length > 0;

  return (
    <div className="h-screen-dvh w-screen overflow-hidden bg-[#0e0e11] text-[#f4f4f5] flex flex-col font-sans select-none antialiased">
      {/* Top Navbar */}
      <Topbar
        dbName={isDbConnected ? dbConfig.databaseName : undefined}
        dbType={isDbConnected ? dbConfig.dbType : undefined}
        isConnected={isDbConnected}
        onDisconnect={() => {
          setIsDbConnected(false);
          if (typeof window !== "undefined") {
            localStorage.setItem("schemaai_db_connected", "false");
            window.dispatchEvent(new Event("schemaai_db_changed"));
          }
        }}
        onOpenSettings={() => setIsSettingsModalOpen(true)}
      />

      {/* Main Container below Navbar: Left Panel + Unified Center Workspace */}
      <div className="flex-1 min-h-0 min-w-0 flex flex-row overflow-hidden relative">
        {/* Previous Operations Left Panel */}
        <ChatHistoryPanel
          operations={operations}
          activeOperationId={activeOperationId}
          onSelectOperation={handleSelectOperation}
          onNewChat={handleNewChat}
          onDeleteOperation={handleDeleteOperation}
          onClearHistory={handleClearHistory}
          isCollapsed={isSidebarCollapsed}
          onToggleCollapse={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
          onOpenSettings={() => setIsSettingsModalOpen(true)}
        />

        {/* Center Main Workspace: SINGLE UNIFIED SCROLLBAR LIKE GEMINI */}
        <main
          ref={scrollContainerRef}
          className="flex-1 min-h-0 min-w-0 overflow-y-auto overflow-x-hidden flex flex-col relative bg-[#0c0c0f] bg-[radial-gradient(ellipse_80%_60%_at_50%_-10%,rgba(56,189,248,0.05),rgba(0,0,0,0))]"
        >
          {/* CASE 1: INITIAL CLEAN STATE (Centered Prompt Box in Middle of Screen) */}
          {!hasTurns ? (
            <div className="flex-1 flex items-center justify-center p-4 sm:p-6 my-auto">
              <PromptInput
                value={currentPrompt}
                onChange={setCurrentPrompt}
                onGenerateAndRun={handleGenerateQuery}
                isLoading={isGenerating}
                isCentered={true}
                llmProvider={dbConfig.llmProvider}
                onLlmChange={(provider) => setDbConfig({ ...dbConfig, llmProvider: provider })}
                dbType={dbConfig.dbType}
                onOpenSettings={() => setIsSettingsModalOpen(true)}
              />
            </div>
          ) : (
            /* CASE 2: ACTIVE CHAT CONVERSATION (Sequential Turns Stream + Bottom Docked Input) */
            <div className="flex flex-col min-h-full justify-between">
              {/* Top Chat Turns Stream */}
              <div className="flex-1 p-4 sm:p-6 space-y-6 max-w-4xl mx-auto w-full">
                {/* Session Header Bar */}
                <div className="flex items-center justify-between pb-3 border-b border-white/[0.06] text-xs text-zinc-400">
                  <div className="flex items-center space-x-2">
                    <span className="w-2 h-2 rounded-full bg-[#38bdf8] shadow-[0_0_8px_#38bdf8]" />
                    <span className="font-semibold text-zinc-200 tracking-wider text-[11px]">
                      Interactive Chat Session
                    </span>
                    <span className="text-zinc-600">•</span>
                    <span className="font-mono text-zinc-400">
                      {activeTurns.length} {activeTurns.length === 1 ? "Turn" : "Turns"}
                    </span>
                  </div>

                  <button
                    onClick={handleNewChat}
                    className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.08] text-zinc-300 hover:text-white transition-all text-xs cursor-pointer shadow-sm"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>Start New Chat</span>
                  </button>
                </div>

                {/* Render Each Chat Turn in Sequence */}
                {activeTurns.map((turn, turnIdx) => (
                  <div key={turn.id} className="space-y-3.5 animate-in fade-in duration-200">
                    {/* User Prompt Bubble */}
                    <div className="flex items-start space-x-3 bg-[#141418]/90 backdrop-blur-xl border border-white/[0.08] rounded-2xl p-4 sm:p-4.5 shadow-[0_4px_24px_rgba(0,0,0,0.3)]">
                      <div className="w-7 h-7 rounded-xl bg-white/[0.06] border border-white/[0.1] text-sky-400 flex items-center justify-center shrink-0 mt-0.5 shadow-sm">
                        <User className="w-3.5 h-3.5" />
                      </div>
                      <div className="space-y-1 min-w-0 flex-1">
                        <div className="flex items-center justify-between text-xs">
                          <span className="font-semibold text-zinc-200">You</span>
                          <span className="text-[10px] text-zinc-500 font-mono">
                            Turn #{turnIdx + 1} • {turn.timestamp}
                          </span>
                        </div>
                        <p className="text-xs sm:text-sm text-zinc-100 leading-relaxed font-normal select-text">
                          {turn.userPrompt}
                        </p>
                      </div>
                    </div>

                    {/* AI Response */}
                    {turn.type === "text" ? (
                      <div className="flex items-start space-x-3 bg-white/[0.02] border border-white/[0.04] rounded-2xl p-4 sm:p-4.5 shadow-sm">
                        <div className="w-7 h-7 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-500 text-white flex items-center justify-center shrink-0 mt-0.5 shadow-sm">
                          <Bot className="w-4 h-4" />
                        </div>
                        <div className="space-y-1 min-w-0 flex-1">
                          <div className="flex items-center justify-between text-xs">
                            <span className="font-semibold text-zinc-200">SchemaAI</span>
                          </div>
                          <p className="text-xs sm:text-sm text-zinc-300 leading-relaxed font-normal select-text whitespace-pre-wrap">
                            {turn.textContent}
                          </p>
                        </div>
                      </div>
                    ) : (
                      <>
                        {/* AI Response: Generated Query Code Box */}
                        <div className="rounded-2xl shadow-xl overflow-hidden border border-white/[0.06]">
                          <SqlOutput
                            sql={turn.sql}
                            graphql={turn.graphql}
                            onUpdateSql={(newSql) => handleUpdateSql(turn.id, newSql)}
                            onRunQuery={(q) => handleRunQuery(turn.id, q)}
                            isGenerating={turn.isGenerating}
                            isExecuting={turn.isExecuting}
                            queryFormat={turn.queryFormat}
                            setQueryFormat={(fmt) => handleSetFormat(turn.id, fmt)}
                            executionTime={turn.executionTime}
                            tokens={turn.tokens}
                            cost={turn.cost}
                            dialect={`${dbConfig.dbType} 16`}
                          />
                        </div>

                        {/* Collapsible Output Box: Re-inspect output or open popup without re-executing */}
                        <div className="pt-0.5">
                          <OutputSummaryBox
                            hasRun={turn.hasRun}
                            onOpenModal={() => handleOpenOutputModal(turn)}
                            onRunQuery={() => handleRunQuery(turn.id)}
                            records={turn.records}
                            columns={turn.columns}
                            executionTime={turn.executionTime}
                            maskedColumns={maskedColumns}
                            activeChart={activeChart}
                          />
                        </div>
                      </>
                    )}
                  </div>
                ))}

                {/* Bottom marker for smooth auto-scroll */}
                <div ref={turnsEndRef} className="h-2" />
              </div>

              {/* Gemini-Style Sticky Bottom Input Bar */}
              <div className="sticky bottom-0 z-20 w-full bg-gradient-to-t from-[#0c0c0f] via-[#0c0c0f]/95 to-transparent pt-4 pb-5 px-4 sm:px-6">
                <div className="max-w-4xl mx-auto w-full">
                  <PromptInput
                    value={currentPrompt}
                    onChange={setCurrentPrompt}
                    onGenerateAndRun={handleGenerateQuery}
                    isLoading={isGenerating}
                    isCentered={false}
                    savedModels={dbConfig.savedModels}
                    activeModelId={dbConfig.activeModelId}
                    onModelChange={(modelId) => setDbConfig({ ...dbConfig, activeModelId: modelId })}
                    dbType={dbConfig.dbType}
                    onOpenSettings={() => setIsSettingsModalOpen(true)}
                  />
                </div>
              </div>
            </div>
          )}
        </main>
      </div>

      {/* Output Results Popup Modal */}
      <OutputResultsModal
        isOpen={modalOutputData.isOpen}
        onClose={() => setModalOutputData((prev) => ({ ...prev, isOpen: false }))}
        columns={modalOutputData.columns}
        records={modalOutputData.records}
        executionTime={modalOutputData.executionTime}
        tableName={modalOutputData.tableName}
      />

      {/* Security Mutation Warning Modal */}
      <MutationWarningModal
        isOpen={isMutationModalOpen}
        onDeny={handleDenyMutation}
        onGrant={handleGrantMutation}
        sqlSnippet={pendingMutation?.sql || ""}
        targetTable={pendingMutation?.targetTable}
        mutationType={pendingMutation?.mutationType}
      />

      {/* Antigravity-Style Settings Popup Modal */}
      <SettingsModal
        isOpen={isSettingsModalOpen}
        onClose={() => setIsSettingsModalOpen(false)}
        initialConfig={dbConfig as any}
        onSave={(newConfig: any) => {
          setDbConfig(newConfig);
        }}
        cachedPrompt={currentPrompt}
      />
    </div>
  );
}
