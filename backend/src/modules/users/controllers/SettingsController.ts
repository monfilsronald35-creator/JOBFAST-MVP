import type { Request, Response } from 'express';
import { SettingsService } from '../services/SettingsService.js';

export const SettingsController = {
  async getSettings(req: Request, res: Response): Promise<void> {
    try {
      const userId   = String(req.user?.sub ?? '');
      const settings = await SettingsService.getSettings(userId);
      res.json({ settings });
    } catch (err) {
      res.status(500).json({ error: String(err) });
    }
  },

  async updateSettings(req: Request, res: Response): Promise<void> {
    try {
      const userId   = String(req.user?.sub ?? '');
      const settings = await SettingsService.updateSettings(userId, req.body as never);
      res.json({ settings });
    } catch (err) {
      res.status(500).json({ error: String(err) });
    }
  },

  async getSessions(req: Request, res: Response): Promise<void> {
    try {
      const userId   = String(req.user?.sub ?? '');
      const sessions = await SettingsService.getSessions(userId);
      res.json({ sessions });
    } catch (err) {
      res.status(500).json({ error: String(err) });
    }
  },

  async revokeSession(req: Request, res: Response): Promise<void> {
    try {
      const userId    = String(req.user?.sub ?? '');
      const sessionId = String(req.params['sessionId'] ?? '');
      await SettingsService.revokeSession(userId, sessionId);
      res.json({ ok: true });
    } catch (err) {
      res.status(500).json({ error: String(err) });
    }
  },

  async getDevices(req: Request, res: Response): Promise<void> {
    try {
      const userId  = String(req.user?.sub ?? '');
      const devices = await SettingsService.getDevices(userId);
      res.json({ devices });
    } catch (err) {
      res.status(500).json({ error: String(err) });
    }
  },

  async revokeDevice(req: Request, res: Response): Promise<void> {
    try {
      const userId   = String(req.user?.sub ?? '');
      const deviceId = String(req.params['deviceId'] ?? '');
      await SettingsService.revokeDevice(userId, deviceId);
      res.json({ ok: true });
    } catch (err) {
      res.status(500).json({ error: String(err) });
    }
  },

  async deleteAccount(req: Request, res: Response): Promise<void> {
    try {
      const userId = String(req.user?.sub ?? '');
      await SettingsService.deleteAccount(userId);
      res.json({ ok: true, message: 'Kont ou an pral efase nan 30 jou' });
    } catch (err) {
      res.status(500).json({ error: String(err) });
    }
  },
};
