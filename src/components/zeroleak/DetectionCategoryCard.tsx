'use client';

import React from 'react';
import Link from 'next/link';
import { CATEGORY_BREAKDOWN_DATA } from '@/services/zeroleak-mock';
import { StatusBadge } from './StatusBadge';
import { KeyRound, Database, UserCheck, ShieldAlert, Cpu, ArrowRight } from 'lucide-react';

export function DetectionCategoryBreakdown() {
  const getCategoryIcon = (id: string) => {
    switch (id) {
      case 'api_keys':
        return <KeyRound className="w-4 h-4 text-rose-600" />;
      case 'db_credentials':
        return <Database className="w-4 h-4 text-rose-600" />;
      case 'pii':
        return <UserCheck className="w-4 h-4 text-amber-600" />;
      case 'ssh_keys':
        return <ShieldAlert className="w-4 h-4 text-rose-600" />;
      case 'jwt_tokens':
      default:
        return <Cpu className="w-4 h-4 text-orange-600" />;
    }
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200/80 p-5 shadow-2xs">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
        <div>
          <h2 className="text-sm font-bold text-slate-900 tracking-tight">
            Sensitive Data Category Breakdown
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Distribution of detected secrets and PII intercepted before leaving your perimeter.
          </p>
        </div>
        <Link
          href="/policy"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-blue-600 hover:text-blue-700 transition-colors"
        >
          <span>Manage Custom Patterns</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
        {CATEGORY_BREAKDOWN_DATA.map((cat) => (
          <div
            key={cat.id}
            className="p-3.5 rounded-xl border border-slate-200/90 bg-slate-50/50 hover:bg-slate-50 transition-colors flex flex-col justify-between"
          >
            <div className="flex items-start justify-between gap-2 mb-2">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-white border border-slate-200 flex items-center justify-center shadow-2xs">
                  {getCategoryIcon(cat.id)}
                </div>
                <div>
                  <div className="text-xs font-bold text-slate-900">{cat.name}</div>
                </div>
              </div>
              <StatusBadge type="severity" value={cat.severity} size="sm" />
            </div>

            <div className="mt-2">
              <div className="flex items-baseline justify-between text-xs mb-1.5">
                <span className="font-extrabold text-slate-900 text-sm">{cat.count}</span>
                <span className="text-slate-500 font-medium text-[11px]">({cat.percent}%)</span>
              </div>
              {/* Progress Bar */}
              <div className="w-full h-1.5 bg-slate-200 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${cat.color}`}
                  style={{ width: `${cat.percent}%` }}
                />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
