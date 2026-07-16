'use client';
import { useState } from 'react';
import { useGameStore } from '@/lib/store';
import type { Question } from '@/data/questions-builtin';
import ConfirmDialog from '@/components/ui/ConfirmDialog';

export default function Footer() {
  const store = useGameStore;
  const importQuestions = useGameStore(s => s.importQuestions);
  const resetAll = useGameStore(s => s.resetAll);
  const bestScore = useGameStore(s => s.bestScore);

  const [showReset, setShowReset] = useState(false);

  const todayStats = store.getState().getTodayStats();
  const { totalAnswered, totalCorrect } = todayStats;
  const accuracy = totalAnswered > 0 ? Math.round((totalCorrect / totalAnswered) * 100) : 0;

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
        const normalized = data.map((item: unknown) => {
          const q = item as Record<string, unknown>;
          return {
            q: q.q || q.question,
            opts: q.opts || q.options,
            ans: q.ans ?? q.answer,
            id: q.id || `imp_${Math.random().toString(36).slice(2, 9)}`,
          };
        });
        const valid = normalized.every(
          (q: Record<string, unknown>) =>
            typeof q.q === 'string' &&
            Array.isArray(q.opts) &&
            typeof q.ans === 'number'
        );
        if (!valid) {
          alert('导入失败：格式不正确，每条题目需包含 q/question、opts/options、ans/answer 字段');
          return;
        }
        importQuestions(normalized as Question[]);
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
        <label className="import-btn">
          📂 导入题库
          <input
            type="file"
            accept=".json,.txt"
            style={{ display: 'none' }}
            onChange={handleFileChange}
          />
        </label>

        <span>今日: {totalAnswered}题 {accuracy}%</span>

        <span style={{color:'var(--gold)',fontSize:'11px'}}>🏆 {bestScore || "—"}</span>

        <button className="reset-btn" onClick={() => setShowReset(true)}>
          🔄 重置
        </button>
      </div>

      <ConfirmDialog
        show={showReset}
        message="确定重置所有数据？（金币、升级、图鉴进度都会清除）"
        onConfirm={handleReset}
        onCancel={() => setShowReset(false)}
      />
    </>
  );
}
