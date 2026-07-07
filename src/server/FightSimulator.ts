import type { CharacterBuild } from '../types/equipment.js';
import {
  arenaBonus,
  elementMod,
  noShieldBonus,
  shieldWeaponMod,
  styleMod,
  weaponArmorMod,
  type Arena,
} from './rules/advantages.js';
import { synergyScore } from './rules/synergies.js';

export interface FighterState {
  id: string;
  nickname: string;
  build: CharacterBuild;
  hp: number;
  maxHp: number;
}

export interface FightEvent {
  type: 'attack' | 'ability' | 'consumable' | 'miss';
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

function baseStats(build: CharacterBuild) {
  const syn = synergyScore(build);
  const ns = noShieldBonus(build.shield);
  const hp = 100 + (build.artifact === 'life_amulet' ? 20 : 0) + Math.floor(syn / 5);
  const atk = 20 + (build.artifact === 'force_ring' ? 8 : 0) + ns.attack + Math.floor(syn / 10);
  const def = 10 + (build.ability === 'defensive_wall' ? 6 : 0);
  const eva = 5 + (build.artifact === 'stealth_cloak' ? 8 : 0) + ns.evasion;
  return { hp, atk, def, eva };
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

export function simulateFight(
  a: FighterState,
  b: FighterState,
  arena: Arena,
  rng: () => number = Math.random,
): FightResult {
  const events: FightEvent[] = [];
  const fighters = [
    { ...a, ...baseStats(a.build), tags: equipmentTags(a.build) },
    { ...b, ...baseStats(b.build), tags: equipmentTags(b.build) },
  ];
  fighters[0].hp = fighters[0].maxHp;
  fighters[1].hp = fighters[1].maxHp;

  const arenaA = arenaBonus(arena, fighters[0].tags);
  const arenaB = arenaBonus(arena, fighters[1].tags);

  let turn = 0;
  while (fighters[0].hp > 0 && fighters[1].hp > 0 && turn < 24) {
    const atkIdx = turn % 2;
    const defIdx = atkIdx === 0 ? 1 : 0;
    const atk = fighters[atkIdx];
    const def = fighters[defIdx];

    const wMod = weaponArmorMod(atk.build.weapon, def.build.armor);
    const sMod = shieldWeaponMod(def.build.shield, atk.build.weapon);
    const eMod = elementMod(atk.build.element, def.build);
    const stMod = styleMod(atk.build.style, def.build.style);
    const aBonus = atkIdx === 0 ? arenaA : arenaB;

    const hitChance = 0.75 + (atk.eva - def.eva) / 200;
    if (rng() > hitChance) {
      events.push({
        type: 'miss',
        attackerId: atk.id,
        defenderId: def.id,
        damage: 0,
        text: `${atk.nickname} falla el golpe`,
      });
      turn++;
      continue;
    }

    let dmg = atk.atk + wMod + eMod + stMod + aBonus - def.def + sMod;
    if (atk.build.ability === 'berserker_rage' && atk.hp < atk.maxHp * 0.4) dmg += 12;
    if (def.build.ability === 'defensive_wall' && turn < 4) dmg -= 6;
    dmg = Math.max(3, Math.floor(dmg + rng() * 8));

    def.hp = Math.max(0, def.hp - dmg);
    events.push({
      type: 'attack',
      attackerId: atk.id,
      defenderId: def.id,
      damage: dmg,
      text: `${atk.nickname} golpea a ${def.nickname} (-${dmg} HP)`,
    });
    turn++;
  }

  const winner = fighters[0].hp >= fighters[1].hp ? fighters[0] : fighters[1];
  const loser = winner.id === fighters[0].id ? fighters[1] : fighters[0];

  return {
    winnerId: winner.id,
    loserId: loser.id,
    events,
    finalHp: { [fighters[0].id]: fighters[0].hp, [fighters[1].id]: fighters[1].hp },
  };
}
