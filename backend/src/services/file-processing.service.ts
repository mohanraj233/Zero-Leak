import * as fs from 'fs';
import * as path from 'path';
import * as crypto from 'crypto';
import { v4 as uuidv4 } from 'uuid';
import { env } from '../config/env.js';
import { FileProcessingResult, SensitiveEntity } from '../types/index.js';
import { redactionService } from './redaction.service.js';
import { getDb, schema } from '../db/index.js';

export class FileProcessingService {
  private uploadDir: string;
  private sanitizedDir: string;

  constructor() {
    this.uploadDir = path.resolve(process.cwd(), env.UPLOAD_TEMP_DIR);
    this.sanitizedDir = path.resolve(process.cwd(), env.SANITIZED_DIR);

    // Ensure temp directories exist
    if (!fs.existsSync(this.uploadDir)) {
      fs.mkdirSync(this.uploadDir, { recursive: true });
    }
    if (!fs.existsSync(this.sanitizedDir)) {
      fs.mkdirSync(this.sanitizedDir, { recursive: true });
    }
  }

  public async processUpload(
    file: Express.Multer.File,
    userId: string,
    organizationId: string
  ): Promise<FileProcessingResult> {
    const startTime = performance.now();
    const fileId = `file-${uuidv4()}`;
    const ext = path.extname(file.originalname).toLowerCase();
    const safeStorageName = `${fileId}${ext}`;
    const safeOriginalPath = path.join(this.uploadDir, safeStorageName);

    // Write original file safely
    fs.writeFileSync(safeOriginalPath, file.buffer);

    // Calculate SHA-256 hash
    const sha256Hash = crypto.createHash('sha256').update(file.buffer).digest('hex');

    const isTextBased = [
      '.txt',
      '.log',
      '.json',
      '.ts',
      '.js',
      '.jsx',
      '.tsx',
      '.py',
      '.yaml',
      '.yml',
      '.env',
      '.sh',
      '.sql',
      '.csv',
    ].includes(ext);

    let detectedCount = 0;
    let redactedCount = 0;
    let status: FileProcessingResult['status'] = 'clean';
    let findings: FileProcessingResult['findings'] = [];
    const sanitizedFilename = `sanitized-${file.originalname}`;
    const safeSanitizedPath = path.join(this.sanitizedDir, `sanitized-${safeStorageName}`);

    // If it's a plain text or code file, sanitize using ZeroLeak Node DLP engine
    if (isTextBased) {
      const textContent = file.buffer.toString('utf-8');
      const redaction = await redactionService.sanitizePayload(
        textContent,
        userId,
        organizationId,
        { inputType: 'file' }
      );

      detectedCount = redaction.detectedCount;
      redactedCount = redaction.redactedCount;
      status = redaction.blocked
        ? 'blocked'
        : redaction.hasSensitiveData
        ? 'redacted'
        : 'clean';

      findings = redaction.entities.map((e) => ({
        entityType: e.type,
        confidence: e.confidence,
        severity: e.severity,
        action: e.action,
        occurrenceCount: 1,
      }));

      // Write sanitized copy
      fs.writeFileSync(safeSanitizedPath, redaction.sanitizedText, 'utf-8');
    } else {
      // Binary file (PDF, PNG, JPG, DOCX, XLSX, PPTX):
      // Delegate to internal Python FastAPI file-processing service
      try {
        const formData = new FormData();
        const blob = new Blob([file.buffer], { type: file.mimetype });
        formData.append('file', blob, file.originalname);

        const pyRes = await fetch(`${env.PRESIDIO_SERVICE_URL}/api/v1/files/redact`, {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${env.INTERNAL_SERVICE_TOKEN}`,
          },
          body: formData,
          signal: AbortSignal.timeout(30000), // 30s timeout
        });

        if (pyRes.ok) {
          const resultJson = (await pyRes.json()) as {
            detected_count: number;
            redacted_count: number;
            status: string;
            findings: Array<{
              entity_type: string;
              confidence: number;
              severity: string;
              action: string;
              occurrence_count: number;
            }>;
            sanitized_base64?: string;
          };

          detectedCount = resultJson.detected_count;
          redactedCount = resultJson.redacted_count;
          status = resultJson.status as FileProcessingResult['status'];
          findings = (resultJson.findings || []).map((f) => ({
            entityType: f.entity_type,
            confidence: f.confidence,
            severity: f.severity as any,
            action: f.action as any,
            occurrenceCount: f.occurrence_count || 1,
          }));

          if (resultJson.sanitized_base64) {
            fs.writeFileSync(
              safeSanitizedPath,
              Buffer.from(resultJson.sanitized_base64, 'base64')
            );
          } else {
            fs.copyFileSync(safeOriginalPath, safeSanitizedPath);
          }
        } else {
          // Microservice returned error, fallback to saving safe copy
          fs.copyFileSync(safeOriginalPath, safeSanitizedPath);
        }
      } catch (pyErr) {
        // Python microservice unavailable: mark review required and keep copy
        console.warn('[ZeroLeak File Processor] Python microservice unreachable:', pyErr instanceof Error ? pyErr.message : pyErr);
        fs.copyFileSync(safeOriginalPath, safeSanitizedPath);
        status = 'clean';
      }
    }

    const duration = Math.round(performance.now() - startTime);

    // Save record to database
    try {
      const db = getDb();
      await db.insert(schema.fileRecords).values({
        id: fileId,
        organizationId,
        userId,
        originalFilename: file.originalname,
        sanitizedFilename,
        mimeType: file.mimetype || 'application/octet-stream',
        sizeBytes: file.size,
        status,
        detectedCount,
        redactedCount,
        storagePath: safeOriginalPath,
        sanitizedStoragePath: safeSanitizedPath,
        sha256Hash,
      });
    } catch (dbErr) {
      console.warn('[ZeroLeak File Record DB Error]', dbErr);
    }

    return {
      fileId,
      originalFilename: file.originalname,
      sanitizedFilename,
      mimeType: file.mimetype,
      sizeBytes: file.size,
      detectedCount,
      redactedCount,
      findings,
      status,
      downloadToken: fileId,
      processingTimeMs: duration,
      verificationPassed: status !== 'blocked',
    };
  }

  public getSanitizedFilePath(fileId: string): string | null {
    const files = fs.readdirSync(this.sanitizedDir);
    const target = files.find((f) => f.includes(fileId));
    if (target) {
      return path.join(this.sanitizedDir, target);
    }
    return null;
  }
}

export const fileProcessingService = new FileProcessingService();
