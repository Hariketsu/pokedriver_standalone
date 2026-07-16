'use client';

import React from 'react';

interface MonsterLaneProps {
  children: React.ReactNode;
  laneRef: React.RefObject<HTMLDivElement | null>;
}

export default function MonsterLane({ children, laneRef }: MonsterLaneProps) {
  return (
    <div id="monster-lane" ref={laneRef}>
      {children}
    </div>
  );
}
