'use client';

import React, { useState } from 'react';
import { useZeroLeak } from '@/context/ZeroLeakContext';
import { StatusBadge } from './StatusBadge';
import { Search, Filter, ShieldCheck, ShieldX } from 'lucide-react';

export function RecentActivityTable() {
  const { activityLogs } = useZeroLeak();
  const [filterTab, setFilterTab] = useState<'all' | 'masked' | 'blocked' | 'clean'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const filteredLogs = activityLogs.filter((log) => {
    if (filterTab === 'masked' && log.actionEnforced !== 'mask') return false;
    if (filterTab === 'blocked' && log.actionEnforced !== 'block') return false;
    if (filterTab === 'clean' && log.actionEnforced !== 'allow') return false;

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return (
        log.queryExcerpt.toLowerCase().includes(q) ||
        log.detector.toLowerCase().includes(q) ||
        log.entitiesFound.some((e) => e.toLowerCase().includes(q))
      );
    }
    return true;
  });

  return (
    <div className="bg-white rounded-xl border border-slate-200/80 p-5 shadow-2xs">
      {/* Header & Controls */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 mb-4">
        <div>
          <h2 className="text-sm font-bold text-slate-900 tracking-tight">
            Recent Interceptions & Gateway Activity
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Real-time audit records of outbound AI requests inspected and sanitized.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {/* Filter Pills */}
          <div className="flex items-center gap-1 bg-slate-100 p-0.5 rounded-lg text-xs">
            <button
              onClick={() => setFilterTab('all')}
              className={`px-2.5 py-1 rounded-md font-medium transition-all ${
                filterTab === 'all'
                  ? 'bg-white text-slate-900 shadow-2xs font-bold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              All ({activityLogs.length})
            </button>
            <button
              onClick={() => setFilterTab('masked')}
              className={`px-2.5 py-1 rounded-md font-medium transition-all ${
                filterTab === 'masked'
                  ? 'bg-white text-blue-600 shadow-2xs font-bold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Masked
            </button>
            <button
              onClick={() => setFilterTab('blocked')}
              className={`px-2.5 py-1 rounded-md font-medium transition-all ${
                filterTab === 'blocked'
                  ? 'bg-white text-rose-600 shadow-2xs font-bold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Blocked
            </button>
            <button
              onClick={() => setFilterTab('clean')}
              className={`px-2.5 py-1 rounded-md font-medium transition-all ${
                filterTab === 'clean'
                  ? 'bg-white text-emerald-600 shadow-2xs font-bold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Clean
            </button>
          </div>

          {/* Search Box */}
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search telemetry..."
              className="pl-8 pr-3 py-1 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-blue-500 w-40 sm:w-48"
            />
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto rounded-lg border border-slate-200">
        <table className="w-full text-left text-xs">
          <thead className="bg-slate-50 border-b border-slate-200 font-mono text-slate-500 text-[11px] uppercase tracking-wider">
            <tr>
              <th className="py-2.5 px-3">Time</th>
              <th className="py-2.5 px-3">Inspected Prompt / Snippet</th>
              <th className="py-2.5 px-3">Detector</th>
              <th className="py-2.5 px-3">Detected Entities</th>
              <th className="py-2.5 px-3">Risk Level</th>
              <th className="py-2.5 px-3">Action Enforced</th>
              <th className="py-2.5 px-3 text-right">Gateway Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filteredLogs.length === 0 ? (
              <tr>
                <td colSpan={7} className="text-center py-8 text-slate-400">
                  <Filter className="w-6 h-6 mx-auto mb-1 text-slate-300" />
                  No audit logs matching this filter.
                </td>
              </tr>
            ) : (
              filteredLogs.map((log) => (
                <tr key={log.id} className="hover:bg-slate-50/70 transition-colors">
                  <td className="py-2.5 px-3 font-mono text-[11px] text-slate-500 whitespace-nowrap">
                    {log.timestamp}
                  </td>
                  <td className="py-2.5 px-3 font-mono text-slate-800 max-w-xs truncate">
                    {log.queryExcerpt}
                  </td>
                  <td className="py-2.5 px-3 text-slate-600 whitespace-nowrap">
                    {log.detector}
                  </td>
                  <td className="py-2.5 px-3">
                    {log.entitiesFound.length === 0 ? (
                      <span className="text-slate-400 italic">None (Clean)</span>
                    ) : (
                      <div className="flex flex-wrap gap-1">
                        {log.entitiesFound.map((e, i) => (
                          <span
                            key={i}
                            className="text-[10px] bg-slate-100 text-slate-700 px-1.5 py-0.5 rounded border border-slate-200 whitespace-nowrap font-medium"
                          >
                            {e}
                          </span>
                        ))}
                      </div>
                    )}
                  </td>
                  <td className="py-2.5 px-3">
                    <StatusBadge type="severity" value={log.riskLevel} />
                  </td>
                  <td className="py-2.5 px-3">
                    <StatusBadge type="action" value={log.actionEnforced} />
                  </td>
                  <td className="py-2.5 px-3 text-right">
                    {log.gatewayStatus === 'Sanitized' && (
                      <span className="inline-flex items-center gap-1 font-semibold text-blue-700 text-[11px]">
                        <ShieldCheck className="w-3.5 h-3.5 text-blue-600" />
                        Sanitized
                      </span>
                    )}
                    {log.gatewayStatus === 'Blocked' && (
                      <span className="inline-flex items-center gap-1 font-semibold text-rose-700 text-[11px]">
                        <ShieldX className="w-3.5 h-3.5 text-rose-600" />
                        Blocked
                      </span>
                    )}
                    {log.gatewayStatus === 'Passed' && (
                      <span className="inline-flex items-center gap-1 font-semibold text-emerald-700 text-[11px]">
                        <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                        Passed
                      </span>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
