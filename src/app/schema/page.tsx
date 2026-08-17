"use client";

import React from "react";
import { Topbar } from "@/components/Topbar";
import { SchemaCanvas } from "@/components/SchemaExplorer/SchemaCanvas";

export default function SchemaPage() {
  return (
    <div className="h-screen w-screen overflow-hidden bg-[#121110] text-stone-100 flex flex-col font-sans select-none antialiased">
      <Topbar />
      <main className="flex-1 overflow-hidden relative">
        <SchemaCanvas />
      </main>
    </div>
  );
}
