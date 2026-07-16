'use client';

import React, { useState, useEffect } from 'react';

interface ComboNotifyProps {
  comboText: string | null;
  onDone: () => void;
}

export default function ComboNotify({ comboText, onDone }: ComboNotifyProps) {
  const [state, setState] = useState<{ text: string; visible: boolean }>({
    text: '',
    visible: false,
  });

  useEffect(() => {
    if (comboText) {
      setState({ text: comboText, visible: true });

      const timer = setTimeout(() => {
        setState({ text: '', visible: false });
        onDone();
      }, 1000);

      return () => clearTimeout(timer);
    }
  }, [comboText, onDone]);

  if (!state.visible) return null;

  return (
    <div className="combo-notify">
      {state.text}
    </div>
  );
}
