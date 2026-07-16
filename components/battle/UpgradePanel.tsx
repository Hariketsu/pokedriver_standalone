'use client';

import React from 'react';
import { useGameStore } from '@/lib/store';
import { MAX_UPGRADE_LEVEL } from '@/data/constants';

export default function UpgradePanel() {
  const gold = useGameStore((s) => s.gold);
  const bulletLevel = useGameStore((s) => s.bulletLevel);
  const hpLevel = useGameStore((s) => s.hpLevel);
  const getBulletCost = useGameStore((s) => s.getBulletCost);
  const getHPCost = useGameStore((s) => s.getHPCost);
  const upgradeBullet = useGameStore((s) => s.upgradeBullet);
  const upgradeHP = useGameStore((s) => s.upgradeHP);
  const showToast = useGameStore((s) => s.showToast);

  const bulletCost = getBulletCost();
  const hpCost = getHPCost();

  const canAffordBullet = gold >= bulletCost && bulletLevel < MAX_UPGRADE_LEVEL;
  const canAffordHP = gold >= hpCost && hpLevel < MAX_UPGRADE_LEVEL;

  const handleBulletUpgrade = () => {
    if (!upgradeBullet()) {
      if (bulletLevel >= MAX_UPGRADE_LEVEL) {
        showToast('伤害已达到最高等级');
      } else {
        showToast('金币不足！');
      }
    }
  };

  const handleHPUpgrade = () => {
    if (!upgradeHP()) {
      if (hpLevel >= MAX_UPGRADE_LEVEL) {
        showToast('生命已达到最高等级');
      } else {
        showToast('金币不足！');
      }
    }
  };

  return (
    <div className="upgrade-panel">
      <div className="upgrade-row upgrade-gold">
        <span>🪙 {gold}</span>
      </div>

      <div className="upgrade-row upgrade-btns">
        <button
          className={`upgrade-btn-sm ${!canAffordBullet && bulletLevel < MAX_UPGRADE_LEVEL ? 'disabled' : ''}`}
          onClick={handleBulletUpgrade}
          disabled={!canAffordBullet && bulletLevel < MAX_UPGRADE_LEVEL}
        >
          <span className="lbl">🔫 伤害 Lv.{bulletLevel}</span>
          <span className="cost">
            {bulletLevel >= MAX_UPGRADE_LEVEL ? 'MAX' : `${bulletCost}🪙`}
          </span>
        </button>

        <button
          className={`upgrade-btn-sm ${!canAffordHP && hpLevel < MAX_UPGRADE_LEVEL ? 'disabled' : ''}`}
          onClick={handleHPUpgrade}
          disabled={!canAffordHP && hpLevel < MAX_UPGRADE_LEVEL}
        >
          <span className="lbl">❤️ 生命 Lv.{hpLevel}</span>
          <span className="cost">
            {hpLevel >= MAX_UPGRADE_LEVEL ? 'MAX' : `${hpCost}🪙`}
          </span>
        </button>
      </div>
    </div>
  );
}
