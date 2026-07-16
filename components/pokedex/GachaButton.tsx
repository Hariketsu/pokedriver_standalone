'use client';

import React from 'react';
import { useGameStore } from '@/lib/store';

export default function GachaButton() {
  const gold = useGameStore((s) => s.gold);
  const doGacha = useGameStore((s) => s.doGacha);
  const showToast = useGameStore((s) => s.showToast);

  const handleClick = () => {
    if (gold < 200) {
      showToast('金币不足！');
      return;
    }
    const result = doGacha();
    if (!result) {
      showToast('所有宝可梦已解锁！');
      return;
    }
    showToast(`🎉 抽到 ${result.name}（${result.rarity}）！`);
  };

  return (
    <button
      className="gacha-btn"
      disabled={gold < 200}
      onClick={handleClick}
    >
      🎰 抽卡 (200g)
    </button>
  );
}
