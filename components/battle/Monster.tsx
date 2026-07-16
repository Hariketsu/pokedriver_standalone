'use client';

import React, { useState } from 'react';
import type { MonsterState } from '@/lib/store';
import { getPkmIcon, pkmFallbackColor } from '@/lib/pokemon';

interface MonsterProps {
  monster: MonsterState;
  laneHeight: number;
}

export default function Monster({ monster, laneHeight }: MonsterProps) {
  const [iconError, setIconError] = useState(false);

  const hpPercent = monster.maxHp > 0
    ? (monster.hp / monster.maxHp) * 100
    : 0;

  const classNames = [
    'monster',
    monster.dead && !monster.reached ? 'taking-damage' : '',
    monster.reached ? 'reached-end' : '',
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <div
      className={classNames}
      style={{
        left: `${30 + (monster.id % 3) * 25}%`,
        top: monster.y,
      }}
      data-monster-id={monster.id}
    >
      {iconError ? (
        <div
          className="monster-fallback"
          style={{
            backgroundColor: pkmFallbackColor(monster.pkmId),
            width: 48,
            height: 48,
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#fff',
            fontWeight: 'bold',
            fontSize: 20,
          }}
        >
          {monster.name.charAt(0)}
        </div>
      ) : (
        <img
          src={getPkmIcon(monster.pkmId)}
          alt={monster.name}
          width={48}
          height={48}
          onError={() => setIconError(true)}
        />
      )}

      <div className="m-hp-wrapper">
        <div
          className="m-hp-fill"
          style={{ width: `${hpPercent}%` }}
        />
      </div>
    </div>
  );
}
