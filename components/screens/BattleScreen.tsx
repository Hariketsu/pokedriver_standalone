"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useGameStore, selectScore } from "@/lib/store";
import {
  PKMN_BY_ID,
  RARITY_CSS,
  RARITY_LABEL,
  clamp,
  pokeMaxHp,
  xpNeed,
} from "@/lib/formulas";
import { ICON } from "@/lib/icon";
import SceneBg from "@/components/ui/SceneBg";
import Icon from "@/components/ui/Icon";
import { AudioEngine } from "@/lib/audio";
import { BattleFX } from "@/lib/fx3d";
import { spawnDmg, spawnFxText, domBurst } from "@/lib/dom-fx";
import type { BallType } from "@/lib/types";

const KEYS = ["A", "B", "C", "D", "E"];

/** 跨 Strict Mode remount 去重，避免同一次答题触发两次敌方攻击 */
const PROCESSED_ANSWER_IDS = new Set<number>();
const PROCESSED_ANSWER_CAP = 200;
/** 捕获动画进行中，防止连点连扣精灵球 */
let captureInFlight = false;

export default function BattleScreen() {
  const run = useGameStore((s) => s.run);
  const battle = useGameStore((s) => s.battle);
  const score = useGameStore(selectScore);
  const meta = useGameStore((s) => s.meta);
  const nextQuestion = useGameStore((s) => s.nextQuestion);
  const tickTimer = useGameStore((s) => s.tickTimer);
  const answer = useGameStore((s) => s.answer);
  const commitPlayerHit = useGameStore((s) => s.commitPlayerHit);
  const commitEnemyHit = useGameStore((s) => s.commitEnemyHit);
  const resolvePlayerFaint = useGameStore((s) => s.resolvePlayerFaint);
  const trySwitch = useGameStore((s) => s.trySwitch);
  const useBattlePotion = useGameStore((s) => s.useBattlePotion);
  const openCapture = useGameStore((s) => s.openCapture);
  const lastAnswer = useGameStore((s) => s.lastAnswer);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fxLayerRef = useRef<HTMLDivElement>(null);
  const [fxOk, setFxOk] = useState(false);
  const [optState, setOptState] = useState<
    Record<number, "correct" | "wrong" | "reveal" | undefined>
  >({});
  const [lockedOpts, setLockedOpts] = useState(false);
  const [comboBump, setComboBump] = useState(0);
  const flowLock = useRef(false);
  const processedAnswer = useRef<typeof lastAnswer>(null);
  /** 区分每一场战斗（同 enemy id 也可能连续两场） */
  const battleKey =
    battle && run
      ? `${run.pos.f}-${run.pos.i}-${battle.enemy.id}-${battle.enemy.maxHp}`
      : "";

  const shakeScreen = useCallback(() => {
    if (!meta.settings.shake) return;
    const w = document.getElementById("shake-wrap");
    if (!w) return;
    w.classList.remove("shaking");
    void w.offsetWidth;
    w.classList.add("shaking");
  }, [meta.settings.shake]);

  // Init BattleFX on mount；卸载时 dispose，避免 canvas 脱离 DOM 后仍画到旧节点
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    let ok = false;
    try {
      ok = BattleFX.init(canvas);
    } catch {
      ok = false;
    }
    setFxOk(!!ok);
    if (ok) BattleFX.setRunning(true);
    return () => {
      captureInFlight = false;
      BattleFX.setRunning(false);
      BattleFX.dispose();
      setFxOk(false);
    };
  }, []);

  // 只在出战 id / 敌人 id 变化时重建 3D 精灵（不要依赖整个 battle/run，否则 10Hz 计时会反复重建）
  const playerId = run?.team[run.activeIdx]?.id;
  const enemyId = battle?.enemy.id;
  const enemyRarity = enemyId != null ? PKMN_BY_ID[enemyId]?.r : undefined;
  const enemyIsBoss = battle?.enemy.isBoss;
  const combo = run?.combo ?? 0;

  useEffect(() => {
    if (!fxOk || !BattleFX.ok || playerId == null || enemyId == null || !enemyRarity)
      return;
    BattleFX.setEnemy(enemyId, enemyRarity, !!enemyIsBoss);
    BattleFX.setPlayer(playerId);
  }, [fxOk, playerId, enemyId, enemyRarity, enemyIsBoss]);

  useEffect(() => {
    if (!fxOk || !BattleFX.ok) return;
    BattleFX.comboAura(combo);
  }, [fxOk, combo]);

  // Intro FX only — 第一题由 store.startBattle 延迟调度（避免 Strict Mode cleanup + 双调度连出两题）
  useEffect(() => {
    if (!battle || !battleKey) return;
    if (battle.phase !== "intro") return;

    const e = battle.enemy;
    const ep = PKMN_BY_ID[e.id];
    const layer = fxLayerRef.current;
    const boss = e.isBoss;
    AudioEngine.bgm(boss ? "boss" : "battle");
    if (boss) {
      AudioEngine.sfx("boss");
      shakeScreen();
    }
    spawnFxText(
      layer,
      50,
      40,
      boss
        ? `${e.title} ${ep?.c ?? ""} 出现！`
        : `野生的 ${ep?.c ?? ""} 出现了！`,
      boss ? "#ff0044" : "#00f0ff",
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [battleKey]);

  // Timer tick（不要依赖整个 battle 对象，否则每 0.1s setState 都会重启 interval）
  useEffect(() => {
    if (!battle || battle.phase !== "question" || battle.locked) return;
    const id = setInterval(() => tickTimer(0.1), 100);
    return () => clearInterval(id);
  }, [battle?.phase, battle?.locked, battle?.q?.id, tickTimer]);

  // Reset opt UI when new question
  useEffect(() => {
    if (battle?.phase === "question" && battle.q) {
      setOptState({});
      setLockedOpts(false);
      flowLock.current = false;
      processedAnswer.current = null;
    }
  }, [battle?.q?.id, battle?.phase]);

  // Process answer outcome → combat FX
  useEffect(() => {
    if (!lastAnswer || !battle || !run) return;
    if (PROCESSED_ANSWER_IDS.has(lastAnswer.id)) return;
    if (processedAnswer.current === lastAnswer) return;
    PROCESSED_ANSWER_IDS.add(lastAnswer.id);
    if (PROCESSED_ANSWER_IDS.size > PROCESSED_ANSWER_CAP) {
      // 简单裁剪：清空后只保留本次 id（战斗跨度内 id 单调递增，旧 id 无意义）
      PROCESSED_ANSWER_IDS.clear();
      PROCESSED_ANSWER_IDS.add(lastAnswer.id);
    }
    processedAnswer.current = lastAnswer;
    if (flowLock.current) return;
    flowLock.current = true;

    const layer = fxLayerRef.current;
    const q = battle.q;

    if (lastAnswer.correct) {
      setLockedOpts(true);
      setComboBump((n) => n + 1);
      const { dmg, crit, fast } = lastAnswer;
      AudioEngine.sfx("correct");
      setTimeout(() => AudioEngine.sfx("coin"), 250);
      if (BattleFX.ok) BattleFX.comboAura(run.combo);

      // 与原版一致：动画命中帧再扣血 / 结算胜利
      const doHit = () => {
        const hit = commitPlayerHit(dmg);
        AudioEngine.sfx(crit ? "crit" : "hit");
        if (crit) shakeScreen();
        spawnDmg(layer, 66, 38, `-${dmg}`, crit ? "#ffd700" : "#ff6688", crit);
        if (crit) spawnFxText(layer, 66, 30, "暴击！", "#ffd700");
        if (fast) spawnFxText(layer, 30, 55, "快速作答 +1", "#00f0ff");
        domBurst(layer, 66, 42, crit ? "#ffd700" : "#ff6688", crit ? 22 : 12);
        if (hit?.enemyDefeated) {
          setTimeout(() => handleWin(hit.goldWin, hit.leveled), 650);
        } else {
          setTimeout(() => {
            flowLock.current = false;
            nextQuestion();
          }, 800);
        }
      };

      if (BattleFX.ok) BattleFX.attack("player", { crit }, doHit);
      else doHit();
    } else {
      setLockedOpts(true);
      if (q) {
        setOptState((s) => ({
          ...s,
          [q.ans]: "reveal",
        }));
      }
      if (lastAnswer.timedOut) {
        AudioEngine.sfx("timeout");
        spawnFxText(layer, 50, 30, "超时！", "#ff8800");
      } else {
        AudioEngine.sfx("wrong");
      }
      if (BattleFX.ok) BattleFX.comboAura(0);
      setTimeout(
        () => doEnemyAttack(),
        lastAnswer.timedOut ? 500 : 750,
      );
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lastAnswer]);

  function handleWin(goldWin: number, leveled: number) {
    const layer = fxLayerRef.current;
    AudioEngine.sfx("victory");

    const after = () => {
      spawnFxText(layer, 50, 40, `胜利！+${goldWin} 金币`, "#ffd700");
      domBurst(layer, 50, 40, "#ffd700", 24);
      if (leveled > 0) {
        const r = useGameStore.getState().run;
        const active = r?.team[r.activeIdx];
        const name = active ? PKMN_BY_ID[active.id]?.c ?? "" : "";
        const lv = active?.lv ?? 0;
        AudioEngine.sfx("levelup");
        spawnFxText(layer, 28, 50, `${name} 升到 Lv.${lv}！`, "#00ff88");
        if (BattleFX.ok) BattleFX.heal("player");
        domBurst(layer, 28, 55, "#00ff88", 18);
      }
      setTimeout(() => openCapture(), 1100);
    };

    if (BattleFX.ok) BattleFX.ko("enemy", after);
    else after();
  }

  function doEnemyAttack() {
    const layer = fxLayerRef.current;
    // 与原版一致：先播攻击动画，命中帧再扣血
    const doHit = () => {
      const res = commitEnemyHit();
      if (!res) {
        flowLock.current = false;
        return;
      }
      AudioEngine.sfx("hurt");
      shakeScreen();
      spawnDmg(layer, 28, 55, `-${res.dmg}`, "#ff0044");
      domBurst(layer, 28, 60, "#ff0044", 12);
      if (res.fainted) {
        setTimeout(() => handleFaint(res.wiped), 650);
      } else {
        setTimeout(() => {
          flowLock.current = false;
          nextQuestion();
        }, 800);
      }
    };
    if (BattleFX.ok) BattleFX.attack("enemy", {}, doHit);
    else doHit();
  }

  function handleFaint(_wipedAtImpact: boolean) {
    const layer = fxLayerRef.current;
    const r0 = useGameStore.getState().run;
    if (!r0) return;
    const active = r0.team[r0.activeIdx];
    const name = active ? PKMN_BY_ID[active.id]?.c ?? "" : "";
    AudioEngine.sfx("ko");
    spawnFxText(layer, 28, 50, `${name} 倒下了…`, "#8fa3cf");

    const after = () => {
      // 与原版一致：KO 动画后再查存活；期间用伤药可能救回全灭判定
      const fr = resolvePlayerFaint();
      if (!fr || fr.wiped) return;
      if (fr.nextId != null && BattleFX.ok) BattleFX.setPlayer(fr.nextId);
      const nn = PKMN_BY_ID[fr.nextId!]?.c ?? "";
      spawnFxText(layer, 28, 55, `加油，${nn}！`, "#00ff88");
      setTimeout(() => {
        flowLock.current = false;
        nextQuestion();
      }, 700);
    };
    if (BattleFX.ok) BattleFX.ko("player", after);
    else after();
  }

  function onAnswer(idx: number) {
    if (!battle || battle.locked || lockedOpts) return;
    const res = answer(idx);
    if (!res) return;
    if (res.correct) {
      setOptState({ [idx]: "correct" });
    } else {
      setOptState({
        [idx]: "wrong",
        [res.revealAns]: "reveal",
      });
    }
    setLockedOpts(true);
  }

  function onSwitch(i: number) {
    const ok = trySwitch(i);
    if (!ok) return;
    AudioEngine.sfx("switchP");
    const r = useGameStore.getState().run;
    const inst = r?.team[i];
    if (inst) {
      if (BattleFX.ok) BattleFX.setPlayer(inst.id);
      spawnFxText(
        fxLayerRef.current,
        24,
        62,
        `换上 ${PKMN_BY_ID[inst.id]?.c ?? ""}！`,
        "#00ff88",
      );
    }
  }

  function onPotion() {
    const ok = useBattlePotion();
    if (!ok) return;
    AudioEngine.sfx("heal");
    if (BattleFX.ok) BattleFX.heal("player");
    spawnFxText(fxLayerRef.current, 28, 55, "+HP 恢复", "#00ff88");
    domBurst(fxLayerRef.current, 28, 58, "#00ff88", 14);
  }

  if (!run || !battle) return null;

  const e = battle.enemy;
  const ep = PKMN_BY_ID[e.id];
  const active = run.team[run.activeIdx]!;
  const ap = PKMN_BY_ID[active.id];
  const eHpPct = clamp((e.hp / e.maxHp) * 100, 0, 100);
  const pMax = pokeMaxHp(active, run.hpBonus);
  const pHpPct = clamp((active.hp / pMax) * 100, 0, 100);
  const timerK =
    battle.timeTotal > 0
      ? clamp(battle.timeLeft / battle.timeTotal, 0, 1)
      : 1;
  const dimmed = battle.phase === "won" || battle.phase === "intro";

  return (
    <section className="screen active" id="scr-battle">
      <div className="battle-stage has-scene">
        <SceneBg name="battle" />
        <canvas id="battle-canvas" ref={canvasRef} />
        <div
          id="battle-fallback"
          className={fxOk ? "hidden" : undefined}
        >
          <img id="fb-player" alt="" src={ICON(active.id)} />
          <img id="fb-enemy" alt="" src={ICON(e.id)} />
        </div>
        <div className="battle-topbar">
          <div className="bt-item" id="bt-floor">
            {run.pos.f + 1}F
          </div>
          <div className="bt-item gold" id="bt-gold">
            {run.gold} 金
          </div>
          <div className="bt-item" id="bt-score">
            {score}分
          </div>
          {run.combo >= 2 && (
            <div
              className="combo-badge"
              id="combo-badge"
              key={comboBump}
            >
              COMBO ×{run.combo}
            </div>
          )}
        </div>
        <div className="enemy-card" id="enemy-card">
          <div className="ec-name" id="enemy-name">
            {ep?.c ?? "???"}
            {e.isBoss ? (
              <Icon name="item-star" size={14} alt="BOSS" />
            ) : null}
          </div>
          <div className="ec-hp">
            <div
              className="ec-hp-fill"
              id="enemy-hp-fill"
              style={{ width: `${eHpPct}%` }}
            />
            <span id="enemy-hp-text">
              {Math.max(0, e.hp)}/{e.maxHp}
            </span>
          </div>
          <div className="ec-tags" id="enemy-tags">
            {ep && (
              <span className={`tag ${RARITY_CSS[ep.r]}`}>
                {RARITY_LABEL[ep.r]}
              </span>
            )}
            {e.isBoss ? (
              <span className="tag tag-l">BOSS</span>
            ) : e.nodeType === "elite" ? (
              <span className="tag tag-r">精英</span>
            ) : null}
          </div>
        </div>
        <div className="player-card" id="player-card">
          <div className="pc-name" id="player-name">
            {ap?.c ?? "???"}
          </div>
          <div className="pc-hp">
            <div
              className={"pc-hp-fill" + (pHpPct <= 35 ? " low" : "")}
              id="player-hp-fill"
              style={{ width: `${pHpPct}%` }}
            />
            <span id="player-hp-text">
              {Math.max(0, active.hp)}/{pMax}
            </span>
          </div>
          <div className="pc-lv" id="player-lv">
            Lv.{active.lv} · XP {active.xp}/{xpNeed(active.lv)}
          </div>
          <div className="pc-xp" id="player-xp">
            <div
              className="pc-xp-fill"
              style={{
                width: `${clamp((active.xp / xpNeed(active.lv)) * 100, 0, 100)}%`,
              }}
            />
          </div>
        </div>
        <div className="fx-layer" id="fx-layer" ref={fxLayerRef} />
      </div>
      <div className="battle-panel">
        <div className="team-bar" id="team-bar">
          {run.team.map((inst, i) => {
            const max = pokeMaxHp(inst, run.hpBonus);
            const pct = clamp((inst.hp / max) * 100, 0, 100);
            return (
              <div
                key={`${inst.id}-${i}`}
                className={
                  "team-slot" +
                  (i === run.activeIdx ? " active" : "") +
                  (inst.hp <= 0 ? " fainted" : "")
                }
                title={PKMN_BY_ID[inst.id]?.c}
                onClick={() => onSwitch(i)}
              >
                <img src={ICON(inst.id)} alt="" />
                <div className="ts-hp">
                  <i style={{ width: `${pct}%` }} />
                </div>
              </div>
            );
          })}
        </div>
        <div
          className={"q-card" + (dimmed ? " dimmed" : "")}
          id="q-card"
        >
          <div className="q-timer">
            <div
              className={
                "q-timer-fill" + (timerK < 0.3 ? " low" : "")
              }
              id="q-timer-fill"
              style={{ width: `${timerK * 100}%` }}
            />
          </div>
          <div className="q-text" id="q-text">
            {battle.q?.q ?? ""}
          </div>
          <div
            className={"q-opts" + (lockedOpts ? " locked" : "")}
            id="q-opts"
          >
            {battle.q?.opts.map((opt, i) => {
              const text = opt.replace(/^[A-E]\.\s*/, "");
              const st = optState[i];
              return (
                <button
                  key={i}
                  className={
                    "opt-btn" +
                    (st === "correct"
                      ? " correct"
                      : st === "wrong"
                        ? " wrong"
                        : st === "reveal"
                          ? " reveal"
                          : "")
                  }
                  onClick={() => onAnswer(i)}
                >
                  <span className="opt-key">{KEYS[i]}</span>
                  <span>{text}</span>
                </button>
              );
            })}
          </div>
        </div>
        <div className="battle-actions">
          {run.potions > 0 && (
            <button
              className="btn btn-mini"
              id="btn-potion"
              onClick={onPotion}
            >
              <Icon name="item-potion" size={16} alt="伤药" /> 伤药×{run.potions}
            </button>
          )}
        </div>
      </div>
    </section>
  );
}

/** Capture helpers used by GameApp / Modal */
export function useBattleCaptureHandlers() {
  const doCapture = useGameStore((s) => s.doCapture);
  const skipCapture = useGameStore((s) => s.skipCapture);
  const addToTeam = useGameStore((s) => s.addToTeam);
  const openCapture = useGameStore((s) => s.openCapture);
  const endBattle = useGameStore((s) => s.endBattle);

  const handleCapture = useCallback(
    (ball: BallType) => {
      if (captureInFlight) return;
      captureInFlight = true;
      const res = doCapture(ball);
      if (!res) {
        captureInFlight = false;
        return;
      }
      AudioEngine.sfx("throwBall");
      const layer = document.getElementById("fx-layer");
      const finish = (ok: boolean) => {
        if (ok) {
          AudioEngine.sfx("caught");
          if (BattleFX.ok) setTimeout(() => BattleFX.endCapture(), 400);
          const ep = PKMN_BY_ID[res.catchId];
          spawnFxText(
            layer,
            50,
            38,
            `成功捕获 ${ep?.c ?? ""}！`,
            "#ffd700",
          );
          domBurst(layer, 50, 40, "#ffd700", 26);
          setTimeout(() => {
            captureInFlight = false;
            if (res.needsTeamSlot) {
              useGameStore.getState().openModal({
                kind: "teamFull",
                catchId: res.catchId,
                lv: res.lv,
              });
            } else {
              addToTeam(res.catchId, res.lv);
            }
          }, 900);
        } else {
          AudioEngine.sfx("escape");
          const ep = PKMN_BY_ID[res.catchId];
          spawnFxText(
            layer,
            50,
            38,
            `${ep?.c ?? ""} 挣脱了精灵球，逃走了…`,
            "#ff8800",
          );
          setTimeout(() => {
            captureInFlight = false;
            endBattle();
          }, 1200);
        }
      };

      if (BattleFX.ok) {
        BattleFX.capture({
          result: res.success,
          onShake: () => AudioEngine.sfx("ballShake"),
          onAbsorbed: () => AudioEngine.sfx("ballHit"),
          onResult: finish,
        });
      } else {
        setTimeout(() => finish(res.success), 1200);
      }
    },
    [doCapture, addToTeam, endBattle],
  );

  const handleSkip = useCallback(() => {
    if (captureInFlight) return;
    // flee sfx 由 Modal 按钮触发，这里不重复播放
    skipCapture();
  }, [skipCapture]);

  return { handleCapture, handleSkip, openCapture };
}
