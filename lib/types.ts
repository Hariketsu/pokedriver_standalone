import type { Rarity, Pokemon, Question } from "@/data";

export type { Rarity, Pokemon, Question };

export type Difficulty = "easy" | "normal" | "hard";

export type Settings = {
  bgm: number;
  sfx: number;
  shake: boolean;
  diff: Difficulty;
};

export type DexEntry = {
  seen: number;
  caught: number;
};

export type MetaState = {
  dex: Record<string, DexEntry>;
  bestScore: number;
  runs: number;
  wins: number;
  totalCorrect: number;
  totalAnswered: number;
  maxComboEver: number;
  totalCaught: number;
  wrongQ: Record<string, number>;
  settings: Settings;
};

export type TeamMember = {
  id: number;
  lv: number;
  xp: number;
  hp: number;
};

export type NodeType = "battle" | "elite" | "shop" | "rest" | "boss" | "boss2";

export type MapNode = {
  c: number;
  type: NodeType;
  edges: number[];
  x: number;
  y: number;
  done: boolean;
};

export type MapPos = {
  f: number;
  i: number;
};

export type RunState = {
  mapRows: MapNode[][];
  pos: MapPos;
  gold: number;
  goldEarned: number;
  balls: number;
  superBalls: number;
  potions: number;
  bigPotions: number;
  teamPotions: number;
  revives: number;
  atkBonus: number;
  hpBonus: number;
  team: TeamMember[];
  activeIdx: number;
  usedQ: Record<string, number>;
  combo: number;
  maxCombo: number;
  captures: number;
  bossKills: number;
  floorsCleared: number;
  answered: number;
  correct: number;
  startTime: number;
};

export type EnemyState = {
  id: number;
  hp: number;
  maxHp: number;
  atk: number;
  isBoss: boolean;
  nodeType: NodeType;
  title: string;
};

export type BattlePhase = "intro" | "question" | "anim" | "won";

export type BattleState = {
  node: MapNode;
  enemy: EnemyState;
  phase: BattlePhase;
  q: Question | null;
  timeLeft: number;
  timeTotal: number;
  locked: boolean;
  captured: boolean;
  switchUsed: boolean;
};

export type ScreenId =
  | "title"
  | "starter"
  | "map"
  | "battle"
  | "shop"
  | "rest"
  | "dex"
  | "review"
  | "settings"
  | "over";

export type BallType = "normal" | "super";

export type RestOptionId = "campfire" | "train" | "meditate";

export type ShopItemId =
  | "potion"
  | "bigPotion"
  | "teamSpray"
  | "balls"
  | "superBalls"
  | "atkBadge"
  | "hpOrb"
  | "revive"
  | "xpBook";

export type ShopItemDef = {
  id: ShopItemId;
  icon: string;
  name: string;
  desc: string;
  price: number;
  can: (run: RunState) => boolean;
};

export type StarterDef = {
  id: number;
  desc: string;
};

export type GameOverInfo = {
  win: boolean;
  score: number;
  isRecord: boolean;
  floorsCleared: number;
  goldEarned: number;
  correct: number;
  answered: number;
  maxCombo: number;
  captures: number;
  minutes: number;
};

export type ToastState = {
  message: string;
  ms: number;
  id: number;
} | null;

/** Structured modal payloads for UI (no ReactNode in store). */
export type ModalState =
  | { kind: "capture" }
  | { kind: "teamFull"; catchId: number; lv: number }
  | { kind: "confirmNewRun" }
  | { kind: "confirmWipe" }
  | { kind: "team" }
  | { kind: "dexDetail"; id: number }
  | null;

export type BattleFxEvent =
  | { type: "playerAttack"; dmg: number; crit: boolean; fast: boolean }
  | { type: "enemyAttack"; dmg: number }
  | { type: "playerFaint"; id: number }
  | { type: "enemyKo" }
  | { type: "levelUp"; id: number; lv: number }
  | { type: "captureStart"; success: boolean; ball: BallType }
  | { type: "captureResult"; success: boolean; id: number }
  | { type: "timeout" }
  | { type: "wrong" }
  | { type: "correct" }
  | { type: "heal" }
  | { type: "switch"; id: number }
  | { type: "bossAppear" }
  | { type: "wildAppear" };

export type AnswerOutcome =
  | {
      correct: true;
      fast: boolean;
      dmg: number;
      crit: boolean;
      goldGain: number;
      enemyDefeated: boolean;
    }
  | {
      correct: false;
      timedOut: boolean;
      q: Question;
    };
