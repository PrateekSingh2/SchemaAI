"use client";

import React, { useState } from "react";
import {
  Plus,
  Search,
  Trash2,
  ChevronLeft,
  ChevronRight,
  Folder,
  Settings,
} from "lucide-react";
import { cn } from "@/lib/utils";

export interface ChatMessageTurn {
  id: string;
  userPrompt: string;
  timestamp: string;
  sql: string;
  graphql?: string;
  queryFormat: "sql" | "graphql";
  type?: "sql" | "text";
  textContent?: string;
  hasRun: boolean;
  records: Array<Record<string, unknown>>;
  columns: string[];
  executionTime: number;
  tokens: number;
  cost: string;
  isGenerating?: boolean;
  isExecuting?: boolean;
}

export interface ChatOperation {
  id: string;
  prompt: string;
  sql: string;
  graphql?: string;
  timestamp: string;
  format: "sql" | "graphql";
  type?: "sql" | "text";
  textContent?: string;
  status: "generated" | "executed" | "mutation";
  rowCount?: number;
  records?: Array<Record<string, unknown>>;
  columns?: string[];
  executionTime?: number;
  turns?: ChatMessageTurn[];
}

interface ChatHistoryPanelProps {
  operations: ChatOperation[];
  activeOperationId: string | null;
  onSelectOperation: (operation: ChatOperation) => void;
  onNewChat: () => void;
  onDeleteOperation: (id: string) => void;
  onClearHistory: () => void;
  isCollapsed: boolean;
  onToggleCollapse: () => void;
  onOpenSettings?: () => void;
}

