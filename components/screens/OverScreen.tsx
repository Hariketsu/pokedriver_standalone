"use client";

import { useGameStore } from "@/lib/store";
import { AudioEngine } from "@/lib/audio";

export default function OverScreen() {
  const gameOver = useGameStore((s) => s.gameOver);
  const setScreen = useGameStore((s) => s.setScreen);

  if (!gameOver) {
    return (
      <section className="screen active" id="scr-over">
        <div className="over-inner">
          <div className="over-title lose">冒险结束</div>
          <div className="over-btns">
            <button
              className="btn btn-primary"
              onClick={() => {
                AudioEngine.sfx("click");
                setScreen("starter");
              }}
            >
              再来一局
            </button>
            <button
              className="btn"
              onClick={() => {
                AudioEngine.sfx("click");
                setScreen("title");
                AudioEngine.bgm("title");
              }}
            >
              回到标题
            </button>
          </div>
        </div>
      </section>
    );
  }

  const { win, score, isRecord, floorsCleared, goldEarned, correct, answered, maxCombo, captures, minutes } =
    gameOver;
  const acc = answered ? Math.round((correct / answered) * 100) : 0;

  const stats: [string | number, string][] = [
    [score, "总分"],
    [goldEarned, "累计金币"],
    [`${correct}/${answered}`, "答题（正确/总数）"],
    [acc + "%", "正确率"],
    [maxCombo, "最高连击"],
    [captures, "捕获宝可梦"],
    [floorsCleared, "通过层数"],
    [minutes + " 分钟", "用时"],
  ];

  return (
    <section className="screen active" id="scr-over">
      <div className="over-inner">
        <div
          className={"over-title " + (win ? "win" : "lose")}
          id="over-title"
        >
          {win ? "🏆 通关地牢！" : "💀 冒险失败"}
        </div>
        <div className="over-sub" id="over-sub">
          {win
            ? "你击败了最终 BOSS，驾驭了交规之力！"
            : `止步于第 ${floorsCleared || 1} 层`}
          {isRecord && <div className="new-record">✨ 新纪录！</div>}
        </div>
        <div className="over-stats" id="over-stats">
          {stats.map(([v, k]) => (
            <div className="over-stat" key={k}>
              <div className="os-v">{v}</div>
              <div className="os-k">{k}</div>
            </div>
          ))}
        </div>
        <div className="over-btns">
          <button
            className="btn btn-primary"
            id="btn-over-restart"
            onClick={() => {
              AudioEngine.sfx("click");
              setScreen("starter");
            }}
          >
            再来一局
          </button>
          <button
            className="btn"
            id="btn-over-title"
            onClick={() => {
              AudioEngine.sfx("click");
              setScreen("title");
              AudioEngine.bgm("title");
            }}
          >
            回到标题
          </button>
        </div>
      </div>
    </section>
  );
}
