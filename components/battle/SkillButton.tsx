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
      style={{
        position: 'absolute',
        right: 4,
        top: '50%',
        transform: 'translateY(-50%)',
        width: 48,
        height: 48,
        borderRadius: '50%',
        cursor: isReady ? 'pointer' : 'default',
      }}
    >
      <span className="skill-emoji">💥</span>
      <div className="charge-bar">
        <div
          className="charge-fill"
          style={{ width: `${chargePercent}%` }}
        />
      </div>
      <span className="charge-text">{chargePercent}%</span>
    </button>
  );
}
