"use client";

import React, { useState, useEffect, useMemo, useCallback } from "react";
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  useNodesState,
  useEdgesState,
  addEdge,
  Connection,
  Edge,
  Node,
  BackgroundVariant,
  Panel,
} from "@xyflow/react";
import { TableNode } from "./TableNode";
import { DocumentNode } from "./DocumentNode";
import { TableNodeData } from "@/lib/mockData";
import { getIntrospectedSchema } from "@/lib/schemaCatalog";
import { cn } from "@/lib/utils";
import {
  Search,
  RefreshCw,
  Layers,
  Sparkles,
  Database,
  ArrowRightLeft,
  Unplug,
  Zap,
  FileJson,
  Code2,
  Copy,
  Check,
} from "lucide-react";

const nodeTypes = {
  tableNode: TableNode,
  documentNode: DocumentNode,
};

export const SchemaCanvas: React.FC = () => {
  const [nodes, setNodes, onNodesChange] = useNodesState<Node<TableNodeData>>([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTableInfo, setSelectedTableInfo] = useState<TableNodeData | null>(null);
  const [activeDbName, setActiveDbName] = useState<string>("Not Connected");
  const [isDbConnected, setIsDbConnected] = useState<boolean>(false);
  const [currentDbType, setCurrentDbType] = useState<string>("PostgreSQL");

  // Synchronize with database connection status and load introspected schema dynamically
  useEffect(() => {
    const updateSchemaState = () => {
      if (typeof window !== "undefined") {
        const connected = localStorage.getItem("schemaai_db_connected") === "true";
        setIsDbConnected(connected);

        if (!connected) {
          // As soon as database is disconnected, IMMEDIATELY clear the schema explorer!
          localStorage.removeItem("schemaai_introspected_schema");
          setNodes([]);
          setEdges([]);
          setSelectedTableInfo(null);
          setActiveDbName("Not Connected");
        } else {
          // Database is connected: introspect all tables for current engine
          try {
            const cfg = localStorage.getItem("schemaai_db_config");
            let type = "PostgreSQL";
            let name = "Active Database";
            if (cfg) {
              const parsed = JSON.parse(cfg);
              if (parsed && typeof parsed === "object") {
                type = parsed.dbType || "PostgreSQL";
                name = (parsed.databaseName || parsed.sqlitePath) || `${type} Database`;
              }
            }
            setCurrentDbType(type);
            setActiveDbName(name);

            // Read live introspected schema strictly from connected database
            let customTables: TableNodeData[] = [];
            let customFks: { from: string; to: string; label: string }[] = [];
            const savedSchema = localStorage.getItem("schemaai_introspected_schema");
            if (savedSchema) {
              try {
                const parsed = JSON.parse(savedSchema);
                if (parsed && Array.isArray(parsed.tables)) {
                  customTables = parsed.tables;
                  customFks = parsed.fks || [];
                }
              } catch (_) {}
            }

            const result = getIntrospectedSchema(type, customTables, customFks);
            console.log(
              `[SchemaCanvas] dbType=${type} customTables=${customTables.length} → nodes=${result.nodes.length} edges=${result.edges.length}`,
              customTables.length > 0 ? `first table isNoSql=${customTables[0]?.isNoSql} type=${result.nodes[0]?.type}` : "(empty)"
            );
            setNodes(result.nodes);
            setEdges(result.edges);
          } catch (e) {
            console.error("Error loading introspected schema:", e);
          }
        }
      }
    };

    updateSchemaState();

    window.addEventListener("schemaai_db_changed", updateSchemaState);
    window.addEventListener("storage", updateSchemaState);
    return () => {
      window.removeEventListener("schemaai_db_changed", updateSchemaState);
      window.removeEventListener("storage", updateSchemaState);
    };
  }, [setNodes, setEdges]);

  const onConnect = useCallback(
    (params: Connection) =>
      setEdges((eds) =>
        addEdge(
          { ...params, animated: true, style: { stroke: "#3ecf8e", strokeWidth: 2 } },
          eds
        )
      ),
    [setEdges]
  );

  // Filter nodes based on search query
  const filteredNodes = useMemo(() => {
    if (!searchQuery.trim()) {
      return nodes.map((node) => ({
        ...node,
        style: { opacity: 1 },
      }));
    }
    const q = searchQuery.toLowerCase();
    return nodes.map((node) => {
      const match =
        node.data.tableName.toLowerCase().includes(q) ||
        node.data.columns.some((c) => c.name.toLowerCase().includes(q));
      return {
        ...node,
        style: {
          opacity: match ? 1 : 0.15,
          transition: "opacity 0.3s ease",
        },
      };
    });
  }, [nodes, searchQuery]);

  const handleResetLayout = () => {
    if (isDbConnected) {
      let customTables: TableNodeData[] = [];
      let customFks: { from: string; to: string; label: string }[] = [];
      if (typeof window !== "undefined") {
        const savedSchema = localStorage.getItem("schemaai_introspected_schema");
        if (savedSchema) {
          try {
            const parsed = JSON.parse(savedSchema);
            if (parsed && Array.isArray(parsed.tables)) {
              customTables = parsed.tables;
              customFks = parsed.fks || [];
            }
          } catch (_) {}
        }
      }
      const result = getIntrospectedSchema(currentDbType, customTables, customFks);
      setNodes(result.nodes);
      setEdges(result.edges);
    } else {
      setNodes([]);
      setEdges([]);
    }
    setSearchQuery("");
  };

  const onNodeClick = (_: React.MouseEvent, node: Node) => {
    setSelectedTableInfo(node.data as TableNodeData);
  };

  const onPaneClick = () => {
    setSelectedTableInfo(null);
  };

  return (
    <div className="relative w-full h-[calc(100dvh-3.5rem)] sm:h-[calc(100vh-4rem)] bg-[#121110] overflow-hidden select-none">
      {/* Top Floating Control Bar */}
      <div className="absolute top-3 left-3 sm:top-4 sm:left-4 z-20 flex flex-wrap items-center gap-2 sm:gap-3 max-w-[calc(100vw-1.5rem)]">
        {/* Search Bar */}
        <div className="relative">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Filter tables..."
            className="w-48 sm:w-64 pl-9 pr-3 py-1.5 sm:py-2 rounded-2xl bg-[#1c1917]/90 backdrop-blur-xl border border-[#292524] text-xs text-stone-200 placeholder:text-stone-500 focus:outline-none focus:border-[#3ecf8e] focus:ring-1 focus:ring-[#3ecf8e] shadow-xl transition-all font-mono"
          />
          <Search className="w-3.5 h-3.5 text-stone-400 absolute left-3 top-2.5 sm:top-3" />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              className="absolute right-2.5 top-1.5 sm:top-2 text-[10px] text-stone-400 hover:text-stone-200 bg-stone-800 px-1.5 py-0.5 rounded-md"
            >
              Clear
            </button>
          )}
        </div>

        {/* Action Controls */}
        <div className="flex items-center space-x-1.5 sm:space-x-2 bg-[#1c1917]/90 backdrop-blur-xl p-1 rounded-2xl border border-[#292524] shadow-xl">
          <button
            onClick={handleResetLayout}
            className="flex items-center space-x-1 sm:space-x-1.5 px-2.5 sm:px-3 py-1.5 rounded-xl text-xs font-medium text-stone-300 hover:text-stone-100 hover:bg-stone-800/60 transition-colors"
            title="Reset to default layout"
          >
            <RefreshCw className="w-3.5 h-3.5 text-[#3ecf8e]" />
            <span className="hidden sm:inline">Reset View</span>
            <span className="sm:hidden text-[10px]">Reset</span>
          </button>

          <div className="h-4 w-[1px] bg-[#292524]" />

          <div className="flex items-center space-x-1.5 px-2 sm:px-3 py-1.5 text-xs text-stone-400 font-mono">
            {currentDbType === "MongoDB" ? (
              <>
                <FileJson className="w-3.5 h-3.5 text-emerald-400" />
                <span>{nodes.length} <span className="hidden sm:inline">Collections</span></span>
                <span className="text-stone-700">•</span>
                <ArrowRightLeft className="w-3.5 h-3.5 text-cyan-400" />
                <span>{edges.length} <span className="hidden sm:inline">References</span></span>
              </>
            ) : (
              <>
                <Layers className="w-3.5 h-3.5 text-[#3ecf8e]" />
                <span>{nodes.length} <span className="hidden sm:inline">Tables</span></span>
                <span className="text-stone-700">•</span>
                <ArrowRightLeft className="w-3.5 h-3.5 text-amber-400" />
                <span>{edges.length} <span className="hidden sm:inline">FKs</span></span>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Top Right Quick Database Info Pill */}
      <div className="absolute top-4 right-4 z-20 hidden md:flex items-center space-x-2 px-3.5 py-2 rounded-2xl bg-[#1c1917]/90 backdrop-blur-xl border border-[#292524] shadow-xl text-xs text-stone-300">
        {currentDbType === "MongoDB" ? (
          <FileJson className="w-4 h-4 text-emerald-400" />
        ) : (
          <Database className="w-4 h-4 text-[#3ecf8e]" />
        )}
        <span className="font-semibold text-stone-100">{activeDbName}</span>
        <span className="text-stone-700">•</span>
        <span className={cn("font-mono text-[11px]", currentDbType === "MongoDB" ? "text-emerald-400" : "text-[#3ecf8e]")}>
          {isDbConnected
            ? currentDbType === "MongoDB"
              ? "Live BSON Schema Sampled"
              : "Live Schema Introspected"
            : "Disconnected"}
        </span>
      </div>

      {/* Disconnected Empty State Overlay */}
      {!isDbConnected && (
        <div className="absolute inset-0 z-30 flex flex-col items-center justify-center p-6 bg-[#121110]/95 backdrop-blur-sm text-center select-none">
          <div className="w-16 h-16 rounded-3xl bg-[#1c1917] border border-[#292524] flex items-center justify-center mb-4 shadow-xl">
            <Unplug className="w-8 h-8 text-amber-400 animate-pulse" />
          </div>
          <h3 className="text-lg font-bold text-stone-100 tracking-tight mb-2">
            No Database Connected
          </h3>
          <p className="text-xs sm:text-sm text-stone-400 max-w-md mb-6 leading-relaxed">
            The database connection is disconnected. Connect a database to introspect all tables, column schemas, and relational foreign keys in this canvas.
          </p>
          <button
            type="button"
            onClick={() => window.dispatchEvent(new CustomEvent("schemaai_open_settings"))}
            className="flex items-center space-x-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#38bdf8] to-[#0284c7] hover:from-[#60a5fa] hover:to-[#2563eb] text-slate-950 font-bold text-xs shadow-lg shadow-sky-500/20 transition-all cursor-pointer"
          >
            <Zap className="w-4 h-4 text-slate-950" />
            <span>Connect Database</span>
          </button>
        </div>
      )}

      {/* Connected but 0 Tables Found in User Database */}
      {isDbConnected && nodes.length === 0 && (
        <div className="absolute inset-0 z-10 flex flex-col items-center justify-center p-6 text-center select-none pointer-events-none">
          <div className="w-14 h-14 rounded-2xl bg-[#1c1917] border border-[#292524] flex items-center justify-center mb-3 shadow-xl">
            {currentDbType === "MongoDB" ? (
              <FileJson className="w-7 h-7 text-stone-500" />
            ) : (
              <Layers className="w-7 h-7 text-stone-500" />
            )}
          </div>
          <h3 className="text-base font-bold text-stone-200 mb-1">
            0 {currentDbType === "MongoDB" ? "Collections" : "Tables"} Found in {activeDbName}
          </h3>
          <p className="text-xs text-stone-400 max-w-sm">
            Connected successfully to your database, but no {currentDbType === "MongoDB" ? "collections" : "public tables"} exist yet.
          </p>
        </div>
      )}

      {/* React Flow Graph Surface */}
      <ReactFlow
        nodes={filteredNodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        onNodeClick={onNodeClick}
        onPaneClick={onPaneClick}
        nodeTypes={nodeTypes}
        fitView
        fitViewOptions={{ padding: 0.2 }}
        minZoom={0.2}
        maxZoom={1.8}
        proOptions={{ hideAttribution: true }}
      >
        <Background
          variant={BackgroundVariant.Dots}
          gap={28}
          size={1.4}
          color="#292524"
          className="bg-[#121110]"
        />
        <Controls
          position="bottom-left"
          className="!m-2 sm:!m-4 !border-[#292524] !bg-[#1c1917]/95 !shadow-2xl"
        />
        <MiniMap
          position="bottom-right"
          className="hidden sm:block !m-4 !bg-[#1c1917]/95 !border-[#292524] !shadow-2xl"
          nodeColor="#292524"
          nodeStrokeColor="#3ecf8e"
          nodeStrokeWidth={2}
          maskColor="rgba(18, 17, 16, 0.8)"
          zoomable
          pannable
        />

        {/* Selected Inspector Panel */}
        {selectedTableInfo && (
          <Panel position="top-right" className="!mt-14 sm:!mt-16 !mr-2 sm:!mr-4 z-20 max-w-[calc(100vw-1rem)]">
            <div className="w-80 sm:w-96 rounded-2xl supabase-modal border border-[#292524] shadow-2xl p-3.5 sm:p-4 text-stone-200 animate-in fade-in slide-in-from-right-4 duration-200">
              <div className="flex items-center justify-between pb-3 border-b border-[#292524]">
                <div className="flex items-center space-x-2 min-w-0">
                  {selectedTableInfo.isNoSql ? (
                    <FileJson className="w-4 h-4 text-emerald-400 shrink-0" />
                  ) : (
                    <Database className="w-4 h-4 text-[#3ecf8e] shrink-0" />
                  )}
                  <h4 className="font-bold text-sm font-mono text-stone-100 truncate">
                    {selectedTableInfo.tableName}
                  </h4>
                  {selectedTableInfo.isNoSql && (
                    <span className="text-[10px] font-mono text-emerald-400 bg-emerald-950/60 border border-emerald-800/40 px-1.5 py-0.2 rounded font-semibold uppercase">
                      NoSQL
                    </span>
                  )}
                </div>
                <button
                  onClick={() => setSelectedTableInfo(null)}
                  className="text-xs text-stone-400 hover:text-stone-100 p-1 rounded-lg bg-stone-800/50 cursor-pointer"
                >
                  ✕
                </button>
              </div>

              <div className="py-3 space-y-2 text-xs">
                <div className="flex justify-between">
                  <span className="text-stone-400">Database / Namespace:</span>
                  <span className="font-mono text-emerald-400">{selectedTableInfo.schema}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-stone-400">
                    {selectedTableInfo.isNoSql ? "Estimated Documents:" : "Estimated Rows:"}
                  </span>
                  <span className="font-mono text-stone-200">
                    {selectedTableInfo.rowCount.toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-stone-400">
                    {selectedTableInfo.isNoSql ? "Top-level Fields:" : "Total Columns:"}
                  </span>
                  <span className="font-mono text-stone-200">
                    {selectedTableInfo.columns.length}
                  </span>
                </div>

                {/* If NoSQL: Display Real JSON Structure Sample */}
                {selectedTableInfo.isNoSql ? (
                  <div className="pt-2">
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-[11px] font-semibold text-emerald-400 flex items-center gap-1">
                        <Code2 className="w-3 h-3 text-emerald-400" /> JSON Document Schema
                      </span>
                      <button
                        type="button"
                        onClick={() => {
                          const str = JSON.stringify(
                            selectedTableInfo.sampleDocument || selectedTableInfo.columns,
                            null,
                            2
                          );
                          navigator?.clipboard?.writeText(str);
                        }}
                        className="text-[10px] font-mono text-stone-400 hover:text-stone-200 bg-stone-800 px-1.5 py-0.5 rounded cursor-pointer flex items-center gap-1"
                        title="Copy JSON structure"
                      >
                        <Copy className="w-2.5 h-2.5" /> Copy
                      </button>
                    </div>
                    <div className="max-h-52 overflow-y-auto rounded-xl bg-[#100f0e] border border-[#262320] p-2.5 font-mono text-[11px] text-emerald-300 leading-relaxed shadow-inner">
                      <pre className="whitespace-pre">
                        {JSON.stringify(
                          selectedTableInfo.sampleDocument ||
                            Object.fromEntries(
                              selectedTableInfo.columns.map((c) => [c.name, c.type])
                            ),
                          null,
                          2
                        )}
                      </pre>
                    </div>
                  </div>
                ) : (
                  <div className="pt-2">
                    <span className="text-[11px] font-semibold text-stone-400 block mb-1.5">
                      Columns Definition:
                    </span>
                    <div className="max-h-40 overflow-y-auto space-y-1 pr-1 font-mono text-[11px]">
                      {selectedTableInfo.columns.map((col) => (
                        <div
                          key={col.name}
                          className="flex items-center justify-between px-2.5 py-1 rounded-xl bg-[#141210] border border-[#292524]"
                        >
                          <span className={col.isPrimaryKey ? "text-[#3ecf8e] font-semibold" : "text-stone-300"}>
                            {col.name}
                          </span>
                          <span className="text-stone-500 text-[10px]">{col.type}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <div className="pt-2 border-t border-[#292524] flex items-center justify-between text-[11px] text-stone-400">
                <span className="flex items-center gap-1">
                  <Sparkles className="w-3 h-3 text-amber-400" /> Natural Language Target
                </span>
                <span className="font-mono text-[10px] text-stone-500">
                  {selectedTableInfo.isNoSql ? "Document Model" : "Relational Model"}
                </span>
              </div>
            </div>
          </Panel>
        )}
      </ReactFlow>
    </div>
  );
};
