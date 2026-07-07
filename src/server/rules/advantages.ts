import type { Armor, Element, Shield, Style, Weapon } from '../../types/equipment.js';

export const ARENAS = ['forest', 'desert', 'castle', 'volcano', 'ice', 'arena'] as const;
export type Arena = (typeof ARENAS)[number];

export const ARENA_LABELS: Record<Arena, string> = {
  forest: 'Bosque',
  desert: 'Desierto',
  castle: 'Castillo',
  volcano: 'Volcán',
  ice: 'Hielo',
  arena: 'Arena',
};

export function randomArena(): Arena {
  return ARENAS[Math.floor(Math.random() * ARENAS.length)];
}

export function arenaBonus(arena: Arena, tags: string[]) {
  const map: Record<Arena, Record<string, number>> = {
    forest: { light: 10, stealthy: 10, poison: 10 },
    desert: { heavy: 10, fire: 10, aggressive: 10 },
    castle: { tower: 8, buckler: 8, enchanted: 8, neutral: 10 },
    volcano: { mace: 10, fire: 10, berserker_rage: 8 },
    ice: { ice: 10, balanced: 8 },
    arena: {},
  };
  return tags.reduce((sum, tag) => sum + (map[arena][tag] ?? 0), 0);
}

const WEAPON_VS_ARMOR: Record<Weapon, { strong: Armor[]; weak: Armor[] }> = {
  sword: { strong: ['light', 'leather'], weak: ['heavy'] },
  spear: { strong: ['heavy'], weak: ['light'] },
  mace: { strong: ['magic'], weak: ['leather'] },
  bow: { strong: [], weak: ['heavy'] },
  daggers: { strong: ['magic'], weak: ['heavy'] },
};

const SHIELD_VS_WEAPON: Record<Shield, { strong: Weapon[]; weak: Weapon[] }> = {
  tower: { strong: ['mace', 'bow'], weak: ['spear', 'daggers'] },
  buckler: { strong: ['sword'], weak: ['mace'] },
  enchanted: { strong: ['spear'], weak: ['bow'] },
  none: { strong: [], weak: [] },
};

const ELEMENT_VS: Record<Element, { strong: string[]; weak: string[] }> = {
  fire: { strong: ['ice', 'leather'], weak: ['heavy'] },
  ice: { strong: ['poison', 'light'], weak: ['fire'] },
  poison: { strong: ['none'], weak: ['anti_magic'] },
  lightning: { strong: ['enchanted', 'magic'], weak: ['tower'] },
  neutral: { strong: [], weak: [] },
};

const STYLE_VS: Record<Style, Style> = {
  aggressive: 'stealthy',
  defensive: 'aggressive',
  stealthy: 'balanced',
  balanced: 'defensive',
};

export function weaponArmorMod(weapon: Weapon, armor: Armor) {
  const r = WEAPON_VS_ARMOR[weapon];
  if (r.strong.includes(armor)) return 12;
  if (r.weak.includes(armor)) return -8;
  return 0;
}

export function shieldWeaponMod(shield: Shield, weapon: Weapon) {
  if (shield === 'none') return 0;
  const r = SHIELD_VS_WEAPON[shield];
  if (r.strong.includes(weapon)) return 10;
  if (r.weak.includes(weapon)) return -6;
  return 0;
}

export function elementMod(element: Element, target: { helmet: string; shield: string; armor: Armor }) {
  const r = ELEMENT_VS[element];
  let mod = 0;
  if (r.strong.includes(target.armor) || r.strong.includes(target.helmet)) mod += 8;
  if (r.weak.includes(target.shield) || r.weak.includes(target.armor)) mod -= 5;
  return mod;
}

export function styleMod(a: Style, b: Style) {
  return STYLE_VS[a] === b ? 6 : 0;
}

export function noShieldBonus(shield: Shield) {
  return shield === 'none' ? { attack: 15, evasion: 10 } : { attack: 0, evasion: 0 };
}
