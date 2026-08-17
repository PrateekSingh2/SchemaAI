"use client";

import React, { useState, useMemo, useCallback } from "react";
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
import { initialTables, initialEdges, TableNodeData } from "@/lib/mockData";
import {
  Search,
  RefreshCw,
  Layers,
  ZoomIn,
  Sparkles,
  Maximize2,
  Database,
  ArrowRightLeft,
  Info,
} from "lucide-react";

const nodeTypes = {
  tableNode: TableNode,
};

export const SchemaCanvas: React.FC = () => {
  const [nodes, setNodes, onNodesChange] = useNodesState<Node<TableNodeData>>(initialTables);
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>(initialEdges);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTableInfo, setSelectedTableInfo] = useState<TableNodeData | null>(null);

  const onConnect = useCallback(
    (params: Connection) => setEdges((eds) => addEdge({ ...params, animated: true, style: { stroke: "#38bdf8", strokeWidth: 2 } }, eds)),
    [setEdges]
  );

  // Filter nodes according to search term
  const filteredNodes = useMemo(() => {
    if (!searchQuery.trim()) {
      return nodes.map((n) => ({
        ...n,
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
          opacity: match ? 1 : 0.2,
          transition: "opacity 0.3s ease",
        },
      };
    });
  }, [nodes, searchQuery]);

  const handleResetLayout = () => {
    setNodes(initialTables);
    setEdges(initialEdges);
    setSearchQuery("");
  };

  const onNodeClick = (_: React.MouseEvent, node: Node) => {
    setSelectedTableInfo(node.data as TableNodeData);
  };

  const onPaneClick = () => {
    setSelectedTableInfo(null);
  };

  return (
    <div className="relative w-full h-[calc(100vh-4rem)] bg-[#070a11] overflow-hidden select-none">
      {/* Top Toolbar / Filter Header */}
      <div className="absolute top-4 left-4 z-20 flex flex-wrap items-center gap-3">
        {/* Search Bar */}
        <div className="relative">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Filter tables or columns..."
            className="w-64 pl-9 pr-3 py-2 rounded-xl bg-slate-900/90 backdrop-blur-md border border-slate-800 text-xs text-slate-200 placeholder:text-slate-500 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 shadow-xl transition-all"
          />
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              className="absolute right-2.5 top-2 text-[10px] text-slate-400 hover:text-white bg-slate-800 px-1.5 py-0.5 rounded"
            >
              Clear
            </button>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex items-center space-x-2 bg-slate-900/90 backdrop-blur-md p-1 rounded-xl border border-slate-800 shadow-xl">
          <button
            onClick={handleResetLayout}
            className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-slate-300 hover:text-white hover:bg-slate-800 transition-colors"
            title="Reset to default layout"
          >
            <RefreshCw className="w-3.5 h-3.5 text-cyan-400" />
            <span>Reset View</span>
          </button>

          <div className="h-4 w-[1px] bg-slate-850" />

          <div className="flex items-center space-x-1.5 px-3 py-1.5 text-xs text-slate-400">
            <Layers className="w-3.5 h-3.5 text-indigo-400" />
            <span>{nodes.length} Tables</span>
            <span className="text-slate-600">|</span>
            <ArrowRightLeft className="w-3.5 h-3.5 text-purple-400" />
            <span>{edges.length} Foreign Keys</span>
          </div>
        </div>
      </div>

      {/* Top Right Quick Database Info Pill */}
      <div className="absolute top-4 right-4 z-20 hidden md:flex items-center space-x-2 px-3.5 py-2 rounded-xl bg-slate-900/90 backdrop-blur-md border border-slate-800 shadow-xl text-xs text-slate-300">
        <Database className="w-4 h-4 text-cyan-400" />
        <span className="font-semibold text-white">production_core_db</span>
        <span className="text-slate-600">•</span>
        <span className="font-mono text-[11px] text-emerald-400">Schema Sync Active</span>
      </div>

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
          gap={24}
          size={1.5}
          color="#1e293b"
          className="bg-[#070a11]"
        />
        <Controls
          position="bottom-left"
          className="!m-4 !border-slate-800 !bg-slate-900/90 !shadow-2xl"
        />
        <MiniMap
          position="bottom-right"
          className="!m-4 !bg-[#0b0f19]/90 !border-slate-800 !shadow-2xl"
          nodeColor="#1e293b"
          nodeStrokeColor="#38bdf8"
          nodeStrokeWidth={2}
          maskColor="rgba(8, 12, 20, 0.75)"
          zoomable
          pannable
        />

        {/* Selected Table Inspector Panel */}
        {selectedTableInfo && (
          <Panel position="top-right" className="!mt-16 !mr-4 z-20">
            <div className="w-80 rounded-2xl glass-modal border border-slate-700/80 shadow-2xl p-4 text-slate-200 animate-in fade-in slide-in-from-right-4 duration-200">
              <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                <div className="flex items-center space-x-2">
                  <Database className="w-4 h-4 text-cyan-400" />
                  <h4 className="font-bold text-sm font-mono text-white">
                    {selectedTableInfo.tableName}
                  </h4>
                </div>
                <button
                  onClick={() => setSelectedTableInfo(null)}
                  className="text-xs text-slate-400 hover:text-white"
                >
                  ✕
                </button>
              </div>

              <div className="py-3 space-y-2 text-xs">
                <div className="flex justify-between">
                  <span className="text-slate-400">Schema:</span>
                  <span className="font-mono text-cyan-300">{selectedTableInfo.schema}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Estimated Rows:</span>
                  <span className="font-mono text-slate-200">
                    {selectedTableInfo.rowCount.toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Total Columns:</span>
                  <span className="font-mono text-slate-200">
                    {selectedTableInfo.columns.length}
                  </span>
                </div>
                <div className="pt-2">
                  <span className="text-[11px] font-semibold text-slate-400 block mb-1.5">
                    Columns Definition:
                  </span>
                  <div className="max-h-40 overflow-y-auto space-y-1 pr-1 font-mono text-[11px]">
                    {selectedTableInfo.columns.map((col) => (
                      <div
                        key={col.name}
                        className="flex items-center justify-between px-2 py-1 rounded bg-slate-900/80 border border-slate-800"
                      >
                        <span className={col.isPrimaryKey ? "text-cyan-400 font-semibold" : "text-slate-300"}>
                          {col.name}
                        </span>
                        <span className="text-slate-500 text-[10px]">{col.type}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="pt-2 border-t border-slate-800 flex items-center justify-between text-[11px] text-slate-400">
                <span className="flex items-center gap-1">
                  <Sparkles className="w-3 h-3 text-amber-400" /> Natural Language Target
                </span>
              </div>
            </div>
          </Panel>
        )}
      </ReactFlow>
    </div>
  );
};
