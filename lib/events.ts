import { grantXpTo, pokeMaxHp, rand } from "./formulas";
import type { MetaState, RunState, TreasureReward } from "./types";

export type EventChoice = {
  label: string;
  /** Mutates cloned run/meta only; store commits after. */
  apply: (run: RunState, meta: MetaState) => { toast?: string };
};

export type EventDef = {
  id: string;
  title: string;
  text: string;
  choices: EventChoice[];
};

const EVENT_POOL: EventDef[] = [
  {
    id: "evt_hot_spring",
    title: "温泉",
    text: "你发现了一处安静的温泉，蒸汽里飘着淡淡的硫磺味。要泡一会儿吗？",
    choices: [
      {
        label: "泡温泉（全队存活回复 40% HP）",
        apply: (run) => {
          run.team.forEach((p) => {
            if (p.hp > 0) {
              const max = pokeMaxHp(p, run.hpBonus);
              p.hp = Math.min(max, p.hp + Math.ceil(max * 0.4));
            }
          });
          return { toast: "全队恢复了体力" };
        },
      },
      {
        label: "继续前进",
        apply: () => ({ toast: "你没有停留" }),
      },
    ],
  },
  {
    id: "evt_merchant",
    title: "神秘商人",
    text: "一位戴兜帽的商人拦住你：「30 金币换 2 颗超级球，如何？」",
    choices: [
      {
        label: "支付 30 金币（+2 超级球）",
        apply: (run) => {
          if (run.gold < 30) return { toast: "金币不足" };
          run.gold -= 30;
          run.greatBalls += 2;
          run.superBalls = run.greatBalls;
          return { toast: "获得超级球 ×2" };
        },
      },
      {
        label: "婉拒",
        apply: () => ({ toast: "商人耸耸肩离开了" }),
      },
    ],
  },
  {
    id: "evt_trainer_quiz",
    title: "训练师挑战",
    text: "路过的训练师想和你比试运气：稳妥拿 20 金币，或赌一把？",
    choices: [
      {
        label: "稳妥：+20 金币",
        apply: (run) => {
          run.gold += 20;
          run.goldEarned += 20;
          return { toast: "+20 金币" };
        },
      },
      {
        label: "冒险：50% +50 金币，否则出战 -30% HP",
        apply: (run) => {
          if (Math.random() < 0.5) {
            run.gold += 50;
            run.goldEarned += 50;
            return { toast: "赌赢了！+50 金币" };
          }
          const a = run.team[run.activeIdx];
          if (a && a.hp > 0) {
            const max = pokeMaxHp(a, run.hpBonus);
            a.hp = Math.max(1, a.hp - Math.ceil(max * 0.3));
          }
          return { toast: "赌输了……出战宝可梦受伤" };
        },
      },
      {
        label: "走开",
        apply: () => ({}),
      },
    ],
  },
  {
    id: "evt_center",
    title: "野外治疗机",
    text: "一台老旧的宝可梦中心治疗机还在运转。",
    choices: [
      {
        label: "治疗出战宝可梦（回满 HP）",
        apply: (run) => {
          const a = run.team[run.activeIdx];
          if (a && a.hp > 0) {
            a.hp = pokeMaxHp(a, run.hpBonus);
            return { toast: "出战宝可梦完全恢复" };
          }
          return { toast: "没有可治疗的宝可梦" };
        },
      },
      {
        label: "继续赶路",
        apply: () => ({}),
      },
    ],
  },
  {
    id: "evt_study",
    title: "路旁自习室",
    text: "有人留下了科目一错题笔记。要复习一下吗？",
    choices: [
      {
        label: "复习错题（清除最多 2 道错题）",
        apply: (_run, meta) => {
          const keys = Object.keys(meta.wrongQ);
          let n = 0;
          for (let i = 0; i < 2 && keys.length; i++) {
            const k = keys.splice(Math.floor(Math.random() * keys.length), 1)[0]!;
            delete meta.wrongQ[k];
            n++;
          }
          return {
            toast: n ? `清除了 ${n} 道错题` : "错题本已经是空的",
          };
        },
      },
      {
        label: "做练习（出战 +10 XP）",
        apply: (run) => {
          const a = run.team[run.activeIdx];
          if (!a) return {};
          const leveled = grantXpTo(a, 10, run.hpBonus);
          return {
            toast: leveled ? `经验提升，升到了 Lv.${a.lv}！` : "+10 XP",
          };
        },
      },
    ],
  },
];

