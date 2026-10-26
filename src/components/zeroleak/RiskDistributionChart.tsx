'use client';

import React from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { RISK_DISTRIBUTION_DATA } from '@/services/zeroleak-mock';
import { ShieldCheck } from 'lucide-react';

export function RiskDistributionChart() {
  return (
    <div className="bg-white rounded-xl border border-slate-200/80 p-5 shadow-2xs flex flex-col justify-between">
      {/* Header */}
      <div className="flex items-center justify-between mb-2">
        <div>
          <h2 className="text-sm font-bold text-slate-900 tracking-tight">Risk Distribution</h2>
          <p className="text-xs text-slate-500">All outbound model requests</p>
        </div>
        <span className="text-[10px] uppercase font-mono px-2 py-0.5 bg-slate-100 text-slate-600 rounded">
          Pre-Filter
        </span>
      </div>

      {/* Donut Chart with Center Text */}
      <div className="relative h-48 w-full flex items-center justify-center">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={RISK_DISTRIBUTION_DATA}
              cx="50%"
              cy="50%"
              innerRadius={55}
              outerRadius={75}
              paddingAngle={3}
              dataKey="value"
            >
              {RISK_DISTRIBUTION_DATA.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} stroke="none" />
              ))}
            </Pie>
            <Tooltip
              contentStyle={{
                backgroundColor: '#0F172A',
                borderColor: '#334155',
                borderRadius: '8px',
                color: '#F8FAFC',
                fontSize: '12px',
              }}
              formatter={(value, name) => [`${value}% (${RISK_DISTRIBUTION_DATA.find(d => d.name === name)?.count} queries)`, name]}
            />
          </PieChart>
        </ResponsiveContainer>

        {/* Center Text inside Donut */}
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none text-center">
          <span className="text-xl font-extrabold text-slate-900 leading-none">1,284</span>
          <span className="text-[10px] text-slate-500 font-medium mt-0.5">Total Queries</span>
        </div>
      </div>

      {/* Legend Grid */}
      <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-100">
        {RISK_DISTRIBUTION_DATA.map((item) => (
          <div key={item.name} className="flex items-center justify-between text-xs">
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: item.color }} />
              <span className="text-slate-600 truncate">{item.name}</span>
            </div>
            <span className="font-semibold text-slate-900 ml-1">{item.value}%</span>
          </div>
        ))}
      </div>

      {/* Zero Persistent Plaintext Security Callout Box */}
      <div className="mt-3 p-2.5 rounded-lg bg-emerald-50/70 border border-emerald-200/80 flex items-start gap-2">
        <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
        <div className="text-[11px] leading-tight text-emerald-950">
          <span className="font-bold text-emerald-800">Zero Persistent Plaintext: </span>
          Prompts scrubbed in ephemeral worker memory before transit to LLMs.
        </div>
      </div>
    </div>
  );
}
