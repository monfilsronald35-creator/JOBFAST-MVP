import type { Request, Response, NextFunction } from 'express';
import { VerificationService } from '../services/VerificationService.js';
import { VerificationType } from '../types/verification.types.js';
import { AppError } from '../../../core/errors/AppError.js';

function asVerificationType(v: string): VerificationType {
  if (!Object.values(VerificationType).includes(v as VerificationType)) {
    throw new AppError(`Invalid verification type: ${v}`, 400, 'INVALID_TYPE');
  }
  return v as VerificationType;
}

export const VerificationController = {
  getAll: async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const [records, summary] = await Promise.all([
        VerificationService.getAll(req.user!.sub),
        VerificationService.getSummary(req.user!.sub),
      ]);
      res.json({ success: true, data: { records, summary } });
    } catch (err) { next(err); }
  },

  submit: async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const body = req.body as { type?: string; metadata?: Record<string, unknown> };
      const type = asVerificationType(body.type ?? '');
      const record = await VerificationService.submit(req.user!.sub, type, body.metadata);
      res.status(201).json({ success: true, data: record });
    } catch (err) { next(err); }
  },

  review: async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const body = req.body as { userId: string; type: string; decision: 'approve' | 'reject'; reason?: string; expiresAt?: string };
      const reviewOpts: Parameters<typeof VerificationService.review>[4] = {};
      if (body.reason)    reviewOpts.reason    = body.reason;
      if (body.expiresAt) reviewOpts.expiresAt = body.expiresAt;
      const record = await VerificationService.review(req.user!.sub, body.userId, asVerificationType(body.type), body.decision, reviewOpts);
      res.json({ success: true, data: record });
    } catch (err) { next(err); }
  },

  uploadDocument: async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const body = req.body as { type?: string; fileName?: string; fileUrl?: string; fileSize?: number; mimeType?: string; expiresAt?: string; metadata?: Record<string, unknown> };
      const docInput: Parameters<typeof VerificationService.uploadDocument>[1] = {
        type:     body.type as never,
        fileName: body.fileName!,
        fileUrl:  body.fileUrl!,
        fileSize: body.fileSize!,
        mimeType: body.mimeType ?? 'application/octet-stream',
        metadata: body.metadata ?? {},
      };
      if (body.expiresAt) (docInput as Record<string, unknown>)['expiresAt'] = body.expiresAt;
      const doc = await VerificationService.uploadDocument(req.user!.sub, docInput);
      res.status(201).json({ success: true, data: doc });
    } catch (err) { next(err); }
  },

  listDocuments: async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const docs = await VerificationService.listDocuments(req.user!.sub);
      res.json({ success: true, data: docs });
    } catch (err) { next(err); }
  },

  deleteDocument: async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { docId } = req.params as { docId: string };
      await VerificationService.deleteDocument(req.user!.sub, docId);
      res.json({ success: true });
    } catch (err) { next(err); }
  },
};
