'use client';

import React, { useState } from 'react';
import type { MonsterState } from '@/lib/store';
import { getPkmIcon, pkmFallbackColor } from '@/lib/pokemon';

interface MonsterProps {
  monster: MonsterState;
  laneHeight: number;
  positionIndex?: number;
}

export default function Monster({ monster, laneHeight, positionIndex = 0 }: MonsterProps) {
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
        left: `${5 + positionIndex * 18}%`,
        top: monster.y,
      }}
      data-monster-id={monster.id}
    >
      {iconError ? (
        <div
          className="m-img-fallback"
          style={{
            backgroundColor: pkmFallbackColor(monster.pkmId) + '33',
            color: pkmFallbackColor(monster.pkmId),
            border: '2px solid ' + pkmFallbackColor(monster.pkmId),
          }}
        >
          {monster.name.charAt(0)}
        </div>
      ) : (
        <img
          className="m-img"
          src={getPkmIcon(monster.pkmId)}
          alt={monster.name}
          width={50}
          height={50}
          onError={() => setIconError(true)}
        />
      )}

      <div className="m-hp-wrapper">
        <div
          className="m-hp-fill"
          style={{
            width: `${hpPercent}%`,
            backgroundColor: monster.color,
          }}
        />
      </div>
    </div>
  );
}
