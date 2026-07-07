import { randomBytes } from 'crypto';
import { MAX_FIGHTERS } from './config.js';
import { ConnectionLimiter } from './ConnectionLimiter.js';
import { simulateFight, type FighterState } from './FightSimulator.js';
import { NarrativeEngine } from './NarrativeEngine.js';
import { saveSnapshot, loadSnapshot } from './StateSnapshot.js';
import { randomArena, type Arena } from './rules/advantages.js';
import { suggestedBuild } from './rules/synergies.js';
import {
  defaultBuild,
  isValidBuild,
  randomBuild,
  type CharacterBuild,
} from '../types/equipment.js';
import type {
  BracketMatch,
  GamePhase,
  NarrationLine,
  Player,
  PredictionResults,
  RoomState,
} from '../types/protocol.js';

const LOADOUT_MS = 120_000;
const PRE_FIGHT_MS = 30_000;
const FIGHT_LINE_MS = 4_000;

type BroadcastEvent = { event: string; data: unknown };
type RoomBroadcaster = (code: string, events: BroadcastEvent[]) => void;
let roomBroadcaster: RoomBroadcaster | null = null;

export function setRoomBroadcaster(fn: RoomBroadcaster) {
  roomBroadcaster = fn;
}

interface InternalPlayer {
  id: string;
  nickname: string;
  role: 'fighter' | 'spectator';
  eliminated: boolean;
  connected: boolean;
  socketId?: string;
  build: CharacterBuild;
  loadoutConfirmed: boolean;
  afkStrikes: number;
  predictionScore: number;
  upgradePending?: Partial<CharacterBuild>;
}

interface Room {
  code: string;
  hostToken: string;
  createdAt: number;
  phase: GamePhase;
  players: Map<string, InternalPlayer>;
  limiter: ConnectionLimiter;
  bracket: BracketMatch[];
  currentFightIndex: number;
  arena: Arena | null;
  narrative: NarrativeEngine;
  narration: NarrationLine[];
  fightEvents: ReturnType<typeof simulateFight> | null;
  fightLineIndex: number;
  fightTickTimer: ReturnType<typeof setInterval> | null;
  phaseTimer: ReturnType<typeof setTimeout> | null;
  predictions: Map<string, string>;
  championId: string | null;
  loadoutDeadline: number | null;
  preFightDeadline: number | null;
  savedAt: number;
  recovered: boolean;
}

function newId() {
  return randomBytes(8).toString('hex');
}

function buildBracket(fighterIds: string[]): BracketMatch[] {
  const pairs = [
    [fighterIds[0], fighterIds[1]],
    [fighterIds[2], fighterIds[3]],
    [fighterIds[4], fighterIds[5]],
    [fighterIds[6], fighterIds[7]],
  ];
  const quarters: BracketMatch[] = pairs.map(([a, b], i) => ({
    id: `q${i}`,
    round: 'quarter',
    fighterA: a,
    fighterB: b,
    winner: null,
    completed: false,
  }));
  const semis: BracketMatch[] = [0, 1].map((i) => ({
    id: `s${i}`,
    round: 'semi',
    fighterA: null,
    fighterB: null,
    winner: null,
    completed: false,
  }));
  const final: BracketMatch = {
    id: 'f0',
    round: 'final',
    fighterA: null,
    fighterB: null,
    winner: null,
    completed: false,
  };
  return [...quarters, ...semis, final];
}

class TournamentManager {
  private rooms = new Map<string, Room>();

  createRoom(code: string, hostToken: string) {
    const room: Room = {
      code,
      hostToken,
      createdAt: Date.now(),
      phase: 'lobby',
      players: new Map(),
      limiter: new ConnectionLimiter(),
      bracket: [],
      currentFightIndex: 0,
      arena: null,
      narrative: new NarrativeEngine(),
      narration: [],
      fightEvents: null,
      fightLineIndex: 0,
      fightTickTimer: null,
      phaseTimer: null,
      predictions: new Map(),
      championId: null,
      loadoutDeadline: null,
      preFightDeadline: null,
      savedAt: Date.now(),
      recovered: false,
    };
    this.rooms.set(code, room);
    return room;
  }

  getRoom(code: string) {
    return this.rooms.get(code.toUpperCase()) ?? null;
  }

  hasRoom(code: string) {
    return this.rooms.has(code.toUpperCase());
  }

  listRecoverable() {
    return [...this.rooms.values()]
      .filter((r) => r.recovered || r.phase !== 'lobby')
      .map((r) => ({ code: r.code, phase: r.phase, savedAt: r.savedAt }));
  }

