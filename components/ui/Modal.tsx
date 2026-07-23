"use client";

import { useGameStore } from "@/lib/store";
import {
  PKMN_BY_ID,
  RARITY_CSS,
  RARITY_LABEL,
  baseHp,
  catchChance,
  pokeAtk,
  pokeMaxHp,
  pokeSpeed,
  xpNeed,
  GAME_CONST,
} from "@/lib/formulas";
import { ICON } from "@/lib/icon";
import { AudioEngine } from "@/lib/audio";
import type { BallType } from "@/lib/types";

type Props = {
  onCapture?: (ball: BallType) => void;
  onSkipCapture?: () => void;
};

export default function Modal({ onCapture, onSkipCapture }: Props) {
  const modal = useGameStore((s) => s.modal);
  const closeModal = useGameStore((s) => s.closeModal);
  const run = useGameStore((s) => s.run);
  const battle = useGameStore((s) => s.battle);
  const meta = useGameStore((s) => s.meta);
  const continueRun = useGameStore((s) => s.continueRun);
  const setScreen = useGameStore((s) => s.setScreen);
  const wipeAll = useGameStore((s) => s.wipeAll);
  const showToast = useGameStore((s) => s.showToast);
  const replaceTeamMember = useGameStore((s) => s.replaceTeamMember);
  const releaseCatch = useGameStore((s) => s.releaseCatch);

  if (!modal) return null;

  const onBackdrop = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      // don't close capture / teamFull by accident during battle flow
      if (modal.kind === "capture" || modal.kind === "teamFull") return;
      closeModal();
    }
  };

  return (
    <div className="modal-wrap" id="modal-wrap" onClick={onBackdrop}>
      <div className="modal" id="modal">
        {modal.kind === "confirmNewRun" && (
          <>
            <h3>发现未完成的冒险</h3>
            <p className="dim">继续旧存档，还是开始新的冒险？</p>
            <div className="m-actions">
              <button
                className="btn btn-primary"
                onClick={() => {
                  closeModal();
                  AudioEngine.sfx("click");
                  if (continueRun()) AudioEngine.bgm("map");
                }}
              >
                继续冒险
              </button>
              <button
                className="btn"
                onClick={() => {
                  closeModal();
                  AudioEngine.sfx("click");
                  setScreen("starter");
                }}
              >
                新的冒险（覆盖旧档）
              </button>
              <button className="btn" onClick={closeModal}>
                取消
              </button>
            </div>
          </>
        )}

        {modal.kind === "confirmWipe" && (
          <>
            <h3>确认清除？</h3>
            <p className="dim">
              将删除存档、图鉴收藏、错题本和所有设置，不可恢复。
            </p>
            <div className="m-actions">
              <button
                className="btn btn-danger"
                onClick={() => {
                  wipeAll();
                  closeModal();
                  showToast("数据已清除");
                  AudioEngine.bgm("title");
                }}
              >
                确认清除
              </button>
              <button className="btn" onClick={closeModal}>
                取消
              </button>
            </div>
          </>
        )}

        {modal.kind === "team" && run && (
          <>
            <h3>
              我的队伍（{run.team.length}/{GAME_CONST.MAX_TEAM}）
            </h3>
            <div className="team-modal-list">
              {run.team.map((inst, i) => {
                const p = PKMN_BY_ID[inst.id];
                if (!p) return null;
                const max = pokeMaxHp(inst, run.hpBonus);
                const pct = Math.max(0, Math.min(100, (inst.hp / max) * 100));
                return (
                  <div className="tm-poke" key={`${inst.id}-${i}`}>
                    <img src={ICON(inst.id)} alt={p.c} />
                    <div className="tm-info">
                      <div className="tm-name">
                        {p.c}{" "}
                        <span className={`tag ${RARITY_CSS[p.r]}`}>
                          {RARITY_LABEL[p.r]}
                        </span>
                        {i === run.activeIdx && (
                          <span className="tag tag-c">出战中</span>
                        )}
                      </div>
                      <div className="tm-sub">
                        Lv.{inst.lv} · XP {inst.xp}/{xpNeed(inst.lv)} · 攻击{" "}
                        {pokeAtk(inst, run.atkBonus)} · 速度 {pokeSpeed(p)}
                      </div>
                      <div className="tm-hpbar">
                        <i style={{ width: `${pct}%` }} />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
            <p className="dim" style={{ marginTop: 10 }}>
              精灵球 🔴×{run.balls} 🔵×{run.superBalls} · 伤药 ×{run.potions}
            </p>
            <div className="m-actions">
              <button className="btn" onClick={closeModal}>
                关闭
              </button>
            </div>
          </>
        )}

        {modal.kind === "dexDetail" && (() => {
          const p = PKMN_BY_ID[modal.id];
          if (!p) return null;
          const d = meta.dex[String(p.id)] || { seen: 0, caught: 0 };
          const tiers: string[] = [];
          if (GAME_CONST.TIER1_LEGEND.includes(p.id)) tiers.push("一级神");
          if (GAME_CONST.TIER2_LEGEND.includes(p.id)) tiers.push("二级神");
          if (GAME_CONST.MYTHICAL.includes(p.id)) tiers.push("幻兽");
          return (
            <>
              <div className="capture-pkmn">
                <img
                  src={ICON(p.id)}
                  alt={p.c}
                  style={{ width: 120, height: 100 }}
                />
              </div>
              <h3 style={{ textAlign: "center" }}>
                No.{String(p.id).padStart(3, "0")} {p.c}
              </h3>
              <div style={{ textAlign: "center", margin: "6px 0" }}>
                <span className={`tag ${RARITY_CSS[p.r]}`}>
                  {RARITY_LABEL[p.r]}
                </span>
                {tiers.map((t) => (
                  <span key={t} className="tag tag-l">
                    {t}
                  </span>
                ))}
              </div>
              <div className="capture-info">
                基础 HP {baseHp(p)} · 速度 {pokeSpeed(p)}
                <br />
                遇见 {d.seen} 次 · 捕获 {d.caught} 次{" "}
                {d.caught ? "✅ 已收藏" : ""}
              </div>
              <div className="m-actions">
                <button className="btn" onClick={closeModal}>
                  关闭
                </button>
              </div>
            </>
          );
        })()}

        {modal.kind === "capture" && battle && run && (() => {
          const e = battle.enemy;
          const ep = PKMN_BY_ID[e.id];
          if (!ep) return null;
          const cn = catchChance(ep.r, "normal");
          const cs = catchChance(ep.r, "super");
          return (
            <>
              <h3>捕获机会！</h3>
              <div className="capture-pkmn">
                <img src={ICON(e.id)} alt={ep.c} />
              </div>
              <div className="capture-info">
                <b style={{ color: "var(--txt)" }}>{ep.c}</b>{" "}
                <span className={`tag ${RARITY_CSS[ep.r]}`}>
                  {RARITY_LABEL[ep.r]}
                </span>
                <br />
                精灵球 {(cn * 100).toFixed(0)}% · 超级球 {(cs * 100).toFixed(0)}
                %
                {run.team.length >= GAME_CONST.MAX_TEAM && (
                  <>
                    <br />
                    <span style={{ color: "var(--gold)" }}>
                      队伍已满，捕获后需替换或放生
                    </span>
                  </>
                )}
              </div>
              <div className="ball-row">
                <button
                  className="ball-btn"
                  disabled={run.balls <= 0}
                  onClick={() => onCapture?.("normal")}
                >
                  <span className="b-icon">🔴</span>
                  精灵球
                  <br />
                  <span className="b-cnt">×{run.balls}</span>
                </button>
                <button
                  className="ball-btn"
                  disabled={run.superBalls <= 0}
                  onClick={() => onCapture?.("super")}
                >
                  <span className="b-icon">🔵</span>
                  超级球
                  <br />
                  <span className="b-cnt">×{run.superBalls}</span>
                </button>
              </div>
              <div className="m-actions">
                <button
                  className="btn"
                  onClick={() => {
                    AudioEngine.sfx("flee");
                    onSkipCapture?.();
                  }}
                >
                  放过它（直接离开）
                </button>
              </div>
            </>
          );
        })()}

        {modal.kind === "teamFull" && run && (() => {
          const ep = PKMN_BY_ID[modal.catchId];
          if (!ep) return null;
          return (
            <>
              <h3>队伍已满</h3>
              <p className="dim" style={{ marginBottom: 10 }}>
                选择一只替换为 {ep.c}，或放生获得 40 金币
              </p>
              <div className="team-modal-list">
                {run.team.map((inst, i) => {
                  const p = PKMN_BY_ID[inst.id];
                  if (!p) return null;
                  return (
                    <div className="tm-poke" key={`${inst.id}-${i}`}>
                      <img src={ICON(inst.id)} alt={p.c} />
                      <div className="tm-info">
                        <div className="tm-name">
                          {p.c} Lv.{inst.lv}
                        </div>
                        <div className="tm-sub">
                          HP {inst.hp}/{pokeMaxHp(inst, run.hpBonus)}
                        </div>
                      </div>
                      <button
                        className="btn btn-mini"
                        onClick={() => {
                          AudioEngine.sfx("click");
                          replaceTeamMember(i, modal.catchId, modal.lv);
                        }}
                      >
                        替换
                      </button>
                    </div>
                  );
                })}
              </div>
              <div className="m-actions">
                <button
                  className="btn"
                  onClick={() => {
                    AudioEngine.sfx("click");
                    releaseCatch(modal.catchId);
                  }}
                >
                  放生 {ep.c}（+40 金币）
                </button>
              </div>
            </>
          );
        })()}
      </div>
    </div>
  );
}
