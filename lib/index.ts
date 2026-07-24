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
  BALL_MULT,
  metaUpgradeCost,
  GAME_CONST,
  GAME_RULES,
  POKEMON,
} from "./formulas";

export {
  NODE_ICON,
  NODE_LABEL,
  MAP_ROWS,
  genMap,
  isCurrentNode,
  isReachable,
} from "./map";

export {
  pickEvent,
  getEventById,
  rollTreasureRewards,
  applyTreasureRewards,
} from "./events";

export type { EventDef, EventChoice } from "./events";

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
  selectReady,
  normalizeMeta,
  normalizeRun,
} from "./store";

export {
  EXAM_Q_COUNT,
  EXAM_DURATION_MS,
  EXAM_PASS_SCORE,
  sampleExamQuestions,
  canStartExam,
  createExamSession,
  formatMmSs,
  examRemainingMs,
  countAnswered,
  scoreExam,
  listWrongQuestions,
  sampleWrongPool,
} from "./exam";

export type { ExamPhase, ExamSession, ExamResultItem } from "./exam";

export type {
  AnswerResult,
  CaptureResult,
} from "./store";

export { ICON } from "./icon";
export { AudioEngine } from "./audio";
export { BattleFX } from "./fx3d";
export { spawnDmg, spawnFxText, domBurst } from "./dom-fx";
