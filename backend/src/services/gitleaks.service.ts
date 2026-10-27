import { spawn } from 'child_process';
import { SensitiveEntity } from '../types/index.js';

interface GitleaksFinding {
  Description: string;
  StartLine: number;
  EndLine: number;
  StartColumn: number;
  EndColumn: number;
  Match: string;
  Secret: string;
  RuleID: string;
  Entropy: number;
}

export class GitleaksService {
  private gitleaksAvailable: boolean | null = null;

  public async isAvailable(): Promise<boolean> {
    if (this.gitleaksAvailable !== null) return this.gitleaksAvailable;

    return new Promise((resolve) => {
      const proc = spawn('gitleaks', ['version'], { shell: true });
      proc.on('error', () => {
        this.gitleaksAvailable = false;
        resolve(false);
      });
      proc.on('close', (code) => {
        this.gitleaksAvailable = code === 0;
        resolve(code === 0);
      });
    });
  }

  public async scanContent(content: string): Promise<SensitiveEntity[]> {
    if (!content || content.length < 10) return [];

    const available = await this.isAvailable();
    if (!available) {
      return [];
    }

    return new Promise((resolve) => {
      const proc = spawn('gitleaks', ['detect', '--no-git', '--pipe', '--report-format', 'json'], {
        shell: true,
      });

      let stdout = '';
      let stderr = '';

      proc.stdout.on('data', (d) => {
        stdout += d.toString();
      });

      proc.stderr.on('data', (d) => {
        stderr += d.toString();
      });

      proc.on('close', () => {
        try {
          if (!stdout.trim()) {
            return resolve([]);
          }

          const findings: GitleaksFinding[] = JSON.parse(stdout);
          const entities: SensitiveEntity[] = [];

          let idx = 1;
          for (const f of findings) {
            const start = content.indexOf(f.Match);
            const end = start !== -1 ? start + f.Match.length : 0;

            entities.push({
              id: `gitleaks-${idx}-${Date.now()}`,
              type: f.RuleID || 'GITLEAKS_SECRET',
              category: 'secrets',
              placeholder: `<GITLEAKS_SECRET_${idx}>`,
              originalMasked: '••••••••',
              start: Math.max(0, start),
              end: Math.max(0, end),
              severity: 'critical',
              detector: `Gitleaks CLI (${f.Description || f.RuleID})`,
              action: 'block',
              confidence: 0.95,
            });
            idx++;
          }

          resolve(entities);
        } catch {
          resolve([]);
        }
      });

      proc.stdin.write(content);
      proc.stdin.end();
    });
  }
}

export const gitleaksService = new GitleaksService();
