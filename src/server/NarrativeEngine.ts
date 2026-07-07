import type { Arena } from './rules/advantages.js';
import { ARENA_LABELS } from './rules/advantages.js';
import type { FightEvent, FighterState } from './FightSimulator.js';
import type { NarrationLine } from '../types/protocol.js';
import { LABELS } from '../types/equipment.js';

const INTRO_TEMPLATES = [
  (a: string, b: string, arena: string) =>
    `¡La arena de ${arena} recibe a ${a} y ${b}!`,
  (a: string, b: string, arena: string) =>
    `${a} encara a ${b} bajo el cielo de ${arena}.`,
  (a: string, b: string, arena: string) =>
    `El público ruge: ${a} vs ${b} en ${arena}.`,
  (a: string, b: string, arena: string) =>
    `Comienza el duelo entre ${a} y ${b} en la ${arena}.`,
  (a: string, b: string, arena: string) =>
    `${arena} tiembla cuando ${a} y ${b} se miden.`,
];

const ACTION_TEMPLATES = [
  (evt: FightEvent, atk: string, def: string) =>
    evt.type === 'miss' ? `${atk} busca una apertura pero ${def} esquiva.` : evt.text,
  (evt: FightEvent, atk: string, def: string) =>
    evt.type === 'miss'
      ? `${def} anticipa el movimiento de ${atk}.`
      : `¡Golpe certero! ${atk} hiere a ${def}.`,
  (evt: FightEvent, atk: string, def: string) =>
    evt.type === 'miss' ? `${atk} pierde el ritmo.` : `${def} retrocede tras el impacto de ${atk}.`,
  (evt: FightEvent, atk: string, def: string) =>
    evt.type === 'miss' ? `Intercambio fallido de ${atk}.` : `La defensa de ${def} cede ante ${atk}.`,
  (evt: FightEvent, atk: string, def: string) =>
    evt.type === 'miss' ? `${def} mantiene la distancia.` : `${atk} presiona con fuerza contra ${def}.`,
];

const RESULT_TEMPLATES = [
  (w: string, l: string) => `¡${w} vence a ${l}!`,
  (w: string, l: string) => `${w} se alza con la victoria sobre ${l}.`,
  (w: string, l: string) => `Tras un duelo intenso, ${w} derrota a ${l}.`,
  (w: string, l: string) => `${l} cae. ${w} avanza en el torneo.`,
  (w: string, _l: string) => `El combate termina: gana ${w}.`,
];

export class NarrativeEngine {
  private usedIds: string[] = [];

  private pick<T>(pool: T[], category: string): T {
    const available = pool.map((item, i) => ({ item, i }));
    const filtered = available.filter(({ i }) => {
      const id = `${category}_${i}`;
      return !this.usedIds.slice(-3).includes(id);
    });
    const pick = filtered[Math.floor(Math.random() * filtered.length)] ?? available[0];
    const id = `${category}_${pick.i}`;
    this.usedIds.push(id);
    if (this.usedIds.length > 12) this.usedIds.shift();
    return pick.item;
  }

  buildIntro(a: FighterState, b: FighterState, arena: Arena): NarrationLine {
    const arenaLabel = ARENA_LABELS[arena];
    const tpl = this.pick(INTRO_TEMPLATES, 'intro');
    return {
      id: `n_${Date.now()}_intro`,
      phase: 'intro',
      text: tpl(a.nickname, b.nickname, arenaLabel),
    };
  }

  buildAction(evt: FightEvent, fighters: Record<string, FighterState>): NarrationLine {
    const atk = fighters[evt.attackerId]?.nickname ?? 'Luchador';
    const def = fighters[evt.defenderId]?.nickname ?? 'Rival';
    const tpl = this.pick(ACTION_TEMPLATES, 'action');
    return {
      id: `n_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      phase: 'action',
      text: tpl(evt, atk, def),
    };
  }

  buildEquipmentLine(fighter: FighterState): NarrationLine {
    const b = fighter.build;
    const text = `${fighter.nickname} lucha como ${LABELS[b.archetype]} con ${LABELS[b.weapon]} y ${LABELS[b.element]}.`;
    return { id: `n_eq_${fighter.id}`, phase: 'intro', text };
  }

  buildResult(winner: string, loser: string): NarrationLine {
    const tpl = this.pick(RESULT_TEMPLATES, 'result');
    return {
      id: `n_${Date.now()}_result`,
      phase: 'result',
      text: tpl(winner, loser),
    };
  }

  serialize() {
    return { usedIds: this.usedIds };
  }

  restore(data: { usedIds?: string[] }) {
    this.usedIds = data.usedIds ?? [];
  }
}
