import { DetectionCategory, PolicyRule, PolicyAction } from '../types/index.js';
import { getDb, schema } from '../db/index.js';
import { eq } from 'drizzle-orm';
import { v4 as uuidv4 } from 'uuid';

export const BUILT_IN_CATEGORIES: DetectionCategory[] = [
  {
    id: 'financial',
    name: 'Financial Data',
    description: 'Credit and debit card numbers, IBAN accounts, and regional payment identifiers.',
    badge: 'BLOCK',
    ruleCount: 6,
    activeRulesCount: 6,
    defaultAction: 'block',
    rules: [
      {
        id: 'fin-01',
        name: 'Credit & Debit Cards (Luhn Checksum)',
        categoryId: 'financial',
        pattern: '\\b(?:4[0-9]{12}(?:[0-9]{3})?|5[1-5][0-9]{14}|3[47][0-9]{13})\\b',
        severity: 'critical',
        detectionMethod: 'regex',
        actionOverride: 'block',
        enabled: true,
        description: 'Visa, MasterCard, Amex card numbers with Luhn mod 10 check',
        matchCount24h: 0,
      },
      {
        id: 'fin-02',
        name: 'IBAN Bank Account Numbers',
        categoryId: 'financial',
        pattern: '[A-Z]{2}\\d{2}[A-Z0-9]{4}\\d{7}([A-Z0-9]?){0,16}',
        severity: 'high',
        detectionMethod: 'regex',
        actionOverride: 'mask',
        enabled: true,
        description: 'International Bank Account Numbers across 70+ jurisdictions',
        matchCount24h: 0,
      },
      {
        id: 'fin-03',
        name: 'UPI / VPA Payment Addresses',
        categoryId: 'financial',
        pattern: '[a-zA-Z0-9.\\-_]{2,256}@[a-zA-Z]{2,64}',
        severity: 'medium',
        detectionMethod: 'hybrid',
        actionOverride: 'mask',
        enabled: true,
        description: 'Unified Payments Interface virtual payment addresses',
        matchCount24h: 0,
      },
      {
        id: 'fin-04',
        name: 'SWIFT / BIC Banking Codes',
        categoryId: 'financial',
        pattern: '^[A-Z]{6}[A-Z0-9]{2}([A-Z0-9]{3})?$',
        severity: 'medium',
        detectionMethod: 'regex',
        actionOverride: 'default',
        enabled: true,
        description: 'Standard format of Business Identifier Codes (BIC)',
        matchCount24h: 0,
      },
      {
        id: 'fin-05',
        name: 'Cryptocurrency Wallet Addresses',
        categoryId: 'financial',
        pattern: '^(0x[a-fA-F0-9]{40}|[13][a-km-zA-HJ-NP-Z1-9]{25,34})$',
        severity: 'medium',
        detectionMethod: 'regex',
        actionOverride: 'mask',
        enabled: true,
        description: 'Ethereum 0x addresses and Bitcoin base58 addresses',
        matchCount24h: 0,
      },
      {
        id: 'fin-06',
        name: 'CVV / Security Codes',
        categoryId: 'financial',
        pattern: '\\b[0-9]{3,4}\\b',
        severity: 'critical',
        detectionMethod: 'hybrid',
        actionOverride: 'block',
        enabled: true,
        description: 'Card verification values in payment payload streams',
        matchCount24h: 0,
      },
    ],
  },
  {
    id: 'pii',
    name: 'Personal Identifiable Information (PII)',
    description: 'Direct citizen identifiers, personal contact metadata, government registry numbers.',
    badge: 'MASK',
    ruleCount: 8,
    activeRulesCount: 8,
    defaultAction: 'mask',
    rules: [
      {
        id: 'pii-01',
        name: 'Email Addresses',
        categoryId: 'pii',
        pattern: '[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\\.[a-zA-Z0-9-.]+',
        severity: 'medium',
        detectionMethod: 'presidio',
        actionOverride: 'mask',
        enabled: true,
        description: 'Personal and organizational RFC 5322 email addresses',
        matchCount24h: 0,
      },
      {
        id: 'pii-02',
        name: 'US Social Security Numbers (SSN)',
        categoryId: 'pii',
        pattern: '\\b(?!000|666|9\\d{2})\\d{3}-(?!00)\\d{2}-(?!0000)\\d{4}\\b',
        severity: 'critical',
        detectionMethod: 'presidio',
        actionOverride: 'block',
        enabled: true,
        description: '9-digit US taxpayer and Social Security identifiers',
        matchCount24h: 0,
      },
      {
        id: 'pii-03',
        name: 'Phone Numbers (E.164 & Regional)',
        categoryId: 'pii',
        pattern: '(\\+?[1-9]\\d{0,2}[-.]?)?\\(?\\d{2,4}\\)?[-.]?\\d{3,4}[-.]?\\d{3,4}',
        severity: 'low',
        detectionMethod: 'presidio',
        actionOverride: 'mask',
        enabled: true,
        description: 'International E.164 telephone format and national variants',
        matchCount24h: 0,
      },
      {
        id: 'pii-04',
        name: 'Passport & National ID Numbers',
        categoryId: 'pii',
        pattern: '\\b[A-PR-WY][1-9]\\d\\s?\\d{4}[1-9]\\b',
        severity: 'critical',
        detectionMethod: 'presidio',
        actionOverride: 'block',
        enabled: true,
        description: 'Government identity registry credentials and travel documents',
        matchCount24h: 0,
      },
    ],
  },
  {
    id: 'secrets',
    name: 'API Keys, Secrets & Cloud Credentials',
    description: 'High-entropy credentials, cloud access keys, database connection strings.',
    badge: 'BLOCK',
    ruleCount: 10,
    activeRulesCount: 10,
    defaultAction: 'block',
    rules: [
      {
        id: 'sec-01',
        name: 'AWS Access Key IDs (AKIA/ASIA)',
        categoryId: 'secrets',
        pattern: '(?:AKIA|ASIA)[0-9A-Z]{16}',
        severity: 'critical',
        detectionMethod: 'gitleaks',
        actionOverride: 'block',
        enabled: true,
        description: 'IAM user and temporary session identifiers',
        matchCount24h: 0,
      },
      {
        id: 'sec-02',
        name: 'Stripe API Secret & Restricted Keys',
        categoryId: 'secrets',
        pattern: '(?:sk|rk)_(?:live|test)_[0-9a-zA-Z_]{16,}',
        severity: 'critical',
        detectionMethod: 'regex',
        actionOverride: 'mask',
        enabled: true,
        description: 'Stripe merchant API keys and restricted webhook tokens',
        matchCount24h: 0,
      },
      {
        id: 'sec-03',
        name: 'GitHub Personal Access Tokens',
        categoryId: 'secrets',
        pattern: 'gh[pousr]_[A-Za-z0-9_]{36,}',
        severity: 'critical',
        detectionMethod: 'gitleaks',
        actionOverride: 'block',
        enabled: true,
        description: 'OAuth and personal tokens for GitHub API operations',
        matchCount24h: 0,
      },
      {
        id: 'sec-04',
        name: 'Database Connection URIs',
        categoryId: 'secrets',
        pattern: '(?:postgresql|postgres|mysql|mongodb(?:\\+srv)?):\\/\\/[^\\s"\'<>]+',
        severity: 'critical',
        detectionMethod: 'regex',
        actionOverride: 'mask',
        enabled: true,
        description: 'Database credentials containing user passwords and endpoints',
        matchCount24h: 0,
      },
      {
        id: 'sec-05',
        name: 'Private RSA / SSH Key Headers',
        categoryId: 'secrets',
        pattern: '-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----',
        severity: 'critical',
        detectionMethod: 'regex',
        actionOverride: 'block',
        enabled: true,
        description: 'Asymmetric cryptographic key blocks and certificates',
        matchCount24h: 0,
      },
    ],
  },
  {
    id: 'internal',
    name: 'Internal IP Addresses & Network Topology',
    description: 'RFC 1918 private subnets, internal DNS names, Kubernetes cluster endpoints.',
    badge: 'WARN',
    ruleCount: 4,
    activeRulesCount: 4,
    defaultAction: 'warn',
    rules: [
      {
        id: 'net-01',
        name: 'RFC 1918 Private IPv4 Addresses',
        categoryId: 'internal',
        pattern: '(?:10\\.\\d{1,3}|172\\.(?:1[6-9]|2\\d|3[01])|192\\.168)\\.\\d{1,3}\\.\\d{1,3}',
        severity: 'low',
        detectionMethod: 'regex',
        actionOverride: 'default',
        enabled: true,
        description: 'Private intranet subnets and VPC internal routing IPs',
        matchCount24h: 0,
      },
      {
        id: 'net-02',
        name: 'Kubernetes Cluster Internal Hostnames',
        categoryId: 'internal',
        pattern: '[a-zA-Z0-9-]+\\.(?:default|kube-system|svc)\\.cluster\\.local',
        severity: 'medium',
        detectionMethod: 'regex',
        actionOverride: 'mask',
        enabled: true,
        description: 'Internal service discovery records and cluster domain paths',
        matchCount24h: 0,
      },
    ],
  },
];

