import type { RequestHandler } from 'express';
import type { GatewayRequest } from '../../types/gateway.types.js';
import { env } from '../../config/env.js';

export interface LogEntry {
  timestamp:   string;
  requestId:   string;
  traceId:     string;
  method:      string;
  path:        string;
  statusCode:  number;
  latencyMs:   number;
  userId?:     string;
  plan:        string;
  ip:          string;
  country?:    string;
  language?:   string;
  device?:     string;
  platform?:   string;
  appVersion?: string;
  cacheHit:    boolean;
  flags:       string[];
}

export const RequestLogger: RequestHandler = (req, res, next) => {
  const gReq = req as GatewayRequest;

  res.on('finish', () => {
    const latencyMs = Date.now() - gReq.ctx.startTime;

    const entry: LogEntry = {
      timestamp:   new Date().toISOString(),
      requestId:   gReq.ctx.requestId,
      traceId:     gReq.ctx.traceId,
      method:      req.method,
      path:        req.path,
      statusCode:  res.statusCode,
      latencyMs,
      userId:      gReq.ctx.userId,
      plan:        gReq.ctx.plan,
      ip:          gReq.ctx.ip,
      country:     gReq.ctx.country,
      language:    gReq.ctx.language,
      device:      gReq.ctx.device,
      platform:    gReq.ctx.platform,
      appVersion:  gReq.ctx.appVersion,
      cacheHit:    gReq.ctx.cacheHit ?? false,
      flags:       Object.keys(gReq.ctx.flags).filter(k => gReq.ctx.flags[k] === true),
    };

    if (env.LOG_LEVEL === 'debug' || env.NODE_ENV === 'development') {
      console.log('[GW]', JSON.stringify(entry));
    } else if (res.statusCode >= 500) {
      console.error('[GW:ERROR]', JSON.stringify(entry));
    } else if (res.statusCode >= 400) {
      console.warn('[GW:WARN]', JSON.stringify(entry));
    } else {
      console.log('[GW]', JSON.stringify(entry));
    }
  });

  next();
};
