"use client";

import { useEffect, useState } from "react";
import { useGameStore } from "@/lib/store";
import { AudioEngine } from "@/lib/audio";

const STARTERS = [
  { src: "/art/starter-volt.png", alt: "电系伙伴" },
  { src: "/art/starter-leaf.png", alt: "叶系伙伴" },
  { src: "/art/starter-cloud.png", alt: "云系伙伴" },
] as const;

export default function TitleScreen() {
  const meta = useGameStore((s) => s.meta);
  const hasSave = useGameStore((s) => s.hasSave);
  const loadRun = useGameStore((s) => s.loadRun);
  const setScreen = useGameStore((s) => s.setScreen);
  const continueRun = useGameStore((s) => s.continueRun);
  const openModal = useGameStore((s) => s.openModal);
  const [saveExists, setSaveExists] = useState(() =>
    useGameStore.getState().hasSave(),
  );
  const [saveInfo, setSaveInfo] = useState<{
    floor: number;
    team: number;
    gold: number;
  } | null>(null);

  useEffect(() => {
    setSaveExists(hasSave());
    const run = loadRun();
    setSaveInfo(
      run
        ? {
            floor: run.floorsCleared + 1,
            team: run.team.length,
            gold: run.gold,
          }
        : null,
    );
  }, [hasSave, loadRun, meta]);

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
        <picture>
          <source media="(min-width:768px)" srcSet="/art/bg-16-9.png" />
          <img className="title-bg-img" src="/art/hero-bg.png" alt="" />
        </picture>
        <div className="title-shade" />
      </div>

      <button
        type="button"
        className="title-settings-btn"
        id="btn-settings"
        aria-label="设置"
        onClick={() => go("settings")}
      >
        <img src="/art/ui-settings.png" alt="设置" />
      </button>

      <div className="title-inner">
        <div className="title-logo">
          <img className="logo-img" src="/art/ui-logo.png" alt="宝可驾 · 交规地牢" />
        </div>

        <div className="title-starters">
          {STARTERS.map((s) => (
            <img key={s.src} src={s.src} alt={s.alt} />
          ))}
        </div>

        <div className="title-cta">
          {saveExists && (
            <button
              className="btn-plate"
              id="btn-continue"
              onClick={onContinue}
            >
              <img className="bp-bg" src="/art/ui-plate-gold-long.png" alt="" />
              <span className="bp-content">
                <span className="bp-label bp-label-dark">
                  <img className="bp-play" src="/art/ui-play.png" alt="" />
                  继续冒险
                </span>
                {saveInfo && (
                  <span className="bp-sub">
                    第 {saveInfo.floor} 关 · 队伍 {saveInfo.team} · 金币{" "}
                    {saveInfo.gold}
                  </span>
                )}
              </span>
            </button>
          )}
          <button className="btn-plate" id="btn-start" onClick={onPrimaryStart}>
            <img className="bp-bg" src="/art/ui-plate-blue.png" alt="" />
            <span className="bp-content">
              <span className="bp-label">新的冒险</span>
            </span>
          </button>
        </div>

        <div className="title-grid-nav" aria-label="次要功能">
          <button
            type="button"
            className="title-nav-card tnc-dex"
            id="btn-dex"
            onClick={() => go("dex")}
          >
            <img className="tnc-icon" src="/art/icon-dex.png" alt="" />
            <span className="tnc-label">图鉴</span>
            <span className="tnc-sub">{caught}/721</span>
          </button>
          <button
            type="button"
            className="title-nav-card tnc-study"
            id="btn-study"
            onClick={() => go("study")}
          >
            <img className="tnc-icon" src="/art/icon-study.png" alt="" />
            <span className="tnc-label">学习</span>
            <span className="tnc-sub">
              {wrongCount > 0 ? `错题 ${wrongCount}` : "模考 · 题库"}
            </span>
          </button>
          <button
            type="button"
            className="title-nav-card tnc-train"
            id="btn-train"
            onClick={() => go("train")}
          >
            <img className="tnc-icon" src="/art/icon-train.png" alt="" />
            <span className="tnc-label">养成</span>
            <span className="tnc-sub">💰 {metaGold}</span>
          </button>
          <button
            type="button"
            className="title-nav-card tnc-settings"
            id="btn-settings-grid"
            onClick={() => go("settings")}
          >
            <img className="tnc-icon" src="/art/icon-settings.png" alt="" />
            <span className="tnc-label">设置</span>
            <span className="tnc-sub">音量 · 难度</span>
          </button>
        </div>

        <div className="title-foot" id="title-stats">
          {meta.bestScore > 0 && <span>🏆 {meta.bestScore} · </span>}
          <span>📖 图鉴 {caught}/721</span>
          <span> · 💰 金币 {metaGold} · </span>
          <span>驾考题库 1034 题 · 仅供学习娱乐</span>
        </div>
      </div>
    </section>
  );
}
