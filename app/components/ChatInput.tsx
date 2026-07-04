"use client";

import { useRef, ChangeEvent } from "react";
import { Send, Paperclip, FileText, Trash2, RefreshCw } from "lucide-react";
import { WorkspaceFile, ExecutionMode } from "../types/rag";

interface ChatInputProps {
  input: string;
  onInputChange: (val: string) => void;
  onSendMessage: () => void;
  onFileUpload: (e: ChangeEvent<HTMLInputElement>, replaceFileId?: string) => void;
  onRemoveFile: (fileId: string) => void;
  uploadedFiles: WorkspaceFile[];
  executionMode: ExecutionMode;
}

export function ChatInput({
  input,
  onInputChange,
  onSendMessage,
  onFileUpload,
  onRemoveFile,
  uploadedFiles,
  executionMode,
}: ChatInputProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const replaceTargetRef = useRef<string | undefined>(undefined);

  const handleFileClick = (replaceId?: string) => {
    replaceTargetRef.current = replaceId;
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    onFileUpload(e, replaceTargetRef.current);
    if (fileInputRef.current) fileInputRef.current.value = ""; // Reset form DOM node
  };

  return (
    <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-[#05080e] via-[#05080e]/95 to-transparent backdrop-blur-sm max-w-3xl w-full mx-auto space-y-3">
      
      {/* Dynamic Hover-Managed File Tray Deck */}
      {uploadedFiles.length > 0 && (
        <div className="flex flex-wrap gap-2 animate-in fade-in-50 slide-in-from-bottom-1 max-h-24 overflow-y-auto scrollbar-none py-1">
          {uploadedFiles.map((file) => (
            <div 
              key={file.id} 
              className="group relative flex items-center gap-2 bg-slate-900/90 border border-slate-800 text-slate-200 px-3 py-1.5 rounded-xl text-xs backdrop-blur shadow-sm max-w-[240px] truncate"
            >
              <FileText className="h-3.5 w-3.5 text-amber-500 shrink-0" />
              <span className="truncate pr-1">{file.name}</span>
              
              {/* Context Action Overlay Tray on Hover/Focus */}
              <div className="absolute inset-0 bg-slate-950/90 rounded-xl flex items-center justify-end px-2 gap-2 opacity-0 group-hover:opacity-100 transition-all duration-150">
                <button
                  type="button"
                  onClick={() => handleFileClick(file.id)}
                  title="Replace document context"
                  className="p-1 text-slate-400 hover:text-amber-400 rounded transition"
                >
                  <RefreshCw className="h-3.5 w-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => onRemoveFile(file.id)}
                  title="Remove document context"
                  className="p-1 text-slate-400 hover:text-red-400 rounded transition"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Main Form Entry Pipeline Bar */}
      <div className="flex items-end gap-2 bg-slate-900/60 border border-slate-800/80 rounded-2xl p-2 focus-within:border-amber-500/30 transition-all shadow-xl backdrop-blur-md">
        <input 
          type="file" 
          ref={fileInputRef} 
          onChange={handleFileChange} 
          accept="application/pdf" 
          className="hidden" 
        />
        
        <button
          type="button"
          onClick={() => handleFileClick(undefined)}
          className="p-2.5 text-slate-400 hover:text-amber-500 bg-slate-950/40 border border-slate-800/40 rounded-xl transition shadow-inner shrink-0"
          title="Add document context"
        >
          <Paperclip className="h-4 w-4" />
        </button>

        <textarea
          value={input}
          onChange={(e) => onInputChange(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              onSendMessage();
            }
          }}
          placeholder={`Query workspace repository matrix (${executionMode} mode)...`}
          rows={1}
          className="flex-1 bg-transparent text-slate-200 placeholder-slate-500 text-sm focus:outline-none resize-none max-h-32 min-h-[38px] py-2 px-1 scrollbar-none font-sans"
        />

        <button
          type="button"
          onClick={onSendMessage}
          disabled={!input.trim()}
          className="p-2.5 bg-gradient-to-br from-amber-500 to-orange-600 disabled:from-slate-800 disabled:to-slate-800 disabled:text-slate-600 text-slate-950 rounded-xl transition font-bold shadow-md hover:brightness-110 shrink-0"
        >
          <Send className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}