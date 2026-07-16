'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { DEFAULT_POKEMON_ID, MAX_UPGRADE_LEVEL, TIER1_LEGEND, TIER2_LEGEND, MYTHICAL_PKMN } from '@/data/constants';
import { POKEMON_DATA } from '@/data/pokemon-data';
import type { Question } from '@/data/questions-builtin';

const PKM = POKEMON_DATA.filter(p => p.i === 1);

// ============================================================
// Types
// ============================================================

export interface MonsterState {
  id: number;
  pkmId: number;
  pokeData: { id: number; n: string; c: string; r: string; i: number };
  name: string;
  maxHp: number;
  hp: number;
  color: string;
  speed: number;
  y: number;
  dead: boolean;
  reached: boolean;
}

export interface ErrorEntry {
  question: Question;
  wrongCount: number;
  correctStreak: number;
}

export interface DailyStats {
  date: string;
  totalAnswered: number;
  totalCorrect: number;
}

export interface GameState {
  // ===== Battle State =====
  hp: number;
  maxHp: number;
  score: number;
  combo: number;
  maxCombo: number;
  speedLevel: number;
  streakCorrect: number;
  totalAnswered: number;
  totalCorrect: number;
  doubleDamage: boolean;
  gameOver: boolean;
  isLoading: boolean;
  startScreenVisible: boolean;

  // ===== Economy =====
  gold: number;
  bulletLevel: number;
  hpLevel: number;

  // ===== Skills =====
  skillCharge: number;
  skillMax: number;

  // ===== Questions =====
  questions: Question[];
  allQuestions: Question[];
  errorPool: ErrorEntry[];
  questionHistory: string[];
  currentQ: Question | null;

  // ===== Monsters =====
  monsters: MonsterState[];
  monsterIdCounter: number;

  // ===== Collection =====
  pokeKills: Record<number, number>;
  unlocked: Record<number, boolean>;
  activePokemon: number;

  // ===== UI =====
  activeTab: 'battle' | 'bank' | 'pokedex';
  bankPage: number;
  bankFilter: string;
  pokeFilter: 'all' | 'unlocked';
  toastMessage: string | null;
  toastTimer: ReturnType<typeof setTimeout> | null;

  // ===== Daily =====
  dailyBase: { answered: number; correct: number };
  bestScore: number;

  // ===== Actions =====
  // Battle
  damagePlayer: (amount: number) => void;
  gameOverAction: () => void;
  restartGame: () => void;
  startGame: () => void;
  updateStats: () => void;

  // Questions
  buildQuestionQueue: () => Question | undefined;
  nextQuestion: () => void;
  handleAnswer: (index: number, onShoot: () => boolean, onCombo: (text: string) => void) => void;

  // Monsters
  addMonster: (monster: MonsterState) => void;
  removeMonster: (id: number) => void;
  clearMonsters: () => void;

  // Economy
  upgradeBullet: () => boolean;
  upgradeHP: () => boolean;
  getBulletCost: () => number;
  getHPCost: () => number;
  getMaxHPFromLevel: () => number;

  // Collection
  unlockPokemon: (id: number) => void;
  addKill: (id: number) => void;
  setActivePokemon: (id: number) => void;
  doGacha: () => { name: string; rarity: string } | null;

  // Skills
  addSkillCharge: (amount: number) => void;
  activateSkill: () => boolean;

  // UI
  setActiveTab: (tab: 'battle' | 'bank' | 'pokedex') => void;
  setBankPage: (page: number) => void;
  setPokeFilter: (filter: 'all' | 'unlocked') => void;
  showToast: (message: string) => void;

  // Data
  importQuestions: (questions: Question[]) => void;
  resetAll: () => void;

  // Daily
  loadDailyBase: () => void;
  getTodayStats: () => { totalAnswered: number; totalCorrect: number };
  saveDailyStats: () => void;

  // Score
  updateBestScore: () => void;
}

// ============================================================
// Helper functions (outside store to avoid recreation)
// ============================================================

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// ============================================================
// Store
// ============================================================

