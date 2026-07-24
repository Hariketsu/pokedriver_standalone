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

/** Meta train / multi-ball / end-run bank (P1). */
export const MASTER_BALL_RUN_CAP = 1;
export const BANK_RATIO = 0.5;
export const UPGRADE_BASE_COST = 15;
export const UPGRADE_COST_STEP = 10;
export const MAX_META_ATK_LV = 5;
export const MAX_META_HP_LV = 5;
export const ATK_PER_META_LV = 1;
export const HP_PER_META_LV = 2;
export const EXAM_QUESTION_COUNT = 100;
export const EXAM_TIME_MS = 45 * 60 * 1000;
export const EXAM_PASS_LINE = 90;

/** Boot integrity asserts */
export const POKEMON_COUNT = 721;
export const MIN_QUESTION_BANK = 100;

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
  MASTER_BALL_RUN_CAP,
  BANK_RATIO,
  UPGRADE_BASE_COST,
  UPGRADE_COST_STEP,
  MAX_META_ATK_LV,
  MAX_META_HP_LV,
  ATK_PER_META_LV,
  HP_PER_META_LV,
  EXAM_QUESTION_COUNT,
  EXAM_TIME_MS,
  EXAM_PASS_LINE,
  POKEMON_COUNT,
  MIN_QUESTION_BANK,
} as const;
