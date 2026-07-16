'use client';
import { useRef, useState } from 'react';
import { useGameStore } from '@/lib/store';
import type { Question } from '@/data/questions-builtin';
import ConfirmDialog from '@/components/ui/ConfirmDialog';

export default function Footer() {
  const store = useGameStore;
  const importQuestions = useGameStore(s => s.importQuestions);
  const resetAll = useGameStore(s => s.resetAll);
  const bestScore = useGameStore(s => s.bestScore);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [showReset, setShowReset] = useState(false);

  const todayStats = store.getState().getTodayStats();
  const { totalAnswered, totalCorrect } = todayStats;
  const accuracy = totalAnswered > 0 ? Math.round((totalCorrect / totalAnswered) * 100) : 0;

  const handleImport = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      try {
        const data = JSON.parse(reader.result as string);
        if (!Array.isArray(data)) {
          alert('导入失败：数据必须是数组');
          return;
        }
        const valid = data.every(
          (q: unknown) =>
            q &&
            typeof q === 'object' &&
            typeof (q as Record<string, unknown>).q === 'string' &&
            Array.isArray((q as Record<string, unknown>).opts) &&
            typeof (q as Record<string, unknown>).ans === 'number'
        );
        if (!valid) {
          alert('导入失败：格式不正确，每条题目需包含 q、opts、ans 字段');
          return;
        }
        importQuestions(data as Question[]);
      } catch {
        alert('导入失败：JSON 解析错误');
      }
    };
    reader.readAsText(file);

    // Reset input so the same file can be re-imported
    e.target.value = '';
  };

  const handleReset = () => {
    setShowReset(false);
    resetAll();
  };

  return (
    <>
      <div className="footer">
        <button className="import-btn" onClick={handleImport}>
          📂 导入题库
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept=".json"
          style={{ display: 'none' }}
          onChange={handleFileChange}
        />

        <span>今日: {totalAnswered}/{totalCorrect} {accuracy}%</span>

        <span>最佳: {bestScore}</span>

        <button className="reset-btn" onClick={() => setShowReset(true)}>
          🔄 重置
        </button>
      </div>

      <ConfirmDialog
        show={showReset}
        message="确定要重置所有数据吗？此操作不可撤销。"
        onConfirm={handleReset}
        onCancel={() => setShowReset(false)}
      />
    </>
  );
}
