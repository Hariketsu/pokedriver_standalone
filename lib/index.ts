/** Clean public API for game logic + store (no React components). */

export * from "./types";
export {
  RARITY_LABEL,
  RARITY_CSS,
  TIMER_SEC,
  CATCH_BASE,
  PKMN_BY_ID,
  rand,
  pick,
  clamp,
  baseHp,
  pokeMaxHp,
  pokeAtk,
  pokeSpeed,
  critChance,
  xpNeed,
  newInstance,
  calcScore,
  catchChance,
  grantXpTo,
  GAME_CONST,
  GAME_RULES,
  POKEMON,
} from "./formulas";

export {
  NODE_ICON,
  MAP_ROWS,
  genMap,
  isCurrentNode,
  isReachable,
} from "./map";

export {
  enemyForNode,
  createBattleState,
  pickQuestion,
  questionTimeTotal,
  applyPlayerAttack,
  applyEnemyAttack,
  findAliveIndex,
  applyWinBattle,
  tryCapture,
  catchLevelForFloor,
  usePotion,
  recordCorrectAnswer,
  recordWrongAnswer,
} from "./battle";

export {
  SHOP_POOL,
  shopPrice,
  applyShopItem,
  rollShopStock,
} from "./shop";

export {
  useGameStore,
  META_KEY,
  RUN_KEY,
  STARTERS,
  selectScore,
  selectActive,
} from "./store";

export type {
  AnswerResult,
  CaptureResult,
} from "./store";

export { ICON } from "./icon";
export { AudioEngine } from "./audio";
export { BattleFX } from "./fx3d";
export { spawnDmg, spawnFxText, domBurst } from "./dom-fx";
