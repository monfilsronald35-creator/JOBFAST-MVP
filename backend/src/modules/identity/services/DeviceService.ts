import crypto from 'crypto';
import { DeviceRepository } from '../repositories/DeviceRepository.js';
import { ForbiddenError, NotFoundError } from '../../../core/errors/AppError.js';
import type { DeviceRecord } from '../types/identity.types.js';

interface DeviceInfo {
  deviceId?:    string;
  deviceName?:  string;
  deviceType?:  string;
  browser?:     string;
  os?:          string;
  userAgent?:   string;
  ip?:          string;
}

export const DeviceService = {
  deriveDeviceId(info: DeviceInfo, userId: string): string {
    if (info.deviceId) return info.deviceId;
    // Deterministic fingerprint from stable signals (OS + browser + userId)
    const raw = [info.os ?? '', info.browser ?? '', userId].join('|');
    return crypto.createHash('sha256').update(raw).digest('hex').slice(0, 32);
  },

  inferDeviceType(ua = ''): string {
    if (/Android|iPhone|iPad|Mobile/i.test(ua)) return 'mobile';
    if (/Tablet|iPad/i.test(ua))                 return 'tablet';
    return 'desktop';
  },

  async register(userId: string, info: DeviceInfo): Promise<{ device: DeviceRecord; isNew: boolean }> {
    const deviceId = this.deriveDeviceId(info, userId);
    const existing = await DeviceRepository.findByUserAndDevice(userId, deviceId);

    const device = await DeviceRepository.upsert({
      userId,
      deviceId,
      deviceName: info.deviceName,
      deviceType: info.deviceType ?? this.inferDeviceType(info.userAgent),
      browser:    info.browser,
      os:         info.os,
      lastIp:     info.ip,
    });

    return { device, isNew: !existing };
  },

  async list(userId: string): Promise<DeviceRecord[]> {
    return DeviceRepository.findByUserId(userId);
  },

  async trust(deviceRowId: string, userId: string, days = 30): Promise<DeviceRecord[]> {
    const devices = await DeviceRepository.findByUserId(userId);
    const target  = devices.find(d => d.id === deviceRowId);
    if (!target) throw new NotFoundError('Device', deviceRowId);
    if (target.userId !== userId) throw new ForbiddenError();

    await DeviceRepository.trust(deviceRowId, days);
    return DeviceRepository.findByUserId(userId);
  },

  async rename(deviceRowId: string, userId: string, name: string): Promise<void> {
    const devices = await DeviceRepository.findByUserId(userId);
    const target  = devices.find(d => d.id === deviceRowId);
    if (!target) throw new NotFoundError('Device', deviceRowId);
    if (target.userId !== userId) throw new ForbiddenError();

    await DeviceRepository.rename(deviceRowId, name);
  },

  async remove(deviceRowId: string, userId: string): Promise<void> {
    const devices = await DeviceRepository.findByUserId(userId);
    const target  = devices.find(d => d.id === deviceRowId);
    if (!target) throw new NotFoundError('Device', deviceRowId);
    if (target.userId !== userId) throw new ForbiddenError();

    await DeviceRepository.delete(deviceRowId, userId);
  },
};
