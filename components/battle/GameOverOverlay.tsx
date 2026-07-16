'use client';

import React from 'react';
import { useGameStore } from '@/lib/store';

export default function GameOverOverlay() {
  const gameOver = useGameStore((s) => s.gameOver);
  const score = useGameStore((s) => s.score);
  const totalAnswered = useGameStore((s) => s.totalAnswered);
  const totalCorrect = useGameStore((s) => s.totalCorrect);
  const maxCombo = useGameStore((s) => s.maxCombo);
  const restartGame = useGameStore((s) => s.restartGame);

  if (!gameOver) return null;

  const accuracy = totalAnswered > 0
    ? Math.round((totalCorrect / totalAnswered) * 100)
    : 0;

  return (
    <div id="game-over" className="game-over-overlay show">
      <div className="go-content">
        <h2 className="go-title">💀 考砸了</h2>

        <div className="go-stats">
          ⭐ <span id="go-score" style={{ color: 'var(--cyan)', fontWeight: 700 }}>{score}</span><br/>
          ✅ 正确率: <span id="go-rate" style={{ color: 'var(--cyan)', fontWeight: 700 }}>{accuracy}%</span><br/>
          🔥 最大连击: <span id="go-combo" style={{ color: 'var(--cyan)', fontWeight: 700 }}>{maxCombo}</span>
        </div>

        <button className="restart-btn" onClick={restartGame}>
          🔄 重新考试
        </button>
      </div>
    </div>
  );
}
