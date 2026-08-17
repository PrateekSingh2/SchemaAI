"use client";

import React, { useState, useRef, useCallback, useEffect } from "react";
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
import { GripVertical, GripHorizontal, RotateCcw, Maximize2 } from "lucide-react";
import { cn } from "@/lib/utils";

type MaximizedSection = null | "sql" | "prompt" | "records";

export default function QueryStudioPage() {
  const [isMutationModalOpen, setIsMutationModalOpen] = useState(false);

  // Split view percentages (Default: 40% left width, 60% top left height)
  const [leftWidthPct, setLeftWidthPct] = useState(40);
  const [topHeightPct, setTopHeightPct] = useState(60);
  const [maximizedSection, setMaximizedSection] = useState<MaximizedSection>(null);

  // Container refs for mouse drag resizing
  const containerRef = useRef<HTMLDivElement>(null);
  const leftColumnRef = useRef<HTMLDivElement>(null);
  const isDraggingHorizontal = useRef(false);
  const isDraggingVertical = useRef(false);

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

  // --- Resizing Mouse Handlers ---
  const handleMouseDownHorizontal = (e: React.MouseEvent) => {
    e.preventDefault();
    isDraggingHorizontal.current = true;
    document.body.style.cursor = "col-resize";
    document.body.style.userSelect = "none";
  };

  const handleMouseDownVertical = (e: React.MouseEvent) => {
    e.preventDefault();
    isDraggingVertical.current = true;
    document.body.style.cursor = "row-resize";
    document.body.style.userSelect = "none";
  };

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (isDraggingHorizontal.current && containerRef.current) {
      const containerRect = containerRef.current.getBoundingClientRect();
      const newWidthPct = ((e.clientX - containerRect.left) / containerRect.width) * 100;
      if (newWidthPct >= 20 && newWidthPct <= 75) {
        setLeftWidthPct(Math.round(newWidthPct));
      }
    }

    if (isDraggingVertical.current && leftColumnRef.current) {
      const leftColRect = leftColumnRef.current.getBoundingClientRect();
      const newHeightPct = ((e.clientY - leftColRect.top) / leftColRect.height) * 100;
      if (newHeightPct >= 25 && newHeightPct <= 80) {
        setTopHeightPct(Math.round(newHeightPct));
      }
    }
  }, []);

  const handleMouseUp = useCallback(() => {
    isDraggingHorizontal.current = false;
    isDraggingVertical.current = false;
    document.body.style.cursor = "";
    document.body.style.userSelect = "";
  }, []);

  useEffect(() => {
    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);
    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };
  }, [handleMouseMove, handleMouseUp]);

  // Reset back to default 40:60 / 60:40 split
  const handleResetSplit = () => {
    setLeftWidthPct(40);
    setTopHeightPct(60);
    setMaximizedSection(null);
  };

  // Toggle maximize for specific sections
  const toggleMaximize = (section: "sql" | "prompt" | "records") => {
    setMaximizedSection((prev) => (prev === section ? null : section));
  };

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

  const isCustomized = leftWidthPct !== 40 || topHeightPct !== 60 || maximizedSection !== null;

  return (
    <div className="h-screen w-screen overflow-hidden bg-[#121110] text-stone-100 flex flex-col font-sans select-none antialiased">
      {/* Top Application Header */}
      <Topbar
        dbName={dbConfig.databaseName}
        dbType={dbConfig.dbType}
        isConnected={true}
      />

      {/* Main Workspace Area with Drag Expanders */}
      <main
        ref={containerRef}
        className="flex-1 min-h-0 flex flex-col lg:flex-row gap-0 p-3 sm:p-4 overflow-hidden relative"
      >
        {/* Quick Reset Layout Pill (shows when customized) */}
        {isCustomized && (
          <div className="absolute top-5 right-6 z-20">
            <button
              onClick={handleResetSplit}
              className="flex items-center space-x-1.5 px-3 py-1 rounded-full bg-[#1c1917]/95 border border-[#3ecf8e]/40 text-[#3ecf8e] text-[11px] font-medium shadow-lg hover:bg-[#201d1a] transition-all backdrop-blur-md"
              title="Reset to default 40:60 split layout"
            >
              <RotateCcw className="w-3 h-3" />
              <span>Reset Split (40:60)</span>
            </button>
          </div>
        )}

        {/* CASE 1: FULL MAXIMIZED VIEW FOR A SECTION */}
        {maximizedSection === "sql" && (
          <div className="w-full h-full min-h-0 flex flex-col overflow-hidden animate-in fade-in duration-150">
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
              isMaximized={true}
              onToggleMaximize={() => toggleMaximize("sql")}
            />
          </div>
        )}

        {maximizedSection === "prompt" && (
          <div className="w-full h-full min-h-0 flex flex-col overflow-hidden animate-in fade-in duration-150">
            <PromptInput
              onGenerateAndRun={handleGenerateAndRun}
              isLoading={isGenerating}
              isMaximized={true}
              onToggleMaximize={() => toggleMaximize("prompt")}
            />
          </div>
        )}

        {maximizedSection === "records" && (
          <div className="w-full h-full min-h-0 flex flex-col overflow-hidden animate-in fade-in duration-150">
            <RecordsTable
              columns={currentColumns}
              records={currentRecords}
              isLoading={isGenerating}
              isMaximized={true}
              onToggleMaximize={() => toggleMaximize("records")}
            />
          </div>
        )}

        {/* CASE 2: DEFAULT / RESIZABLE SPLIT VIEW */}
        {maximizedSection === null && (
          <>
            {/* Left Column (Default 40% Width, resizable via drag handle) */}
            <div
              ref={leftColumnRef}
              style={{ width: `${leftWidthPct}%` }}
              className="h-full min-h-0 flex flex-col overflow-hidden transition-none"
            >
              {/* Top Section of Left Column: SQL Output (Default 60% Height) */}
              <div
                style={{ height: `${topHeightPct}%` }}
                className="min-h-0 flex flex-col overflow-hidden"
              >
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
                  isMaximized={false}
                  onToggleMaximize={() => toggleMaximize("sql")}
                />
              </div>

              {/* Vertical Boundary Expander / Drag Handle between SQL and Prompt */}
              <div
                onMouseDown={handleMouseDownVertical}
                onDoubleClick={() => setTopHeightPct(60)}
                className="group h-3 my-0.5 cursor-row-resize flex items-center justify-center relative select-none shrink-0"
                title="Drag to resize height | Double-click to reset (60:40)"
              >
                <div className="w-full h-[2px] bg-[#292524] group-hover:bg-[#3ecf8e]/60 transition-colors" />
                <div className="absolute px-3 py-0.5 rounded-full bg-[#1c1917] border border-[#292524] group-hover:border-[#3ecf8e]/60 text-stone-500 group-hover:text-[#3ecf8e] transition-all shadow-sm">
                  <GripHorizontal className="w-3 h-3" />
                </div>
              </div>

              {/* Bottom Section of Left Column: Prompt Input (Default 40% Height) */}
              <div
                style={{ height: `calc(${100 - topHeightPct}% - 0.75rem)` }}
                className="min-h-0 flex flex-col overflow-hidden"
              >
                <PromptInput
                  onGenerateAndRun={handleGenerateAndRun}
                  isLoading={isGenerating}
                  isMaximized={false}
                  onToggleMaximize={() => toggleMaximize("prompt")}
                />
              </div>
            </div>

            {/* Horizontal Boundary Expander / Drag Handle between Left and Right Columns */}
            <div
              onMouseDown={handleMouseDownHorizontal}
              onDoubleClick={() => setLeftWidthPct(40)}
              className="group w-3.5 mx-0.5 hidden lg:flex flex-col items-center justify-center cursor-col-resize relative select-none shrink-0"
              title="Drag to resize columns | Double-click to reset (40:60)"
            >
              <div className="h-full w-[2px] bg-[#292524] group-hover:bg-[#3ecf8e]/60 transition-colors" />
              <div className="absolute py-3 px-0.5 rounded-full bg-[#1c1917] border border-[#292524] group-hover:border-[#3ecf8e]/60 text-stone-500 group-hover:text-[#3ecf8e] transition-all shadow-sm">
                <GripVertical className="w-3 h-3" />
              </div>
            </div>

            {/* Right Column (Default 60% Width, resizable via drag handle) */}
            <div
              style={{ width: `calc(${100 - leftWidthPct}% - 1rem)` }}
              className="h-full min-h-0 flex flex-col overflow-hidden"
            >
              <RecordsTable
                columns={currentColumns}
                records={currentRecords}
                isLoading={isGenerating}
                isMaximized={false}
                onToggleMaximize={() => toggleMaximize("records")}
              />
            </div>
          </>
        )}
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
