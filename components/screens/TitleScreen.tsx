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
  const wrongCount = Object.keys(meta.wrongQ).length;
  const metaGold = meta.metaGold ?? 0;

  function go(screen: "dex" | "study" | "train" | "settings") {
    AudioEngine.sfx("click");
    setScreen(screen);
  }

  function onPrimaryStart() {
    AudioEngine.sfx("click");
    if (hasSave()) openModal({ kind: "confirmNewRun" });
    else setScreen("starter");
  }

  function onContinue() {
    AudioEngine.sfx("click");
    if (continueRun()) AudioEngine.bgm("map");
  }

  return (
    <section className="screen active" id="scr-title">
      <div className="title-bg">
        <div className="title-grid" />
        <div className="title-glow" />
      </div>

      <button
        type="button"
        className="title-settings-btn"
        id="btn-settings"
        aria-label="设置"
        onClick={() => go("settings")}
      >
        ⚙
      </button>

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

        <div className="title-cta">
          {saveExists ? (
            <>
              <button
                className="btn btn-primary"
                id="btn-continue"
                onClick={onContinue}
              >
                继续冒险
              </button>
              <button
                className="btn btn-ghost"
                id="btn-start"
                onClick={onPrimaryStart}
              >
                新的冒险
              </button>
            </>
          ) : (
            <button
              className="btn btn-primary"
              id="btn-start"
              onClick={onPrimaryStart}
            >
              开始冒险
            </button>
          )}
        </div>

        <div className="title-grid-nav" aria-label="次要功能">
          <button
            type="button"
            className="title-nav-card"
            id="btn-dex"
            onClick={() => go("dex")}
          >
            <span className="tnc-icon">📖</span>
            <span className="tnc-label">图鉴</span>
            <span className="tnc-sub">
              {caught}/721
            </span>
          </button>
          <button
            type="button"
            className="title-nav-card"
            id="btn-study"
            onClick={() => go("study")}
          >
            <span className="tnc-icon">📚</span>
            <span className="tnc-label">学习</span>
            <span className="tnc-sub">
              {wrongCount > 0 ? `错题 ${wrongCount}` : "模考 · 题库"}
            </span>
          </button>
          <button
            type="button"
            className="title-nav-card"
            id="btn-train"
            onClick={() => go("train")}
          >
            <span className="tnc-icon">🧬</span>
            <span className="tnc-label">养成</span>
            <span className="tnc-sub">💰 {metaGold}</span>
          </button>
          <button
            type="button"
            className="title-nav-card title-nav-card-dim"
            id="btn-settings-grid"
            onClick={() => go("settings")}
          >
            <span className="tnc-icon">⚙</span>
            <span className="tnc-label">设置</span>
            <span className="tnc-sub">音量 · 难度</span>
          </button>
        </div>

        <div className="title-stats" id="title-stats">
          {meta.bestScore > 0 && <span>🏆 {meta.bestScore}</span>}
          <span>📖 {caught}/721</span>
          <span>💰 {metaGold}</span>
        </div>
        <div className="title-foot">
          驾考题库 1034 题 · 宝可梦 721 只 · 仅供学习娱乐
        </div>
      </div>
    </section>
  );
}
