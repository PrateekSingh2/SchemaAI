"use client";

import React, { useState, useRef, useEffect, useCallback } from "react";
import {
  ArrowUp,
  Mic,
  MicOff,
  Eraser,
  AlertCircle,
  Loader2,
  Sparkles,
  Database,
  ChevronDown,
} from "lucide-react";
import { samplePresets, QueryPreset } from "@/lib/mockData";

interface PromptInputProps {
  onGenerateAndRun: (promptText: string) => void;
  isLoading?: boolean;
  value?: string;
  onChange?: (val: string) => void;
  isCentered?: boolean;
  savedModels?: { id: string; provider: string; name: string; apiKey: string }[];
  activeModelId?: string;
  onModelChange?: (modelId: string) => void;
  dbType?: string;
  onOpenSettings?: (tab?: "database" | "ai" | "security") => void;
}

export const PromptInput: React.FC<PromptInputProps> = ({
  onGenerateAndRun,
  isLoading = false,
  value,
  onChange,
  isCentered = false,
  savedModels = [],
  activeModelId,
  onModelChange,
  dbType,
  onOpenSettings,
}) => {
  const [internalPrompt, setInternalPrompt] = useState("");
  const [isListening, setIsListening] = useState(false);
  const [isRequestingMic, setIsRequestingMic] = useState(false);
  const [micError, setMicError] = useState<string | null>(null);

  const recognitionRef = useRef<any>(null);
  const basePromptRef = useRef<string>("");

  const prompt = value !== undefined ? value : internalPrompt;
  const setPrompt = (val: string) => {
    if (onChange) onChange(val);
    else setInternalPrompt(val);
  };

  // Stop active speech recognition
  const stopListening = useCallback(() => {
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch {
        // ignore
      }
      recognitionRef.current = null;
    }
    setIsListening(false);
  }, []);

  // Request mic permission and start voice dictation
  const startListening = async () => {
    setMicError(null);

    // 1. Check browser support for SpeechRecognition
    const SpeechRecognition =
      typeof window !== "undefined"
        ? (window as any).SpeechRecognition ||
          (window as any).webkitSpeechRecognition
        : null;

    if (!SpeechRecognition) {
      setMicError("Speech recognition is not supported in this browser. Please use Chrome, Edge, or Safari.");
      return;
    }

    // 2. Explicitly prompt user for microphone permission
    setIsRequestingMic(true);
    try {
      if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        // Stop stream tracks immediately so SpeechRecognition has exclusive mic access
        stream.getTracks().forEach((track) => track.stop());
      }
    } catch (err: any) {
      setIsRequestingMic(false);
      console.warn("Microphone permission denied:", err);
      setMicError("Microphone access was denied. Please allow microphone permissions in your browser address bar.");
      return;
    }
    setIsRequestingMic(false);

    // 3. Initialize SpeechRecognition instance
    try {
      const recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = "en-US";

      // Preserve any text already typed so speech appends naturally
      const currentText = prompt ? prompt.trim() : "";
      basePromptRef.current = currentText ? `${currentText} ` : "";

      recognition.onstart = () => {
        setIsListening(true);
        setMicError(null);
      };

      recognition.onresult = (event: any) => {
        let interimTranscript = "";
        let finalTranscript = "";

        for (let i = event.resultIndex; i < event.results.length; ++i) {
          const res = event.results[i];
          const text = res[0]?.transcript || "";
          if (res.isFinal) {
            finalTranscript += text;
          } else {
            interimTranscript += text;
          }
        }

        const speechText = finalTranscript || interimTranscript;
        if (speechText) {
          setPrompt(basePromptRef.current + speechText);
        }
      };

      recognition.onerror = (event: any) => {
        console.warn("Speech recognition error:", event.error);
        if (event.error === "not-allowed" || event.error === "permission-denied") {
          setMicError("Microphone access denied. Please click the camera/mic icon in the address bar to allow.");
          stopListening();
        } else if (event.error === "no-speech") {
          // benign silence
        } else {
          setMicError(`Voice error: ${event.error}`);
          stopListening();
        }
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognitionRef.current = recognition;
      recognition.start();
      setIsListening(true);
    } catch (err: any) {
      console.error("Failed to start SpeechRecognition:", err);
      setIsListening(false);
      setMicError("Could not start speech recognition. Please check your microphone.");
    }
  };

  const handleToggleMic = () => {
    if (isListening) {
      stopListening();
    } else {
      startListening();
    }
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch {
          // ignore
        }
      }
    };
  }, []);

  const handleSubmit = () => {
    if (!prompt.trim() || isLoading) return;
    onGenerateAndRun(prompt.trim());
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const selectPreset = (preset: QueryPreset) => {
    setPrompt(preset.prompt);
  };

  const handleClear = () => {
    setPrompt("");
  };

  // 1. Initial Centered Hero Mode
  if (isCentered) {
    return (
      <div className="relative w-full max-w-2xl mx-auto flex flex-col items-center justify-center space-y-7 px-4 animate-in fade-in zoom-in-95 duration-300 select-none">
        {/* Ambient Backlight Glow */}
        <div className="absolute -top-24 left-1/2 -translate-x-1/2 w-[540px] h-[240px] bg-gradient-to-tr from-sky-500/10 via-indigo-500/5 to-transparent rounded-full blur-3xl pointer-events-none -z-10" />

        {/* Hero Title & Badge */}
        <div className="text-center space-y-3">
          <div className="inline-flex items-center space-x-2 px-3.5 py-1 rounded-full bg-white/[0.04] border border-white/[0.08] backdrop-blur-xl text-[11px] font-medium text-zinc-400 shadow-sm">
            <span className="w-1.5 h-1.5 rounded-full bg-sky-400 shadow-[0_0_8px_#38bdf8] animate-pulse" />
            <span className="tracking-wide">AI Relational Query Studio</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-semibold text-transparent bg-clip-text bg-gradient-to-b from-white via-zinc-100 to-zinc-400 tracking-tight">
            What query would you like to build?
          </h1>
          <p className="text-xs sm:text-sm text-zinc-400 max-w-md mx-auto leading-relaxed">
            Type your schema request in plain English. SchemaAI synthesizes optimized, dialect-verified queries for your database.
          </p>
        </div>

        {/* Main Input Box (macOS Frosted Glass Squircle) */}
        <div className="relative w-full rounded-[22px] bg-[#141418]/80 hover:bg-[#15151b]/90 backdrop-blur-2xl border border-white/[0.08] shadow-[0_24px_50px_-12px_rgba(0,0,0,0.7),0_1px_0_rgba(255,255,255,0.08)_inset] p-4 sm:p-5 space-y-3 focus-within:border-sky-500/50 focus-within:ring-4 focus-within:ring-sky-500/10 focus-within:shadow-[0_24px_60px_-10px_rgba(56,189,248,0.12),0_1px_0_rgba(255,255,255,0.1)_inset] transition-all duration-300">
          {/* Mic Error Banner */}
          {micError && (
            <div className="flex items-center justify-between px-3 py-2 rounded-xl bg-rose-500/10 border border-rose-500/25 text-rose-300 text-xs animate-in fade-in duration-200">
              <div className="flex items-center space-x-2 min-w-0 pr-2">
                <AlertCircle className="w-3.5 h-3.5 text-rose-400 shrink-0" />
                <span className="truncate">{micError}</span>
              </div>
              <button
                type="button"
                onClick={() => setMicError(null)}
                className="text-rose-400 hover:text-rose-200 text-xs font-bold cursor-pointer shrink-0"
              >
                ✕
              </button>
            </div>
          )}

          <textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={isListening ? "Listening... speak now" : "Ask anything about your database, e.g. 'Find top 10 users by total spend'..."}
            rows={3}
            className="w-full bg-transparent text-[#f4f4f5] placeholder:text-zinc-500 text-sm sm:text-base focus:outline-none resize-none font-sans leading-relaxed select-text caret-sky-400"
          />

          {/* Bottom Control Bar */}
          <div className="flex flex-wrap items-center justify-between gap-2.5 pt-3 border-t border-white/[0.06] text-xs">
            {/* Left: Indicator & Selectors */}
            {isListening ? (
              <div className="flex items-center space-x-2 text-rose-400 text-xs font-medium animate-pulse">
                <span className="w-2 h-2 rounded-full bg-rose-500 shadow-[0_0_8px_#f43f5e]" />
                <span>Listening... speak your query</span>
              </div>
            ) : (
              <div className="flex flex-wrap items-center gap-2 select-none">
                {/* 1. Model Selector Dropdown Pill */}
                {savedModels.length > 0 ? (
                  <div className="relative flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.09] hover:border-sky-500/40 text-zinc-200 transition-all shadow-sm cursor-pointer group">
                    <Sparkles className="w-3.5 h-3.5 text-sky-400 shrink-0" />
                    <select
                      value={activeModelId || ""}
                      onChange={(e) => {
                        if (e.target.value === "__add_model__") {
                          onOpenSettings?.("ai");
                        } else {
                          onModelChange?.(e.target.value);
                        }
                      }}
                      className="bg-transparent text-zinc-200 text-xs font-medium outline-none border-none cursor-pointer pr-5 appearance-none w-full max-w-[160px] truncate"
                    >
                      {savedModels.map((m) => (
                        <option key={m.id} value={m.id} className="bg-[#141418] text-zinc-200">
                          {m.name}
                        </option>
                      ))}
                      <option value="__add_model__" className="bg-[#141418] text-amber-400">
                        + Add AI Model...
                      </option>
                    </select>
                    <ChevronDown className="w-3.5 h-3.5 text-zinc-400 group-hover:text-zinc-200 pointer-events-none absolute right-2.5" />
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => onOpenSettings?.("ai")}
                    className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 text-amber-300 text-xs font-medium transition-all shadow-sm cursor-pointer"
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>+ Connect AI Model</span>
                  </button>
                )}

                {/* 2. Database Connection Tag Pill */}
                {dbType ? (
                  <button
                    type="button"
                    onClick={() => onOpenSettings?.("database")}
                    className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-emerald-500/[0.08] hover:bg-emerald-500/[0.16] border border-emerald-500/25 hover:border-emerald-500/40 text-emerald-300 transition-all cursor-pointer shadow-sm group"
                    title="Connected Database Engine (Click to configure)"
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shadow-[0_0_8px_#34d399] animate-pulse" />
                    <Database className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                    <span className="text-xs font-medium text-emerald-200">{dbType}</span>
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => onOpenSettings?.("database")}
                    className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 text-rose-300 text-xs font-medium transition-all shadow-sm cursor-pointer"
                  >
                    <Database className="w-3.5 h-3.5 text-rose-400" />
                    <span>Connect DB</span>
                  </button>
                )}

                {/* 3. Keyboard Shortcut Helper */}
                <kbd className="hidden md:inline-flex items-center space-x-1 px-2 py-1 rounded-lg bg-white/[0.03] border border-white/[0.06] text-zinc-400 font-mono text-[10px]">
                  <span>↵</span>
                  <span>Return</span>
                </kbd>
              </div>
            )}

            {/* Right: Action buttons */}
            <div className="flex items-center space-x-2 ml-auto">
              {prompt.length > 0 && (
                <button
                  onClick={handleClear}
                  className="p-2 rounded-xl text-zinc-400 hover:text-rose-400 hover:bg-white/[0.06] transition-all cursor-pointer"
                  title="Clear input"
                >
                  <Eraser className="w-4 h-4" />
                </button>
              )}

              {/* Working Microphone Button */}
              {isRequestingMic ? (
                <button
                  type="button"
                  disabled
                  className="p-2 rounded-xl text-sky-400 bg-sky-500/10 border border-sky-500/30 cursor-wait"
                  title="Requesting microphone permission..."
                >
                  <Loader2 className="w-4 h-4 animate-spin" />
                </button>
              ) : isListening ? (
                <button
                  type="button"
                  onClick={handleToggleMic}
                  className="p-2 rounded-xl bg-rose-500/20 text-rose-400 border border-rose-500/40 hover:bg-rose-500/30 shadow-[0_0_12px_rgba(244,63,94,0.35)] transition-all cursor-pointer relative"
                  title="Stop voice recording (Click to stop)"
                >
                  <span className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-rose-500 animate-ping" />
                  <Mic className="w-4 h-4 animate-pulse" />
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleToggleMic}
                  className="p-2 rounded-xl text-zinc-400 hover:text-zinc-200 hover:bg-white/[0.06] transition-all cursor-pointer"
                  title="Voice dictation (Click to speak)"
                >
                  <Mic className="w-4 h-4" />
                </button>
              )}

              <button
                onClick={handleSubmit}
                disabled={isLoading || !prompt.trim()}
                className="flex items-center justify-center w-9 h-9 rounded-xl bg-gradient-to-b from-sky-400 to-sky-500 hover:from-sky-300 hover:to-sky-400 text-slate-950 font-semibold shadow-lg shadow-sky-500/20 hover:shadow-sky-500/35 active:scale-95 transition-all duration-150 cursor-pointer disabled:opacity-25 disabled:pointer-events-none disabled:shadow-none"
                title="Execute (Enter)"
              >
                <ArrowUp className="w-4.5 h-4.5 stroke-[2.5]" />
              </button>
            </div>
          </div>
        </div>

        {/* Preset Chips (macOS Translucent Frosted Glass Capsules) */}
        <div className="w-full space-y-2">
          <div className="flex flex-wrap items-center justify-center gap-2.5">
            {samplePresets.slice(0, 4).map((preset) => (
              <button
                key={preset.id}
                onClick={() => selectPreset(preset)}
                className="px-4 py-2 rounded-full text-xs sm:text-sm font-medium bg-white/[0.03] hover:bg-white/[0.08] border border-white/[0.07] hover:border-white/[0.18] text-zinc-300 hover:text-white backdrop-blur-xl shadow-[0_2px_10px_rgba(0,0,0,0.25)] hover:-translate-y-0.5 active:scale-[0.98] transition-all duration-200 cursor-pointer"
              >
                {preset.title}
              </button>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // 2. Bottom Docked Mode (macOS Glassmorphism matching centered style)
  return (
    <div className="relative w-full rounded-[20px] bg-[#141418]/85 backdrop-blur-2xl border border-white/[0.08] shadow-[0_20px_40px_-15px_rgba(0,0,0,0.8),0_1px_0_rgba(255,255,255,0.06)_inset] p-3 sm:p-3.5 focus-within:border-sky-500/50 focus-within:ring-4 focus-within:ring-sky-500/10 transition-all select-none space-y-2">
      {/* Mic Error Banner in Docked Mode */}
      {micError && (
        <div className="flex items-center justify-between px-3 py-1.5 rounded-lg bg-rose-500/10 border border-rose-500/25 text-rose-300 text-xs animate-in fade-in duration-200">
          <div className="flex items-center space-x-2 min-w-0 pr-2">
            <AlertCircle className="w-3.5 h-3.5 text-rose-400 shrink-0" />
            <span className="truncate">{micError}</span>
          </div>
          <button
            type="button"
            onClick={() => setMicError(null)}
            className="text-rose-400 hover:text-rose-200 text-xs font-bold cursor-pointer shrink-0"
          >
            ✕
          </button>
        </div>
      )}

      <textarea
        value={prompt}
        onChange={(e) => setPrompt(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder={isListening ? "Listening... speak now" : "Ask a follow-up query or modification..."}
        rows={1}
        className="w-full bg-transparent text-[#f4f4f5] placeholder:text-zinc-500 text-sm sm:text-base focus:outline-none resize-none font-sans leading-relaxed px-1 py-1 select-text caret-sky-400"
      />

      <div className="flex flex-wrap items-center justify-between gap-2 pt-2 mt-1 border-t border-white/[0.05] text-xs">
        {/* Left: Indicator & Selectors */}
        {isListening ? (
          <div className="flex items-center space-x-2 text-rose-400 text-xs font-medium animate-pulse">
            <span className="w-2 h-2 rounded-full bg-rose-500 shadow-[0_0_8px_#f43f5e]" />
            <span>Listening... speak prompt</span>
          </div>
        ) : (
          <div className="flex flex-wrap items-center gap-2 select-none">
            {/* 1. Model Selector Dropdown Pill */}
            {savedModels.length > 0 ? (
              <div className="relative flex items-center space-x-1.5 px-2.5 py-1 rounded-lg bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.08] hover:border-sky-500/40 text-zinc-200 transition-all shadow-sm cursor-pointer group">
                <Sparkles className="w-3 h-3 text-sky-400 shrink-0" />
                <select
                  value={activeModelId || ""}
                  onChange={(e) => {
                    if (e.target.value === "__add_model__") {
                      onOpenSettings?.("ai");
                    } else {
                      onModelChange?.(e.target.value);
                    }
                  }}
                  className="bg-transparent text-zinc-200 text-[11px] font-medium outline-none border-none cursor-pointer pr-4 appearance-none w-full max-w-[130px] truncate"
                >
                  {savedModels.map((m) => (
                    <option key={m.id} value={m.id} className="bg-[#141418] text-zinc-200">
                      {m.name}
                    </option>
                  ))}
                  <option value="__add_model__" className="bg-[#141418] text-amber-400">
                    + Add Model...
                  </option>
                </select>
                <ChevronDown className="w-3 h-3 text-zinc-400 group-hover:text-zinc-200 pointer-events-none absolute right-2" />
              </div>
            ) : (
              <button
                type="button"
                onClick={() => onOpenSettings?.("ai")}
                className="flex items-center space-x-1 px-2 py-1 rounded-lg bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 text-amber-300 text-[11px] font-medium cursor-pointer"
              >
                <Sparkles className="w-3 h-3" />
                <span>Add AI Model</span>
              </button>
            )}

            {/* 2. Database Connection Tag Pill */}
            {dbType ? (
              <button
                type="button"
                onClick={() => onOpenSettings?.("database")}
                className="flex items-center space-x-1.5 px-2.5 py-1 rounded-lg bg-emerald-500/[0.08] hover:bg-emerald-500/[0.16] border border-emerald-500/25 hover:border-emerald-500/40 text-emerald-300 transition-all cursor-pointer shadow-sm group"
              >
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shadow-[0_0_6px_#34d399] animate-pulse" />
                <Database className="w-3 h-3 text-emerald-400 shrink-0" />
                <span className="text-[11px] font-medium text-emerald-200">{dbType}</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={() => onOpenSettings?.("database")}
                className="flex items-center space-x-1 px-2 py-1 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 text-rose-300 text-[11px] font-medium cursor-pointer"
              >
                <Database className="w-3 h-3 text-rose-400" />
                <span>Connect DB</span>
              </button>
            )}

            <kbd className="hidden sm:inline-flex items-center space-x-1 px-1.5 py-0.5 rounded bg-white/[0.04] border border-white/[0.08] text-zinc-400 font-mono text-[10px] shadow-sm">
              <span>↵</span>
              <span>Return</span>
            </kbd>
          </div>
        )}

        {/* Right: Actions */}
        <div className="flex items-center space-x-1.5 ml-auto">
          {prompt.length > 0 && (
            <button
              onClick={handleClear}
              className="p-1.5 rounded-lg text-zinc-400 hover:text-rose-400 hover:bg-white/[0.06] transition-all cursor-pointer"
              title="Clear input"
            >
              <Eraser className="w-4 h-4" />
            </button>
          )}

          {/* Working Microphone Button */}
          {isRequestingMic ? (
            <button
              type="button"
              disabled
              className="p-1.5 rounded-lg text-sky-400 bg-sky-500/10 border border-sky-500/30 cursor-wait"
              title="Requesting microphone permission..."
            >
              <Loader2 className="w-4 h-4 animate-spin" />
            </button>
          ) : isListening ? (
            <button
              type="button"
              onClick={handleToggleMic}
              className="p-1.5 rounded-lg bg-rose-500/20 text-rose-400 border border-rose-500/40 hover:bg-rose-500/30 shadow-[0_0_10px_rgba(244,63,94,0.35)] transition-all cursor-pointer relative"
              title="Stop voice recording (Click to stop)"
            >
              <span className="absolute -top-0.5 -right-0.5 w-1.5 h-1.5 rounded-full bg-rose-500 animate-ping" />
              <Mic className="w-4 h-4 animate-pulse" />
            </button>
          ) : (
            <button
              type="button"
              onClick={handleToggleMic}
              className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-200 hover:bg-white/[0.06] transition-all cursor-pointer"
              title="Voice dictation (Click to speak)"
            >
              <Mic className="w-4 h-4" />
            </button>
          )}

          <button
            onClick={handleSubmit}
            disabled={isLoading || !prompt.trim()}
            className="flex items-center justify-center w-8 h-8 rounded-xl bg-gradient-to-b from-sky-400 to-sky-500 hover:from-sky-300 hover:to-sky-400 text-slate-950 font-semibold shadow-md shadow-sky-500/20 active:scale-95 transition-all disabled:opacity-25 disabled:pointer-events-none disabled:shadow-none cursor-pointer"
            title="Send (Enter)"
          >
            <ArrowUp className="w-4 h-4 stroke-[2.5]" />
          </button>
        </div>
      </div>
    </div>
  );
};
