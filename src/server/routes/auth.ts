import { Router } from 'express';
import type { Request, Response } from 'express';
import {
  clearHostSessionCookie,
  createHostToken,
  isHostAuthenticated,
  requireHostSession,
  setHostSessionCookie,
} from '../HostAuth.js';
import { generateHostToken, generateRoomCode } from '../RoomManager.js';

const router = Router();

// Salas en memoria hasta etapa de torneo completa
const rooms = new Map<string, { hostToken: string; createdAt: number }>();

router.get('/session', (req: Request, res: Response) => {
  res.json({ authenticated: isHostAuthenticated(req) });
});

router.post('/host-login', (req: Request, res: Response) => {
  const { password } = req.body as { password?: string };
  const expected = process.env.HOST_ADMIN_PASSWORD;

  if (!expected) {
    res.status(503).json({ error: 'HOST_ADMIN_PASSWORD no configurado en el servidor' });
    return;
  }

  if (!password || password !== expected) {
    res.status(401).json({ error: 'Clave incorrecta' });
    return;
  }

  const token = createHostToken();
  setHostSessionCookie(res, token);
  res.json({ ok: true });
});

router.post('/host-logout', (_req: Request, res: Response) => {
  clearHostSessionCookie(res);
  res.json({ ok: true });
});

router.post('/rooms', requireHostSession, (_req: Request, res: Response) => {
  let code = generateRoomCode();
  while (rooms.has(code)) code = generateRoomCode();

  const hostToken = generateHostToken();
  rooms.set(code, { hostToken, createdAt: Date.now() });

  const origin = process.env.PUBLIC_ORIGIN ?? '';
  const base = origin || `${_req.protocol}://${_req.get('host')}`;

  res.status(201).json({
    code,
    hostToken,
    joinUrl: `${base}/join?code=${code}`,
    hostUrl: `${base}/host/${code}?token=${hostToken}`,
    overlayUrl: `${base}/overlay/${code}`,
  });
});

router.get('/rooms/:code/host-check', (req: Request, res: Response) => {
  const code = String(req.params.code).toUpperCase();
  const room = rooms.get(code);
  const token = req.query.token as string | undefined;
  if (!room || !token || room.hostToken !== token) {
    res.status(403).json({ ok: false });
    return;
  }
  res.json({ ok: true });
});

export default router;
