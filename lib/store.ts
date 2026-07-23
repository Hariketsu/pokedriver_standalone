"use client";

import { create } from "zustand";
import { GAME_CONST } from "@/data";
import {
  applyEnemyHit,
  applyPlayerAttack,
  applyPlayerHit,
  applyWinBattle,
  catchLevelForFloor,
  createBattleState,
  enemyForNode,
  findAliveIndex,
  pickQuestion,
  previewEnemyAttack,
  questionTimeTotal,
  recordCorrectAnswer,
  recordWrongAnswer,
  tryCapture,
  usePotion,
} from "./battle";
import {
  calcScore,
  grantXpTo,
  newInstance,
  PKMN_BY_ID,
  pokeMaxHp,
} from "./formulas";
import { genMap, isReachable } from "./map";
import { applyShopItem, rollShopStock, shopPrice } from "./shop";
import type {
  BallType,
  BattleState,
  Difficulty,
  GameOverInfo,
  MapNode,
  MetaState,
  ModalState,
  RestOptionId,
  RunState,
  ScreenId,
  Settings,
  ShopItemDef,
  ShopItemId,
  StarterDef,
  ToastState,
} from "./types";

export const META_KEY = "pd_meta_v1";
export const RUN_KEY = "pd_save_v1";

export const STARTERS: StarterDef[] = [
  { id: 1, desc: "草系伙伴 · 稳扎稳打，HP 均衡" },
  { id: 4, desc: "火系伙伴 · 攻击手，答题越快越强" },
  { id: 7, desc: "水系伙伴 · 坚韧可靠，适合新手" },
];

function defaultMeta(): MetaState {
  return {
    dex: {},
    bestScore: 0,
    runs: 0,
    wins: 0,
    totalCorrect: 0,
    totalAnswered: 0,
    maxComboEver: 0,
    totalCaught: 0,
    wrongQ: {},
    settings: { bgm: 0.6, sfx: 0.8, shake: true, diff: "normal" },
  };
}

function loadMetaFromStorage(): MetaState {
  if (typeof window === "undefined") return defaultMeta();
  try {
    const raw = localStorage.getItem(META_KEY);
    if (!raw) return defaultMeta();
    const m = JSON.parse(raw) as MetaState;
    return m && m.settings ? m : defaultMeta();
  } catch {
    return defaultMeta();
  }
}

function saveMetaToStorage(meta: MetaState): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(META_KEY, JSON.stringify(meta));
  } catch {
    /* ignore */
  }
}

function loadRunFromStorage(): RunState | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(RUN_KEY);
    if (!raw) return null;
    const r = JSON.parse(raw) as RunState;
    return r && r.mapRows ? r : null;
  } catch {
    return null;
  }
}

function saveRunToStorage(run: RunState | null): void {
  if (typeof window === "undefined") return;
  try {
    if (run) localStorage.setItem(RUN_KEY, JSON.stringify(run));
    else localStorage.removeItem(RUN_KEY);
  } catch {
    /* ignore */
  }
}

function cloneRun(run: RunState): RunState {
  return structuredClone(run);
}

function cloneMeta(meta: MetaState): MetaState {
  return structuredClone(meta);
}

function cloneBattle(battle: BattleState): BattleState {
  return structuredClone(battle);
}

export type AnswerResult =
  | {
      id: number;
      correct: true;
      fast: boolean;
      dmg: number;
      crit: boolean;
      goldGain: number;
      enemyDefeated: boolean;
    }
  | {
      id: number;
      correct: false;
      timedOut: boolean;
      revealAns: number;
    };

/** 单调递增 id，供 UI 在 React Strict Mode 下对 lastAnswer 做去重 */
let answerEventSeq = 0;

export type CaptureResult = {
  success: boolean;
  depleted: boolean;
  needsTeamSlot: boolean;
  catchId: number;
  lv: number;
};

