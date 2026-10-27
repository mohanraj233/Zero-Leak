import { SensitiveEntity, RiskLevel, PolicyAction } from '../types/index.js';

interface RegexPatternDef {
  type: string;
  category: 'secrets' | 'pii' | 'financial' | 'internal';
  regex: RegExp;
  severity: RiskLevel;
  action: PolicyAction;
  detector: string;
  placeholderPrefix: string;
  validator?: (match: string) => boolean;
}

// Luhn algorithm validator for credit cards
function validateLuhn(cardNumber: string): boolean {
  const digits = cardNumber.replace(/\D/g, '');
  if (digits.length < 13 || digits.length > 19) return false;
  let sum = 0;
  let shouldDouble = false;
  for (let i = digits.length - 1; i >= 0; i--) {
    let digit = parseInt(digits.charAt(i), 10);
    if (shouldDouble) {
      digit *= 2;
      if (digit > 9) digit -= 9;
    }
    sum += digit;
    shouldDouble = !shouldDouble;
  }
  return sum % 10 === 0;
}

export class RegexDetectorService {
  private patterns: RegexPatternDef[] = [
    // 1. AWS Access Keys
    {
      type: 'AWS_ACCESS_KEY',
      category: 'secrets',
      regex: /\b(?:AKIA|ASIA)[0-9A-Z]{16}\b/g,
      severity: 'critical',
      action: 'block',
      detector: 'ZeroLeak AWS Pattern',
      placeholderPrefix: 'AWS_ACCESS_KEY',
    },
    // 2. AWS Secret Access Keys
    {
      type: 'AWS_SECRET_KEY',
      category: 'secrets',
      regex: /(?:aws_secret_access_key|aws_secret_key|secret_key)\s*[:=]\s*["']?([A-Za-z0-9/+=]{40})["']?/gi,
      severity: 'critical',
      action: 'block',
      detector: 'ZeroLeak AWS Secret Pattern',
      placeholderPrefix: 'AWS_SECRET_KEY',
    },
    // 3. Stripe Secret & Restricted Keys
    {
      type: 'STRIPE_API_KEY',
      category: 'secrets',
      regex: /\b(?:sk|rk)_(?:live|test)_[0-9a-zA-Z_]{16,}\b/g,
      severity: 'critical',
      action: 'mask',
      detector: 'ZeroLeak Stripe Pattern',
      placeholderPrefix: 'STRIPE_SECRET',
    },
    // 4. GitHub Tokens
    {
      type: 'GITHUB_TOKEN',
      category: 'secrets',
      regex: /\b(?:ghp|gho|ghu|ghs|ghr)_[A-Za-z0-9_]{36,}\b|\bgithub_pat_[A-Za-z0-9_]{22}_[A-Za-z0-9_]{59}\b/g,
      severity: 'critical',
      action: 'block',
      detector: 'ZeroLeak GitHub Pattern',
      placeholderPrefix: 'GITHUB_PAT',
    },
    // 5. OpenAI API Keys
    {
      type: 'OPENAI_API_KEY',
      category: 'secrets',
      regex: /\bsk-(?:proj-)?[A-Za-z0-9]{20,48}T3BlbkFJ[A-Za-z0-9]{20,48}\b|\bsk-(?:proj-)?[A-Za-z0-9_-]{32,}\b/g,
      severity: 'critical',
      action: 'block',
      detector: 'ZeroLeak OpenAI Pattern',
      placeholderPrefix: 'OPENAI_KEY',
    },
    // 6. Slack API Tokens
    {
      type: 'SLACK_TOKEN',
      category: 'secrets',
      regex: /\bxox[baprs]-[0-9]{10,13}-[0-9]{10,13}[a-zA-Z0-9-]*\b/g,
      severity: 'high',
      action: 'mask',
      detector: 'ZeroLeak Slack Pattern',
      placeholderPrefix: 'SLACK_TOKEN',
    },
    // 7. Google Cloud API Keys
    {
      type: 'GOOGLE_API_KEY',
      category: 'secrets',
      regex: /\bAIza[0-9A-Za-z-_]{35}\b/g,
      severity: 'critical',
      action: 'block',
      detector: 'ZeroLeak Google API Pattern',
      placeholderPrefix: 'GOOGLE_API_KEY',
    },
    // 8. Database Connection Strings
    {
      type: 'DATABASE_URL',
      category: 'secrets',
      regex: /\b(?:postgresql|postgres|mysql|mongodb(?:\+srv)?|redis|rediss):\/\/[A-Za-z0-9_.-]+:[^@\s"']+@[A-Za-z0-9_.-]+(?::[0-9]+)?\/[A-Za-z0-9_.-]*/gi,
      severity: 'critical',
      action: 'mask',
      detector: 'ZeroLeak DB URI Pattern',
      placeholderPrefix: 'DATABASE_URL',
    },
    // 9. RSA & OpenSSH Private Key Headers
    {
      type: 'PRIVATE_KEY',
      category: 'secrets',
      regex: /-----BEGIN (?:RSA |EC |OPENSSH |DSA )?PRIVATE KEY-----[\s\S]*?-----END (?:RSA |EC |OPENSSH |DSA )?PRIVATE KEY-----/g,
      severity: 'critical',
      action: 'block',
      detector: 'ZeroLeak Private Key Pattern',
      placeholderPrefix: 'PRIVATE_KEY',
    },
    // 10. JWT Bearer Tokens
    {
      type: 'JWT_TOKEN',
      category: 'secrets',
      regex: /\beyJ[A-Za-z0-9-_]{10,}\.eyJ[A-Za-z0-9-_]{10,}\.[A-Za-z0-9-_]{10,}\b/g,
      severity: 'high',
      action: 'mask',
      detector: 'ZeroLeak JWT Pattern',
      placeholderPrefix: 'JWT_TOKEN',
    },
    // 11. Generic Password Assignments in Code/JSON
    {
      type: 'PASSWORD_ASSIGNMENT',
      category: 'secrets',
      regex: /(?:password|passwd|pwd|db_pass|api_secret)\s*[:=]\s*["']([^"'\s]{6,64})["']/gi,
      severity: 'high',
      action: 'mask',
      detector: 'ZeroLeak Password Assignment Pattern',
      placeholderPrefix: 'PASSWORD',
    },
    // 12. Email Addresses
    {
      type: 'EMAIL_ADDRESS',
      category: 'pii',
      regex: /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}\b/g,
      severity: 'medium',
      action: 'mask',
      detector: 'ZeroLeak PII Email Pattern',
      placeholderPrefix: 'EMAIL',
    },
    // 13. US Social Security Numbers
    {
      type: 'US_SSN',
      category: 'pii',
      regex: /\b(?!000|666|9\d{2})\d{3}-(?!00)\d{2}-(?!0000)\d{4}\b/g,
      severity: 'critical',
      action: 'block',
      detector: 'ZeroLeak SSN Pattern',
      placeholderPrefix: 'SSN',
    },
    // 14. Credit & Debit Cards (with Luhn check)
    {
      type: 'CREDIT_CARD',
      category: 'financial',
      regex: /\b(?:4[0-9]{12}(?:[0-9]{3})?|5[1-5][0-9]{14}|3[47][0-9]{13}|6(?:011|5[0-9]{2})[0-9]{12})\b/g,
      severity: 'critical',
      action: 'block',
      detector: 'ZeroLeak Credit Card Pattern',
      placeholderPrefix: 'CREDIT_CARD',
      validator: validateLuhn,
    },
    // 15. US & International Phone Numbers
    {
      type: 'PHONE_NUMBER',
      category: 'pii',
      regex: /(?:\+?1[-.\s]?)?\(?[2-9]\d{2}\)?[-.\s]?[2-9]\d{2}[-.\s]?\d{4}\b/g,
      severity: 'low',
      action: 'mask',
      detector: 'ZeroLeak Phone Pattern',
      placeholderPrefix: 'PHONE',
    },
    // 16. Internal IPv4 Addresses
    {
      type: 'IPV4_ADDRESS',
      category: 'internal',
      regex: /\b(?:10\.\d{1,3}\.\d{1,3}\.\d{1,3}|172\.(?:1[6-9]|2\d|3[01])\.\d{1,3}\.\d{1,3}|192\.168\.\d{1,3}\.\d{1,3})\b/g,
      severity: 'low',
      action: 'mask',
      detector: 'ZeroLeak Private IP Pattern',
      placeholderPrefix: 'INTERNAL_IP',
    },
  ];

  public detect(text: string): SensitiveEntity[] {
    if (!text || text.trim().length === 0) {
      return [];
    }

    const entities: SensitiveEntity[] = [];
    let counter = 1;

    for (const p of this.patterns) {
      // Re-initialize regex
      const re = new RegExp(p.regex.source, p.regex.flags);
      let match: RegExpExecArray | null;

      while ((match = re.exec(text)) !== null) {
        const matchedValue = match[0];

        // Apply custom validator if present (e.g., Luhn check)
        if (p.validator && !p.validator(matchedValue)) {
          continue;
        }

        const start = match.index;
        const end = start + matchedValue.length;

        // Masked synthetic preview for safe display only (never expose full raw secret)
        const maskedLength = matchedValue.length;
        const originalMasked =
          maskedLength > 8
            ? `${matchedValue.slice(0, 3)}••••••••••••${matchedValue.slice(-3)}`
            : '••••••••';

        entities.push({
          id: `entity-${counter}-${Date.now()}`,
          type: p.type,
          category: p.category,
          placeholder: `<${p.placeholderPrefix}_${counter}>`,
          originalMasked,
          start,
          end,
          severity: p.severity,
          detector: p.detector,
          action: p.action,
          confidence: 0.98,
        });

        counter++;
      }
    }

    // Sort by start offset and resolve overlaps
    return this.resolveOverlaps(entities);
  }

  private resolveOverlaps(entities: SensitiveEntity[]): SensitiveEntity[] {
    if (entities.length <= 1) return entities;

    // Sort by start offset ascending, then by length descending
    entities.sort((a, b) => a.start - b.start || (b.end - b.start) - (a.end - a.start));

    const resolved: SensitiveEntity[] = [];
    let currentEnd = -1;

    for (const entity of entities) {
      if (entity.start >= currentEnd) {
        resolved.push(entity);
        currentEnd = entity.end;
      }
    }

    return resolved;
  }
}

export const regexDetector = new RegexDetectorService();
