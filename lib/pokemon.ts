// Pokemon helper functions — pure functions extracted from the original app
// No DOM or state dependencies

import { POKEMON_DATA } from '@/data/pokemon-data';
import { POKEMON_ICONS } from '@/data/pokemon-icons';
import { TIER1_LEGEND, TIER2_LEGEND, MYTHICAL_PKMN } from '@/data/constants';

// Filtered Pokemon list (only those with icons)
const PKM = POKEMON_DATA.filter(p => p.i === 1);

export function getPkm(id: number) {
  return PKM.find(p => p.id === id);
}

export function getPkmName(id: number): string {
  const p = getPkm(id);
  return p ? p.c : '???';
}

export function getPkmIcon(id: number): string {
  if (POKEMON_ICONS[id]) return POKEMON_ICONS[id];
  return '/pokemon/icons/' + id + '.png';
}

export function hasPkmIcon(id: number): boolean {
  const p = getPkm(id);
  return !!(p && p.i === 1);
}

export function pkmFallbackColor(id: number): string {
  const colors = ['#00f0ff', '#ff00ff', '#ffd700', '#00ff88', '#ff0044', '#ff8800', '#8844ff', '#00ddff'];
  return colors[Math.abs(id || 0) % colors.length];
}

export function isPkmUnlockable(id: number): boolean {
  const p = getPkm(id);
  return !!(p && p.i === 1);
}

export function getRarityLabel(r: string): string {
  const map: Record<string, string> = { c: '普通', u: '稀有', r: '珍贵', l: '传说' };
  return map[r] || '普通';
}

export function getRarityEmoji(r: string): string {
  const map: Record<string, string> = { c: '', u: '🔵', r: '🌟', l: '👑' };
  return map[r] || '';
}

export function getPkmHP(p: { id: number; r: string }): number {
  const rMult: Record<string, number> = { c: 1, u: 1.5, r: 2.2, l: 3.5 };
  const hp = Math.round(2 + (p.id % 5) * (rMult[p.r] || 1));
  return Math.min(hp, 12);
}

export function getPkmSpeed(p: { id: number; r: string }): number {
  const rMult: Record<string, number> = { c: 1, u: 1.15, r: 1.3, l: 1.5 };
  return (16 + (p.id % 10)) * (rMult[p.r] || 1);
}

export function getLegendTier(id: number): { emoji: string; label: string; cls: string } | null {
  if (TIER1_LEGEND.has(id)) return { emoji: '👑', label: '一级神', cls: 't1' };
  if (TIER2_LEGEND.has(id)) return { emoji: '⚡', label: '二级神', cls: 't2' };
  if (MYTHICAL_PKMN.has(id)) return { emoji: '🌟', label: '幻兽', cls: 'myth' };
  return null;
}

export function getPkmSpawnWeight(p: { id: number; r: string }): number {
  if (TIER1_LEGEND.has(p.id) || MYTHICAL_PKMN.has(p.id)) return 1;
  if (TIER2_LEGEND.has(p.id)) return 3;
  const weights: Record<string, number> = { c: 30, u: 15, r: 6, l: 2 };
  return weights[p.r] || 10;
}

export function getAllPokemon() {
  return PKM;
}
