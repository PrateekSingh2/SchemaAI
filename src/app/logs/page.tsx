"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Topbar } from "@/components/Topbar";
import { LogsView } from "@/components/AuditLogs/LogsView";
import { initialAuditLogs, AuditLogEntry } from "@/lib/mockData";
import { useAuth } from "@/context/AuthContext";
import { Database, Loader2 } from "lucide-react";

export default function LogsPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [logs, setLogs] = useState<AuditLogEntry[]>(initialAuditLogs);

  useEffect(() => {
    if (!loading && !user) {
      try {
        const cached = localStorage.getItem("schemaai_user_session");
        if (!cached) {
          router.replace("/login");
        }
      } catch (e) {
        router.replace("/login");
      }
    }
  }, [user, loading, router]);

  if (loading || !user) {
    return (
      <div className="h-screen w-screen bg-[#0e0e11] flex items-center justify-center">
        <div className="flex flex-col items-center space-y-3">
          <div className="w-10 h-10 rounded-2xl bg-[#141418] border border-white/[0.1] flex items-center justify-center shadow-lg">
            <Database className="w-5 h-5 text-[#38bdf8] animate-pulse" />
          </div>
          <Loader2 className="w-4 h-4 animate-spin text-zinc-500" />
        </div>
      </div>
    );
  }

  const handleRefresh = () => {
    setLogs([...initialAuditLogs]);
  };

  return (
    <div className="h-screen w-screen overflow-hidden bg-[#090A0F] text-slate-100 flex flex-col font-sans select-none antialiased">
      <Topbar />
      <main className="flex-1 overflow-y-auto p-3 sm:p-6">
        <LogsView logs={logs} onRefresh={handleRefresh} />
      </main>
    </div>
  );
}
