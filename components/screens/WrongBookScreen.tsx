"use client";

import { useMemo, useState } from "react";
import { QUESTIONS, type Question } from "@/data";
import { useGameStore } from "@/lib/store";
import { AudioEngine } from "@/lib/audio";
import { listWrongQuestions, sampleWrongPool } from "@/lib/exam";
import Icon from "@/components/ui/Icon";

const KEYS = ["A", "B", "C", "D", "E"];

type Mode = "list" | "study";

type StudyState = {
  qs: Question[];
  idx: number;
  picked: number | null;
  revealed: boolean;
  masteredThisSession: number;
};

export default function WrongBookScreen() {
  const meta = useGameStore((s) => s.meta);
  const setScreen = useGameStore((s) => s.setScreen);
  const [mode, setMode] = useState<Mode>("list");
  const [search, setSearch] = useState("");
  const [openIds, setOpenIds] = useState<Record<string, boolean>>({});
  const [study, setStudy] = useState<StudyState | null>(null);
  /** 本会话累计掌握（列表/练习共用进度展示） */
  const [sessionMastered, setSessionMastered] = useState(0);

  const rows = useMemo(
    () => listWrongQuestions(meta.wrongQ, QUESTIONS),
    [meta.wrongQ],
  );

  const filtered = useMemo(() => {
    const s = search.trim();
    if (!s) return rows;
    return rows.filter(
      (r) =>
        r.q.q.includes(s) ||
        r.q.opts.some((o) => o.includes(s)) ||
        r.q.id.includes(s),
    );
  }, [rows, search]);

  const wrongCount = rows.length;

  function startStudy() {
    const qs = sampleWrongPool(meta.wrongQ, QUESTIONS);
    if (!qs.length) return;
    AudioEngine.sfx("click");
    setStudy({
      qs,
      idx: 0,
      picked: null,
      revealed: false,
      masteredThisSession: 0,
    });
    setMode("study");
  }

  function answerStudy(i: number) {
    if (!study || study.picked !== null) return;
    const q = study.qs[study.idx];
    if (!q) return;
    const ok = i === q.ans;
    const st = useGameStore.getState();
    let mastered = study.masteredThisSession;

    if (ok) {
      AudioEngine.sfx("correct");
      // 掌握：从错题本移除
      st.clearWrongQ(q.id);
      mastered++;
      setSessionMastered((n) => n + 1);
    } else {
      AudioEngine.sfx("wrong");
      st.recordExamWrongs([q.id]);
    }

    setStudy({
      ...study,
      picked: i,
      revealed: true,
      masteredThisSession: mastered,
    });
  }

  function nextStudy() {
    if (!study) return;
    AudioEngine.sfx("click");
    // 刷新池：已掌握的从剩余队列去掉
    const remaining = study.qs
      .slice(study.idx + 1)
      .filter((q) => useGameStore.getState().meta.wrongQ[q.id]);
    if (!remaining.length) {
      setStudy(null);
      setMode("list");
      return;
    }
    setStudy({
      qs: remaining,
      idx: 0,
      picked: null,
      revealed: false,
      masteredThisSession: study.masteredThisSession,
    });
  }

  function exitStudy() {
    AudioEngine.sfx("click");
    setStudy(null);
    setMode("list");
  }

  // ---- study mode ----
  if (mode === "study" && study) {
    const q = study.qs[study.idx];
    const done = !q;
    return (
      <section className="screen active" id="scr-wrong">
        <div className="page-head row">
          <button className="btn btn-mini back" data-back onClick={exitStudy}>
            ‹ 列表
          </button>
          <h2>错题练习</h2>
          <div className="wrong-progress" id="wrong-progress">
            待复习 {study.qs.filter((x) => meta.wrongQ[x.id]).length} · 已掌握{" "}
            {study.masteredThisSession}
          </div>
        </div>
        {done ? (
          <div className="wrong-empty">
            <p>本轮练习完成</p>
            <p className="dim">
              本轮掌握 {study.masteredThisSession} 题 · 本会话累计{" "}
              {sessionMastered} 题
            </p>
            <button className="btn btn-primary" onClick={exitStudy}>
              返回列表
            </button>
          </div>
        ) : (
          <div className="wrong-study" id="wrong-study">
            <div className="exam-q">
              <span className="exam-q-no">
                待复习 {study.idx + 1}/{study.qs.length} · 错次{" "}
                {meta.wrongQ[q.id] || 1}
              </span>
              {q.q}
            </div>
            <div className="exam-opts">
              {q.opts.map((o, i) => {
                let extra = "";
                if (study.revealed) {
                  if (i === q.ans) extra = " correct";
                  else if (i === study.picked) extra = " wrong";
                }
                return (
                  <button
                    key={i}
                    type="button"
                    className={"btn opt-btn" + extra}
                    data-i={i}
                    onClick={() => answerStudy(i)}
                    style={
                      study.picked !== null
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
            {study.revealed && (
              <div className="wrong-study-foot">
                <p className="dim">
                  {study.picked === q.ans
                    ? "答对了，已从错题本移除"
                    : `正解：${KEYS[q.ans]}. ${q.opts[q.ans]?.replace(/^[A-E]\.\s*/, "")}`}
                </p>
                <button className="btn btn-primary" onClick={nextStudy}>
                  {study.idx + 1 >= study.qs.length ||
                  study.qs
                    .slice(study.idx + 1)
                    .every((x) => !useGameStore.getState().meta.wrongQ[x.id])
                    ? "完成"
                    : "下一题"}
                </button>
              </div>
            )}
          </div>
        )}
      </section>
    );
  }

  // ---- list / empty ----
  return (
    <section className="screen active" id="scr-wrong">
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
        <h2>错题本</h2>
        <div className="wrong-progress" id="wrong-progress">
          待复习 {wrongCount}
          {sessionMastered > 0 ? ` · 本会话已掌握 ${sessionMastered}` : ""}
        </div>
      </div>

      {wrongCount === 0 ? (
        <div className="wrong-empty" id="wrong-list">
          <div className="wrong-empty-icon">
            <Icon name="stamp-pass" size={72} />
          </div>
          <p>暂无错题</p>
          <p className="dim">
            在模考或冒险中答错的题目会出现在这里。
            <br />
            练习答对即可掌握并移除。
          </p>
          <div className="wrong-empty-actions">
            <button
              className="btn btn-primary"
              onClick={() => {
                AudioEngine.sfx("click");
                setScreen("exam");
              }}
            >
              去模拟考试
            </button>
            <button
              className="btn"
              onClick={() => {
                AudioEngine.sfx("click");
                setScreen("review");
              }}
            >
              浏览题库
            </button>
          </div>
        </div>
      ) : (
        <>
          <div className="review-bar wrong-bar">
            <input
              type="search"
              id="wrong-search"
              placeholder="搜索错题…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            <button
              className="btn btn-mini btn-primary"
              id="btn-wrong-study"
              onClick={startStudy}
            >
              开始练习
            </button>
          </div>
          <div className="review-list" id="wrong-list">
            {filtered.map(({ q, fails }) => {
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
                    <Icon
                      name="item-ball-red"
                      size={14}
                      className="rq-ball"
                    />{" "}
                    {q.q}
                  </div>
                  <div className="ra">
                    {q.opts.map((o, i) => (
                      <div key={i} className={i === q.ans ? "ok" : "no"}>
                        {KEYS[i]}. {o.replace(/^[A-E]\.\s*/, "")}
                        {i === q.ans ? " ✓" : ""}
                      </div>
                    ))}
                    <div className="wrong-master-row">
                      <button
                        className="btn btn-mini"
                        onClick={(e) => {
                          e.stopPropagation();
                          AudioEngine.sfx("correct");
                          const st = useGameStore.getState();
                          const meta2 = structuredClone(st.meta);
                          delete meta2.wrongQ[q.id];
                          useGameStore.setState({ meta: meta2 });
                          st.saveMeta();
                        }}
                      >
                        标记已掌握
                      </button>
                    </div>
                  </div>
                  <div className="rid">
                    {q.id} · 错 {fails} 次 · 点击
                    {isOpen ? "收起" : "查看答案"}
                  </div>
                </div>
              );
            })}
            {filtered.length === 0 && (
              <p className="dim" style={{ textAlign: "center", padding: 24 }}>
                无匹配错题
              </p>
            )}
          </div>
        </>
      )}
    </section>
  );
}
