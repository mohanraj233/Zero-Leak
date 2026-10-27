CREATE TABLE "chat_messages" (
	"id" varchar(64) PRIMARY KEY NOT NULL,
	"session_id" varchar(64) NOT NULL,
	"role" varchar(50) NOT NULL,
	"sanitized_content" text NOT NULL,
	"status" varchar(50) DEFAULT 'clean' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "chat_sessions" (
	"id" varchar(64) PRIMARY KEY NOT NULL,
	"organization_id" varchar(64) NOT NULL,
	"user_id" varchar(64) NOT NULL,
	"title" varchar(255) NOT NULL,
	"provider" varchar(100) DEFAULT 'Google Gemini' NOT NULL,
	"model" varchar(100) DEFAULT 'gemini-2.5-flash' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "file_records" (
	"id" varchar(64) PRIMARY KEY NOT NULL,
	"organization_id" varchar(64) NOT NULL,
	"user_id" varchar(64) NOT NULL,
	"original_filename" varchar(255) NOT NULL,
	"sanitized_filename" varchar(255) NOT NULL,
	"mime_type" varchar(100) NOT NULL,
	"size_bytes" integer DEFAULT 0 NOT NULL,
	"status" varchar(50) NOT NULL,
	"detected_count" integer DEFAULT 0 NOT NULL,
	"redacted_count" integer DEFAULT 0 NOT NULL,
	"storage_path" varchar(500) NOT NULL,
	"sanitized_storage_path" varchar(500),
	"sha256_hash" varchar(64) NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "organization_memberships" (
	"id" varchar(64) PRIMARY KEY NOT NULL,
	"organization_id" varchar(64) NOT NULL,
	"user_id" varchar(64) NOT NULL,
	"role" varchar(50) DEFAULT 'developer' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "organizations" (
	"id" varchar(64) PRIMARY KEY NOT NULL,
	"name" varchar(255) NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "policy_rules" (
	"id" varchar(64) PRIMARY KEY NOT NULL,
	"organization_id" varchar(64) NOT NULL,
	"rule_key" varchar(100) NOT NULL,
	"name" varchar(255) NOT NULL,
	"category_id" varchar(50) NOT NULL,
	"pattern" text NOT NULL,
	"regex_pattern" text,
	"severity" varchar(50) NOT NULL,
	"detection_method" varchar(50) NOT NULL,
	"action_override" varchar(50) DEFAULT 'default' NOT NULL,
	"enabled" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "redaction_findings" (
	"id" varchar(64) PRIMARY KEY NOT NULL,
	"scan_id" varchar(64) NOT NULL,
	"entity_type" varchar(100) NOT NULL,
	"confidence" real DEFAULT 1 NOT NULL,
	"severity" varchar(50) NOT NULL,
	"action" varchar(50) NOT NULL,
	"masked_preview" varchar(255),
	"occurrence_count" integer DEFAULT 1 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "redaction_scans" (
	"id" varchar(64) PRIMARY KEY NOT NULL,
	"organization_id" varchar(64) NOT NULL,
	"user_id" varchar(64) NOT NULL,
	"request_id" varchar(128) NOT NULL,
	"input_type" varchar(50) NOT NULL,
	"status" varchar(50) NOT NULL,
	"detected_count" integer DEFAULT 0 NOT NULL,
	"redacted_count" integer DEFAULT 0 NOT NULL,
	"blocked_count" integer DEFAULT 0 NOT NULL,
	"policy_version" varchar(50) DEFAULT 'v2.4' NOT NULL,
	"processing_duration_ms" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "user_settings" (
	"id" varchar(64) PRIMARY KEY NOT NULL,
	"user_id" varchar(64) NOT NULL,
	"default_provider" varchar(100) DEFAULT 'Google Gemini' NOT NULL,
	"default_model" varchar(100) DEFAULT 'gemini-2.5-flash' NOT NULL,
	"redaction_policy" varchar(50) DEFAULT 'mask_reversible' NOT NULL,
	"history_enabled" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "user_settings_user_id_unique" UNIQUE("user_id")
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" varchar(64) PRIMARY KEY NOT NULL,
	"email" varchar(255) NOT NULL,
	"display_name" varchar(255) NOT NULL,
	"password_hash" varchar(255) NOT NULL,
	"role" varchar(50) DEFAULT 'developer' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "users_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "zero_leak_audit_logs" (
	"id" varchar(64) PRIMARY KEY NOT NULL,
	"organization_id" varchar(64) NOT NULL,
	"user_id" varchar(64) NOT NULL,
	"request_id" varchar(128) NOT NULL,
	"operation" varchar(100) NOT NULL,
	"provider" varchar(100) DEFAULT 'Google Gemini',
	"model" varchar(100) DEFAULT 'gemini-2.5-flash',
	"detected_count" integer DEFAULT 0 NOT NULL,
	"redacted_count" integer DEFAULT 0 NOT NULL,
	"policy_action" varchar(50) NOT NULL,
	"outcome" varchar(50) NOT NULL,
	"latency_ms" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "chat_messages" ADD CONSTRAINT "chat_messages_session_id_chat_sessions_id_fk" FOREIGN KEY ("session_id") REFERENCES "public"."chat_sessions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "chat_sessions" ADD CONSTRAINT "chat_sessions_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "chat_sessions" ADD CONSTRAINT "chat_sessions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "file_records" ADD CONSTRAINT "file_records_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "file_records" ADD CONSTRAINT "file_records_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "organization_memberships" ADD CONSTRAINT "organization_memberships_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "organization_memberships" ADD CONSTRAINT "organization_memberships_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "policy_rules" ADD CONSTRAINT "policy_rules_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "redaction_findings" ADD CONSTRAINT "redaction_findings_scan_id_redaction_scans_id_fk" FOREIGN KEY ("scan_id") REFERENCES "public"."redaction_scans"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "redaction_scans" ADD CONSTRAINT "redaction_scans_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "redaction_scans" ADD CONSTRAINT "redaction_scans_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_settings" ADD CONSTRAINT "user_settings_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "zero_leak_audit_logs" ADD CONSTRAINT "zero_leak_audit_logs_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "zero_leak_audit_logs" ADD CONSTRAINT "zero_leak_audit_logs_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "msg_session_idx" ON "chat_messages" USING btree ("session_id");--> statement-breakpoint
CREATE INDEX "msg_created_idx" ON "chat_messages" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "session_org_idx" ON "chat_sessions" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "session_user_idx" ON "chat_sessions" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "session_created_idx" ON "chat_sessions" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "file_org_idx" ON "file_records" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "file_user_idx" ON "file_records" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "file_created_idx" ON "file_records" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "org_mem_org_idx" ON "organization_memberships" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "org_mem_user_idx" ON "organization_memberships" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "org_name_idx" ON "organizations" USING btree ("name");--> statement-breakpoint
CREATE INDEX "policy_rule_org_idx" ON "policy_rules" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "policy_rule_key_idx" ON "policy_rules" USING btree ("rule_key");--> statement-breakpoint
CREATE INDEX "findings_scan_idx" ON "redaction_findings" USING btree ("scan_id");--> statement-breakpoint
CREATE INDEX "findings_type_idx" ON "redaction_findings" USING btree ("entity_type");--> statement-breakpoint
CREATE INDEX "scan_org_idx" ON "redaction_scans" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "scan_req_idx" ON "redaction_scans" USING btree ("request_id");--> statement-breakpoint
CREATE INDEX "scan_created_idx" ON "redaction_scans" USING btree ("created_at");--> statement-breakpoint
CREATE UNIQUE INDEX "settings_user_idx" ON "user_settings" USING btree ("user_id");--> statement-breakpoint
CREATE UNIQUE INDEX "user_email_idx" ON "users" USING btree ("email");--> statement-breakpoint
CREATE INDEX "audit_org_idx" ON "zero_leak_audit_logs" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "audit_user_idx" ON "zero_leak_audit_logs" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "audit_created_idx" ON "zero_leak_audit_logs" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "audit_outcome_idx" ON "zero_leak_audit_logs" USING btree ("outcome");