"use client";

import { Globe, WifiOff, Loader2, RefreshCw, Menu } from "lucide-react";
import { ExecutionMode } from "../types/rag";

interface ChatHeaderProps {
  executionMode: ExecutionMode;
  onModeChange: (mode: ExecutionMode) => void;
  engineReady: boolean;
  status: string;
  initEngine: () => void;
  onMenuClick: () => void;
}

export function ChatHeader({
  executionMode,
  onModeChange,
  engineReady,
  status,
  initEngine,
  onMenuClick,
}: ChatHeaderProps) {
  const isDownloading = status.includes("%") || status.toLowerCase().includes("downloading");

  return (
    <header className="h-14 border-b border-slate-800/50 flex items-center justify-between px-4 bg-[#080c14]/80 backdrop-blur-md sticky top-0 z-30">
      <div className="flex items-center gap-2">
        <button 
          onClick={onMenuClick} 
          className="md:hidden p-2 -ml-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800/40 transition"
        >
          <Menu className="h-5 w-5" />
        </button>
        
        <div className="flex items-center bg-[#0d1424] border border-slate-800 p-1 rounded-xl">
          <button 
            onClick={() => onModeChange("online")}
            className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-semibold transition ${executionMode === "online" ? "bg-gradient-to-r from-amber-500 to-orange-600 text-slate-950 shadow" : "text-slate-400 hover:text-slate-200"}`}
          >
            <Globe className="h-3.5 w-3.5" />
            <span>Online Cloud</span>
          </button>
          <button 
            onClick={() => onModeChange("offline")}
            className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-semibold transition ${executionMode === "offline" ? "bg-gradient-to-r from-amber-500 to-orange-600 text-slate-950 shadow" : "text-slate-400 hover:text-slate-200"}`}
          >
            <WifiOff className="h-3.5 w-3.5" />
            <span>Offline Engine</span>
          </button>
        </div>
      </div>

      <div className="flex items-center gap-3">
        {executionMode === "online" ? (
          <div className="flex items-center gap-2 text-xs font-semibold bg-blue-500/10 border border-blue-500/30 text-blue-400 px-3 py-1.5 rounded-lg shadow-inner">
            <span className="h-1.5 w-1.5 rounded-full bg-blue-400 animate-pulse" />
            <span>Connected Online</span>
          </div>
        ) : !engineReady ? (
          <button 
            onClick={initEngine} 
            className="relative inline-flex items-center gap-2 bg-slate-900 border border-slate-800 text-amber-400 text-xs font-bold px-3 py-2 rounded-lg hover:border-amber-500/40 shadow-lg transition"
          >
            {isDownloading ? (
              <>
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                <span>Activating brain ({status.match(/\d+%/)?.[0] || "Connecting..."})</span>
              </>
            ) : (
              <>
                <RefreshCw className="h-3.5 w-3.5" />
                <span>Download The Offline Engine</span>
              </>
            )}
          </button>
        ) : (
          <div className="flex items-center gap-2 text-xs font-semibold bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 px-3 py-1.5 rounded-lg">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-ping" />
            <span>Offline Engine Ready</span>
          </div>
        )}
      </div>
    </header>
  );
}