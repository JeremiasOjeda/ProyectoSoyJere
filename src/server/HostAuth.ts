import jwt from 'jsonwebtoken';
import type { Request, Response, NextFunction } from 'express';
import { HOST_SESSION_COOKIE, HOST_SESSION_DAYS } from './config.js';

export interface HostSession {
  role: 'admin';
}

function getSecret() {
  const secret = process.env.SESSION_SECRET;
  if (!secret) throw new Error('SESSION_SECRET no configurado');
  return secret;
}

export function createHostToken() {
  return jwt.sign({ role: 'admin' } satisfies HostSession, getSecret(), {
    expiresIn: `${HOST_SESSION_DAYS}d`,
  });
}

export function verifyHostToken(token: string): HostSession | null {
  try {
    return jwt.verify(token, getSecret()) as HostSession;
  } catch {
    return null;
  }
}

export function setHostSessionCookie(res: Response, token: string) {
  res.cookie(HOST_SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    maxAge: HOST_SESSION_DAYS * 24 * 60 * 60 * 1000,
  });
}

export function clearHostSessionCookie(res: Response) {
  res.clearCookie(HOST_SESSION_COOKIE);
}

export function requireHostSession(req: Request, res: Response, next: NextFunction) {
  const token = req.cookies[HOST_SESSION_COOKIE] as string | undefined;
  if (!token) {
    res.status(401).json({ error: 'Sesión de admin requerida' });
    return;
  }
  const session = verifyHostToken(token);
  if (!session) {
    res.status(401).json({ error: 'Sesión inválida o expirada' });
    return;
  }
  next();
}

export function isHostAuthenticated(req: Request) {
  const token = req.cookies[HOST_SESSION_COOKIE] as string | undefined;
  if (!token) return false;
  return verifyHostToken(token) !== null;
}
