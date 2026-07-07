import type { Server as HttpServer } from 'http';
import type { Server, Socket } from 'socket.io';
import { Server as SocketServer } from 'socket.io';
import { PROTOCOL_VERSION } from '../types/constants.js';
import { tournamentManager, recoverSnapshotsOnBoot, setRoomBroadcaster } from './TournamentManager.js';
import type { ServerError } from '../types/protocol.js';

let io: Server | null = null;

export function createSocketServer(httpServer: HttpServer) {
  recoverSnapshotsOnBoot();

  io = new SocketServer(httpServer, {
    transports: ['polling'],
    allowUpgrades: false,
    cors: { origin: true, credentials: true },
    pingInterval: 25000,
    pingTimeout: 20000,
  });

  setRoomBroadcaster((code, events) => {
    for (const { event, data } of events) {
      io!.to(code).emit(event, data);
    }
  });

  io.on('connection', (socket: Socket) => {
    let roomCode = '';
    let playerId = '';

    const emitError = (error: ServerError) => socket.emit('error', error);

    socket.on(
      'join_room',
      (payload: {
        code?: string;
        nickname?: string;
        playerId?: string;
        protocolVersion?: number;
        hostToken?: string;
      }) => {
        if (payload?.protocolVersion !== PROTOCOL_VERSION) {
          emitError({
            code: 'CLIENT_OUTDATED',
            message: 'Actualizá la página para usar la última versión.',
          });
          return;
        }

        const code = (payload.code ?? '').toUpperCase();
        if (!code || !tournamentManager.hasRoom(code)) {
          emitError({ code: 'NOT_FOUND', message: 'Sala no encontrada.' });
          return;
        }

        try {
          const result = tournamentManager.join(
            code,
            payload.nickname ?? 'Jugador',
            payload.playerId,
            socket.id,
          );

          if (!result.ok) {
            socket.emit('queue_position', { position: result.position ?? 1 });
            return;
          }

          roomCode = code;
          playerId = result.playerId;
          socket.join(code);
          socket.emit('joined', { playerId: result.playerId });
          socket.emit('room_state', result.state);
          if (result.state.bracket?.length) {
            socket.emit('tournament_bracket', result.state.bracket);
          }
          io!.to(code).emit('room_state', result.state);
        } catch {
          emitError({ code: 'NOT_FOUND', message: 'Sala no encontrada.' });
        }
      },
    );

    socket.on('submit_loadout', (payload: { build: unknown }) => {
      const r = tournamentManager.submitLoadout(roomCode, playerId, payload?.build);
      if ('error' in r) {
        emitError({ code: r.error ?? 'UNAUTHORIZED', message: 'No se pudo guardar el equipamiento.' });
        return;
      }
      io!.to(roomCode).emit('room_state', r.state);
      if (r.state.phase === 'pre_fight') {
        io!.to(roomCode).emit('pre_fight_start', {
          fightId: r.state.currentFightId,
          deadline: r.state.preFightDeadline,
        });
      }
    });

    socket.on('submit_upgrade', (payload: { slot: string; value: string }) => {
      const r = tournamentManager.submitUpgrade(
        roomCode,
        playerId,
        payload.slot as keyof import('../types/equipment.js').CharacterBuild,
        payload.value,
      );
      if ('error' in r) {
        emitError({ code: r.error ?? 'UNAUTHORIZED', message: 'Mejora inválida.' });
        return;
      }
      io!.to(roomCode).emit('room_state', r.state);
    });

    socket.on('submit_prediction', (payload: { winnerId: string }) => {
      const r = tournamentManager.submitPrediction(roomCode, playerId, payload?.winnerId);
      if ('error' in r) {
        emitError({ code: r.error ?? 'UNAUTHORIZED', message: 'No se pudo registrar la predicción.' });
      }
    });

    socket.on('host_start_tournament', (payload: { hostToken: string }) => {
      const r = tournamentManager.hostStart(roomCode, payload?.hostToken ?? '');
      if ('error' in r) {
        emitError({ code: r.error ?? 'UNAUTHORIZED', message: 'No se pudo iniciar el torneo.' });
        return;
      }
      io!.to(roomCode).emit('room_state', r.state);
      io!.to(roomCode).emit('loadout_phase_start', { deadline: r.state.loadoutDeadline });
      io!.to(roomCode).emit('tournament_bracket', r.state.bracket);
    });

    socket.on('host_next_fight', (payload: { hostToken: string }) => {
      const r = tournamentManager.hostNextFight(roomCode, payload?.hostToken ?? '');
      if ('error' in r) {
        emitError({ code: r.error ?? 'UNAUTHORIZED', message: 'Acción no permitida.' });
        return;
      }
      broadcastPhase(io!, roomCode, r.state);
    });

    socket.on('host_kick', (payload: { hostToken: string; playerId: string }) => {
      const r = tournamentManager.hostKick(roomCode, payload?.hostToken ?? '', payload?.playerId ?? '');
      if ('error' in r) {
        emitError({ code: r.error ?? 'UNAUTHORIZED', message: 'No se pudo expulsar.' });
        return;
      }
      io!.to(roomCode).emit('room_state', r.state);
    });

    socket.on('host_recover_snapshot', (payload: { hostToken: string }) => {
      const r = tournamentManager.hostRecover(roomCode, payload?.hostToken ?? '');
      if ('error' in r) {
        emitError({ code: r.error ?? 'NOT_FOUND', message: 'No hay snapshot para recuperar.' });
        return;
      }
      io!.to(roomCode).emit('room_state', r.state);
    });

    socket.on('disconnect', () => {
      if (roomCode && playerId) {
        tournamentManager.disconnect(roomCode, playerId);
        const state = tournamentManager.getPublicState(roomCode);
        if (state) io!.to(roomCode).emit('room_state', state);
      }
    });
  });

  return io;
}

function broadcastPhase(io: Server, code: string, state: import('../types/protocol.js').RoomState) {
  io.to(code).emit('room_state', state);
  if (state.phase === 'fighting') {
    const room = tournamentManager.getRoom(code);
    if (room) {
      for (const line of room.narration) {
        io.to(code).emit('narration_line', line);
      }
      const results = tournamentManager.getPredictionResults(room);
      if (results) io.to(code).emit('prediction_results', results);
    }
  }
  if (state.phase === 'pre_fight') {
    io.to(code).emit('pre_fight_start', {
      fightId: state.currentFightId,
      deadline: state.preFightDeadline,
    });
  }
  if (state.phase === 'upgrade') {
    io.to(code).emit('upgrade_phase_start', { deadline: state.loadoutDeadline });
  }
  if (state.phase === 'champion') {
    io.to(code).emit('champion_crowned', { championId: state.championId });
  }
}

export function getIO() {
  return io;
}