export const useGameStore = create<GameState>()(
  persist(
    (set, get) => ({
      // ===== Initial State =====
      hp: 100,
      maxHp: 100,
      score: 0,
      combo: 0,
      maxCombo: 0,
      speedLevel: 1,
      streakCorrect: 0,
      totalAnswered: 0,
      totalCorrect: 0,
      doubleDamage: false,
      gameOver: false,
      isLoading: false,
      startScreenVisible: true,

      gold: 200,
      bulletLevel: 1,
      hpLevel: 1,

      skillCharge: 0,
      skillMax: 100,

      questions: [],
      allQuestions: [],
      errorPool: [],
      questionHistory: [],
      currentQ: null,

      monsters: [],
      monsterIdCounter: 0,

      pokeKills: {},
      unlocked: { [DEFAULT_POKEMON_ID]: true },
      activePokemon: DEFAULT_POKEMON_ID,

      activeTab: 'battle',
      bankPage: 1,
      bankFilter: 'all',
      pokeFilter: 'all',
      toastMessage: null,
      toastTimer: null,

      dailyBase: { answered: 0, correct: 0 },
      bestScore: 0,

      // ===== Battle Actions =====
      damagePlayer: (amount) => {
        const s = get();
        if (s.gameOver) return;
        const newHp = Math.max(0, s.hp - amount);
        set({ hp: newHp });
        if (newHp <= 0) get().gameOverAction();
      },

      gameOverAction: () => {
        const s = get();
        if (s.gameOver) return;
        set({ gameOver: true });
        get().updateBestScore();
        get().saveDailyStats();
      },

      restartGame: () => {
        const s = get();
        get().loadDailyBase();
        set({
          gameOver: false,
          hp: s.maxHp,
          score: 0,
          combo: 0,
          maxCombo: 0,
          speedLevel: 1,
          streakCorrect: 0,
          totalAnswered: 0,
          totalCorrect: 0,
          doubleDamage: false,
          monsters: [],
          monsterIdCounter: 0,
          skillCharge: 0,
          questionHistory: [],
          currentQ: null,
          startScreenVisible: false,
        });
        get().saveDailyStats();
      },

      startGame: () => {
        set({ startScreenVisible: false });
      },

      updateStats: () => {
        // UI updates are handled by React re-renders
      },

      // ===== Question Actions =====
      buildQuestionQueue: () => {
        const s = get();
        // 40% chance to pick from error pool
        if (s.errorPool.length > 0 && Math.random() < 0.4) {
          const tw = s.errorPool.reduce((sum, e) => sum + e.wrongCount * 3, 0);
          let r = Math.random() * tw;
          for (const e of s.errorPool) {
            r -= e.wrongCount * 3;
            if (r <= 0) return e.question;
          }
        }
        const pool = s.questions.length ? s.questions : [];
        const recentIds = s.questionHistory.slice(-5);
        const candidates = pool.filter(q => !recentIds.includes(q.id));
        if (candidates.length > 0) {
          return candidates[Math.floor(Math.random() * candidates.length)];
        }
        return pool[Math.floor(Math.random() * pool.length)];
      },

      nextQuestion: () => {
        const s = get();
        if (s.gameOver) return;
        const q = get().buildQuestionQueue();
        if (!q) return;
        const newHistory = [...s.questionHistory, q.id];
        if (newHistory.length > 50) newHistory.splice(0, 15);
        set({ currentQ: q, questionHistory: newHistory });
      },

      handleAnswer: (index, onShoot, onCombo) => {
        const s = get();
        if (s.gameOver || s.isLoading) return;
        const q = s.currentQ;
        if (!q) return;

        const correct = index === q.ans;
        const newTotalAnswered = s.totalAnswered + 1;

        if (correct) {
          const newCombo = s.combo + 1;
          const newMaxCombo = Math.max(s.maxCombo, newCombo);
          const newStreakCorrect = s.streakCorrect + 1;
          const newScore = s.score + 5;
          const newGold = s.gold + 1;

          // Skill charge
          const charge = Math.min(s.skillMax, s.skillCharge + 5 + Math.min(newCombo, 25) * 2);

          // Speed level up every 10 correct
          let newSpeedLevel = s.speedLevel;
          if (newStreakCorrect % 10 === 0) newSpeedLevel++;

          const newDoubleDamage = newCombo >= 10;

          set({
            totalAnswered: newTotalAnswered,
            totalCorrect: s.totalCorrect + 1,
            combo: newCombo,
            maxCombo: newMaxCombo,
            streakCorrect: newStreakCorrect,
            score: newScore,
            gold: newGold,
            skillCharge: charge,
            speedLevel: newSpeedLevel,
            doubleDamage: newDoubleDamage,
          });

          // Combo notifications
          if (newCombo === 10) onCombo('🔥 10连击！');
          else if (newCombo === 5) onCombo('💪 5连击！');

          // Remove from error pool if present
          const newErrorPool = s.errorPool.map(e => {
            if (e.question.id === q.id) {
              const newStreak = e.correctStreak + 1;
              return newStreak >= 2 ? null : { ...e, correctStreak: newStreak };
            }
            return e;
          }).filter(Boolean) as ErrorEntry[];
          set({ errorPool: newErrorPool });

          // Shoot monster
          onShoot();
        } else {
          // Wrong answer
          set({
            totalAnswered: newTotalAnswered,
            combo: 0,
            doubleDamage: false,
            streakCorrect: 0,
          });

          // Add to error pool
          const existing = s.errorPool.find(e => e.question.id === q.id);
          if (existing) {
            set({
              errorPool: s.errorPool.map(e =>
                e.question.id === q.id
                  ? { ...e, wrongCount: e.wrongCount + 1, correctStreak: 0 }
                  : e
              ),
            });
          } else {
            set({
              errorPool: [...s.errorPool, { question: q, wrongCount: 1, correctStreak: 0 }],
            });
          }

          // Damage player
          get().damagePlayer(8 + s.speedLevel * 2);
        }

        get().saveDailyStats();
      },

      // ===== Monster Actions =====
      addMonster: (monster) => {
        set(s => ({
          monsters: [...s.monsters, monster],
          monsterIdCounter: s.monsterIdCounter + 1,
        }));
      },

      removeMonster: (id) => {
        set(s => ({
          monsters: s.monsters.filter(m => m.id !== id),
        }));
      },

      clearMonsters: () => {
        set({ monsters: [] });
      },

      // ===== Economy Actions =====
      getBulletCost: () => Math.floor(25 * get().bulletLevel),
      getHPCost: () => Math.floor(18 * get().hpLevel),
      getMaxHPFromLevel: () => 80 + get().hpLevel * 20,

      upgradeBullet: () => {
        const s = get();
        if (s.bulletLevel >= MAX_UPGRADE_LEVEL) return false;
        const cost = get().getBulletCost();
        if (s.gold < cost) return false;
        set({ gold: s.gold - cost, bulletLevel: s.bulletLevel + 1 });
        return true;
      },

      upgradeHP: () => {
        const s = get();
        if (s.hpLevel >= MAX_UPGRADE_LEVEL) return false;
        const cost = get().getHPCost();
        if (s.gold < cost) return false;
        const newHpLevel = s.hpLevel + 1;
        const newMaxHp = 80 + newHpLevel * 20;
        set({
          gold: s.gold - cost,
          hpLevel: newHpLevel,
          maxHp: newMaxHp,
          hp: Math.min(s.hp + 20, newMaxHp),
        });
        return true;
      },

      // ===== Collection Actions =====
      unlockPokemon: (id) => {
        set(s => ({ unlocked: { ...s.unlocked, [id]: true } }));
      },

      addKill: (id) => {
        set(s => ({
          pokeKills: { ...s.pokeKills, [id]: (s.pokeKills[id] || 0) + 1 },
        }));
      },

      setActivePokemon: (id) => {
        set({ activePokemon: id });
      },

      doGacha: () => {
        const s = get();
        if (s.gold < 200) return null;

        const unowned = PKM.filter(
          p => p.i === 1 && !s.unlocked[p.id] && p.id !== DEFAULT_POKEMON_ID
        );

        if (unowned.length === 0) return null;

        set({ gold: s.gold - 200 });

        const weights = unowned.map(p => {
          if (TIER1_LEGEND.has(p.id) || MYTHICAL_PKMN.has(p.id)) return 1;
          if (TIER2_LEGEND.has(p.id)) return 3;
          const w: Record<string, number> = { c: 40, u: 20, r: 8, l: 3 };
          return w[p.r] || 10;
        });

        const totalW = weights.reduce((a: number, b: number) => a + b, 0);
        let rv = Math.random() * totalW;
        let chosen = unowned[0];
        for (let i = 0; i < unowned.length; i++) {
          rv -= weights[i];
          if (rv <= 0) { chosen = unowned[i]; break; }
        }

        set(s2 => ({ unlocked: { ...s2.unlocked, [chosen.id]: true } }));

        const rarityMap: Record<string, string> = { c: '普通', u: '稀有', r: '珍贵', l: '传说' };
        return { name: chosen.c, rarity: rarityMap[chosen.r] || '普通' };
      },

      // ===== Skill Actions =====
      addSkillCharge: (amount) => {
        set(s => ({ skillCharge: Math.min(s.skillMax, s.skillCharge + amount) }));
      },

      activateSkill: () => {
        const s = get();
        if (s.skillCharge < s.skillMax) return false;
        set({ skillCharge: 0, score: s.score + 10, monsters: [] });
        return true;
      },

      // ===== UI Actions =====
      setActiveTab: (tab) => set({ activeTab: tab }),
      setBankPage: (page) => set({ bankPage: page }),
      setPokeFilter: (filter) => set({ pokeFilter: filter }),

      showToast: (message) => {
        const s = get();
        if (s.toastTimer) clearTimeout(s.toastTimer);
        const timer = setTimeout(() => set({ toastMessage: null }), 1600);
        set({ toastMessage: message, toastTimer: timer });
      },

      // ===== Data Actions =====
      importQuestions: (questions) => {
        const shuffled = shuffle(questions);
        set({
          allQuestions: questions,
          questions: shuffled,
          errorPool: [],
          questionHistory: [],
          bankPage: 1,
          hp: get().maxHp,
          score: 0,
          combo: 0,
          maxCombo: 0,
          speedLevel: 1,
          streakCorrect: 0,
          totalAnswered: 0,
          totalCorrect: 0,
          gameOver: false,
          monsters: [],
        });
      },

      resetAll: () => {
        set({
          gold: 200,
          bulletLevel: 1,
          hpLevel: 1,
          hp: 100,
          maxHp: 100,
          score: 0,
          combo: 0,
          maxCombo: 0,
          speedLevel: 1,
          streakCorrect: 0,
          totalAnswered: 0,
          totalCorrect: 0,
          doubleDamage: false,
          gameOver: false,
          skillCharge: 0,
          pokeKills: {},
          unlocked: { [DEFAULT_POKEMON_ID]: true },
          activePokemon: DEFAULT_POKEMON_ID,
          errorPool: [],
          questionHistory: [],
          monsters: [],
          bestScore: 0,
          allQuestions: [],
          questions: [],
          dailyBase: { answered: 0, correct: 0 },
        });
      },

      // ===== Daily Stats =====
      loadDailyBase: () => {
        try {
          const raw = localStorage.getItem('drivingDefenseStats');
          if (raw) {
            const s = JSON.parse(raw);
            const today = new Date().toISOString().slice(0, 10);
            if (s.date === today) {
              set({ dailyBase: { answered: s.totalAnswered || 0, correct: s.totalCorrect || 0 } });
              return;
            }
          }
        } catch { /* ignore */ }
        set({ dailyBase: { answered: 0, correct: 0 } });
      },

      getTodayStats: () => {
        const s = get();
        return {
          totalAnswered: s.dailyBase.answered + s.totalAnswered,
          totalCorrect: s.dailyBase.correct + s.totalCorrect,
        };
      },

      saveDailyStats: () => {
        try {
          const today = new Date().toISOString().slice(0, 10);
          const stats = get().getTodayStats();
          localStorage.setItem(
            'drivingDefenseStats',
            JSON.stringify({ ...stats, date: today })
          );
        } catch { /* ignore */ }
      },

      // ===== Best Score =====
      updateBestScore: () => {
        const s = get();
        if (s.score <= 0) return;
        try {
          const prev = parseInt(localStorage.getItem('drivingDefenseBest') || '0');
          if (s.score > prev) {
            localStorage.setItem('drivingDefenseBest', String(s.score));
            set({ bestScore: s.score });
          }
        } catch { /* ignore */ }
      },
    }),
    {
      name: 'drivingDefense',
      partialize: (state) => ({
        gold: state.gold,
        bulletLevel: state.bulletLevel,
        hpLevel: state.hpLevel,
        pokeKills: state.pokeKills,
        unlocked: state.unlocked,
        activePokemon: state.activePokemon,
        allQuestions: state.allQuestions,
        bestScore: state.bestScore,
      }),
    }
  )
);