  recoverFromDisk(code: string) {
    const data = loadSnapshot<SerializedRoom>(code);
    if (!data) return false;
    const room = this.deserializeRoom(data);
    this.rooms.set(code.toUpperCase(), room);
    return true;
  }

  join(
    code: string,
    nickname: string,
    playerId: string | undefined,
    socketId: string,
  ): { ok: true; playerId: string; state: RoomState } | { ok: false; queued: boolean; position?: number } {
    const room = this.getRoom(code);
    if (!room) throw new Error('NOT_FOUND');

    const existing = playerId ? room.players.get(playerId) : undefined;
    if (existing) {
      existing.connected = true;
      existing.socketId = socketId;
      return { ok: true, playerId: existing.id, state: this.publicState(room) };
    }

    const joinResult = room.limiter.tryJoin(socketId);
    if (!joinResult.ok) {
      return { ok: false, queued: true, position: joinResult.position };
    }

    const fighters = [...room.players.values()].filter((p) => p.role === 'fighter' && !p.eliminated);
    const id = newId();
    const role: 'fighter' | 'spectator' =
      room.phase === 'lobby' && fighters.length < MAX_FIGHTERS ? 'fighter' : 'spectator';

    room.players.set(id, {
      id,
      nickname: nickname.slice(0, 20) || 'Jugador',
      role,
      eliminated: false,
      connected: true,
      socketId,
      build: defaultBuild(),
      loadoutConfirmed: false,
      afkStrikes: 0,
      predictionScore: 0,
    });

    this.persist(room);
    return { ok: true, playerId: id, state: this.publicState(room) };
  }

  disconnect(code: string, playerId: string) {
    const room = this.getRoom(code);
    if (!room) return;
    const p = room.players.get(playerId);
    if (!p) return;
    p.connected = false;
    p.socketId = undefined;
    const promoted = p.socketId ? room.limiter.leave(p.socketId) : null;
    if (promoted && room.phase === 'lobby') {
      // promoted is sessionId; client re-joins with new socket
    }
    if (room.phase === 'lobby' && p.role === 'fighter') {
      p.role = 'spectator';
    }
    this.persist(room);
  }

  submitLoadout(code: string, playerId: string, build: unknown) {
    const room = this.getRoom(code);
    if (!room || room.phase !== 'loadout') return { error: 'INVALID_PHASE' as const };
    const p = room.players.get(playerId);
    if (!p || p.role !== 'fighter' || p.eliminated) return { error: 'UNAUTHORIZED' as const };
    if (!isValidBuild(build)) return { error: 'INVALID_BUILD' as const };
    p.build = build;
    p.loadoutConfirmed = true;
    p.afkStrikes = 0;
    this.checkLoadoutComplete(room);
    this.persist(room);
    return { ok: true as const, state: this.publicState(room) };
  }

  submitUpgrade(code: string, playerId: string, slot: keyof CharacterBuild, value: string) {
    const room = this.getRoom(code);
    if (!room || room.phase !== 'upgrade') return { error: 'INVALID_PHASE' as const };
    const p = room.players.get(playerId);
    if (!p || p.eliminated) return { error: 'UNAUTHORIZED' as const };
    const partial = { ...p.upgradePending, [slot]: value };
    const merged = { ...p.build, ...partial };
    if (!isValidBuild(merged)) return { error: 'INVALID_BUILD' as const };
    p.upgradePending = partial;
    p.loadoutConfirmed = true;
    this.persist(room);
    return { ok: true as const, state: this.publicState(room) };
  }

  submitPrediction(code: string, playerId: string, winnerId: string) {
    const room = this.getRoom(code);
    if (!room || room.phase !== 'pre_fight') return { error: 'INVALID_PHASE' as const };
    const p = room.players.get(playerId);
    if (!p) return { error: 'UNAUTHORIZED' as const };
    if (room.predictions.has(playerId)) return { error: 'ALREADY_VOTED' as const };
    const fight = room.bracket[room.currentFightIndex];
    if (!fight || winnerId !== fight.fighterA && winnerId !== fight.fighterB) {
      return { error: 'INVALID_BUILD' as const };
    }
    room.predictions.set(playerId, winnerId);
    this.persist(room);
    return { ok: true as const };
  }

