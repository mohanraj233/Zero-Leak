import {
  DashboardMetrics,
  DetectionCategory,
  Conversation,
  ActivityLogItem,
  InspectionResult,
  SensitiveEntity,
  PolicyAction,
  RiskLevel,
  PolicyRule,
} from '@/types/zeroleak';

export const INITIAL_METRICS: DashboardMetrics = {
  totalQueries: 1284,
  queriesDeltaPercent: 18,
  sensitiveItemsDetected: 342,
  tokensBreakdownLabel: 'API / PII / DB',
  itemsRedacted: 318,
  redactedPercent: 93,
  requestsBlocked: 12,
  averageRiskScore: 38,
  postMaskRiskScore: 0,
  routingGatewayStatus: '100% Secure Active',
  monitoredGatewaysCount: 8,
  totalGatewaysCount: 12,
};

export const TIME_RANGE_DATA = {
  '24h': [
    { time: '00:00', inspectedQueries: 42, sanitizedTokens: 11 },
    { time: '04:00', inspectedQueries: 18, sanitizedTokens: 4 },
    { time: '08:00', inspectedQueries: 112, sanitizedTokens: 28 },
    { time: '12:00', inspectedQueries: 246, sanitizedTokens: 64 },
    { time: '16:00', inspectedQueries: 380, sanitizedTokens: 92 },
    { time: '20:00', inspectedQueries: 298, sanitizedTokens: 71 },
    { time: 'Current', inspectedQueries: 188, sanitizedTokens: 48 },
  ],
  '7d': [
    { time: 'Mon', inspectedQueries: 164, sanitizedTokens: 38 },
    { time: 'Tue', inspectedQueries: 210, sanitizedTokens: 52 },
    { time: 'Wed', inspectedQueries: 245, sanitizedTokens: 66 },
    { time: 'Thu', inspectedQueries: 289, sanitizedTokens: 74 },
    { time: 'Fri', inspectedQueries: 212, sanitizedTokens: 53 },
    { time: 'Sat', inspectedQueries: 84, sanitizedTokens: 18 },
    { time: 'Sun', inspectedQueries: 80, sanitizedTokens: 17 },
  ],
  '30d': [
    { time: 'Week 1', inspectedQueries: 1120, sanitizedTokens: 290 },
    { time: 'Week 2', inspectedQueries: 1340, sanitizedTokens: 340 },
    { time: 'Week 3', inspectedQueries: 1284, sanitizedTokens: 318 },
    { time: 'Week 4', inspectedQueries: 1450, sanitizedTokens: 362 },
  ],
};

export const RISK_DISTRIBUTION_DATA = [
  { name: 'Low Risk', value: 62, count: 796, color: '#10B981' },
  { name: 'Medium', value: 22, count: 282, color: '#F59E0B' },
  { name: 'High', value: 12, count: 154, color: '#F97316' },
  { name: 'Critical', value: 4, count: 52, color: '#EF4444' },
];

export const CATEGORY_BREAKDOWN_DATA = [
  {
    id: 'api_keys',
    name: 'API Keys & Access Tokens',
    count: 142,
    percent: 41.5,
    severity: 'critical' as RiskLevel,
    color: 'bg-rose-500',
  },
  {
    id: 'db_credentials',
    name: 'Database Connection Strings',
    count: 78,
    percent: 22.8,
    severity: 'critical' as RiskLevel,
    color: 'bg-rose-500',
  },
  {
    id: 'pii',
    name: 'PII (Emails, Phone Numbers, SSNs)',
    count: 64,
    percent: 18.7,
    severity: 'medium' as RiskLevel,
    color: 'bg-amber-500',
  },
  {
    id: 'ssh_keys',
    name: 'Private RSA / SSH Keys & Certificates',
    count: 38,
    percent: 11.1,
    severity: 'critical' as RiskLevel,
    color: 'bg-rose-500',
  },
  {
    id: 'jwt_tokens',
    name: 'JWT & Session Bearer Tokens',
    count: 20,
    percent: 5.9,
    severity: 'high' as RiskLevel,
    color: 'bg-orange-500',
  },
];

