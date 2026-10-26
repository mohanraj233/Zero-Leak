export type RiskLevel = 'low' | 'medium' | 'high' | 'critical';

export type PolicyAction = 'allow' | 'mask' | 'block' | 'warn';

export interface SensitiveEntity {
  id: string;
  type: string;
  category: 'pii' | 'financial' | 'secrets' | 'internal';
  placeholder: string;
  originalMasked: string; // synthetic masked representation for demo display
  start: number;
  end: number;
  severity: RiskLevel;
  detector: string;
  action: PolicyAction;
  confidence: number;
}

export interface InspectionResult {
  hasSensitiveData: boolean;
  riskScore: number; // 0 to 100
  riskLevel: RiskLevel;
  entities: SensitiveEntity[];
  sanitizedText: string;
  recommendedAction: PolicyAction;
  blocked: boolean;
  blockedReason?: string;
  latencyMs: number;
}

export interface ChatAttachment {
  id: string;
  name: string;
  sizeBytes: number;
  type: string;
  status: 'scanning' | 'clean' | 'redacted' | 'blocked';
  redactedCount?: number;
}

export interface ChatMessage {
  id: string;
  sender: 'user' | 'assistant' | 'system';
  timestamp: string;
  content: string;
  sanitizedContent?: string;
  model?: string;
  status?: 'clean' | 'scanning' | 'redacted' | 'blocked' | 'safe_response' | 'review_required';
  entitiesDetected?: SensitiveEntity[];
  codeSnippets?: {
    filename: string;
    code: string;
    sanitizedCode: string;
    language: string;
    entitiesCount: number;
  }[];
  attachments?: ChatAttachment[];
  remediationSnippet?: {
    title: string;
    code: string;
    language: string;
  };
  securityNote?: string;
}

export interface Conversation {
  id: string;
  title: string;
  timestamp: string;
  timeGroup: 'today' | 'yesterday' | 'previous_7_days';
  model: string;
  status: 'clean' | 'redacted' | 'blocked';
  redactedCount?: number;
  messages: ChatMessage[];
}

export interface PolicyRule {
  id: string;
  name: string;
  categoryId: string;
  pattern: string;
  regexPattern?: string;
  severity: RiskLevel;
  detectionMethod: 'regex' | 'presidio' | 'gitleaks' | 'hybrid';
  actionOverride: 'default' | 'mask' | 'block' | 'warn' | 'allow';
  enabled: boolean;
  description: string;
  matchCount24h: number;
}

export interface DetectionCategory {
  id: string;
  name: string;
  description: string;
  badge: 'BLOCK' | 'MASK' | 'WARN' | 'ALLOW';
  ruleCount: number;
  activeRulesCount: number;
  defaultAction: PolicyAction;
  rules: PolicyRule[];
}

export interface ActivityLogItem {
  id: string;
  timestamp: string;
  queryExcerpt: string;
  detector: string;
  entitiesFound: string[];
  riskScore: number;
  riskLevel: RiskLevel;
  actionEnforced: PolicyAction;
  gatewayStatus: 'Passed' | 'Sanitized' | 'Blocked';
  model: string;
  latencyMs: number;
}

export interface DashboardMetrics {
  totalQueries: number;
  queriesDeltaPercent: number;
  sensitiveItemsDetected: number;
  tokensBreakdownLabel: string;
  itemsRedacted: number;
  redactedPercent: number;
  requestsBlocked: number;
  averageRiskScore: number;
  postMaskRiskScore: number;
  routingGatewayStatus: string;
  monitoredGatewaysCount: number;
  totalGatewaysCount: number;
}
