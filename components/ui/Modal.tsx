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
import { getEventById } from "@/lib/events";
import type { BallType, RunState } from "@/lib/types";

type Props = {
  onCapture?: (ball: BallType) => void;
  onSkipCapture?: () => void;
};

const BALL_META: Record<
  BallType,
  { icon: string; name: string; css: string }
> = {
  normal: { icon: "🔴", name: "精灵球", css: "ball-normal" },
  great: { icon: "🔵", name: "超级球", css: "ball-great" },
  ultra: { icon: "🟡", name: "高级球", css: "ball-ultra" },
  master: { icon: "⭐", name: "大师球", css: "ball-master" },
};

const CAPTURE_BALLS: BallType[] = ["normal", "great", "ultra", "master"];

function ballCount(run: RunState, id: BallType): number {
  if (id === "normal") return run.balls;
  if (id === "great") return run.greatBalls;
  if (id === "ultra") return run.ultraBalls;
  return run.masterBalls;
}

function inventoryLine(run: RunState): string {
  const parts = [
    `🔴×${run.balls}`,
    `🔵×${run.greatBalls}`,
    `🟡×${run.ultraBalls}`,
  ];
  if (run.masterBalls > 0) parts.push(`⭐×${run.masterBalls}`);
  return parts.join(" ");
}

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
  const resolveEventChoice = useGameStore((s) => s.resolveEventChoice);
  const claimTreasure = useGameStore((s) => s.claimTreasure);
  const dismissEventOrTreasure = useGameStore((s) => s.dismissEventOrTreasure);

  if (!modal) return null;

  const onBackdrop = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      // don't close capture / teamFull by accident during battle flow
      if (modal.kind === "capture" || modal.kind === "teamFull") return;
      // event/treasure: force skip (node already done, no re-grant)
      if (modal.kind === "event" || modal.kind === "treasure") {
        dismissEventOrTreasure();
        return;
      }
      closeModal();
    }
  };

  return (
    <div className="modal-wrap" id="modal-wrap" onClick={onBackdrop}>
      <div
        className={
          "modal" +
          (modal.kind === "dexDetail" ? " modal-dex" : "") +
          (modal.kind === "capture" ? " modal-capture" : "") +
          (modal.kind === "event" ? " modal-event" : "") +
          (modal.kind === "treasure" ? " modal-treasure" : "")
        }
        id="modal"
      >
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
              {inventoryLine(run)} · 伤药 ×{run.potions}
            </p>
            <div className="m-actions">
              <button className="btn" onClick={closeModal}>
                关闭
              </button>
            </div>
          </>
        )}

        {modal.kind === "dexDetail" &&
          (() => {
            const p = PKMN_BY_ID[modal.id];
            if (!p) return null;
            const d = meta.dex[String(p.id)] || { seen: 0, caught: 0 };
            const tiers: string[] = [];
            if (GAME_CONST.TIER1_LEGEND.includes(p.id)) tiers.push("一级神");
            if (GAME_CONST.TIER2_LEGEND.includes(p.id)) tiers.push("二级神");
            if (GAME_CONST.MYTHICAL.includes(p.id)) tiers.push("幻兽");
            const owned = d.caught > 0;
            return (
              <>
                <div
                  className={`dex-detail-card r-${p.r}${owned ? " caught" : ""}`}
                >
                  <span className="dex-card-foil" aria-hidden />
                  <span className="dex-card-frame" aria-hidden />
                  <div className="dex-detail-top">
                    <span className="dex-detail-id">
                      No.{String(p.id).padStart(3, "0")}
                    </span>
                    <span className={`tag ${RARITY_CSS[p.r]}`}>
                      {RARITY_LABEL[p.r]}
                    </span>
                  </div>
                  <div className="dex-detail-art">
                    <img src={ICON(p.id)} alt={p.c} draggable={false} />
                  </div>
                  <h3 className="dex-detail-name">{p.c}</h3>
                  <div className="dex-detail-en dim">{p.n}</div>
                  {(tiers.length > 0 || owned) && (
                    <div className="dex-detail-tags">
                      {tiers.map((t) => (
                        <span key={t} className="tag tag-l">
                          {t}
                        </span>
                      ))}
                      {owned && <span className="tag tag-c">已收藏</span>}
                    </div>
                  )}
                  <div className="dex-detail-stats">
                    <div>
                      <span className="dds-k">基础 HP</span>
                      <span className="dds-v">{baseHp(p)}</span>
                    </div>
                    <div>
                      <span className="dds-k">速度</span>
                      <span className="dds-v">{pokeSpeed(p)}</span>
                    </div>
                    <div>
                      <span className="dds-k">遇见</span>
                      <span className="dds-v">{d.seen}</span>
                    </div>
                    <div>
                      <span className="dds-k">捕获</span>
                      <span className="dds-v">{d.caught}</span>
                    </div>
                  </div>
                </div>
                <div className="m-actions">
                  <button className="btn" onClick={closeModal}>
                    关闭
                  </button>
                </div>
              </>
            );
          })()}

        {modal.kind === "capture" &&
          battle &&
          run &&
          (() => {
            const e = battle.enemy;
            const ep = PKMN_BY_ID[e.id];
            if (!ep) return null;
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
                  {run.team.length >= GAME_CONST.MAX_TEAM && (
                    <>
                      <br />
                      <span style={{ color: "var(--gold)" }}>
                        队伍已满，捕获后需替换或放生
                      </span>
                    </>
                  )}
                </div>
                <div className="ball-row ball-row-wrap">
                  {CAPTURE_BALLS.map((id) => {
                    const metaBall = BALL_META[id];
                    const count = ballCount(run, id);
                    const rate = catchChance(ep.r, id);
                    const pct = rate >= 1 ? "100" : (rate * 100).toFixed(0);
                    return (
                      <button
                        key={id}
                        type="button"
                        className={`ball-btn ${metaBall.css}${
                          id === "master" ? " master" : ""
                        }`}
                        disabled={count <= 0}
                        onClick={() => onCapture?.(id)}
                      >
                        <span className="b-icon">{metaBall.icon}</span>
                        <span className="b-name">{metaBall.name}</span>
                        <span className="b-rate">{pct}%</span>
                        <span className="b-cnt">×{count}</span>
                      </button>
                    );
                  })}
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

        {modal.kind === "teamFull" &&
          run &&
          (() => {
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

        {modal.kind === "treasure" && (
          <>
            <h3>🎁 发现宝箱！</h3>
            <p className="dim" style={{ marginBottom: 12 }}>
              你打开了路边的宝箱，获得了：
            </p>
            <div className="treasure-list" id="treasure-list">
              {modal.rewards.map((r, i) => (
                <div className="treasure-item" key={`${r.kind}-${i}`}>
                  <span className="ti-icon">{r.icon}</span>
                  <span className="ti-label">{r.label}</span>
                </div>
              ))}
            </div>
            <div className="m-actions">
              <button
                className="btn btn-primary"
                id="btn-treasure-ok"
                onClick={() => {
                  AudioEngine.sfx("coin");
                  claimTreasure();
                }}
              >
                收下
              </button>
            </div>
          </>
        )}

        {modal.kind === "event" &&
          (() => {
            const evt = getEventById(modal.eventId);
            if (!evt) {
              return (
                <>
                  <h3>❓ 事件</h3>
                  <p className="dim">事件数据丢失</p>
                  <div className="m-actions">
                    <button
                      className="btn"
                      onClick={() => dismissEventOrTreasure()}
                    >
                      离开
                    </button>
                  </div>
                </>
              );
            }
            return (
              <>
                <h3 id="event-title">❓ {evt.title}</h3>
                <p className="dim event-text" id="event-text">
                  {evt.text}
                </p>
                <div className="event-choices" id="event-choices">
                  {evt.choices.map((c, i) => (
                    <button
                      key={i}
                      type="button"
                      className="btn event-choice-btn"
                      onClick={() => {
                        AudioEngine.sfx("click");
                        resolveEventChoice(i);
                      }}
                    >
                      {c.label}
                    </button>
                  ))}
                </div>
              </>
            );
          })()}
      </div>
    </div>
  );
}
