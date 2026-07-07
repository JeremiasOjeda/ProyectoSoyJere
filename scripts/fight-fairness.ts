/**
 * Verifica equilibrio del simulador: builds espejo deben rondar 50% de victorias.
 * Uso: npx tsx scripts/fight-fairness.ts
 */
import { mirrorMatchWinRate, simulateFight, computeCombatStats } from '../src/server/FightSimulator.js';
import { randomBuild } from '../src/types/equipment.js';
import type { CharacterBuild } from '../src/types/equipment.js';

const SAMPLES = 400;
const TOLERANCE = 0.12;

function seededRng(seed: number) {
  let s = seed;
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 0x100000000;
  };
}

function assertFair(label: string, aWinRate: number) {
  const ok = Math.abs(aWinRate - 0.5) <= TOLERANCE;
  const pct = (aWinRate * 100).toFixed(1);
  console.log(`${ok ? '✓' : '✗'} ${label}: A gana ${pct}% (esperado ~50% ±${TOLERANCE * 100}%)`);
  return ok;
}

let allOk = true;

const mirror = mirrorMatchWinRate(SAMPLES, 42);
allOk = assertFair('Build espejo (turno alternado)', mirror.aWinRate) && allOk;

const build = randomBuild();
const rng = seededRng(99);
let wins = 0;
for (let i = 0; i < SAMPLES; i++) {
  const r = simulateFight(
    { id: 'a', nickname: 'A', build },
    { id: 'b', nickname: 'B', build },
    'arena',
    { rng, firstAttacker: i % 2 === 0 ? 0 : 1 },
  );
  if (r.winnerId === 'a') wins++;
}
allOk = assertFair('Build aleatorio espejo', wins / SAMPLES) && allOk;

const heavy: CharacterBuild = {
  ...randomBuild(),
  armor: 'heavy',
  shield: 'tower',
  style: 'defensive',
  artifact: 'life_amulet',
};
const light: CharacterBuild = {
  ...randomBuild(),
  armor: 'light',
  shield: 'none',
  weapon: 'daggers',
  style: 'aggressive',
  artifact: 'force_ring',
};

let heavyWins = 0;
const rng2 = seededRng(7);
for (let i = 0; i < SAMPLES; i++) {
  const r = simulateFight(
    { id: 'h', nickname: 'Heavy', build: heavy },
    { id: 'l', nickname: 'Light', build: light },
    'arena',
    { rng: rng2, firstAttacker: i % 2 === 0 ? 0 : 1 },
  );
  if (r.winnerId === 'h') heavyWins++;
}
const heavyRate = heavyWins / SAMPLES;
console.log(
  `  Heavy tank vs Light DPS: heavy gana ${(heavyRate * 100).toFixed(1)}% (esperado 40-70%, no extremo)`,
);
if (heavyRate < 0.2 || heavyRate > 0.8) {
  console.log('✗ Matchup heavy vs light demasiado desbalanceado');
  allOk = false;
}

const stats = computeCombatStats(heavy);
console.log(`  Stats heavy sample: HP=${stats.maxHp} ATK=${stats.atk} DEF=${stats.def}`);

process.exit(allOk ? 0 : 1);
