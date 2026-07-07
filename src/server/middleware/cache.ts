import type { Request, Response, NextFunction } from 'express';
import path from 'path';

const ONE_YEAR = 31536000;
const ONE_DAY = 86400;

export function cacheMiddleware(req: Request, res: Response, next: NextFunction) {
  if (req.path === '/' || req.path.endsWith('.html')) {
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
  } else if (req.path.startsWith('/assets/')) {
    res.setHeader('Cache-Control', `public, max-age=${ONE_YEAR}, immutable`);
  } else if (path.extname(req.path)) {
    res.setHeader('Cache-Control', `public, max-age=${ONE_DAY}`);
  }
  next();
}
