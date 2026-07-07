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
}

export interface RoomState {
  code: string;
  phase: GamePhase;
  fighters: number;
  maxFighters: number;
  spectators: number;
  queueSize: number;
  players: Player[];
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
  | 'NOT_FOUND';

export interface ServerError {
  code: ServerErrorCode;
  message: string;
}
