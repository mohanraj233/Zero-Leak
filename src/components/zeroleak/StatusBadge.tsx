import React from 'react';
import { RiskLevel, PolicyAction } from '@/types/zeroleak';
import { ShieldCheck, ShieldAlert, ShieldX, Shield } from 'lucide-react';

interface StatusBadgeProps {
  type: 'action' | 'severity' | 'status' | 'redacted';
  value: string;
  className?: string;
  size?: 'sm' | 'md';
}

export function StatusBadge({ type, value, className = '', size = 'sm' }: StatusBadgeProps) {
  const sizeClasses = size === 'sm' ? 'text-[11px] px-2 py-0.5' : 'text-xs px-2.5 py-1';

  if (type === 'action') {
    const action = value.toLowerCase() as PolicyAction | 'default';
    if (action === 'block') {
      return (
        <span
          className={`inline-flex items-center gap-1 font-semibold rounded-md uppercase tracking-wider bg-rose-50 text-rose-700 border border-rose-200/80 ${sizeClasses} ${className}`}
        >
          <ShieldX className="w-3 h-3 text-rose-600" />
          BLOCK
        </span>
      );
    }
    if (action === 'mask') {
      return (
        <span
          className={`inline-flex items-center gap-1 font-semibold rounded-md uppercase tracking-wider bg-blue-50 text-blue-700 border border-blue-200/80 ${sizeClasses} ${className}`}
        >
          <Shield className="w-3 h-3 text-blue-600" />
          MASK
        </span>
      );
    }
    if (action === 'warn') {
      return (
        <span
          className={`inline-flex items-center gap-1 font-semibold rounded-md uppercase tracking-wider bg-amber-50 text-amber-700 border border-amber-200/80 ${sizeClasses} ${className}`}
        >
          <ShieldAlert className="w-3 h-3 text-amber-600" />
          WARN
        </span>
      );
    }
    if (action === 'allow') {
      return (
        <span
          className={`inline-flex items-center gap-1 font-semibold rounded-md uppercase tracking-wider bg-emerald-50 text-emerald-700 border border-emerald-200/80 ${sizeClasses} ${className}`}
        >
          <ShieldCheck className="w-3 h-3 text-emerald-600" />
          ALLOW
        </span>
      );
    }
  }

  if (type === 'severity') {
    const sev = value.toLowerCase() as RiskLevel;
    switch (sev) {
      case 'critical':
        return (
          <span
            className={`inline-flex items-center font-medium rounded-md bg-rose-100/90 text-rose-800 border border-rose-300/80 ${sizeClasses} ${className}`}
          >
            Critical
          </span>
        );
      case 'high':
        return (
          <span
            className={`inline-flex items-center font-medium rounded-md bg-orange-100/90 text-orange-800 border border-orange-300/80 ${sizeClasses} ${className}`}
          >
            High
          </span>
        );
      case 'medium':
        return (
          <span
            className={`inline-flex items-center font-medium rounded-md bg-amber-100/90 text-amber-800 border border-amber-300/80 ${sizeClasses} ${className}`}
          >
            Medium
          </span>
        );
      case 'low':
      default:
        return (
          <span
            className={`inline-flex items-center font-medium rounded-md bg-emerald-100/90 text-emerald-800 border border-emerald-300/80 ${sizeClasses} ${className}`}
          >
            Low
          </span>
        );
    }
  }

  if (type === 'redacted') {
    if (value === 'clean' || value === 'Clean ✓') {
      return (
        <span
          className={`inline-flex items-center font-medium rounded-full bg-emerald-100 text-emerald-700 border border-emerald-300 text-[10px] px-2 py-0.5 ${className}`}
        >
          Clean ✓
        </span>
      );
    }
    if (value === 'blocked' || value === 'Blocked') {
      return (
        <span
          className={`inline-flex items-center font-medium rounded-full bg-rose-100 text-rose-700 border border-rose-300 text-[10px] px-2 py-0.5 ${className}`}
        >
          Blocked
        </span>
      );
    }
    return (
      <span
        className={`inline-flex items-center font-medium rounded-full bg-rose-100/80 text-rose-700 border border-rose-200 text-[10px] px-2 py-0.5 ${className}`}
      >
        {value}
      </span>
    );
  }

  // Generic fallback
  return (
    <span
      className={`inline-flex items-center rounded-md bg-slate-100 text-slate-700 border border-slate-200 ${sizeClasses} ${className}`}
    >
      {value}
    </span>
  );
}