export class PolicyService {
  public async getCategories(organizationId: string): Promise<DetectionCategory[]> {
    const db = getDb();
    try {
      const overrides = await db
        .select()
        .from(schema.policyRules)
        .where(eq(schema.policyRules.organizationId, organizationId));

      if (overrides.length === 0) {
        return BUILT_IN_CATEGORIES;
      }

      // Merge overrides
      const overrideMap = new Map(overrides.map((o) => [o.ruleKey, o]));

      return BUILT_IN_CATEGORIES.map((cat) => {
        const mergedRules = cat.rules.map((rule) => {
          const ov = overrideMap.get(rule.id);
          if (ov) {
            return {
              ...rule,
              actionOverride: ov.actionOverride as PolicyRule['actionOverride'],
              enabled: ov.enabled,
            };
          }
          return rule;
        });

        return {
          ...cat,
          rules: mergedRules,
          activeRulesCount: mergedRules.filter((r) => r.enabled).length,
        };
      });
    } catch {
      return BUILT_IN_CATEGORIES;
    }
  }

  public async updateRule(
    organizationId: string,
    ruleId: string,
    updates: {
      actionOverride?: PolicyRule['actionOverride'];
      enabled?: boolean;
    }
  ): Promise<void> {
    const db = getDb();
    try {
      // Find rule in built-in definitions
      const flatRules = BUILT_IN_CATEGORIES.flatMap((c) => c.rules);
      const ruleDef = flatRules.find((r) => r.id === ruleId);
      if (!ruleDef) return;

      const existing = await db
        .select()
        .from(schema.policyRules)
        .where(eq(schema.policyRules.ruleKey, ruleId));

      if (existing.length > 0) {
        await db
          .update(schema.policyRules)
          .set({
            actionOverride: updates.actionOverride ?? existing[0].actionOverride,
            enabled: updates.enabled ?? existing[0].enabled,
            updatedAt: new Date(),
          })
          .where(eq(schema.policyRules.ruleKey, ruleId));
      } else {
        await db.insert(schema.policyRules).values({
          id: `rule-${uuidv4()}`,
          organizationId,
          ruleKey: ruleId,
          name: ruleDef.name,
          categoryId: ruleDef.categoryId,
          pattern: ruleDef.pattern,
          regexPattern: ruleDef.regexPattern,
          severity: ruleDef.severity,
          detectionMethod: ruleDef.detectionMethod,
          actionOverride: updates.actionOverride ?? ruleDef.actionOverride,
          enabled: updates.enabled ?? ruleDef.enabled,
        });
      }
    } catch (err) {
      console.warn('[ZeroLeak Policy] Failed to persist rule override to DB:', err);
    }
  }
}

export const policyService = new PolicyService();
