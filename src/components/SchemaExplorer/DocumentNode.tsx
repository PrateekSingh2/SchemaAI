"use client";

import React, { memo, useState } from "react";
import { Handle, Position, NodeProps } from "@xyflow/react";
import {
  FileJson,
  KeyRound,
  Link2,
  Braces,
  ListTree,
  Calendar,
  ToggleLeft,
  Sparkles,
  Hash,
  Type,
  Copy,
  Check,
  Code2,
} from "lucide-react";
import { TableNodeData, ColumnDefinition } from "@/lib/mockData";
import { cn } from "@/lib/utils";

const getNoSqlTypeIcon = (type: string) => {
  const lower = type.toLowerCase();
  if (lower.includes("objectid") || lower.includes("_id"))
    return <KeyRound className="w-3 h-3 text-emerald-400" />;
  if (lower.includes("object") || lower.includes("sub-document"))
    return <Braces className="w-3 h-3 text-cyan-400" />;
  if (lower.includes("array"))
    return <ListTree className="w-3 h-3 text-sky-400" />;
  if (lower.includes("int") || lower.includes("double") || lower.includes("number"))
    return <Hash className="w-3 h-3 text-amber-400" />;
  if (lower.includes("date") || lower.includes("time"))
    return <Calendar className="w-3 h-3 text-stone-400" />;
  if (lower.includes("bool"))
    return <ToggleLeft className="w-3 h-3 text-emerald-400" />;
  return <Type className="w-3 h-3 text-stone-400" />;
};

