'use client';

import React from 'react';
import { useGameStore } from '@/lib/store';
import { getPkmName } from '@/lib/pokemon';

export default function StartOverlay() {
  const startScreenVisible = useGameStore((s) => s.startScreenVisible);
  const activePokemon = useGameStore((s) => s.activePokemon);
  const startGame = useGameStore((s) => s.startGame);

  if (!startScreenVisible) return null;

  return (
    <div className="start-overlay">
      <div className="start-title">👾宝可驾🚗</div>
      <p className="start-sub" style={{ fontSize: 14, margin: '4px 0' }}>
        ⚡ 上阵宝可梦: {getPkmName(activePokemon)}<br />
        答对题目发射子弹 · 击败宝可梦解锁收集！
      </p>
      <div className="start-features">
        <span className="start-feature">📖 全图鉴收集</span>
        <span className="start-feature">🎰 抽奖系统</span>
        <span className="start-feature">🔥 连击系统</span>
      </div>
      <button className="start-btn" onClick={startGame}>
        🎮 开始冒险
      </button>
    </div>
  );
}
