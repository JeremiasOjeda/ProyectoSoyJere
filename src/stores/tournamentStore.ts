import { create } from 'zustand';
import type { BracketMatch, NarrationLine, Player, PredictionResults, RoomState } from '@/types/protocol';

interface TournamentStore {
  connected: boolean;
  playerId: string | null;
  room: RoomState | null;
  bracket: BracketMatch[];
  narration: NarrationLine[];
  predictionResults: PredictionResults | null;
  queuePosition: number | null;
  error: string | null;
  setConnected: (v: boolean) => void;
  setPlayerId: (id: string) => void;
  setRoom: (room: RoomState) => void;
  setBracket: (b: BracketMatch[]) => void;
  addNarration: (line: NarrationLine) => void;
  setPredictionResults: (r: PredictionResults) => void;
  setQueuePosition: (p: number) => void;
  setError: (e: string | null) => void;
  reset: () => void;
  me: () => Player | undefined;
}

export const useTournamentStore = create<TournamentStore>((set, get) => ({
  connected: false,
  playerId: null,
  room: null,
  bracket: [],
  narration: [],
  predictionResults: null,
  queuePosition: null,
  error: null,
  setConnected: (connected) => set({ connected }),
  setPlayerId: (playerId) => set({ playerId }),
  setRoom: (room) => set({ room, narration: room.narration ?? [] }),
  setBracket: (bracket) => set({ bracket }),
  addNarration: (line) => set((s) => ({ narration: [...s.narration, line] })),
  setPredictionResults: (predictionResults) => set({ predictionResults }),
  setQueuePosition: (queuePosition) => set({ queuePosition }),
  setError: (error) => set({ error }),
  reset: () =>
    set({
      connected: false,
      playerId: null,
      room: null,
      bracket: [],
      narration: [],
      predictionResults: null,
      queuePosition: null,
      error: null,
    }),
  me: () => {
    const { room, playerId } = get();
    return room?.players.find((p) => p.id === playerId);
  },
}));
