import { getDb, schema } from './index.js';
import * as bcrypt from 'bcryptjs';

export async function seedDatabase() {
  const db = getDb();
  console.log('[ZeroLeak Seed] Initializing default workspace, user, and security policy rules...');

  try {
    // 1. Create Default Organization
    const defaultOrgId = 'org-default-workspace';
    await db
      .insert(schema.organizations)
      .values({
        id: defaultOrgId,
        name: 'Default Workspace',
      })
      .onConflictDoNothing();

    // 2. Create Default User (Workspace User / Local Developer)
    const defaultUserId = 'user-default-developer';
    const passwordHash = await bcrypt.hash('DeveloperSecurePass123!', 10);
    await db
      .insert(schema.users)
      .values({
        id: defaultUserId,
        email: 'developer@zeroleak.local',
        displayName: 'Workspace User',
        passwordHash,
        role: 'developer',
      })
      .onConflictDoNothing();

    // 3. Organization Membership
    await db
      .insert(schema.organizationMemberships)
      .values({
        id: 'mem-default-01',
        organizationId: defaultOrgId,
        userId: defaultUserId,
        role: 'developer',
      })
      .onConflictDoNothing();

    // 4. Default User Settings
    await db
      .insert(schema.userSettings)
      .values({
        id: 'settings-default-01',
        userId: defaultUserId,
        defaultProvider: 'Google Gemini',
        defaultModel: 'gemini-2.5-flash',
        redactionPolicy: 'mask_reversible',
        historyEnabled: true,
      })
      .onConflictDoNothing();

    console.log('[ZeroLeak Seed] Seed completed successfully.');
  } catch (err) {
    console.warn('[ZeroLeak Seed] Seed note (database might be in standby mode):', err instanceof Error ? err.message : err);
  }
}

if (process.argv[1]?.includes('seed')) {
  seedDatabase()
    .then(() => process.exit(0))
    .catch(() => process.exit(1));
}
