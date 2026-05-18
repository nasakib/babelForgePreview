"use client";

import { useAI } from "@/context/AIContext";
import { useState } from "react";

export default function AIAssistant() {
  const { isAssistantOpen, setIsAssistantOpen, currentModule, activePathologies, activeStack, integrityScore } = useAI();
  const [messages, setMessages] = useState<{role: 'ai' | 'user', content: string}[]>([
    { role: 'ai', content: 'babelForge Clinical Assistant initialized. How can I assist with your current simulation?' }
  ]);
  const [input, setInput] = useState("");

  if (!isAssistantOpen) {
    return (
      <button 
        onClick={() => setIsAssistantOpen(true)}
        className="fixed bottom-6 right-6 bg-indigo-600 hover:bg-indigo-700 text-white rounded-full p-4 shadow-xl z-50 transition-transform hover:scale-105"
      >
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z"></path></svg>
      </button>
    );
  }

  const handleSend = async () => {
    if (!input.trim()) return;
    
    // Add user message
    const newMessages = [...messages, { role: 'user' as const, content: input }];
    setMessages(newMessages);
    setInput("");

    // Build context
    const context = {
      module: currentModule,
      pathologies: activePathologies,
      stack: activeStack.map(s => ({ name: s.name, dose: s.currentIntensity })),
      integrityScore: integrityScore
    };

    try {
      const backendUrl = process.env.NEXT_PUBLIC_API_URL || "https://babelforge-backend-6zvkkshyoq-uc.a.run.app";
      const response = await fetch(`${backendUrl}/api/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: input, context })
      });
      const data = await response.json();
      setMessages([...newMessages, { role: 'ai', content: data.response }]);
    } catch (e) {
      setMessages([...newMessages, { role: 'ai', content: "Error connecting to AI Backend." }]);
    }
  };

  return (
    <div className="fixed bottom-6 right-6 w-80 md:w-96 bg-white border border-slate-200 rounded-2xl shadow-2xl z-50 flex flex-col overflow-hidden animate-fade-in-up">
      {/* Header */}
      <div className="bg-slate-900 p-4 flex justify-between items-center text-white">
        <div className="flex items-center gap-2">
          <svg className="w-5 h-5 text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z"></path></svg>
          <span className="font-bold text-sm tracking-widest uppercase">babelForge AI</span>
        </div>
        <button onClick={() => setIsAssistantOpen(false)} className="text-slate-400 hover:text-white">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
        </button>
      </div>

      {/* Context Badge */}
      <div className="bg-slate-50 p-2 text-center border-b border-slate-100">
        <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Active Context: {currentModule}</span>
      </div>

      {/* Messages */}
      <div className="flex-1 h-64 overflow-y-auto p-4 space-y-3 custom-scrollbar bg-slate-50/50">
        {messages.map((msg, i) => (
          <div key={i} className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'}`}>
            <span className={`text-[9px] uppercase tracking-widest font-bold mb-1 ${msg.role === 'user' ? 'text-indigo-400' : 'text-slate-400'}`}>
              {msg.role === 'user' ? 'You' : 'System'}
            </span>
            <div className={`p-3 rounded-xl text-xs leading-relaxed max-w-[85%] ${msg.role === 'user' ? 'bg-indigo-600 text-white rounded-br-none' : 'bg-white border border-slate-200 text-slate-700 rounded-bl-none shadow-sm'}`}>
              {msg.content}
            </div>
          </div>
        ))}
      </div>

      {/* Input */}
      <div className="p-3 bg-white border-t border-slate-100 flex items-center gap-2">
        <input 
          type="text" 
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSend()}
          placeholder="Ask the AI co-pilot..." 
          className="flex-1 bg-slate-50 border border-slate-200 text-xs rounded-lg px-3 py-2 focus:outline-none focus:border-indigo-500"
        />
        <button onClick={handleSend} className="bg-indigo-600 hover:bg-indigo-700 text-white p-2 rounded-lg transition-colors">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 5l7 7m0 0l-7 7m7-7H3"></path></svg>
        </button>
      </div>
    </div>
  );
}