  hostStart(code: string, hostToken: string) {
    const room = this.getRoom(code);
    if (!room || room.hostToken !== hostToken) return { error: 'UNAUTHORIZED' as const };
    const fighters = [...room.players.values()].filter((p) => p.role === 'fighter');
    if (fighters.length !== MAX_FIGHTERS) return { error: 'ROOM_FULL' as const };
    room.bracket = buildBracket(fighters.map((f) => f.id));
    room.phase = 'loadout';
    room.loadoutDeadline = Date.now() + LOADOUT_MS;
    room.currentFightIndex = 0;
    this.clearPhaseTimer(room);
    room.phaseTimer = setTimeout(() => this.onLoadoutTimeout(room), LOADOUT_MS);
    this.persist(room);
    return { ok: true as const, state: this.publicState(room) };
  }

  hostNextFight(code: string, hostToken: string) {
    const room = this.getRoom(code);
    if (!room || room.hostToken !== hostToken) return { error: 'UNAUTHORIZED' as const };
    if (room.phase === 'pre_fight') {
      this.startFight(room);
    } else if (room.phase === 'fighting' && room.fightLineIndex >= room.narration.length) {
      this.finishFight(room);
    } else if (room.phase === 'upgrade') {
      this.beginLoadout(room);
    }
    this.persist(room);
    return { ok: true as const, state: this.publicState(room) };
  }

  hostKick(code: string, hostToken: string, targetId: string) {
    const room = this.getRoom(code);
    if (!room || room.hostToken !== hostToken) return { error: 'UNAUTHORIZED' as const };
    room.players.delete(targetId);
    this.persist(room);
    return { ok: true as const, state: this.publicState(room) };
  }

  hostRecover(code: string, hostToken: string) {
    const room = this.getRoom(code);
    if (!room || room.hostToken !== hostToken) return { error: 'UNAUTHORIZED' as const };
    if (!this.recoverFromDisk(code)) return { error: 'NOT_FOUND' as const };
    const recovered = this.getRoom(code)!;
    recovered.recovered = true;
    return { ok: true as const, state: this.publicState(recovered) };
  }

  getPredictionResults(room: Room): PredictionResults | null {
    const fight = room.bracket[room.currentFightIndex];
    if (!fight?.winner) return null;
    const votes = [...room.predictions.entries()];
    const total = votes.length;
    const correct = votes.filter(([, w]) => w === fight.winner).length;
    const percentages: Record<string, number> = {};
    for (const id of [fight.fighterA, fight.fighterB]) {
      if (!id) continue;
      const count = votes.filter(([, w]) => w === id).length;
      percentages[id] = total ? Math.round((count / total) * 100) : 0;
    }
    return {
      fightId: fight.id,
      winnerId: fight.winner,
      totalVotes: total,
      correctVotes: correct,
      percentages,
    };
  }

  private checkLoadoutComplete(room: Room) {
    const active = [...room.players.values()].filter(
      (p) => p.role === 'fighter' && !p.eliminated,
    );
    if (active.every((p) => p.loadoutConfirmed)) {
      this.beginPreFight(room);
    }
  }

  private onLoadoutTimeout(room: Room) {
    for (const p of room.players.values()) {
      if (p.role !== 'fighter' || p.eliminated || p.loadoutConfirmed) continue;
      p.afkStrikes += 1;
      if (p.afkStrikes >= 2) {
        p.eliminated = true;
        p.role = 'spectator';
      } else {
        const sug = suggestedBuild(p.build.archetype);
        p.build = { ...randomBuild(), ...sug, upgrades: {} };
        p.loadoutConfirmed = true;
      }
    }
    this.beginPreFight(room);
  }

  private beginPreFight(room: Room) {
    this.clearPhaseTimer(room);
    room.phase = 'pre_fight';
    room.predictions.clear();
    room.preFightDeadline = Date.now() + PRE_FIGHT_MS;
    room.phaseTimer = setTimeout(() => this.startFight(room), PRE_FIGHT_MS);
    const fight = room.bracket[room.currentFightIndex];
    this.persist(room, [
      {
        event: 'pre_fight_start',
        data: { fightId: fight?.id, deadline: room.preFightDeadline },
      },
    ]);
  }

  private beginLoadout(room: Room) {
    this.clearPhaseTimer(room);
    for (const p of room.players.values()) {
      if (p.upgradePending) {
        p.build = { ...p.build, ...p.upgradePending };
        p.upgradePending = undefined;
      }
      if (p.role === 'fighter' && !p.eliminated) {
        p.loadoutConfirmed = false;
      }
    }
    room.phase = 'loadout';
    room.loadoutDeadline = Date.now() + LOADOUT_MS;
    room.phaseTimer = setTimeout(() => this.onLoadoutTimeout(room), LOADOUT_MS);
    this.persist(room);
  }

