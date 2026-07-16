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
      // Use AbortController to time out after 5 s on slow networks (e.g. China mainland mobile)
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);

      fetch(`questions_bank.json`, { signal: controller.signal })
        .then((res) => {
          clearTimeout(timeoutId);
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
          clearTimeout(timeoutId);
          /* fetch failed or timed out — fall through to BUILTIN_QUESTIONS below */
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
  // IMPORTANT: allQuestions is persisted by zustand but questions
  // (the shuffled queue) is NOT.  If persist restores allQuestions
  // without a matching questions queue (e.g. user switches device
  // or clears only part of localStorage), we must rebuild it here.
  // ==========================================================

  useEffect(() => {
    if (startScreenVisible || gameOver) return;
    if (currentQ) return;

    const store = useGameStore.getState();

    // Rebuild the shuffled question queue if persist restored
    // allQuestions but questions is still empty.
    if (store.questions.length === 0 && store.allQuestions.length > 0) {
      const shuffled = shuffleArray(store.allQuestions);
      useGameStore.setState({ questions: shuffled });
    }

    // Re-read state in case we just rebuilt the queue
    const s = useGameStore.getState();
    if (s.questions.length > 0) {
      setTimeout(() => s.nextQuestion(), 500);
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
