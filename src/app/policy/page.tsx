'use client';

import React from 'react';
import { useZeroLeak } from '@/context/ZeroLeakContext';
import { ZeroLeakHeader } from '@/components/zeroleak/ZeroLeakHeader';
import { PolicyRuleTable } from '@/components/zeroleak/PolicyRuleTable';
import {
  ShieldAlert,
  Download,
  Terminal,
  Save,
  Layers,
  Lock,
  Cpu,
} from 'lucide-react';

export default function PolicySettingsPage() {
  const {
    savePolicyChanges,
    exportRulesetJson,
    setRegexModalOpen,
    categories,
    metrics,
  } = useZeroLeak();

  const totalActiveRules = categories.reduce((sum, c) => sum + c.activeRulesCount, 0);

  return (
    <div className="flex flex-col min-h-full">
      {/* Page Header */}
      <ZeroLeakHeader
        pageTitle="Policy Settings & DLP Governance"
        pageSubtitle="Configure automated loss prevention heuristics, high-fidelity redaction triggers, monitored AI endpoints, and volatile ephemeral memory policies."
        badgeText="ENGINE V2.4 (HYBRID REGEX + PRESIDIO)"
      />

      <main className="flex-1 p-6 space-y-6 max-w-7xl w-full mx-auto">
        {/* Action Controls & Engine Summary Banner (Matching reference) */}
        <div className="bg-white rounded-xl border border-slate-200/80 p-4 shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-slate-900 to-slate-800 text-white flex items-center justify-center shadow-xs">
              <Lock className="w-5 h-5 text-emerald-400" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-slate-900 font-mono">
                  ZEROLEAK POLICY ENGINE V2.4
                </span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                  Armed (Fail-Closed)
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Strict egress sanitization enforced before payloads reach external providers.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5 flex-wrap">
            <button
              onClick={exportRulesetJson}
              className="px-3.5 py-2 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 rounded-lg text-xs font-semibold shadow-2xs transition-colors flex items-center gap-1.5"
            >
              <Download className="w-3.5 h-3.5 text-slate-500" />
              <span>Export Ruleset (JSON)</span>
            </button>

            <button
              onClick={() => setRegexModalOpen(true)}
              className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-lg text-xs font-bold transition-colors flex items-center gap-1.5"
            >
              <Terminal className="w-3.5 h-3.5 text-indigo-600" />
              <span>Test Regex Sandbox</span>
            </button>

            <button
              onClick={savePolicyChanges}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold shadow-xs transition-colors flex items-center gap-1.5"
            >
              <Save className="w-3.5 h-3.5" />
              <span>Save Changes</span>
            </button>
          </div>
        </div>

        {/* 3 Overview Stat Cards (Matching Zero Leak UI.pdf) */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Stat 1: Active Categories */}
          <div className="bg-white rounded-xl border border-slate-200/80 p-4 shadow-2xs flex items-center justify-between">
            <div>
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider font-mono">
                ACTIVE CATEGORIES
              </span>
              <div className="text-2xl font-extrabold text-slate-900 mt-1">
                4 <span className="text-sm font-semibold text-slate-400">/ 4 active</span>
              </div>
              <div className="text-[11px] text-emerald-600 font-semibold mt-1">
                Full coverage enabled ({totalActiveRules} active rules)
              </div>
            </div>
            <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600">
              <Layers className="w-5 h-5" />
            </div>
          </div>

          {/* Stat 2: Hard Blocking Rules */}
          <div className="bg-white rounded-xl border border-slate-200/80 p-4 shadow-2xs flex items-center justify-between">
            <div>
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider font-mono">
                HARD BLOCKING RULES
              </span>
              <div className="text-2xl font-extrabold text-slate-900 mt-1">
                2 <span className="text-sm font-semibold text-slate-400">categories active</span>
              </div>
              <div className="text-[11px] text-rose-600 font-semibold mt-1">
                AWS Keys & Root Secrets
              </div>
            </div>
            <div className="w-10 h-10 rounded-xl bg-rose-50 flex items-center justify-center text-rose-600">
              <ShieldAlert className="w-5 h-5" />
            </div>
          </div>

          {/* Stat 3: Monitored Gateways */}
          <div className="bg-white rounded-xl border border-slate-200/80 p-4 shadow-2xs flex items-center justify-between">
            <div>
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider font-mono">
                MONITORED GATEWAYS
              </span>
              <div className="text-2xl font-extrabold text-slate-900 mt-1">
                {metrics.monitoredGatewaysCount}{' '}
                <span className="text-sm font-semibold text-slate-400">
                  / {metrics.totalGatewaysCount} targets
                </span>
              </div>
              <div className="text-[11px] text-slate-600 font-medium mt-1">
                66.7% AI egress sealed • Claude / Gemini
              </div>
            </div>
            <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-600">
              <Cpu className="w-5 h-5" />
            </div>
          </div>
        </div>

        {/* Categories & Rules Workspace */}
        <PolicyRuleTable />
      </main>
    </div>
  );
}
