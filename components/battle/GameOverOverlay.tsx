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
    <div className="game-over-overlay show">
      <div className="go-content">
        <h2 className="go-title">游戏结束</h2>

        <div className="go-stats">
          <div className="go-stat-row">
            <span className="go-stat-label">最终得分</span>
            <span className="go-stat-value">{score}</span>
          </div>
          <div className="go-stat-row">
            <span className="go-stat-label">正确率</span>
            <span className="go-stat-value">
              {totalCorrect}/{totalAnswered} ({accuracy}%)
            </span>
          </div>
          <div className="go-stat-row">
            <span className="go-stat-label">最大连击</span>
            <span className="go-stat-value">{maxCombo}</span>
          </div>
        </div>

        <button className="restart-btn" onClick={restartGame}>
          重新开始
        </button>
      </div>
    </div>
  );
}
