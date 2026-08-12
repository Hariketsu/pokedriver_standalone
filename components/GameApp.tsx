"use client";

import { useEffect, useRef, useState } from "react";
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
import ExamScreen from "./screens/ExamScreen";
import WrongBookScreen from "./screens/WrongBookScreen";
import TrainScreen from "./screens/TrainScreen";
import StudyHubScreen from "./screens/StudyHubScreen";
import Modal from "./ui/Modal";
import Toast from "./ui/Toast";

function CaptureBridge() {
  const { handleCapture, handleSkip } = useBattleCaptureHandlers();
  return <Modal onCapture={handleCapture} onSkipCapture={handleSkip} />;
}

export default function GameApp() {
  const screen = useGameStore((s) => s.screen);
  const hydrated = useGameStore((s) => s.hydrated);
  const dataReady = useGameStore((s) => s.dataReady);
  const bootError = useGameStore((s) => s.bootError);
  const hydrate = useGameStore((s) => s.hydrate);
  const meta = useGameStore((s) => s.meta);
  const gameOver = useGameStore((s) => s.gameOver);
  const prevScreen = useRef(screen);
  const overSfxDone = useRef(false);

  useEffect(() => {
    hydrate();
  }, [hydrate]);

  const [forceReady, setForceReady] = useState(false);
  const ready = (hydrated && dataReady) || forceReady;

  useEffect(() => {
    if (!hydrated) return;
    AudioEngine.setBgmVol(meta.settings.bgm);
    AudioEngine.setSfxVol(meta.settings.sfx);
  }, [hydrated, meta.settings.bgm, meta.settings.sfx]);

  // Unlock audio on first pointer/key
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

  // Screen enter BGM
  useEffect(() => {
    if (!ready) return;
    const prev = prevScreen.current;
    prevScreen.current = screen;

    if (
      screen === "title" ||
      screen === "train" ||
      screen === "study" ||
      screen === "exam" ||
      screen === "wrong" ||
      screen === "review" ||
      screen === "dex" ||
      screen === "settings"
    ) {
      if (
        prev !== "title" &&
        prev !== "train" &&
        prev !== "study" &&
        prev !== "exam" &&
        prev !== "wrong" &&
        prev !== "review" &&
        prev !== "dex" &&
        prev !== "settings"
      ) {
        AudioEngine.bgm("title");
      }
    } else if (screen === "map") {
      AudioEngine.bgm("map");
    } else if (screen === "shop") {
      AudioEngine.bgm("shop");
    } else if (screen === "rest") {
      AudioEngine.bgm("rest");
    } else if (screen === "over") {
      // handled below with gameOver sfx
    }
  }, [screen, ready]);

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

  // Loading gate: hydrate + critical data integrity
  if (!ready) {
    return (
      <div id="app">
        <div id="shake-wrap">
          <section className="screen active" id="scr-title">
            <div className="title-bg">
              <picture>
                <source media="(min-width:768px)" srcSet="/art/bg-16-9.webp" />
                <img className="title-bg-img" src="/art/hero-bg.webp" alt="" />
              </picture>
              <div className="title-shade" />
            </div>
            <div className="title-inner">
              <div className="title-logo">
                <img
                  className="logo-img"
                  src="/art/ui-logo.webp"
                  alt="宝可驾 · 交规地牢"
                />
              </div>
              <div id="boot-gate" className="boot-gate">
                {bootError ? (
                  <>
                    <div className="boot-err">{bootError}</div>
                    <p className="dim">关键数据校验失败，请刷新或检查构建。</p>
                    <button
                      type="button"
                      className="btn btn-mini"
                      id="btn-boot-force"
                      onClick={() => setForceReady(true)}
                    >
                      仍可进入（题库异常）
                    </button>
                  </>
                ) : (
                  <>
                    <div className="boot-spinner" aria-hidden />
                    <div className="boot-text">加载中…</div>
                  </>
                )}
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
        {screen === "train" && <TrainScreen />}
        {screen === "study" && <StudyHubScreen />}
        {screen === "exam" && <ExamScreen />}
        {screen === "wrong" && <WrongBookScreen />}
      </div>
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
