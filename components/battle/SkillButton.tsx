'use client';

import React from 'react';
import { useGameStore } from '@/lib/store';

interface SkillButtonProps {
  onActivate: () => void;
}

export default function SkillButton({ onActivate }: SkillButtonProps) {
  const skillCharge = useGameStore((s) => s.skillCharge);
  const skillMax = useGameStore((s) => s.skillMax);

  const isReady = skillCharge >= skillMax;
  const chargePercent = Math.min(100, Math.round((skillCharge / skillMax) * 100));

  const handleClick = () => {
    if (isReady) {
      onActivate();
    }
  };

  return (
    <button
      id="skill-btn"
      className={isReady ? 'ready' : ''}
      onClick={handleClick}
      title="必杀技"
    >
      ⚡
      <div className="charge-bar">
        <div
          id="skill-charge-fill"
          className="charge-fill"
          style={{ width: `${chargePercent}%` }}
        />
      </div>
      <span id="skill-charge-text" className="charge-text">{chargePercent}%</span>
    </button>
  );
}
