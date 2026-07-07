/**
 * Prueba de carga: simula clientes Socket.io con polling.
 * Uso: npx tsx scripts/load-test.ts [URL] [clientes]
 * Ejemplo: npx tsx scripts/load-test.ts http://localhost:3001 50
 */
import { io } from 'socket.io-client';

const BASE = process.argv[2] ?? 'http://localhost:3001';
const CLIENTS = Number(process.argv[3] ?? 50);
const ROOM = process.env.LOAD_TEST_ROOM ?? 'LOAD01';
const PROTOCOL = 1;

const latencies: number[] = [];
let errors = 0;

async function createRoom(): Promise<string> {
  const res = await fetch(`${BASE}/api/auth/rooms`, {
    method: 'POST',
    headers: { Cookie: process.env.HOST_SESSION ?? '' },
  });
  if (!res.ok) {
    console.warn('No se pudo crear sala vía API; usando código', ROOM);
    return ROOM;
  }
  const data = (await res.json()) as { code: string };
  return data.code;
}

async function main() {
  const code = process.env.LOAD_TEST_ROOM ?? (await createRoom());
  console.log(`Load test: ${CLIENTS} clientes → sala ${code} @ ${BASE}`);

  const sockets = await Promise.all(
    Array.from({ length: CLIENTS }, (_, i) =>
      new Promise<ReturnType<typeof io>>((resolve, reject) => {
        const start = Date.now();
        const socket = io(BASE, { transports: ['polling'], forceNew: true });
        socket.on('connect', () => {
          socket.emit('join_room', {
            code,
            nickname: `Bot${i}`,
            protocolVersion: PROTOCOL,
          });
        });
        socket.on('room_state', () => {
          latencies.push(Date.now() - start);
          resolve(socket);
        });
        socket.on('error', () => {
          errors++;
          resolve(socket);
        });
        setTimeout(() => reject(new Error(`timeout client ${i}`)), 15000);
      }).catch((e) => {
        console.error(e);
        errors++;
        return null;
      }),
    ),
  );

  const ok = latencies.length;
  latencies.sort((a, b) => a - b);
  const p95 = latencies[Math.floor(latencies.length * 0.95)] ?? 0;
  console.log(`Conectados: ${ok}/${CLIENTS}, errores: ${errors}, p95: ${p95}ms`);

  await new Promise((r) => setTimeout(r, 10_000));

  for (const s of sockets) s?.disconnect();
  console.log('Test finalizado (10s activos)');
  process.exit(p95 < 2000 && errors === 0 ? 0 : 1);
}

main();
