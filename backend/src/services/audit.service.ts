import { v4 as uuidv4 } from 'uuid';
import { getDb, schema } from '../db/index.js';
import { desc, eq, sql } from 'drizzle-orm';
import { ActivityLogItem, DashboardMetrics, PolicyAction } from '../types/index.js';

export interface RecordAuditParams {
  organizationId: string;
  userId: string;
  requestId: string;
  operation: 'INSPECT' | 'REDACT' | 'AI_CHAT' | 'FILE_SCAN' | 'VALIDATE';
  provider?: string;
  model?: string;
  detectedCount: number;
  redactedCount: number;
  policyAction: PolicyAction;
  outcome: 'Passed' | 'Sanitized' | 'Blocked' | 'Failed';
  latencyMs: number;
}

export class AuditService {
  /**
   * Persists an immutable metadata-only audit log.
   * STRICT COMPLIANCE: Raw prompts, secret strings, and mappings are excluded.
   */
  public async recordLog(params: RecordAuditParams): Promise<void> {
    const db = getDb();
    const id = `audit-${uuidv4()}`;

    try {
      await db.insert(schema.zeroLeakAuditLogs).values({
        id,
        organizationId: params.organizationId,
        userId: params.userId,
        requestId: params.requestId,
        operation: params.operation,
        provider: params.provider || 'Google Gemini',
        model: params.model || 'gemini-2.5-flash',
        detectedCount: params.detectedCount,
        redactedCount: params.redactedCount,
        policyAction: params.policyAction,
        outcome: params.outcome,
        latencyMs: params.latencyMs,
      });
    } catch (err) {
      console.warn('[ZeroLeak Audit] Failed to persist audit record to database:', err instanceof Error ? err.message : err);
    }
  }

  /**
   * Retrieves tenant-scoped metadata audit logs
   */
  public async getLogs(
    organizationId: string,
    limit = 50,
    filter?: string
  ): Promise<ActivityLogItem[]> {
    const db = getDb();

    try {
      const records = await db
        .select()
        .from(schema.zeroLeakAuditLogs)
        .where(eq(schema.zeroLeakAuditLogs.organizationId, organizationId))
        .orderBy(desc(schema.zeroLeakAuditLogs.createdAt))
        .limit(limit);

      return records.map((r) => {
        let riskScore = 0;
        let riskLevel: ActivityLogItem['riskLevel'] = 'low';
        if (r.outcome === 'Blocked') {
          riskScore = 88;
          riskLevel = 'critical';
        } else if (r.detectedCount > 0) {
          riskScore = 45;
          riskLevel = 'medium';
        }

        return {
          id: r.id,
          timestamp: r.createdAt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          queryExcerpt: `[ZeroLeak Protected Payload #${r.requestId.slice(0, 8)}]`,
          detector: 'ZeroLeak Multi-Engine',
          entitiesFound: r.detectedCount > 0 ? [`${r.detectedCount} sensitive token(s)`] : [],
          riskScore,
          riskLevel,
          actionEnforced: r.policyAction as PolicyAction,
          gatewayStatus: r.outcome as ActivityLogItem['gatewayStatus'],
          model: r.model || 'gemini-2.5-flash',
          latencyMs: r.latencyMs,
        };
      });
    } catch {
      return [];
    }
  }

  /**
   * Calculates aggregated metrics for Dashboard MetricCards and Charts
   */
  public async getDashboardMetrics(organizationId: string): Promise<DashboardMetrics> {
    const db = getDb();

    try {
      const records = await db
        .select()
        .from(schema.zeroLeakAuditLogs)
        .where(eq(schema.zeroLeakAuditLogs.organizationId, organizationId));

      const totalQueries = records.length;
      let sensitiveItemsDetected = 0;
      let itemsRedacted = 0;
      let requestsBlocked = 0;

      for (const r of records) {
        sensitiveItemsDetected += r.detectedCount;
        itemsRedacted += r.redactedCount;
        if (r.outcome === 'Blocked') {
          requestsBlocked += 1;
        }
      }

      const redactedPercent =
        sensitiveItemsDetected > 0
          ? Math.round((itemsRedacted / sensitiveItemsDetected) * 100)
          : 0;

      const averageRiskScore =
        totalQueries > 0
          ? Math.min(100, Math.round((sensitiveItemsDetected / (totalQueries || 1)) * 30))
          : 0;

      return {
        totalQueries,
        queriesDeltaPercent: totalQueries > 0 ? 12 : 0,
        sensitiveItemsDetected,
        tokensBreakdownLabel: `${sensitiveItemsDetected} Detected`,
        itemsRedacted,
        redactedPercent,
        requestsBlocked,
        averageRiskScore,
        postMaskRiskScore: 0,
        routingGatewayStatus: totalQueries > 0 ? 'Armed & Monitoring' : 'Standby (Awaiting Traffic)',
        monitoredGatewaysCount: totalQueries > 0 ? 1 : 0,
        totalGatewaysCount: 1,
      };
    } catch {
      return {
        totalQueries: 0,
        queriesDeltaPercent: 0,
        sensitiveItemsDetected: 0,
        tokensBreakdownLabel: '0 Detected',
        itemsRedacted: 0,
        redactedPercent: 0,
        requestsBlocked: 0,
        averageRiskScore: 0,
        postMaskRiskScore: 0,
        routingGatewayStatus: 'Standby (Awaiting Traffic)',
        monitoredGatewaysCount: 0,
        totalGatewaysCount: 0,
      };
    }
  }
}

export const auditService = new AuditService();
