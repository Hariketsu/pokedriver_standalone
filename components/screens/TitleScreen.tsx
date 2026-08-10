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
        <img className="title-bg-img" src="/art/hero-bg.png" alt="" />
        <div className="title-shade" />
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
          <div className="logo-sub">交规地牢</div>
          <div className="logo-tag">答题爬塔 · 捕捉宝可梦 · 通关科目一</div>
        </div>

        <div className="title-starters">
          {STARTERS.map((s) => (
            <img key={s.src} src={s.src} alt={s.alt} />
          ))}
          <img className="title-strip" src="/art/strip-checkers.png" alt="" />
        </div>

        <div className="title-cta">
          {saveExists ? (
            <>
              <button
                className="btn btn-gold"
                id="btn-continue"
                onClick={onContinue}
              >
                <span className="btn-label">继续冒险</span>
                {saveInfo && (
                  <span className="btn-sub">
                    第{saveInfo.floor}关 · 队伍{saveInfo.team} · 💰
                    {saveInfo.gold}
                  </span>
                )}
              </button>
              <button
                className="btn btn-blue"
                id="btn-start"
                onClick={onPrimaryStart}
              >
                新的冒险
              </button>
            </>
          ) : (
            <button
              className="btn btn-gold"
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
            <img className="tnc-icon" src="/art/icon-dex.png" alt="" />
            <span className="tnc-label">图鉴</span>
            <span className="tnc-sub">{caught}/721</span>
          </button>
          <button
            type="button"
            className="title-nav-card"
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
            className="title-nav-card"
            id="btn-train"
            onClick={() => go("train")}
          >
            <img className="tnc-icon" src="/art/icon-train.png" alt="" />
            <span className="tnc-label">养成</span>
            <span className="tnc-sub">💰 {metaGold}</span>
          </button>
          <button
            type="button"
            className="title-nav-card title-nav-card-dim"
            id="btn-settings-grid"
            onClick={() => go("settings")}
          >
            <img className="tnc-icon" src="/art/icon-settings.png" alt="" />
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
