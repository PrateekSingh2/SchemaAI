"use client";

import React, { useState } from "react";
import { Topbar, ActiveTab } from "@/components/Topbar";
import { SettingsModal, DatabaseConfig } from "@/components/SettingsModal";
import { MutationWarningModal } from "@/components/MutationWarningModal";
import { SchemaCanvas } from "@/components/SchemaExplorer/SchemaCanvas";
import { SqlOutput } from "@/components/QueryStudio/SqlOutput";
import { RecordsTable } from "@/components/QueryStudio/RecordsTable";
import { PromptInput } from "@/components/QueryStudio/PromptInput";
import { LogsView } from "@/components/AuditLogs/LogsView";
import {
  initialAuditLogs,
  AuditLogEntry,
  detectMutation,
  generateMockResult,
} from "@/lib/mockData";

export default function HomePage() {
  const [activeTab, setActiveTab] = useState<ActiveTab>("query");
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isMutationModalOpen, setIsMutationModalOpen] = useState(false);

  // Database config state
  const [dbConfig, setDbConfig] = useState<DatabaseConfig>({
    dbType: "PostgreSQL",
    connectionUri: "postgresql://postgres.user:••••••••@aws-0-us-east-1.pooler.supabase.com:5432/production_core_db",
    username: "postgres.admin",
    password: "••••••••••••••••",
    databaseName: "production_core_db",
    llmProvider: "openai",
    llmApiKey: "sk-proj-••••••••••••••••",
    enableQueryGuard: true,
  });

  // Query Studio state
  const [currentPrompt, setCurrentPrompt] = useState(
    "Find the top 5 users who scored highest in weekly quizzes with their average submission execution time"
  );
  const [queryFormat, setQueryFormat] = useState<"sql" | "graphql">("sql");
  const [isGenerating, setIsGenerating] = useState(false);

  // Current Query Execution Results
  const initialResult = generateMockResult(currentPrompt, "sql");
  const [currentSql, setCurrentSql] = useState(initialResult.sql);
  const [currentGraphql, setCurrentGraphql] = useState(initialResult.graphql);
  const [currentRecords, setCurrentRecords] = useState(initialResult.records);
  const [currentColumns, setCurrentColumns] = useState(initialResult.columns);
  const [stats, setStats] = useState({
    executionTime: initialResult.executionTime,
    tokens: initialResult.tokens,
    cost: initialResult.cost,
  });

  // Pending mutation execution state
  const [pendingMutation, setPendingMutation] = useState<{
    prompt: string;
    sql: string;
    targetTable?: string;
    mutationType?: string;
  } | null>(null);

  // Audit Logs state
  const [auditLogs, setAuditLogs] = useState<AuditLogEntry[]>(initialAuditLogs);

  // Handle Query Generation and Execution
  const handleGenerateAndRun = async (promptText: string) => {
    setCurrentPrompt(promptText);
    setIsGenerating(true);

    // Simulate LLM Generation Delay
    await new Promise((resolve) => setTimeout(resolve, 800));

    const mutationCheck = detectMutation(promptText);
    const mockOutput = generateMockResult(promptText, queryFormat);

    if (mutationCheck.isMutation && dbConfig.enableQueryGuard) {
      setIsGenerating(false);
      setPendingMutation({
        prompt: promptText,
        sql: mockOutput.sql,
        targetTable: mutationCheck.targetTable,
        mutationType: mutationCheck.mutationType,
      });
      setIsMutationModalOpen(true);
      return;
    }

    // Execute standard safe read query
    setCurrentSql(mockOutput.sql);
    if (mockOutput.graphql) setCurrentGraphql(mockOutput.graphql);
    setCurrentRecords(mockOutput.records);
    setCurrentColumns(mockOutput.columns);
    setStats({
      executionTime: mockOutput.executionTime,
      tokens: mockOutput.tokens,
      cost: mockOutput.cost,
    });

    // Record success in Audit Log
    const newLog: AuditLogEntry = {
      id: `LOG-${Math.floor(10000 + Math.random() * 90000)}`,
      timestamp: new Date().toISOString().replace("T", " ").substring(0, 19) + " UTC",
      ipAddress: "192.168.1.104",
      userPrompt: promptText,
      generatedSql: mockOutput.sql,
      status: "SUCCESS",
      durationMs: mockOutput.executionTime,
      rowsAffected: mockOutput.records.length,
      model: dbConfig.llmProvider === "openai" ? "GPT-4o (schema-tuned)" : "Claude 3.5 Sonnet",
      clientDevice: "Chrome 128 / macOS",
    };

    setAuditLogs((prev) => [newLog, ...prev]);
    setIsGenerating(false);
  };

  // Handle Mutation Authorization Grant
  const handleGrantMutation = () => {
    if (!pendingMutation) return;

    const mockOutput = generateMockResult(pendingMutation.prompt, queryFormat);
    setCurrentSql(pendingMutation.sql);
    setCurrentRecords(mockOutput.records);
    setCurrentColumns(mockOutput.columns);

    const approvedLog: AuditLogEntry = {
      id: `LOG-${Math.floor(10000 + Math.random() * 90000)}`,
      timestamp: new Date().toISOString().replace("T", " ").substring(0, 19) + " UTC",
      ipAddress: "192.168.1.104",
      userPrompt: pendingMutation.prompt,
      generatedSql: pendingMutation.sql,
      status: "MUTATION_APPROVED",
      durationMs: 68,
      rowsAffected: mockOutput.records.length,
      model: "GPT-4o (admin override)",
      targetTable: pendingMutation.targetTable,
      clientDevice: "Chrome 128 / macOS",
    };

    setAuditLogs((prev) => [approvedLog, ...prev]);
    setIsMutationModalOpen(false);
    setPendingMutation(null);
  };

  // Handle Mutation Deny
  const handleDenyMutation = () => {
    if (!pendingMutation) return;

    const blockedLog: AuditLogEntry = {
      id: `LOG-${Math.floor(10000 + Math.random() * 90000)}`,
      timestamp: new Date().toISOString().replace("T", " ").substring(0, 19) + " UTC",
      ipAddress: "192.168.1.104",
      userPrompt: pendingMutation.prompt,
      generatedSql: pendingMutation.sql,
      status: "BLOCKED",
      durationMs: 14,
      rowsAffected: 0,
      model: "GPT-4o (Query Guard Intercept)",
      targetTable: pendingMutation.targetTable,
      clientDevice: "Chrome 128 / macOS",
    };

    setAuditLogs((prev) => [blockedLog, ...prev]);
    setIsMutationModalOpen(false);
    setPendingMutation(null);
  };

  return (
    <div className="min-h-screen bg-[#080c14] text-slate-100 flex flex-col font-sans select-none">
      {/* Top Application Header Bar */}
      <Topbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onOpenSettings={() => setIsSettingsOpen(true)}
        dbName={dbConfig.databaseName}
        dbType={dbConfig.dbType}
        isConnected={true}
      />

      {/* Main Tab Area */}
      <main className="flex-1 flex flex-col overflow-hidden">
        {/* Tab 1: Schema Explorer Visualizer */}
        {activeTab === "schema" && <SchemaCanvas />}

        {/* Tab 2: Query Studio Workspace */}
        {activeTab === "query" && (
          <div className="flex-1 flex flex-col p-4 sm:p-6 space-y-4 max-w-[1600px] mx-auto w-full h-[calc(100vh-4rem)] overflow-hidden">
            {/* Top Split View: SQL Output (Left) & Records Table (Right) */}
            <div className="flex-1 grid grid-cols-1 lg:grid-cols-2 gap-4 min-h-0">
              {/* Left Pane: SQL / GraphQL Code Pane */}
              <SqlOutput
                sql={currentSql}
                graphql={currentGraphql}
                isGenerating={isGenerating}
                queryFormat={queryFormat}
                setQueryFormat={setQueryFormat}
                executionTime={stats.executionTime}
                tokens={stats.tokens}
                cost={stats.cost}
                dialect={`${dbConfig.dbType} 16`}
              />

              {/* Right Pane: Records Spreadsheet Grid */}
              <RecordsTable
                columns={currentColumns}
                records={currentRecords}
                isLoading={isGenerating}
              />
            </div>

            {/* Bottom Docked Natural Language Input */}
            <div className="shrink-0">
              <PromptInput
                onGenerateAndRun={handleGenerateAndRun}
                isLoading={isGenerating}
              />
            </div>
          </div>
        )}

        {/* Tab 3: Audit & Security Logs */}
        {activeTab === "logs" && (
          <div className="flex-1 overflow-y-auto">
            <LogsView logs={auditLogs} />
          </div>
        )}
      </main>

      {/* Settings Modal */}
      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        onSave={(newCfg) => setDbConfig(newCfg)}
      />

      {/* Security Mutation Interception Modal */}
      <MutationWarningModal
        isOpen={isMutationModalOpen}
        onDeny={handleDenyMutation}
        onGrant={handleGrantMutation}
        sqlSnippet={pendingMutation?.sql || ""}
        targetTable={pendingMutation?.targetTable}
        mutationType={pendingMutation?.mutationType}
      />
    </div>
  );
}
