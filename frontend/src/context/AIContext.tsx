"use client";

import React, { createContext, useContext, useState, ReactNode } from "react";

// The AI Context acts as a central nervous system for the app.
// It tracks what the user is currently doing (active states, molecules, UI focus)
// so the AI can provide hyper-contextual insights.

interface AIContextProps {
  currentModule: string; // e.g., 'dashboard', 'stack-simulator'
  setCurrentModule: (module: string) => void;
  activePathologies: string[];
  setActivePathologies: (pathologies: string[]) => void;
  activeStack: any[];
  setActiveStack: (stack: any[]) => void;
  integrityScore: number;
  setIntegrityScore: (score: number) => void;
  
  // Chat / Assistant State
  isAssistantOpen: boolean;
  setIsAssistantOpen: (open: boolean) => void;
  triggerAIAnalysis: (customPrompt?: string) => void;

  // Visualization State
  viewPerspective: 'topology' | 'anatomy' | 'pharma' | 'physics';
  setViewPerspective: (mode: 'topology' | 'anatomy' | 'pharma' | 'physics') => void;
}

const AIContext = createContext<AIContextProps | undefined>(undefined);

export function AIProvider({ children }: { children: ReactNode }) {
  const [currentModule, setCurrentModule] = useState<string>("dashboard");
  const [activePathologies, setActivePathologies] = useState<string[]>([]);
  const [activeStack, setActiveStack] = useState<any[]>([]);
  const [integrityScore, setIntegrityScore] = useState<number>(100);
  const [isAssistantOpen, setIsAssistantOpen] = useState<boolean>(false);
  const [viewPerspective, setViewPerspective] = useState<'topology' | 'anatomy' | 'pharma' | 'physics'>('topology');

  const triggerAIAnalysis = (customPrompt?: string) => {
    setIsAssistantOpen(true);
    // In the future, this will ping the FastAPI backend with the current context
    console.log("Triggering AI Analysis with Context:", {
      module: currentModule,
      pathologies: activePathologies,
      stack: activeStack,
      score: integrityScore,
      perspective: viewPerspective,
      prompt: customPrompt
    });
  };

  return (
    <AIContext.Provider value={{
      currentModule, setCurrentModule,
      activePathologies, setActivePathologies,
      activeStack, setActiveStack,
      integrityScore, setIntegrityScore,
      isAssistantOpen, setIsAssistantOpen,
      triggerAIAnalysis,
      viewPerspective, setViewPerspective
    }}>
      {children}
    </AIContext.Provider>
  );
}

export function useAI() {
  const context = useContext(AIContext);
  if (!context) {
    throw new Error("useAI must be used within an AIProvider");
  }
  return context;
}
