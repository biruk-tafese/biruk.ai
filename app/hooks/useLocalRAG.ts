"use client";

import { useState, useRef } from "react";
import { CreateMLCEngine, MLCEngineInterface } from "@mlc-ai/web-llm";

interface VectorItem {
  text: string;
  embedding: number[];
}

export function useLocalRAG() {
  const [engine, setEngine] = useState<MLCEngineInterface | null>(null);
  const [status, setStatus] = useState<string>("Idle");
  const [progress, setProgress] = useState<number>(0);
  
  const vectorStore = useRef<VectorItem[]>([]);
  const embedderRef = useRef<any>(null);

  const initEngine = async (): Promise<void> => {
    try {
      setStatus("Waking up your browser's AI core...");
      const modelId = "Qwen2.5-1.5B-Instruct-q4f16_1-MLC"; 
      
      const chatEngine = await CreateMLCEngine(modelId, {
        initProgressCallback: (report) => {
          const currentProgress = Math.round(report.progress * 100);
          setProgress(currentProgress);
          setStatus(`Downloading offline brain: ${currentProgress}%`);
        },
      });
      
      setEngine(chatEngine);
      setStatus("Ready");
    } catch (error) {
      console.error("WebGPU Initialization Failed:", error);
      setStatus("Offline engine unavailable (Requires WebGPU support)");
    }
  };

  const getEmbedder = async () => {
    if (embedderRef.current) return embedderRef.current;
    
    const { pipeline } = await import("@huggingface/transformers");
    embedderRef.current = await pipeline("feature-extraction", "Xenova/all-MiniLM-L6-v2", {
      device: "webgpu",
    });
    return embedderRef.current;
  };

  const indexTextData = async (rawText: string): Promise<void> => {
    try {
      setStatus("Reading your document securely on your device...");
      const chunks = rawText.match(/[^.!?]+[.!?]+(\s|$)/g) || [rawText];
      
      const embedder = await getEmbedder();
      vectorStore.current = [];
      
      for (const chunk of chunks) {
        if (chunk.trim().length < 15) continue;
        
        const output = await embedder(chunk, { pooling: "mean", normalize: true });
        
        if (!output?.data) continue;
        const embeddingArray = Array.from(output.data as Float32Array);
        
        vectorStore.current.push({
          text: chunk,
          embedding: embeddingArray,
        });
      }
      setStatus("Document loaded into memory!");
    } catch (error) {
      console.error("Failed to index vector text data:", error);
      setStatus("Couldn't process document");
    }
  };

  const queryLocalVectorDB = async (queryText: string, k = 3): Promise<string> => {
    try {
      if (vectorStore.current.length === 0) return "";

      const embedder = await getEmbedder();
      
      const queryOutput = await embedder(queryText, { pooling: "mean", normalize: true });
      if (!queryOutput?.data) return "";
      const queryEmbedding = Array.from(queryOutput.data as Float32Array);

      const scores = vectorStore.current.map((item) => {
        const similarity = item.embedding.reduce((sum, val, idx) => sum + val * queryEmbedding[idx], 0);
        return { text: item.text, similarity };
      });

      scores.sort((a, b) => b.similarity - a.similarity);
      return scores.slice(0, k).map(s => s.text).join("\n");
    } catch (error) {
      console.error("Vector search query execution hit an exception:", error);
      return "";
    }
  };

  return { initEngine, indexTextData, queryLocalVectorDB, engine, status, progress };
}