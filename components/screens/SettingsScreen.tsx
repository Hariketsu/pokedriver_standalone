"use client";

import { useGameStore } from "@/lib/store";
import { AudioEngine } from "@/lib/audio";
import type { Difficulty } from "@/lib/types";
import Icon from "@/components/ui/Icon";
import SceneBg from "@/components/ui/SceneBg";

export default function SettingsScreen() {
  const settings = useGameStore((s) => s.meta.settings);
  const updateSettings = useGameStore((s) => s.updateSettings);
  const setScreen = useGameStore((s) => s.setScreen);
  const openModal = useGameStore((s) => s.openModal);

  return (
    <section className="screen active has-scene" id="scr-settings">
      <SceneBg name="over-lose" soft />
      <div className="page-head row">
        <button
          className="btn btn-mini back"
          data-back
          onClick={() => {
            AudioEngine.sfx("click");
            setScreen("title");
          }}
        >
          <Icon name="icon-back" size={13} alt="" /> 返回
        </button>
        <h2>设置</h2>
        <span />
      </div>
      <div className="settings-list">
        <div className="set-row">
          <span>背景音乐</span>
          <input
            type="range"
            id="set-bgm"
            min={0}
            max={100}
            value={Math.round(settings.bgm * 100)}
            onChange={(e) => {
              const v = Number(e.target.value) / 100;
              updateSettings({ bgm: v });
              AudioEngine.setBgmVol(v);
            }}
          />
        </div>
        <div className="set-row">
          <span>音效音量</span>
          <input
            type="range"
            id="set-sfx"
            min={0}
            max={100}
            value={Math.round(settings.sfx * 100)}
            onChange={(e) => {
              const v = Number(e.target.value) / 100;
              updateSettings({ sfx: v });
              AudioEngine.setSfxVol(v);
              AudioEngine.sfx("click");
            }}
          />
        </div>
        <div className="set-row">
          <span>屏幕震动</span>
          <button
            className={"set-toggle" + (settings.shake ? " active" : "")}
            id="set-shake"
            aria-label={settings.shake ? "屏幕震动：开" : "屏幕震动：关"}
            onClick={() => {
              updateSettings({ shake: !settings.shake });
            }}
          >
            <Icon
              name={settings.shake ? "toggle-on" : "toggle-off"}
              size={30}
              alt=""
            />
          </button>
        </div>
        <div className="set-row">
          <span>答题限时</span>
          <div className="seg" id="set-diff">
            {(
              [
                ["easy", "简单 30s"],
                ["normal", "普通 20s"],
                ["hard", "困难 12s"],
              ] as [Difficulty, string][]
            ).map(([d, label]) => (
              <button
                key={d}
                data-d={d}
                className={settings.diff === d ? "active" : undefined}
                onClick={() => {
                  updateSettings({ diff: d });
                  AudioEngine.sfx("click");
                }}
              >
                {label}
              </button>
            ))}
          </div>
        </div>
        <div className="set-row danger">
          <span>清除所有数据</span>
          <button
            className="btn btn-mini btn-danger"
            id="set-wipe"
            onClick={() => openModal({ kind: "confirmWipe" })}
          >
            清除
          </button>
        </div>
        <div className="set-note">
          进度自动保存在本设备浏览器中（localStorage）。
        </div>
      </div>
    </section>
  );
}
