import type { Server as HttpServer } from 'http';
import { Server } from 'socket.io';
import { PROTOCOL_VERSION } from '../types/constants.js';

export function createSocketServer(httpServer: HttpServer) {
  const io = new Server(httpServer, {
    transports: ['polling'],
    allowUpgrades: false,
    cors: { origin: true, credentials: true },
  });

  io.on('connection', (socket) => {
    socket.on('join_room', (payload: { protocolVersion?: number }) => {
      if (payload?.protocolVersion !== PROTOCOL_VERSION) {
        socket.emit('error', {
          code: 'CLIENT_OUTDATED',
          message: 'Actualizá la página para usar la última versión.',
        });
        return;
      }

      socket.emit('room_state', {
        code: 'demo',
        phase: 'lobby',
        fighters: 0,
        maxFighters: 8,
        spectators: 1,
        queueSize: 0,
        players: [],
      });
    });
  });

  return io;
}
