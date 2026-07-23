"use client";

import { useEffect, useMemo, useState } from "react";
import { POKEMON } from "@/data";
import { useGameStore } from "@/lib/store";
import { ICON } from "@/lib/icon";
import { PKMN_BY_ID, pick } from "@/lib/formulas";
import { AudioEngine } from "@/lib/audio";

export default function TitleScreen() {
  const meta = useGameStore((s) => s.meta);
  const hasSave = useGameStore((s) => s.hasSave);
  const setScreen = useGameStore((s) => s.setScreen);
  const continueRun = useGameStore((s) => s.continueRun);
  const openModal = useGameStore((s) => s.openModal);
  // 与 ref renderTitle 同步：首帧即根据存档显示「继续冒险」，避免 hidden 闪一下
  const [saveExists, setSaveExists] = useState(() =>
    useGameStore.getState().hasSave(),
  );

  const titleIds = useMemo(() => {
    const ids = new Set<number>();
    while (ids.size < 3 && POKEMON.length) {
      ids.add(pick(POKEMON).id);
    }
    return Array.from(ids);
  }, []);

  useEffect(() => {
    setSaveExists(hasSave());
  }, [hasSave, meta]);

  const caught = Object.values(meta.dex).filter((d) => d.caught > 0).length;

  return (
    <section className="screen active" id="scr-title">
      <div className="title-bg">
        <div className="title-grid" />
        <div className="title-glow" />
      </div>
      <div className="title-inner">
        <div className="title-logo">
          <div className="logo-top">宝可驾</div>
          <div className="logo-sub">交 规 地 牢</div>
          <div className="logo-tag">— 答题爬塔 · 捕捉宝可梦 · 通关科目一 —</div>
        </div>
        <div className="title-pkmn" id="title-pkmn">
          {titleIds.map((id) => (
            <img key={id} src={ICON(id)} alt={PKMN_BY_ID[id]?.c ?? ""} />
          ))}
        </div>
        <div className="menu">
          <button
            className="btn btn-primary"
            id="btn-start"
            onClick={() => {
              AudioEngine.sfx("click");
              if (hasSave()) {
                openModal({ kind: "confirmNewRun" });
              } else {
                setScreen("starter");
              }
            }}
          >
            开始冒险
          </button>
          <button
            className={`btn${saveExists ? "" : " hidden"}`}
            id="btn-continue"
            onClick={() => {
              AudioEngine.sfx("click");
              if (continueRun()) AudioEngine.bgm("map");
            }}
          >
            继续冒险
          </button>
          <button
            className="btn"
            id="btn-dex"
            onClick={() => {
              AudioEngine.sfx("click");
              setScreen("dex");
            }}
          >
            宝可梦图鉴
          </button>
          <button
            className="btn"
            id="btn-review"
            onClick={() => {
              AudioEngine.sfx("click");
              setScreen("review");
            }}
          >
            题库复习
          </button>
          <button
            className="btn"
            id="btn-settings"
            onClick={() => {
              AudioEngine.sfx("click");
              setScreen("settings");
            }}
          >
            设置
          </button>
        </div>
        <div className="title-stats" id="title-stats">
          <span>🏆 最高分 {meta.bestScore}</span>
          <span>🗺 冒险 {meta.runs} 次</span>
          <span>📖 图鉴 {caught}/721</span>
        </div>
        <div className="title-foot">
          驾考题库 1034 题 · 宝可梦 721 只 · 数据仅供学习娱乐
        </div>
      </div>
    </section>
  );
}