const DocumentNodeComponent: React.FC<NodeProps> = ({ data, selected }) => {
  const tableData = data as unknown as TableNodeData;
  const {
    tableName,
    schema = "mongodb",
    rowCount,
    columns = [],
    description,
    sampleDocument,
  } = tableData;

  const [activeTab, setActiveTab] = useState<"json" | "fields">("json");
  const [copied, setCopied] = useState(false);

  // Generate fallback sample document from columns if not provided
  const displayDocument = React.useMemo(() => {
    if (sampleDocument && Object.keys(sampleDocument).length > 0) {
      return sampleDocument;
    }
    const sample: Record<string, any> = {
      _id: { $oid: "65e8a1f4b89a01c3d4e5f601" },
    };
    columns.forEach((col) => {
      if (col.name === "_id") return;
      const lower = col.type.toLowerCase();
      if (lower.includes("int") || lower.includes("double") || lower.includes("number")) {
        sample[col.name] = 42;
      } else if (lower.includes("bool")) {
        sample[col.name] = true;
      } else if (lower.includes("date")) {
        sample[col.name] = { $date: new Date().toISOString() };
      } else if (lower.includes("array")) {
        sample[col.name] = ["sample_item"];
      } else if (lower.includes("object")) {
        sample[col.name] = { active: true };
      } else if (col.isForeignKey) {
        sample[col.name] = { $oid: "65e8a1f4b89a01c3d4e5f699" };
      } else {
        sample[col.name] = `sample_${col.name}`;
      }
    });
    return sample;
  }, [sampleDocument, columns]);

  const jsonString = React.useMemo(() => {
    try {
      return JSON.stringify(displayDocument, null, 2);
    } catch (_) {
      return "{}";
    }
  }, [displayDocument]);

  const handleCopyJson = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (typeof navigator !== "undefined" && navigator.clipboard) {
      navigator.clipboard.writeText(jsonString);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    }
  };

  return (
    <div
      className={cn(
        "w-80 rounded-2xl bg-[#181716]/95 backdrop-blur-2xl border transition-all duration-300 shadow-2xl text-stone-200 overflow-hidden font-sans group select-none",
        selected
          ? "border-emerald-400 shadow-[0_0_32px_rgba(52,211,153,0.3)] ring-1 ring-emerald-400/50"
          : "border-[#2e2a27] hover:border-emerald-500/50 hover:shadow-black/60"
      )}
    >
      {/* Node Header */}
      <div className="p-3.5 bg-gradient-to-r from-[#171412] via-[#1a1715] to-[#141d18] border-b border-[#292524] flex items-center justify-between">
        <div className="flex items-center space-x-2.5 min-w-0">
          <div className="p-1.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 shrink-0 shadow-sm">
            <FileJson className="w-4 h-4" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center space-x-1.5">
              <span className="text-[10px] font-mono text-emerald-400 px-1.5 py-0.2 rounded bg-emerald-950/60 border border-emerald-800/40 uppercase font-semibold">
                NoSQL
              </span>
              <h3 className="font-bold text-sm text-stone-100 tracking-tight truncate font-mono">
                {tableName}
              </h3>
            </div>
            {description ? (
              <p className="text-[10px] text-stone-400 truncate max-w-[170px]" title={description}>
                {description}
              </p>
            ) : (
              <p className="text-[10px] text-stone-500 truncate max-w-[170px] font-mono">
                {schema} collection
              </p>
            )}
          </div>
        </div>

        {/* Document Count Badge */}
        <div className="flex flex-col items-end">
          <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-[#121110] text-emerald-400 border border-emerald-500/20 shrink-0 shadow-inner font-medium">
            {rowCount.toLocaleString()} docs
          </span>
        </div>
      </div>

      {/* Mode Navigation Toggle: Schema Fields vs JSON Structure */}
      <div className="px-3 pt-2 pb-1.5 bg-[#141210] border-b border-[#292524] flex items-center justify-between">
        <div className="flex items-center space-x-1 p-0.5 rounded-lg bg-[#1c1917] border border-[#2a2624]">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setActiveTab("fields");
            }}
            className={cn(
              "px-2.5 py-1 rounded-md text-[11px] font-medium transition-all cursor-pointer flex items-center gap-1",
              activeTab === "fields"
                ? "bg-emerald-500/20 text-emerald-300 font-semibold shadow-sm"
                : "text-stone-400 hover:text-stone-200"
            )}
          >
            <Braces className="w-3 h-3" />
            <span>Fields ({columns.length})</span>
          </button>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setActiveTab("json");
            }}
            className={cn(
              "px-2.5 py-1 rounded-md text-[11px] font-medium transition-all cursor-pointer flex items-center gap-1",
              activeTab === "json"
                ? "bg-cyan-500/20 text-cyan-300 font-semibold shadow-sm"
                : "text-stone-400 hover:text-stone-200"
            )}
          >
            <Code2 className="w-3 h-3" />
            <span>JSON View</span>
          </button>
        </div>

        {activeTab === "json" && (
          <button
            type="button"
            onClick={handleCopyJson}
            className="flex items-center space-x-1 px-2 py-0.5 rounded bg-stone-800/80 hover:bg-stone-700 text-[10px] font-mono text-stone-300 hover:text-stone-100 transition-colors border border-stone-700/60 cursor-pointer"
            title="Copy Sample JSON"
          >
            {copied ? (
              <>
                <Check className="w-3 h-3 text-emerald-400" />
                <span className="text-emerald-400">Copied</span>
              </>
            ) : (
              <>
                <Copy className="w-3 h-3 text-stone-400" />
                <span>Copy</span>
              </>
            )}
          </button>
        )}
      </div>

      {/* Target/Source Generic Handles */}
      <Handle
        type="target"
        position={Position.Left}
        id={`${tableName}-target`}
        className="!w-2.5 !h-2.5 !bg-emerald-400 !border-2 !border-[#1c1917] !-left-1.5"
      />
      <Handle
        type="source"
        position={Position.Right}
        id={`${tableName}-source`}
        className="!w-2.5 !h-2.5 !bg-emerald-400 !border-2 !border-[#1c1917] !-right-1.5"
      />

      {/* TAB CONTENT: FIELDS VIEW */}
      {activeTab === "fields" && (
        <div className="divide-y divide-[#292524]/60 bg-[#151311]/70 max-h-60 overflow-y-auto pr-0.5">
          {columns.map((col: ColumnDefinition) => {
            return (
              <div
                key={col.name}
                className={cn(
                  "relative flex items-center justify-between px-3.5 py-1.5 text-xs hover:bg-[#201d1a]/80 transition-colors group/row",
                  col.isPrimaryKey && "bg-emerald-500/[0.04]"
                )}
              >
                {/* Row Target Handle */}
                <Handle
                  type="target"
                  position={Position.Left}
                  id={`${tableName}-${col.name}`}
                  className={cn(
                    "!w-2 !h-2 !-left-1 !border !border-[#141210] transition-opacity",
                    col.isForeignKey
                      ? "!bg-purple-400 opacity-90"
                      : "!bg-stone-600 opacity-0 group-hover/row:opacity-100"
                  )}
                />

                {/* Field Name & BSON Indicators */}
                <div className="flex items-center space-x-2 min-w-0 pr-2">
                  <span className="shrink-0">{getNoSqlTypeIcon(col.type)}</span>
                  <span
                    className={cn(
                      "font-mono truncate font-medium",
                      col.isPrimaryKey
                        ? "text-emerald-400 font-semibold"
                        : col.isForeignKey
                        ? "text-purple-300 font-medium"
                        : "text-stone-300"
                    )}
                  >
                    {col.name}
                  </span>

                  {col.isPrimaryKey && (
                    <span
                      className="flex items-center text-[9px] font-mono font-bold uppercase px-1.5 py-0.2 rounded-full bg-emerald-500/15 text-emerald-300 border border-emerald-500/30"
                      title="Primary Key / BSON ObjectId"
                    >
                      PK
                    </span>
                  )}

                  {col.isForeignKey && (
                    <span
                      className="flex items-center text-[9px] font-mono font-semibold uppercase px-1.5 py-0.2 rounded-full bg-purple-500/15 text-purple-300 border border-purple-500/30 gap-0.5"
                      title={`Ref -> ${col.foreignKeyRef}`}
                    >
                      <Link2 className="w-2.5 h-2.5" /> REF
                    </span>
                  )}
                </div>

                {/* BSON Field Type */}
                <div className="flex items-center space-x-1.5 shrink-0">
                  <span
                    className={cn(
                      "font-mono text-[10px] px-1.5 py-0.5 rounded-lg border",
                      col.type === "ObjectId"
                        ? "bg-emerald-950/40 text-emerald-300 border-emerald-800/40"
                        : col.type === "Array" || col.type.startsWith("Array")
                        ? "bg-sky-950/40 text-sky-300 border-sky-800/40"
                        : col.type === "Object"
                        ? "bg-cyan-950/40 text-cyan-300 border-cyan-800/40"
                        : "bg-[#1c1917] text-stone-400 border-[#292524]"
                    )}
                  >
                    {col.type}
                  </span>
                </div>

                {/* Row Source Handle */}
                <Handle
                  type="source"
                  position={Position.Right}
                  id={`${tableName}-${col.name}`}
                  className={cn(
                    "!w-2 !h-2 !-right-1 !border !border-[#141210] transition-opacity",
                    col.isPrimaryKey
                      ? "!bg-emerald-400 opacity-90"
                      : "!bg-stone-600 opacity-0 group-hover/row:opacity-100"
                  )}
                />
              </div>
            );
          })}
        </div>
      )}

      {/* TAB CONTENT: JSON PREVIEW VIEW */}
      {activeTab === "json" && (
        <div className="bg-[#0f0e0d] p-3 max-h-64 overflow-y-auto font-mono text-[11px] leading-relaxed border-t border-[#221f1d] selection:bg-emerald-500/30">
          <div className="flex items-center justify-between pb-1.5 mb-1.5 border-b border-[#1c1a18] text-[10px] text-stone-500">
            <span className="text-emerald-400 font-semibold flex items-center gap-1">
              <Code2 className="w-3 h-3" /> BSON Document Structure
            </span>
            <span className="text-stone-400 font-mono text-[9.5px]">JSON / Extended BSON</span>
          </div>
          <pre className="text-emerald-300 font-mono text-[11px] leading-snug whitespace-pre overflow-x-auto">
            {jsonString}
          </pre>
        </div>
      )}

      {/* Card Footer */}
      <div className="px-3.5 py-1.5 bg-[#171412]/90 border-t border-[#292524] flex items-center justify-between text-[10px] text-stone-500 font-mono">
        <span className="flex items-center gap-1 text-emerald-400/90 font-medium">
          <Sparkles className="w-2.5 h-2.5 text-emerald-400" /> BSON Schema Sampled
        </span>
        <span className="text-stone-400">{columns.length} fields</span>
      </div>
    </div>
  );
};

export const DocumentNode = memo(DocumentNodeComponent);
