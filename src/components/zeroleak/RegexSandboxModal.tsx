'use client';

import React, { useState } from 'react';
import { useZeroLeak } from '@/context/ZeroLeakContext';
import { Play, X, CheckCircle2, AlertCircle, Terminal, Copy, Check } from 'lucide-react';

export function RegexSandboxModal() {
  const { regexModalOpen, setRegexModalOpen } = useZeroLeak();

  const [pattern, setPattern] = useState('(?:sk|rk)_(?:live|test)_[0-9a-zA-Z_]{16,}');
  const [flags, setFlags] = useState('g');
  const [sampleText, setSampleText] = useState(
    `// Enter code or text here to test regex pattern matching in local sandbox\n// Example: const apiKey = "sample_test_token_12345";\nconst cleanMessage = "Hello ZeroLeak";`
  );
  const [testResult, setTestResult] = useState<{
    tested: boolean;
    valid: boolean;
    matches: string[];
    replacedText: string;
    executionTimeMs: number;
    error?: string;
  } | null>(null);
  const [copied, setCopied] = useState(false);

  if (!regexModalOpen) return null;

  const handleTest = () => {
    const startTime = performance.now();
    try {
      const matches: string[] = [];
      let match;
      let counter = 1;

      // Safe bounded regex execution
      const regexCopy = new RegExp(pattern, flags.includes('g') ? flags : flags + 'g');
      while ((match = regexCopy.exec(sampleText)) !== null) {
        matches.push(match[0]);
        if (matches.length > 50) break; // bounded
      }

      const replaced = sampleText.replace(regexCopy, () => `<REDACTED_SECRET_${counter++}>`);
      const executionTime = Math.max(0.1, Number((performance.now() - startTime).toFixed(2)));

      setTestResult({
        tested: true,
        valid: true,
        matches,
        replacedText: replaced,
        executionTimeMs: executionTime,
      });
    } catch (err: unknown) {
      setTestResult({
        tested: true,
        valid: false,
        matches: [],
        replacedText: sampleText,
        executionTimeMs: 0,
        error: err instanceof Error ? err.message : 'Invalid Regular Expression Syntax',
      });
    }
  };

  const handleLoadSample = (type: 'stripe' | 'email' | 'aws' | 'db') => {
    if (type === 'stripe') {
      setPattern('(?:sk|rk)_(?:live|test)_[0-9a-zA-Z_]{16,}');
      setSampleText('const stripe = require("stripe")("sk_test_demo_placeholder_token_for_testing");');
    } else if (type === 'email') {
      setPattern('[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\\.[a-zA-Z0-9-.]+');
      setSampleText('Send logs to admin@example.com or sec-ops@example.org for verification.');
    } else if (type === 'aws') {
      setPattern('(?:AKIA|ASIA)[0-9A-Z]{16}');
      setSampleText('export AWS_ACCESS_KEY_ID="AKIAIOSFODNN7EXAMPLE"');
    } else if (type === 'db') {
      setPattern('(?:postgresql|postgres|mysql|mongodb(?:\\+srv)?):\\/\\/[^\\s"\'<>]+');
      setSampleText('DATABASE_URL="postgresql://db_user:password@localhost:5432/main?sslmode=require"');
    }
    setTestResult(null);
  };

  const handleCopySanitized = () => {
    if (testResult?.replacedText) {
      navigator.clipboard.writeText(testResult.replacedText);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-2xl w-full max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="p-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-indigo-100 flex items-center justify-center text-indigo-700">
              <Terminal className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900">
                ZeroLeak Safe Regular Expression Sandbox
              </h3>
              <p className="text-xs text-slate-500">
                Test and fine-tune sensitive token detection patterns locally in browser memory.
              </p>
            </div>
          </div>
          <button
            onClick={() => setRegexModalOpen(false)}
            className="p-1 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-200/60 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 overflow-y-auto space-y-4">
          {/* Quick presets */}
          <div className="flex items-center gap-2 flex-wrap text-xs">
            <span className="text-slate-500 font-semibold text-[11px] uppercase font-mono">
              Presets:
            </span>
            <button
              onClick={() => handleLoadSample('stripe')}
              className="px-2 py-0.5 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium"
            >
              Stripe API Key
            </button>
            <button
              onClick={() => handleLoadSample('email')}
              className="px-2 py-0.5 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium"
            >
              PII Email
            </button>
            <button
              onClick={() => handleLoadSample('aws')}
              className="px-2 py-0.5 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium"
            >
              AWS Key ID
            </button>
            <button
              onClick={() => handleLoadSample('db')}
              className="px-2 py-0.5 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium"
            >
              Database URI
            </button>
          </div>

          {/* Pattern input */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700 flex items-center justify-between">
              <span>Regular Expression Pattern</span>
              <span className="text-[11px] text-slate-400 font-normal">JavaScript RegExp format</span>
            </label>
            <div className="flex items-center gap-2">
              <span className="font-mono text-slate-400 font-bold text-sm">/</span>
              <input
                type="text"
                value={pattern}
                onChange={(e) => setPattern(e.target.value)}
                placeholder="Enter regex pattern..."
                className="flex-1 px-3 py-2 text-xs font-mono bg-slate-50 border border-slate-200 rounded-lg text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              />
              <span className="font-mono text-slate-400 font-bold text-sm">/</span>
              <input
                type="text"
                value={flags}
                onChange={(e) => setFlags(e.target.value)}
                placeholder="g"
                className="w-14 px-2 py-2 text-xs font-mono bg-slate-50 border border-slate-200 rounded-lg text-center text-slate-800"
              />
            </div>
          </div>

          {/* Sample text input */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700">Sample Text to Scan</label>
            <textarea
              rows={4}
              value={sampleText}
              onChange={(e) => setSampleText(e.target.value)}
              placeholder="Paste raw string, code snippet, or prompt..."
              className="w-full p-3 text-xs font-mono bg-slate-50 border border-slate-200 rounded-lg text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 resize-none"
            />
          </div>

          {/* Test Action Button */}
          <div className="flex items-center justify-between pt-1">
            <div className="text-[11px] text-slate-500 italic">
              Bounded local UI match test only. No network calls or code execution.
            </div>
            <button
              onClick={handleTest}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold shadow-xs flex items-center gap-2 transition-colors"
            >
              <Play className="w-3.5 h-3.5 fill-current" />
              <span>Test Pattern</span>
            </button>
          </div>

          {/* Results Area */}
          {testResult && (
            <div className="mt-3 p-4 rounded-xl border border-slate-200 bg-slate-50/80 space-y-3">
              {testResult.valid ? (
                <>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {testResult.matches.length > 0 ? (
                        <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                          {testResult.matches.length} Match(es) Found
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-xs font-bold text-amber-700 bg-amber-100 px-2 py-0.5 rounded-full">
                          <AlertCircle className="w-3.5 h-3.5 text-amber-600" />
                          No Match
                        </span>
                      )}
                    </div>
                    <span className="text-[11px] text-slate-500 font-mono">
                      Latency: {testResult.executionTimeMs} ms
                    </span>
                  </div>

                  {/* Matches List */}
                  {testResult.matches.length > 0 && (
                    <div className="space-y-1.5">
                      <div className="text-[11px] font-semibold text-slate-600 uppercase font-mono">
                        Matched Tokens:
                      </div>
                      <div className="flex flex-wrap gap-1.5">
                        {testResult.matches.map((m, i) => (
                          <span
                            key={i}
                            className="text-xs font-mono bg-rose-50 border border-rose-200 text-rose-700 px-2 py-0.5 rounded"
                          >
                            {m}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Redacted Preview */}
                  <div className="space-y-1.5 pt-2 border-t border-slate-200">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-semibold text-slate-600 uppercase font-mono">
                        Simulated Sanitized Stream:
                      </span>
                      <button
                        onClick={handleCopySanitized}
                        className="text-[11px] text-blue-600 hover:text-blue-700 flex items-center gap-1"
                      >
                        {copied ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                        <span>{copied ? 'Copied' : 'Copy'}</span>
                      </button>
                    </div>
                    <pre className="p-2.5 rounded-lg bg-slate-900 text-slate-200 text-xs font-mono overflow-x-auto whitespace-pre-wrap">
                      {testResult.replacedText}
                    </pre>
                  </div>
                </>
              ) : (
                <div className="flex items-center gap-2 text-rose-700 text-xs font-medium">
                  <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
                  <span>{testResult.error}</span>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-3.5 border-t border-slate-200 bg-slate-50 flex items-center justify-end">
          <button
            onClick={() => setRegexModalOpen(false)}
            className="px-4 py-1.5 bg-slate-800 hover:bg-slate-900 text-white rounded-lg text-xs font-semibold shadow-xs transition-colors"
          >
            Close Sandbox
          </button>
        </div>
      </div>
    </div>
  );
}
