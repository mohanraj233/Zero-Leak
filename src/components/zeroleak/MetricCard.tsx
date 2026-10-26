'use client';

import React from 'react';
import { LucideIcon } from 'lucide-react';

interface MetricCardProps {
  title: string;
  value: string | number;
  unit?: string;
  badge?: {
    text: string;
    variant: 'success' | 'warning' | 'danger' | 'info' | 'neutral';
  };
  subtitleTop?: string;
  subtitleBottom?: string;
  icon: LucideIcon;
  iconColor?: string;
  iconBg?: string;
  secondaryMetric?: {
    title: string;
    value: string | number;
    badgeText?: string;
    subtext?: string;
  };
}

export function MetricCard({
  title,
  value,
  unit,
  badge,
  subtitleTop,
  subtitleBottom,
  icon: Icon,
  iconColor = 'text-blue-600',
  iconBg = 'bg-blue-50',
  secondaryMetric,
}: MetricCardProps) {
  let badgeStyles = 'bg-slate-100 text-slate-700 border-slate-200';
  if (badge?.variant === 'success') {
    badgeStyles = 'bg-emerald-50 text-emerald-700 border-emerald-200/80';
  } else if (badge?.variant === 'warning') {
    badgeStyles = 'bg-amber-50 text-amber-700 border-amber-200/80';
  } else if (badge?.variant === 'danger') {
    badgeStyles = 'bg-rose-50 text-rose-700 border-rose-200/80';
  } else if (badge?.variant === 'info') {
    badgeStyles = 'bg-blue-50 text-blue-700 border-blue-200/80';
  }

  return (
    <div className="bg-white rounded-xl border border-slate-200/80 p-4 shadow-2xs hover:shadow-xs transition-shadow flex flex-col justify-between">
      {/* Top Header */}
      <div className="flex items-center justify-between gap-2 mb-2">
        <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 font-mono">
          {title}
        </span>
        <div className={`w-8 h-8 rounded-lg ${iconBg} flex items-center justify-center shrink-0`}>
          <Icon className={`w-4 h-4 ${iconColor}`} />
        </div>
      </div>

      {/* Main Metric Value */}
      <div className="flex items-baseline gap-2 mb-2">
        <span className="text-2xl lg:text-3xl font-extrabold text-slate-900 tracking-tight font-sans">
          {typeof value === 'number' ? value.toLocaleString() : value}
        </span>
        {unit && <span className="text-xs font-medium text-slate-500">{unit}</span>}
        {badge && (
          <span
            className={`text-[11px] font-semibold px-2 py-0.5 rounded-full border ${badgeStyles} ml-auto`}
          >
            {badge.text}
          </span>
        )}
      </div>

      {/* Subtitles & Extra Breakdown */}
      <div className="pt-2 border-t border-slate-100 space-y-1 text-xs">
        {subtitleTop && (
          <div className="flex items-center justify-between text-slate-600">
            <span className="text-[11px]">{subtitleTop}</span>
          </div>
        )}
        {subtitleBottom && (
          <div className="flex items-center justify-between text-slate-500 font-medium">
            <span className="text-[11px]">{subtitleBottom}</span>
          </div>
        )}

        {/* Optional Secondary Sub-Metric (e.g. for Items Redacted vs Blocked) */}
        {secondaryMetric && (
          <div className="mt-2 pt-2 border-t border-dashed border-slate-200 flex items-center justify-between">
            <div>
              <span className="text-[10px] uppercase font-bold text-slate-400 font-mono">
                {secondaryMetric.title}
              </span>
              <div className="text-sm font-bold text-slate-800">
                {secondaryMetric.value}
              </div>
            </div>
            {secondaryMetric.badgeText && (
              <span className="text-[10px] font-semibold px-1.5 py-0.5 bg-rose-50 text-rose-700 rounded border border-rose-200">
                {secondaryMetric.badgeText}
              </span>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
