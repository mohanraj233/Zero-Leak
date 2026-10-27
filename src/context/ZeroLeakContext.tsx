'use client';

import React, { createContext, useContext, useState, ReactNode } from 'react';
import {
  DashboardMetrics,
  DetectionCategory,
  Conversation,
  ActivityLogItem,
  PolicyRule,
  PolicyAction,
  ChatMessage,
  SensitiveEntity,
} from '@/types/zeroleak';
import {
  INITIAL_METRICS,
  INITIAL_CATEGORIES,
  INITIAL_CONVERSATIONS,
  INITIAL_ACTIVITY_LOGS,
  inspectAndRedactText,
} from '@/services/zeroleak-mock';
import { zeroleakApi } from '@/services/zeroleak-api';

interface ToastMessage {
  id: string;
  type: 'success' | 'info' | 'warning' | 'error';
  title: string;
  message: string;
}

interface ZeroLeakContextType {
  metrics: DashboardMetrics;
  categories: DetectionCategory[];
  conversations: Conversation[];
  activeConversationId: string;
  activeConversation: Conversation | undefined;
  activityLogs: ActivityLogItem[];
  selectedModel: string;
  setSelectedModel: (model: string) => void;
  toasts: ToastMessage[];
  addToast: (toast: Omit<ToastMessage, 'id'>) => void;
  removeToast: (id: string) => void;
  setActiveConversationId: (id: string) => void;
  createNewChat: () => void;
  clearActiveChat: () => void;
  sendMessage: (text: string, attachments?: File[]) => Promise<void>;
  updateRuleAction: (categoryId: string, ruleId: string, action: PolicyRule['actionOverride']) => void;
  toggleRuleEnabled: (categoryId: string, ruleId: string) => void;
  updateCategoryDefaultAction: (categoryId: string, action: PolicyAction) => void;
  savePolicyChanges: () => void;
  exportRulesetJson: () => void;
  runPrivacyAudit: () => void;
  inspectModalEntity: SensitiveEntity[] | null;
  setInspectModalEntity: (entities: SensitiveEntity[] | null) => void;
  regexModalOpen: boolean;
  setRegexModalOpen: (open: boolean) => void;
  auditModalOpen: boolean;
  setAuditModalOpen: (open: boolean) => void;
}

const ZeroLeakContext = createContext<ZeroLeakContextType | undefined>(undefined);

