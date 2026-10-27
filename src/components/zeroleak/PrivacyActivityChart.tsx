'use client';

import React, { useState } from 'react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { TIME_RANGE_DATA } from '@/services/zeroleak-mock';
import { useZeroLeak } from '@/context/ZeroLeakContext';
import { Zap, Activity } from 'lucide-react';

export function PrivacyActivityChart() {
  const { metrics } = useZeroLeak();
  const [timeRange, setTimeRange] = useState<'24h' | '7d' | '30d'>('24h');
  const data = TIME_RANGE_DATA[timeRange];
  const hasActivity = metrics.totalQueries > 0;

  return (
    <div className="bg-white rounded-xl border border-slate-200/80 p-5 shadow-2xs flex flex-col justify-between">
      {/* Chart Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
        <div>
          <h2 className="text-sm font-bold text-slate-900 tracking-tight">
            Privacy Activity & Interceptions Over Time
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Comparison of AI queries inspected vs confidential data tokens sanitized.
          </p>
        </div>

        {/* Time range buttons */}
        <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-lg self-start sm:self-auto">
          {(['24h', '7d', '30d'] as const).map((range) => (
            <button
              key={range}
              onClick={() => setTimeRange(range)}
              className={`px-2.5 py-1 text-xs font-semibold rounded-md transition-all ${
                timeRange === range
                  ? 'bg-white text-blue-600 shadow-2xs font-bold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {range}
            </button>
          ))}
        </div>
      </div>

      {/* Chart Visualization */}
      <div className="relative h-64 w-full">
        {!hasActivity && (
          <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-white/60 backdrop-blur-[1px] text-center p-4">
            <Activity className="w-8 h-8 text-slate-300 mb-2" />
            <p className="text-xs font-semibold text-slate-700">No inspection activity recorded yet</p>
            <p className="text-[11px] text-slate-500 mt-0.5 max-w-sm">
              Prompts and code passed through the Secure AI Gateway will plot telemetry here in real-time.
            </p>
          </div>
        )}
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
            <defs>
              <linearGradient id="colorQueries" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.25} />
                <stop offset="95%" stopColor="#3B82F6" stopOpacity={0.0} />
              </linearGradient>
              <linearGradient id="colorSanitized" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#10B981" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#10B981" stopOpacity={0.0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
            <XAxis
              dataKey="time"
              axisLine={false}
              tickLine={false}
              tick={{ fill: '#64748B', fontSize: 11 }}
            />
            <YAxis
              axisLine={false}
              tickLine={false}
              tick={{ fill: '#64748B', fontSize: 11 }}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: '#0F172A',
                borderColor: '#334155',
                borderRadius: '8px',
                color: '#F8FAFC',
                fontSize: '12px',
                boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.3)',
              }}
              formatter={(value, name) => [
                Number(value).toLocaleString(),
                name === 'inspectedQueries' ? 'Inspected AI Queries' : 'Sanitized Tokens',
              ]}
              labelStyle={{ fontWeight: 600, color: '#94A3B8', marginBottom: '4px' }}
            />
            <Area
              type="monotone"
              dataKey="inspectedQueries"
              stroke="#3B82F6"
              strokeWidth={2}
              fillOpacity={1}
              fill="url(#colorQueries)"
              name="inspectedQueries"
            />
            <Area
              type="monotone"
              dataKey="sanitizedTokens"
              stroke="#10B981"
              strokeWidth={2}
              fillOpacity={1}
              fill="url(#colorSanitized)"
              name="sanitizedTokens"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Chart Footer & Legend */}
      <div className="pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-blue-500" />
            <span className="text-slate-600 font-medium">
              Inspected AI Queries ({metrics.totalQueries.toLocaleString()})
            </span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
            <span className="text-slate-600 font-medium">
              Sanitized Tokens ({metrics.itemsRedacted.toLocaleString()})
            </span>
          </div>
        </div>

        <div className="flex items-center gap-1 text-[11px] text-slate-500 font-mono">
          <Zap className="w-3 h-3 text-amber-500" />
          <span>Latency overhead: {hasActivity ? '<14ms avg' : '0ms (standby)'}</span>
        </div>
      </div>
    </div>
  );
}
