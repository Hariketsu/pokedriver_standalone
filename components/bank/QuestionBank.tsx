'use client';

import React, { useState, useMemo } from 'react';
import { useGameStore } from '@/lib/store';
import { BUILTIN_QUESTIONS } from '@/data/questions-builtin';
import type { Question } from '@/data/questions-builtin';
import { BANK_PAGE_SIZE } from '@/data/constants';

const ANSWER_LETTERS = ['A', 'B', 'C', 'D'];

export default function QuestionBank() {
  const storeQuestions = useGameStore((s) => s.allQuestions);
  const bankPage = useGameStore((s) => s.bankPage);
  const setBankPage = useGameStore((s) => s.setBankPage);

  const [search, setSearch] = useState('');
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const questions: Question[] =
    storeQuestions.length > 0 ? storeQuestions : BUILTIN_QUESTIONS;

  // Filter by search text
  const filtered = useMemo(() => {
    if (!search.trim()) return questions;
    const lower = search.toLowerCase();
    return questions.filter((q) => {
      if (q.q.toLowerCase().includes(lower)) return true;
      return q.opts.some((opt) => opt.toLowerCase().includes(lower));
    });
  }, [questions, search]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / BANK_PAGE_SIZE));
  const safePage = Math.min(bankPage, totalPages);
  const start = (safePage - 1) * BANK_PAGE_SIZE;
  const pageItems = filtered.slice(start, start + BANK_PAGE_SIZE);

  const toggleExpand = (id: string) => {
    setExpandedId((prev) => (prev === id ? null : id));
  };

  const handlePrev = () => {
    if (safePage > 1) setBankPage(safePage - 1);
  };

  const handleNext = () => {
    if (safePage < totalPages) setBankPage(safePage + 1);
  };

  return (
    <div className="bank-area active">
      <div className="bank-search">
        <input
          type="text"
          placeholder="🔍 搜索题目..."
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setBankPage(1);
          }}
        />
        <span className="bank-count">共 {filtered.length} 题</span>
      </div>

      <div className="bank-list">
        {pageItems.map((q, i) => {
          const globalIndex = start + i + 1;
          const isExpanded = expandedId === q.id;
          return (
            <div
              key={q.id}
              className={`bank-item${isExpanded ? ' expanded' : ''}`}
            >
              <div
                className="bank-item-header"
                onClick={() => toggleExpand(q.id)}
              >
                <span className="q-num">{globalIndex}</span>
                <span className="q-preview">
                  {q.q.length > 50 ? q.q.slice(0, 50) + '...' : q.q}
                </span>
                <span className="q-toggle">▼</span>
              </div>
              <div className="bank-item-detail">
                {q.opts.map((opt, j) => (
                  <div
                    key={j}
                    className={`detail-opt${j === q.ans ? ' is-ans' : ''}`}
                  >
                    {opt}
                  </div>
                ))}
                <div className="detail-ans">
                  正确答案: {ANSWER_LETTERS[q.ans] || '?'}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="bank-pagination">
        <button disabled={safePage <= 1} onClick={handlePrev}>
          ◀
        </button>
        <span className="page-info">
          第 {safePage}/{totalPages} 页
        </span>
        <button disabled={safePage >= totalPages} onClick={handleNext}>
          ▶
        </button>
      </div>
    </div>
  );
}
