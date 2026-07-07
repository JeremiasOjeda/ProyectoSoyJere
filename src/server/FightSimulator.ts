import type { CharacterBuild } from '../types/equipment.js';
import {
  arenaBonus,
  elementMod,
  noShieldBonus,
  shieldDefenseBonus,
  styleMod,
  weaponArmorMod,
  type Arena,
} from './rules/advantages.js';
import { synergyScore } from './rules/synergies.js';

export interface FighterState {
  id: string;
  nickname: string;
  build: CharacterBuild;
}

export interface FightEvent {
  type: 'attack' | 'ability' | 'consumable' | 'miss' | 'heal';
  attackerId: string;
  defenderId: string;
  damage: number;
  text: string;
}

export interface FightResult {
  winnerId: string;
  loserId: string;
  events: FightEvent[];
  finalHp: Record<string, number>;
}

interface Combatant {
  id: string;
  nickname: string;
  build: CharacterBuild;
  maxHp: number;
  hp: number;
  atk: number;
  def: number;
  eva: number;
  accuracy: number;
  tags: string[];
  /** Flags de habilidades/consumibles de un solo uso */
  usedCharge: boolean;
  usedConsumable: boolean;
  usedSecondWind: boolean;
  trapArmed: boolean;
}

const MAX_TURNS = 30;
const MIN_HIT = 0.38;
const MAX_HIT = 0.92;
const BASE_HIT = 0.78;

function upgradeBonus(build: CharacterBuild, slot: keyof CharacterBuild) {
  const n = build.upgrades?.[slot];
  return typeof n === 'number' ? n : 0;
}

/** Estadísticas derivadas solo del build — fuente de verdad del servidor */
export function computeCombatStats(build: CharacterBuild) {
  const syn = synergyScore(build);
  const ns = noShieldBonus(build.shield);

  let maxHp = 100 + Math.floor(syn / 5) + upgradeBonus(build, 'archetype') * 4;
  if (build.artifact === 'life_amulet') maxHp += 20;

  let atk =
    20 +
    Math.floor(syn / 10) +
    ns.attack +
    upgradeBonus(build, 'weapon') * 3 +
    upgradeBonus(build, 'element') * 2;
  if (build.artifact === 'force_ring') atk += 8;
  if (build.style === 'aggressive') atk += 4;
  if (build.style === 'defensive') atk -= 2;

  let def =
    10 +
    upgradeBonus(build, 'armor') * 2 +
    upgradeBonus(build, 'shield') * 2 +
    upgradeBonus(build, 'helmet') * 1;
  if (build.ability === 'defensive_wall') def += 6;
  if (build.style === 'defensive') def += 4;
  if (build.armor === 'heavy') def += 4;
  if (build.armor === 'light') def -= 2;

  let eva = 5 + ns.evasion + upgradeBonus(build, 'style') * 2;
  if (build.artifact === 'stealth_cloak') eva += 8;
  if (build.style === 'stealthy') eva += 5;
  if (build.style === 'aggressive') eva -= 3;
  if (build.armor === 'light') eva += 3;
  if (build.armor === 'heavy') eva -= 4;

  let accuracy = 72 + upgradeBonus(build, 'ability') * 2;
  if (build.style === 'aggressive') accuracy += 6;
  if (build.style === 'stealthy') accuracy -= 4;
  if (build.artifact === 'luck_gem') accuracy += 8;
  if (build.weapon === 'bow') accuracy += 3;
  if (build.weapon === 'daggers') accuracy -= 2;

  return {
    maxHp,
    atk,
    def: Math.max(4, def),
    eva: Math.max(0, eva),
    accuracy: Math.max(50, accuracy),
  };
}

function equipmentTags(build: CharacterBuild): string[] {
  return [
    build.archetype,
    build.style,
    build.armor,
    build.helmet,
    build.shield,
    build.weapon,
    build.element,
    build.artifact,
    build.ability,
    build.consumable,
  ];
}

function toCombatant(f: FighterState): Combatant {
  const stats = computeCombatStats(f.build);
  return {
    id: f.id,
    nickname: f.nickname,
    build: f.build,
    ...stats,
    hp: stats.maxHp,
    tags: equipmentTags(f.build),
    usedCharge: false,
    usedConsumable: false,
    usedSecondWind: false,
    trapArmed: f.build.ability === 'trap',
  };
}

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}


