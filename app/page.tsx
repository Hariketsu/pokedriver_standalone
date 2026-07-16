'use client';

import { useEffect, useRef, useCallback } from 'react';
import { useGameStore } from '@/lib/store';
import { BUILTIN_QUESTIONS } from '@/data/questions-builtin';
import TabBar from '@/components/layout/TabBar';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import GameArea, { type GameAreaHandle } from '@/components/battle/GameArea';
import QuestionPanel from '@/components/battle/QuestionPanel';
import UpgradePanel from '@/components/battle/UpgradePanel';
import StartOverlay from '@/components/battle/StartOverlay';
import GameOverOverlay from '@/components/battle/GameOverOverlay';
import PokedexPanel from '@/components/pokedex/PokedexPanel';
import QuestionBank from '@/components/bank/QuestionBank';
import ParticleCanvas from '@/components/ui/ParticleCanvas';
import Toast from '@/components/ui/Toast';

// ============================================================
// Helpers
// ============================================================

function shuffleArray<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// ============================================================
// Page Component
// ============================================================

export default function Home() {
  const activeTab = useGameStore((s) => s.activeTab);
  const startScreenVisible = useGameStore((s) => s.startScreenVisible);
  const gameOver = useGameStore((s) => s.gameOver);
  const currentQ = useGameStore((s) => s.currentQ);

  // ---- Refs for bridging QuestionPanel callbacks into GameArea ----
  const gameAreaRef = useRef<GameAreaHandle>(null);

  const handleShoot = useCallback((): boolean => {
    return gameAreaRef.current?.shootClosest() ?? false;
  }, []);

  const handleComboNotify = useCallback((text: string) => {
    gameAreaRef.current?.notifyCombo(text);
  }, []);

  // ==========================================================
  // Initialization — migrate old data, load daily stats
  // ==========================================================

  useEffect(() => {
    // Migrate from old localStorage keys (legacy single-HTML-file version)
    try {
      const savedBest = localStorage.getItem('drivingDefenseBest');
      if (savedBest) {
        useGameStore.setState({ bestScore: parseInt(savedBest) || 0 });
      }

      let savedBank: string | null = null;
      try {
        savedBank = localStorage.getItem('drivingDefenseImportedBank');
      } catch { /* ignore */ }

      if (savedBank) {
        try {
          const parsed = JSON.parse(savedBank);
          if (Array.isArray(parsed) && parsed.length > 0) {
            const questions = parsed.map((q: any, i: number) => ({
              id: q.id || 'import_' + i,
              q: q.q || q.question || '',
              opts: q.opts || q.options || [],
              ans: typeof q.ans === 'number' ? q.ans : q.answer || 0,
            }));
            useGameStore.getState().importQuestions(questions);
          }
        } catch {
          /* ignore malformed JSON */
        }
      }
    } catch {
      /* ignore localStorage errors */
    }

    // If no localStorage bank, try fetching external question bank
    const savedBank = (() => { try { return localStorage.getItem('drivingDefenseImportedBank'); } catch { return null; } })();
    if (!savedBank) {
      fetch(`questions_bank.json?t=${Date.now()}`)
        .then((res) => {
          if (!res.ok) throw new Error(`HTTP ${res.status}`);
          return res.json();
        })
        .then((data) => {
          if (Array.isArray(data) && data.length > 0) {
            const questions = data.map((q: any, i: number) => ({
              id: q.id || 'ext_' + i,
              q: q.q || q.question || '',
              opts: q.opts || q.options || [],
              ans: typeof q.ans === 'number' ? q.ans : q.answer ?? 0,
            }));
            useGameStore.getState().importQuestions(questions);
          }
        })
        .catch(() => {
          /* fetch failed — fall through to BUILTIN_QUESTIONS below */
        });
    }

    // Initialize daily stats
    useGameStore.getState().loadDailyBase();
  }, []);

  // ==========================================================
  // Load builtin questions on first visit (store persist may
  // have saved allQuestions, but questions queue is not persisted).
  // This acts as the fallback when neither localStorage nor the
  // external questions_bank.json provided any questions.
  // ==========================================================

  useEffect(() => {
    const store = useGameStore.getState();
    if (store.allQuestions.length === 0 && BUILTIN_QUESTIONS.length > 0) {
      const shuffled = shuffleArray(BUILTIN_QUESTIONS);
      useGameStore.setState({
        allQuestions: BUILTIN_QUESTIONS,
        questions: shuffled,
      });
    }
  }, []);

  // ==========================================================
  // Dispatch the first question when the game starts (or restarts)
  // Triggers on: start screen dismissed, or game-over → restart
  // ==========================================================

  useEffect(() => {
    if (startScreenVisible || gameOver) return;
    if (currentQ) return;

    const store = useGameStore.getState();
    if (store.questions.length > 0) {
      setTimeout(() => store.nextQuestion(), 500);
    }
  }, [startScreenVisible, gameOver, currentQ]);

  // ==========================================================
  // Render
  // ==========================================================

  return (
    <>
      {/* Background particle canvas — always rendered behind everything */}
      <ParticleCanvas />

      {/* Main App Container */}
      <div id="app">
        <TabBar />

        {/* ---- Battle Tab ---- */}
        {activeTab === 'battle' && (
          <>
            <Header />
            <GameArea ref={gameAreaRef}>
              {/* StartOverlay / GameOverOverlay must be inside .game-area
                  for their position:absolute;inset:0 CSS to work correctly */}
              <StartOverlay />
              <GameOverOverlay />
            </GameArea>
            <QuestionPanel
              onShoot={handleShoot}
              onComboNotify={handleComboNotify}
            />
            <UpgradePanel />
          </>
        )}

        {/* ---- Pokedex Tab ---- */}
        {activeTab === 'pokedex' && <PokedexPanel />}

        {/* ---- Question Bank Tab ---- */}
        {activeTab === 'bank' && <QuestionBank />}

        <Footer />
      </div>

      {/* Global notifications */}
      <Toast />
    </>
  );
}
