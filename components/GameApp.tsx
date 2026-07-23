"use client";

import { useEffect, useRef } from "react";
import { useGameStore } from "@/lib/store";
import { AudioEngine } from "@/lib/audio";
import { BattleFX } from "@/lib/fx3d";
import { domBurst } from "@/lib/dom-fx";
import TitleScreen from "./screens/TitleScreen";
import StarterScreen from "./screens/StarterScreen";
import MapScreen from "./screens/MapScreen";
import BattleScreen, {
  useBattleCaptureHandlers,
} from "./screens/BattleScreen";
import ShopScreen from "./screens/ShopScreen";
import RestScreen from "./screens/RestScreen";
import DexScreen from "./screens/DexScreen";
import ReviewScreen from "./screens/ReviewScreen";
import SettingsScreen from "./screens/SettingsScreen";
import OverScreen from "./screens/OverScreen";
import Modal from "./ui/Modal";
import Toast from "./ui/Toast";

function CaptureBridge() {
  const { handleCapture, handleSkip } = useBattleCaptureHandlers();
  return <Modal onCapture={handleCapture} onSkipCapture={handleSkip} />;
}

export default function GameApp() {
  const screen = useGameStore((s) => s.screen);
  const hydrated = useGameStore((s) => s.hydrated);
  const hydrate = useGameStore((s) => s.hydrate);
  const meta = useGameStore((s) => s.meta);
  const gameOver = useGameStore((s) => s.gameOver);
  const prevScreen = useRef(screen);
  const overSfxDone = useRef(false);

  useEffect(() => {
    hydrate();
  }, [hydrate]);

  useEffect(() => {
    if (!hydrated) return;
    AudioEngine.setBgmVol(meta.settings.bgm);
    AudioEngine.setSfxVol(meta.settings.sfx);
  }, [hydrated, meta.settings.bgm, meta.settings.sfx]);

  // Unlock audio on first pointer/key（不要强行切回 title BGM，尊重当前 screen / pending）
  useEffect(() => {
    const unlock = () => {
      AudioEngine.unlock();
      const st = useGameStore.getState();
      let track = "title";
      if (st.screen === "map") track = "map";
      else if (st.screen === "shop") track = "shop";
      else if (st.screen === "rest") track = "rest";
      else if (st.screen === "battle") {
        track = st.battle?.enemy.isBoss ? "boss" : "battle";
      } else if (st.screen === "over" && st.gameOver?.win) {
        track = "rest";
      }
      AudioEngine.bgm(track);
      document.removeEventListener("pointerdown", unlock);
      document.removeEventListener("keydown", unlock);
    };
    document.addEventListener("pointerdown", unlock);
    document.addEventListener("keydown", unlock);
    return () => {
      document.removeEventListener("pointerdown", unlock);
      document.removeEventListener("keydown", unlock);
    };
  }, []);

  // Lazy BattleFX context warm (hidden canvas not available until battle;
  // battle screen inits its own canvas)

  // Screen enter BGM
  useEffect(() => {
    if (!hydrated) return;
    const prev = prevScreen.current;
    prevScreen.current = screen;

    if (screen === "title") {
      // only force title BGM when leaving something else (not first paint before unlock)
      if (prev !== "title") AudioEngine.bgm("title");
    } else if (screen === "map") {
      AudioEngine.bgm("map");
    } else if (screen === "shop") {
      AudioEngine.bgm("shop");
    } else if (screen === "rest") {
      AudioEngine.bgm("rest");
    } else if (screen === "over") {
      // handled below with gameOver sfx
    }
  }, [screen, hydrated]);

  // Game over fanfare / defeat
  useEffect(() => {
    if (screen !== "over" || !gameOver) {
      overSfxDone.current = false;
      return;
    }
    if (overSfxDone.current) return;
    overSfxDone.current = true;
    AudioEngine.sfx(gameOver.win ? "fanfare" : "defeat");
    AudioEngine.bgm(gameOver.win ? "rest" : "title");
    // 与 ref battle.js gameOver(true) 一致：通关金彩粒子
    if (gameOver.win) {
      const layer =
        document.getElementById("app-fx-layer") ??
        document.getElementById("fx-layer");
      domBurst(layer, 50, 30, "#ffd700", 30);
    }
  }, [screen, gameOver]);

  // Stop battle FX when leaving battle
  useEffect(() => {
    if (screen !== "battle") {
      try {
        BattleFX.setRunning(false);
      } catch {
        /* ignore */
      }
    }
  }, [screen]);

  if (!hydrated) {
    return (
      <div id="app">
        <div id="shake-wrap">
          <section className="screen active" id="scr-title">
            <div className="title-inner">
              <div className="title-logo">
                <div className="logo-top">宝可驾</div>
                <div className="logo-sub">交 规 地 牢</div>
              </div>
            </div>
          </section>
        </div>
      </div>
    );
  }

  return (
    <div id="app">
      <div id="shake-wrap">
        {screen === "title" && <TitleScreen />}
        {screen === "starter" && <StarterScreen />}
        {screen === "map" && <MapScreen />}
        {screen === "battle" && <BattleScreen />}
        {screen === "shop" && <ShopScreen />}
        {screen === "rest" && <RestScreen />}
        {screen === "dex" && <DexScreen />}
        {screen === "review" && <ReviewScreen />}
        {screen === "settings" && <SettingsScreen />}
        {screen === "over" && <OverScreen />}
      </div>
      {/* 全局粒子层：通关等战斗外 FX（battle 内仍用 stage 上的 #fx-layer） */}
      <div
        id="app-fx-layer"
        className="fx-layer"
        style={{ position: "fixed", inset: 0, zIndex: 40 }}
      />
      <CaptureBridge />
      <Toast />
    </div>
  );
}
