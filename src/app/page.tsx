"use client";

import React, { useState, useRef, useCallback, useEffect } from "react";
import { Topbar } from "@/components/Topbar";
import { MutationWarningModal } from "@/components/MutationWarningModal";
import { SqlOutput } from "@/components/QueryStudio/SqlOutput";
import { RecordsTable } from "@/components/QueryStudio/RecordsTable";
import { PromptInput } from "@/components/QueryStudio/PromptInput";
import {
  detectMutation,
  generateMockResult,
} from "@/lib/mockData";
import { GripVertical, GripHorizontal, Code2, Table2 } from "lucide-react";
import { cn } from "@/lib/utils";

type MaximizedSection = null | "sql" | "prompt" | "records";
type MobileWorkbenchTab = "prompt" | "sql" | "records";

export default function QueryStudioPage() {
  const [isMutationModalOpen, setIsMutationModalOpen] = useState(false);

  // Mobile view tab ("prompt" | "sql" | "records")
  const [mobileTab, setMobileTab] = useState<MobileWorkbenchTab>("prompt");

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
      const rawPct = ((e.clientX - containerRect.left) / containerRect.width) * 100;
      // Clamp between 25% and 75% to prevent collapse
      const clampedPct = Math.min(Math.max(rawPct, 25), 75);
      setLeftWidthPct(Math.round(clampedPct));
    }

    if (isDraggingVertical.current && leftColumnRef.current) {
      const leftColRect = leftColumnRef.current.getBoundingClientRect();
      const rawPct = ((e.clientY - leftColRect.top) / leftColRect.height) * 100;
      // Clamp between 25% and 75% to prevent collapse
      const clampedPct = Math.min(Math.max(rawPct, 25), 75);
      setTopHeightPct(Math.round(clampedPct));
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

    // Switch mobile tab to SQL Output automatically on generate
    setMobileTab("sql");

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
    <div className="h-screen-dvh w-screen overflow-hidden bg-[#121110] text-stone-100 flex flex-col font-sans select-none antialiased">
      {/* Top Application Header */}
      <Topbar
        dbName={dbConfig.databaseName}
        dbType={dbConfig.dbType}
        isConnected={true}
        isLayoutCustomized={isCustomized}
        onResetLayout={handleResetSplit}
      />

      {/* Main Workspace Area */}
      <main
        ref={containerRef}
        className="flex-1 min-h-0 min-w-0 p-2 sm:p-3 overflow-hidden relative"
      >
        {/* --- MOBILE WORKBENCH LAYOUT (< lg screens): HORIZONTALLY SPLIT IN TWO HALVES --- */}
        <div className="lg:hidden w-full h-full min-h-0 min-w-0 flex flex-col gap-1.5 overflow-hidden">
          {/* Top Half (50% Height): Prompt Writing Box */}
          <div className="h-[48%] min-h-0 min-w-0 flex flex-col overflow-hidden">
            <PromptInput
              onGenerateAndRun={handleGenerateAndRun}
              isLoading={isGenerating}
              isMaximized={false}
            />
          </div>

          {/* Horizontal Split Line Divider */}
          <div className="h-1 my-0.5 flex items-center justify-center shrink-0">
            <div className="w-16 h-1 rounded-full bg-[#292524]" />
          </div>

          {/* Bottom Half (50% Height): Generated SQL Query Output & Data Grid Switcher */}
          <div className="h-[50%] flex-1 min-h-0 min-w-0 flex flex-col overflow-hidden relative">
            {/* Mobile Bottom-Pane View Selector Pill */}
            <div className="flex items-center justify-between pb-1.5 shrink-0">
              <div className="flex items-center space-x-1 bg-[#1c1917] p-0.5 rounded-xl border border-[#292524] text-[11px] font-medium shadow-inner">
                <button
                  onClick={() => setMobileTab("sql")}
                  className={cn(
                    "flex items-center space-x-1 px-2.5 py-0.5 rounded-lg transition-all",
                    mobileTab === "sql"
                      ? "bg-[#141210] text-[#3ecf8e] font-semibold border border-[#3ecf8e]/30 shadow-sm"
                      : "text-stone-400 hover:text-stone-200"
                  )}
                >
                  <Code2 className="w-3 h-3" />
                  <span>Generated SQL</span>
                </button>
                <button
                  onClick={() => setMobileTab("records")}
                  className={cn(
                    "flex items-center space-x-1 px-2.5 py-0.5 rounded-lg transition-all",
                    mobileTab === "records"
                      ? "bg-[#141210] text-[#3ecf8e] font-semibold border border-[#3ecf8e]/30 shadow-sm"
                      : "text-stone-400 hover:text-stone-200"
                  )}
                >
                  <Table2 className="w-3 h-3" />
                  <span>Results Grid ({currentRecords.length})</span>
                </button>
              </div>
            </div>

            {/* Bottom Pane Output Content */}
            <div className="flex-1 min-h-0 min-w-0 flex flex-col overflow-hidden">
              {mobileTab === "records" ? (
                <RecordsTable
                  columns={currentColumns}
                  records={currentRecords}
                  isLoading={isGenerating}
                  isMaximized={false}
                />
              ) : (
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
                />
              )}
            </div>
          </div>
        </div>

        {/* --- DESKTOP RESIZABLE SPLIT WORKBENCH (≥ lg screens) --- */}
        <div className="hidden lg:flex w-full h-full min-h-0 min-w-0 flex-row gap-0">
          {/* CASE 1: FULL MAXIMIZED VIEW FOR A SECTION */}
          {maximizedSection === "sql" && (
            <div className="w-full h-full min-h-0 min-w-0 flex flex-col overflow-hidden animate-in fade-in duration-150">
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
            <div className="w-full h-full min-h-0 min-w-0 flex flex-col overflow-hidden animate-in fade-in duration-150">
              <PromptInput
                onGenerateAndRun={handleGenerateAndRun}
                isLoading={isGenerating}
                isMaximized={true}
                onToggleMaximize={() => toggleMaximize("prompt")}
              />
            </div>
          )}

          {maximizedSection === "records" && (
            <div className="w-full h-full min-h-0 min-w-0 flex flex-col overflow-hidden animate-in fade-in duration-150">
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
                className="h-full min-h-0 min-w-[260px] flex flex-col overflow-hidden transition-none shrink-0"
              >
                {/* Top Section of Left Column: SQL Output (Default 60% Height) */}
                <div
                  style={{ height: `${topHeightPct}%` }}
                  className="min-h-[140px] min-w-0 flex flex-col overflow-hidden"
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
                  className="group h-2.5 my-0.5 cursor-row-resize flex items-center justify-center relative select-none shrink-0"
                  title="Drag to resize height | Double-click to reset (60:40)"
                >
                  <div className="w-full h-[2px] bg-[#292524] group-hover:bg-[#3ecf8e]/60 transition-colors" />
                  <div className="absolute px-2.5 py-0.5 rounded-full bg-[#1c1917] border border-[#292524] group-hover:border-[#3ecf8e]/60 text-stone-500 group-hover:text-[#3ecf8e] transition-all shadow-sm">
                    <GripHorizontal className="w-2.5 h-2.5" />
                  </div>
                </div>

                {/* Bottom Section of Left Column: Prompt Input (Default 40% Height) */}
                <div
                  style={{ height: `calc(${100 - topHeightPct}% - 0.625rem)` }}
                  className="min-h-[120px] min-w-0 flex flex-col overflow-hidden"
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
                className="group w-3 mx-0.5 hidden lg:flex flex-col items-center justify-center cursor-col-resize relative select-none shrink-0"
                title="Drag to resize columns | Double-click to reset (40:60)"
              >
                <div className="h-full w-[2px] bg-[#292524] group-hover:bg-[#3ecf8e]/60 transition-colors" />
                <div className="absolute py-2.5 px-0.5 rounded-full bg-[#1c1917] border border-[#292524] group-hover:border-[#3ecf8e]/60 text-stone-500 group-hover:text-[#3ecf8e] transition-all shadow-sm">
                  <GripVertical className="w-2.5 h-2.5" />
                </div>
              </div>

              {/* Right Column (Default 60% Width, resizable via drag handle) */}
              <div
                style={{ width: `calc(${100 - leftWidthPct}% - 0.75rem)` }}
                className="h-full min-h-0 min-w-[280px] flex flex-col overflow-hidden flex-1"
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