type GameStore = {
  meta: MetaState;
  run: RunState | null;
  battle: BattleState | null;
  screen: ScreenId;
  prevScreen: ScreenId | null;
  toast: ToastState;
  modal: ModalState;
  shopStock: ShopItemDef[];
  gameOver: GameOverInfo | null;
  /** Last battle event payload for UI FX (ephemeral). */
  lastAnswer: AnswerResult | null;
  lastCapture: CaptureResult | null;
  hydrated: boolean;

  /* ---- persistence ---- */
  hydrate: () => void;
  loadMeta: () => void;
  saveMeta: () => void;
  loadRun: () => RunState | null;
  saveRun: () => void;

  /* ---- UI shell ---- */
  setScreen: (id: ScreenId) => void;
  showToast: (message: string, ms?: number) => void;
  clearToast: () => void;
  openModal: (modal: ModalState) => void;
  closeModal: () => void;

  /* ---- meta / settings ---- */
  markSeen: (id: number, caught: boolean) => void;
  updateSettings: (partial: Partial<Settings>) => void;
  wipeAll: () => void;

  /* ---- run lifecycle ---- */
  newRun: (starterId: number) => void;
  continueRun: () => boolean;
  quitToTitle: () => void;
  hasSave: () => boolean;

  /* ---- map ---- */
  moveTo: (f: number, i: number) => void;

  /* ---- shop / rest ---- */
  openShop: () => void;
  leaveShop: () => void;
  buyShopItem: (index: number) => boolean;
  openRest: () => void;
  applyRestOption: (id: RestOptionId) => void;

  /* ---- battle ---- */
  startBattle: (node: MapNode) => void;
  nextQuestion: () => void;
  tickTimer: (dt: number) => void;
  answer: (idx: number) => AnswerResult | null;
  /** 玩家攻击命中帧：扣敌 HP；若击杀则结算胜利奖励 */
  commitPlayerHit: (dmg: number) => {
    enemyDefeated: boolean;
    goldWin: number;
    leveled: number;
  } | null;
  /** 敌方攻击出手前：只读伤害预览 */
  previewEnemyDmg: () => number | null;
  /** 敌方攻击命中帧：扣我方 HP */
  commitEnemyHit: () => { dmg: number; fainted: boolean; wiped: boolean } | null;
  resolveEnemyAttack: () => { dmg: number; fainted: boolean; wiped: boolean } | null;
  resolvePlayerFaint: () => { wiped: boolean; nextId?: number } | null;
  trySwitch: (i: number) => boolean;
  useBattlePotion: () => boolean;
  openCapture: () => void;
  doCapture: (ball: BallType) => CaptureResult | null;
  skipCapture: () => void;
  addToTeam: (id: number, lv: number) => void;
  replaceTeamMember: (slot: number, id: number, lv: number) => void;
  releaseCatch: (id: number) => void;
  endBattle: () => void;
  gameOverRun: (win: boolean) => void;
};

