import {
  GAME_RULES,
  GAME_CONST,
  POKEMON,
  type Pokemon,
  type Rarity,
} from "@/data";
import type { BallType, RunState, TeamMember } from "./types";

export const RARITY_LABEL = GAME_RULES.rarity_labels;
export const RARITY_CSS: Record<Rarity, string> = {
  c: "tag-c",
  u: "tag-u",
  r: "tag-r",
  l: "tag-l",
};

export const TIMER_SEC: Record<string, number> = {
  easy: 30,
  normal: 20,
  hard: 12,
};

export const CATCH_BASE: Record<Rarity, number> = {
  c: 0.9,
  u: 0.7,
  r: 0.45,
  l: 0.22,
};

export const PKMN_BY_ID: Record<number, Pokemon> = {};
for (const p of POKEMON) {
  PKMN_BY_ID[p.id] = p;
}

export function rand(a: number, b: number): number {
  return a + Math.floor(Math.random() * (b - a + 1));
}

export function pick<T>(arr: readonly T[]): T {
  return arr[Math.floor(Math.random() * arr.length)]!;
}

export function clamp(v: number, a: number, b: number): number {
  return Math.max(a, Math.min(b, v));
}

/** baseHp: 2 + (id%5)*mult, max 12 */
export function baseHp(p: Pokemon): number {
  return Math.min(
    12,
    Math.round(2 + (p.id % 5) * GAME_RULES.rarity_hp_mult[p.r]),
  );
}

export function pokeMaxHp(inst: TeamMember, hpBonus = 0): number {
  const p = PKMN_BY_ID[inst.id];
  if (!p) return 1;
  return baseHp(p) + (inst.lv - 1) * 2 + (hpBonus || 0);
}

export function pokeAtk(inst: TeamMember, atkBonus = 0): number {
  return 2 + Math.floor((inst.lv - 1) / 3) + (atkBonus || 0);
}

export function pokeSpeed(p: Pokemon): number {
  return Math.round((16 + (p.id % 10)) * GAME_RULES.rarity_speed_mult[p.r]);
}

export function critChance(inst: TeamMember): number {
  const p = PKMN_BY_ID[inst.id];
  if (!p) return 0;
  return clamp((pokeSpeed(p) - 16) / 60, 0, 0.25);
}

export function xpNeed(lv: number): number {
  return lv * 12;
}

export function newInstance(
  id: number,
  lv = 1,
  hpBonus = 0,
): TeamMember {
  const inst: TeamMember = { id, lv: lv || 1, xp: 0, hp: 0 };
  inst.hp = pokeMaxHp(inst, hpBonus);
  return inst;
}

export function calcScore(run: RunState | null | undefined): number {
  if (!run) return 0;
  return (
    run.goldEarned +
    run.floorsCleared * 50 +
    run.captures * 40 +
    run.maxCombo * 15 +
    run.bossKills * 250
  );
}

export const BALL_MULT: Record<BallType, number> = {
  normal: 1.0,
  great: 1.6,
  ultra: 2.2,
  master: Infinity,
};

export function catchChance(rarity: Rarity, ball: BallType): number {
  if (ball === "master") return 1;
  return clamp(CATCH_BASE[rarity] * BALL_MULT[ball], 0, 0.98);
}

/** Cost to buy next meta train level (0-based current lv). */
export function metaUpgradeCost(lv: number): number {
  return GAME_CONST.UPGRADE_BASE_COST + lv * GAME_CONST.UPGRADE_COST_STEP;
}

/** Apply XP to active mon; returns levels gained. Mutates inst. */
export function grantXpTo(
  inst: TeamMember,
  xp: number,
  hpBonus: number,
): number {
  inst.xp += xp;
  let leveled = 0;
  while (inst.lv < GAME_CONST.MAX_LEVEL && inst.xp >= xpNeed(inst.lv)) {
    inst.xp -= xpNeed(inst.lv);
    inst.lv++;
    leveled++;
    inst.hp = Math.min(pokeMaxHp(inst, hpBonus), inst.hp + 2);
  }
  if (inst.lv >= GAME_CONST.MAX_LEVEL) {
    inst.xp = Math.min(inst.xp, xpNeed(inst.lv));
  }
  return leveled;
}

export { GAME_CONST, GAME_RULES, POKEMON };
