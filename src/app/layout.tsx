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
  description: "Developer workbench for schema introspection, AI-driven SQL/GraphQL generation, and secure execution guards.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark h-full bg-[#121110] text-stone-100">
      <body
        className={`${inter.variable} ${jetbrainsMono.variable} min-h-screen flex flex-col font-sans bg-[#121110] text-stone-100 antialiased selection:bg-[#3ecf8e]/30 selection:text-[#3ecf8e]`}
      >
        {children}
      </body>
    </html>
  );
}
