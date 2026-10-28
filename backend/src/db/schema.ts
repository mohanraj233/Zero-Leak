import {
  pgTable,
  text,
  varchar,
  timestamp,
  integer,
  boolean,
  real,
  index,
  uniqueIndex,
} from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

// 1. Organizations
export const organizations = pgTable(
  'organizations',
  {
    id: varchar('id', { length: 64 }).primaryKey(),
    name: varchar('name', { length: 255 }).notNull(),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
  },
  (table) => [
    index('org_name_idx').on(table.name),
  ]
);

// 2. Users
export const users = pgTable(
  'users',
  {
    id: varchar('id', { length: 64 }).primaryKey(),
    email: varchar('email', { length: 255 }).notNull().unique(),
    displayName: varchar('display_name', { length: 255 }).notNull(),
    passwordHash: varchar('password_hash', { length: 255 }).notNull(),
    role: varchar('role', { length: 50 }).default('developer').notNull(),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
  },
  (table) => [
    uniqueIndex('user_email_idx').on(table.email),
  ]
);

// 3. Organization Memberships
export const organizationMemberships = pgTable(
  'organization_memberships',
  {
    id: varchar('id', { length: 64 }).primaryKey(),
    organizationId: varchar('organization_id', { length: 64 })
      .notNull()
      .references(() => organizations.id, { onDelete: 'cascade' }),
    userId: varchar('user_id', { length: 64 })
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    role: varchar('role', { length: 50 }).default('developer').notNull(),
    createdAt: timestamp('created_at').defaultNow().notNull(),
  },
  (table) => [
    index('org_mem_org_idx').on(table.organizationId),
    index('org_mem_user_idx').on(table.userId),
  ]
);

// 4. Redaction Scans (Metadata only - Never raw prompts or secrets)
export const redactionScans = pgTable(
  'redaction_scans',
  {
    id: varchar('id', { length: 64 }).primaryKey(),
    organizationId: varchar('organization_id', { length: 64 })
      .notNull()
      .references(() => organizations.id, { onDelete: 'cascade' }),
    userId: varchar('user_id', { length: 64 })
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    requestId: varchar('request_id', { length: 128 }).notNull(),
    inputType: varchar('input_type', { length: 50 }).notNull(), // 'prompt', 'code', 'file'
    status: varchar('status', { length: 50 }).notNull(), // 'clean', 'sanitized', 'blocked', 'failed'
    detectedCount: integer('detected_count').default(0).notNull(),
    redactedCount: integer('redacted_count').default(0).notNull(),
    blockedCount: integer('blocked_count').default(0).notNull(),
    policyVersion: varchar('policy_version', { length: 50 }).default('v2.4').notNull(),
    processingDurationMs: integer('processing_duration_ms').default(0).notNull(),
    createdAt: timestamp('created_at').defaultNow().notNull(),
  },
  (table) => [
    index('scan_org_idx').on(table.organizationId),
    index('scan_req_idx').on(table.requestId),
    index('scan_created_idx').on(table.createdAt),
  ]
);

// 5. Redaction Findings (Safe entity metadata only)
export const redactionFindings = pgTable(
  'redaction_findings',
  {
    id: varchar('id', { length: 64 }).primaryKey(),
    scanId: varchar('scan_id', { length: 64 })
      .notNull()
      .references(() => redactionScans.id, { onDelete: 'cascade' }),
    entityType: varchar('entity_type', { length: 100 }).notNull(),
    confidence: real('confidence').default(1.0).notNull(),
    severity: varchar('severity', { length: 50 }).notNull(), // 'low', 'medium', 'high', 'critical'
    action: varchar('action', { length: 50 }).notNull(), // 'mask', 'block', 'warn', 'allow'
    maskedPreview: varchar('masked_preview', { length: 255 }), // synthetic masked preview only
    occurrenceCount: integer('occurrence_count').default(1).notNull(),
    createdAt: timestamp('created_at').defaultNow().notNull(),
  },
  (table) => [
    index('findings_scan_idx').on(table.scanId),
    index('findings_type_idx').on(table.entityType),
  ]
);