export const ChatHistoryPanel: React.FC<ChatHistoryPanelProps> = ({
  operations,
  activeOperationId,
  onSelectOperation,
  onNewChat,
  onDeleteOperation,
  onClearHistory,
  isCollapsed,
  onToggleCollapse,
  onOpenSettings,
}) => {
  const [searchQuery, setSearchQuery] = useState("");

  const filtered = operations.filter((op) =>
    op.prompt.toLowerCase().includes(searchQuery.toLowerCase()) ||
    op.sql.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (isCollapsed) {
    return (
      <aside className="w-14 shrink-0 h-full border-r border-[#1e1e24] bg-[#0a0a0d] flex flex-col items-center py-3 justify-between transition-all duration-200 select-none z-20">
        <div className="flex flex-col items-center space-y-3.5 w-full">
          <button
            onClick={onToggleCollapse}
            className="p-2 rounded-xl text-zinc-400 hover:text-white hover:bg-[#18181c] transition-all cursor-pointer"
            title="Expand Sidebar"
          >
            <ChevronRight className="w-5 h-5" />
          </button>

          <button
            onClick={onNewChat}
            className="p-2.5 rounded-xl bg-[#18181c] border border-[#27272f] text-zinc-200 hover:text-white hover:border-zinc-500 transition-all shadow-sm cursor-pointer"
            title="New Conversation"
          >
            <Plus className="w-5 h-5" />
          </button>

          <div className="w-6 h-[1px] bg-[#1e1e24] my-1" />

          <div className="flex flex-col items-center space-y-2 w-full px-1 overflow-y-auto max-h-[calc(100vh-200px)] scrollbar-none">
            {operations.slice(0, 10).map((op) => (
              <button
                key={op.id}
                onClick={() => onSelectOperation(op)}
                className={cn(
                  "w-9 h-9 rounded-xl flex items-center justify-center transition-all cursor-pointer relative",
                  activeOperationId === op.id
                    ? "bg-[#18181c] text-white"
                    : "text-zinc-400 hover:text-zinc-200 hover:bg-[#141417]"
                )}
                title={op.prompt}
              >
                <Folder className="w-4.5 h-4.5" />
                {activeOperationId === op.id && (
                  <span className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-[#38bdf8] shadow-[0_0_6px_#38bdf8]" />
                )}
              </button>
            ))}
          </div>
        </div>

        <button
          onClick={onOpenSettings}
          className="p-2.5 rounded-xl text-zinc-400 hover:text-white hover:bg-[#18181c] transition-colors cursor-pointer"
          title="Settings"
        >
          <Settings className="w-5 h-5" />
        </button>
      </aside>
    );
  }

  return (
    <aside className="w-72 sm:w-76 shrink-0 h-full border-r border-[#1e1e24] bg-[#0a0a0d] flex flex-col justify-between transition-all duration-200 select-none z-20 text-sm text-[#a1a1aa] min-h-0">
      {/* Top Header Controls */}
      <div className="p-3.5 space-y-3 shrink-0">
        {/* + New Conversation Button */}
        <div className="flex items-center space-x-2">
          <button
            onClick={onNewChat}
            className="flex-1 flex items-center space-x-2.5 py-2.5 px-3.5 rounded-xl bg-[#141418] hover:bg-[#19191e] border border-[#26262e] hover:border-zinc-500 text-zinc-200 text-sm font-medium transition-all shadow-sm cursor-pointer"
          >
            <Plus className="w-4.5 h-4.5 text-zinc-400" />
            <span>New Conversation</span>
          </button>

          <button
            onClick={onToggleCollapse}
            className="p-2 rounded-xl text-zinc-500 hover:text-zinc-200 hover:bg-[#141418] transition-colors cursor-pointer"
            title="Collapse Sidebar"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
        </div>

        {/* Search Bar */}
        <div className="relative pt-0.5">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search queries..."
            className="w-full pl-9 pr-3 py-2 rounded-xl bg-[#121216] border border-[#202026] text-sm text-zinc-200 placeholder:text-zinc-500 focus:outline-none focus:border-[#38bdf8]/60 font-sans shadow-inner transition-colors"
          />
          <Search className="w-4 h-4 text-zinc-500 absolute left-3 top-3.5" />
        </div>
      </div>

      {/* Projects & Query Sessions List */}
      <div className="flex-1 min-h-0 overflow-y-auto px-2.5 space-y-3 scrollbar-none">
        <div>
          <div className="px-2.5 pb-1.5 text-xs font-semibold uppercase tracking-wider text-zinc-400 flex items-center justify-between">
            <span>Projects & Queries</span>
            <span className="text-xs font-mono text-zinc-500">{filtered.length}</span>
          </div>

          <div className="space-y-1">
            {filtered.length === 0 ? (
              <div className="px-3 py-8 text-center text-sm text-zinc-500">
                No conversations found
              </div>
            ) : (
              filtered.map((op) => {
                const isActive = activeOperationId === op.id;

                return (
                  <div
                    key={op.id}
                    onClick={() => onSelectOperation(op)}
                    className={cn(
                      "group flex items-center justify-between px-3 py-2.5 rounded-xl text-sm transition-all duration-150 cursor-pointer",
                      isActive
                        ? "bg-[#18181c] text-[#f4f4f5] font-medium shadow-sm"
                        : "hover:bg-[#131317] text-zinc-400 hover:text-zinc-200"
                    )}
                  >
                    <div className="flex items-center space-x-2.5 min-w-0 flex-1 pr-2">
                      <Folder className="w-4.5 h-4.5 text-zinc-400 shrink-0" />
                      <span className="truncate text-sm leading-snug">{op.prompt}</span>
                    </div>

                    <div className="flex items-center space-x-1.5 shrink-0">
                      {isActive ? (
                        <span className="w-2 h-2 rounded-full bg-[#38bdf8] shadow-[0_0_6px_#38bdf8]" />
                      ) : (
                        <span className="text-xs text-zinc-500 font-mono">
                          {op.timestamp}
                        </span>
                      )}

                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onDeleteOperation(op.id);
                        }}
                        className="opacity-0 group-hover:opacity-100 p-1 rounded-lg text-zinc-500 hover:text-rose-400 hover:bg-rose-950/40 transition-all ml-0.5 cursor-pointer"
                        title="Delete"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>

      {/* Bottom Footer: Settings Button */}
      <div className="p-3 border-t border-[#1e1e24] bg-[#0a0a0d] shrink-0">
        <button
          onClick={onOpenSettings}
          className="flex items-center space-x-2.5 px-3 py-2.5 rounded-xl text-sm font-medium text-zinc-300 hover:text-white hover:bg-[#18181c] border border-transparent hover:border-[#26262b] transition-all cursor-pointer w-full text-left"
          title="Open Settings"
        >
          <Settings className="w-4.5 h-4.5 text-zinc-400" />
          <span>Settings</span>
        </button>
      </div>
    </aside>
  );
};
