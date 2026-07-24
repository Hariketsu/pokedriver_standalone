import { GAME_CONST, QUESTIONS, type Question } from "@/data";

/** 科一模拟：100 题 / 45 分钟 — values from GAME_CONST (single source). */
export const EXAM_Q_COUNT = GAME_CONST.EXAM_QUESTION_COUNT;
export const EXAM_DURATION_MS = GAME_CONST.EXAM_TIME_MS;
export const EXAM_PASS_SCORE = GAME_CONST.EXAM_PASS_LINE;

export type ExamPhase = "intro" | "live" | "result";

export type ExamSession = {
  qs: Question[];
  idx: number;
  /** q.id → chosen option index；未答为 null */
  answers: Record<string, number | null>;
  flagged: Record<string, boolean>;
  startedAt: number;
  endsAt: number;
  phase: ExamPhase;
  score?: number;
  /** 交卷时是否因超时 */
  timedOut?: boolean;
  /** 实际交卷时刻（result 用时） */
  submittedAt?: number;
};

export type ExamResultItem = {
  q: Question;
  chosen: number | null;
  correct: boolean;
};

/** 无放回随机抽 n 题；题库不足时返回全部打乱结果 */
export function sampleExamQuestions(
  n = EXAM_Q_COUNT,
  bank: readonly Question[] = QUESTIONS,
): Question[] {
  const pool = bank.slice();
  for (let i = pool.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    const t = pool[i]!;
    pool[i] = pool[j]!;
    pool[j] = t;
  }
  return pool.slice(0, Math.min(n, pool.length));
}

export function canStartExam(bank: readonly Question[] = QUESTIONS): boolean {
  return bank.length >= EXAM_Q_COUNT;
}

export function createExamSession(
  bank: readonly Question[] = QUESTIONS,
): ExamSession | null {
  if (!canStartExam(bank)) return null;
  const qs = sampleExamQuestions(EXAM_Q_COUNT, bank);
  const answers: Record<string, number | null> = {};
  for (const q of qs) answers[q.id] = null;
  const startedAt = Date.now();
  return {
    qs,
    idx: 0,
    answers,
    flagged: {},
    startedAt,
    endsAt: startedAt + EXAM_DURATION_MS,
    phase: "live",
  };
}

export function formatMmSs(ms: number): string {
  const total = Math.max(0, Math.ceil(ms / 1000));
  const m = Math.floor(total / 60);
  const s = total % 60;
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

export function examRemainingMs(session: ExamSession, now = Date.now()): number {
  return Math.max(0, session.endsAt - now);
}

export function countAnswered(session: ExamSession): number {
  let n = 0;
  for (const q of session.qs) {
    if (session.answers[q.id] !== null && session.answers[q.id] !== undefined) n++;
  }
  return n;
}

export function scoreExam(session: ExamSession): {
  score: number;
  wrongs: ExamResultItem[];
  items: ExamResultItem[];
} {
  const items: ExamResultItem[] = [];
  const wrongs: ExamResultItem[] = [];
  let score = 0;
  for (const q of session.qs) {
    const chosen = session.answers[q.id] ?? null;
    const correct = chosen !== null && chosen === q.ans;
    const item: ExamResultItem = { q, chosen, correct };
    items.push(item);
    if (correct) score++;
    else wrongs.push(item);
  }
  return { score, wrongs, items };
}

/** 从 wrongQ 映射取出题目列表，按错次降序；缺失 id 跳过 */
export function listWrongQuestions(
  wrongQ: Record<string, number>,
  bank: readonly Question[] = QUESTIONS,
): { q: Question; fails: number }[] {
  const byId = new Map(bank.map((q) => [q.id, q]));
  const rows: { q: Question; fails: number }[] = [];
  for (const [id, fails] of Object.entries(wrongQ)) {
    const q = byId.get(id);
    if (!q) continue;
    rows.push({ q, fails: Number.isFinite(fails) ? fails : 1 });
  }
  rows.sort((a, b) => b.fails - a.fails || a.q.id.localeCompare(b.q.id));
  return rows;
}

/** 错题本练习用：仅 wrongQ 中的题，打乱顺序 */
export function sampleWrongPool(
  wrongQ: Record<string, number>,
  bank: readonly Question[] = QUESTIONS,
): Question[] {
  return listWrongQuestions(wrongQ, bank)
    .map((r) => r.q)
    .sort(() => Math.random() - 0.5);
}
