import type { Request, Response, NextFunction } from 'express';
import type { APIKeyData } from '../types/integration.types.js';

declare global {
  namespace Express {
    interface Request {
      apiKey?: APIKeyData;
    }
  }
}

export async function apiKeyAuth(req: Request, res: Response, next: NextFunction): Promise<void> {
  const header = req.headers.authorization;
  if (!header?.startsWith('ApiKey ')) {
    res.status(401).json({ error: 'API key manke (Authorization: ApiKey jf_live_...)' });
    return;
  }

  const rawKey = header.slice(7).trim();
  if (!rawKey.startsWith('jf_live_') && !rawKey.startsWith('jf_test_')) {
    res.status(401).json({ error: 'Fòma API key invalid' });
    return;
  }

  try {
    const { APIKeyService } = await import('../services/APIKeyService.js');
    const keyData = await APIKeyService.validate(rawKey);
    if (!keyData) {
      res.status(401).json({ error: 'API key invalid oswa ekspire' });
      return;
    }
    req.apiKey = keyData;
    next();
  } catch {
    res.status(500).json({ error: 'Erè validasyon API key' });
  }
}

export function requireScope(...scopes: string[]) {
  return (req: Request, res: Response, next: NextFunction): void => {
    const apiKey = req.apiKey;
    if (!apiKey) {
      res.status(401).json({ error: 'API key obligatwa' });
      return;
    }
    const allowed = scopes.every(s => apiKey.scopes.includes(s as never));
    if (!allowed) {
      res.status(403).json({ error: `Scope manke: ${scopes.join(', ')}` });
      return;
    }
    next();
  };
}
