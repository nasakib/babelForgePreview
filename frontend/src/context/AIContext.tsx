"use client";

import React, { createContext, useContext, useState, useEffect, useMemo, ReactNode } from "react";
import { selectInsights, type RankedInsight } from "@/lib/wisdom/select";

const STORAGE_KEY = "babelforge:state:v1";

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

  /**
   * Wisdom — top-ranked, citation-grounded insights derived from the
   * current ambient state. Recomputed (cheaply, in-memory) on any state
   * change. Consumed by the AI assistant for grounding and by UI panels
   * that want to surface evidence contextually.
   */
  wisdom: RankedInsight[];
}

const AIContext = createContext<AIContextProps | undefined>(undefined);

export function AIProvider({ children }: { children: ReactNode }) {
  const [currentModule, setCurrentModule] = useState<string>("dashboard");
  const [activePathologies, setActivePathologies] = useState<string[]>([]);
  const [activeStack, setActiveStack] = useState<any[]>([]);
  const [integrityScore, setIntegrityScore] = useState<number>(100);
  const [isAssistantOpen, setIsAssistantOpen] = useState<boolean>(false);
  const [viewPerspective, setViewPerspective] = useState<'topology' | 'anatomy' | 'pharma' | 'physics'>('topology');
  const [hydrated, setHydrated] = useState(false);

  // Hydrate persisted state from localStorage on mount
  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const v = JSON.parse(raw);
        if (Array.isArray(v.activePathologies)) setActivePathologies(v.activePathologies);
        if (Array.isArray(v.activeStack)) setActiveStack(v.activeStack);
        if (typeof v.integrityScore === "number") setIntegrityScore(v.integrityScore);
        if (v.viewPerspective) setViewPerspective(v.viewPerspective);
      }
    } catch {
      /* ignore corrupt persisted state */
    } finally {
      setHydrated(true);
    }
  }, []);

  // Persist on change
  useEffect(() => {
    if (!hydrated || typeof window === "undefined") return;
    try {
      window.localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({ activePathologies, activeStack, integrityScore, viewPerspective })
      );
    } catch {
      /* quota / privacy mode — ignore */
    }
  }, [activePathologies, activeStack, integrityScore, viewPerspective, hydrated]);

  // Derive wisdom from the live ambient state. Pure function, cheap; no
  // need to memoize the corpus itself.
  const wisdom = useMemo<RankedInsight[]>(
    () =>
      selectInsights(
        {
          module: currentModule,
          pathologies: activePathologies,
          stack: (activeStack as any[]).map((s: any) => ({
            id: s.id,
            name: s.name,
            class: s.class,
            dose: s.dose ?? s.currentIntensity,
          })),
          integrity: integrityScore,
        },
        5,
      ),
    [currentModule, activePathologies, activeStack, integrityScore],
  );

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
      viewPerspective, setViewPerspective,
      wisdom,
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
