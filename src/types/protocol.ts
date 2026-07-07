import type { CharacterBuild } from './equipment.js';

export type GamePhase =
  | 'lobby'
  | 'loadout'
  | 'pre_fight'
  | 'fighting'
  | 'upgrade'
  | 'champion';

export type PlayerRole = 'fighter' | 'spectator' | 'host';

export interface Player {
  id: string;
  nickname: string;
  role: PlayerRole;
  eliminated: boolean;
  connected: boolean;
  build?: CharacterBuild;
  loadoutConfirmed?: boolean;
  afkStrikes?: number;
  predictionScore?: number;
}

export interface BracketMatch {
  id: string;
  round: 'quarter' | 'semi' | 'final';
  fighterA: string | null;
  fighterB: string | null;
  winner: string | null;
  completed: boolean;
}

export interface FightTick {
  attackerId: string;
  defenderId: string;
  damage: number;
  hpA: number;
  hpB: number;
}

export interface NarrationLine {
  id: string;
  text: string;
  phase: 'intro' | 'action' | 'result';
}

export interface PredictionResults {
  fightId: string;
  winnerId: string;
  totalVotes: number;
  correctVotes: number;
  percentages: Record<string, number>;
}

export interface RoomState {
  code: string;
  phase: GamePhase;
  fighters: number;
  maxFighters: number;
  spectators: number;
  queueSize: number;
  players: Player[];
  bracket?: BracketMatch[];
  currentFightId?: string | null;
  arena?: string;
  narration?: NarrationLine[];
  fightTicks?: FightTick[];
  championId?: string | null;
  loadoutDeadline?: number | null;
  preFightDeadline?: number | null;
  roundLabel?: string;
  recoverable?: boolean;
  pollingIntervalMs?: number;
}

export interface VersionInfo {
  appVersion: string;
  protocolVersion: number;
  minClientVersion?: string;
}

export type ServerErrorCode =
  | 'INVALID_BUILD'
  | 'CLIENT_OUTDATED'
  | 'ROOM_FULL'
  | 'UNAUTHORIZED'
  | 'NOT_FOUND'
  | 'INVALID_PHASE'
  | 'ALREADY_VOTED';

export interface ServerError {
  code: ServerErrorCode;
  message: string;
}