// 6. Chat Sessions
export const chatSessions = pgTable(
  'chat_sessions',
  {
    id: varchar('id', { length: 64 }).primaryKey(),
    organizationId: varchar('organization_id', { length: 64 })
      .notNull()
      .references(() => organizations.id, { onDelete: 'cascade' }),
    userId: varchar('user_id', { length: 64 })
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    title: varchar('title', { length: 255 }).notNull(),
    provider: varchar('provider', { length: 100 }).default('Google Gemini').notNull(),
    model: varchar('model', { length: 100 }).default('gemini-3.8-flash').notNull(),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
  },
  (table) => [
    index('session_org_idx').on(table.organizationId),
    index('session_user_idx').on(table.userId),
    index('session_created_idx').on(table.createdAt),
  ]
);

// 7. Chat Messages (Only sanitized content stored permanently)
export const chatMessages = pgTable(
  'chat_messages',
  {
    id: varchar('id', { length: 64 }).primaryKey(),
    sessionId: varchar('session_id', { length: 64 })
      .notNull()
      .references(() => chatSessions.id, { onDelete: 'cascade' }),
    role: varchar('role', { length: 50 }).notNull(), // 'user', 'assistant', 'system'
    sanitizedContent: text('sanitized_content').notNull(),
    status: varchar('status', { length: 50 }).default('clean').notNull(), // 'clean', 'redacted', 'blocked', 'safe_response'
    createdAt: timestamp('created_at').defaultNow().notNull(),
  },
  (table) => [
    index('msg_session_idx').on(table.sessionId),
    index('msg_created_idx').on(table.createdAt),
  ]
);

// 8. ZeroLeak Audit Logs (Strict metadata only - zero raw secrets)
export const zeroLeakAuditLogs = pgTable(
  'zero_leak_audit_logs',
  {
    id: varchar('id', { length: 64 }).primaryKey(),
    organizationId: varchar('organization_id', { length: 64 })
      .notNull()
      .references(() => organizations.id, { onDelete: 'cascade' }),
    userId: varchar('user_id', { length: 64 })
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    requestId: varchar('request_id', { length: 128 }).notNull(),
    operation: varchar('operation', { length: 100 }).notNull(), // 'INSPECT', 'REDACT', 'AI_CHAT', 'FILE_SCAN'
    provider: varchar('provider', { length: 100 }).default('Google Gemini'),
    model: varchar('model', { length: 100 }).default('gemini-3.8-flash'),
    detectedCount: integer('detected_count').default(0).notNull(),
    redactedCount: integer('redacted_count').default(0).notNull(),
    policyAction: varchar('policy_action', { length: 50 }).notNull(), // 'mask', 'block', 'allow', 'warn'
    outcome: varchar('outcome', { length: 50 }).notNull(), // 'Passed', 'Sanitized', 'Blocked', 'Failed'
    latencyMs: integer('latency_ms').default(0).notNull(),
    createdAt: timestamp('created_at').defaultNow().notNull(),
  },
  (table) => [
    index('audit_org_idx').on(table.organizationId),
    index('audit_user_idx').on(table.userId),
    index('audit_created_idx').on(table.createdAt),
    index('audit_outcome_idx').on(table.outcome),
  ]
);

// 9. User Settings
export const userSettings = pgTable(
  'user_settings',
  {
    id: varchar('id', { length: 64 }).primaryKey(),
    userId: varchar('user_id', { length: 64 })
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' })
      .unique(),
    defaultProvider: varchar('default_provider', { length: 100 }).default('Google Gemini').notNull(),
    defaultModel: varchar('default_model', { length: 100 }).default('gemini-3.8-flash').notNull(),
    redactionPolicy: varchar('redaction_policy', { length: 50 }).default('mask_reversible').notNull(),
    historyEnabled: boolean('history_enabled').default(true).notNull(),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
  },
  (table) => [
    uniqueIndex('settings_user_idx').on(table.userId),
  ]
);

