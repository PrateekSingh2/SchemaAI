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
  CheckCircle,
  Sparkles,
} from "lucide-react";
import { TableNodeData, ColumnDefinition } from "@/lib/mockData";
import { cn } from "@/lib/utils";

const getTypeIcon = (type: string) => {
  const lower = type.toLowerCase();
  if (lower.includes("uuid") || lower.includes("id")) return <KeyRound className="w-3 h-3 text-cyan-400" />;
  if (lower.includes("int") || lower.includes("numeric") || lower.includes("score")) return <Hash className="w-3 h-3 text-amber-400" />;
  if (lower.includes("time") || lower.includes("date")) return <Calendar className="w-3 h-3 text-indigo-400" />;
  if (lower.includes("bool")) return <ToggleLeft className="w-3 h-3 text-emerald-400" />;
  return <Type className="w-3 h-3 text-slate-400" />;
};

const TableNodeComponent: React.FC<NodeProps> = ({ data, selected }) => {
  const tableData = data as unknown as TableNodeData;
  const { tableName, schema = "public", rowCount, columns = [], description } = tableData;

  return (
    <div
      className={cn(
        "w-72 rounded-xl bg-[#0b0f19]/95 backdrop-blur-md border transition-all duration-300 shadow-2xl text-slate-200 overflow-hidden font-sans group",
        selected
          ? "border-cyan-400 shadow-[0_0_25px_rgba(56,189,248,0.25)] ring-1 ring-cyan-400/50"
          : "border-slate-800 hover:border-slate-700 hover:shadow-cyan-950/20"
      )}
    >
      {/* Table Header */}
      <div className="p-3.5 bg-gradient-to-r from-slate-900 via-slate-900 to-slate-850 border-b border-slate-800 flex items-center justify-between">
        <div className="flex items-center space-x-2.5 min-w-0">
          <div className="p-1.5 rounded-lg bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 shrink-0">
            <Table2 className="w-4 h-4" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center space-x-1.5">
              <span className="text-xs font-mono text-slate-400">{schema}.</span>
              <h3 className="font-bold text-sm text-white tracking-tight truncate font-mono">
                {tableName}
              </h3>
            </div>
            {description && (
              <p className="text-[10px] text-slate-400 truncate max-w-[170px]" title={description}>
                {description}
              </p>
            )}
          </div>
        </div>

        {/* Row Count Badge */}
        <div className="flex flex-col items-end">
          <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700/60 shrink-0">
            {rowCount.toLocaleString()} rows
          </span>
        </div>
      </div>

      {/* Target/Source Generic Handles for General Node Connections */}
      <Handle
        type="target"
        position={Position.Left}
        id={`${tableName}-target`}
        className="!w-2.5 !h-2.5 !bg-cyan-500 !border-2 !border-slate-950 !-left-1.5"
      />
      <Handle
        type="source"
        position={Position.Right}
        id={`${tableName}-source`}
        className="!w-2.5 !h-2.5 !bg-cyan-500 !border-2 !border-slate-950 !-right-1.5"
      />

      {/* Columns List */}
      <div className="divide-y divide-slate-800/60 bg-slate-950/60">
        {columns.map((col: ColumnDefinition, idx: number) => {
          return (
            <div
              key={col.name}
              className={cn(
                "relative flex items-center justify-between px-3.5 py-2 text-xs hover:bg-slate-800/40 transition-colors group/row",
                col.isPrimaryKey && "bg-cyan-950/15"
              )}
            >
              {/* Row Target Handle for Specific FK links */}
              <Handle
                type="target"
                position={Position.Left}
                id={`${tableName}-${col.name}`}
                className={cn(
                  "!w-2 !h-2 !-left-1 !border !border-slate-900 transition-opacity",
                  col.isForeignKey ? "!bg-purple-400 opacity-90" : "!bg-slate-600 opacity-0 group-hover/row:opacity-100"
                )}
              />

              {/* Column Name & Key Indicators */}
              <div className="flex items-center space-x-2 min-w-0 pr-2">
                <span className="shrink-0">{getTypeIcon(col.type)}</span>
                <span
                  className={cn(
                    "font-mono truncate font-medium",
                    col.isPrimaryKey
                      ? "text-cyan-300 font-semibold"
                      : col.isForeignKey
                      ? "text-purple-300 font-medium"
                      : "text-slate-300"
                  )}
                >
                  {col.name}
                </span>

                {col.isPrimaryKey && (
                  <span
                    className="flex items-center text-[9px] font-mono font-bold uppercase px-1 rounded bg-amber-500/20 text-amber-300 border border-amber-500/40"
                    title="Primary Key (Unique Index)"
                  >
                    PK
                  </span>
                )}

                {col.isForeignKey && (
                  <span
                    className="flex items-center text-[9px] font-mono font-semibold uppercase px-1 rounded bg-purple-500/20 text-purple-300 border border-purple-500/40 gap-0.5"
                    title={`Foreign Key -> ${col.foreignKeyRef}`}
                  >
                    <Link2 className="w-2.5 h-2.5" /> FK
                  </span>
                )}
              </div>

              {/* Column Type & Nullable Status */}
              <div className="flex items-center space-x-1.5 shrink-0">
                <span className="font-mono text-[10px] text-slate-400 bg-slate-900 px-1.5 py-0.5 rounded border border-slate-800">
                  {col.type}
                </span>
                {col.isNullable && (
                  <span
                    className="text-[9px] text-slate-500 font-mono"
                    title="Nullable column"
                  >
                    null
                  </span>
                )}
              </div>

              {/* Row Source Handle for Specific FK links */}
              <Handle
                type="source"
                position={Position.Right}
                id={`${tableName}-${col.name}`}
                className={cn(
                  "!w-2 !h-2 !-right-1 !border !border-slate-900 transition-opacity",
                  col.isPrimaryKey ? "!bg-cyan-400 opacity-90" : "!bg-slate-600 opacity-0 group-hover/row:opacity-100"
                )}
              />
            </div>
          );
        })}
      </div>

      {/* Table Footer */}
      <div className="px-3.5 py-1.5 bg-slate-900/40 border-t border-slate-800/80 flex items-center justify-between text-[10px] text-slate-500">
        <span className="flex items-center gap-1">
          <Sparkles className="w-2.5 h-2.5 text-cyan-400" /> Vector Indexed
        </span>
        <span>{columns.length} columns</span>
      </div>
    </div>
  );
};

export const TableNode = memo(TableNodeComponent);
