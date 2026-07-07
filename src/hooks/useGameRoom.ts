import { useEffect } from 'react';
import { storageKey } from '@/lib/storage';
import { emitJoin, useSocket } from './useSocket';
import { useTournamentStore } from '@/stores/tournamentStore';

export function useGameRoom(code: string, nickname: string) {
  const socketRef = useSocket();
  const { room, connected, playerId } = useTournamentStore();

  useEffect(() => {
    if (!code || !nickname || !connected || !socketRef.current) return;
    const savedId = localStorage.getItem(storageKey(`player_${code}`)) ?? undefined;
    emitJoin(socketRef.current, { code, nickname, playerId: savedId });
  }, [code, nickname, connected, socketRef]);

  useEffect(() => {
    if (playerId && code) {
      localStorage.setItem(storageKey(`player_${code}`), playerId);
    }
  }, [playerId, code]);

  const socket = socketRef.current;

  return {
    room,
    connected,
    playerId,
    socket,
    submitLoadout: (build: unknown) => socket?.emit('submit_loadout', { build }),
    submitUpgrade: (slot: string, value: string) =>
      socket?.emit('submit_upgrade', { slot, value }),
    submitPrediction: (winnerId: string) => socket?.emit('submit_prediction', { winnerId }),
    hostStart: (hostToken: string) => socket?.emit('host_start_tournament', { hostToken }),
    hostNext: (hostToken: string) => socket?.emit('host_next_fight', { hostToken }),
    hostKick: (hostToken: string, targetId: string) =>
      socket?.emit('host_kick', { hostToken, playerId: targetId }),
    hostRecover: (hostToken: string) => socket?.emit('host_recover_snapshot', { hostToken }),
  };
}
