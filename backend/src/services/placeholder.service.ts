import { v4 as uuidv4 } from 'uuid';
import { SensitiveEntity } from '../types/index.js';
import { env } from '../config/env.js';

interface PlaceholderEntry {
  placeholder: string;
  originalValue: string;
  entityType: string;
  restorable: boolean;
}

interface RequestMappingContext {
  handle: string;
  userId: string;
  organizationId: string;
  entries: Map<string, PlaceholderEntry>; // keyed by placeholder string
  createdAt: number;
  expiresAt: number;
}

export class PlaceholderService {
  // Volatile, in-memory isolation. Never written to DB or disk.
  private contexts = new Map<string, RequestMappingContext>();
  private defaultTtlMs: number;

  constructor() {
    this.defaultTtlMs = env.MAPPING_TTL_SECONDS * 1000;
    // Periodic garbage collection of expired in-memory mappings
    setInterval(() => this.cleanupExpired(), 30000).unref();
  }

  /**
   * Check if an entity type is safe for reversible context restoration.
   * Strictly allowlist PII types. Passwords, API keys, database URLs, and private keys
   * are STRICTLY non-restorable.
   */
  private isRestorableType(entityType: string): boolean {
    const restorableAllowlist = [
      'EMAIL_ADDRESS',
      'EMAIL',
      'PHONE_NUMBER',
      'PHONE',
      'PERSON',
      'LOCATION',
      'ORGANIZATION',
      'DATE_TIME',
    ];
    return restorableAllowlist.includes(entityType.toUpperCase());
  }

  /**
   * Creates a request-scoped mapping context and replaces detected substrings with typed placeholders
   */
  public createMapping(
    rawText: string,
    entities: SensitiveEntity[],
    userId: string,
    organizationId: string
  ): {
    sanitizedText: string;
    mappingHandle: string;
    entitiesCount: number;
  } {
    const handle = `zh-${uuidv4()}`;
    const now = Date.now();
    const context: RequestMappingContext = {
      handle,
      userId,
      organizationId,
      entries: new Map(),
      createdAt: now,
      expiresAt: now + this.defaultTtlMs,
    };

    if (!entities || entities.length === 0) {
      this.contexts.set(handle, context);
      return { sanitizedText: rawText, mappingHandle: handle, entitiesCount: 0 };
    }

    // Sort entities descending by start index to replace in reverse without index drifting
    const sorted = [...entities].sort((a, b) => b.start - a.start);
    let sanitized = rawText;

    for (const entity of sorted) {
      const originalValue = rawText.slice(entity.start, entity.end);
      const restorable = this.isRestorableType(entity.type);

      context.entries.set(entity.placeholder, {
        placeholder: entity.placeholder,
        originalValue,
        entityType: entity.type,
        restorable,
      });

      // Replace in text
      sanitized =
        sanitized.slice(0, entity.start) + entity.placeholder + sanitized.slice(entity.end);
    }

    this.contexts.set(handle, context);
    return {
      sanitizedText: sanitized,
      mappingHandle: handle,
      entitiesCount: context.entries.size,
    };
  }

  /**
   * Selectively restores ONLY restorable placeholders in model output within authenticated user context
   */
  public restorePermittedPlaceholders(
    sanitizedText: string,
    mappingHandle: string,
    userId: string,
    organizationId: string
  ): {
    restoredText: string;
    restoredCount: number;
    blockedRestoreCount: number;
  } {
    const context = this.contexts.get(mappingHandle);

    if (!context) {
      // Mapping expired or non-existent
      return { restoredText: sanitizedText, restoredCount: 0, blockedRestoreCount: 0 };
    }

    // Tenant and user ownership validation
    if (context.userId !== userId || context.organizationId !== organizationId) {
      console.warn(`[ZeroLeak Security] Cross-tenant placeholder access attempt blocked.`);
      return { restoredText: sanitizedText, restoredCount: 0, blockedRestoreCount: 0 };
    }

    if (Date.now() > context.expiresAt) {
      this.contexts.delete(mappingHandle);
      return { restoredText: sanitizedText, restoredCount: 0, blockedRestoreCount: 0 };
    }

    let result = sanitizedText;
    let restoredCount = 0;
    let blockedRestoreCount = 0;

    for (const [placeholder, entry] of context.entries) {
      if (result.includes(placeholder)) {
        if (entry.restorable) {
          result = result.split(placeholder).join(entry.originalValue);
          restoredCount++;
        } else {
          // Secret or critical credential: Leave as redacted placeholder!
          blockedRestoreCount++;
        }
      }
    }

    return {
      restoredText: result,
      restoredCount,
      blockedRestoreCount,
    };
  }

  /**
   * Explicitly flush mapping context after request lifecycle completes
   */
  public releaseMapping(mappingHandle: string): void {
    this.contexts.delete(mappingHandle);
  }

  /**
   * Check if a mapping handle exists and is active
   */
  public hasMapping(mappingHandle: string): boolean {
    return this.contexts.has(mappingHandle);
  }

  private cleanupExpired(): void {
    const now = Date.now();
    for (const [handle, ctx] of this.contexts.entries()) {
      if (now > ctx.expiresAt) {
        this.contexts.delete(handle);
      }
    }
  }
}

export const placeholderService = new PlaceholderService();
