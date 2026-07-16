'use client';

import { useEffect, useRef, useCallback, useState, forwardRef, useImperativeHandle } from 'react';
import { useGameStore } from '@/lib/store';
import { spawnMonster, getSpawnChance, calculateDamage, getEndY } from '@/lib/game-engine';
import { SPAWN_INTERVAL, SPAWN_MAX } from '@/data/constants';
import MonsterLane from './MonsterLane';
import Monster from './Monster';
import DefenseLine from './DefenseLine';
import SkillButton from './SkillButton';
import ComboNotify from './ComboNotify';

// ============================================================
// Helpers
// ============================================================

/** Find a monster's root DOM element by its data-monster-id attribute. */
function getMonsterEl(id: number): HTMLDivElement | null {
  return document.querySelector(`[data-monster-id="${id}"]`) as HTMLDivElement | null;
}

/** Find the HP fill element inside a monster element. */
function getHpFill(el: HTMLDivElement): HTMLElement | null {
  return el.querySelector('.m-hp-fill') as HTMLElement | null;
}

/** Remove all monster DOM elements from the lane immediately. */
function clearMonsterDOM(): void {
  document.querySelectorAll('[data-monster-id]').forEach(el => el.remove());
}

// ============================================================
// Types
// ============================================================

export interface GameAreaHandle {
  shootClosest: () => boolean;
  notifyCombo: (text: string) => void;
}

interface GameAreaProps {
  children?: React.ReactNode;
}

// ============================================================
// Component
// ============================================================

