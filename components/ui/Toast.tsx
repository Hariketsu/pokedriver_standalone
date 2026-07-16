'use client';
import { useGameStore } from '@/lib/store';

export default function Toast() {
  const toastMessage = useGameStore(s => s.toastMessage);

  if (!toastMessage) return null;

  return (
    <div
      style={{
        position: 'fixed',
        bottom: '80px',
        left: '50%',
        transform: 'translateX(-50%)',
        background: 'var(--surface)',
        border: '1px solid var(--gold)',
        color: 'var(--text)',
        padding: '8px 20px',
        borderRadius: '10px',
        fontSize: '13px',
        zIndex: 200,
        animation: 'comboPop 1.5s ease-out forwards',
        boxShadow: '0 0 20px rgba(255,215,0,0.2)',
      }}
    >
      {toastMessage}
    </div>
  );
}
