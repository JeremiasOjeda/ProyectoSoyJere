import { mkdirSync, readFileSync, writeFileSync, existsSync, readdirSync } from 'fs';
import path from 'path';

const DIR = path.resolve(process.cwd(), 'data/snapshots');

export function ensureSnapshotDir() {
  if (!existsSync(DIR)) mkdirSync(DIR, { recursive: true });
}

export function saveSnapshot(roomCode: string, data: unknown) {
  ensureSnapshotDir();
  writeFileSync(path.join(DIR, `${roomCode}.json`), JSON.stringify(data, null, 2));
}

export function loadSnapshot<T>(roomCode: string): T | null {
  const file = path.join(DIR, `${roomCode}.json`);
  if (!existsSync(file)) return null;
  try {
    return JSON.parse(readFileSync(file, 'utf-8')) as T;
  } catch {
    return null;
  }
}

export function listRecoverableSnapshots() {
  ensureSnapshotDir();
  const now = Date.now();
  return readdirSync(DIR)
    .filter((f) => f.endsWith('.json'))
    .map((f) => {
      const code = f.replace('.json', '');
      const data = loadSnapshot<{ savedAt?: number; phase?: string }>(code);
      return data?.savedAt && now - data.savedAt < 2 * 60 * 60 * 1000
        ? { code, phase: data.phase ?? 'unknown', savedAt: data.savedAt }
        : null;
    })
    .filter(Boolean) as { code: string; phase: string; savedAt: number }[];
}

export function deleteSnapshot(roomCode: string) {
  const file = path.join(DIR, `${roomCode}.json`);
  if (existsSync(file)) writeFileSync(file, '');
}