const GameArea = forwardRef<GameAreaHandle, GameAreaProps>(function GameArea({ children }, ref) {
  const laneRef = useRef<HTMLDivElement>(null);

  // ---- Refs for the game loop ----
  const lastTimeRef = useRef(0);
  const animFrameRef = useRef(0);
  const spawnTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const gameLoopTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // ---- Local UI state ----
  const [comboText, setComboText] = useState<string | null>(null);
  const [flash, setFlash] = useState(false);

  // ---- Store subscriptions (only what the JSX / effect deps need) ----
  const gameOver = useGameStore(s => s.gameOver);
  const startScreenVisible = useGameStore(s => s.startScreenVisible);
  const monsters = useGameStore(s => s.monsters);
  const speedLevel = useGameStore(s => s.speedLevel);
  const combo = useGameStore(s => s.combo);
  const bulletLevel = useGameStore(s => s.bulletLevel);
  const doubleDamage = useGameStore(s => s.doubleDamage);

  // ==========================================================
  // Game Loop — updates monster Y positions via direct DOM
  // manipulation to avoid React re-render overhead on every frame.
  // ==========================================================

  const updateMonsterPositions = useCallback((dt: number) => {
    const laneEl = laneRef.current;
    if (!laneEl) return;

    const laneH = laneEl.clientHeight;
    const endY = getEndY(laneH);
    const store = useGameStore.getState();
    const currentMonsters = store.monsters;

    for (const m of currentMonsters) {
      if (m.dead || m.reached) continue;

      const newY = m.y + m.speed * dt;

      // Imperative DOM update
      const el = getMonsterEl(m.id);
      if (el) {
        el.style.top = newY + 'px';
      }

      if (newY >= endY) {
        // ---- Monster reached the defense line ----
        m.reached = true;
        m.y = newY;

        if (el) {
          el.classList.add('reached-end');
          setTimeout(() => {
            el.remove();
          }, 400);
        }

        const dmg = Math.max(5, 15 - store.speedLevel);
        store.damagePlayer(dmg);
        store.removeMonster(m.id);
      } else {
        // Sync the store value for any React reconciliation
        m.y = newY;
      }
    }
  }, []);

  useEffect(() => {
    if (gameOver || startScreenVisible) return;

    const loop = (time: number) => {
      const store = useGameStore.getState();
      if (store.gameOver) return;

      if (!lastTimeRef.current) {
        lastTimeRef.current = time;
        animFrameRef.current = requestAnimationFrame(loop);
        return;
      }

      // Cap delta to avoid spiral-of-death after tab switch
      const dt = Math.min((time - lastTimeRef.current) / 1000, 0.05);
      lastTimeRef.current = time;

      updateMonsterPositions(dt);
      animFrameRef.current = requestAnimationFrame(loop);
    };

    lastTimeRef.current = performance.now();
    animFrameRef.current = requestAnimationFrame(loop);

    // ---- setInterval fallback for when the tab is inactive (rAF is paused) ----
    gameLoopTimerRef.current = setInterval(() => {
      const store = useGameStore.getState();
      if (store.gameOver) return;

      const now = performance.now();
      const dt = Math.min((now - lastTimeRef.current) / 1000, 0.05);
      lastTimeRef.current = now;

      updateMonsterPositions(dt);
    }, 50);

    return () => {
      cancelAnimationFrame(animFrameRef.current);
      if (gameLoopTimerRef.current) clearInterval(gameLoopTimerRef.current);
    };
  }, [gameOver, startScreenVisible, updateMonsterPositions]);

  // ==========================================================
  // Spawn Timer
  // ==========================================================

  useEffect(() => {
    if (gameOver || startScreenVisible) return;

    spawnTimerRef.current = setInterval(() => {
      const store = useGameStore.getState();
      if (store.gameOver) return;

      const aliveCount = store.monsters.filter(m => !m.dead && !m.reached).length;
      const chance = getSpawnChance(store.speedLevel, store.combo);

      if (aliveCount < SPAWN_MAX && Math.random() < chance) {
        // spawnMonster() already calls setState internally — no need for addMonster()
        spawnMonster();
      }
    }, SPAWN_INTERVAL);

    return () => {
      if (spawnTimerRef.current) clearInterval(spawnTimerRef.current);
    };
  }, [gameOver, startScreenVisible, speedLevel, combo]);

  // ==========================================================
  // Initial spawns — kickstart the lane when the game starts
  // ==========================================================

  useEffect(() => {
    if (!startScreenVisible && !gameOver) {
      const t1 = setTimeout(() => { spawnMonster(); }, 800);
      const t2 = setTimeout(() => { spawnMonster(); }, 2200);
      return () => { clearTimeout(t1); clearTimeout(t2); };
    }
  }, [startScreenVisible]);
  // Deliberately narrow deps: only re-fire when startScreenVisible toggles.

  // ==========================================================
  // Shooting — called by QuestionPanel via handleAnswer → onShoot
  // ==========================================================

  const shootClosest = useCallback((): boolean => {
    const store = useGameStore.getState();
    const alive = store.monsters.filter(m => !m.dead && !m.reached);

    if (alive.length === 0) return false;

    // Target the monster closest to the defense line (highest Y)
    let closest = alive[0];
    let maxY = -9999;
    for (const m of alive) {
      if (m.y > maxY) {
        maxY = m.y;
        closest = m;
      }
    }

    const dmg = calculateDamage(bulletLevel, doubleDamage);
    const newHp = closest.hp - dmg;

    // Direct DOM HP bar update for instant visual feedback
    const el = getMonsterEl(closest.id);
    if (el) {
      const hpFill = getHpFill(el);
      if (hpFill) {
        hpFill.style.width = Math.max(0, (newHp / closest.maxHp) * 100) + '%';
      }

      // Damage flash animation (re-trigger CSS)
      el.classList.remove('taking-damage');
      void el.offsetWidth; // force reflow
      el.classList.add('taking-damage');
    }

    if (newHp <= 0) {
      // ---- Monster killed ----
      store.removeMonster(closest.id);

      // Remove DOM element immediately
      if (el) el.remove();

      store.addKill(closest.pkmId);
      useGameStore.setState({ score: store.score + 10 * store.speedLevel });

      // Unlock check: 10 kills on a non-active Pokemon
      const kills = (store.pokeKills[closest.pkmId] || 0) + 1;
      if (kills >= 10 && !store.unlocked[closest.pkmId] && closest.pkmId !== store.activePokemon) {
        store.unlockPokemon(closest.pkmId);
        store.showToast('🎉 解锁 ' + closest.name + '！可在图鉴中切换');
      } else if (kills === 5 || kills === 8) {
        store.showToast(closest.name + ' ' + kills + '/10');
      }

      return true;
    }

    // Sync store HP for next render
    closest.hp = newHp;
    return true;
  }, [bulletLevel, doubleDamage]);

  // ==========================================================
  // Skill Activation
  // ==========================================================

  const handleSkillActivate = useCallback(() => {
    const store = useGameStore.getState();

    // activateSkill returns false if not fully charged (SkillButton already
    // gates on this, but we double-check for safety).
    if (!store.activateSkill()) return;

    setFlash(true);
    setTimeout(() => setFlash(false), 300);

    // Remove monster DOM elements immediately so they don't outlive the flash
    clearMonsterDOM();

    store.showToast('💥 全屏清除！');
  }, []);

  // ==========================================================
  // Combo Notification — called by QuestionPanel via onComboNotify
  // ==========================================================

  const handleComboNotify = useCallback((text: string) => {
    setComboText(text);
  }, []);

  // ==========================================================
  // Visibility change — reset delta clock after tab switch
  // ==========================================================

  useEffect(() => {
    const handler = () => {
      if (!document.hidden && !useGameStore.getState().gameOver) {
        lastTimeRef.current = performance.now();
      }
    };
    document.addEventListener('visibilitychange', handler);
    return () => document.removeEventListener('visibilitychange', handler);
  }, []);

  // ==========================================================
  // Keyboard shortcuts
  // ==========================================================

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      // Don't intercept when user is typing in an input
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement
      ) {
        return;
      }

      const store = useGameStore.getState();

      // ---- Game Over: Enter / Space restarts ----
      if (store.gameOver) {
        if (e.key === 'Enter' || e.key === ' ') {
          store.restartGame();
        }
        return;
      }

      // ---- In-game: number / letter keys select answer ----
      const keys = ['1', '2', '3', '4', 'a', 'b', 'c', 'd'];
      const idx = keys.indexOf(e.key.toLowerCase());
      if (idx >= 0) {
        // Map A-D → 0-3, same as 1-4
        const realIdx = idx >= 4 ? idx - 4 : idx;
        const btns = document.querySelectorAll('.option-btn');
        if (btns[realIdx] && !btns[realIdx].classList.contains('disabled')) {
          (btns[realIdx] as HTMLButtonElement).click();
        }
      }
    };

    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, []);

  // ==========================================================
  // Expose API via ref for page.tsx to bridge QuestionPanel callbacks
  // ==========================================================

  useImperativeHandle(
    ref,
    () => ({ shootClosest, notifyCombo: handleComboNotify }),
    [shootClosest, handleComboNotify],
  );

  // ==========================================================
  // Render
  // ==========================================================

  return (
    <div id="game-area" className="game-area">
      <MonsterLane laneRef={laneRef}>
        {monsters.map(m => (
          <Monster
            key={m.id}
            monster={m}
            laneHeight={laneRef.current?.clientHeight ?? 300}
          />
        ))}
      </MonsterLane>

      <DefenseLine />

      <SkillButton onActivate={handleSkillActivate} />

      <ComboNotify
        comboText={comboText}
        onDone={() => setComboText(null)}
      />

      {flash && <div id="screen-flash" className="show" />}
      {children}
    </div>
  );
});

GameArea.displayName = 'GameArea';
export default GameArea;
