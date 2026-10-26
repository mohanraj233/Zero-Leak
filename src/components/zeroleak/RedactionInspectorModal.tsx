'use client';

import React from 'react';
import { useZeroLeak } from '@/context/ZeroLeakContext';
import { StatusBadge } from './StatusBadge';
import { ShieldCheck, X, Lock, EyeOff } from 'lucide-react';

export function RedactionInspectorModal() {
  const { inspectModalEntity, setInspectModalEntity } = useZeroLeak();

  if (!inspectModalEntity) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-2xl w-full max-h-[85vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="p-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center text-blue-700">
              <EyeOff className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900">
                ZeroLeak Redaction Inspector
              </h3>
              <p className="text-xs text-slate-500">
                {inspectModalEntity.length} sensitive item(s) intercepted before external egress
              </p>
            </div>
          </div>
          <button
            onClick={() => setInspectModalEntity(null)}
            className="p-1 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-200/60 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Table */}
        <div className="p-5 overflow-y-auto space-y-4">
          <div className="rounded-xl border border-slate-200 overflow-hidden">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-100/80 text-[11px] font-mono text-slate-600 uppercase border-b border-slate-200">
                <tr>
                  <th className="py-2.5 px-3">Placeholder Key</th>
                  <th className="py-2.5 px-3">Entity Type</th>
                  <th className="py-2.5 px-3">Detector</th>
                  <th className="py-2.5 px-3">Severity</th>
                  <th className="py-2.5 px-3 text-right">Synthetic Mask</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {inspectModalEntity.map((ent) => (
                  <tr key={ent.id} className="hover:bg-slate-50">
                    <td className="py-2.5 px-3 font-mono font-bold text-blue-600">
                      {ent.placeholder}
                    </td>
                    <td className="py-2.5 px-3 font-medium text-slate-800">
                      {ent.type}
                    </td>
                    <td className="py-2.5 px-3 text-slate-500">
                      {ent.detector}
                    </td>
                    <td className="py-2.5 px-3">
                      <StatusBadge type="severity" value={ent.severity} />
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono text-[11px] text-slate-600">
                      {ent.originalMasked}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Privacy Guarantee Box */}
          <div className="p-3.5 rounded-xl bg-slate-900 text-slate-200 space-y-2">
            <div className="flex items-center gap-2 text-xs font-semibold text-emerald-400">
              <ShieldCheck className="w-4 h-4" />
              Cryptographic In-Memory Mapping Guarantee
            </div>
            <p className="text-[11px] text-slate-300 leading-relaxed">
              Raw credentials and customer PII are strictly scrubbed in volatile server RAM before
              transmitting the sanitized payload to external AI models. Mappings automatically expire
              after response delivery (TTL: 60s). No raw credentials are ever written to database tables.
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="p-3.5 border-t border-slate-200 bg-slate-50 flex items-center justify-between">
          <div className="flex items-center gap-1.5 text-xs text-slate-500">
            <Lock className="w-3.5 h-3.5 text-emerald-600" />
            <span>Volatile Memory Protected</span>
          </div>
          <button
            onClick={() => setInspectModalEntity(null)}
            className="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold shadow-xs transition-colors"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}
