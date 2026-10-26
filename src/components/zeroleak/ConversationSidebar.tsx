'use client';

import React, { useState } from 'react';
import { useZeroLeak } from '@/context/ZeroLeakContext';
import { Plus, Search, Lock } from 'lucide-react';

export function ConversationSidebar() {
  const {
    conversations,
    activeConversationId,
    setActiveConversationId,
    createNewChat,
  } = useZeroLeak();

  const [filterTab, setFilterTab] = useState<'all' | 'protected' | 'archived'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const filtered = conversations.filter((c) => {
    if (filterTab === 'protected' && c.status === 'clean') return false;
    if (filterTab === 'archived') return false;
    if (searchQuery.trim()) {
      return c.title.toLowerCase().includes(searchQuery.toLowerCase());
    }
    return true;
  });

  const todayList = filtered.filter((c) => c.timeGroup === 'today');
  const yesterdayList = filtered.filter((c) => c.timeGroup === 'yesterday');
  const prevList = filtered.filter((c) => c.timeGroup === 'previous_7_days');

  return (
    <div className="w-72 bg-slate-50/90 border-r border-slate-200 flex flex-col shrink-0 h-full select-none">
      {/* Top Header & New Chat */}
      <div className="p-3 border-b border-slate-200 space-y-2">
        <button
          onClick={createNewChat}
          className="w-full flex items-center justify-center gap-2 py-2 px-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold shadow-xs transition-colors"
        >
          <Plus className="w-4 h-4" />
          <span>New Chat</span>
        </button>

        {/* Search Input */}
        <div className="relative">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search conversations..."
            className="w-full pl-8 pr-3 py-1.5 text-xs bg-white border border-slate-200 rounded-lg text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
        </div>

        {/* Filter Pills */}
        <div className="flex items-center gap-1 bg-slate-200/60 p-0.5 rounded-lg text-[11px]">
          {(['all', 'protected', 'archived'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setFilterTab(tab)}
              className={`flex-1 py-1 rounded-md font-medium capitalize transition-all ${
                filterTab === tab
                  ? 'bg-white text-slate-900 shadow-2xs font-bold'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              {tab === 'all' ? 'All Chats' : tab === 'protected' ? 'Protected' : 'Archived'}
            </button>
          ))}
        </div>
      </div>

      {/* Grouped Conversations */}
      <div className="flex-1 overflow-y-auto p-2 space-y-4">
        {/* Today */}
        {todayList.length > 0 && (
          <div>
            <div className="px-2 mb-1 text-[10px] font-bold text-slate-600 uppercase tracking-wider font-mono">
              Today
            </div>
            <div className="space-y-1">
              {todayList.map((conv) => (
                <button
                  key={conv.id}
                  onClick={() => setActiveConversationId(conv.id)}
                  className={`w-full text-left p-2.5 rounded-lg text-xs transition-all ${
                    activeConversationId === conv.id
                      ? 'bg-white border border-slate-200/90 shadow-2xs text-slate-900 font-semibold'
                      : 'text-slate-600 hover:bg-slate-200/50 hover:text-slate-900'
                  }`}
                >
                  <div className="flex items-start justify-between gap-1">
                    <span className="truncate flex-1 font-medium text-slate-900">{conv.title}</span>
                    <span className="text-[10px] text-slate-400 whitespace-nowrap">{conv.timestamp}</span>
                  </div>
                  <div className="flex items-center justify-between mt-1 text-[11px]">
                    <span className="text-slate-500 truncate max-w-[120px]">{conv.model}</span>
                    {conv.status === 'redacted' && (
                      <span className="text-[10px] font-semibold px-1.5 py-0.2 rounded-full bg-rose-50 text-rose-700 border border-rose-200">
                        {conv.redactedCount ?? 3} Redacted
                      </span>
                    )}
                    {conv.status === 'blocked' && (
                      <span className="text-[10px] font-semibold px-1.5 py-0.2 rounded-full bg-rose-100 text-rose-800 border border-rose-300">
                        Blocked
                      </span>
                    )}
                    {conv.status === 'clean' && (
                      <span className="text-[10px] font-semibold px-1.5 py-0.2 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                        Clean ✓
                      </span>
                    )}
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Yesterday */}
        {yesterdayList.length > 0 && (
          <div>
            <div className="px-2 mb-1 text-[10px] font-bold text-slate-600 uppercase tracking-wider font-mono">
              Yesterday
            </div>
            <div className="space-y-1">
              {yesterdayList.map((conv) => (
                <button
                  key={conv.id}
                  onClick={() => setActiveConversationId(conv.id)}
                  className={`w-full text-left p-2.5 rounded-lg text-xs transition-all ${
                    activeConversationId === conv.id
                      ? 'bg-white border border-slate-200/90 shadow-2xs text-slate-900 font-semibold'
                      : 'text-slate-600 hover:bg-slate-200/50 hover:text-slate-900'
                  }`}
                >
                  <div className="flex items-start justify-between gap-1">
                    <span className="truncate flex-1 font-medium text-slate-900">{conv.title}</span>
                    <span className="text-[10px] text-slate-400">{conv.timestamp}</span>
                  </div>
                  <div className="flex items-center justify-between mt-1 text-[11px]">
                    <span className="text-slate-500 truncate max-w-[120px]">{conv.model}</span>
                    <span className="text-[10px] font-semibold px-1.5 py-0.2 rounded-full bg-rose-50 text-rose-700 border border-rose-200">
                      {conv.redactedCount ?? 2} Redacted
                    </span>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Previous 7 Days */}
        {prevList.length > 0 && (
          <div>
            <div className="px-2 mb-1 text-[10px] font-bold text-slate-600 uppercase tracking-wider font-mono">
              Previous 7 Days
            </div>
            <div className="space-y-1">
              {prevList.map((conv) => (
                <button
                  key={conv.id}
                  onClick={() => setActiveConversationId(conv.id)}
                  className={`w-full text-left p-2.5 rounded-lg text-xs transition-all ${
                    activeConversationId === conv.id
                      ? 'bg-white border border-slate-200/90 shadow-2xs text-slate-900 font-semibold'
                      : 'text-slate-600 hover:bg-slate-200/50 hover:text-slate-900'
                  }`}
                >
                  <div className="flex items-start justify-between gap-1">
                    <span className="truncate flex-1 font-medium text-slate-900">{conv.title}</span>
                    <span className="text-[10px] text-slate-400">{conv.timestamp}</span>
                  </div>
                  <div className="flex items-center justify-between mt-1 text-[11px]">
                    <span className="text-slate-500 truncate max-w-[120px]">{conv.model}</span>
                    <span className="text-[10px] font-semibold px-1.5 py-0.2 rounded-full bg-rose-50 text-rose-700 border border-rose-200">
                      {conv.redactedCount ?? 4} Redacted
                    </span>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Bottom status bar */}
      <div className="p-3 border-t border-slate-200 bg-slate-100/70 text-[11px] text-slate-600 space-y-1">
        <div className="flex items-center justify-between">
          <span className="flex items-center gap-1.5">
            <Lock className="w-3.5 h-3.5 text-blue-600" />
            Ephemeral Storage
          </span>
          <span className="font-mono font-bold text-slate-700">0 Raw Secrets</span>
        </div>
        <div className="flex items-center gap-1.5 text-emerald-700 text-[10px]">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
          <span>Real time ZeroLeak Active</span>
        </div>
      </div>
    </div>
  );
}
