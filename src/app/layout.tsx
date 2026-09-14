import type { Metadata } from "next";
import { Roboto, JetBrains_Mono } from "next/font/google";
import "./globals.css";

const roboto = Roboto({
  weight: ["300", "400", "500", "700"],
  variable: "--font-roboto",
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
    <html lang="en" className="dark h-full bg-[#0e0e11] text-[#f4f4f5]">
      <body
        className={`${roboto.variable} ${jetbrainsMono.variable} min-h-screen flex flex-col font-sans bg-[#0e0e11] text-[#f4f4f5] antialiased selection:bg-[#38bdf8]/25 selection:text-[#38bdf8]`}
      >
        {children}
      </body>
    </html>
  );
}
