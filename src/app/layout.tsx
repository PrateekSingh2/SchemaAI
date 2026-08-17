import type { Metadata } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "SchemaAI — Intelligent Natural Language to SQL/GraphQL Query Generation",
  description: "Production-ready developer workbench for schema introspection, AI-driven SQL/GraphQL generation, and secure execution guards.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark h-full bg-[#080c14] text-slate-100">
      <body
        className={`${inter.variable} ${jetbrainsMono.variable} min-h-screen flex flex-col font-sans bg-[#080c14] text-slate-100 antialiased selection:bg-cyan-500/30 selection:text-cyan-200`}
      >
        {children}
      </body>
    </html>
  );
}
