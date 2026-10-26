'use client';

import React from 'react';
import { useZeroLeak } from '@/context/ZeroLeakContext';
import { ZeroLeakHeader } from '@/components/zeroleak/ZeroLeakHeader';
import { ConversationSidebar } from '@/components/zeroleak/ConversationSidebar';
import { SecureChatPanel } from '@/components/zeroleak/SecureChatPanel';
import { ChatComposer } from '@/components/zeroleak/ChatComposer';
import { Plus, Trash2 } from 'lucide-react';

export default function SecureAiChatPage() {
  const { createNewChat, clearActiveChat } = useZeroLeak();

  return (
    <div className="flex flex-col h-full min-h-screen">
      {/* Page Header */}
      <ZeroLeakHeader
        pageTitle="ZeroLeak Secure AI Chat"
        pageSubtitle="Your prompts, source files, and credentials are authenticated and sanitized before reaching external LLMs."
        badgeText="Fail-Closed DLP v2.4"
      />

      {/* Main Two-Column Chat Workspace */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Column: Conversation Sidebar */}
        <ConversationSidebar />

        {/* Right Column: Chat History & Composer */}
        <div className="flex-1 flex flex-col min-w-0 bg-white">
          {/* Chat Panel Top Mini-Bar */}
          <div className="px-6 py-2.5 bg-slate-50 border-b border-slate-200 flex items-center justify-between text-xs">
            <div className="flex items-center gap-2">
              <span className="font-semibold text-slate-700">Active Session:</span>
              <span className="font-mono text-slate-500">In-Memory Sandbox Isolated</span>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={clearActiveChat}
                className="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] text-slate-600 hover:text-rose-600 hover:bg-slate-200/60 rounded transition-colors"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Clear Chat</span>
              </button>

              <button
                onClick={createNewChat}
                className="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] bg-slate-200/80 hover:bg-slate-300 text-slate-800 rounded font-semibold transition-colors"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>New Chat</span>
              </button>
            </div>
          </div>

          {/* Chat Stream */}
          <SecureChatPanel />

          {/* Chat Composer */}
          <ChatComposer />
        </div>
      </div>
    </div>
  );
}