export const INITIAL_ACTIVITY_LOGS: ActivityLogItem[] = [
  {
    id: 'act-001',
    timestamp: '11:42:18 AM',
    queryExcerpt: 'const stripe = require("stripe")("sk_live_..."); dbUri="postgres://..."',
    detector: 'Custom Regex + Presidio',
    entitiesFound: ['Stripe Secret Key', 'PostgreSQL URI', 'Admin Email'],
    riskScore: 84,
    riskLevel: 'critical',
    actionEnforced: 'mask',
    gatewayStatus: 'Sanitized',
    model: 'Gemini 3.8 Flash',
    latencyMs: 12,
  },
  {
    id: 'act-002',
    timestamp: '11:15:02 AM',
    queryExcerpt: 'Supabase RLS Policy Fix with AWS Root Secret AKIAIOSFODNN7EXAMPLE...',
    detector: 'Gitleaks CLI',
    entitiesFound: ['AWS Root Credential'],
    riskScore: 98,
    riskLevel: 'critical',
    actionEnforced: 'block',
    gatewayStatus: 'Blocked',
    model: 'Claude 3.5 Sonnet',
    latencyMs: 8,
  },
  {
    id: 'act-003',
    timestamp: '10:50:41 AM',
    queryExcerpt: 'Can you write a responsive Next.js Tailwind card component for pricing?',
    detector: 'ZeroLeak FastScan',
    entitiesFound: [],
    riskScore: 0,
    riskLevel: 'low',
    actionEnforced: 'allow',
    gatewayStatus: 'Passed',
    model: 'Gemini 3.8 Flash',
    latencyMs: 4,
  },
  {
    id: 'act-004',
    timestamp: 'Yesterday 16:30',
    queryExcerpt: 'AWS S3 Presigned URL Handler with session token eyJhbGciOi...',
    detector: 'Custom Regex',
    entitiesFound: ['Session Bearer Token', 'S3 Bucket ID'],
    riskScore: 68,
    riskLevel: 'high',
    actionEnforced: 'mask',
    gatewayStatus: 'Sanitized',
    model: 'GPT-OSS 120B',
    latencyMs: 14,
  },
  {
    id: 'act-005',
    timestamp: '2d ago 09:12',
    queryExcerpt: 'Customer Data Export Script with 4 customer SSNs and email addresses...',
    detector: 'Presidio Analyzer',
    entitiesFound: ['US SSN (x2)', 'Customer Email (x2)'],
    riskScore: 72,
    riskLevel: 'high',
    actionEnforced: 'mask',
    gatewayStatus: 'Sanitized',
    model: 'Claude Opus 4.6',
    latencyMs: 16,
  },
];

