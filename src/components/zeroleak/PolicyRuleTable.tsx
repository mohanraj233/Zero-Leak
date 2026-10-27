'use client';

import React, { useState } from 'react';
import { useZeroLeak } from '@/context/ZeroLeakContext';
import { StatusBadge } from './StatusBadge';
import { PolicyAction, PolicyRule } from '@/types/zeroleak';
import {
  ShieldAlert,
  ShieldCheck,
  ShieldX,
  Shield,
  ChevronRight,
  Info,
  Search,
  Plus,
} from 'lucide-react';

export function PolicyRuleTable() {
  const {
    categories,
    updateRuleAction,
    toggleRuleEnabled,
    updateCategoryDefaultAction,
    addToast,
  } = useZeroLeak();

  const [activeCategoryId, setActiveCategoryId] = useState('pii');
  const [activeSubtab, setActiveSubtab] = useState<'fields' | 'keywords' | 'regex' | 'bulk'>('fields');
  const [ruleSearch, setRuleSearch] = useState('');

  const activeCategory = categories.find((c) => c.id === activeCategoryId) || categories[0];

  const filteredRules = activeCategory.rules.filter((rule) => {
    if (!ruleSearch.trim()) return true;
    const q = ruleSearch.toLowerCase();
    return (
      rule.name.toLowerCase().includes(q) ||
      rule.id.toLowerCase().includes(q) ||
      rule.pattern.toLowerCase().includes(q)
    );
  });

  const actionOptions: { label: string; value: PolicyRule['actionOverride'] }[] = [
    { label: 'Category default', value: 'default' },
    { label: 'Always Hard Block', value: 'block' },
    { label: 'Mask & Forward', value: 'mask' },
    { label: 'Warn & Confirm', value: 'warn' },
    { label: 'Allow (Log Only)', value: 'allow' },
  ];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
      {/* Left Workspace Column: Categories (lg:col-span-4) */}
      <div className="lg:col-span-4 space-y-4">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-slate-900 uppercase tracking-wider font-mono">
            POLICY CATEGORIES ({categories.length})
          </span>
          <button
            onClick={() =>
              addToast({
                type: 'info',
                title: 'Add Category',
                message: 'Custom category creation modal opened (Enterprise tier).',
              })
            }
            className="inline-flex items-center gap-1 text-xs font-semibold text-blue-600 hover:text-blue-700"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Category</span>
          </button>
        </div>

        {/* Category Cards List */}
        <div className="space-y-2.5">
          {categories.map((cat) => {
            const isSelected = cat.id === activeCategoryId;
            return (
              <div
                key={cat.id}
                onClick={() => setActiveCategoryId(cat.id)}
                className={`p-3.5 rounded-xl border transition-all cursor-pointer ${
                  isSelected
                    ? 'bg-white border-blue-500 shadow-xs ring-1 ring-blue-500/20'
                    : 'bg-white hover:bg-slate-50 border-slate-200/90'
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-slate-900">{cat.name}</span>
                      <StatusBadge type="action" value={cat.defaultAction} size="sm" />
                    </div>
                    <div className="text-[11px] text-slate-500 mt-1 line-clamp-1">
                      {cat.rules.length} active rules
                    </div>
                  </div>
                  <ChevronRight
                    className={`w-4 h-4 mt-1 transition-transform ${
                      isSelected ? 'text-blue-600 rotate-90 lg:rotate-0' : 'text-slate-400'
                    }`}
                  />
                </div>
              </div>
            );
          })}
        </div>

        {/* ZeroLeak Guidance Callout Box (Matching reference) */}
        <div className="p-4 rounded-xl bg-slate-900 text-slate-200 border border-slate-800 space-y-2">
          <div className="flex items-center gap-2 text-xs font-bold text-amber-400">
            <Info className="w-4 h-4" />
            <span>ZeroLeak Guidance</span>
          </div>
          <p className="text-[11px] text-slate-300 leading-relaxed">
            To maximize developer velocity without risking data exfiltration, select{' '}
            <span className="text-blue-400 font-semibold">Mask & Forward</span> with volatile
            reversible RAM dictionary. Hard Blocking should only be reserved for cloud credentials
            and cryptographic keys.
          </p>
        </div>
      </div>

      {/* Right Column: Category Rule Details & Table (lg:col-span-8) */}
      <div className="lg:col-span-8 bg-white rounded-xl border border-slate-200/80 p-5 shadow-2xs space-y-5">
        {/* Category Header */}
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 pb-4 border-b border-slate-200">
          <div>
            <div className="flex items-center gap-2.5">
              <h2 className="text-base font-bold text-slate-900">{activeCategory.name} Governance</h2>
              <span className="text-[11px] font-mono px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 font-semibold border border-slate-200">
                {activeCategory.activeRulesCount} Active Rules
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-1 leading-relaxed max-w-xl">
              {activeCategory.description}
            </p>
          </div>

          <div className="shrink-0 text-right">
            <span className="text-[10px] uppercase font-bold text-slate-400 font-mono block">
              Active Protection Status:
            </span>
            <span className="text-xs font-mono font-bold text-blue-600">
              {activeCategory.defaultAction === 'mask'
                ? 'MASK_REVERSIBLE'
                : activeCategory.defaultAction.toUpperCase()}
            </span>
          </div>
        </div>

        {/* Default Category Action Selector Buttons */}
        <div>
          <span className="text-xs font-bold text-slate-700 block mb-2 font-sans">
            Default Category Action:
          </span>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {[
              { id: 'block', label: 'Hard Block', icon: ShieldX, color: 'text-rose-600' },
              { id: 'mask', label: 'Mask & Forward', icon: Shield, color: 'text-blue-600' },
              { id: 'warn', label: 'Warn & Confirm', icon: ShieldAlert, color: 'text-amber-600' },
              { id: 'allow', label: 'Allow (Log Only)', icon: ShieldCheck, color: 'text-emerald-600' },
            ].map((btn) => {
              const Icon = btn.icon;
              const isSelected = activeCategory.defaultAction === btn.id;
              return (
                <button
                  key={btn.id}
                  onClick={() => updateCategoryDefaultAction(activeCategory.id, btn.id as PolicyAction)}
                  className={`p-2.5 rounded-lg border text-xs font-medium flex flex-col items-center justify-center gap-1.5 transition-all ${
                    isSelected
                      ? 'bg-blue-50/70 border-blue-500 text-blue-900 font-bold shadow-2xs'
                      : 'bg-white hover:bg-slate-50 border-slate-200 text-slate-700'
                  }`}
                >
                  <Icon className={`w-4 h-4 ${btn.color}`} />
                  <span>{btn.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Subtabs & Search */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2">
          {/* Subtabs */}
          <div className="flex items-center gap-1 border-b border-slate-200 text-xs w-full sm:w-auto">
            <button
              onClick={() => setActiveSubtab('fields')}
              className={`py-2 px-3 font-semibold border-b-2 transition-all ${
                activeSubtab === 'fields'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              Detection Fields ({activeCategory.rules.length})
            </button>
            <button
              onClick={() => setActiveSubtab('keywords')}
              className={`py-2 px-3 font-semibold border-b-2 transition-all ${
                activeSubtab === 'keywords'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              Keywords & Allowlist (0)
            </button>
            <button
              onClick={() => setActiveSubtab('regex')}
              className={`py-2 px-3 font-semibold border-b-2 transition-all ${
                activeSubtab === 'regex'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              Custom Regex Overrides (0)
            </button>
          </div>

          {/* Search Box */}
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2 pointer-events-none" />
            <input
              type="text"
              value={ruleSearch}
              onChange={(e) => setRuleSearch(e.target.value)}
              placeholder="Filter rules..."
              className="pl-8 pr-3 py-1 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-500 w-full sm:w-44"
            />
          </div>
        </div>

        {/* Policy Rules Table */}
        <div className="overflow-x-auto rounded-lg border border-slate-200">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 font-mono text-[11px] text-slate-500 uppercase border-b border-slate-200">
              <tr>
                <th className="py-2.5 px-3">Pattern & Sensitivity</th>
                <th className="py-2.5 px-3">Detection Rule ID</th>
                <th className="py-2.5 px-3">Action Override / State</th>
                <th className="py-2.5 px-3 text-right">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredRules.map((rule) => (
                <tr key={rule.id} className="hover:bg-slate-50 transition-colors">
                  <td className="py-3 px-3">
                    <div className="font-semibold text-slate-900">{rule.name}</div>
                    <div className="font-mono text-[11px] text-slate-500 mt-0.5 max-w-xs truncate">
                      {rule.pattern}
                    </div>
                  </td>
                  <td className="py-3 px-3 font-mono text-[11px] text-slate-600">
                    <span className="bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                      {rule.id}
                    </span>
                  </td>
                  <td className="py-3 px-3">
                    <select
                      value={rule.actionOverride}
                      onChange={(e) =>
                        updateRuleAction(
                          activeCategory.id,
                          rule.id,
                          e.target.value as PolicyRule['actionOverride']
                        )
                      }
                      className="px-2 py-1 text-xs bg-white border border-slate-200 rounded-md text-slate-700 focus:outline-none focus:ring-1 focus:ring-blue-500 font-medium"
                    >
                      {actionOptions.map((opt) => (
                        <option key={opt.value} value={opt.value}>
                          {opt.label}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td className="py-3 px-3 text-right">
                    <button
                      onClick={() => toggleRuleEnabled(activeCategory.id, rule.id)}
                      className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                        rule.enabled ? 'bg-emerald-500' : 'bg-slate-300'
                      }`}
                    >
                      <span
                        className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                          rule.enabled ? 'translate-x-4' : 'translate-x-0'
                        }`}
                      />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
