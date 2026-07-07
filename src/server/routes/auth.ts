import { Router } from 'express';
import type { Request, Response } from 'express';

const router = Router();

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

  // Auth completo en etapa host-auth-mvp
  res.json({ ok: true, message: 'Login pendiente de implementación en etapa auth' });
});

router.post('/rooms', (_req: Request, res: Response) => {
  res.status(501).json({ error: 'Crear sala pendiente de implementación en etapa auth' });
});

export default router;
