"use client";

import { useGameStore } from "@/lib/store";
import { AudioEngine } from "@/lib/audio";
import SceneBg from "@/components/ui/SceneBg";
import Icon from "@/components/ui/Icon";

export default function OverScreen() {
  const gameOver = useGameStore((s) => s.gameOver);
  const meta = useGameStore((s) => s.meta);
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

  const {
    win,
    score,
    isRecord,
    floorsCleared,
    goldEarned,
    correct,
    answered,
    maxCombo,
    captures,
    minutes,
    bankedMetaGold = 0,
  } = gameOver;
  const acc = answered ? Math.round((correct / answered) * 100) : 0;
  const metaGold = meta.metaGold ?? 0;

  const stats: [string | number, string, string][] = [
    [score, "总分", "item-trophy"],
    [goldEarned, "累计金币", "item-coin"],
    [`${correct}/${answered}`, "答题（正确/总数）", "item-book"],
    [acc + "%", "正确率", "item-star"],
    [maxCombo, "最高连击", "badge-combo"],
    [captures, "捕获宝可梦", "item-ball-red"],
    [floorsCleared, "通过层数", "item-sword"],
    [minutes + " 分钟", "用时", ""],
  ];

  return (
    <section className="screen active has-scene" id="scr-over">
      <SceneBg name={win ? "over-win" : "over-lose"} soft />
      <div className="over-inner">
        <Icon
          name={win ? "stamp-pass" : "stamp-fail"}
          size={88}
          alt={win ? "通过" : "失败"}
          className="over-stamp"
        />
        <div
          className={"over-title " + (win ? "win" : "lose")}
          id="over-title"
        >
          {win ? (
            <>
              <Icon name="item-trophy" size={30} alt="奖杯" /> 通关地牢！
            </>
          ) : (
            <>
              <Icon name="item-skull" size={30} alt="失败" /> 冒险失败
            </>
          )}
        </div>
        <div className="over-sub" id="over-sub">
          {win
            ? "你击败了最终 BOSS，驾驭了交规之力！"
            : `止步于第 ${floorsCleared || 1} 层`}
          {isRecord && (
            <div className="new-record">
              <Icon name="badge-record" size={22} alt="新纪录" /> 新纪录！
            </div>
          )}
          {bankedMetaGold > 0 && (
            <div className="over-bank" id="over-bank">
              <Icon name="item-coin" size={16} alt="金币" /> 养成金币 +
              {bankedMetaGold}（余额 {metaGold}）
            </div>
          )}
        </div>
        <div className="over-stats" id="over-stats">
          {stats.map(([v, k, icon]) => (
            <div className="over-stat" key={k}>
              <div className="os-v">{v}</div>
              <div className="os-k">
                {icon ? <Icon name={icon} size={14} alt="" /> : null}
                {k}
              </div>
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
            className="btn btn-gold"
            id="btn-over-train"
            onClick={() => {
              AudioEngine.sfx("click");
              setScreen("train");
            }}
          >
            去养成
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
