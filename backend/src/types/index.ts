export type RiskLevel = 'low' | 'medium' | 'high' | 'critical';
export type PolicyAction = 'allow' | 'mask' | 'block' | 'warn';

export interface SensitiveEntity {
  id: string;
  type: string;
  category: 'pii' | 'financial' | 'secrets' | 'internal';
  placeholder: string;
  originalMasked: string; // synthetic preview for safe display only
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

export interface AuthUser {
  id: string;
  email: string;
  displayName: string;
  organizationId: string;
  role: 'owner' | 'admin' | 'developer' | 'viewer';
}

export interface FileProcessingFinding {
  entityType: string;
  confidence: number;
  severity: RiskLevel;
  action: PolicyAction;
  pageOrLocation?: string | number;
  occurrenceCount: number;
}

export interface FileProcessingResult {
  fileId: string;
  originalFilename: string;
  sanitizedFilename: string;
  mimeType: string;
  sizeBytes: number;
  detectedCount: number;
  redactedCount: number;
  findings: FileProcessingFinding[];
  status: 'clean' | 'redacted' | 'blocked' | 'error';
  downloadToken?: string;
  processingTimeMs: number;
  verificationPassed: boolean;
}
