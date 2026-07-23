"use client";

import { useEffect, useMemo, useState } from "react";
import { QUESTIONS } from "@/data";
import { useGameStore } from "@/lib/store";
import { clamp } from "@/lib/formulas";
import { AudioEngine } from "@/lib/audio";
import type { Question } from "@/data";

const REV_PAGE = 40;
const KEYS = ["A", "B", "C", "D", "E"];

export default function ReviewScreen() {
  const meta = useGameStore((s) => s.meta);
  const setScreen = useGameStore((s) => s.setScreen);
  const [search, setSearch] = useState("");
  const [wrongOnly, setWrongOnly] = useState(false);
  const [page, setPage] = useState(0);
  const [openIds, setOpenIds] = useState<Record<string, boolean>>({});
  const [quiz, setQuiz] = useState<{
    qs: Question[];
    idx: number;
    score: number;
    phase: "q" | "result";
    picked: number | null;
  } | null>(null);

  // allow store meta mutation for quiz — use getState carefully
  const wrongCount = Object.keys(meta.wrongQ).length;

  const list = useMemo(() => {
    let arr = QUESTIONS as Question[];
    if (wrongOnly) arr = arr.filter((q) => meta.wrongQ[q.id]);
    const s = search.trim();
    if (s) {
      arr = arr.filter(
        (q) => q.q.includes(s) || q.opts.some((o) => o.includes(s)),
      );
    }
    return arr;
  }, [wrongOnly, search, meta.wrongQ]);

  const pages = Math.max(1, Math.ceil(list.length / REV_PAGE));
  // 筛选变化时回到第一页
  useEffect(() => {
    setPage(0);
  }, [wrongOnly, search]);
  // wrongQ 收缩导致 pages 变少时，把 page 夹回合法范围（与 ref revPage=clamp 后 prev/next 一致）
  useEffect(() => {
    setPage((p) => clamp(p, 0, pages - 1));
  }, [pages]);
  const revPage = clamp(page, 0, pages - 1);
  const slice = list.slice(revPage * REV_PAGE, revPage * REV_PAGE + REV_PAGE);

  function openQuiz() {
    const pool = QUESTIONS.slice() as Question[];
    const qs: Question[] = [];
    while (qs.length < 10 && pool.length) {
      qs.push(pool.splice(Math.floor(Math.random() * pool.length), 1)[0]!);
    }
    setQuiz({ qs, idx: 0, score: 0, phase: "q", picked: null });
  }

  function answerQuiz(i: number) {
    if (!quiz || quiz.phase !== "q" || quiz.picked !== null) return;
    const q = quiz.qs[quiz.idx]!;
    const ok = i === q.ans;
    const st = useGameStore.getState();
    const meta2 = structuredClone(st.meta);
    if (ok) {
      AudioEngine.sfx("correct");
      delete meta2.wrongQ[q.id];
      meta2.totalCorrect++;
    } else {
      AudioEngine.sfx("wrong");
      meta2.wrongQ[q.id] = 1;
    }
    meta2.totalAnswered++;
    useGameStore.setState({ meta: meta2 });
    st.saveMeta();

    const nextScore = quiz.score + (ok ? 1 : 0);
    setQuiz({ ...quiz, picked: i, score: nextScore });
    setTimeout(() => {
      const nextIdx = quiz.idx + 1;
      if (nextIdx < 10) {
        setQuiz({
          qs: quiz.qs,
          idx: nextIdx,
          score: nextScore,
          phase: "q",
          picked: null,
        });
      } else {
        if (nextScore >= 9) AudioEngine.sfx("fanfare");
        setQuiz({
          qs: quiz.qs,
          idx: nextIdx,
          score: nextScore,
          phase: "result",
          picked: null,
        });
      }
    }, 900);
  }

  return (
    <section className="screen active" id="scr-review">
      <div className="page-head row">
        <button
          className="btn btn-mini back"
          data-back
          onClick={() => {
            AudioEngine.sfx("click");
            setScreen("title");
          }}
        >
          ‹ 返回
        </button>
        <h2>题库复习</h2>
        <button
          className="btn btn-mini"
          id="btn-quiz"
          onClick={() => {
            AudioEngine.sfx("click");
            openQuiz();
          }}
        >
          模拟练习
        </button>
      </div>
      <div className="review-bar">
        <input
          type="search"
          id="review-search"
          placeholder="搜索题目关键词…"
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setPage(0);
          }}
        />
        <button
          className={"chip" + (wrongOnly ? " active" : "")}
          id="chip-wrong"
          onClick={() => {
            setWrongOnly((v) => !v);
            setPage(0);
          }}
        >
          只看错题 (<span id="wrong-count">{wrongCount}</span>)
        </button>
      </div>
      <div className="review-list" id="review-list">
        {slice.map((q) => {
          const wrong = !!meta.wrongQ[q.id];
          const isOpen = !!openIds[q.id];
          return (
            <div
              key={q.id}
              className={"rev-card" + (isOpen ? " open" : "")}
              onClick={() => {
                AudioEngine.sfx("click");
                setOpenIds((m) => ({ ...m, [q.id]: !m[q.id] }));
              }}
            >
              <div className="rq">
                {wrong ? "🔴 " : ""}
                {q.q}
              </div>
              <div className="ra">
                {q.opts.map((o, i) => (
                  <div key={i} className={i === q.ans ? "ok" : "no"}>
                    {KEYS[i]}. {o.replace(/^[A-E]\.\s*/, "")}
                    {i === q.ans ? " ✓" : ""}
                  </div>
                ))}
              </div>
              <div className="rid">
                {q.id}
                {wrong ? " · 错题" : ""} · 点击查看答案
              </div>
            </div>
          );
        })}
      </div>
      <div className="review-pager">
        <button
          className="btn btn-mini"
          id="pg-prev"
          onClick={() =>
            setPage((p) => Math.max(0, clamp(p, 0, pages - 1) - 1))
          }
        >
          上一页
        </button>
        <span id="pg-info">
          {revPage + 1}/{pages} · 共 {list.length} 题
        </span>
        <button
          className="btn btn-mini"
          id="pg-next"
          onClick={() =>
            setPage((p) => Math.min(pages - 1, clamp(p, 0, pages - 1) + 1))
          }
        >
          下一页
        </button>
      </div>

      {quiz && (
        <div
          className="modal-wrap"
          onClick={(e) => {
            if (e.target === e.currentTarget && quiz.phase === "result") {
              setQuiz(null);
            }
          }}
        >
          <div className="modal">
            {quiz.phase === "q" && (() => {
              const q = quiz.qs[quiz.idx]!;
              return (
                <>
                  <h3>
                    模拟练习 {quiz.idx + 1}/10
                  </h3>
                  <div
                    style={{
                      fontSize: 15,
                      lineHeight: 1.6,
                      marginBottom: 12,
                    }}
                  >
                    {q.q}
                  </div>
                  <div className="m-actions" id="quiz-opts">
                    {q.opts.map((o, i) => {
                      let extra = "";
                      if (quiz.picked !== null) {
                        if (i === q.ans) extra = " correct";
                        else if (i === quiz.picked) extra = " wrong";
                      }
                      return (
                        <button
                          key={i}
                          className={"btn opt-btn" + extra}
                          data-i={i}
                          onClick={() => answerQuiz(i)}
                          style={
                            quiz.picked !== null
                              ? { pointerEvents: "none" }
                              : undefined
                          }
                        >
                          <span className="opt-key">{KEYS[i]}</span>
                          <span>{o.replace(/^[A-E]\.\s*/, "")}</span>
                        </button>
                      );
                    })}
                  </div>
                </>
              );
            })()}
            {quiz.phase === "result" && (() => {
              const pass = quiz.score >= 9;
              return (
                <>
                  <h3 style={{ textAlign: "center" }}>
                    {pass ? "🎉 合格！" : "继续努力"}
                  </h3>
                  <div
                    style={{
                      textAlign: "center",
                      fontSize: 44,
                      fontWeight: 900,
                      color: pass ? "var(--gold)" : "var(--red)",
                      margin: "12px 0",
                    }}
                  >
                    {quiz.score * 10}
                    <span style={{ fontSize: 16, color: "var(--dim)" }}>
                      /100
                    </span>
                  </div>
                  <p className="dim" style={{ textAlign: "center" }}>
                    科目一合格线为 90 分
                    {pass
                      ? "，你已具备上路理论资格！"
                      : "，错题已加入错题本。"}
                  </p>
                  <div className="m-actions">
                    <button
                      className="btn btn-primary"
                      onClick={() => setQuiz(null)}
                    >
                      完成
                    </button>
                  </div>
                </>
              );
            })()}
          </div>
        </div>
      )}
    </section>
  );
}
