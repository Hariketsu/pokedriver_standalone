'use client';

import React from 'react';
import { useGameStore } from '@/lib/store';
import { getAllPokemon, getPkmName } from '@/lib/pokemon';
import PokemonCard from './PokemonCard';
import GachaButton from './GachaButton';

export default function PokedexPanel() {
  const unlocked = useGameStore((s) => s.unlocked);
  const pokeKills = useGameStore((s) => s.pokeKills);
  const activePokemon = useGameStore((s) => s.activePokemon);
  const pokeFilter = useGameStore((s) => s.pokeFilter);
  const setActivePokemon = useGameStore((s) => s.setActivePokemon);
  const setPokeFilter = useGameStore((s) => s.setPokeFilter);
  const showToast = useGameStore((s) => s.showToast);

  const allPkm = getAllPokemon();
  const filteredPkm =
    pokeFilter === 'unlocked'
      ? allPkm.filter((p) => unlocked[p.id])
      : allPkm;

  const unlockedCount = allPkm.filter((p) => unlocked[p.id]).length;
  const totalCount = allPkm.length;

  const handleCardSelect = (pkmId: number) => {
    setActivePokemon(pkmId);
    showToast(`已切换为 ${getPkmName(pkmId)}`);
  };

  return (
    <div className="pokedex-area active">
      <div className="pokedex-header">
        <div className="info">
          📖 图鉴 · 已解锁 {unlockedCount}/{totalCount}
        </div>
        <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
          <button
            className={`filter-btn${pokeFilter === 'all' ? ' active' : ''}`}
            onClick={() => setPokeFilter('all')}
          >
            全部
          </button>
          <button
            className={`filter-btn${pokeFilter === 'unlocked' ? ' active' : ''}`}
            onClick={() => setPokeFilter('unlocked')}
          >
            已解锁
          </button>
          <GachaButton />
        </div>
      </div>

      <div className="pokedex-grid">
        {filteredPkm.map((pkm) => (
          <PokemonCard
            key={pkm.id}
            pkm={pkm}
            unlocked={!!unlocked[pkm.id]}
            kills={pokeKills[pkm.id] || 0}
            isActive={activePokemon === pkm.id}
            onSelect={() => handleCardSelect(pkm.id)}
          />
        ))}
      </div>
    </div>
  );
}
