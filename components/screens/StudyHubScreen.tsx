"use client";

import { useGameStore } from "@/lib/store";
import { AudioEngine } from "@/lib/audio";
import { QUESTIONS } from "@/data";
import { EXAM_QUESTION_COUNT } from "@/data/constants";

export default function StudyHubScreen() {
  const setScreen = useGameStore((s) => s.setScreen);
  const wrongCount = Object.keys(useGameStore((s) => s.meta.wrongQ)).length;
  const bankOk = QUESTIONS.length >= EXAM_QUESTION_COUNT;

  function go(id: "exam" | "wrong" | "review" | "title") {
    AudioEngine.sfx("click");
    setScreen(id);
  }

  return (
    <section className="screen active" id="scr-study">
      <div className="page-head row">
        <button
          type="button"
          className="btn btn-mini back"
          data-back
          onClick={() => go("title")}
        >
          ‹ 返回
        </button>
        <h2>学习中心</h2>
        <span style={{ width: 52 }} />
      </div>

      <div className="study-hub">
        <p className="study-hub-lead dim">
          正式模考与错题巩固放在这里，首页只保留冒险主路径。
        </p>

        <button
          type="button"
          className="study-card study-card-primary"
          id="btn-hub-exam"
          disabled={!bankOk}
          onClick={() => bankOk && go("exam")}
        >
          <div className="sc-icon">📝</div>
          <div className="sc-body">
            <div className="sc-title">科目一模拟</div>
            <div className="sc-desc">
              100 题 · 45 分钟 · 全真节奏（推荐）
            </div>
          </div>
          <div className="sc-chev">›</div>
        </button>

        <button
          type="button"
          className="study-card"
          id="btn-hub-wrong"
          onClick={() => go("wrong")}
        >
          <div className="sc-icon">📕</div>
          <div className="sc-body">
            <div className="sc-title">
              错题本
              {wrongCount > 0 && (
                <span className="sc-badge">{wrongCount}</span>
              )}
            </div>
            <div className="sc-desc">
              {wrongCount > 0
                ? `${wrongCount} 题待复习 · 答对可移出`
                : "暂无错题 · 模考或冒险答错后收录"}
            </div>
          </div>
          <div className="sc-chev">›</div>
        </button>

        <button
          type="button"
          className="study-card"
          id="btn-hub-review"
          onClick={() => go("review")}
        >
          <div className="sc-icon">📚</div>
          <div className="sc-body">
            <div className="sc-title">题库浏览</div>
            <div className="sc-desc">
              搜索 / 分页查阅 · 含 10 题快速练习
            </div>
          </div>
          <div className="sc-chev">›</div>
        </button>

        {!bankOk && (
          <p className="dim study-hub-note">
            当前题库不足 {EXAM_QUESTION_COUNT} 题，无法开启正式模考。
          </p>
        )}
      </div>
    </section>
  );
}
