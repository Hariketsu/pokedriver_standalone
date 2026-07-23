import { GAME_CONST, POKEMON, QUESTIONS, type Pokemon } from "@/data";
import {
  baseHp,
  catchChance,
  clamp,
  critChance,
  grantXpTo,
  pick,
  PKMN_BY_ID,
  pokeAtk,
  pokeMaxHp,
  TIMER_SEC,
} from "./formulas";
import type {
  BallType,
  BattleState,
  EnemyState,
  MapNode,
  MetaState,
  Question,
  RunState,
  TeamMember,
} from "./types";

export function enemyForNode(run: RunState, node: MapNode): EnemyState {
  const floor = run.pos.f + 1;
  const t = node.type;
  let pool: number[];
  let isBoss = false;
  let name = "";

  if (t === "boss") {
    pool = GAME_CONST.TIER1_LEGEND.concat(GAME_CONST.MYTHICAL);
    isBoss = true;
    name = "最终BOSS";
  } else if (t === "boss2") {
    pool = [...GAME_CONST.TIER2_LEGEND];
    isBoss = true;
    name = "地牢守卫";
  } else if (t === "elite") {
    pool = POKEMON.filter(
      (p) => p.r === "r" || (p.r === "u" && p.id % 3 === 0),
    ).map((p) => p.id);
  } else {
    const deep = clamp((floor - 1) / 14, 0, 1);
    const roll = Math.random();
    let rarity: Pokemon["r"] = "c";
    if (roll < deep * 0.28) rarity = "r";
    else if (roll < deep * 0.28 + 0.18 + deep * 0.2) rarity = "u";
    pool = POKEMON.filter((p) => p.r === rarity).map((p) => p.id);
  }

  if (pool.length === 0) {
    pool = POKEMON.map((p) => p.id);
  }

  const id = pick(pool);
  const p = PKMN_BY_ID[id]!;
  const bhp = baseHp(p);
  let hp = bhp + Math.round(floor * 0.7);
  if (t === "elite") hp = Math.round(hp * 1.7);
  if (t === "boss2") hp = Math.round(hp * 2.1) + 6;
  if (t === "boss") hp = Math.round(hp * 2.5) + 10;

  let atk = 1 + Math.floor(floor / 4);
  if (t === "elite") atk += 1;
  if (t === "boss2") atk += 1;
  if (t === "boss") atk += 2;

  return { id, hp, maxHp: hp, atk, isBoss, nodeType: t, title: name };
}

export function createBattleState(node: MapNode, enemy: EnemyState): BattleState {
  return {
    node,
    enemy,
    phase: "intro",
    q: null,
    timeLeft: 0,
    timeTotal: 0,
    locked: true,
    captured: false,
    switchUsed: false,
  };
}

export function pickQuestion(run: RunState): Question {
  let q: Question;
  let guard = 0;
  do {
    q = pick(QUESTIONS);
    guard++;
  } while (run.usedQ[q.id] && guard < 60);
  run.usedQ[q.id] = 1;
  return q;
}

export function questionTimeTotal(diff: string): number {
  return TIMER_SEC[diff] || 20;
}

export type PlayerAttackResult = {
  dmg: number;
  crit: boolean;
  goldGain: number;
  /** 预测是否击杀（尚未扣血） */
  enemyDefeated: boolean;
};

/**
 * 计算玩家攻击并立即发放答题金币（与原版 playerAttack 一致：金币在出手时结算，
 * HP 在命中帧再扣）。不修改 enemy.hp / 不发 XP。
 */
export function applyPlayerAttack(
  run: RunState,
  battle: BattleState,
  fast: boolean,
): PlayerAttackResult {
  const active = run.team[run.activeIdx]!;
  let dmg =
    pokeAtk(active, run.atkBonus) +
    Math.floor(run.combo / 4) +
    (fast ? 1 : 0);
  const crit = Math.random() < critChance(active);
  if (crit) dmg = Math.round(dmg * 1.6);

  const goldGain = 2 + Math.floor(run.combo / 2) + (fast ? 1 : 0);
  run.gold += goldGain;
  run.goldEarned += goldGain;

  return {
    dmg,
    crit,
    goldGain,
    enemyDefeated: battle.enemy.hp - dmg <= 0,
  };
}

