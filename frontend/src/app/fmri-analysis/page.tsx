"use client";

import { useState, useRef } from "react";
import NeuroCanvas from "@/components/NeuroCanvas";
import { useAI } from "@/context/AIContext";

export default function FMRIAnalysis() {
  const { triggerAIAnalysis } = useAI();
  const [file, setFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<any>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  const handleUpload = async () => {
    if (!file) return;

    setIsUploading(true);
    setAnalysisResult(null);

    const formData = new FormData();
    formData.append("file", file);

    try {
      const backendUrl = process.env.NEXT_PUBLIC_API_URL || "https://babelforge-backend-6zvkkshyoq-uc.a.run.app";
      const response = await fetch(`${backendUrl}/api/fmri/analyze`, {
        method: "POST",
        body: formData,
      });
      
      const data = await response.json();
      setAnalysisResult(data);
    } catch (error) {
      console.error("Upload failed", error);
      alert("Failed to connect to the backend analysis engine.");
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="flex-1 flex flex-col lg:flex-row overflow-y-auto lg:overflow-hidden w-full lg:h-[calc(100vh-3.5rem)]">
      {/* Left Sidebar: Controls */}
      <div className="w-full lg:w-[350px] bg-surface-0 border-r border-line flex-none overflow-y-auto custom-scrollbar p-6 shadow-sm shrink-0 flex flex-col">
        <h2 className="text-xl font-bold text-ink mb-1">fMRI Data Upload</h2>
        <p className="text-xs text-ink-muted mb-6 leading-relaxed">
          Upload raw or pre-processed fMRI BOLD signal data (e.g., .nii.gz, .csv matrices) to generate a patient-specific topological model.
        </p>

        <div className="clinical-card p-4 text-center">
          <input 
            type="file" 
            ref={fileInputRef} 
            onChange={handleFileChange} 
            className="hidden" 
            accept=".csv,.nii,.gz,.json"
          />
          <button 
            onClick={() => fileInputRef.current?.click()}
            className="w-full py-8 border-2 border-dashed border-accent-500/30 hover:border-accent-400 bg-accent-500/5 hover:bg-accent-500/10 rounded-clinical transition-colors flex flex-col items-center justify-center gap-2 mb-4 cursor-pointer"
          >
            <svg className="w-8 h-8 text-accent-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"></path></svg>
            <span className="text-sm font-bold text-accent-200">Select File</span>
            <span className="text-[10px] text-ink-muted">.nii, .gz, .csv, .json</span>
          </button>

          {file && (
            <div className="text-xs font-mono text-ink-subtle mb-4 truncate px-2 bg-surface-100 py-2 rounded border border-line">
              {file.name} ({(file.size / 1024).toFixed(1)} KB)
            </div>
          )}

          <button 
            onClick={handleUpload}
            disabled={!file || isUploading}
            className={`w-full text-ink text-xs font-bold uppercase tracking-widest py-3 rounded-clinical shadow-md flex items-center justify-center gap-2 transition-all ${
              !file || isUploading ? 'bg-slate-400 cursor-not-allowed' : 'btn-primary'
            }`}
          >
            {isUploading ? (
              <>
                <svg className="w-4 h-4 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path></svg>
                Processing...
              </>
            ) : (
              'Upload & Analyze'
            )}
          </button>
        </div>

        {analysisResult && (
          <div className="mt-6 clinical-card p-4 animate-fade-in-up">
            <h3 className="text-xs font-bold text-ink uppercase tracking-widest mb-3 border-b border-line pb-2">Analysis Results</h3>
            
            <div className="space-y-3">
              <div>
                <span className="block text-[9px] uppercase font-bold text-ink-muted">Total Nodes</span>
                <span className="text-sm font-mono font-bold text-accent-500">{analysisResult.topology?.nodes?.length || 0}</span>
              </div>
              <div>
                <span className="block text-[9px] uppercase font-bold text-ink-muted">Total Edges</span>
                <span className="text-sm font-mono font-bold text-accent-500">{analysisResult.topology?.stats?.total_edges || 0}</span>
              </div>
              <div>
                <span className="block text-[9px] uppercase font-bold text-ink-muted">Detected Pathologies</span>
                <div className="flex flex-wrap gap-1 mt-1">
                  {analysisResult.diagnostic_profile?.length > 0 ? (
                    analysisResult.diagnostic_profile.map((path: string, i: number) => (
                      <span key={i} className="bg-crit/20 text-crit text-[9px] font-bold px-2 py-1 rounded">{path}</span>
                    ))
                  ) : (
                    <span className="text-xs text-ink-muted">None detected</span>
                  )}
                </div>
              </div>
            </div>

            <button onClick={() => triggerAIAnalysis(`Analyze the uploaded fMRI topology. The detected pathologies are: ${analysisResult.diagnostic_profile?.join(', ')}. Recommend a pharmacological stack.`)} className="mt-4 w-full bg-accent-500/10 hover:bg-accent-500/15 text-accent-400 text-[10px] font-bold uppercase tracking-widest px-4 py-2 rounded-md transition-all border border-accent-500/30 flex items-center justify-center gap-2">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z"></path></svg>
              Consult babelAI
            </button>
          </div>
        )}
      </div>

      {/* Right Panel: 3D Visualization */}
      <div className="flex-grow bg-canvas m-3 rounded-clinical flex flex-col overflow-hidden relative border border-line-strong">
        <div className="absolute top-6 left-6 z-10 pointer-events-none">
          <div className="flex items-center gap-2 mb-1">
            <div className="w-2 h-2 rounded-full bg-info/100 animate-pulse"></div>
            <span className="text-[10px] font-bold text-info uppercase tracking-widest">Patient Topology Mapping</span>
          </div>
          <h4 className="text-xl font-bold text-ink font-semibold">
            {analysisResult ? 'Custom Scan Data' : 'Awaiting fMRI Upload'}
          </h4>
        </div>

        {isUploading ? (
          <div className="absolute inset-0 flex items-center justify-center bg-canvas/80 backdrop-blur-sm z-20">
            <div className="text-center">
              <svg className="w-12 h-12 text-accent-500 animate-spin mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path></svg>
              <p className="text-ink font-bold tracking-widest uppercase text-sm">Processing BOLD Signals</p>
              <p className="text-ink-muted text-xs mt-2">Computing functional connectivity matrices...</p>
            </div>
          </div>
        ) : null}

        <div className="flex-1 w-full relative">
          <NeuroCanvas />
        </div>
      </div>
    </div>
  );
}