import { useEffect, useRef } from 'react';
import { io, type Socket } from 'socket.io-client';
import { PROTOCOL_VERSION } from '@/types/constants';
import { useTournamentStore } from '@/stores/tournamentStore';
import type { ServerError } from '@/types/protocol';

const SOCKET_URL = import.meta.env.DEV ? 'http://localhost:3001' : '';

export function useSocket() {
  const socketRef = useRef<Socket | null>(null);
  const store = useTournamentStore();

  useEffect(() => {
    const socket = io(SOCKET_URL, {
      transports: ['polling'],
      autoConnect: true,
    });
    socketRef.current = socket;

    socket.on('connect', () => store.setConnected(true));
    socket.on('disconnect', () => store.setConnected(false));

    socket.on('joined', ({ playerId: id }: { playerId: string }) => store.setPlayerId(id));
    socket.on('room_state', (state) => store.setRoom(state));
    socket.on('tournament_bracket', (bracket) => store.setBracket(bracket));
    socket.on('narration_line', (line) => store.addNarration(line));
    socket.on('prediction_results', (r) => store.setPredictionResults(r));
    socket.on('fight_result', () => {
      /* room_state follows via broadcaster */
    });
    socket.on('queue_position', ({ position }) => store.setQueuePosition(position));
    socket.on('phase_alert', ({ message }) => store.setError(message));
    socket.on('error', (err: ServerError) => store.setError(err.message));

    return () => {
      socket.disconnect();
      socketRef.current = null;
    };
  }, []);

  return socketRef;
}

export function emitJoin(
  socket: Socket,
  opts: { code: string; nickname: string; playerId?: string; hostToken?: string },
) {
  socket.emit('join_room', {
    ...opts,
    protocolVersion: PROTOCOL_VERSION,
  });
}
