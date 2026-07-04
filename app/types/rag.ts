export type ExecutionMode = "online" | "offline";

export interface Message {
  id: string;
  role: "system" | "user" | "assistant";
  content: string;
}

export interface WorkspaceFile {
  id: string;
  name: string;
  content: string;
}

export interface ChatSession {
  id: string;
  title: string;
  messages: Message[];
  executionMode: ExecutionMode;
  files: WorkspaceFile[]; 
}

export interface RAGHookResult {
  initEngine: () => Promise<void>;
  indexTextData: (rawText: string) => Promise<void>;
  queryLocalVectorDB: (queryText: string, k?: number) => Promise<string>;
  engine: any | null; // Typed loosely by MLC SDK internal interfaces
  status: string;
  progress: number;
}