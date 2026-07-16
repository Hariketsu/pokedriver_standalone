'use client';
import { useGameStore } from '@/lib/store';

export default function TabBar() {
  const activeTab = useGameStore(s => s.activeTab);
  const setActiveTab = useGameStore(s => s.setActiveTab);

  const tabs = [
    { key: 'battle' as const, label: '⚔️ 闯关' },
    { key: 'bank' as const, label: '📚 题库' },
    { key: 'pokedex' as const, label: '📖 图鉴' },
  ];

  return (
    <div className="tab-bar">
      {tabs.map(t => (
        <button
          key={t.key}
          className={`tab-btn${activeTab === t.key ? ' active' : ''}`}
          onClick={() => setActiveTab(t.key)}
        >
          {t.label}
        </button>
      ))}
    </div>
  );
}