export const INITIAL_CONVERSATIONS: Conversation[] = [
  {
    id: 'conv-1',
    title: 'Node.js Auth & Stripe Debugging',
    timestamp: '11:42 AM',
    timeGroup: 'today',
    model: 'Gemini 3.8 Flash',
    status: 'redacted',
    redactedCount: 3,
    messages: [
      {
        id: 'msg-1',
        sender: 'user',
        timestamp: '11:42 AM',
        content: `I am getting an authentication error in my Node.js application. Here is a configuration snippet containing an API key and database credentials. Help me find the problem.

const stripe = require('stripe')('sk_live_demo_920194882019284710293847');
const dbUri = 'postgresql://admin_usr:SuperP@ssw0rd2024@ep-cool-fog-1928.us-east-2.aws.neon.tech/prod_db?sslmode=require';
const adminEmail = 'security-team@internal-corp.io';`,
        sanitizedContent: `I am getting an authentication error in my Node.js application. Here is a configuration snippet containing an API key and database credentials. Help me find the problem.

const stripe = require('stripe')( '<SECRET_1>' ); // [Redacted: Stripe Live Secret Key]
const dbUri = '<DATABASE_CREDENTIAL_1>' ; // [Redacted: Neon PostgreSQL URL]
const adminEmail = '<EMAIL_1>' ; // [Redacted: PII Email]`,
        status: 'redacted',
        entitiesDetected: [
          {
            id: 'ent-1',
            type: 'Stripe Live Secret Key',
            category: 'secrets',
            placeholder: '<SECRET_1>',
            originalMasked: 'sk_live_••••••••••••••••••••3847',
            start: 172,
            end: 213,
            severity: 'critical',
            detector: 'Custom Regex + Gitleaks',
            action: 'mask',
            confidence: 0.99,
          },
          {
            id: 'ent-2',
            type: 'Neon PostgreSQL Connection URL',
            category: 'secrets',
            placeholder: '<DATABASE_CREDENTIAL_1>',
            originalMasked: 'postgresql://admin_usr:••••••••@ep-cool-fog-1928.../prod_db',
            start: 228,
            end: 334,
            severity: 'critical',
            detector: 'Database URI Pattern',
            action: 'mask',
            confidence: 0.98,
          },
          {
            id: 'ent-3',
            type: 'Internal Corporate Email (PII)',
            category: 'pii',
            placeholder: '<EMAIL_1>',
            originalMasked: 'sec•••••••••@internal-corp.io',
            start: 353,
            end: 383,
            severity: 'medium',
            detector: 'Microsoft Presidio Analyzer',
            action: 'mask',
            confidence: 0.95,
          },
        ],
        codeSnippets: [
          {
            filename: 'config/stripe.ts [Intercepted by Gateway]',
            language: 'typescript',
            entitiesCount: 3,
            code: `const stripe = require('stripe')('sk_live_demo_920194882019284710293847');
const dbUri = 'postgresql://admin_usr:SuperP@ssw0rd2024@ep-cool-fog-1928.us-east-2.aws.neon.tech/prod_db?sslmode=require';
const adminEmail = 'security-team@internal-corp.io';`,
            sanitizedCode: `const stripe = require('stripe')( '<SECRET_1>' ); // [Redacted: Stripe Live Secret Key]
const dbUri = '<DATABASE_CREDENTIAL_1>' ; // [Redacted: Neon PostgreSQL URL]
const adminEmail = '<EMAIL_1>' ; // [Redacted: PII Email]`,
          },
        ],
        attachments: [
          {
            id: 'att-1',
            name: 'auth-handler.ts',
            sizeBytes: 14200,
            type: 'text/typescript',
            status: 'redacted',
            redactedCount: 2,
          },
          {
            id: 'att-2',
            name: 'api-dump.json',
            sizeBytes: 4800,
            type: 'application/json',
            status: 'clean',
          },
        ],
      },
      {
        id: 'msg-2',
        sender: 'assistant',
        timestamp: '11:42 AM',
        model: 'Gemini 3.8 Flash (Medium)',
        status: 'safe_response',
        content: `Looking at your configuration, your authentication error is typically caused by unescaped special characters in the connection string or passing an expired restricted key.

Here is the recommended safe implementation using environment variables rather than hardcoded credentials:`,
        remediationSnippet: {
          title: 'Remediation: Safe Env Var Pattern',
          language: 'typescript',
          code: `// Recommended VibeProofLens Remediation
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: true }
});`,
        },
        securityNote:
          'VibeProofLens detected hardcoded credentials in your prompt and intercepted them. Placeholders <SECRET_1> and <DATABASE_CREDENTIAL_1> will be safely restored locally upon deployment.',
      },
    ],
  },
  {
    id: 'conv-2',
    title: 'Supabase RLS Policy Fix',
    timestamp: '29m ago',
    timeGroup: 'today',
    model: 'Claude 3.5 Sonnet',
    status: 'blocked',
    messages: [
      {
        id: 'msg-201',
        sender: 'user',
        timestamp: '11:15 AM',
        content:
          'Please help me debug my Supabase policy with AWS root keys: AKIAIOSFODNN7EXAMPLE and secret wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY',
        status: 'blocked',
      },
      {
        id: 'msg-202',
        sender: 'system',
        timestamp: '11:15 AM',
        content:
          'REQUEST BLOCKED BY ZEROLEAK GATEWAY (Fail-Closed Policy): Prompt contains AWS Root Secret Credentials. Egress aborted.',
        status: 'blocked',
      },
    ],
  },
  {
    id: 'conv-3',
    title: 'Next.js Tailwind Component',
    timestamp: '10:50 AM',
    timeGroup: 'today',
    model: 'Gemini 3.8 Flash',
    status: 'clean',
    messages: [
      {
        id: 'msg-301',
        sender: 'user',
        timestamp: '10:50 AM',
        content: 'Create a clean pricing card component with Tailwind CSS.',
        status: 'clean',
      },
      {
        id: 'msg-302',
        sender: 'assistant',
        timestamp: '10:50 AM',
        model: 'Gemini 3.8 Flash',
        status: 'clean',
        content: 'Here is a responsive pricing table using standard Tailwind utility classes.',
      },
    ],
  },
  {
    id: 'conv-4',
    title: 'AWS S3 Presigned URL Handler',
    timestamp: 'Yesterday',
    timeGroup: 'yesterday',
    model: 'GPT-OSS 120B',
    status: 'redacted',
    redactedCount: 2,
    messages: [],
  },
  {
    id: 'conv-5',
    title: 'Customer Data Export Script',
    timestamp: '2d ago',
    timeGroup: 'previous_7_days',
    model: 'Claude Opus 4.6',
    status: 'redacted',
    redactedCount: 4,
    messages: [],
  },
];