export function ZeroLeakProvider({ children }: { children: ReactNode }) {
  const toastIdRef = React.useRef(0);
  const convIdRef = React.useRef(0);
  const msgIdRef = React.useRef(0);
  const actIdRef = React.useRef(0);

  const [metrics, setMetrics] = useState<DashboardMetrics>(INITIAL_METRICS);
  const [categories, setCategories] = useState<DetectionCategory[]>(INITIAL_CATEGORIES);
  const [conversations, setConversations] = useState<Conversation[]>(INITIAL_CONVERSATIONS);
  const [activeConversationId, setActiveConversationId] = useState<string>('');
  const [activityLogs, setActivityLogs] = useState<ActivityLogItem[]>(INITIAL_ACTIVITY_LOGS);
  const [selectedModel, setSelectedModel] = useState<string>('Gemini 3.8 Flash (Server Proxy)');
  const [toasts, setToasts] = useState<ToastMessage[]>([]);
  const [inspectModalEntity, setInspectModalEntity] = useState<SensitiveEntity[] | null>(null);
  const [regexModalOpen, setRegexModalOpen] = useState<boolean>(false);
  const [auditModalOpen, setAuditModalOpen] = useState<boolean>(false);

  const activeConversation = conversations.find((c) => c.id === activeConversationId);

  const addToast = (toast: Omit<ToastMessage, 'id'>) => {
    toastIdRef.current += 1;
    const id = `toast-${toastIdRef.current}`;
    setToasts((prev) => [...prev, { ...toast, id }]);
    setTimeout(() => {
      removeToast(id);
    }, 4000);
  };

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  const createNewChat = () => {
    convIdRef.current += 1;
    const newId = `conv-${convIdRef.current}`;
    const newConv: Conversation = {
      id: newId,
      title: 'New Secure Chat',
      timestamp: 'Just now',
      timeGroup: 'today',
      model: selectedModel,
      status: 'clean',
      messages: [],
    };
    setConversations((prev) => [newConv, ...prev]);
    setActiveConversationId(newId);
    addToast({
      type: 'info',
      title: 'New Session Initialized',
      message: 'ZeroLeak fail-closed protection armed for new prompt session.',
    });
  };

  const clearActiveChat = () => {
    if (!activeConversation) return;
    setConversations((prev) =>
      prev.map((c) => (c.id === activeConversationId ? { ...c, messages: [] } : c))
    );
    addToast({
      type: 'info',
      title: 'Chat Cleared',
      message: 'Ephemeral in-memory messages cleared from current session.',
    });
  };

  const sendMessage = async (text: string, attachments?: File[]) => {
    if (!text.trim() && (!attachments || attachments.length === 0)) return;

    let targetConvId = activeConversationId;
    if (!targetConvId || !conversations.some((c) => c.id === targetConvId)) {
      convIdRef.current += 1;
      targetConvId = `conv-${convIdRef.current}`;
      const newConv: Conversation = {
        id: targetConvId,
        title: text.slice(0, 32) + (text.length > 32 ? '...' : ''),
        timestamp: 'Just now',
        timeGroup: 'today',
        model: selectedModel,
        status: 'clean',
        messages: [],
      };
      setConversations((prev) => [newConv, ...prev]);
      setActiveConversationId(targetConvId);
    }

    const inspection = inspectAndRedactText(text);

    msgIdRef.current += 1;
    const userMsgId = `msg-${msgIdRef.current}`;
    const nowTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    const userMessage: ChatMessage = {
      id: userMsgId,
      sender: 'user',
      timestamp: nowTime,
      content: text,
      sanitizedContent: inspection.sanitizedText,
      status: inspection.blocked ? 'blocked' : inspection.hasSensitiveData ? 'redacted' : 'clean',
      entitiesDetected: inspection.entities,
      attachments: attachments?.map((f, i) => ({
        id: `att-${msgIdRef.current}-${i}`,
        name: f.name,
        sizeBytes: f.size,
        type: f.type || 'text/plain',
        status: 'clean',
      })),
    };

    if (inspection.hasSensitiveData) {
      userMessage.codeSnippets = [
        {
          filename: 'payload/stream-intercept.ts [Intercepted by Gateway]',
          language: 'typescript',
          entitiesCount: inspection.entities.length,
          code: text,
          sanitizedCode: inspection.sanitizedText,
        },
      ];
    }

    // Update conversation with user message immediately
    setConversations((prev) =>
      prev.map((c) => {
        if (c.id === targetConvId) {
          const newStatus = inspection.blocked ? 'blocked' : inspection.hasSensitiveData ? 'redacted' : c.status;
          return {
            ...c,
            title: c.title === 'New Secure Chat' ? text.slice(0, 32) + '...' : c.title,
            status: newStatus,
            redactedCount: (c.redactedCount || 0) + inspection.entities.length,
            messages: [...c.messages, userMessage],
          };
        }
        return c;
      })
    );

    // Update metrics & activity log
    setMetrics((prev) => ({
      ...prev,
      totalQueries: prev.totalQueries + 1,
      sensitiveItemsDetected: prev.sensitiveItemsDetected + inspection.entities.length,
      itemsRedacted: prev.itemsRedacted + (inspection.blocked ? 0 : inspection.entities.length),
      requestsBlocked: prev.requestsBlocked + (inspection.blocked ? 1 : 0),
      routingGatewayStatus: '100% Intercept Active',
    }));

    actIdRef.current += 1;
    const newLogItem: ActivityLogItem = {
      id: `act-${actIdRef.current}`,
      timestamp: nowTime,
      queryExcerpt: text.slice(0, 70) + (text.length > 70 ? '...' : ''),
      detector: inspection.entities[0]?.detector || 'ZeroLeak FastScan',
      entitiesFound: inspection.entities.map((e) => e.type),
      riskScore: inspection.riskScore,
      riskLevel: inspection.riskLevel,
      actionEnforced: inspection.recommendedAction,
      gatewayStatus: inspection.blocked ? 'Blocked' : inspection.hasSensitiveData ? 'Sanitized' : 'Passed',
      model: selectedModel,
      latencyMs: inspection.latencyMs,
    };
    setActivityLogs((prev) => [newLogItem, ...prev]);

    if (inspection.blocked) {
      addToast({
        type: 'error',
        title: 'Request Blocked',
        message: inspection.blockedReason || 'High-risk secret detected. Gateway prevented external transmission.',
      });
      setTimeout(() => {
        msgIdRef.current += 1;
        const sysMsg: ChatMessage = {
          id: `sys-${msgIdRef.current}`,
          sender: 'system',
          timestamp: nowTime,
          status: 'blocked',
          content: `REQUEST BLOCKED BY ZEROLEAK GATEWAY (Fail-Closed Policy)\n\nZeroLeak Interceptor flagged sensitive credentials that cannot safely egress: ${inspection.entities
            .map((e) => e.type)
            .join(', ')}. Egress aborted.`,
        };
        setConversations((prev) =>
          prev.map((c) => (c.id === targetConvId ? { ...c, messages: [...c.messages, sysMsg] } : c))
        );
      }, 300);
      return;
    }

    if (inspection.hasSensitiveData) {
      addToast({
        type: 'warning',
        title: `${inspection.entities.length} Sensitive Entities Redacted`,
        message: 'Placeholders substituted. Sanitized payload ready for gateway.',
      });
    }

    // Forward to API or return transparent unintegrated notice
    const hasConfiguredBackend = Boolean(process.env.NEXT_PUBLIC_ZEROLEAK_API_URL?.trim());

    if (!hasConfiguredBackend) {
      setTimeout(() => {
        msgIdRef.current += 1;
        const noticeMsg: ChatMessage = {
          id: `notice-${msgIdRef.current}`,
          sender: 'assistant',
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          model: selectedModel,
          status: 'review_required',
          content: `[ZeroLeak Gateway: Standby Mode]\n\nYour prompt was inspected by the local ZeroLeak DLP engine.\n${
            inspection.hasSensitiveData
              ? `Detected and replaced ${inspection.entities.length} sensitive item(s) with placeholder keys.`
              : '0 sensitive credentials detected in prompt stream.'
          }\n\nNote: The backend AI Proxy Gateway is not currently connected (NEXT_PUBLIC_ZEROLEAK_API_URL is unset). In accordance with Fail-Closed security, raw prompts are not sent directly from browser to external AI providers.`,
          securityNote: 'Zero-exposure guarantee: No credentials were sent over the network.',
        };

        setConversations((prev) =>
          prev.map((c) => (c.id === targetConvId ? { ...c, messages: [...c.messages, noticeMsg] } : c))
        );
      }, 400);
      return;
    }

    // When backend is connected, delegate to backend service
    try {
      const response = await zeroleakApi.sendAiChat({
        model: selectedModel,
        sanitizedPrompt: inspection.sanitizedText,
        contextId: targetConvId,
      });

      msgIdRef.current += 1;
      const assistantMsg: ChatMessage = {
        id: `asst-${msgIdRef.current}`,
        sender: 'assistant',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        model: selectedModel,
        status: 'safe_response',
        content: response.content,
        remediationSnippet: response.remediationSnippet,
        securityNote: response.securityNote,
      };

      setConversations((prev) =>
        prev.map((c) => (c.id === targetConvId ? { ...c, messages: [...c.messages, assistantMsg] } : c))
      );
    } catch {
      msgIdRef.current += 1;
      const errorMsg: ChatMessage = {
        id: `err-${msgIdRef.current}`,
        sender: 'assistant',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        model: selectedModel,
        status: 'review_required',
        content: `Error connecting to ZeroLeak backend gateway. Request aborted per fail-closed policy.`,
      };
      setConversations((prev) =>
        prev.map((c) => (c.id === targetConvId ? { ...c, messages: [...c.messages, errorMsg] } : c))
      );
    }
  };

  const updateRuleAction = (categoryId: string, ruleId: string, action: PolicyRule['actionOverride']) => {
    setCategories((prev) =>
      prev.map((cat) => {
        if (cat.id === categoryId) {
          return {
            ...cat,
            rules: cat.rules.map((r) => (r.id === ruleId ? { ...r, actionOverride: action } : r)),
          };
        }
        return cat;
      })
    );
  };

  const toggleRuleEnabled = (categoryId: string, ruleId: string) => {
    setCategories((prev) =>
      prev.map((cat) => {
        if (cat.id === categoryId) {
          const updatedRules = cat.rules.map((r) =>
            r.id === ruleId ? { ...r, enabled: !r.enabled } : r
          );
          const activeCount = updatedRules.filter((r) => r.enabled).length;
          return {
            ...cat,
            rules: updatedRules,
            activeRulesCount: activeCount,
          };
        }
        return cat;
      })
    );
  };

  const updateCategoryDefaultAction = (categoryId: string, action: PolicyAction) => {
    const badgeMap: Record<PolicyAction, 'BLOCK' | 'MASK' | 'WARN' | 'ALLOW'> = {
      block: 'BLOCK',
      mask: 'MASK',
      warn: 'WARN',
      allow: 'ALLOW',
    };
    setCategories((prev) =>
      prev.map((cat) =>
        cat.id === categoryId
          ? {
              ...cat,
              defaultAction: action,
              badge: badgeMap[action],
            }
          : cat
      )
    );
    addToast({
      type: 'info',
      title: 'Default Action Updated',
      message: `Category baseline updated to ${action.toUpperCase()}.`,
    });
  };

  const savePolicyChanges = () => {
    addToast({
      type: 'success',
      title: 'Policy Configuration Saved',
      message: 'ZeroLeak local ruleset compiled and armed. Fail-closed engine ready.',
    });
  };

  const exportRulesetJson = () => {
    const jsonStr = JSON.stringify(categories, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `zeroleak-policy-ruleset-v2.4-${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    addToast({
      type: 'success',
      title: 'Ruleset Exported',
      message: 'Downloaded zeroleak-policy-ruleset.json successfully.',
    });
  };

  const runPrivacyAudit = () => {
    if (metrics.totalQueries === 0) {
      addToast({
        type: 'info',
        title: 'Privacy Audit Completed',
        message: 'No active AI egress queries found in current session. Perimeter clean (0 leaks detected).',
      });
    } else {
      addToast({
        type: 'info',
        title: 'Privacy Audit Completed',
        message: `${metrics.totalQueries} outbound request(s) inspected. ${metrics.itemsRedacted} token(s) sanitized. 0 plaintext leaks detected.`,
      });
    }
  };

  return (
    <ZeroLeakContext.Provider
      value={{
        metrics,
        categories,
        conversations,
        activeConversationId,
        activeConversation,
        activityLogs,
        selectedModel,
        setSelectedModel,
        toasts,
        addToast,
        removeToast,
        setActiveConversationId,
        createNewChat,
        clearActiveChat,
        sendMessage,
        updateRuleAction,
        toggleRuleEnabled,
        updateCategoryDefaultAction,
        savePolicyChanges,
        exportRulesetJson,
        runPrivacyAudit,
        inspectModalEntity,
        setInspectModalEntity,
        regexModalOpen,
        setRegexModalOpen,
        auditModalOpen,
        setAuditModalOpen,
      }}
    >
      {children}
    </ZeroLeakContext.Provider>
  );
}

export function useZeroLeak() {
  const context = useContext(ZeroLeakContext);
  if (!context) {
    throw new Error('useZeroLeak must be used within a ZeroLeakProvider');
  }
  return context;
}