// 10. File Records (Secure storage references for sanitized files)
export const fileRecords = pgTable(
  'file_records',
  {
    id: varchar('id', { length: 64 }).primaryKey(),
    organizationId: varchar('organization_id', { length: 64 })
      .notNull()
      .references(() => organizations.id, { onDelete: 'cascade' }),
    userId: varchar('user_id', { length: 64 })
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    originalFilename: varchar('original_filename', { length: 255 }).notNull(),
    sanitizedFilename: varchar('sanitized_filename', { length: 255 }).notNull(),
    mimeType: varchar('mime_type', { length: 100 }).notNull(),
    sizeBytes: integer('size_bytes').default(0).notNull(),
    status: varchar('status', { length: 50 }).notNull(), // 'clean', 'redacted', 'blocked', 'error'
    detectedCount: integer('detected_count').default(0).notNull(),
    redactedCount: integer('redacted_count').default(0).notNull(),
    storagePath: varchar('storage_path', { length: 500 }).notNull(),
    sanitizedStoragePath: varchar('sanitized_storage_path', { length: 500 }),
    sha256Hash: varchar('sha256_hash', { length: 64 }).notNull(),
    createdAt: timestamp('created_at').defaultNow().notNull(),
  },
  (table) => [
    index('file_org_idx').on(table.organizationId),
    index('file_user_idx').on(table.userId),
    index('file_created_idx').on(table.createdAt),
  ]
);

// 11. Policy Rules (Organization-level security rule overrides)
export const policyRules = pgTable(
  'policy_rules',
  {
    id: varchar('id', { length: 64 }).primaryKey(),
    organizationId: varchar('organization_id', { length: 64 })
      .notNull()
      .references(() => organizations.id, { onDelete: 'cascade' }),
    ruleKey: varchar('rule_key', { length: 100 }).notNull(),
    name: varchar('name', { length: 255 }).notNull(),
    categoryId: varchar('category_id', { length: 50 }).notNull(),
    pattern: text('pattern').notNull(),
    regexPattern: text('regex_pattern'),
    severity: varchar('severity', { length: 50 }).notNull(),
    detectionMethod: varchar('detection_method', { length: 50 }).notNull(),
    actionOverride: varchar('action_override', { length: 50 }).default('default').notNull(),
    enabled: boolean('enabled').default(true).notNull(),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
  },
  (table) => [
    index('policy_rule_org_idx').on(table.organizationId),
    index('policy_rule_key_idx').on(table.ruleKey),
  ]
);

// Relationships
export const organizationsRelations = relations(organizations, ({ many }) => ({
  members: many(organizationMemberships),
  scans: many(redactionScans),
  chatSessions: many(chatSessions),
  auditLogs: many(zeroLeakAuditLogs),
  files: many(fileRecords),
  rules: many(policyRules),
}));

export const usersRelations = relations(users, ({ many, one }) => ({
  memberships: many(organizationMemberships),
  scans: many(redactionScans),
  chatSessions: many(chatSessions),
  auditLogs: many(zeroLeakAuditLogs),
  files: many(fileRecords),
  settings: one(userSettings, {
    fields: [users.id],
    references: [userSettings.userId],
  }),
}));

export const redactionScansRelations = relations(redactionScans, ({ one, many }) => ({
  organization: one(organizations, {
    fields: [redactionScans.organizationId],
    references: [organizations.id],
  }),
  user: one(users, {
    fields: [redactionScans.userId],
    references: [users.id],
  }),
  findings: many(redactionFindings),
}));

export const redactionFindingsRelations = relations(redactionFindings, ({ one }) => ({
  scan: one(redactionScans, {
    fields: [redactionFindings.scanId],
    references: [redactionScans.id],
  }),
}));

export const chatSessionsRelations = relations(chatSessions, ({ one, many }) => ({
  organization: one(organizations, {
    fields: [chatSessions.organizationId],
    references: [organizations.id],
  }),
  user: one(users, {
    fields: [chatSessions.userId],
    references: [users.id],
  }),
  messages: many(chatMessages),
}));

export const chatMessagesRelations = relations(chatMessages, ({ one }) => ({
  session: one(chatSessions, {
    fields: [chatMessages.sessionId],
    references: [chatSessions.id],
  }),
}));