export const useGameStore = create<GameStore>((set, get) => ({
  meta: defaultMeta(),
  run: null,
  battle: null,
  screen: "title",
  prevScreen: null,
  toast: null,
  modal: null,
  shopStock: [],
  gameOver: null,
  lastAnswer: null,
  lastCapture: null,
  hydrated: false,

  hydrate: () => {
    if (get().hydrated) return;
    const meta = loadMetaFromStorage();
    set({ meta, hydrated: true });
  },

  loadMeta: () => {
    set({ meta: loadMetaFromStorage() });
  },

  saveMeta: () => {
    saveMetaToStorage(get().meta);
  },

  loadRun: () => loadRunFromStorage(),

  saveRun: () => {
    saveRunToStorage(get().run);
  },

  setScreen: (id) => {
    set((s) => ({ prevScreen: s.screen, screen: id }));
  },

  showToast: (message, ms = 1800) => {
    set({ toast: { message, ms, id: Date.now() } });
  },

  clearToast: () => set({ toast: null }),

  openModal: (modal) => set({ modal }),

  closeModal: () => set({ modal: null }),

  markSeen: (id, caught) => {
    const meta = cloneMeta(get().meta);
    const key = String(id);
    const d = meta.dex[key] || (meta.dex[key] = { seen: 0, caught: 0 });
    d.seen++;
    if (caught) {
      d.caught++;
      meta.totalCaught++;
    }
    set({ meta });
    saveMetaToStorage(meta);
  },

  updateSettings: (partial) => {
    const meta = cloneMeta(get().meta);
    meta.settings = { ...meta.settings, ...partial };
    set({ meta });
    saveMetaToStorage(meta);
  },

  wipeAll: () => {
    if (typeof window !== "undefined") {
      localStorage.removeItem(META_KEY);
      localStorage.removeItem(RUN_KEY);
    }
    const meta = defaultMeta();
    // 与 ref 一致：清除后不强制跳转标题（用户仍在设置页）
    set({
      meta,
      run: null,
      battle: null,
      modal: null,
      shopStock: [],
      gameOver: null,
    });
    saveMetaToStorage(meta);
  },

  newRun: (starterId) => {
    const meta = cloneMeta(get().meta);
    meta.runs++;

    const run: RunState = {
      mapRows: genMap(),
      pos: { f: -1, i: -1 },
      gold: 60,
      goldEarned: 0,
      balls: 5,
      superBalls: 1,
      potions: 1,
      bigPotions: 0,
      teamPotions: 0,
      revives: 0,
      atkBonus: 0,
      hpBonus: 0,
      team: [newInstance(starterId, 1, 0)],
      activeIdx: 0,
      usedQ: {},
      combo: 0,
      maxCombo: 0,
      captures: 0,
      bossKills: 0,
      floorsCleared: 0,
      answered: 0,
      correct: 0,
      startTime: Date.now(),
    };

    // markSeen starter
    const key = String(starterId);
    const d = meta.dex[key] || (meta.dex[key] = { seen: 0, caught: 0 });
    d.seen++;
    d.caught++;
    meta.totalCaught++;

    set({
      meta,
      run,
      battle: null,
      screen: "map",
      prevScreen: get().screen,
      gameOver: null,
      modal: null,
      shopStock: [],
    });
    saveMetaToStorage(meta);
    saveRunToStorage(run);

    const name = PKMN_BY_ID[starterId]?.c ?? "宝可梦";
    get().showToast(`${name} 加入了队伍！冒险开始`);
  },

  continueRun: () => {
    const save = loadRunFromStorage();
    if (!save) return false;
    set({
      run: save,
      battle: null,
      screen: "map",
      prevScreen: get().screen,
      gameOver: null,
      modal: null,
    });
    return true;
  },

  quitToTitle: () => {
    saveRunToStorage(get().run);
    set({
      screen: "title",
      prevScreen: get().screen,
      battle: null,
      modal: null,
    });
    get().showToast("进度已保存");
  },

  hasSave: () => !!loadRunFromStorage(),

  moveTo: (f, i) => {
    const run0 = get().run;
    if (!run0) return;
    if (!isReachable(run0, f, i)) return;

    const run = cloneRun(run0);
    const node = run.mapRows[f]![i]!;
    run.pos = { f, i };
    node.done = true;
    run.floorsCleared = f + 1;
    set({ run });
    saveRunToStorage(run);

    if (node.type === "shop") {
      get().openShop();
    } else if (node.type === "rest") {
      get().openRest();
    } else {
      get().startBattle(node);
    }
  },

  openShop: () => {
    if (!get().run) return;
    const stock = rollShopStock();
    set({
      shopStock: stock,
      screen: "shop",
      prevScreen: get().screen,
    });
  },

  leaveShop: () => {
    set({
      screen: "map",
      prevScreen: get().screen,
      shopStock: [],
    });
  },

  buyShopItem: (index) => {
    const run0 = get().run;
    if (!run0) return false;
    const stock = get().shopStock.slice();
    const item = stock[index];
    if (!item) return false;

    const floor = run0.pos.f + 1;
    const price = shopPrice(item.price, floor);
    if (run0.gold < price) return false;
    if (!item.can(run0)) return false;

    const run = cloneRun(run0);
    run.gold -= price;
    applyShopItem(run, item.id);
    stock.splice(index, 1);

    set({ run, shopStock: stock });
    saveRunToStorage(run);
    get().showToast(`购买了 ${item.name}`);
    return true;
  },

  openRest: () => {
    if (!get().run) return;
    set({ screen: "rest", prevScreen: get().screen });
  },

  applyRestOption: (id) => {
    const run0 = get().run;
    if (!run0) return;
    const run = cloneRun(run0);
    const meta = cloneMeta(get().meta);
    let toastMsg = "";

    if (id === "campfire") {
      run.team.forEach((p) => {
        if (p.hp > 0) {
          const max = pokeMaxHp(p, run.hpBonus);
          p.hp = Math.min(max, p.hp + Math.ceil(max * 0.4));
        }
      });
      toastMsg = "全队恢复了体力";
    } else if (id === "train") {
      const a = run.team[run.activeIdx]!;
      const leveled = grantXpTo(a, 20, run.hpBonus);
      const name = PKMN_BY_ID[a.id]?.c ?? "";
      toastMsg = leveled
        ? `${name} 升到了 Lv.${a.lv}！`
        : "经验值提升了";
    } else if (id === "meditate") {
      const keys = Object.keys(meta.wrongQ);
      for (let i = 0; i < 3 && keys.length; i++) {
        const k = keys.splice(Math.floor(Math.random() * keys.length), 1)[0]!;
        delete meta.wrongQ[k];
      }
      toastMsg = "错题本清爽了一些";
      set({ meta });
      saveMetaToStorage(meta);
    }

    set({ run });
    saveRunToStorage(run);
    if (toastMsg) get().showToast(toastMsg);
    // UI navigates back to map after a short delay (matches original)
  },

  startBattle: (node) => {
    const run0 = get().run;
    if (!run0) return;
    // node may be a reference from cloned run — re-resolve from current run
    const run = cloneRun(run0);
    const liveNode =
      run.mapRows[run.pos.f]?.[run.pos.i] ?? structuredClone(node);
    const enemy = enemyForNode(run, liveNode);
    const battle = createBattleState(liveNode, enemy);

    // markSeen enemy (seen only)
    const meta = cloneMeta(get().meta);
    const key = String(enemy.id);
    const d = meta.dex[key] || (meta.dex[key] = { seen: 0, caught: 0 });
    d.seen++;

    set({
      run,
      meta,
      battle,
      screen: "battle",
      prevScreen: get().screen,
      lastAnswer: null,
      lastCapture: null,
      modal: null,
    });
    saveMetaToStorage(meta);
    saveRunToStorage(run);

    // 与原版 battle.js 一致：仅在 store 内延迟出第一题（UI 不做第二份调度）。
    // setTimeout 不受 React Strict Mode effect cleanup 影响。
    const delay = enemy.isBoss ? 1200 : 800;
    const token = `${run.pos.f}-${run.pos.i}-${enemy.id}-${enemy.maxHp}`;
    setTimeout(() => {
      const b = get().battle;
      const r = get().run;
      if (!b || !r || b.phase !== "intro") return;
      const key = `${r.pos.f}-${r.pos.i}-${b.enemy.id}-${b.enemy.maxHp}`;
      if (key !== token) return;
      get().nextQuestion();
    }, delay);
  },

  nextQuestion: () => {
    const battle0 = get().battle;
    const run0 = get().run;
    if (!battle0 || !run0) return;
    // won：战斗已结束。intro/anim/question 均可进入下一题（原版无 phase 门闩）
    if (battle0.phase === "won") return;

    const run = cloneRun(run0);
    const battle = cloneBattle(battle0);
    const q = pickQuestion(run);
    battle.phase = "question";
    battle.locked = false;
    battle.switchUsed = false;
    battle.q = q;
    battle.timeTotal = questionTimeTotal(get().meta.settings.diff);
    battle.timeLeft = battle.timeTotal;

    set({ run, battle, lastAnswer: null });
    saveRunToStorage(run);
  },

  tickTimer: (dt) => {
    const battle0 = get().battle;
    if (!battle0 || battle0.locked || battle0.phase !== "question") return;
    const battle = cloneBattle(battle0);
    battle.timeLeft -= dt;
    if (battle.timeLeft <= 0) {
      battle.timeLeft = 0;
      set({ battle });
      get().answer(-1);
      return;
    }
    set({ battle });
  },

  answer: (idx) => {
    const battle0 = get().battle;
    const run0 = get().run;
    if (!battle0 || !run0 || battle0.locked || !battle0.q) return null;

    const run = cloneRun(run0);
    const battle = cloneBattle(battle0);
    const meta = cloneMeta(get().meta);
    const q = battle.q!;
    const correct = idx === q.ans;

    battle.locked = true;
    battle.phase = "anim";

    let result: AnswerResult;

    const eventId = ++answerEventSeq;
    if (correct) {
      recordCorrectAnswer(run, meta, q);
      const fast = battle.timeLeft / battle.timeTotal > 0.66;
      // 只结算答题金币 + 计算伤害；HP / 胜利奖励在 commitPlayerHit
      const atk = applyPlayerAttack(run, battle, fast);
      result = {
        id: eventId,
        correct: true,
        fast,
        dmg: atk.dmg,
        crit: atk.crit,
        goldGain: atk.goldGain,
        enemyDefeated: atk.enemyDefeated,
      };
    } else {
      recordWrongAnswer(run, meta, q);
      result = {
        id: eventId,
        correct: false,
        timedOut: idx === -1,
        revealAns: q.ans,
      };
    }

    set({ run, battle, meta, lastAnswer: result });
    saveMetaToStorage(meta);
    saveRunToStorage(run);
    return result;
  },

  commitPlayerHit: (dmg) => {
    const battle0 = get().battle;
    const run0 = get().run;
    if (!battle0 || !run0 || battle0.phase === "won") return null;

    const run = cloneRun(run0);
    const battle = cloneBattle(battle0);
    const enemyDefeated = applyPlayerHit(battle, dmg);
    let goldWin = 0;
    let leveled = 0;
    if (enemyDefeated) {
      const rewards = applyWinBattle(run, battle);
      goldWin = rewards.goldWin;
      leveled = rewards.leveled;
    }
    set({ run, battle });
    saveRunToStorage(run);
    return { enemyDefeated, goldWin, leveled };
  },

  previewEnemyDmg: () => {
    const battle0 = get().battle;
    if (!battle0) return null;
    return previewEnemyAttack(battle0);
  },

  commitEnemyHit: () => {
    const battle0 = get().battle;
    const run0 = get().run;
    if (!battle0 || !run0) return null;

    const run = cloneRun(run0);
    const battle = cloneBattle(battle0);
    const { dmg, fainted } = applyEnemyHit(run, battle);
    const wiped = fainted && findAliveIndex(run.team) === -1;

    set({ run, battle });
    saveRunToStorage(run);
    return { dmg, fainted, wiped };
  },

  /** 兼容旧调用：立即扣血（等同 commitEnemyHit） */
  resolveEnemyAttack: () => {
    return get().commitEnemyHit();
  },

  resolvePlayerFaint: () => {
    const run0 = get().run;
    if (!run0) return null;
    const run = cloneRun(run0);
    const alive = findAliveIndex(run.team);
    if (alive === -1) {
      set({ run });
      get().gameOverRun(false);
      return { wiped: true };
    }
    run.activeIdx = alive;
    set({ run });
    saveRunToStorage(run);
    return { wiped: false, nextId: run.team[alive]!.id };
  },

  trySwitch: (i) => {
    const battle0 = get().battle;
    const run0 = get().run;
    if (!battle0 || !run0) return false;
    if (battle0.phase !== "question" && battle0.phase !== "anim") return false;
    if (i === run0.activeIdx || run0.team[i]!.hp <= 0) return false;
    if (battle0.switchUsed && battle0.phase === "question") {
      get().showToast("本题作答前只能换一次");
      return false;
    }

    const run = cloneRun(run0);
    const battle = cloneBattle(battle0);
    run.activeIdx = i;
    battle.switchUsed = true;
    set({ run, battle });
    saveRunToStorage(run);
    return true;
  },

  useBattlePotion: () => {
    const battle0 = get().battle;
    const run0 = get().run;
    if (!battle0 || !run0 || battle0.phase === "won") return false;
    const run = cloneRun(run0);
    const res = usePotion(run);
    if (!res.ok) {
      if (res.reason === "full_hp") get().showToast("HP 已满");
      return false;
    }
    set({ run });
    saveRunToStorage(run);
    return true;
  },

  openCapture: () => {
    set({ modal: { kind: "capture" } });
  },

  doCapture: (ball) => {
    const battle0 = get().battle;
    const run0 = get().run;
    if (!battle0 || !run0) return null;

    const run = cloneRun(run0);
    const battle = cloneBattle(battle0);
    const attempt = tryCapture(run, battle, ball);
    if (attempt.depleted) return null;

    const catchId = battle.enemy.id;
    const lv = catchLevelForFloor(run.pos.f + 1);

    if (attempt.ok) {
      // markSeen caught
      const meta = cloneMeta(get().meta);
      const key = String(catchId);
      const d = meta.dex[key] || (meta.dex[key] = { seen: 0, caught: 0 });
      d.seen++;
      d.caught++;
      meta.totalCaught++;
      run.captures++;
      battle.captured = true;

      const needsTeamSlot = run.team.length >= GAME_CONST.MAX_TEAM;
      const result: CaptureResult = {
        success: true,
        depleted: false,
        needsTeamSlot,
        catchId,
        lv,
      };

      // UI opens teamFull / addToTeam after capture FX
      set({ run, battle, meta, lastCapture: result, modal: null });
      saveMetaToStorage(meta);
      saveRunToStorage(run);
      return result;
    }

    const result: CaptureResult = {
      success: false,
      depleted: false,
      needsTeamSlot: false,
      catchId,
      lv,
    };
    set({ run, battle, lastCapture: result, modal: null });
    saveRunToStorage(run);
    return result;
  },

  skipCapture: () => {
    set({ modal: null });
    get().endBattle();
  },

  addToTeam: (id, lv) => {
    const run0 = get().run;
    if (!run0) return;
    if (run0.team.length >= GAME_CONST.MAX_TEAM) {
      set({ modal: { kind: "teamFull", catchId: id, lv } });
      return;
    }
    const run = cloneRun(run0);
    run.team.push(newInstance(id, lv, run.hpBonus));
    set({ run, modal: null });
    saveRunToStorage(run);
    get().endBattle();
  },

  replaceTeamMember: (slot, id, lv) => {
    const run0 = get().run;
    if (!run0) return;
    const run = cloneRun(run0);
    const old = PKMN_BY_ID[run.team[slot]!.id];
    const ep = PKMN_BY_ID[id];
    run.team[slot] = newInstance(id, lv, run.hpBonus);
    set({ run, modal: null });
    saveRunToStorage(run);
    get().showToast(
      `${old?.c ?? "宝可梦"} 离队，${ep?.c ?? "宝可梦"} 加入！`,
    );
    get().endBattle();
  },

  releaseCatch: (id) => {
    const run0 = get().run;
    if (!run0) return;
    const run = cloneRun(run0);
    run.gold += 40;
    run.goldEarned += 40;
    const ep = PKMN_BY_ID[id];
    set({ run, modal: null });
    saveRunToStorage(run);
    get().showToast(`放生了 ${ep?.c ?? "宝可梦"}，获得 40 金币`);
    get().endBattle();
  },

  endBattle: () => {
    const battle = get().battle;
    const node = battle?.node ?? null;
    set({ battle: null, modal: null, lastAnswer: null, lastCapture: null });
    saveRunToStorage(get().run);

    if (node && node.type === "boss") {
      get().gameOverRun(true);
      return;
    }
    set({ screen: "map", prevScreen: "battle" });
  },

  gameOverRun: (win) => {
    const run = get().run;
    if (!run) return;
    const score = calcScore(run);
    const meta = cloneMeta(get().meta);
    const isRecord = score > meta.bestScore;
    if (isRecord) meta.bestScore = score;
    if (win) meta.wins++;
    saveMetaToStorage(meta);

    const minutes = Math.max(
      1,
      Math.round((Date.now() - run.startTime) / 60000),
    );
    const info: GameOverInfo = {
      win,
      score,
      isRecord,
      floorsCleared: run.floorsCleared,
      goldEarned: run.goldEarned,
      correct: run.correct,
      answered: run.answered,
      maxCombo: run.maxCombo,
      captures: run.captures,
      minutes,
    };

    set({
      meta,
      run: null,
      battle: null,
      gameOver: info,
      screen: "over",
      prevScreen: get().screen,
      modal: null,
    });
    saveRunToStorage(null);
  },
}));

/** Selectors / helpers for UI */
export function selectScore(s: { run: RunState | null }): number {
  return calcScore(s.run);
}

export function selectActive(s: { run: RunState | null }) {
  if (!s.run) return null;
  return s.run.team[s.run.activeIdx] ?? null;
}

export type { Difficulty, ShopItemId, RestOptionId, BallType };
