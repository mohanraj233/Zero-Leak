'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  ShieldAlert,
  BarChart3,
  MessageSquareLock,
  Sliders,
  ChevronDown,
  Building2,
  Lock,
} from 'lucide-react';

export function ZeroLeakSidebar() {
  const pathname = usePathname();

  const navItems = [
    {
      name: 'ZeroLeak Overview',
      href: '/',
      icon: BarChart3,
      active: pathname === '/' || pathname === '/overview',
    },
    {
      name: 'Secure AI Chat',
      href: '/chat',
      icon: MessageSquareLock,
      active: pathname === '/chat',
    },
    {
      name: 'Policy Settings',
      href: '/policy',
      icon: Sliders,
      active: pathname === '/policy' || pathname === '/settings',
    },
  ];

  return (
    <aside className="w-64 bg-[#0B111E] text-slate-300 flex flex-col shrink-0 border-r border-slate-800/80 min-h-screen select-none">
      {/* Brand & Logo Header */}
      <div className="p-4 border-b border-slate-800/80">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-500 flex items-center justify-center text-white shadow-lg shadow-blue-500/20">
            <ShieldAlert className="w-5 h-5 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-bold text-base tracking-tight text-white font-sans">
                VibeProofLens
              </span>
            </div>
            <p className="text-[11px] text-slate-400 font-medium tracking-wide">
              Discover Risks. Verify Integrity.
            </p>
          </div>
        </div>
      </div>

      {/* Navigation Section */}
      <div className="flex-1 px-3 py-4 space-y-6 overflow-y-auto">
        <div>
          <div className="px-3 mb-2 flex items-center justify-between">
            <span className="text-[11px] font-bold tracking-wider text-slate-400 uppercase font-mono">
              AI SECURITY / ZEROLEAK
            </span>
            <span className="inline-flex items-center gap-1 text-[10px] text-emerald-400 bg-emerald-950/60 border border-emerald-800/50 px-1.5 py-0.5 rounded-full font-mono">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              v2.4
            </span>
          </div>

          <nav className="space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`group flex items-center gap-3 px-3 py-2.5 rounded-lg text-xs font-medium transition-all duration-150 ${
                    item.active
                      ? 'bg-blue-600/15 text-blue-400 border border-blue-500/30 shadow-sm'
                      : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800/60'
                  }`}
                >
                  <Icon
                    className={`w-4 h-4 transition-colors ${
                      item.active ? 'text-blue-400' : 'text-slate-400 group-hover:text-slate-200'
                    }`}
                  />
                  <span className="flex-1">{item.name}</span>
                  {item.active && (
                    <span className="w-1.5 h-1.5 rounded-full bg-blue-400 shadow-sm shadow-blue-400" />
                  )}
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Engine Security Status Box */}
        <div className="mx-1 p-3 rounded-xl bg-slate-900/90 border border-slate-800/90 shadow-inner">
          <div className="flex items-center justify-between text-xs font-semibold text-slate-200 mb-1">
            <span className="flex items-center gap-1.5">
              <Lock className="w-3.5 h-3.5 text-emerald-400" />
              ZeroLeak Engine
            </span>
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 font-mono">
              Active
            </span>
          </div>
          <p className="text-[11px] text-slate-400 leading-relaxed">
            Fail-Closed DLP Guard intercepting external LLM prompts.
          </p>
          <div className="mt-2.5 pt-2 border-t border-slate-800/80 flex items-center justify-between text-[10px] text-slate-400">
            <span>In-Memory RAM TTL</span>
            <span className="text-slate-300 font-mono">60s / Expired</span>
          </div>
        </div>
      </div>

      {/* Bottom Profile & Workspace Controls */}
      <div className="p-3 border-t border-slate-800/80 space-y-2 bg-[#090D17]">
        {/* Workspace Dropdown */}
        <div className="flex items-center justify-between p-2 rounded-lg bg-slate-900 border border-slate-800 text-xs hover:border-slate-700 cursor-pointer transition-colors">
          <div className="flex items-center gap-2 overflow-hidden">
            <Building2 className="w-4 h-4 text-blue-400 shrink-0" />
            <span className="truncate font-medium text-slate-200 text-[11px]">
              E-Commerce App (Production)
            </span>
          </div>
          <ChevronDown className="w-3.5 h-3.5 text-slate-400 shrink-0" />
        </div>

        {/* User Card */}
        <div className="flex items-center gap-2.5 p-2 rounded-lg hover:bg-slate-800/50 transition-colors cursor-pointer">
          <div className="relative">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-bold text-xs ring-1 ring-slate-700">
              JD
            </div>
            <span className="absolute bottom-0 right-0 w-2 h-2 rounded-full bg-emerald-400 ring-2 ring-[#0B111E]" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-xs font-medium text-slate-200 truncate">John Doe</div>
            <div className="text-[10px] text-slate-400 truncate">Vibe Coder</div>
          </div>
        </div>
      </div>
    </aside>
  );
}
