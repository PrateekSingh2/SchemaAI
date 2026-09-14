"use client";

import React, { useState, useRef, useEffect } from "react";
import { Topbar } from "@/components/Topbar";
import { MutationWarningModal } from "@/components/MutationWarningModal";
import { OutputResultsModal } from "@/components/QueryStudio/OutputResultsModal";
import { SettingsModal, DatabaseConfig } from "@/components/SettingsModal";
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
} from "@/lib/mockData";
import {
  Database,
  Cpu,
  User,
  Sparkles,
  RotateCcw,
  Bot,
} from "lucide-react";
import { cn } from "@/lib/utils";

const INITIAL_TURNS: ChatMessageTurn[] = [
  {
    id: "turn-1",
    userPrompt: "Find the top 5 users who scored highest in weekly quizzes with their average submission execution time",
    timestamp: "10m ago",
    sql: `SELECT \n  u.id AS user_id,\n  u.username,\n  u.email,\n  u.role,\n  COUNT(DISTINCT s.problem_id) AS problems_solved,\n  SUM(s.score_awarded) AS total_score,\n  ROUND(AVG(s.execution_time_ms), 2) AS avg_runtime_ms\nFROM users u\nJOIN submissions s ON u.id = s.user_id\nJOIN problems p ON s.problem_id = p.id\nWHERE s.status = 'ACCEPTED'\nGROUP BY u.id, u.username, u.email, u.role\nORDER BY total_score DESC, avg_runtime_ms ASC\nLIMIT 5;`,
    queryFormat: "sql",
    hasRun: true,
    records: [
      { user_id: "usr_99a82b", username: "alex_chen", email: "alex.chen@cyber.dev", role: "contender", problems_solved: 48, total_score: 4800, avg_runtime_ms: 24.5 },
      { user_id: "usr_44f10c", username: "elena_rostova", email: "elena.r@deepmath.org", role: "master", problems_solved: 46, total_score: 4650, avg_runtime_ms: 31.2 },
      { user_id: "usr_77e31d", username: "marcus_v", email: "m.vance@quantum.ai", role: "master", problems_solved: 42, total_score: 4200, avg_runtime_ms: 28.8 },
      { user_id: "usr_12c98a", username: "sophia_k", email: "sophia.k@matrix.io", role: "contender", problems_solved: 39, total_score: 3950, avg_runtime_ms: 45.1 },
      { user_id: "usr_88d33e", username: "dev_siddharth", email: "sid.sharma@byteflow.net", role: "pro", problems_solved: 37, total_score: 3700, avg_runtime_ms: 38.6 },
    ],
    columns: ["user_id", "username", "email", "role", "problems_solved", "total_score", "avg_runtime_ms"],
    executionTime: 32,
    tokens: 285,
    cost: "$0.0011",
  },
];

const INITIAL_OPERATIONS: ChatOperation[] = [
  {
    id: "op-1",
    prompt: "Find the top 5 users who scored highest in weekly quizzes with their average submission execution time",
    sql: INITIAL_TURNS[0].sql,
    timestamp: "10m ago",
    format: "sql",
    status: "executed",
    rowCount: 5,
    turns: INITIAL_TURNS,
  },
  {
    id: "op-2",
    prompt: "Show all active quizzes along with the count of easy, medium, and hard problems linked to each.",
    sql: `SELECT \n  q.id AS quiz_id,\n  q.title AS quiz_title,\n  q.pass_percentage,\n  COUNT(p.id) AS total_problems,\n  q.is_active\nFROM quizzes q\nLEFT JOIN problems p ON q.id = p.quiz_id\nWHERE q.is_active = true\nGROUP BY q.id, q.title, q.pass_percentage, q.is_active;`,
    timestamp: "25m ago",
    format: "sql",
    status: "generated",
    rowCount: 5,
  },
];

