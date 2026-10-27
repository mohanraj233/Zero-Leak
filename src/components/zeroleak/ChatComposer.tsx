'use client';

import React, { useState, useRef, KeyboardEvent } from 'react';
import { useZeroLeak } from '@/context/ZeroLeakContext';
import {
  Paperclip,
  Send,
  ShieldCheck,
  FileText,
  X,
  FileCheck2,
  Sparkles,
  Zap,
} from 'lucide-react';

export function ChatComposer() {
  const { sendMessage, addToast } = useZeroLeak();
  const [text, setText] = useState('');
  const [attachedFiles, setAttachedFiles] = useState<File[]>([]);
  const [isSending, setIsSending] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const allowedExtensions = [
    '.txt',
    '.log',
    '.js',
    '.ts',
    '.json',
    '.png',
    '.jpg',
    '.jpeg',
    '.pdf',
    '.docx',
    '.xlsx',
    '.pptx',
  ];

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return;
    const files = Array.from(e.target.files);

    const validFiles: File[] = [];
    for (const file of files) {
      const ext = '.' + file.name.split('.').pop()?.toLowerCase();
      if (!allowedExtensions.includes(ext)) {
        addToast({
          type: 'warning',
          title: 'Unsupported File Format',
          message: `${file.name} extension is not supported by ZeroLeak scanner.`,
        });
        continue;
      }
      if (file.size > 10 * 1024 * 1024) {
        // 10MB limit
        addToast({
          type: 'error',
          title: 'File Too Large',
          message: `${file.name} exceeds 10MB inspection limit.`,
        });
        continue;
      }
      validFiles.push(file);
    }

    if (validFiles.length > 0) {
      setAttachedFiles((prev) => [...prev, ...validFiles]);
      addToast({
        type: 'info',
        title: 'File Staged for Inspection',
        message: `${validFiles.length} file(s) scanned locally. Sensitive content will be redacted before egress.`,
      });
    }
  };

  const handleRemoveFile = (index: number) => {
    setAttachedFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSend = async () => {
    if (!text.trim() && attachedFiles.length === 0) return;
    if (isSending) return;

    setIsSending(true);
    const contentToSend = text;
    const filesToSend = [...attachedFiles];

    setText('');
    setAttachedFiles([]);

    try {
      await sendMessage(contentToSend, filesToSend);
    } finally {
      setIsSending(false);
    }
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
      e.preventDefault();
      handleSend();
    }
  };

  const loadTestPrompt = (type: 'stripe' | 'aws' | 'pii' | 'clean') => {
    if (type === 'stripe') {
      setText(
        `Help me test my checkout webhook. Here is my configuration:\nconst stripeSecret = "sk_test_demo_sample_token";\nconst dbUri = "postgresql://user:password@localhost:5432/testdb";`
      );
    } else if (type === 'aws') {
      setText(
        `My AWS deployment failed:\nAWS_ACCESS_KEY_ID="AKIAIOSFODNN7EXAMPLE"\nAWS_SECRET_ACCESS_KEY="wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY"\nCan you debug my policy?`
      );
    } else if (type === 'pii') {
      setText(
        `Customer support inquiry:\nName: Alex Taylor\nEmail: alex.taylor@example.com\nGenerate a polite response acknowledging receipt.`
      );
    } else if (type === 'clean') {
      setText(
        `Write a clean TypeScript interface for an authentication user session with role, email, and created_at fields.`
      );
    }
  };

  return (
    <div className="bg-white border-t border-slate-200 p-3 lg:p-4 space-y-2.5">
      {/* Quick Test Preset Buttons */}
      <div className="flex items-center gap-1.5 flex-wrap">
        <span className="text-[10px] uppercase font-bold text-slate-500 font-mono flex items-center gap-1 mr-1">
          <Zap className="w-3 h-3 text-amber-500" />
          Quick Test:
        </span>
        <button
          onClick={() => loadTestPrompt('stripe')}
          className="text-[11px] px-2 py-0.5 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium transition-colors"
        >
          Stripe + DB Leak
        </button>
        <button
          onClick={() => loadTestPrompt('aws')}
          className="text-[11px] px-2 py-0.5 rounded-full bg-rose-50 hover:bg-rose-100 text-rose-700 font-medium border border-rose-200 transition-colors"
        >
          AWS Root Secret (Block)
        </button>
        <button
          onClick={() => loadTestPrompt('pii')}
          className="text-[11px] px-2 py-0.5 rounded-full bg-amber-50 hover:bg-amber-100 text-amber-700 font-medium border border-amber-200 transition-colors"
        >
          PII Customer Data
        </button>
        <button
          onClick={() => loadTestPrompt('clean')}
          className="text-[11px] px-2 py-0.5 rounded-full bg-emerald-50 hover:bg-emerald-100 text-emerald-700 font-medium border border-emerald-200 transition-colors"
        >
          Clean Prompt
        </button>
      </div>

      {/* Attached Files Chips */}
      {attachedFiles.length > 0 && (
        <div className="flex flex-wrap gap-2 pt-1">
          {attachedFiles.map((f, i) => (
            <div
              key={i}
              className="inline-flex items-center gap-2 px-2.5 py-1 bg-slate-50 border border-slate-200 rounded-lg text-xs font-mono text-slate-700 shadow-2xs"
            >
              <FileText className="w-3.5 h-3.5 text-blue-600" />
              <span className="truncate max-w-[140px] font-medium">{f.name}</span>
              <span className="text-[10px] text-slate-400">({(f.size / 1024).toFixed(1)} KB)</span>
              <span className="text-[10px] font-bold text-emerald-600 font-sans">Ready</span>
              <button
                onClick={() => handleRemoveFile(i)}
                className="text-slate-400 hover:text-rose-600 ml-1"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Multiline Input */}
      <div className="relative rounded-xl border border-slate-300 focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-500/20 bg-slate-50/50 transition-all">
        <textarea
          rows={3}
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Ask anything or paste code. Your input is checked for secrets before external transmission..."
          className="w-full p-3 text-xs text-slate-800 placeholder-slate-400 bg-transparent focus:outline-none resize-none font-sans"
        />

        {/* Controls Row */}
        <div className="px-3 py-2 border-t border-slate-200/80 bg-white flex flex-wrap items-center justify-between gap-2 rounded-b-xl">
          {/* Left Buttons */}
          <div className="flex items-center gap-2">
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              multiple
              className="hidden"
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 text-xs font-semibold text-slate-700 transition-colors shadow-2xs"
            >
              <Paperclip className="w-3.5 h-3.5 text-slate-500" />
              <span>Attach File</span>
            </button>

            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 text-xs font-semibold text-slate-700 transition-colors shadow-2xs"
            >
              <FileCheck2 className="w-3.5 h-3.5 text-blue-600" />
              <span>Scan Doc</span>
            </button>

            {/* ZeroLeak Shield status */}
            <div className="hidden md:inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-[11px] font-semibold text-emerald-800">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
              <span>ZeroLeak Shield: Armed (Fail-Closed)</span>
            </div>
          </div>

          {/* Right Action */}
          <div className="flex items-center gap-3">
            <span className="hidden lg:inline text-[11px] text-slate-400 font-mono">
              Ctrl + Enter to send
            </span>
            <button
              onClick={handleSend}
              disabled={isSending || (!text.trim() && attachedFiles.length === 0)}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-xs font-bold shadow-xs transition-all"
            >
              {isSending ? (
                <>
                  <Sparkles className="w-3.5 h-3.5 animate-spin" />
                  <span>Scanning...</span>
                </>
              ) : (
                <>
                  <Send className="w-3.5 h-3.5" />
                  <span>Send Sanitized</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Bottom Micro-Bar */}
      <div className="flex items-center justify-between text-[11px] text-slate-400 font-mono px-1">
        <span>Pro tip: Press Ctrl + Enter to send sanitized prompt.</span>
        <span>ZeroLeak AI Gateway • Enterprise Sandbox Protected</span>
      </div>
    </div>
  );
}
