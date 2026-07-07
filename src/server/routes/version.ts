import { readFileSync } from 'fs';
import { Router } from 'express';
import { PROTOCOL_VERSION } from '../../types/constants.js';

const pkg = JSON.parse(readFileSync(new URL('../../../package.json', import.meta.url), 'utf-8')) as {
  version: string;
};

const router = Router();

router.get('/version', (_req, res) => {
  res.setHeader('Cache-Control', 'no-store');
  res.json({
    appVersion: pkg.version,
    protocolVersion: PROTOCOL_VERSION,
  });
});

export default router;