  private startFight(room: Room) {
    this.clearPhaseTimer(room);
    const fight = room.bracket[room.currentFightIndex];
    if (!fight?.fighterA || !fight.fighterB) return;

    const a = room.players.get(fight.fighterA);
    const b = room.players.get(fight.fighterB);
    if (!a || !b) return;

    room.arena = randomArena();
    room.phase = 'fighting';
    room.narration = [];
    room.fightLineIndex = 0;

    const fa: FighterState = { id: a.id, nickname: a.nickname, build: a.build };
    const fb: FighterState = { id: b.id, nickname: b.nickname, build: b.build };
    const fighters = { [a.id]: fa, [b.id]: fb };

    room.narration.push(room.narrative.buildEquipmentLine(fa));
    room.narration.push(room.narrative.buildEquipmentLine(fb));
    room.narration.push(room.narrative.buildIntro(fa, fb, room.arena));

    room.fightEvents = simulateFight(fa, fb, room.arena);
    for (const evt of room.fightEvents.events.slice(0, 8)) {
      room.narration.push(room.narrative.buildAction(evt, fighters));
    }
    const winner = room.players.get(room.fightEvents.winnerId)!;
    const loser = room.players.get(room.fightEvents.loserId)!;
    room.narration.push(room.narrative.buildResult(winner.nickname, loser.nickname));

    setTimeout(() => this.finishFight(room), room.narration.length * FIGHT_LINE_MS + 500);
    this.persist(room);
  }

  advanceFightNarration(code: string): NarrationLine | null {
    const room = this.getRoom(code);
    if (!room || room.phase !== 'fighting') return null;
    if (room.fightLineIndex >= room.narration.length) {
      this.finishFight(room);
      return null;
    }
    const line = room.narration[room.fightLineIndex];
    room.fightLineIndex += 1;
    if (room.fightLineIndex >= room.narration.length) {
      setTimeout(() => this.finishFight(room), FIGHT_LINE_MS);
    }
    return line;
  }

  private finishFight(room: Room) {
    if (!room.fightEvents) return;
    const fight = room.bracket[room.currentFightIndex];
    if (!fight || fight.completed) return;

    fight.winner = room.fightEvents.winnerId;
    fight.completed = true;

    const extra: BroadcastEvent[] = [
      {
        event: 'fight_result',
        data: { winnerId: fight.winner, loserId: room.fightEvents.loserId },
      },
    ];
    const pred = this.getPredictionResults(room);
    if (pred) {
      extra.push({ event: 'prediction_results', data: pred });
      for (const [voterId, pick] of room.predictions) {
        const voter = room.players.get(voterId);
        if (voter && pick === fight.winner) voter.predictionScore += 1;
      }
    }

    const loser = room.players.get(room.fightEvents.loserId);
    if (loser) {
      loser.eliminated = true;
      loser.role = 'spectator';
    }

    // Update bracket progression
    if (fight.round === 'quarter') {
      const semiIdx = fight.id === 'q0' || fight.id === 'q1' ? 0 : 1;
      const slot = fight.id === 'q0' || fight.id === 'q2' ? 'fighterA' : 'fighterB';
      const semi = room.bracket.find((m) => m.id === `s${semiIdx}`)!;
      semi[slot] = fight.winner;
    } else if (fight.round === 'semi') {
      const slot = fight.id === 's0' ? 'fighterA' : 'fighterB';
      const final = room.bracket.find((m) => m.id === 'f0')!;
      final[slot] = fight.winner;
    } else if (fight.round === 'final') {
      room.championId = fight.winner;
      room.phase = 'champion';
      this.persist(room, [...extra, { event: 'champion_crowned', data: { championId: fight.winner } }]);
      return;
    }

    room.currentFightIndex += 1;
    const next = room.bracket[room.currentFightIndex];
    const survivors = [...room.players.values()].filter((p) => p.role === 'fighter' && !p.eliminated);

    if (next && (next.round === 'semi' || next.round === 'final') && survivors.length > 1) {
      room.phase = 'upgrade';
      room.loadoutDeadline = Date.now() + 60_000;
      this.persist(room, [...extra, { event: 'upgrade_phase_start', data: { deadline: room.loadoutDeadline } }]);
    } else if (next) {
      if (extra.length) roomBroadcaster?.(room.code, extra);
      this.beginPreFight(room);
    } else {
      room.phase = 'champion';
      room.championId = fight.winner;
      this.persist(room, extra);
    }
  }

  private clearPhaseTimer(room: Room) {
    if (room.phaseTimer) clearTimeout(room.phaseTimer);
    room.phaseTimer = null;
  }

