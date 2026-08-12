"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { QUESTIONS } from "@/data";
import { useGameStore } from "@/lib/store";
import { AudioEngine } from "@/lib/audio";
import Icon from "@/components/ui/Icon";
import SceneBg from "@/components/ui/SceneBg";
import {
  EXAM_PASS_SCORE,
  EXAM_Q_COUNT,
  canStartExam,
  countAnswered,
  createExamSession,
  examRemainingMs,
  formatMmSs,
  scoreExam,
  type ExamResultItem,
  type ExamSession,
} from "@/lib/exam";

const KEYS = ["A", "B", "C", "D", "E"];

export default function ExamScreen() {
  const setScreen = useGameStore((s) => s.setScreen);
  const bankOk = canStartExam(QUESTIONS);
  const [session, setSession] = useState<ExamSession | null>(null);
  const [now, setNow] = useState(() => Date.now());
  const [confirmSubmit, setConfirmSubmit] = useState(false);
  const [confirmLeave, setConfirmLeave] = useState(false);
  const [resultWrongs, setResultWrongs] = useState<ExamResultItem[]>([]);
  const submittedRef = useRef(false);

  const remaining = session?.phase === "live" ? examRemainingMs(session, now) : 0;
  const answered = session ? countAnswered(session) : 0;
  const sessionRef = useRef<ExamSession | null>(null);
  const sessionPhase = session?.phase;
  const sessionEndsAt = session?.endsAt;

  const finishExam = useCallback((timedOut: boolean) => {
    const sess = sessionRef.current;
    if (!sess || sess.phase !== "live" || submittedRef.current) return;
    submittedRef.current = true;

    const { score, wrongs } = scoreExam(sess);
    const st = useGameStore.getState();
    // 未答 / 答错均记入错题本；正确不清除（计划锁定）
    st.recordExamWrongs(wrongs.map((item) => item.q.id));
    const meta = structuredClone(useGameStore.getState().meta);
    meta.totalAnswered += sess.qs.length;
    meta.totalCorrect += score;
    useGameStore.setState({ meta });
    useGameStore.getState().saveMeta();

    if (score >= EXAM_PASS_SCORE) AudioEngine.sfx("fanfare");
    else AudioEngine.sfx("defeat");

    const resultSession: ExamSession = {
      ...sess,
      phase: "result",
      score,
      timedOut,
      submittedAt: Date.now(),
    };
    sessionRef.current = resultSession;
    setResultWrongs(wrongs);
    setConfirmSubmit(false);
    setSession(resultSession);
  }, []);
  useEffect(() => {
    sessionRef.current = session;
  }, [session]);

  // 倒计时 tick + 超时自动交卷（读 ref，避免答案更新后闭包过期）
  useEffect(() => {
    if (sessionPhase !== "live") return;
    const id = window.setInterval(() => {
      const t = Date.now();
      setNow(t);
      const s = sessionRef.current;
      if (s && s.phase === "live" && t >= s.endsAt) {
        finishExam(true);
      }
    }, 250);
    return () => window.clearInterval(id);
  }, [sessionPhase, sessionEndsAt, finishExam]);

  function startExam() {
    if (!bankOk) return;
    AudioEngine.sfx("click");
    submittedRef.current = false;
    setResultWrongs([]);
    const s = createExamSession(QUESTIONS);
    if (!s) return;
    sessionRef.current = s;
    setSession(s);
    setNow(Date.now());
  }

  function pickOpt(i: number) {
    if (!session || session.phase !== "live") return;
    const q = session.qs[session.idx];
    if (!q) return;
    AudioEngine.sfx("click");
    setSession({
      ...session,
      answers: { ...session.answers, [q.id]: i },
    });
  }

  function goIdx(idx: number) {
    if (!session || session.phase !== "live") return;
    const next = Math.max(0, Math.min(session.qs.length - 1, idx));
    if (next === session.idx) return;
    AudioEngine.sfx("click");
    setSession({ ...session, idx: next });
  }

  function toggleFlag() {
    if (!session || session.phase !== "live") return;
    const q = session.qs[session.idx];
    if (!q) return;
    AudioEngine.sfx("click");
    setSession({
      ...session,
      flagged: { ...session.flagged, [q.id]: !session.flagged[q.id] },
    });
  }

  function requestSubmit() {
    if (!session || session.phase !== "live") return;
    AudioEngine.sfx("click");
    setConfirmSubmit(true);
  }

  function leaveToTitle() {
    AudioEngine.sfx("click");
    if (session?.phase === "live") {
      setConfirmLeave(true);
      return;
    }
    setSession(null);
    setScreen("study");
  }

  const currentQ = session?.qs[session.idx];
  const chosen =
    session && currentQ ? (session.answers[currentQ.id] ?? null) : null;
  const flagged =
    session && currentQ ? !!session.flagged[currentQ.id] : false;

  const timerUrgent = remaining > 0 && remaining <= 5 * 60 * 1000;
  const timeUsedLabel = useMemo(() => {
    if (!session || session.phase !== "result") return "";
    const end = session.timedOut
      ? session.endsAt
      : session.submittedAt!;
    const ms = Math.min(
      Math.max(0, end - session.startedAt),
      session.endsAt - session.startedAt,
    );
    return formatMmSs(ms);
  }, [session]);

  // ---- intro ----
  if (!session) {
    return (
      <section className="screen active has-scene" id="scr-exam">
        <SceneBg name="over-lose" soft />
        <div className="page-head row">
          <button
            className="btn btn-mini back"
            data-back
            onClick={() => {
              AudioEngine.sfx("click");
              setScreen("study");
            }}
          >
            <Icon name="icon-back" size={13} alt="" /> 返回
          </button>
          <h2>科目一模拟</h2>
          <div style={{ width: 56 }} />
        </div>
        <div className="exam-intro">
          <div className="exam-intro-card">
            <div className="exam-intro-badge">正式模考</div>
            <h3>100 题 · 45 分钟</h3>
            <ul className="exam-rules">
              <li>从题库无放回抽取 {EXAM_Q_COUNT} 道题</li>
              <li>限时 45:00，到时自动交卷</li>
              <li>合格线 {EXAM_PASS_SCORE}/100（仅展示，可自由交卷）</li>
              <li>可前后跳转、标记存疑题</li>
              <li>错题计入错题本（答对不自动清除）</li>
            </ul>
            <p className="dim exam-bank-meta">
              当前题库 {QUESTIONS.length} 题
              {!bankOk ? " · 题库不足 100，无法开考" : ""}
            </p>
            <button
              className="btn btn-primary"
              id="btn-exam-start"
              disabled={!bankOk}
              onClick={startExam}
            >
              开始考试
            </button>
          </div>
        </div>
      </section>
    );
  }

  // ---- result ----
  if (session.phase === "result") {
    const score = session.score ?? 0;
    const pass = score >= EXAM_PASS_SCORE;
    return (
      <section className="screen active has-scene" id="scr-exam">
        <SceneBg name="over-lose" soft />
        <div className="page-head row">
          <button
            className="btn btn-mini back"
            data-back
            onClick={() => {
              AudioEngine.sfx("click");
              setSession(null);
              setScreen("study");
            }}
          >
            <Icon name="icon-back" size={13} alt="" /> 返回
          </button>
          <h2>考试结果</h2>
          <div style={{ width: 56 }} />
        </div>
        <div className="exam-result">
          <div className={"exam-score" + (pass ? " pass" : " fail")}>
            {score}
            <span className="exam-score-max">/100</span>
          </div>
          <div className="exam-stamp">
            <Icon name={pass ? "stamp-pass" : "stamp-fail"} size={64} />
          </div>
          <div className={"exam-verdict" + (pass ? " pass" : "")}>
            {session.timedOut ? "时间到 · " : ""}
            {pass ? "合格" : "未合格"}
          </div>
          <p className="dim" style={{ textAlign: "center" }}>
            用时 {timeUsedLabel} · 答对 {score} · 错/未答 {EXAM_Q_COUNT - score}
            <br />
            科目一合格线 {EXAM_PASS_SCORE} 分
          </p>
          {resultWrongs.length > 0 && (
            <div className="exam-wrong-list" id="exam-wrong-list">
              <div className="exam-wrong-head">
                错题 / 未答（{resultWrongs.length}）
              </div>
              {resultWrongs.slice(0, 30).map((item) => (
                <div key={item.q.id} className="exam-wrong-row">
                  <div className="ew-q">{item.q.q}</div>
                  <div className="ew-a">
                    正解：{KEYS[item.q.ans]}.{" "}
                    {item.q.opts[item.q.ans]?.replace(/^[A-E]\.\s*/, "")}
                    {item.chosen === null
                      ? " · 未作答"
                      : item.chosen !== item.q.ans
                        ? ` · 你的：${KEYS[item.chosen]}`
                        : ""}
                  </div>
                </div>
              ))}
              {resultWrongs.length > 30 && (
                <p className="dim" style={{ textAlign: "center" }}>
                  另有 {resultWrongs.length - 30} 题已写入错题本
                </p>
              )}
            </div>
          )}
          <div className="exam-result-actions">
            <button
              className="btn btn-primary"
              onClick={() => {
                AudioEngine.sfx("click");
                setSession(null);
                setScreen("wrong");
              }}
            >
              去错题本
            </button>
            <button
              className="btn"
              onClick={() => {
                AudioEngine.sfx("click");
                submittedRef.current = false;
                setResultWrongs([]);
                setSession(null);
              }}
            >
              再考一次
            </button>
            <button
              className="btn"
              onClick={() => {
                AudioEngine.sfx("click");
                setSession(null);
                setScreen("study");
              }}
            >
              返回标题
            </button>
          </div>
        </div>
      </section>
    );
  }

  // ---- live ----
  return (
    <section className="screen active has-scene" id="scr-exam">
      <SceneBg name="over-lose" soft />
      <div className="exam-top">
        <button className="btn btn-mini back" data-back onClick={leaveToTitle}>
          ‹ 退出
        </button>
        <div
          className={"exam-timer" + (timerUrgent ? " urgent" : "")}
          id="exam-timer"
        >
          {formatMmSs(remaining)}
        </div>
        <div className="exam-progress">
          {session.idx + 1}/{session.qs.length}
          <span className="dim"> · 已答 {answered}</span>
        </div>
      </div>

      <div className="exam-body">
        <div className="exam-main">
          <div className="exam-q" id="exam-q">
            <span className="exam-q-no">第 {session.idx + 1} 题</span>
            {currentQ?.q}
          </div>
          <div className="exam-opts" id="exam-opts">
            {currentQ?.opts.map((o, i) => (
              <button
                key={i}
                type="button"
                className={
                  "btn opt-btn" + (chosen === i ? " exam-picked" : "")
                }
                data-i={i}
                onClick={() => pickOpt(i)}
              >
                <span className="opt-key">{KEYS[i]}</span>
                <span>{o.replace(/^[A-E]\.\s*/, "")}</span>
              </button>
            ))}
          </div>
          <div className="exam-controls">
            <button
              className="btn btn-mini"
              disabled={session.idx <= 0}
              onClick={() => goIdx(session.idx - 1)}
            >
              上一题
            </button>
            <button
              className={"btn btn-mini" + (flagged ? " exam-flag-on" : "")}
              onClick={toggleFlag}
            >
              {flagged ? (
                <>
                  <Icon name="item-star" size={14} /> 已标记
                </>
              ) : (
                "☆ 标记"
              )}
            </button>
            <button
              className="btn btn-mini"
              disabled={session.idx >= session.qs.length - 1}
              onClick={() => goIdx(session.idx + 1)}
            >
              下一题
            </button>
          </div>
        </div>

        <aside className="exam-nav" id="exam-nav">
          <div className="exam-nav-head">答题卡</div>
          <div className="exam-nav-grid">
            {session.qs.map((q, i) => {
              const a = session.answers[q.id];
              const fl = !!session.flagged[q.id];
              let cls = "exam-dot";
              if (i === session.idx) cls += " current";
              if (a !== null && a !== undefined) cls += " answered";
              if (fl) cls += " flagged";
              return (
                <button
                  key={q.id}
                  type="button"
                  className={cls}
                  onClick={() => goIdx(i)}
                  title={`第 ${i + 1} 题`}
                >
                  {i + 1}
                </button>
              );
            })}
          </div>
          <div className="exam-nav-legend">
            <span>
              <i className="exam-dot answered" /> 已答
            </span>
            <span>
              <i className="exam-dot flagged" /> 标记
            </span>
            <span>
              <i className="exam-dot current" /> 当前
            </span>
          </div>
          <button
            className="btn btn-primary"
            id="btn-exam-submit"
            onClick={requestSubmit}
          >
            交卷
          </button>
        </aside>
      </div>

      {confirmSubmit && (
        <div
          className="modal-wrap"
          onClick={(e) => {
            if (e.target === e.currentTarget) setConfirmSubmit(false);
          }}
        >
          <div className="modal">
            <h3>确认交卷？</h3>
            <p className="dim">
              已答 {answered}/{session.qs.length}
              {answered < session.qs.length
                ? `，还有 ${session.qs.length - answered} 题未作答`
                : ""}
              。交卷后不可修改。
            </p>
            <div className="m-actions">
              <button
                className="btn btn-primary"
                onClick={() => finishExam(false)}
              >
                确认交卷
              </button>
              <button
                className="btn"
                onClick={() => {
                  AudioEngine.sfx("click");
                  setConfirmSubmit(false);
                }}
              >
                继续答题
              </button>
            </div>
          </div>
        </div>
      )}

      {confirmLeave && (
        <div
          className="modal-wrap"
          onClick={(e) => {
            if (e.target === e.currentTarget) setConfirmLeave(false);
          }}
        >
          <div className="modal">
            <h3>退出考试？</h3>
            <p className="dim">当前进度不会保存，退出后需重新开考。</p>
            <div className="m-actions">
              <button
                className="btn btn-danger"
                onClick={() => {
                  AudioEngine.sfx("click");
                  setConfirmLeave(false);
                  setSession(null);
                  setScreen("study");
                }}
              >
                确认退出
              </button>
              <button
                className="btn"
                onClick={() => {
                  AudioEngine.sfx("click");
                  setConfirmLeave(false);
                }}
              >
                继续考试
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