export const INITIAL_CATEGORIES: DetectionCategory[] = [
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
        regexPattern: '\\b(?:4[0-9]{12}(?:[0-9]{3})?|5[1-5][0-9]{14}|3[47][0-9]{13})\\b',
        severity: 'critical',
        detectionMethod: 'regex',
        actionOverride: 'block',
        enabled: true,
        description: 'Visa, MasterCard, Amex card numbers with Luhn mod 10 check',
        matchCount24h: 18,
      },
      {
        id: 'fin-02',
        name: 'IBAN Bank Account Numbers',
        categoryId: 'financial',
        pattern: '[A-Z]{2}\\d{2}[A-Z0-9]{4}\\d{7}([A-Z0-9]?){0,16}',
        regexPattern: '[A-Z]{2}\\d{2}[A-Z0-9]{4}\\d{7}([A-Z0-9]?){0,16}',
        severity: 'high',
        detectionMethod: 'regex',
        actionOverride: 'mask',
        enabled: true,
        description: 'International Bank Account Numbers across 70+ jurisdictions',
        matchCount24h: 12,
      },
      {
        id: 'fin-03',
        name: 'UPI / VPA Payment Addresses',
        categoryId: 'financial',
        pattern: '[a-zA-Z0-9.\\-_]{2,256}@[a-zA-Z]{2,64}',
        regexPattern: '[a-zA-Z0-9.\\-_]{2,256}@[a-zA-Z]{2,64}',
        severity: 'medium',
        detectionMethod: 'hybrid',
        actionOverride: 'mask',
        enabled: true,
        description: 'Unified Payments Interface virtual payment addresses',
        matchCount24h: 9,
      },
      {
        id: 'fin-04',
        name: 'SWIFT / BIC Banking Codes',
        categoryId: 'financial',
        pattern: '^[A-Z]{6}[A-Z0-9]{2}([A-Z0-9]{3})?$',
        regexPattern: '^[A-Z]{6}[A-Z0-9]{2}([A-Z0-9]{3})?$',
        severity: 'medium',
        detectionMethod: 'regex',
        actionOverride: 'default',
        enabled: true,
        description: 'Standard format of Business Identifier Codes (BIC)',
        matchCount24h: 4,
      },
      {
        id: 'fin-05',
        name: 'Cryptocurrency Wallet Addresses',
        categoryId: 'financial',
        pattern: '^(0x[a-fA-F0-9]{40}|[13][a-km-zA-HJ-NP-Z1-9]{25,34})$',
        regexPattern: '^(0x[a-fA-F0-9]{40}|[13][a-km-zA-HJ-NP-Z1-9]{25,34})$',
        severity: 'medium',
        detectionMethod: 'regex',
        actionOverride: 'mask',
        enabled: true,
        description: 'Ethereum 0x addresses and Bitcoin base58 addresses',
        matchCount24h: 6,
      },
      {
        id: 'fin-06',
        name: 'CVV / Security Codes',
        categoryId: 'financial',
        pattern: '\\b[0-9]{3,4}\\b',
        regexPattern: '\\b[0-9]{3,4}\\b',
        severity: 'critical',
        detectionMethod: 'hybrid',
        actionOverride: 'block',
        enabled: true,
        description: 'Card verification values in payment payload streams',
        matchCount24h: 2,
      },
    ],
  },
  {
    id: 'pii',
    name: 'PII & Personal Data',
    description: 'Identifies customer identifiers, phone numbers, identity credentials, and names before model egress.',
    badge: 'MASK',
    ruleCount: 10,
    activeRulesCount: 10,
    defaultAction: 'mask',
    rules: [
      {
        id: 'pii-01',
        name: 'Email Addresses (All Domains)',
        categoryId: 'pii',
        pattern: 'NLP Named Entity + Presidio Email',
        regexPattern: '[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\\.[a-zA-Z0-9-.]+',
        severity: 'medium',
        detectionMethod: 'presidio',
        actionOverride: 'default',
        enabled: true,
        description: 'Corporate and personal email addresses',
        matchCount24h: 64,
      },
      {
        id: 'pii-02',
        name: 'US Social Security Number (SSN)',
        categoryId: 'pii',
        pattern: '^\\d{3}-\\d{2}-\\d{4}$',
        regexPattern: '\\b\\d{3}-\\d{2}-\\d{4}\\b',
        severity: 'critical',
        detectionMethod: 'hybrid',
        actionOverride: 'block',
        enabled: true,
        description: '9-digit US tax and social security identification',
        matchCount24h: 14,
      },
      {
        id: 'pii-03',
        name: 'Global Phone Numbers (E.164)',
        categoryId: 'pii',
        pattern: '^\\+?[1-9]\\d{1,14}$',
        regexPattern: '\\+?[1-9]\\d{1,14}',
        severity: 'medium',
        detectionMethod: 'regex',
        actionOverride: 'default',
        enabled: true,
        description: 'International standardized telephone formats',
        matchCount24h: 22,
      },
      {
        id: 'pii-04',
        name: 'Passports & National Identity Cards',
        categoryId: 'pii',
        pattern: 'Regex ID + Luhn Checksum',
        regexPattern: '[A-Z]{1,2}[0-9]{7,9}',
        severity: 'critical',
        detectionMethod: 'regex',
        actionOverride: 'block',
        enabled: true,
        description: 'Govt issued passport and national identity card numbers',
        matchCount24h: 8,
      },
      {
        id: 'pii-05',
        name: 'Person Full Names (NLP Model)',
        categoryId: 'pii',
        pattern: 'Presidio SpaCy NER (threshold: 0.85)',
        regexPattern: '[A-Z][a-z]+ [A-Z][a-z]+',
        severity: 'low',
        detectionMethod: 'presidio',
        actionOverride: 'default',
        enabled: true,
        description: 'Named entity recognition for human first and last names',
        matchCount24h: 46,
      },
      {
        id: 'pii-06',
        name: 'Driver License Numbers',
        categoryId: 'pii',
        pattern: '[A-Z0-9]{6,12}',
        regexPattern: '[A-Z0-9]{6,12}',
        severity: 'high',
        detectionMethod: 'hybrid',
        actionOverride: 'mask',
        enabled: true,
        description: 'State and provincial driver license numbers',
        matchCount24h: 5,
      },
      {
        id: 'pii-07',
        name: 'Medical Record Numbers (MRN / HIPAA)',
        categoryId: 'pii',
        pattern: 'MRN-[0-9]{6,10}',
        regexPattern: 'MRN-[0-9]{6,10}',
        severity: 'critical',
        detectionMethod: 'regex',
        actionOverride: 'block',
        enabled: true,
        description: 'Protected Health Information patient identifiers',
        matchCount24h: 1,
      },
      {
        id: 'pii-08',
        name: 'IPv4 & IPv6 Residential Addresses',
        categoryId: 'pii',
        pattern: '\\b(?:\\d{1,3}\\.){3}\\d{1,3}\\b',
        regexPattern: '\\b(?:\\d{1,3}\\.){3}\\d{1,3}\\b',
        severity: 'low',
        detectionMethod: 'regex',
        actionOverride: 'default',
        enabled: true,
        description: 'Client residential IP addresses mapping to user identity',
        matchCount24h: 19,
      },
      {
        id: 'pii-09',
        name: 'Physical Street Addresses',
        categoryId: 'pii',
        pattern: 'Presidio Location NER (threshold: 0.80)',
        regexPattern: '\\d{1,5}\\s[A-Za-z0-9.\\s]+(?:Street|St|Avenue|Ave|Road|Rd)',
        severity: 'medium',
        detectionMethod: 'presidio',
        actionOverride: 'mask',
        enabled: true,
        description: 'Physical residential street addresses',
        matchCount24h: 11,
      },
      {
        id: 'pii-10',
        name: 'Date of Birth (DOB)',
        categoryId: 'pii',
        pattern: '\\b(?:19|20)\\d\\d[-/.](?:0[1-9]|1[012])[-/.](?:0[1-9]|[12][0-9]|3[01])\\b',
        regexPattern: '\\b(?:19|20)\\d\\d[-/.](?:0[1-9]|1[012])[-/.](?:0[1-9]|[12][0-9]|3[01])\\b',
        severity: 'medium',
        detectionMethod: 'regex',
        actionOverride: 'mask',
        enabled: true,
        description: 'Full dates of birth associated with customer profiles',
        matchCount24h: 7,
      },
    ],
  },
  {
    id: 'secrets',
    name: 'Secrets & Cloud Keys',
    description: 'API keys, cloud provider credentials, private certificates, and database connection strings.',
    badge: 'BLOCK',
    ruleCount: 8,
    activeRulesCount: 8,
    defaultAction: 'block',
    rules: [
      {
        id: 'sec-01',
        name: 'AWS Access Key ID & Secret Access Key',
        categoryId: 'secrets',
        pattern: '(?:AKIA|ASIA)[0-9A-Z]{16}',
        regexPattern: '(?:AKIA|ASIA)[0-9A-Z]{16}',
        severity: 'critical',
        detectionMethod: 'gitleaks',
        actionOverride: 'block',
        enabled: true,
        description: 'Amazon Web Services programmatic IAM keys',
        matchCount24h: 34,
      },
      {
        id: 'sec-02',
        name: 'Stripe Secret API Keys (sk_live_...)',
        categoryId: 'secrets',
        pattern: '(?:sk|rk)_(?:live|test)_[0-9a-zA-Z_]{16,}',
        regexPattern: '(?:sk|rk)_(?:live|test)_[0-9a-zA-Z_]{16,}',
        severity: 'critical',
        detectionMethod: 'regex',
        actionOverride: 'mask',
        enabled: true,
        description: 'Stripe live and test restricted secret keys',
        matchCount24h: 42,
      },
      {
        id: 'sec-03',
        name: 'Database Connection URIs (Postgres, Mongo, MySQL)',
        categoryId: 'secrets',
        pattern: '(?:postgresql|postgres|mysql|mongodb(?:\\+srv)?):\\/\\/[^\\s"\'<>]+',
        regexPattern: '(?:postgresql|postgres|mysql|mongodb(?:\\+srv)?):\\/\\/[^\\s"\'<>]+',
        severity: 'critical',
        detectionMethod: 'regex',
        actionOverride: 'mask',
        enabled: true,
        description: 'Connection strings containing username, password, host, and db',
        matchCount24h: 78,
      },
      {
        id: 'sec-04',
        name: 'Private RSA / SSH Keys & Certificates',
        categoryId: 'secrets',
        pattern: '-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----',
        regexPattern: '-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----',
        severity: 'critical',
        detectionMethod: 'gitleaks',
        actionOverride: 'block',
        enabled: true,
        description: 'PEM formatted private keys and certificate authority secrets',
        matchCount24h: 38,
      },
      {
        id: 'sec-05',
        name: 'GitHub Personal Access Tokens (ghp_...)',
        categoryId: 'secrets',
        pattern: 'gh[pousr]_[0-9a-zA-Z]{36}',
        regexPattern: 'gh[pousr]_[0-9a-zA-Z]{36}',
        severity: 'critical',
        detectionMethod: 'regex',
        actionOverride: 'mask',
        enabled: true,
        description: 'GitHub fine-grained and classic personal access tokens',
        matchCount24h: 21,
      },
      {
        id: 'sec-06',
        name: 'OpenAI / Anthropic API Keys',
        categoryId: 'secrets',
        pattern: 'sk-[a-zA-Z0-9_-]{32,}',
        regexPattern: 'sk-[a-zA-Z0-9_-]{32,}',
        severity: 'critical',
        detectionMethod: 'regex',
        actionOverride: 'mask',
        enabled: true,
        description: 'Model provider egress keys accidentally pasted into prompt',
        matchCount24h: 19,
      },
      {
        id: 'sec-07',
        name: 'Slack Bot & User Tokens (xoxb-...)',
        categoryId: 'secrets',
        pattern: 'xox[baprs]-[0-9]{12}-[0-9]{12}-[a-zA-Z0-9]{24}',
        regexPattern: 'xox[baprs]-[0-9]{12}-[0-9]{12}-[a-zA-Z0-9]{24}',
        severity: 'high',
        detectionMethod: 'regex',
        actionOverride: 'mask',
        enabled: true,
        description: 'Slack app bot and workspace access tokens',
        matchCount24h: 8,
      },
      {
        id: 'sec-08',
        name: 'Google Cloud Platform API Keys',
        categoryId: 'secrets',
        pattern: 'AIza[0-9A-Za-z\\-_]{35}',
        regexPattern: 'AIza[0-9A-Za-z\\-_]{35}',
        severity: 'high',
        detectionMethod: 'regex',
        actionOverride: 'mask',
        enabled: true,
        description: 'Google Cloud service account and API access tokens',
        matchCount24h: 15,
      },
    ],
  },
  {
    id: 'internal',
    name: 'Internal IP & Tokens',
    description: 'Internal subdomains, RFC1918 private subnets, authentication bearer tokens, and session headers.',
    badge: 'WARN',
    ruleCount: 4,
    activeRulesCount: 4,
    defaultAction: 'warn',
    rules: [
      {
        id: 'int-01',
        name: 'JWT & Bearer Authorization Headers',
        categoryId: 'internal',
        pattern: 'ey[A-Za-z0-9_-]{10,}\\.[A-Za-z0-9_-]{10,}\\.[A-Za-z0-9_-]{10,}',
        regexPattern: 'ey[A-Za-z0-9_-]{10,}\\.[A-Za-z0-9_-]{10,}\\.[A-Za-z0-9_-]{10,}',
        severity: 'high',
        detectionMethod: 'regex',
        actionOverride: 'mask',
        enabled: true,
        description: 'JSON Web Tokens signed for API session authorization',
        matchCount24h: 20,
      },
      {
        id: 'int-02',
        name: 'RFC1918 Private IPv4 Addresses',
        categoryId: 'internal',
        pattern: '\\b(?:10\\.\\d{1,3}|172\\.(?:1[6-9]|2\\d|3[01])|192\\.168)\\.\\d{1,3}\\.\\d{1,3}\\b',
        regexPattern: '\\b(?:10\\.\\d{1,3}|172\\.(?:1[6-9]|2\\d|3[01])|192\\.168)\\.\\d{1,3}\\.\\d{1,3}\\b',
        severity: 'medium',
        detectionMethod: 'regex',
        actionOverride: 'warn',
        enabled: true,
        description: 'Internal corporate subnets and VPC infrastructure IPs',
        matchCount24h: 16,
      },
      {
        id: 'int-03',
        name: 'Internal Domain & Hostnames (.internal, .local, .corp)',
        categoryId: 'internal',
        pattern: '[a-zA-Z0-9-]+\\.(?:internal|local|corp|lan)\\b',
        regexPattern: '[a-zA-Z0-9-]+\\.(?:internal|local|corp|lan)\\b',
        severity: 'low',
        detectionMethod: 'regex',
        actionOverride: 'default',
        enabled: true,
        description: 'Internal infrastructure DNS names and microservice hosts',
        matchCount24h: 11,
      },
      {
        id: 'int-04',
        name: 'Kubernetes Service Account Tokens',
        categoryId: 'internal',
        pattern: 'k8s-token-[a-zA-Z0-9]{32,}',
        regexPattern: 'k8s-token-[a-zA-Z0-9]{32,}',
        severity: 'critical',
        detectionMethod: 'regex',
        actionOverride: 'block',
        enabled: true,
        description: 'Cluster orchestration secret keys and service tokens',
        matchCount24h: 3,
      },
    ],
  },
];

