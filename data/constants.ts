/** Game constants derived from assets/constants.ts + ref/pokedriver GAME_CONST */

export const TIER1_LEGEND = new Set([
  150, 249, 250, 382, 383, 384, 483, 484, 487, 493, 643, 644, 646, 716, 717, 718,
]);

export const TIER2_LEGEND = new Set([
  144, 145, 146, 243, 244, 245, 377, 378, 379, 380, 381, 480, 481, 482, 485, 486,
  488, 638, 639, 640, 641, 642, 645,
]);

export const MYTHICAL_PKMN = new Set([
  151, 251, 385, 386, 489, 490, 491, 492, 494, 647, 648, 649, 719, 720, 721,
]);

export const DEFAULT_POKEMON_ID = 25; // Pikachu
export const SPAWN_INTERVAL = 3800;
export const SPAWN_MAX = 5;
export const MAX_UPGRADE_LEVEL = 10;
export const BANK_PAGE_SIZE = 20;
export const MAX_MONSTERS = 6;

/** Aggregated export matching ref/pokedriver window.GAME_CONST shape */
export const GAME_CONST = {
  TIER1_LEGEND: Array.from(TIER1_LEGEND),
  TIER2_LEGEND: Array.from(TIER2_LEGEND),
  MYTHICAL: Array.from(MYTHICAL_PKMN),
  MAX_LEVEL: MAX_UPGRADE_LEVEL,
  MAX_TEAM: MAX_MONSTERS,
  DEFAULT_POKEMON_ID,
  SPAWN_INTERVAL,
  SPAWN_MAX,
  BANK_PAGE_SIZE,
} as const;