export function getEventById(id: string): EventDef | undefined {
  return EVENT_POOL.find((e) => e.id === id);
}

export function pickEvent(): EventDef {
  return EVENT_POOL[Math.floor(Math.random() * EVENT_POOL.length)]!;
}

type TreasureRoll = {
  kind: TreasureReward["kind"];
  weight: number;
  amount: () => number;
  label: (n: number) => string;
  icon: string;
};

const TREASURE_TABLE: TreasureRoll[] = [
  {
    kind: "gold",
    weight: 40,
    amount: () => rand(25, 45),
    label: (n) => `金币 +${n}`,
    icon: "💰",
  },
  {
    kind: "balls",
    weight: 20,
    amount: () => 2,
    label: (n) => `精灵球 +${n}`,
    icon: "🔴",
  },
  {
    kind: "greatBalls",
    weight: 12,
    amount: () => 1,
    label: (n) => `超级球 +${n}`,
    icon: "🔵",
  },
  {
    kind: "ultraBalls",
    weight: 5,
    amount: () => 1,
    label: (n) => `高级球 +${n}`,
    icon: "🟡",
  },
  {
    kind: "potion",
    weight: 15,
    amount: () => 1,
    label: (n) => `伤药 +${n}`,
    icon: "🧪",
  },
  {
    kind: "xp",
    weight: 8,
    amount: () => 15,
    label: (n) => `出战经验 +${n}`,
    icon: "✨",
  },
];

function rollOneTreasure(): TreasureReward {
  const total = TREASURE_TABLE.reduce((s, r) => s + r.weight, 0);
  let roll = Math.random() * total;
  for (const row of TREASURE_TABLE) {
    roll -= row.weight;
    if (roll <= 0) {
      const amount = row.amount();
      return {
        kind: row.kind,
        amount,
        label: row.label(amount),
        icon: row.icon,
      };
    }
  }
  const fallback = TREASURE_TABLE[0]!;
  const amount = fallback.amount();
  return {
    kind: fallback.kind,
    amount,
    label: fallback.label(amount),
    icon: fallback.icon,
  };
}

/** Roll 1–2 treasure rewards (no skill cards). */
export function rollTreasureRewards(_floor?: number): TreasureReward[] {
  void _floor;
  const count = Math.random() < 0.45 ? 2 : 1;
  const out: TreasureReward[] = [];
  for (let i = 0; i < count; i++) out.push(rollOneTreasure());
  return out;
}

/** Apply treasure rewards to a cloned run. */
export function applyTreasureRewards(
  run: RunState,
  rewards: TreasureReward[],
): string {
  const parts: string[] = [];
  for (const r of rewards) {
    switch (r.kind) {
      case "gold":
        run.gold += r.amount;
        run.goldEarned += r.amount;
        break;
      case "balls":
        run.balls += r.amount;
        break;
      case "greatBalls":
        run.greatBalls += r.amount;
        run.superBalls = run.greatBalls;
        break;
      case "ultraBalls":
        run.ultraBalls += r.amount;
        break;
      case "potion":
        run.potions += r.amount;
        break;
      case "xp": {
        const a = run.team[run.activeIdx];
        if (a) grantXpTo(a, r.amount, run.hpBonus);
        break;
      }
    }
    parts.push(r.label);
  }
  return parts.join(" · ");
}
