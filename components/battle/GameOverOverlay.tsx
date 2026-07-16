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
      <div className="go-title">💀 考砸了</div>

      <div className="go-stats">
        ⭐ {score}<br/>
        ✅ 正确率: {accuracy}%<br/>
        🔥 最大连击: {maxCombo}
      </div>

      <button className="restart-btn" onClick={restartGame}>
        🔄 重新考试
      </button>
    </div>
  );
}
