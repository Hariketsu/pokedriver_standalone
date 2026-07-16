'use client';

import React, { useState } from 'react';
import { useGameStore } from '@/lib/store';

interface QuestionPanelProps {
  onShoot: () => boolean;
  onComboNotify: (text: string) => void;
}

export default function QuestionPanel({ onShoot, onComboNotify }: QuestionPanelProps) {
  const currentQ = useGameStore((s) => s.currentQ);
  const totalAnswered = useGameStore((s) => s.totalAnswered);
  const handleAnswer = useGameStore((s) => s.handleAnswer);
  const nextQuestion = useGameStore((s) => s.nextQuestion);

  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [answered, setAnswered] = useState(false);

  if (!currentQ) {
    return (
      <div className="question-area">
        <p className="q-text">加载题目中...</p>
      </div>
    );
  }

  const questionNumber = totalAnswered + 1;

  const onOptionClick = (index: number) => {
    if (answered) return;

    setSelectedIndex(index);
    setAnswered(true);

    handleAnswer(index, onShoot, onComboNotify);

    const isCorrect = index === currentQ.ans;
    const delay = isCorrect ? 500 : 800;

    setTimeout(() => {
      setSelectedIndex(null);
      setAnswered(false);
      nextQuestion();
    }, delay);
  };

  const getOptionClass = (index: number): string => {
    const classes = ['option-btn'];

    if (answered) {
      classes.push('disabled');
      if (index === currentQ.ans) {
        classes.push('correct');
      } else if (index === selectedIndex && index !== currentQ.ans) {
        classes.push('wrong');
      }
    }

    return classes.join(' ');
  };

  return (
    <div className="question-area">
      <div className="q-number">第 {questionNumber} 题</div>
      <div className="q-text">{currentQ.q}</div>
      <div className="options">
        {currentQ.opts.map((opt, i) => (
          <button
            key={i}
            className={getOptionClass(i)}
            onClick={() => onOptionClick(i)}
            disabled={answered}
          >
            {opt}
          </button>
        ))}
      </div>
    </div>
  );
}
