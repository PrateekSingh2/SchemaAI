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
  Sparkles,
  Database,
  ArrowRightLeft,
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
    (params: Connection) =>
      setEdges((eds) =>
        addEdge(
          { ...params, animated: true, style: { stroke: "#3ecf8e", strokeWidth: 2 } },
          eds
        )
      ),
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
          opacity: match ? 1 : 0.15,
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
    <div className="relative w-full h-[calc(100vh-4rem)] bg-[#121110] overflow-hidden select-none">
      {/* Top Floating Control Bar */}
      <div className="absolute top-4 left-4 z-20 flex flex-wrap items-center gap-3">
        {/* Search Bar */}
        <div className="relative">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Filter tables or columns..."
            className="w-64 pl-9 pr-3 py-2 rounded-2xl bg-[#1c1917]/90 backdrop-blur-xl border border-[#292524] text-xs text-stone-200 placeholder:text-stone-500 focus:outline-none focus:border-[#3ecf8e] focus:ring-1 focus:ring-[#3ecf8e] shadow-xl transition-all font-mono"
          />
          <Search className="w-4 h-4 text-stone-400 absolute left-3 top-2.5" />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              className="absolute right-2.5 top-2 text-[10px] text-stone-400 hover:text-stone-200 bg-stone-800 px-1.5 py-0.5 rounded-md"
            >
              Clear
            </button>
          )}
        </div>

        {/* Action Controls */}
        <div className="flex items-center space-x-2 bg-[#1c1917]/90 backdrop-blur-xl p-1 rounded-2xl border border-[#292524] shadow-xl">
          <button
            onClick={handleResetLayout}
            className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl text-xs font-medium text-stone-300 hover:text-stone-100 hover:bg-stone-800/60 transition-colors"
            title="Reset to default layout"
          >
            <RefreshCw className="w-3.5 h-3.5 text-[#3ecf8e]" />
            <span>Reset View</span>
          </button>

          <div className="h-4 w-[1px] bg-[#292524]" />

          <div className="flex items-center space-x-1.5 px-3 py-1.5 text-xs text-stone-400 font-mono">
            <Layers className="w-3.5 h-3.5 text-[#3ecf8e]" />
            <span>{nodes.length} Tables</span>
            <span className="text-stone-700">•</span>
            <ArrowRightLeft className="w-3.5 h-3.5 text-amber-400" />
            <span>{edges.length} Foreign Keys</span>
          </div>
        </div>
      </div>

      {/* Top Right Quick Database Info Pill */}
      <div className="absolute top-4 right-4 z-20 hidden md:flex items-center space-x-2 px-3.5 py-2 rounded-2xl bg-[#1c1917]/90 backdrop-blur-xl border border-[#292524] shadow-xl text-xs text-stone-300">
        <Database className="w-4 h-4 text-[#3ecf8e]" />
        <span className="font-semibold text-stone-100">production_core_db</span>
        <span className="text-stone-700">•</span>
        <span className="font-mono text-[11px] text-[#3ecf8e]">Live Schema Introspected</span>
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
          gap={28}
          size={1.4}
          color="#292524"
          className="bg-[#121110]"
        />
        <Controls
          position="bottom-left"
          className="!m-4 !border-[#292524] !bg-[#1c1917]/95 !shadow-2xl"
        />
        <MiniMap
          position="bottom-right"
          className="!m-4 !bg-[#1c1917]/95 !border-[#292524] !shadow-2xl"
          nodeColor="#292524"
          nodeStrokeColor="#3ecf8e"
          nodeStrokeWidth={2}
          maskColor="rgba(18, 17, 16, 0.8)"
          zoomable
          pannable
        />

        {/* Selected Table Inspector Panel */}
        {selectedTableInfo && (
          <Panel position="top-right" className="!mt-16 !mr-4 z-20">
            <div className="w-80 rounded-2xl supabase-modal border border-[#292524] shadow-2xl p-4 text-stone-200 animate-in fade-in slide-in-from-right-4 duration-200">
              <div className="flex items-center justify-between pb-3 border-b border-[#292524]">
                <div className="flex items-center space-x-2">
                  <Database className="w-4 h-4 text-[#3ecf8e]" />
                  <h4 className="font-bold text-sm font-mono text-stone-100">
                    {selectedTableInfo.tableName}
                  </h4>
                </div>
                <button
                  onClick={() => setSelectedTableInfo(null)}
                  className="text-xs text-stone-400 hover:text-stone-100"
                >
                  ✕
                </button>
              </div>

              <div className="py-3 space-y-2 text-xs">
                <div className="flex justify-between">
                  <span className="text-stone-400">Schema:</span>
                  <span className="font-mono text-[#3ecf8e]">{selectedTableInfo.schema}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-stone-400">Estimated Rows:</span>
                  <span className="font-mono text-stone-200">
                    {selectedTableInfo.rowCount.toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-stone-400">Total Columns:</span>
                  <span className="font-mono text-stone-200">
                    {selectedTableInfo.columns.length}
                  </span>
                </div>
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
              </div>

              <div className="pt-2 border-t border-[#292524] flex items-center justify-between text-[11px] text-stone-400">
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
