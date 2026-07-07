export const ARCHETYPES = ['warrior', 'ranger', 'mage', 'assassin', 'paladin'] as const;
export const STYLES = ['aggressive', 'defensive', 'balanced', 'stealthy'] as const;
export const ARMORS = ['heavy', 'light', 'magic', 'leather'] as const;
export const HELMETS = ['helm', 'hood', 'none'] as const;
export const SHIELDS = ['tower', 'buckler', 'enchanted', 'none'] as const;
export const WEAPONS = ['sword', 'spear', 'mace', 'bow', 'daggers'] as const;
export const ELEMENTS = ['fire', 'ice', 'poison', 'lightning', 'neutral'] as const;
export const ARTIFACTS = [
  'life_amulet',
  'force_ring',
  'luck_gem',
  'anti_magic',
  'stealth_cloak',
] as const;
export const ABILITIES = [
  'mortal_charge',
  'defensive_wall',
  'second_wind',
  'trap',
  'berserker_rage',
] as const;
export const CONSUMABLES = [
  'red_potion',
  'smoke_bomb',
  'fire_oil',
  'antidote',
  'speed_elixir',
] as const;

export type Archetype = (typeof ARCHETYPES)[number];
export type Style = (typeof STYLES)[number];
export type Armor = (typeof ARMORS)[number];
export type Helmet = (typeof HELMETS)[number];
export type Shield = (typeof SHIELDS)[number];
export type Weapon = (typeof WEAPONS)[number];
export type Element = (typeof ELEMENTS)[number];
export type Artifact = (typeof ARTIFACTS)[number];
export type Ability = (typeof ABILITIES)[number];
export type Consumable = (typeof CONSUMABLES)[number];

export interface CharacterBuild {
  archetype: Archetype;
  style: Style;
  armor: Armor;
  helmet: Helmet;
  shield: Shield;
  weapon: Weapon;
  element: Element;
  artifact: Artifact;
  ability: Ability;
  consumable: Consumable;
  upgrades: Partial<Record<keyof CharacterBuild, number>>;
}

export const EQUIPMENT_CATALOG = {
  archetype: ARCHETYPES,
  style: STYLES,
  armor: ARMORS,
  helmet: HELMETS,
  shield: SHIELDS,
  weapon: WEAPONS,
  element: ELEMENTS,
  artifact: ARTIFACTS,
  ability: ABILITIES,
  consumable: CONSUMABLES,
} as const;

export const BUILD_SLOTS = [
  'archetype',
  'style',
  'armor',
  'helmet',
  'shield',
  'weapon',
  'element',
  'artifact',
  'ability',
  'consumable',
] as const;

export type BuildSlot = (typeof BUILD_SLOTS)[number];

export function defaultBuild(): CharacterBuild {
  return {
    archetype: 'warrior',
    style: 'balanced',
    armor: 'heavy',
    helmet: 'helm',
    shield: 'tower',
    weapon: 'sword',
    element: 'neutral',
    artifact: 'life_amulet',
    ability: 'mortal_charge',
    consumable: 'red_potion',
    upgrades: {},
  };
}

export function randomBuild(): CharacterBuild {
  const pick = <T extends readonly string[]>(arr: T) => arr[Math.floor(Math.random() * arr.length)] as T[number];
  return {
    archetype: pick(ARCHETYPES),
    style: pick(STYLES),
    armor: pick(ARMORS),
    helmet: pick(HELMETS),
    shield: pick(SHIELDS),
    weapon: pick(WEAPONS),
    element: pick(ELEMENTS),
    artifact: pick(ARTIFACTS),
    ability: pick(ABILITIES),
    consumable: pick(CONSUMABLES),
    upgrades: {},
  };
}

export function isValidBuild(build: unknown): build is CharacterBuild {
  if (!build || typeof build !== 'object') return false;
  const b = build as CharacterBuild;
  return (
    EQUIPMENT_CATALOG.archetype.includes(b.archetype) &&
    EQUIPMENT_CATALOG.style.includes(b.style) &&
    EQUIPMENT_CATALOG.armor.includes(b.armor) &&
    EQUIPMENT_CATALOG.helmet.includes(b.helmet) &&
    EQUIPMENT_CATALOG.shield.includes(b.shield) &&
    EQUIPMENT_CATALOG.weapon.includes(b.weapon) &&
    EQUIPMENT_CATALOG.element.includes(b.element) &&
    EQUIPMENT_CATALOG.artifact.includes(b.artifact) &&
    EQUIPMENT_CATALOG.ability.includes(b.ability) &&
    EQUIPMENT_CATALOG.consumable.includes(b.consumable)
  );
}

export const LABELS: Record<string, string> = {
  warrior: 'Guerrero',
  ranger: 'Ranger',
  mage: 'Mago',
  assassin: 'Asesino',
  paladin: 'Paladín',
  aggressive: 'Agresivo',
  defensive: 'Defensivo',
  balanced: 'Equilibrado',
  stealthy: 'Sigiloso',
  heavy: 'Pesada',
  light: 'Ligera',
  magic: 'Mágica',
  leather: 'Cuero',
  helm: 'Yelmo',
  hood: 'Capucha',
  none: 'Sin casco',
  tower: 'Torre',
  buckler: 'Rodela',
  enchanted: 'Encantado',
  sword: 'Espada',
  spear: 'Lanza',
  mace: 'Maza',
  bow: 'Arco',
  daggers: 'Dagas',
  fire: 'Fuego',
  ice: 'Hielo',
  poison: 'Veneno',
  lightning: 'Rayo',
  neutral: 'Neutro',
  life_amulet: 'Amuleto de vida',
  force_ring: 'Anillo de fuerza',
  luck_gem: 'Gema de suerte',
  anti_magic: 'Talismán anti-magia',
  stealth_cloak: 'Capa del sigilo',
  mortal_charge: 'Carga mortal',
  defensive_wall: 'Muro defensivo',
  second_wind: 'Segundo aliento',
  trap: 'Trampa',
  berserker_rage: 'Ira berserker',
  red_potion: 'Poción roja',
  smoke_bomb: 'Bomba de humo',
  fire_oil: 'Aceite ígneo',
  antidote: 'Antídoto',
  speed_elixir: 'Elixir de velocidad',
};
