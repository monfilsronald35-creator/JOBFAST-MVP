import http from 'http';
import https from 'https';
import type { RequestHandler } from 'express';
import type { GatewayRequest } from '../types/gateway.types.js';

export const ServiceProxy: RequestHandler = (req, res) => {
  const gReq = req as GatewayRequest;
  const targetUrl = gReq.ctx.targetPath;

  if (!targetUrl) {
    res.status(502).json({ error: 'No target resolved', code: 'PROXY_NO_TARGET' });
    return;
  }

  let parsed: URL;
  try {
    parsed = new URL(targetUrl);
  } catch {
    res.status(502).json({ error: 'Invalid target URL', code: 'PROXY_INVALID_TARGET' });
    return;
  }

  const isHttps  = parsed.protocol === 'https:';
  const transport = isHttps ? https : http;
  const port      = parsed.port ? Number(parsed.port) : (isHttps ? 443 : 80);

  // Forward all original headers, inject gateway context headers
  const forwardHeaders: Record<string, string | string[]> = {};
  for (const [k, v] of Object.entries(req.headers)) {
    if (k === 'host') continue; // override host below
    if (v !== undefined) forwardHeaders[k] = v;
  }

  forwardHeaders['host']            = parsed.hostname;
  forwardHeaders['x-request-id']    = gReq.ctx.requestId;
  forwardHeaders['x-trace-id']      = gReq.ctx.traceId;
  forwardHeaders['x-forwarded-for'] = gReq.ctx.ip;
  forwardHeaders['x-api-version']   = gReq.ctx.apiVersion;

  if (gReq.ctx.userId)    forwardHeaders['x-user-id']    = gReq.ctx.userId;
  if (gReq.ctx.role)      forwardHeaders['x-user-role']  = gReq.ctx.role;
  if (gReq.ctx.plan)      forwardHeaders['x-user-plan']  = gReq.ctx.plan;
  if (gReq.ctx.country)   forwardHeaders['x-country']    = gReq.ctx.country;
  if (gReq.ctx.language)  forwardHeaders['x-language']   = gReq.ctx.language;
  if (gReq.ctx.device)    forwardHeaders['x-device']     = gReq.ctx.device;
  if (gReq.ctx.appVersion)forwardHeaders['x-app-version']= gReq.ctx.appVersion;

  const options: http.RequestOptions = {
    hostname: parsed.hostname,
    port,
    path:     parsed.pathname + (parsed.search ?? ''),
    method:   req.method,
    headers:  forwardHeaders,
    timeout:  30_000,
  };

  const proxyReq = transport.request(options, proxyRes => {
    res.writeHead(proxyRes.statusCode ?? 502, proxyRes.headers);
    proxyRes.pipe(res);
  });

  proxyReq.on('timeout', () => {
    proxyReq.destroy();
    if (!res.headersSent) res.status(504).json({ error: 'Gateway timeout', code: 'PROXY_TIMEOUT' });
  });

  proxyReq.on('error', (err: NodeJS.ErrnoException) => {
    console.error(`[Proxy] Error proxying to ${targetUrl}:`, err.message);
    if (!res.headersSent) {
      const code = err.code === 'ECONNREFUSED' ? 'SERVICE_UNAVAILABLE' : 'PROXY_ERROR';
      const status = err.code === 'ECONNREFUSED' ? 503 : 502;
      res.status(status).json({ error: 'Upstream service error', code });
    }
  });

  req.pipe(proxyReq);
};
