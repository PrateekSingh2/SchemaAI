"use client";

import React, { useState } from "react";
import { Topbar } from "@/components/Topbar";
import { MutationWarningModal } from "@/components/MutationWarningModal";
import { SqlOutput } from "@/components/QueryStudio/SqlOutput";
import { RecordsTable } from "@/components/QueryStudio/RecordsTable";
import { PromptInput } from "@/components/QueryStudio/PromptInput";
import {
  initialAuditLogs,
  AuditLogEntry,
  detectMutation,
  generateMockResult,
} from "@/lib/mockData";

export default function QueryStudioPage() {
  const [isMutationModalOpen, setIsMutationModalOpen] = useState(false);

  // Database config
  const [dbConfig] = useState({
    dbType: "PostgreSQL",
    databaseName: "production_core_db",
    enableQueryGuard: true,
    llmProvider: "openai",
  });

  // Query Studio state
  const [currentPrompt, setCurrentPrompt] = useState(
    "Find the top 5 users who scored highest in weekly quizzes with their average submission execution time"
  );
  const [queryFormat, setQueryFormat] = useState<"sql" | "graphql">("sql");
  const [isGenerating, setIsGenerating] = useState(false);

  // Execution Results
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

  // Handle Query Generation and Execution
  const handleGenerateAndRun = async (promptText: string) => {
    setCurrentPrompt(promptText);
    setIsGenerating(true);

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

    setCurrentSql(mockOutput.sql);
    if (mockOutput.graphql) setCurrentGraphql(mockOutput.graphql);
    setCurrentRecords(mockOutput.records);
    setCurrentColumns(mockOutput.columns);
    setStats({
      executionTime: mockOutput.executionTime,
      tokens: mockOutput.tokens,
      cost: mockOutput.cost,
    });

    setIsGenerating(false);
  };

  // Handle Mutation Authorization Grant
  const handleGrantMutation = () => {
    if (!pendingMutation) return;

    const mockOutput = generateMockResult(pendingMutation.prompt, queryFormat);
    setCurrentSql(pendingMutation.sql);
    setCurrentRecords(mockOutput.records);
    setCurrentColumns(mockOutput.columns);

    setIsMutationModalOpen(false);
    setPendingMutation(null);
  };

  // Handle Mutation Deny
  const handleDenyMutation = () => {
    setIsMutationModalOpen(false);
    setPendingMutation(null);
  };

  return (
    <div className="h-screen w-screen overflow-hidden bg-[#121110] text-stone-100 flex flex-col font-sans select-none antialiased">
      {/* Top Application Header */}
      <Topbar
        dbName={dbConfig.databaseName}
        dbType={dbConfig.dbType}
        isConnected={true}
      />

      {/* Main Workspace (Strictly 100% viewport height, zero full-page scroll) */}
      <main className="flex-1 min-h-0 flex flex-col p-3 sm:p-4 space-y-3 overflow-hidden">
        {/* Top Split View: SQL Editor (Left) & Records Table (Right) */}
        <div className="flex-1 min-h-0 grid grid-cols-1 lg:grid-cols-2 gap-3.5 overflow-hidden">
          {/* Left: SQL Output Pane */}
          <div className="h-full min-h-0 flex flex-col overflow-hidden">
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
          </div>

          {/* Right: Records Table Grid */}
          <div className="h-full min-h-0 flex flex-col overflow-hidden">
            <RecordsTable
              columns={currentColumns}
              records={currentRecords}
              isLoading={isGenerating}
            />
          </div>
        </div>

        {/* Bottom Docked Natural Language Input (Fixed at bottom) */}
        <div className="shrink-0">
          <PromptInput
            onGenerateAndRun={handleGenerateAndRun}
            isLoading={isGenerating}
          />
        </div>
      </main>

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
