"use client";

import React, { useState } from "react";
import { Topbar } from "@/components/Topbar";
import { LogsView } from "@/components/AuditLogs/LogsView";
import { initialAuditLogs, AuditLogEntry } from "@/lib/mockData";

export default function LogsPage() {
  const [logs, setLogs] = useState<AuditLogEntry[]>(initialAuditLogs);

  const handleRefresh = () => {
    setLogs([...initialAuditLogs]);
  };

  return (
    <div className="h-screen w-screen overflow-hidden bg-[#121110] text-stone-100 flex flex-col font-sans select-none antialiased">
      <Topbar />
      <main className="flex-1 overflow-y-auto p-4 sm:p-6">
        <LogsView logs={logs} onRefresh={handleRefresh} />
      </main>
    </div>
  );
}
