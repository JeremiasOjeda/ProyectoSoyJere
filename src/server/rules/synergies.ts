import type { Archetype, CharacterBuild, Weapon } from '../../types/equipment.js';

const ARCHETYPE_WEAPON: Record<Archetype, Weapon> = {
  warrior: 'sword',
  ranger: 'bow',
  mage: 'spear',
  assassin: 'daggers',
  paladin: 'mace',
};

export function suggestedBuild(archetype: Archetype): Partial<CharacterBuild> {
  const base: Record<Archetype, Partial<CharacterBuild>> = {
    warrior: { style: 'defensive', armor: 'heavy', helmet: 'helm', shield: 'tower', weapon: 'sword', element: 'neutral' },
    ranger: { style: 'balanced', armor: 'leather', helmet: 'hood', shield: 'none', weapon: 'bow', element: 'poison' },
    mage: { style: 'stealthy', armor: 'magic', helmet: 'hood', shield: 'enchanted', weapon: 'spear', element: 'ice' },
    assassin: { style: 'aggressive', armor: 'leather', helmet: 'none', shield: 'none', weapon: 'daggers', element: 'poison' },
    paladin: { style: 'defensive', armor: 'heavy', helmet: 'helm', shield: 'tower', weapon: 'mace', element: 'fire' },
  };
  return { archetype, weapon: ARCHETYPE_WEAPON[archetype], ...base[archetype] };
}

export function synergyScore(build: CharacterBuild) {
  let score = 50;
  if (build.weapon === ARCHETYPE_WEAPON[build.archetype]) score += 10;
  if (build.shield === 'none' && build.weapon === 'bow') score += 8;
  if (build.shield === 'none' && build.weapon === 'daggers') score += 8;
  if (build.style === 'defensive' && build.helmet === 'none') score -= 5;
  if (build.style === 'aggressive' && build.armor === 'heavy') score -= 3;
  return Math.max(0, Math.min(100, score));
}
