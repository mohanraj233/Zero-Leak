'use client';

import React from 'react';
import { useZeroLeak } from '@/context/ZeroLeakContext';
import {
  Search,
  ShieldCheck,
  FileText,
  ChevronDown,
  Sparkles,
} from 'lucide-react';

interface ZeroLeakHeaderProps {
  pageTitle: string;
  pageSubtitle?: string;
  badgeText?: string;
}

export function ZeroLeakHeader({
  pageTitle,
  pageSubtitle,
  badgeText = 'Protection Guard Standby (v2.4 Engine)',
}: ZeroLeakHeaderProps) {
  const { selectedModel, setSelectedModel, setAuditModalOpen } = useZeroLeak();

  const modelOptions = [
    'Gemini 3.8 Flash (Server Proxy)',
    'Claude 3.5 Sonnet (Proxy)',
    'GPT-OSS 120B (Proxy)',
    'Claude Opus 4.6 (Proxy)',
  ];

  return (
    <header className="bg-white border-b border-slate-200/80 px-6 py-3.5 sticky top-0 z-30 flex flex-col md:flex-row md:items-center justify-between gap-4">
      {/* Title & Status Area */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2.5 flex-wrap">
          <span className="text-xs font-semibold uppercase tracking-wider text-blue-600 bg-blue-50 border border-blue-200/70 px-2 py-0.5 rounded-md font-mono">
            ZeroLeak AI DLP Module
          </span>
          <span className="inline-flex items-center gap-1.5 text-xs text-slate-700 bg-slate-100 border border-slate-200 px-2.5 py-0.5 rounded-full font-medium">
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
            {badgeText}
          </span>
        </div>
        <h1 className="text-xl font-bold text-slate-900 tracking-tight mt-1 flex items-center gap-2">
          {pageTitle}
        </h1>
        {pageSubtitle && (
          <p className="text-xs text-slate-500 mt-0.5 line-clamp-1 max-w-2xl">{pageSubtitle}</p>
        )}
      </div>

      {/* Global Search Bar (⌘K search) */}
      <div className="hidden lg:flex items-center relative max-w-xs w-full">
        <Search className="w-4 h-4 text-slate-400 absolute left-3 pointer-events-none" />
        <input
          type="text"
          placeholder="Search projects, findings, audit logs..."
          className="w-full pl-9 pr-12 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
        />
        <kbd className="absolute right-2.5 top-2 text-[10px] font-mono bg-white text-slate-400 px-1.5 py-0.5 rounded border border-slate-200 shadow-2xs">
          ⌘K
        </kbd>
      </div>

      {/* Controls & Model Selector */}
      <div className="flex items-center gap-2.5 shrink-0">
        {/* Model Selector Dropdown */}
        <div className="relative group">
          <div className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-lg text-xs font-medium text-slate-700 cursor-pointer transition-colors">
            <Sparkles className="w-3.5 h-3.5 text-blue-600" />
            <span className="truncate max-w-[140px] md:max-w-[180px]">{selectedModel}</span>
            <ChevronDown className="w-3 h-3 text-slate-400 ml-1" />
          </div>

          <div className="absolute right-0 top-full mt-1.5 w-64 bg-white border border-slate-200 rounded-xl shadow-xl p-1.5 hidden group-hover:block hover:block z-50">
            <div className="px-2.5 py-1 text-[11px] font-semibold text-slate-400 uppercase tracking-wider font-mono">
              Target Monitored Models
            </div>
            {modelOptions.map((model) => (
              <button
                key={model}
                onClick={() => setSelectedModel(model)}
                className={`w-full text-left px-2.5 py-2 rounded-lg text-xs flex items-center justify-between transition-colors ${
                  selectedModel === model
                    ? 'bg-blue-50 text-blue-700 font-semibold'
                    : 'text-slate-700 hover:bg-slate-50'
                }`}
              >
                <span>{model}</span>
                {selectedModel === model && <ShieldCheck className="w-3.5 h-3.5 text-blue-600" />}
              </button>
            ))}
          </div>
        </div>

        {/* Audit Log Trigger */}
        <button
          onClick={() => setAuditModalOpen(true)}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 rounded-lg text-xs font-medium shadow-2xs transition-colors"
        >
          <FileText className="w-3.5 h-3.5 text-slate-500" />
          <span>Audit Log</span>
        </button>
      </div>
    </header>
  );
}