export default function QueryStudioPage() {
  const [isMutationModalOpen, setIsMutationModalOpen] = useState(false);
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

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

  // Database config
  const [dbConfig, setDbConfig] = useState({
    dbType: "PostgreSQL",
    databaseName: "production_core_db",
    enableQueryGuard: true,
    llmProvider: "openai",
  });

  // Query Studio state
  const [currentPrompt, setCurrentPrompt] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);

  // Chat conversation turns:
  // If activeTurns is empty => show initial centered prompt screen
  // If activeTurns has >= 1 turn => Gemini layout: turns stream + sticky bottom input
  const [activeTurns, setActiveTurns] = useState<ChatMessageTurn[]>([]);
  const [activeOperationId, setActiveOperationId] = useState<string | null>(null);

  // Operations / Chat History
  const [operations, setOperations] = useState<ChatOperation[]>(INITIAL_OPERATIONS);

  // Pending mutation execution state
  const [pendingMutation, setPendingMutation] = useState<{
    prompt: string;
    sql: string;
    turnId: string;
    targetTable?: string;
    mutationType?: string;
  } | null>(null);

  // Scroll ref for single unified scrollbar
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const turnsEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom whenever activeTurns updates or generating starts
  useEffect(() => {
    if (activeTurns.length > 0) {
      turnsEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [activeTurns.length, isGenerating]);

  // 1. Submit a prompt:
  // If no turns yet, creates the first turn and starts the chat session.
  // If turns already exist, appends a new turn into the SAME chat conversation!
  const handleGenerateQuery = async (promptText: string) => {
    if (!promptText.trim()) return;

    setCurrentPrompt("");
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

    await new Promise((resolve) => setTimeout(resolve, 750));

    const mockOutput = generateMockResult(promptText, "sql");

    const completedTurn: ChatMessageTurn = {
      id: turnId,
      userPrompt: promptText,
      timestamp: "Just now",
      sql: mockOutput.sql,
      graphql: mockOutput.graphql,
      queryFormat: "sql",
      hasRun: false,
      records: mockOutput.records,
      columns: mockOutput.columns,
      executionTime: mockOutput.executionTime,
      tokens: mockOutput.tokens,
      cost: mockOutput.cost,
      isGenerating: false,
    };

    setActiveTurns((prev) =>
      prev.map((t) => (t.id === turnId ? completedTurn : t))
    );
    setIsGenerating(false);

    // Update or create chat operation in left panel
    if (!activeOperationId) {
      const newOpId = `op-${Date.now()}`;
      const newOp: ChatOperation = {
        id: newOpId,
        prompt: promptText,
        sql: mockOutput.sql,
        graphql: mockOutput.graphql,
        timestamp: "Just now",
        format: "sql",
        status: "generated",
        rowCount: mockOutput.records.length,
        records: mockOutput.records,
        columns: mockOutput.columns,
        executionTime: mockOutput.executionTime,
        turns: [completedTurn],
      };
      setOperations((prev) => [newOp, ...prev]);
      setActiveOperationId(newOpId);
    } else {
      setOperations((prev) =>
        prev.map((op) =>
          op.id === activeOperationId
            ? {
                ...op,
                sql: mockOutput.sql,
                turns: [...(op.turns || []), completedTurn],
              }
            : op
        )
      );
    }
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

    await new Promise((resolve) => setTimeout(resolve, 600));

    const mockOutput = generateMockResult(promptToCheck, turn.queryFormat);

    // Update turn state
    setActiveTurns((prev) =>
      prev.map((t) =>
        t.id === turnId
          ? {
              ...t,
              hasRun: true,
              isExecuting: false,
              records: mockOutput.records,
              columns: mockOutput.columns,
              executionTime: mockOutput.executionTime,
            }
          : t
      )
    );

    // Automatically open popup modal for fetched output
    setModalOutputData({
      isOpen: true,
      columns: mockOutput.columns,
      records: mockOutput.records,
      executionTime: mockOutput.executionTime,
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
                rowCount: mockOutput.records.length,
              }
            : op
        )
      );
    }
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
    if (activeOperationId === id) {
      handleNewChat();
    }
  };

  // 9. Clear all history
  const handleClearHistory = () => {
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
        dbName={dbConfig.databaseName}
        dbType={dbConfig.dbType}
        isConnected={true}
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
                      />
                    </div>
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
                    llmProvider={dbConfig.llmProvider}
                    onLlmChange={(provider) => setDbConfig({ ...dbConfig, llmProvider: provider })}
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
        onSave={(newConfig: DatabaseConfig) => {
          setDbConfig((prev) => ({
            ...prev,
            dbType: newConfig.dbType,
            databaseName: newConfig.databaseName,
            enableQueryGuard: newConfig.enableQueryGuard,
            llmProvider: newConfig.llmProvider,
          }));
        }}
      />
    </div>
  );
}
