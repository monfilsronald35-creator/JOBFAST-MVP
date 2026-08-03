/**
 * localizationMiddleware — attaches req.locCtx to every authenticated request.
 *
 * req.locCtx: LocalizationContext { ctx, config, features }
 *
 * For anonymous requests: country is inferred from headers.
 * For authenticated requests: loads from loc_user_context DB table.
 *
 * Also triggers cross-border detection for authenticated users
 * (pushes prompt via RealtimeGateway if country change detected).
 *
 * Does NOT require auth — works for both authenticated and anonymous requests.
 */
import type { Request, Response, NextFunction } from 'express';
import { CountryContextEngine }    from '../services/CountryContextEngine.js';
import { CountryDetectionService } from '../services/CountryDetectionService.js';
import { CrossBorderService }      from '../services/CrossBorderService.js';
import type { LocalizationContext } from '../types/localization.types.js';

// Extend Express Request to carry localization context
declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      locCtx?: LocalizationContext;
    }
  }
}

// Skip localization for these paths (health, static, auth)
const SKIP_PATHS = ['/health', '/favicon.ico', '/api/auth/login', '/api/auth/register'];

export async function localizationMiddleware(
  req: Request,
  _res: Response,
  next: NextFunction,
): Promise<void> {
  if (SKIP_PATHS.some(p => req.path.startsWith(p))) { next(); return; }

  try {
    const userId = (req as unknown as { user?: { sub?: string } }).user?.sub;
    const locCtx = await CountryContextEngine.buildForRequest(req, userId);
    req.locCtx   = locCtx;

    // Cross-border detection for authenticated users (fire-and-forget)
    if (userId && locCtx.ctx.confirmedAt) {
      const detection = CountryDetectionService.fromRequest(req);
      if (detection.country !== locCtx.ctx.country && detection.confidence >= 70) {
        CrossBorderService
          .checkTransition(userId, locCtx.ctx.country, detection)
          .then(event => {
            if (event) {
              // Push cross-border prompt via realtime (import lazily to avoid circular deps)
              import('../../realtime/gateway/RealtimeGateway.js')
                .then(({ RealtimeGateway }) => {
                  RealtimeGateway.pushToUser(userId, 'rt:localization:cross_border', {
                    eventId:     event.id,
                    fromCountry: event.fromCountry,
                    toCountry:   event.toCountry,
                    message:     `Nou remake ou nan ${event.toCountry}. Èske ou vle itilize sèvis ${event.toCountry}?`,
                  });
                })
                .catch(() => {});
            }
          })
          .catch(() => {});
      }
    }
  } catch {
    // Non-fatal: if localization fails, don't block the request
  }

  next();
}