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
      <div className="start-content">
        <h1 className="start-title">驾考保卫战</h1>
        <p className="start-sub">
          选择题库中的驾照考试题，击败野怪！<br />
          每答对一题可攻击一次，连续答对触发连击加成！
        </p>
        <p className="start-pokemon">
          当前出战：{getPkmName(activePokemon)}
        </p>
        <button className="start-btn" onClick={startGame}>
          开始战斗！
        </button>
      </div>
    </div>
  );
}
