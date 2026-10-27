import { Router, Request, Response, NextFunction } from 'express';
import multer from 'multer';
import * as fs from 'fs';
import * as path from 'path';
import { fileProcessingService } from '../services/file-processing.service.js';
import { auditService } from '../services/audit.service.js';
import { getDb, schema } from '../db/index.js';
import { eq, and } from 'drizzle-orm';
import { env } from '../config/env.js';

const router = Router();

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: env.MAX_UPLOAD_MB * 1024 * 1024,
  },
});

// 1. Scan / Redact Uploaded File
router.post(
  ['/files/scan', '/files/redact'],
  upload.single('file'),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!req.file) {
        res.status(400).json({
          error: {
            code: 'NO_FILE_UPLOADED',
            message: 'Please provide a file in the multipart form data under key "file".',
          },
        });
        return;
      }

      const result = await fileProcessingService.processUpload(
        req.file,
        req.user.id,
        req.user.organizationId
      );

      // Audit metadata only
      await auditService.recordLog({
        organizationId: req.user.organizationId,
        userId: req.user.id,
        requestId: req.requestId,
        operation: 'FILE_SCAN',
        detectedCount: result.detectedCount,
        redactedCount: result.redactedCount,
        policyAction: result.status === 'blocked' ? 'block' : result.redactedCount > 0 ? 'mask' : 'allow',
        outcome: result.status === 'blocked' ? 'Blocked' : result.redactedCount > 0 ? 'Sanitized' : 'Passed',
        latencyMs: result.processingTimeMs,
      });

      res.json({
        requestId: req.requestId,
        ...result,
        downloadUrl: `/api/v1/zeroleak/files/${result.fileId}/download`,
      });
    } catch (err) {
      next(err);
    }
  }
);

// 2. File Status
router.get('/files/:id/status', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const fileId = String(req.params.id);
    const db = getDb();

    const record = await db
      .select()
      .from(schema.fileRecords)
      .where(
        and(
          eq(schema.fileRecords.id, fileId),
          eq(schema.fileRecords.organizationId, req.user.organizationId)
        )
      )
      .limit(1);

    if (record.length === 0) {
      res.status(404).json({
        error: { code: 'FILE_NOT_FOUND', message: 'File record not found or access denied.' },
      });
      return;
    }

    res.json({
      requestId: req.requestId,
      file: record[0],
    });
  } catch (err) {
    next(err);
  }
});

// 3. Download Sanitized File
router.get('/files/:id/download', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const fileId = String(req.params.id);
    const db = getDb();

    // Verify ownership
    const record = await db
      .select()
      .from(schema.fileRecords)
      .where(
        and(
          eq(schema.fileRecords.id, fileId),
          eq(schema.fileRecords.organizationId, req.user.organizationId)
        )
      )
      .limit(1);

    if (record.length === 0) {
      res.status(404).json({
        error: { code: 'FILE_NOT_FOUND', message: 'File not found or access denied.' },
      });
      return;
    }

    const filePath = fileProcessingService.getSanitizedFilePath(fileId);
    if (!filePath || !fs.existsSync(filePath)) {
      res.status(404).json({
        error: { code: 'FILE_MISSING_ON_DISK', message: 'Sanitized file expired or missing.' },
      });
      return;
    }

    res.download(filePath, record[0].sanitizedFilename);
  } catch (err) {
    next(err);
  }
});

export const filesRoutes = router;
