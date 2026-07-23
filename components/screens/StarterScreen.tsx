"use client";

import { STARTERS, useGameStore } from "@/lib/store";
import {
  PKMN_BY_ID,
  RARITY_CSS,
  RARITY_LABEL,
  baseHp,
  pokeSpeed,
} from "@/lib/formulas";
import { ICON } from "@/lib/icon";
import { AudioEngine } from "@/lib/audio";

export default function StarterScreen() {
  const newRun = useGameStore((s) => s.newRun);

  return (
    <section className="screen active" id="scr-starter">
      <div className="page-head">
        <h2>选择你的初始伙伴</h2>
        <p className="dim">它将陪你踏入交规地牢</p>
      </div>
      <div className="starter-row" id="starter-row">
        {STARTERS.map((s) => {
          const p = PKMN_BY_ID[s.id];
          if (!p) return null;
          return (
            <div
              key={s.id}
              className="starter-card"
              onClick={() => {
                AudioEngine.sfx("click");
                newRun(s.id);
                AudioEngine.bgm("map");
              }}
            >
              <img src={ICON(p.id)} alt={p.c} />
              <div>
                <div className="sc-name">
                  {p.c}{" "}
                  <span className={`tag ${RARITY_CSS[p.r]}`}>
                    {RARITY_LABEL[p.r]}
                  </span>
                </div>
                <div className="sc-desc">{s.desc}</div>
                <div className="sc-desc">
                  HP {baseHp(p)} · 速度 {pokeSpeed(p)}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
