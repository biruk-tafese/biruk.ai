"use client";
import React from "react";
import { X, Plus, MessageSquare, Sliders, Sparkles } from "lucide-react";
import { ChatSession } from "../types/rag";

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
  sessions: ChatSession[];
  activeSessionId: string;
  onSelectSession: (id: string) => void;
  onCreateSession: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  isOpen,
  onClose,
  sessions,
  activeSessionId,
  onSelectSession,
  onCreateSession,
}) => {
  return (
    <>
      <aside 
        className={`fixed inset-y-0 left-0 z-50 w-72 bg-[#0c1220] border-r border-slate-800/80 transform ${
          isOpen ? "translate-x-0" : "-translate-x-full"
        } md:translate-x-0 transition-transform duration-300 ease-in-out flex flex-col justify-between`}
      >
        <div className="flex flex-col flex-1 overflow-y-auto p-4">
          <div className="flex justify-between items-center mb-5">
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-lg bg-gradient-to-tr from-amber-500 to-orange-600 flex items-center justify-center shadow-md shadow-orange-950/40">
                <Sparkles className="h-4 w-4 text-slate-900 stroke-[2.5]" />
              </div>
              <span className="text-xl font-bold tracking-tight bg-gradient-to-r from-white via-slate-200 to-amber-400 bg-clip-text text-transparent">
                Biruk.ai
              </span>
            </div>
            <button onClick={onClose} className="md:hidden p-1.5 text-slate-400 hover:text-white rounded-md hover:bg-slate-800/60 transition">
              <X className="h-5 w-5" />
            </button>
          </div>

          <button 
            onClick={onCreateSession} 
            className="w-full mb-6 flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl border border-slate-800 bg-[#0e172a] hover:bg-slate-800/50 hover:border-amber-500/40 text-sm font-medium transition group text-slate-200"
          >
            <Plus className="h-4 w-4 text-amber-500 group-hover:rotate-90 transition-transform" />
            New Session Chat
          </button>

          <div className="flex-1 space-y-2">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-500 px-2 mb-2">Recent Learning Chats</h3>
            {sessions.map((session) => (
              <button
                key={session.id}
                onClick={() => onSelectSession(session.id)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left text-sm transition ${
                  session.id === activeSessionId 
                    ? "bg-amber-500/10 border border-amber-500/30 text-amber-400 font-medium shadow-sm" 
                    : "text-slate-400 hover:bg-slate-800/30 hover:text-slate-200"
                }`}
              >
                <MessageSquare className="h-4 w-4 shrink-0 opacity-80" />
                <span className="truncate">{session.title}</span>
              </button>
            ))}
          </div>
        </div>

        <div className="p-4 border-t border-slate-800/80 bg-[#0a0f1b]">
          <div className="flex items-center gap-3 text-sm text-slate-400 py-2 px-1 hover:text-white cursor-pointer transition">
            <Sliders className="h-4 w-4 text-slate-400" />
            <span>Local Engine Parameters</span>
          </div>
        </div>
      </aside>
      
      {isOpen && (
        <div onClick={onClose} className="fixed inset-0 bg-black/60 z-40 md:hidden backdrop-blur-sm" />
      )}
    </>
  );
};