  private persist(room: Room, extra: BroadcastEvent[] = []) {
    room.savedAt = Date.now();
    saveSnapshot(room.code, this.serializeRoom(room));
    roomBroadcaster?.(room.code, [{ event: 'room_state', data: this.publicState(room) }, ...extra]);
  }

  verifyHostToken(code: string, token: string) {
    const room = this.getRoom(code);
    return !!room && room.hostToken === token;
  }

  getPublicState(code: string): RoomState | null {
    const room = this.getRoom(code);
    return room ? this.publicState(room) : null;
  }

  publicState(room: Room): RoomState {
    const players: Player[] = [...room.players.values()].map((p) => ({
      id: p.id,
      nickname: p.nickname,
      role: p.role,
      eliminated: p.eliminated,
      connected: p.connected,
      build: p.role === 'fighter' && !p.eliminated ? p.build : undefined,
      loadoutConfirmed: p.loadoutConfirmed,
      afkStrikes: p.afkStrikes,
      predictionScore: p.predictionScore,
    }));

    const fight = room.bracket[room.currentFightIndex];
    const roundLabels: Record<string, string> = {
      quarter: 'Cuartos de final',
      semi: 'Semifinal',
      final: 'Final',
    };

    return {
      code: room.code,
      phase: room.phase,
      fighters: players.filter((p) => p.role === 'fighter' && !p.eliminated).length,
      maxFighters: MAX_FIGHTERS,
      spectators: players.filter((p) => p.role === 'spectator' || p.eliminated).length,
      queueSize: room.limiter.getQueueSize(),
      players,
      bracket: room.bracket,
      currentFightId: fight?.id ?? null,
      arena: room.arena ?? undefined,
      narration: room.narration,
      championId: room.championId,
      loadoutDeadline: room.loadoutDeadline,
      preFightDeadline: room.preFightDeadline,
      roundLabel: fight ? roundLabels[fight.round] : undefined,
      recoverable: room.recovered,
      pollingIntervalMs: room.phase === 'fighting' ? 2000 : room.phase === 'lobby' ? 4000 : 3000,
    };
  }

  serializeRoom(room: Room): SerializedRoom {
    return {
      code: room.code,
      hostToken: room.hostToken,
      createdAt: room.createdAt,
      phase: room.phase,
      players: [...room.players.entries()],
      bracket: room.bracket,
      currentFightIndex: room.currentFightIndex,
      arena: room.arena,
      narrative: room.narrative.serialize(),
      narration: room.narration,
      fightEvents: room.fightEvents,
      fightLineIndex: room.fightLineIndex,
      predictions: [...room.predictions.entries()],
      championId: room.championId,
      loadoutDeadline: room.loadoutDeadline,
      preFightDeadline: room.preFightDeadline,
      savedAt: room.savedAt,
      recovered: room.recovered,
    };
  }

  deserializeRoom(data: SerializedRoom): Room {
    const room: Room = {
      code: data.code,
      hostToken: data.hostToken,
      createdAt: data.createdAt,
      phase: data.phase,
      players: new Map(data.players),
      limiter: new ConnectionLimiter(),
      bracket: data.bracket,
      currentFightIndex: data.currentFightIndex,
      arena: data.arena,
      narrative: new NarrativeEngine(),
      narration: data.narration,
      fightEvents: data.fightEvents,
      fightLineIndex: data.fightLineIndex,
      fightTickTimer: null,
      phaseTimer: null,
      predictions: new Map(data.predictions),
      championId: data.championId,
      loadoutDeadline: data.loadoutDeadline,
      preFightDeadline: data.preFightDeadline,
      savedAt: data.savedAt,
      recovered: data.recovered ?? true,
    };
    room.narrative.restore(data.narrative);
    return room;
  }
}

interface SerializedRoom {
  code: string;
  hostToken: string;
  createdAt: number;
  phase: GamePhase;
  players: [string, InternalPlayer][];
  bracket: BracketMatch[];
  currentFightIndex: number;
  arena: Arena | null;
  narrative: { usedIds: string[] };
  narration: NarrationLine[];
  fightEvents: ReturnType<typeof simulateFight> | null;
  fightLineIndex: number;
  predictions: [string, string][];
  championId: string | null;
  loadoutDeadline: number | null;
  preFightDeadline: number | null;
  savedAt: number;
  recovered?: boolean;
}

export const tournamentManager = new TournamentManager();

// Recover snapshots on startup
import { listRecoverableSnapshots } from './StateSnapshot.js';
export function recoverSnapshotsOnBoot() {
  for (const snap of listRecoverableSnapshots()) {
    tournamentManager.recoverFromDisk(snap.code);
  }
}