/**
 * Mock ZeroLeak Inspection Engine
 * Detects sensitive entities safely in browser memory without sending secrets anywhere.
 */
export function inspectAndRedactText(text: string, currentRules?: PolicyRule[]): InspectionResult {
  const disabledPatterns = new Set(
    currentRules?.filter((r) => !r.enabled).map((r) => r.name.toLowerCase()) || []
  );
  const entities: SensitiveEntity[] = [];
  let sanitized = text;
  let counter = 1;

  // Patterns to evaluate
  const patterns: {
    type: string;
    category: 'pii' | 'financial' | 'secrets' | 'internal';
    regex: RegExp;
    severity: RiskLevel;
    action: PolicyAction;
    detector: string;
    placeholderPrefix: string;
  }[] = [
    {
      type: 'Stripe Live Secret Key',
      category: 'secrets',
      regex: /(?:sk|rk)_(?:live|test)_[0-9a-zA-Z_]{16,}/g,
      severity: 'critical',
      action: 'mask',
      detector: 'Custom Regex + Gitleaks',
      placeholderPrefix: 'SECRET',
    },
    {
      type: 'Database Connection String',
      category: 'secrets',
      regex: /(?:postgresql|postgres|mysql|mongodb(?:\+srv)?):\/\/[^\s"'<>]+/g,
      severity: 'critical',
      action: 'mask',
      detector: 'Database URI Pattern',
      placeholderPrefix: 'DATABASE_CREDENTIAL',
    },
    {
      type: 'AWS Root Secret Key',
      category: 'secrets',
      regex: /(?:wJalrXUtnFEMI\/K7MDENG\/bPxRfiCYEXAMPLEKEY|[A-Za-z0-9/+=]{40})/g,
      severity: 'critical',
      action: 'block',
      detector: 'Gitleaks CLI',
      placeholderPrefix: 'AWS_ROOT_SECRET',
    },
    {
      type: 'AWS Access Key ID',
      category: 'secrets',
      regex: /(?:AKIA|ASIA)[0-9A-Z]{16}/g,
      severity: 'critical',
      action: 'mask',
      detector: 'Custom Regex',
      placeholderPrefix: 'AWS_ACCESS_KEY',
    },
    {
      type: 'Corporate Email (PII)',
      category: 'pii',
      regex: /[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+/g,
      severity: 'medium',
      action: 'mask',
      detector: 'Microsoft Presidio Analyzer',
      placeholderPrefix: 'EMAIL',
    },
    {
      type: 'US Social Security Number (SSN)',
      category: 'pii',
      regex: /\b\d{3}-\d{2}-\d{4}\b/g,
      severity: 'critical',
      action: 'block',
      detector: 'Presidio + Regex',
      placeholderPrefix: 'SSN',
    },
    {
      type: 'JWT Bearer Session Token',
      category: 'internal',
      regex: /ey[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}/g,
      severity: 'high',
      action: 'mask',
      detector: 'Custom Regex',
      placeholderPrefix: 'BEARER_TOKEN',
    },
    {
      type: 'Credit Card Number',
      category: 'financial',
      regex: /\b(?:4[0-9]{12}(?:[0-9]{3})?|5[1-5][0-9]{14}|3[47][0-9]{13})\b/g,
      severity: 'critical',
      action: 'block',
      detector: 'Luhn Regex',
      placeholderPrefix: 'CREDIT_CARD',
    },
  ];

  let shouldBlock = false;
  let blockReason = '';

  for (const p of patterns) {
    if (disabledPatterns.has(p.type.toLowerCase())) continue;
    let match;
    const regex = new RegExp(p.regex.source, p.regex.flags);
    while ((match = regex.exec(text)) !== null) {
      const matchedValue = match[0];
      const placeholder = `<${p.placeholderPrefix}_${counter}>`;

      // Safe synthetic masked representation (never display entire raw secret)
      const maskedLength = matchedValue.length;
      const originalMasked =
        maskedLength > 8
          ? `${matchedValue.substring(0, 3)}••••••••••••${matchedValue.substring(maskedLength - 3)}`
          : '••••••••';

      if (p.action === 'block' || matchedValue.includes('EXAMPLEKEY') || p.type.includes('AWS Root')) {
        shouldBlock = true;
        blockReason = `Hard-blocked critical secret: ${p.type}`;
      }

      entities.push({
        id: `entity-${counter}-${Date.now()}`,
        type: p.type,
        category: p.category,
        placeholder,
        originalMasked,
        start: match.index,
        end: match.index + matchedValue.length,
        severity: p.severity,
        detector: p.detector,
        action: p.action,
        confidence: 0.98,
      });

      sanitized = sanitized.replace(matchedValue, `${placeholder} ; // [Redacted: ${p.type}]`);
      counter++;
    }
  }

  const hasSensitiveData = entities.length > 0;
  let riskScore = 0;
  let riskLevel: RiskLevel = 'low';

  if (hasSensitiveData) {
    if (shouldBlock || entities.some((e) => e.severity === 'critical')) {
      riskScore = 88;
      riskLevel = 'critical';
    } else if (entities.some((e) => e.severity === 'high')) {
      riskScore = 65;
      riskLevel = 'high';
    } else {
      riskScore = 35;
      riskLevel = 'medium';
    }
  }

  return {
    hasSensitiveData,
    riskScore,
    riskLevel,
    entities,
    sanitizedText: sanitized,
    recommendedAction: shouldBlock ? 'block' : hasSensitiveData ? 'mask' : 'allow',
    blocked: shouldBlock,
    blockedReason: blockReason,
    latencyMs: Math.floor(Math.random() * 8) + 6,
  };
}

/**
 * Generate simulated safe AI response
 */
export function getSimulatedAiResponse(sanitizedPrompt: string, model: string): {
  content: string;
  remediationSnippet?: { title: string; code: string; language: string };
  securityNote?: string;
} {
  return {
    content: `I have analyzed your sanitized query via ${model}.

The configuration or code logic demonstrates standard modular patterns, but notice that secrets and credentials must strictly be delegated to runtime environment parameters rather than embedded in code or prompt context.

Here is the secure implementation:`,
    remediationSnippet: {
      title: 'Remediation: Hardened Environment Variable Wrapper',
      language: 'typescript',
      code: `// VibeProofLens Automated Security Fix
import { config } from 'dotenv';
config();

export const securityConfig = {
  apiKey: process.env.SERVICE_API_KEY ?? '',
  databaseUrl: process.env.DATABASE_URL ?? '',
  timeoutMs: 5000,
};`,
    },
    securityNote:
      'ZeroLeak Gateway verified: External provider received 0 plaintext credentials. Ephemeral memory map will safely restore authorized surrogates upon client-side application.',
  };
}
