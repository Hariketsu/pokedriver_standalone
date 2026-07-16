'use client';

import { useGameStore, type MonsterState } from '@/lib/store';
import { getAllPokemon, getPkmHP, getPkmSpeed, getPkmSpawnWeight } from '@/lib/pokemon';
import { SPAWN_INTERVAL, SPAWN_MAX, MAX_MONSTERS, DEFAULT_POKEMON_ID } from '@/data/constants';

// ============================================================
// Spawn Logic
// ============================================================

/**
 * Attempts to spawn a new monster using weighted random selection from
 * the full Pokemon pool. Returns null if the monster cap is reached.
 *
 * Speed scales with the current speedLevel.
 * HP = min(ceil(getPkmHP(pkm) + (speedLevel - 1) * 0.5), 10).
 * Color is derived from rarity: l=#ff0044, r=#ffd700, else #00f0ff.
 */
export function spawnMonster(): MonsterState | null {
  const state = useGameStore.getState();

  // Respect the monster cap
  if (state.monsters.length >= MAX_MONSTERS) {
    return null;
  }

  // Weighted random selection from the full Pokemon pool
  const pool = getAllPokemon();
  const weights = pool.map((p) => getPkmSpawnWeight(p));
  const totalWeight = weights.reduce((sum, w) => sum + w, 0);
  let roll = Math.random() * totalWeight;
  let chosen = pool[0];
  for (let i = 0; i < pool.length; i++) {
    roll -= weights[i];
    if (roll <= 0) {
      chosen = pool[i];
      break;
    }
  }

  const speedLevel = state.speedLevel;
  const boostedSpeed = getPkmSpeed(chosen) * (1 + (speedLevel - 1) * 0.35);
  const hp = Math.min(Math.ceil(getPkmHP(chosen) + (speedLevel - 1) * 0.5), 10);

  let color: string;
  if (chosen.r === 'l') {
    color = '#ff0044';
  } else if (chosen.r === 'r') {
    color = '#ffd700';
  } else {
    color = '#00f0ff';
  }

  const id = state.monsterIdCounter;

  const monster: MonsterState = {
    id,
    pkmId: chosen.id,
    pokeData: { id: chosen.id, n: chosen.n, c: chosen.c, r: chosen.r, i: chosen.i },
    name: chosen.c,
    maxHp: hp,
    hp,
    color,
    speed: boostedSpeed,
    y: -80,
    dead: false,
    reached: false,
  };

  useGameStore.setState({
    monsters: [...state.monsters, monster],
    monsterIdCounter: id + 1,
  });

  return monster;
}

// ============================================================
// Spawn Rate
// ============================================================

/**
 * Returns the probability (0-1) that a monster should spawn on a given tick.
 *
 * Formula: 0.30 + min(combo, 20) * 0.025 + (speedLevel - 1) * 0.06,
 * capped at 0.92.
 */
export function getSpawnChance(speedLevel: number, combo: number): number {
  const chance = 0.3 + Math.min(combo, 20) * 0.025 + (speedLevel - 1) * 0.06;
  return Math.min(chance, 0.92);
}

// ============================================================
// Shooting / Damage
// ============================================================

/**
 * Returns the damage dealt per bullet.
 * Damage = bulletLevel * (doubleDamage ? 2 : 1).
 */
export function calculateDamage(bulletLevel: number, doubleDamage: boolean): number {
  return bulletLevel * (doubleDamage ? 2 : 1);
}

// ============================================================
// Layout Helpers
// ============================================================

/**
 * Returns the Y-coordinate at which a monster has "reached" the end of its lane.
 * Monsters that pass this point deal damage to the player.
 */
export function getEndY(laneHeight: number): number {
  return laneHeight - 70;
}
