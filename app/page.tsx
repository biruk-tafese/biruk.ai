"use client";

import { useState, useEffect, useRef, ChangeEvent } from "react";
import { useLocalRAG } from "./hooks/useLocalRAG";
import { Sidebar } from "./components/Sidebar";
import { ChatHeader } from "./components/ChatHeader";
import { MessageList } from "./components/MessageList";
import { ChatInput } from "./components/ChatInput";
import { ChatSession, Message, ExecutionMode, WorkspaceFile } from "./types/rag";
import localforage from "localforage";

// Initialize client-side persistent storage container
localforage.config({
  name: "biruk-ai-workspace",
  storeName: "session_matrix_cache"
});

export default function Home() {
  const { initEngine, indexTextData, queryLocalVectorDB, engine, status } = useLocalRAG();
  const [sidebarOpen, setSidebarOpen] = useState<boolean>(false);
  const [input, setInput] = useState<string>("");
  const [isProcessingFile, setIsProcessingFile] = useState<boolean>(false);
  const [fileError, setFileError] = useState<string | null>(null);
  const [globalMode, setGlobalMode] = useState<ExecutionMode>("online");
  const [isCloudLoading, setIsCloudLoading] = useState<boolean>(false);

  const [sessions, setSessions] = useState<ChatSession[]>([
    {
      id: "session-1",
      title: "Shared Workspace Matrix",
      messages: [
        { 
          id: "msg-init",
          role: "assistant", 
          content: "Hello! I am **Biruk.ai**. Clip multi-document PDFs onto the repository tray below, and I will index their unified matrices for processing!" 
        }
      ],
      executionMode: "online",
      files: []
    }
  ]);
  const [activeSessionId, setActiveSessionId] = useState<string>("session-1");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const currentSession = sessions.find(s => s.id === activeSessionId) || sessions[0];

  // Hydrate workspace data layers from IndexedDB on startup
  useEffect(() => {
    const hydrateLocalCache = async () => {
      try {
        const savedSessions = await localforage.getItem<ChatSession[]>("sessions");
        if (savedSessions && savedSessions.length > 0) {
          setSessions(savedSessions);
          
          // Detect active state layout configurations
          const active = savedSessions.find(s => s.id === activeSessionId);
          if (active) {
            setGlobalMode(active.executionMode);
            if (active.files.length > 0) {
              const pooledCorpus = active.files.map(f => f.content).join("\n\n");
              await indexTextData(pooledCorpus);
            }
          }
        }
      } catch (err) {
        console.error("IndexedDB client hydration exception:", err);
      }
    };
    hydrateLocalCache();
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [currentSession?.messages]);

  // Sync state index changes across active knowledge domains
  const recompileWorkspaceVectorContext = async (targetFiles: WorkspaceFile[]) => {
    if (targetFiles.length === 0) return;
    const pooledCorpus = targetFiles.map(f => f.content).join("\n\n");
    try {
      await indexTextData(pooledCorpus);
    } catch (e) {
      console.error("Vector structural update skipped:", e);
    }
  };

  const updateActiveSessionData = (newMessages: Message[], dynamicFiles: WorkspaceFile[]): void => {
    setSessions(prev => {
      const updated = prev.map((s) => {
        if (s.id === activeSessionId) {
          return { ...s, messages: newMessages, files: dynamicFiles };
        }
        return s;
      });
      // Stream runtime snapshot down into non-volatile device storage safely
      localforage.setItem("sessions", updated).catch(console.error);
      return updated;
    });
  };

  const handleCreateNewSession = (): void => {
    if (currentSession && currentSession.messages.length <= 1 && currentSession.files.length === 0) {
      setSidebarOpen(false);
      return; 
    }

    const newId = `session-${Date.now()}`;
    const newSession: ChatSession = {
      id: newId,
      title: `Workspace Unit`,
      messages: [
        { 
          id: `msg-${Date.now()}`,
          role: "assistant", 
          content: `Workspace ready. Upload PDFs right into the tray stack.` 
        }
      ],
      executionMode: globalMode,
      files: []
    };
    
    setSessions([newSession, ...sessions]);
    setActiveSessionId(newId);
    setSidebarOpen(false);
  };

  const executeAIEngineCycle = async (historyTrack: Message[], workingFiles = currentSession.files): Promise<void> => {
    const lastUserMessage = [...historyTrack].reverse().find(m => m.role === "user");
    if (!lastUserMessage) return;

    let vectorContextResult = "";
    if (workingFiles.length > 0) {
      try {
        vectorContextResult = await queryLocalVectorDB(lastUserMessage.content);
      } catch (e) {
        // Fallback: pool standard chunk bounds
        vectorContextResult = workingFiles.map(f => f.content).join("\n").slice(0, 3500);
      }
    }

    const structuredPrompt = vectorContextResult 
      ? `[WORKSPACE CONTEXT MATRIX]\n${vectorContextResult}\n[END CONTEXT]\n\nQuery: ${lastUserMessage.content}`
      : lastUserMessage.content;

    const systemPrompt = `You are Biruk.ai, a specialized document intelligence and interactive learning assistant. Your core identity is to help users break down, analyze, and query their uploaded knowledge bases.

CRITICAL RESPONSE RULES:
1. NEVER mention backend structural terms like "[WORKSPACE CONTEXT MATRIX]", "[DOCUMENT CONTEXT]", or "[END CONTEXT]" under any circumstances.
2. Do not use awkward structural phrasing like "Based on the text segment provided..." or "According to the file...". 
3. Speak naturally, directly, and with a helpful, peer-to-peer developer voice. Integrate facts seamlessly as if you natively know them from the context.
4. Keep introductions and conclusions punchy. Avoid robotic summary wrap-ups unless explicitly asked.

${vectorContextResult ? `
CRITICAL RETRIEVAL INSTRUCTION:
A custom document is loaded. Review the text provided inside the context boundaries carefully.
- Prioritize facts and answers explicitly located within the context blocks to answer the user's question accurately.
- If the context does not contain sufficient details, weave in your general knowledge, but explicitly state that the details weren't found in their uploaded file.
` : "Greet the user with warm professionalism as Biruk.ai and invite them to start a conversation or drop a PDF to begin deep analysis."}`;

    const processedHistory = historyTrack.map(m => m.id === lastUserMessage.id ? { ...m, content: structuredPrompt } : m);
    const chatMessages = [{ role: "system", content: systemPrompt }, ...processedHistory.slice(-6)];

    if (currentSession.executionMode === "online") {
      setIsCloudLoading(true);
      try {
        const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${process.env.NEXT_PUBLIC_CLOUD_AI_API_KEY || ""}`,
            "Content-Type": "application/json"
          },
          body: JSON.stringify({ model: "llama-3.1-8b-instant", messages: chatMessages.map(({role, content}) => ({role, content})) })
        });
        const data = await response.json();
        const cloudAnswer = data.choices?.[0]?.message?.content || "No message payload returned.";
        updateActiveSessionData([...historyTrack, { id: `msg-${Date.now()}`, role: "assistant", content: cloudAnswer }], workingFiles);
      } catch (err: any) {
        updateActiveSessionData([...historyTrack, { id: `msg-${Date.now()}`, role: "assistant", content: `Network disconnect: ${err.message}` }], workingFiles);
      } finally {
        setIsCloudLoading(false);
      }
    } else {
      if (!engine) {
        updateActiveSessionData([...historyTrack, { id: `msg-${Date.now()}`, role: "assistant", content: "Activate your local execution instance engine first." }], workingFiles);
        return;
      }
      try {
        const reply = await engine.chat.completions.create({ messages: chatMessages as any });
        updateActiveSessionData([...historyTrack, { id: `msg-${Date.now()}`, role: "assistant", content: reply.choices?.[0]?.message?.content || "" }], workingFiles);
      } catch (err) {
        updateActiveSessionData([...historyTrack, { id: `msg-${Date.now()}`, role: "assistant", content: "Local runtime exception processing thread." }], workingFiles);
      }
    }
  };

  const handleSendMessage = async (): Promise<void> => {
    if (!input.trim()) return;
    const userMsg: Message = { id: `msg-${Date.now()}`, role: "user", content: input };
    const updated = [...currentSession.messages, userMsg];
    updateActiveSessionData(updated, currentSession.files);
    setInput("");
    await executeAIEngineCycle(updated);
  };

  const handleEditMessage = async (messageId: string, newContent: string): Promise<void> => {
    const targetIdx = currentSession.messages.findIndex(m => m.id === messageId);
    if (targetIdx === -1) return;

    const historicalSlice = currentSession.messages.slice(0, targetIdx);
    const updatedUserMsg: Message = { ...currentSession.messages[targetIdx], content: newContent };
    const absoluteHistoryTree = [...historicalSlice, updatedUserMsg];
    
    updateActiveSessionData(absoluteHistoryTree, currentSession.files);
    await executeAIEngineCycle(absoluteHistoryTree);
  };

  const handleDeleteMessage = (messageId: string): void => {
    const targetIdx = currentSession.messages.findIndex(m => m.id === messageId);
    if (targetIdx === -1) return;
    const trimmedHistoryTree = currentSession.messages.filter((_, idx) => idx !== targetIdx && idx !== targetIdx + 1);
    updateActiveSessionData(trimmedHistoryTree, currentSession.files);
  };

  // Multiple File Processing Engine Hook (Completely Silent Chat Stream)
  const handleFileUpload = async (e: ChangeEvent<HTMLInputElement>, replaceFileId?: string): Promise<void> => {
    const file = e.target.files?.[0];
    if (!file) return;

    setFileError(null);
    setIsProcessingFile(true);
    const reader = new FileReader();
    
    reader.onload = async function (this: FileReader) {
      try {
        const pdfjs = await import("pdfjs-dist");
        pdfjs.GlobalWorkerOptions.workerSrc = new URL("pdfjs-dist/build/pdf.worker.mjs", import.meta.url).toString();

        const typedArray = new Uint8Array(this.result as ArrayBuffer);
        const pdf = await pdfjs.getDocument({ data: typedArray }).promise;
        let extractedText = "";
        
        for (let i = 1; i <= pdf.numPages; i++) {
          const page = await pdf.getPage(i);
          const content = await page.getTextContent();
          extractedText += content.items.map((item: any) => ("str" in item ? item.str : "")).join(" ") + "\n";
        }
        
        let targetFilesMap = [...currentSession.files];

        if (replaceFileId) {
          targetFilesMap = targetFilesMap.map(f => f.id === replaceFileId ? { ...f, name: file.name, content: extractedText } : f);
        } else {
          targetFilesMap.push({ id: `file-${Date.now()}`, name: file.name, content: extractedText });
        }

        await recompileWorkspaceVectorContext(targetFilesMap);

        // Silent interface refresh injection
        updateActiveSessionData(currentSession.messages, targetFilesMap);
      } catch (err) {
        setFileError("File array structure compile error.");
      } finally {
        setIsProcessingFile(false);
      }
    };
    reader.readAsArrayBuffer(file);
  };

  // Updated: Completely Silent File Removal Interface Hook
  const handleRemoveFile = async (fileId: string) => {
    const remainingFiles = currentSession.files.filter(f => f.id !== fileId);
    await recompileWorkspaceVectorContext(remainingFiles);

    // Kept 100% silent by routing currentSession.messages directly
    updateActiveSessionData(currentSession.messages, remainingFiles);
  };

  return (
    <div className="min-h-screen bg-[#080c14] text-slate-100 flex overflow-hidden font-sans antialiased">
      <Sidebar 
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        sessions={sessions}
        activeSessionId={activeSessionId}
        onSelectSession={(id) => {
          setActiveSessionId(id);
          const targetSession = sessions.find(s => s.id === id);
          if (targetSession) {
            setGlobalMode(targetSession.executionMode);
            recompileWorkspaceVectorContext(targetSession.files).catch(console.error);
          }
          setSidebarOpen(false);
        }}
        onCreateSession={handleCreateNewSession}
      />

      <div className="flex-1 md:ml-72 flex flex-col h-screen overflow-hidden bg-gradient-to-b from-[#080c14] to-[#05080e]">
        <ChatHeader 
          executionMode={currentSession.executionMode}
          onModeChange={(mode) => {
            setGlobalMode(mode);
            setSessions(prev => {
              const updated = prev.map((s) => s.id === activeSessionId ? { ...s, executionMode: mode } : s);
              localforage.setItem("sessions", updated).catch(console.error);
              return updated;
            });
          }}
          engineReady={!!engine}
          status={status}
          initEngine={initEngine}
          onMenuClick={() => setSidebarOpen(true)}
        />

        <MessageList 
          messages={currentSession.messages}
          isProcessingFile={isProcessingFile}
          isCloudLoading={isCloudLoading}
          fileError={fileError}
          messagesEndRef={messagesEndRef}
          onEditMessage={handleEditMessage}
          onDeleteMessage={handleDeleteMessage}
        />

        <ChatInput 
          input={input}
          onInputChange={setInput}
          onSendMessage={handleSendMessage}
          onFileUpload={handleFileUpload}
          onRemoveFile={handleRemoveFile}
          uploadedFiles={currentSession.files}
          executionMode={currentSession.executionMode}
        />
      </div>
    </div>
  );
}