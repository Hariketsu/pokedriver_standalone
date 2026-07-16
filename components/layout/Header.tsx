'use client';
import { useGameStore } from '@/lib/store';

export default function Header() {
  const hp = useGameStore(s => s.hp);
  const maxHp = useGameStore(s => s.maxHp);
  const score = useGameStore(s => s.score);
  const combo = useGameStore(s => s.combo);
  const doubleDamage = useGameStore(s => s.doubleDamage);

  const hpPercent = (hp / maxHp) * 100;
  const hpClass = hpPercent > 60 ? 'hp-ok' : hpPercent > 30 ? 'hp-warn' : 'hp-danger';

  return (
    <div className="header">
      <div className="title">驾考保卫战</div>
      <div className="stats">
        <div className="stat">
          <span>HP</span>
          <span className={`val ${hpClass}`}>{hp}</span>
        </div>
        <div className="stat">
          <span>分数</span>
          <span className="val">{score}</span>
        </div>
        <div className="stat">
          <span>连击</span>
          <span className={`val${combo >= 10 ? ' combo-fire' : ''}`}>
            {doubleDamage ? '💥 ' : ''}{combo}
          </span>
        </div>
      </div>
    </div>
  );
}
