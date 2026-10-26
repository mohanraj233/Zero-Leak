'use client';

import React, { useState } from 'react';
import { useZeroLeak } from '@/context/ZeroLeakContext';
import {
  ShieldAlert,
  ShieldCheck,
  Eye,
  EyeOff,
  Copy,
  Check,
  GitPullRequest,
  FileCode,
  FileCheck2,
  Sparkles,
  Lock,
} from 'lucide-react';

export function SecureChatPanel() {
  const {
    activeConversation,
    setInspectModalEntity,
    addToast,
  } = useZeroLeak();

  const [reversibleSafeView, setReversibleSafeView] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);
  const [gitPatchApplied, setGitPatchApplied] = useState(false);
  const [payloadConfirmed, setPayloadConfirmed] = useState(false);

  if (!activeConversation) {
    return (
      <div className="flex-1 flex items-center justify-center p-8 text-center text-slate-400">
        <div>
          <ShieldAlert className="w-12 h-12 mx-auto text-slate-300 mb-2" />
          <p className="text-sm font-semibold">No Conversation Selected</p>
          <p className="text-xs text-slate-400 mt-1">Select or start a new secure chat session.</p>
        </div>
      </div>
    );
  }

  const handleCopyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
    addToast({
      type: 'info',
      title: 'Code Copied',
      message: 'Remediation snippet copied to clipboard.',
    });
  };

  const handleApplyGitPatch = () => {
    setGitPatchApplied(true);
    addToast({
      type: 'success',
      title: 'Git Patch Staged',
      message: 'Isolated git patch created for review in workspace branch fix/zeroleak-remediation.',
    });
  };

  const handleConfirmPayload = () => {
    setPayloadConfirmed(!payloadConfirmed);
    addToast({
      type: 'success',
      title: payloadConfirmed ? 'Payload Unconfirmed' : 'Safe Payload Confirmed',
      message: payloadConfirmed
        ? 'Payload verification reset to pending.'
        : 'ZeroLeak human sign-off approved for sanitized surrogate transmission.',
    });
  };

  const hasRedactions = activeConversation.messages.some(
    (m) => m.entitiesDetected && m.entitiesDetected.length > 0
  );

  const allDetectedEntities = activeConversation.messages.flatMap(
    (m) => m.entitiesDetected || []
  );

  return (
    <div className="flex-1 flex flex-col h-full overflow-y-auto bg-white p-4 lg:p-6 space-y-4">
      {/* Top Security Banner (Matching Zero Leak UI.pdf) */}
      {hasRedactions && (
        <div className="rounded-xl border border-rose-300/80 bg-rose-50/60 p-4 shadow-2xs animate-in fade-in">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-start gap-3">
              <div className="w-9 h-9 rounded-xl bg-rose-100 border border-rose-200 flex items-center justify-center text-rose-600 shrink-0 mt-0.5">
                <ShieldAlert className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold uppercase tracking-wider text-rose-800 font-mono">
                    High Risk Intercepted
                  </span>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-600 text-white uppercase font-mono">
                    BLOCK & MASK ACTIVE
                  </span>
                </div>
                <p className="text-xs text-rose-900 mt-1 leading-relaxed">
                  <span className="font-bold">{allDetectedEntities.length} sensitive credentials</span> detected in prompt stream. Sanitized surrogates provided to external provider.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
              <button
                onClick={() => setInspectModalEntity(allDetectedEntities)}
                className="px-3 py-1.5 bg-white hover:bg-slate-50 text-slate-800 border border-slate-300 rounded-lg text-xs font-semibold shadow-2xs transition-colors flex items-center gap-1.5"
              >
                <Eye className="w-3.5 h-3.5 text-blue-600" />
                <span>Inspect Redactions ({allDetectedEntities.length})</span>
              </button>

              <button
                onClick={handleConfirmPayload}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold shadow-2xs transition-colors flex items-center gap-1.5 ${
                  payloadConfirmed
                    ? 'bg-emerald-600 text-white'
                    : 'bg-blue-600 hover:bg-blue-700 text-white'
                }`}
              >
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>{payloadConfirmed ? 'Payload Verified ✓' : 'Confirm Safe Payload'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Messages Stream */}
      <div className="flex-1 space-y-6">
        {activeConversation.messages.map((message) => {
          if (message.sender === 'user') {
            return (
              <div key={message.id} className="space-y-3">
                {/* User Header */}
                <div className="flex items-center gap-2 text-xs text-slate-500">
                  <div className="w-6 h-6 rounded-full bg-gradient-to-tr from-blue-600 to-indigo-600 text-white flex items-center justify-center font-bold text-[10px]">
                    JD
                  </div>
                  <span className="font-semibold text-slate-800">You (John Doe)</span>
                  <span>•</span>
                  <span>{message.timestamp}</span>
                </div>

                {/* Prompt Text */}
                <div className="text-xs leading-relaxed text-slate-800 bg-slate-50 border border-slate-200/80 rounded-xl p-3.5 max-w-3xl">
                  {message.content.split('\n\n')[0]}
                </div>

                {/* Intercepted Snippet Card */}
                {message.codeSnippets && message.codeSnippets.length > 0 && (
                  <div className="max-w-3xl rounded-xl border border-slate-300 bg-slate-900 text-slate-200 overflow-hidden shadow-sm">
                    {/* Snippet Header */}
                    <div className="px-4 py-2 bg-slate-950/80 border-b border-slate-800 flex items-center justify-between text-xs font-mono">
                      <div className="flex items-center gap-2">
                        <FileCode className="w-4 h-4 text-blue-400" />
                        <span className="text-slate-300 font-semibold">
                          {message.codeSnippets[0].filename}
                        </span>
                      </div>
                      <button
                        onClick={() => setReversibleSafeView(!reversibleSafeView)}
                        className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-[11px] text-slate-200 font-sans font-medium transition-colors border border-slate-700"
                      >
                        {reversibleSafeView ? <EyeOff className="w-3 h-3 text-amber-400" /> : <Eye className="w-3 h-3 text-emerald-400" />}
                        <span>{reversibleSafeView ? 'Raw Masked View' : 'Reversible Safe View'}</span>
                      </button>
                    </div>

                    {/* Code Lines with Highlights */}
                    <div className="p-4 font-mono text-xs overflow-x-auto space-y-1.5 bg-[#0B111E]">
                      {reversibleSafeView ? (
                        <div className="space-y-1 text-slate-300">
                          <div>
                            const stripe = require(&apos;stripe&apos;)( <span className="bg-emerald-950 text-emerald-400 px-1 py-0.5 rounded font-bold">&apos;sk_live_••••••••••••3847&apos;</span> ); <span className="text-slate-500">{'// [Restored for Authorized Session]'}</span>
                          </div>
                          <div>
                            const dbUri = <span className="bg-emerald-950 text-emerald-400 px-1 py-0.5 rounded font-bold">&apos;postgresql://admin_usr:••••••••@ep-cool-fog-1928.../prod_db&apos;</span> ; <span className="text-slate-500">{'// [PostgreSQL URI]'}</span>
                          </div>
                          <div>
                            const adminEmail = <span className="bg-emerald-950 text-emerald-400 px-1 py-0.5 rounded font-bold">&apos;security-team@internal-corp.io&apos;</span> ; <span className="text-slate-500">{'// [Corporate PII]'}</span>
                          </div>
                        </div>
                      ) : (
                        <div className="space-y-1 text-slate-300">
                          <div>
                            const stripe = require(&apos;stripe&apos;)( <span className="bg-rose-950/80 text-rose-400 border border-rose-800 px-1.5 py-0.5 rounded font-bold">&lt;SECRET_1&gt;</span> ); <span className="text-slate-500">{'// [Redacted: Stripe Live Secret Key]'}</span>
                          </div>
                          <div>
                            const dbUri = <span className="bg-rose-950/80 text-rose-400 border border-rose-800 px-1.5 py-0.5 rounded font-bold">&lt;DATABASE_CREDENTIAL_1&gt;</span> ; <span className="text-slate-500">{'// [Redacted: Neon PostgreSQL URL]'}</span>
                          </div>
                          <div>
                            const adminEmail = <span className="bg-amber-950/80 text-amber-400 border border-amber-800 px-1.5 py-0.5 rounded font-bold">&lt;EMAIL_1&gt;</span> ; <span className="text-slate-500">{'// [Redacted: PII Email]'}</span>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Footer bar */}
                    <div className="px-4 py-2 bg-slate-950 border-t border-slate-800 flex items-center justify-between text-[11px] text-slate-400">
                      <div className="flex items-center gap-1.5">
                        <Lock className="w-3.5 h-3.5 text-blue-400" />
                        <span>
                          Sanitized by ZeroLeak Gateway • 3 Entities Redacted • Forwarded safely to Gemini 3.8 Flash
                        </span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          }

          if (message.sender === 'assistant') {
            return (
              <div key={message.id} className="space-y-3 pt-2">
                {/* Assistant Header */}
                <div className="flex items-center gap-2 text-xs">
                  <div className="w-6 h-6 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-[10px]">
                    <Sparkles className="w-3.5 h-3.5 text-blue-600" />
                  </div>
                  <span className="font-bold text-slate-900">{message.model || 'Gemini 3.8 Flash (Medium)'}</span>
                  <span className="text-slate-400">•</span>
                  <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.2 rounded-full">
                    <ShieldCheck className="w-3 h-3 text-emerald-600" />
                    Safe Response
                  </span>
                  <span className="text-slate-400">•</span>
                  <span className="text-slate-500">{message.timestamp}</span>
                </div>

                {/* Assistant Answer Body */}
                <div className="text-xs leading-relaxed text-slate-800 max-w-3xl whitespace-pre-wrap">
                  {message.content}
                </div>

                {/* Remediation Snippet */}
                {message.remediationSnippet && (
                  <div className="max-w-3xl rounded-xl border border-slate-200 bg-slate-900 text-slate-200 overflow-hidden shadow-xs">
                    <div className="px-4 py-2 bg-slate-950 border-b border-slate-800 flex items-center justify-between text-xs font-mono">
                      <span className="text-slate-300 font-semibold">
                        {message.remediationSnippet.title}
                      </span>
                      <button
                        onClick={() => handleCopyCode(message.remediationSnippet!.code)}
                        className="inline-flex items-center gap-1 text-[11px] text-slate-400 hover:text-white transition-colors"
                      >
                        {copiedCode ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                        <span>{copiedCode ? 'Copied' : 'Copy Code'}</span>
                      </button>
                    </div>
                    <pre className="p-4 font-mono text-xs overflow-x-auto text-emerald-400 bg-[#0B111E]">
                      {message.remediationSnippet.code}
                    </pre>
                  </div>
                )}

                {/* Security Note Alert Callout */}
                {message.securityNote && (
                  <div className="max-w-3xl p-3.5 rounded-xl bg-blue-50/80 border border-blue-200 text-blue-950 text-xs leading-relaxed flex items-start gap-2.5">
                    <ShieldCheck className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                    <div>
                      <span className="font-bold text-blue-900">Security Note: </span>
                      {message.securityNote}
                    </div>
                  </div>
                )}

                {/* Apply Git Patch Action */}
                <div className="flex items-center gap-3 pt-1">
                  <button
                    onClick={handleApplyGitPatch}
                    disabled={gitPatchApplied}
                    className={`inline-flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
                      gitPatchApplied
                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-300 cursor-default'
                        : 'bg-slate-900 hover:bg-slate-800 text-white shadow-xs'
                    }`}
                  >
                    <GitPullRequest className="w-3.5 h-3.5" />
                    <span>{gitPatchApplied ? 'Git Patch Staged ✓' : 'Apply Git Patch'}</span>
                  </button>
                </div>
              </div>
            );
          }

          if (message.sender === 'system') {
            return (
              <div
                key={message.id}
                className="max-w-3xl p-4 rounded-xl border border-rose-300 bg-rose-50 text-rose-950 text-xs leading-relaxed space-y-1.5"
              >
                <div className="flex items-center gap-2 font-bold text-rose-800 uppercase tracking-wide font-mono">
                  <ShieldAlert className="w-4 h-4 text-rose-600" />
                  <span>Request Blocked by ZeroLeak Gateway (Fail-Closed Policy)</span>
                </div>
                <p className="text-rose-900 whitespace-pre-wrap">{message.content}</p>
              </div>
            );
          }

          return null;
        })}
      </div>

      {/* Payload Attachments preview pills (Matching reference) */}
      <div className="pt-2 border-t border-slate-200 flex flex-wrap items-center gap-2">
        <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider font-mono mr-1">
          Payload Attachments:
        </span>
        <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-100 border border-slate-200 text-xs text-slate-700 font-mono">
          <FileCode className="w-3.5 h-3.5 text-blue-600" />
          <span>auth-handler.ts (14.2 KB)</span>
          <span className="px-1.5 py-0.2 rounded-full bg-rose-100 text-rose-700 font-sans text-[10px] font-bold">
            2 Redacted
          </span>
        </div>
        <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-100 border border-slate-200 text-xs text-slate-700 font-mono">
          <FileCheck2 className="w-3.5 h-3.5 text-emerald-600" />
          <span>api-dump.json (4.8 KB)</span>
          <span className="px-1.5 py-0.2 rounded-full bg-emerald-100 text-emerald-700 font-sans text-[10px] font-bold">
            Clean ✓
          </span>
        </div>
      </div>
    </div>
  );
}
