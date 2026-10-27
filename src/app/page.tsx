'use client';

import React from 'react';
import Link from 'next/link';
import { useZeroLeak } from '@/context/ZeroLeakContext';
import { ZeroLeakHeader } from '@/components/zeroleak/ZeroLeakHeader';
import { MetricCard } from '@/components/zeroleak/MetricCard';
import { PrivacyActivityChart } from '@/components/zeroleak/PrivacyActivityChart';
import { RiskDistributionChart } from '@/components/zeroleak/RiskDistributionChart';
import { DetectionCategoryBreakdown } from '@/components/zeroleak/DetectionCategoryCard';
import { RecentActivityTable } from '@/components/zeroleak/RecentActivityTable';
import {
  ShieldCheck,
  AlertTriangle,
  Scissors,
  Activity,
  Download,
  MessageSquareLock,
  Play,
} from 'lucide-react';

export default function ZeroLeakOverviewPage() {
  const { metrics, runPrivacyAudit, addToast } = useZeroLeak();

  const handleExportScorecard = () => {
    const reportData = {
      title: 'ZeroLeak AI DLP Privacy Audit Scorecard',
      generatedAt: new Date().toISOString(),
      engineVersion: 'v2.4 (Hybrid Regex + Presidio)',
      metrics,
    };
    const blob = new Blob([JSON.stringify(reportData, null, 2)], {
      type: 'application/json',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `zeroleak-audit-scorecard-${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    addToast({
      type: 'success',
      title: 'Scorecard Downloaded',
      message: 'ZeroLeak AI privacy scorecard saved locally.',
    });
  };

  return (
    <div className="flex flex-col min-h-full">
      {/* Page Header */}
      <ZeroLeakHeader
        pageTitle="ZeroLeak Overview"
        pageSubtitle="Real-time privacy firewall & data-loss prevention for developer AI interactions, LLM prompts, and code sanitization pipelines."
        badgeText="Protection Guard Active (v2.4 Engine)"
      />

      <main className="flex-1 p-6 space-y-6 max-w-7xl w-full mx-auto">
        {/* Top Action Controls Banner */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 rounded-xl border border-slate-200/80 shadow-2xs">
          <div>
            <span className="text-xs font-bold text-slate-900 font-mono">
              ZEROLEAK REVERSIBLE PROXY GATEWAY
            </span>
            <p className="text-xs text-slate-500 mt-0.5">
              Live inspection stream active. Zero persistent plaintext across external LLMs.
            </p>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={handleExportScorecard}
              className="px-3 py-1.5 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 rounded-lg text-xs font-semibold shadow-2xs transition-colors flex items-center gap-1.5"
            >
              <Download className="w-3.5 h-3.5 text-slate-500" />
              <span>Export Scorecard</span>
            </button>

            <Link
              href="/chat"
              className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold shadow-2xs transition-colors flex items-center gap-1.5"
            >
              <MessageSquareLock className="w-3.5 h-3.5" />
              <span>Open Secure Chat</span>
            </Link>

            <button
              onClick={runPrivacyAudit}
              className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-semibold shadow-2xs transition-colors flex items-center gap-1.5"
            >
              <Play className="w-3.5 h-3.5 text-emerald-400 fill-current" />
              <span>Run Privacy Audit</span>
            </button>
          </div>
        </div>

        {/* 4 Summary Metric Cards (Matching reference) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Card 1: Protected Requests */}
          <MetricCard
            title="PROTECTED REQUESTS"
            value={metrics.totalQueries}
            unit="queries"
            badge={{
              text: `${metrics.queriesDeltaPercent}% Delta`,
              variant: metrics.queriesDeltaPercent > 0 ? 'success' : 'neutral',
            }}
            subtitleTop="Routing Gateway"
            subtitleBottom={metrics.routingGatewayStatus || 'Standby (Awaiting Traffic)'}
            icon={ShieldCheck}
            iconColor="text-blue-600"
            iconBg="bg-blue-50"
          />

          {/* Card 2: Sensitive Items Detected */}
          <MetricCard
            title="SENSITIVE ITEMS DETECTED"
            value={metrics.sensitiveItemsDetected}
            unit="tokens"
            badge={{
              text: metrics.tokensBreakdownLabel,
              variant: metrics.sensitiveItemsDetected > 0 ? 'warning' : 'neutral',
            }}
            subtitleTop="Detections by Category"
            subtitleBottom={
              metrics.sensitiveItemsDetected > 0 ? 'API / PII / DB' : 'None detected'
            }
            icon={AlertTriangle}
            iconColor="text-amber-600"
            iconBg="bg-amber-50"
          />

          {/* Card 3: Items Redacted vs Blocked */}
          <MetricCard
            title="ITEMS REDACTED"
            value={`${metrics.itemsRedacted} Reversible`}
            unit="<TOKEN>"
            badge={{
              text: `${metrics.redactedPercent}% Masked`,
              variant: metrics.itemsRedacted > 0 ? 'info' : 'neutral',
            }}
            subtitleTop={`Sanitization Ratio: ${metrics.itemsRedacted} of ${metrics.sensitiveItemsDetected}`}
            subtitleBottom="Reversible RAM Mapping"
            icon={Scissors}
            iconColor="text-indigo-600"
            iconBg="bg-indigo-50"
            secondaryMetric={{
              title: 'Requests Blocked',
              value: `${metrics.requestsBlocked} drops`,
              badgeText: metrics.requestsBlocked > 0 ? 'Critical Intercept' : '0 Drops',
            }}
          />

          {/* Card 4: Average Risk Score */}
          <MetricCard
            title="AVERAGE RISK SCORE"
            value={`${metrics.averageRiskScore}%`}
            unit={metrics.averageRiskScore === 0 ? 'Standby' : 'Moderate'}
            badge={{
              text: `${metrics.averageRiskScore} / 100`,
              variant: metrics.averageRiskScore > 50 ? 'danger' : 'neutral',
            }}
            subtitleTop={`Pre-Sanitization: ${metrics.averageRiskScore}%`}
            subtitleBottom={`Post-Mask: ${metrics.postMaskRiskScore}%`}
            icon={Activity}
            iconColor="text-rose-600"
            iconBg="bg-rose-50"
          />
        </div>

        {/* Charts Section: Privacy Activity & Risk Distribution */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-8">
            <PrivacyActivityChart />
          </div>
          <div className="lg:col-span-4">
            <RiskDistributionChart />
          </div>
        </div>

        {/* Sensitive Data Category Breakdown */}
        <DetectionCategoryBreakdown />

        {/* Recent Activity Table */}
        <RecentActivityTable />
      </main>
    </div>
  );
}
