'use client';

import React, { useState } from 'react';
import { useGameStore } from '@/lib/store';
import { getPkmIcon, getPkmName, pkmFallbackColor } from '@/lib/pokemon';

export default function DefenseLine() {
  const activePokemon = useGameStore((s) => s.activePokemon);
  const [iconError, setIconError] = useState(false);

  return (
    <div className="defense-line">
      <div className="license-icon">
        {iconError ? (
          <div
            style={{
              width: 60,
              height: 60,
              borderRadius: '50%',
              backgroundColor: pkmFallbackColor(activePokemon),
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#fff',
              fontWeight: 'bold',
              fontSize: 24,
            }}
          >
            {getPkmName(activePokemon).charAt(0)}
          </div>
        ) : (
          <img
            src={getPkmIcon(activePokemon)}
            alt={getPkmName(activePokemon)}
            width={60}
            height={60}
            onError={() => setIconError(true)}
          />
        )}
      </div>
      <span className="defense-name">{getPkmName(activePokemon)}</span>
    </div>
  );
}