/** 命中帧扣敌方 HP。返回是否击杀。 */
export function applyPlayerHit(battle: BattleState, dmg: number): boolean {
  battle.enemy.hp -= dmg;
  return battle.enemy.hp <= 0;
}

export type EnemyAttackResult = {
  dmg: number;
  fainted: boolean;
};

/** 仅计算敌方攻击伤害，不改 HP（命中帧再 applyEnemyHit）。 */
export function previewEnemyAttack(battle: BattleState): number {
  return battle.enemy.atk;
}

/** 命中帧扣我方 HP。 */
export function applyEnemyHit(
  run: RunState,
  battle: BattleState,
): EnemyAttackResult {
  const active = run.team[run.activeIdx]!;
  const dmg = battle.enemy.atk;
  active.hp -= dmg;
  return { dmg, fainted: active.hp <= 0 };
}

/** @deprecated 使用 previewEnemyAttack + applyEnemyHit */
export function applyEnemyAttack(
  run: RunState,
  battle: BattleState,
): EnemyAttackResult {
  return applyEnemyHit(run, battle);
}

export function findAliveIndex(team: TeamMember[]): number {
  return team.findIndex((p) => p.hp > 0);
}

export type WinBattleRewards = {
  goldWin: number;
  xpGain: number;
  leveled: number;
};

/** Apply win gold/boss kill + XP to active. Mutates run/battle. */
export function applyWinBattle(
  run: RunState,
  battle: BattleState,
): WinBattleRewards {
  const e = battle.enemy;
  battle.phase = "won";

  const goldWin =
    10 +
    (run.pos.f + 1) * 2 +
    (e.nodeType === "elite" ? 20 : 0) +
    (e.isBoss ? 60 : 0);
  run.gold += goldWin;
  run.goldEarned += goldWin;
  if (e.isBoss) run.bossKills++;

  const xpGain =
    6 +
    (run.pos.f + 1) * 2 +
    (e.nodeType === "elite" ? 10 : 0) +
    (e.nodeType === "boss2" ? 20 : 0) +
    (e.nodeType === "boss" ? 34 : 0);

  const active = run.team[run.activeIdx]!;
  const leveled = grantXpTo(active, xpGain, run.hpBonus);

  return { goldWin, xpGain, leveled };
}

export function tryCapture(
  run: RunState,
  battle: BattleState,
  ball: BallType,
): { ok: boolean; depleted: boolean } {
  if (ball === "normal") {
    if (run.balls <= 0) return { ok: false, depleted: true };
    run.balls--;
  } else {
    if (run.superBalls <= 0) return { ok: false, depleted: true };
    run.superBalls--;
  }
  const ep = PKMN_BY_ID[battle.enemy.id];
  if (!ep) return { ok: false, depleted: false };
  const success = Math.random() < catchChance(ep.r, ball);
  return { ok: success, depleted: false };
}

export function catchLevelForFloor(floor: number): number {
  return clamp(1 + Math.floor(floor / 4), 1, GAME_CONST.MAX_LEVEL);
}

export function usePotion(run: RunState): {
  ok: boolean;
  reason?: "no_potion" | "full_hp" | "no_active";
} {
  if (run.potions <= 0) return { ok: false, reason: "no_potion" };
  const active = run.team[run.activeIdx];
  if (!active) return { ok: false, reason: "no_active" };
  const max = pokeMaxHp(active, run.hpBonus);
  if (active.hp >= max) return { ok: false, reason: "full_hp" };
  run.potions--;
  active.hp = Math.min(max, active.hp + Math.ceil(max / 2));
  return { ok: true };
}

/** Correct-answer bookkeeping on meta/run. Mutates both. */
export function recordCorrectAnswer(
  run: RunState,
  meta: MetaState,
  q: Question,
): void {
  run.answered++;
  meta.totalAnswered++;
  run.correct++;
  meta.totalCorrect++;
  if (meta.wrongQ[q.id]) delete meta.wrongQ[q.id];
  run.combo++;
  run.maxCombo = Math.max(run.maxCombo, run.combo);
  meta.maxComboEver = Math.max(meta.maxComboEver, run.combo);
}

/** Wrong/timeout bookkeeping. Mutates both. */
export function recordWrongAnswer(
  run: RunState,
  meta: MetaState,
  q: Question,
): void {
  run.answered++;
  meta.totalAnswered++;
  run.combo = 0;
  meta.wrongQ[q.id] = 1;
}
