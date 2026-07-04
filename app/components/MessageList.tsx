"use client";

import { RefObject, useState } from "react";
import { Loader2, SquarePen, Trash2, Copy, Check } from "lucide-react";
import { Message } from "../types/rag";

interface MessageListProps {
  messages: Message[];
  isProcessingFile: boolean;
  isCloudLoading: boolean;
  fileError: string | null;
  messagesEndRef: RefObject<HTMLDivElement | null>;
  onEditMessage: (messageId: string, newContent: string) => void;
  onDeleteMessage: (messageId: string) => void;
}

export function MessageList({
  messages,
  isProcessingFile,
  isCloudLoading,
  fileError,
  messagesEndRef,
  onEditMessage,
  onDeleteMessage,
}: MessageListProps) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editText, setEditText] = useState<string>("");
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const handleCopy = async (id: string, text: string) => {
    await navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const startEditing = (msg: Message) => {
    setEditingId(msg.id);
    setEditText(msg.content);
  };

  const saveEdit = (id: string) => {
    if (!editText.trim()) return;
    onEditMessage(id, editText);
    setEditingId(null);
  };

  return (
    <div className="flex-1 overflow-y-auto px-4 py-6 space-y-6 max-w-3xl w-full mx-auto pb-36 scrollbar-thin scrollbar-thumb-slate-800">
      {messages.map((m) => (
        <div 
          key={m.id} 
          className={`flex gap-4 group animate-in fade-in-50 slide-in-from-bottom-2 duration-200 ${m.role === "user" ? "justify-end" : "justify-start"}`}
        >
          <div className={`relative flex flex-col gap-1 max-w-[85%] sm:max-w-[80%] p-4 rounded-2xl border backdrop-blur-sm shadow-md transition-all ${
            m.role === "user" 
              ? "bg-slate-850/70 border-slate-700/50 text-slate-100 rounded-tr-none hover:border-amber-500/20" 
              : "bg-slate-900/90 border-slate-800 text-slate-300 rounded-tl-none hover:border-slate-700/40"
          }`}>
            
            {/* Modern Overlay Action Bars */}
            <div className="absolute top-2 right-2 flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity bg-slate-950/80 px-2 py-1 rounded-lg border border-slate-800/80 backdrop-blur-md">
              <button 
                onClick={() => handleCopy(m.id, m.content)} 
                title="Copy contents"
                className="p-1 text-slate-400 hover:text-amber-400 rounded transition"
              >
                {copiedId === m.id ? (
                  <Check className="h-3.5 w-3.5 text-emerald-400" />
                ) : (
                  <Copy className="h-3.5 w-3.5" />
                )}
              </button>
              
              {m.role === "user" && (
                <>
                  <button 
                    onClick={() => startEditing(m)} 
                    title="Edit prompt"
                    className="p-1 text-slate-400 hover:text-amber-400 rounded transition"
                  >
                    <SquarePen className="h-3.5 w-3.5" />
                  </button>
                  <button 
                    onClick={() => onDeleteMessage(m.id)} 
                    title="Delete message"
                    className="p-1 text-slate-400 hover:text-red-400 rounded transition"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </>
              )}
            </div>

            <div className="flex-1 space-y-1">
              <p className="text-[10px] font-bold tracking-wider uppercase text-slate-500 select-none">
                {m.role === "user" ? "You" : "Biruk.ai"}
              </p>
              
              {editingId === m.id ? (
                <div className="flex flex-col gap-2 mt-1 min-w-[260px] sm:min-w-[400px]">
                  <textarea
                    value={editText}
                    onChange={(e) => setEditText(e.target.value)}
                    className="w-full bg-slate-950 text-slate-100 text-sm p-2 rounded-xl border border-slate-700 focus:outline-none focus:border-amber-500/50 resize-none h-20 font-sans"
                  />
                  <div className="flex items-center justify-end gap-2 text-xs">
                    <button 
                      onClick={() => setEditingId(null)} 
                      className="px-2.5 py-1 text-slate-400 hover:text-white font-medium transition"
                    >
                      Cancel
                    </button>
                    <button 
                      onClick={() => saveEdit(m.id)} 
                      className="px-3 py-1 bg-gradient-to-r from-amber-500 to-orange-600 text-slate-950 rounded-lg font-bold shadow hover:brightness-110 transition"
                    >
                      Regenerate
                    </button>
                  </div>
                </div>
              ) : (
                <p className="text-sm leading-relaxed whitespace-pre-wrap">{m.content}</p>
              )}
            </div>
          </div>
        </div>
      ))}

      {(isProcessingFile || isCloudLoading) && (
        <div className="flex items-center gap-3 p-4 bg-slate-900/30 border border-dashed border-slate-800 text-amber-500/80 rounded-xl max-w-sm shadow-inner animate-pulse">
          <Loader2 className="h-4 w-4 animate-spin" />
          <span className="text-xs font-medium">
            {isProcessingFile ? "Reading and mapping context matrices locally..." : "Thinking..."}
          </span>
        </div>
      )}

      {fileError && (
        <div className="p-3 bg-red-950/40 border border-red-900 text-red-400 text-xs rounded-xl max-w-md shadow-lg">
          {fileError}
        </div>
      )}

      <div ref={messagesEndRef} />
    </div>
  );
}