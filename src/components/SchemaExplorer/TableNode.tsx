"use client";

import React, { memo } from "react";
import { Handle, Position, NodeProps } from "@xyflow/react";
import {
  Table2,
  KeyRound,
  Link2,
  Hash,
  Type,
  Calendar,
  ToggleLeft,
  Sparkles,
} from "lucide-react";
import { TableNodeData, ColumnDefinition } from "@/lib/mockData";
import { cn } from "@/lib/utils";

const getTypeIcon = (type: string) => {
  const lower = type.toLowerCase();
  if (lower.includes("uuid") || lower.includes("id")) return <KeyRound className="w-3 h-3 text-[#3ecf8e]" />;
  if (lower.includes("int") || lower.includes("numeric") || lower.includes("score")) return <Hash className="w-3 h-3 text-amber-400" />;
  if (lower.includes("time") || lower.includes("date")) return <Calendar className="w-3 h-3 text-stone-400" />;
  if (lower.includes("bool")) return <ToggleLeft className="w-3 h-3 text-[#3ecf8e]" />;
  return <Type className="w-3 h-3 text-stone-400" />;
};

const TableNodeComponent: React.FC<NodeProps> = ({ data, selected }) => {
  const tableData = data as unknown as TableNodeData;
  const { tableName, schema = "public", rowCount, columns = [], description } = tableData;

  return (
    <div
      className={cn(
        "w-72 rounded-2xl bg-[#1c1917]/95 backdrop-blur-2xl border transition-all duration-300 shadow-2xl text-stone-200 overflow-hidden font-sans group",
        selected
          ? "border-[#3ecf8e] shadow-[0_0_30px_rgba(62,207,142,0.25)] ring-1 ring-[#3ecf8e]/50"
          : "border-[#2e2a27] hover:border-stone-600 hover:shadow-black/50"
      )}
    >
      {/* Table Header */}
      <div className="p-3.5 bg-gradient-to-r from-[#171412] via-[#171412] to-[#1a1715] border-b border-[#292524] flex items-center justify-between">
        <div className="flex items-center space-x-2.5 min-w-0">
          <div className="p-1.5 rounded-xl bg-[#3ecf8e]/10 border border-[#3ecf8e]/20 text-[#3ecf8e] shrink-0">
            <Table2 className="w-4 h-4" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center space-x-1.5">
              <span className="text-xs font-mono text-stone-500">{schema}.</span>
              <h3 className="font-bold text-sm text-stone-100 tracking-tight truncate font-mono">
                {tableName}
              </h3>
            </div>
            {description && (
              <p className="text-[10px] text-stone-400 truncate max-w-[170px]" title={description}>
                {description}
              </p>
            )}
          </div>
        </div>

        {/* Row Count Badge */}
        <div className="flex flex-col items-end">
          <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-[#141210] text-stone-300 border border-[#292524] shrink-0 shadow-inner">
            {rowCount.toLocaleString()} rows
          </span>
        </div>
      </div>

      {/* Target/Source Generic Handles */}
      <Handle
        type="target"
        position={Position.Left}
        id={`${tableName}-target`}
        className="!w-2.5 !h-2.5 !bg-[#3ecf8e] !border-2 !border-[#1c1917] !-left-1.5"
      />
      <Handle
        type="source"
        position={Position.Right}
        id={`${tableName}-source`}
        className="!w-2.5 !h-2.5 !bg-[#3ecf8e] !border-2 !border-[#1c1917] !-right-1.5"
      />

      {/* Columns List */}
      <div className="divide-y divide-[#292524]/60 bg-[#151311]/70">
        {columns.map((col: ColumnDefinition) => {
          return (
            <div
              key={col.name}
              className={cn(
                "relative flex items-center justify-between px-3.5 py-2 text-xs hover:bg-[#201d1a]/80 transition-colors group/row",
                col.isPrimaryKey && "bg-[#3ecf8e]/[0.04]"
              )}
            >
              {/* Row Target Handle */}
              <Handle
                type="target"
                position={Position.Left}
                id={`${tableName}-${col.name}`}
                className={cn(
                  "!w-2 !h-2 !-left-1 !border !border-[#141210] transition-opacity",
                  col.isForeignKey ? "!bg-purple-400 opacity-90" : "!bg-stone-600 opacity-0 group-hover/row:opacity-100"
                )}
              />

              {/* Column Name & Key Indicators */}
              <div className="flex items-center space-x-2 min-w-0 pr-2">
                <span className="shrink-0">{getTypeIcon(col.type)}</span>
                <span
                  className={cn(
                    "font-mono truncate font-medium",
                    col.isPrimaryKey
                      ? "text-[#3ecf8e] font-semibold"
                      : col.isForeignKey
                      ? "text-purple-300 font-medium"
                      : "text-stone-300"
                  )}
                >
                  {col.name}
                </span>

                {col.isPrimaryKey && (
                  <span
                    className="flex items-center text-[9px] font-mono font-bold uppercase px-1.5 py-0.2 rounded-full bg-amber-500/15 text-amber-300 border border-amber-500/30"
                    title="Primary Key (Unique Index)"
                  >
                    PK
                  </span>
                )}

                {col.isForeignKey && (
                  <span
                    className="flex items-center text-[9px] font-mono font-semibold uppercase px-1.5 py-0.2 rounded-full bg-purple-500/15 text-purple-300 border border-purple-500/30 gap-0.5"
                    title={`Foreign Key -> ${col.foreignKeyRef}`}
                  >
                    <Link2 className="w-2.5 h-2.5" /> FK
                  </span>
                )}
              </div>

              {/* Column Type & Nullable Status */}
              <div className="flex items-center space-x-1.5 shrink-0">
                <span className="font-mono text-[10px] text-stone-400 bg-[#1c1917] px-1.5 py-0.5 rounded-lg border border-[#292524]">
                  {col.type}
                </span>
                {col.isNullable && (
                  <span
                    className="text-[9px] text-stone-500 font-mono"
                    title="Nullable column"
                  >
                    null
                  </span>
                )}
              </div>

              {/* Row Source Handle */}
              <Handle
                type="source"
                position={Position.Right}
                id={`${tableName}-${col.name}`}
                className={cn(
                  "!w-2 !h-2 !-right-1 !border !border-[#141210] transition-opacity",
                  col.isPrimaryKey ? "!bg-[#3ecf8e] opacity-90" : "!bg-stone-600 opacity-0 group-hover/row:opacity-100"
                )}
              />
            </div>
          );
        })}
      </div>

      {/* Table Footer */}
      <div className="px-3.5 py-1.5 bg-[#171412]/90 border-t border-[#292524] flex items-center justify-between text-[10px] text-stone-500 font-mono">
        <span className="flex items-center gap-1">
          <Sparkles className="w-2.5 h-2.5 text-[#3ecf8e]" /> Vector Introspected
        </span>
        <span>{columns.length} columns</span>
      </div>
    </div>
  );
};

export const TableNode = memo(TableNodeComponent);