function antiMagicReduction(defender: Combatant, elementModValue: number) {
  if (defender.build.artifact !== 'anti_magic' || elementModValue <= 0) return elementModValue;
  return Math.floor(elementModValue * 0.5);
}

function resolveWinner(fighters: Combatant[], rng: () => number): Combatant {
  const [a, b] = fighters;
  if (a.hp > b.hp) return a;
  if (b.hp > a.hp) return b;
  const aPct = a.hp / a.maxHp;
  const bPct = b.hp / b.maxHp;
  if (aPct > bPct) return a;
  if (bPct > aPct) return b;
  return rng() < 0.5 ? a : b;
}

function applyDamage(
  events: FightEvent[],
  attacker: Combatant,
  defender: Combatant,
  rawDmg: number,
  text: string,
) {
  const dmg = Math.max(0, Math.floor(rawDmg));
  defender.hp = Math.max(0, defender.hp - dmg);
  events.push({
    type: 'attack',
    attackerId: attacker.id,
    defenderId: defender.id,
    damage: dmg,
    text,
  });
}

function trySecondWind(events: FightEvent[], fighter: Combatant) {
  if (
    fighter.build.ability !== 'second_wind' ||
    fighter.usedSecondWind ||
    fighter.hp <= 0 ||
    fighter.hp > fighter.maxHp * 0.35
  ) {
    return;
  }
  const heal = Math.floor(fighter.maxHp * 0.2);
  fighter.hp = Math.min(fighter.maxHp, fighter.hp + heal);
  fighter.usedSecondWind = true;
  events.push({
    type: 'heal',
    attackerId: fighter.id,
    defenderId: fighter.id,
    damage: -heal,
    text: `${fighter.nickname} usa Segundo aliento (+${heal} HP)`,
  });
}

function useOpeningConsumable(
  events: FightEvent[],
  attacker: Combatant,
  defender: Combatant,
  turn: number,
): { atkBonus: number; defBonus: number; evaBonus: number } {
  if (attacker.usedConsumable || turn > 1) {
    return { atkBonus: 0, defBonus: 0, evaBonus: 0 };
  }
  attacker.usedConsumable = true;
  switch (attacker.build.consumable) {
    case 'red_potion': {
      const heal = 15;
      attacker.hp = Math.min(attacker.maxHp, attacker.hp + heal);
      events.push({
        type: 'consumable',
        attackerId: attacker.id,
        defenderId: attacker.id,
        damage: -heal,
        text: `${attacker.nickname} bebe Poción roja (+${heal} HP)`,
      });
      return { atkBonus: 0, defBonus: 0, evaBonus: 0 };
    }
    case 'smoke_bomb':
      events.push({
        type: 'consumable',
        attackerId: attacker.id,
        defenderId: defender.id,
        damage: 0,
        text: `${attacker.nickname} lanza Bomba de humo`,
      });
      return { atkBonus: 0, defBonus: 0, evaBonus: 12 };
    case 'fire_oil':
      events.push({
        type: 'consumable',
        attackerId: attacker.id,
        defenderId: defender.id,
        damage: 0,
        text: `${attacker.nickname} rocía Aceite ígneo`,
      });
      return { atkBonus: 10, defBonus: 0, evaBonus: 0 };
    case 'speed_elixir':
      events.push({
        type: 'consumable',
        attackerId: attacker.id,
        defenderId: defender.id,
        damage: 0,
        text: `${attacker.nickname} bebe Elixir de velocidad`,
      });
      return { atkBonus: 6, defBonus: 0, evaBonus: 6 };
    case 'antidote':
      return { atkBonus: 0, defBonus: 4, evaBonus: 0 };
    default:
      return { atkBonus: 0, defBonus: 0, evaBonus: 0 };
  }
}

export interface SimulateFightOptions {
  rng?: () => number;
  /** 0 = fighterA primero, 1 = fighterB primero. Si no se pasa, se elige al azar */
  firstAttacker?: 0 | 1;
}

