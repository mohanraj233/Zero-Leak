'use client';

import React from 'react';
import { useZeroLeak } from '@/context/ZeroLeakContext';
import { StatusBadge } from './StatusBadge';
import { ShieldCheck, X, FileText, Lock } from 'lucide-react';

export function AuditLogModal() {
  const { auditModalOpen, setAuditModalOpen, activityLogs } = useZeroLeak();

  if (!auditModalOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-3xl w-full max-h-[85vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="p-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-100 flex items-center justify-center text-emerald-700">
              <FileText className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900">
                ZeroLeak Metadata Audit Logs (PostgreSQL Neon Schema)
              </h3>
              <p className="text-xs text-slate-500">
                Immutable tenant-scoped telemetry. Strict compliance: Zero-storage of raw secrets.
              </p>
            </div>
          </div>
          <button
            onClick={() => setAuditModalOpen(false)}
            className="p-1 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-200/60 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 overflow-y-auto space-y-4">
          <div className="p-3 rounded-xl bg-slate-900 text-slate-200 flex items-center justify-between text-xs">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span className="font-semibold text-slate-100">
                Table: zeroLeak_audit_logs (Partition: Default Workspace)
              </span>
            </div>
            <span className="font-mono text-[11px] text-emerald-400 bg-emerald-950 px-2 py-0.5 rounded border border-emerald-800">
              Encrypted At Rest
            </span>
          </div>

          <div className="rounded-xl border border-slate-200 overflow-hidden">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-100/80 font-mono text-[11px] text-slate-600 uppercase border-b border-slate-200">
                <tr>
                  <th className="py-2.5 px-3">Audit ID</th>
                  <th className="py-2.5 px-3">Timestamp</th>
                  <th className="py-2.5 px-3">Model Target</th>
                  <th className="py-2.5 px-3">Masked Count</th>
                  <th className="py-2.5 px-3">Action</th>
                  <th className="py-2.5 px-3">Latency</th>
                  <th className="py-2.5 px-3 text-right">Outcome</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-mono text-slate-700">
                {activityLogs.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="text-center py-12 text-slate-400 font-sans">
                      <FileText className="w-7 h-7 mx-auto mb-2 text-slate-300" />
                      <p className="text-xs font-semibold text-slate-700">No audit records found</p>
                      <p className="text-[11px] text-slate-500 mt-0.5">
                        Operational metadata will log here upon query execution in the connected backend.
                      </p>
                    </td>
                  </tr>
                ) : (
                  activityLogs.map((log) => (
                    <tr key={log.id} className="hover:bg-slate-50">
                      <td className="py-2.5 px-3 text-slate-500">{log.id}</td>
                      <td className="py-2.5 px-3">{log.timestamp}</td>
                      <td className="py-2.5 px-3 font-sans font-medium text-slate-900">
                        {log.model}
                      </td>
                      <td className="py-2.5 px-3 font-bold text-blue-600">
                        {log.entitiesFound.length} token(s)
                      </td>
                      <td className="py-2.5 px-3">
                        <StatusBadge type="action" value={log.actionEnforced} />
                      </td>
                      <td className="py-2.5 px-3 text-slate-500">{log.latencyMs}ms</td>
                      <td className="py-2.5 px-3 text-right font-sans font-semibold">
                        <span
                          className={
                            log.gatewayStatus === 'Blocked'
                              ? 'text-rose-600'
                              : log.gatewayStatus === 'Sanitized'
                              ? 'text-blue-600'
                              : 'text-emerald-600'
                          }
                        >
                          {log.gatewayStatus}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Footer */}
        <div className="p-3.5 border-t border-slate-200 bg-slate-50 flex items-center justify-between">
          <div className="flex items-center gap-1.5 text-xs text-slate-500">
            <Lock className="w-3.5 h-3.5 text-slate-400" />
            <span>Zero raw secrets or unmasked prompts ever logged.</span>
          </div>
          <button
            onClick={() => setAuditModalOpen(false)}
            className="px-4 py-1.5 bg-slate-800 hover:bg-slate-900 text-white rounded-lg text-xs font-semibold shadow-xs transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
