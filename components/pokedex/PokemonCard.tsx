'use client';

import React, { useState } from 'react';
import { getPkmIcon, pkmFallbackColor, getRarityEmoji, getRarityLabel, getLegendTier } from '@/lib/pokemon';

interface PokemonCardProps {
  pkm: { id: number; n: string; c: string; r: string; i: number };
  unlocked: boolean;
  kills: number;
  isActive: boolean;
  onSelect: () => void;
}

export default function PokemonCard({ pkm, unlocked, kills, isActive, onSelect }: PokemonCardProps) {
  const [iconError, setIconError] = useState(false);
  const tier = getLegendTier(pkm.id);

  const classNames = [
    'pkm-card',
    isActive ? 'active' : '',
    !unlocked ? 'locked' : '',
    pkm.r !== 'c' ? `rarity-${pkm.r}` : '',
  ]
    .filter(Boolean)
    .join(' ');

  const handleClick = () => {
    if (unlocked && !isActive) {
      onSelect();
    }
  };

  return (
    <div className={classNames} onClick={handleClick}>
      <span className="pkm-id">#{pkm.id}</span>

      {unlocked && isActive && <span className="pkm-using">⚡</span>}

      {tier && (
        <span className={`pkm-tier-badge ${tier.cls}`}>
          {tier.emoji}{tier.label}
        </span>
      )}

      {iconError ? (
        <div
          className="pkm-img-fallback"
          style={{
            backgroundColor: pkmFallbackColor(pkm.id) + '33',
            color: pkmFallbackColor(pkm.id),
            border: '2px solid ' + pkmFallbackColor(pkm.id),
          }}
        >
          {pkm.c.charAt(0)}
        </div>
      ) : (
        <img
          className="pkm-img"
          src={getPkmIcon(pkm.id)}
          alt={pkm.c}
          onError={() => setIconError(true)}
        />
      )}

      <div className="pkm-name">{pkm.c}</div>

      {!unlocked && (
        <div className="pkm-progress">
          {kills}/10
        </div>
      )}

      <span className="pkm-rarity">
        {getRarityEmoji(pkm.r)}{getRarityLabel(pkm.r)}
      </span>
    </div>
  );
}