export function simulateFight(
  a: FighterState,
  b: FighterState,
  arena: Arena,
  options: SimulateFightOptions = {},
): FightResult {
  const rng = options.rng ?? Math.random;
  const events: FightEvent[] = [];
  const fighters: [Combatant, Combatant] = [toCombatant(a), toCombatant(b)];

  const arenaBonuses = [
    Math.min(arenaBonus(arena, fighters[0].tags), 18),
    Math.min(arenaBonus(arena, fighters[1].tags), 18),
  ];

  const first = options.firstAttacker ?? (rng() < 0.5 ? 0 : 1);

  let turn = 0;
  while (fighters[0].hp > 0 && fighters[1].hp > 0 && turn < MAX_TURNS) {
    const atkIdx = (first + turn) % 2;
    const defIdx = atkIdx === 0 ? 1 : 0;
    const atk = fighters[atkIdx];
    const def = fighters[defIdx];

    const consumable = useOpeningConsumable(events, atk, def, turn);
    const effectiveEva = def.eva + consumable.evaBonus;

    if (def.trapArmed && turn <= 2) {
      def.trapArmed = false;
      const trapDmg = 8;
      atk.hp = Math.max(0, atk.hp - trapDmg);
      events.push({
        type: 'ability',
        attackerId: def.id,
        defenderId: atk.id,
        damage: trapDmg,
        text: `${def.nickname} activa una trampa (-${trapDmg} HP a ${atk.nickname})`,
      });
      if (atk.hp <= 0) break;
    }

    const hit = rng() <= clamp(BASE_HIT + (atk.accuracy - effectiveEva) / 120, MIN_HIT, MAX_HIT);
    if (!hit) {
      events.push({
        type: 'miss',
        attackerId: atk.id,
        defenderId: def.id,
        damage: 0,
        text: `${atk.nickname} falla el golpe contra ${def.nickname}`,
      });
      turn++;
      continue;
    }

    const wMod = weaponArmorMod(atk.build.weapon, def.build.armor);
    let eMod = elementMod(atk.build.element, def.build);
    eMod = antiMagicReduction(def, eMod);
    const stMod = styleMod(atk.build.style, def.build.style);
    const shieldMod = shieldDefenseBonus(def.build.shield, atk.build.weapon);
    const aBonus = arenaBonuses[atkIdx];

    let dmg =
      atk.atk +
      wMod +
      eMod +
      stMod +
      aBonus +
      consumable.atkBonus -
      def.def -
      shieldMod -
      consumable.defBonus;

    if (atk.build.ability === 'mortal_charge' && !atk.usedCharge) {
      dmg += 14;
      atk.usedCharge = true;
      events.push({
        type: 'ability',
        attackerId: atk.id,
        defenderId: def.id,
        damage: 0,
        text: `${atk.nickname} carga con fuerza mortal`,
      });
    }

    if (atk.build.ability === 'berserker_rage' && atk.hp < atk.maxHp * 0.4) {
      dmg += 10;
    }

    if (def.build.ability === 'defensive_wall' && turn < 4) {
      dmg -= 7;
    }

    const variance = Math.floor(rng() * 7) - 3;
    dmg = Math.max(4, Math.floor(dmg + variance));

    applyDamage(
      events,
      atk,
      def,
      dmg,
      `${atk.nickname} golpea a ${def.nickname} (-${dmg} HP)`,
    );

    trySecondWind(events, def);
    trySecondWind(events, atk);

    turn++;
  }

  const winner = resolveWinner(fighters, rng);
  const loser = winner.id === fighters[0].id ? fighters[1] : fighters[0];

  return {
    winnerId: winner.id,
    loserId: loser.id,
    events,
    finalHp: { [fighters[0].id]: fighters[0].hp, [fighters[1].id]: fighters[1].hp },
  };
}

/** Utilidad para tests: win rate de A cuando A y B tienen el mismo build */
export function mirrorMatchWinRate(samples = 500, seed = 42): {
  aWins: number;
  bWins: number;
  aWinRate: number;
} {
  let s = seed;
  const rng = () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 0x100000000;
  };

  const build = {
    archetype: 'warrior' as const,
    style: 'balanced' as const,
    armor: 'heavy' as const,
    helmet: 'helm' as const,
    shield: 'tower' as const,
    weapon: 'sword' as const,
    element: 'neutral' as const,
    artifact: 'life_amulet' as const,
    ability: 'mortal_charge' as const,
    consumable: 'red_potion' as const,
    upgrades: {},
  };

  let aWins = 0;
  for (let i = 0; i < samples; i++) {
    const r = simulateFight(
      { id: 'a', nickname: 'A', build },
      { id: 'b', nickname: 'B', build },
      'arena',
      { rng, firstAttacker: i % 2 === 0 ? 0 : 1 },
    );
    if (r.winnerId === 'a') aWins++;
  }
  return { aWins, bWins: samples - aWins, aWinRate: aWins / samples };
}
