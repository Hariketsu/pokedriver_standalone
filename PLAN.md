# PLAN.md — pokedriver_standalone Next.js 迁移计划

> **目标**：将 617KB 单文件 HTML 应用（驾考保卫战 - 宝可梦版）改造为 Next.js 应用，部署到 Vercel，手机浏览器畅快访问。
>
> **创建日期**：2026-07-16

---

## 整体架构对比

```
迁移前                              迁移后
──────────────────────────        ──────────────────────────
pokedriver_standalone(20).html    app/
  ├─ <style> (内嵌 CSS)    →       ├─ layout.tsx (根布局)
  ├─ <body> DOM            →       ├─ page.tsx   (主页面)
  ├─ <script>               →       ├─ globals.css
  │   ├─ G 全局对象          →       ├─ components/ (React 组件树)
  │   ├─ 50+ 函数            →       ├─ lib/store.ts (Zustand)
  │   └─ DOM 操作            →       ├─ lib/pokemon.ts
  ├─ POKEMON_DATA (~120KB)   →       ├─ data/pokemon-data.ts
  ├─ POKEMON_ICONS (~400KB)  →       ├─ data/pokemon-icons.ts
  └─ BUILTIN_QUESTIONS       →       └─ data/questions.ts
```

---

## Phase 0: 项目初始化

### 0.1 脚手架
```bash
npx create-next-app@latest . --typescript --eslint --app --src-dir=false --tailwind=false --import-alias="@/*"
```

### 0.2 依赖安装
```bash
npm install zustand        # 状态管理（替代 G 全局对象）
```

不需要的依赖（明确排除）：
- ~~Tailwind CSS~~ — 保留原有 CSS 变量体系，避免大规模重写样式
- ~~React Router~~ — 单页三 Tab 切换，用 state 控制即可
- ~~TanStack Query~~ — 纯客户端游戏，无 API 调用

### 0.3 目录结构
```
pokedriver_standalone/
├── app/
│   ├── layout.tsx              # 根布局：viewport meta、字体、Canvas 背景
│   ├── page.tsx                # 主页面：三 Tab 切换、游戏状态协调
│   └── globals.css             # 从原 HTML 提取的全局样式
├── components/
│   ├── battle/
│   │   ├── GameArea.tsx        # 游戏区域（怪物跑道 + 防线 + 技能按钮）
│   │   ├── Monster.tsx         # 单个怪物（绝对定位 + CSS transition）
│   │   ├── MonsterLane.tsx     # 怪物跑道容器
│   │   ├── DefenseLine.tsx     # 防线（显示激活宝可梦）
│   │   ├── SkillButton.tsx     # 技能按钮 + 充能条
│   │   ├── QuestionPanel.tsx   # 题目 + 选项按钮
│   │   ├── UpgradePanel.tsx    # 升级面板
│   │   ├── GameOverOverlay.tsx # 游戏结束弹窗
│   │   ├── StartOverlay.tsx    # 开始界面
│   │   └── ComboNotify.tsx     # 连击提示
│   ├── pokedex/
│   │   ├── PokedexPanel.tsx    # 图鉴主面板
│   │   ├── PokemonCard.tsx     # 单个宝可梦卡片
│   │   └── GachaButton.tsx     # 抽卡按钮
│   ├── bank/
│   │   └── QuestionBank.tsx    # 题库面板
│   ├── layout/
│   │   ├── TabBar.tsx          # 顶部 Tab 切换
│   │   ├── Header.tsx          # 战斗页顶部状态栏
│   │   └── Footer.tsx          # 底部操作栏
│   └── ui/
│       ├── ParticleCanvas.tsx  # Canvas 粒子背景
│       ├── ConfirmDialog.tsx   # 确认弹窗
│       └── Toast.tsx           # 浮动提示
├── lib/
│   ├── store.ts                # Zustand store（游戏状态）
│   ├── pokemon.ts              # 宝可梦辅助函数（纯函数）
│   ├── questions.ts            # 题库逻辑（纯函数）
│   ├── game-engine.ts          # 游戏引擎核心逻辑
│   └── constants.ts            # 常量定义
├── data/
│   ├── pokemon-data.ts         # POKEMON_DATA（filtered，只含 i===1）
│   ├── pokemon-icons.ts        # POKEMON_ICONS base64 映射
│   └── questions-builtin.ts    # BUILTIN_QUESTIONS 内置题库
└── public/
    └── pokemon/
        └── icons/              # (可选) 将 base64 拆分为独立 PNG
```

---

## Phase 1: 数据拆分

### 1.1 提取 POKEMON_DATA → `data/pokemon-data.ts`

- 从 HTML 中提取 `POKEMON_DATA` 数组（约 1000+ 条目）
- 保留 `POKEMON_DATA.filter(p => p.i === 1)` 逻辑（即 PKM 变量）
- 导出类型定义：
```typescript
export interface PokemonEntry {
  id: number;
  n: string;    // 英文名
  c: string;    // 中文名
  r: 'c' | 'u' | 'r' | 'l';  // 稀有度
  i: 0 | 1;     // 是否有图标
}
```

### 1.2 提取 POKEMON_ICONS → `data/pokemon-icons.ts`

- 提取 `POKEMON_ICONS` 对象（`{ [id: number]: "data:image/png;base64,..." }`）
- 考虑使用 **动态 import** 延迟加载（不阻塞首屏渲染）
- 单体图标约 500-800 bytes base64，总计约 400KB
- **关键优化**：`ParticleCanvas` 和 `Monster` 渲染前不需要加载全部图标，按需从 map 取

### 1.3 提取 BUILTIN_QUESTIONS → `data/questions-builtin.ts`

- 约 200+ 道驾考题，类型定义：
```typescript
export interface Question {
  id: string;
  q: string;       // 题目文本
  opts: string[];  // 4 个选项
  ans: number;     // 正确答案索引 (0-based)
}
```

### 1.4 提取常量 → `lib/constants.ts`

```typescript
export const TIER1_LEGEND = new Set([150,249,250,382,383,384,483,484,487,493,643,644,646,716,717,718]);
export const TIER2_LEGEND = new Set([144,145,146,243,244,245,377,378,379,380,381,480,481,482,485,486,488,638,639,640,641,642,645]);
export const MYTHICAL_PKMN = new Set([151,251,385,386,489,490,491,492,494,647,648,649,719,720,721]);
export const DEFAULT_POKEMON_ID = 25; // 皮卡丘
export const MAX_UPGRADE_LEVEL = 10;
export const SPAWN_INTERVAL = 3800;
export const SPAWN_MAX = 5;
export const BANK_PAGE_SIZE = 20;
```

### 1.5 提取纯函数 → `lib/pokemon.ts`

以下函数不依赖 DOM 或全局状态，直接提取为纯函数：
- `getPkm(id)`, `getPkmName(id)`, `getPkmIcon(id)`
- `hasPkmIcon(id)`, `pkmFallbackColor(id)`
- `isPkmUnlocked(id)`, `getPkmKills(id)`, `isPkmUnlockable(id)`
- `getRarityLabel(r)`, `getRarityEmoji(r)`
- `getPkmHP(p)`, `getPkmSpeed(p)`, `getLegendTier(id)`
- `getPkmSpawnWeight(p)`

---

## Phase 2: 状态管理（Zustand Store）

### 2.1 Store 设计 — 替代 `G` 全局对象

原 `G` 对象的完整字段映射：

```typescript
// lib/store.ts
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface GameState {
  // ===== 战斗状态 =====
  hp: number;
  maxHp: number;
  score: number;
  combo: number;
  maxCombo: number;
  speedLevel: number;
  streakCorrect: number;
  totalAnswered: number;
  totalCorrect: number;
  gold: number;
  bulletLevel: number;
  hpLevel: number;
  doubleDamage: boolean;
  gameOver: boolean;
  isLoading: boolean;

  // ===== 题目状态 =====
  questions: Question[];
  allQuestions: Question[];
  errorPool: ErrorEntry[];
  questionHistory: string[];
  currentQ: Question | null;

  // ===== 怪物状态 =====
  monsters: MonsterState[];
  monsterIdCounter: number;

  // ===== 计时器引用 =====
  lastTime: number;

  // ===== 技能 =====
  skillCharge: number;
  skillMax: number;  // 固定 100

  // ===== 宝可梦收集 =====
  pokeKills: Record<number, number>;
  unlocked: Record<number, boolean>;
  activePokemon: number;

  // ===== 题库页面 =====
  bankPage: number;
  bankFilter: string;  // 未使用，保留兼容
  pokeFilter: 'all' | 'unlocked';

  // ===== UI 状态 =====
  activeTab: 'battle' | 'bank' | 'pokedex';
  startScreenVisible: boolean;
  toastMessage: string | null;

  // ===== Actions =====
  // (所有函数变为 store actions)
  spawnMonster: () => void;
  updateMonsters: (dt: number) => void;
  shootClosestMonster: () => boolean;
  damagePlayer: (amount: number) => void;
  handleAnswer: (index: number) => void;
  // ... 等等
}
```

### 2.2 Store 拆分策略

为避免单个 store 过大，按职责拆分为 3 个 slice：

| Slice | 文件名 | 职责 |
|-------|--------|------|
| `battleSlice` | `lib/store-battle.ts` | HP、分数、Combo、怪物、技能 |
| `collectionSlice` | `lib/store-collection.ts` | pokeKills、unlocked、activePokemon、gold、gacha |
| `questionSlice` | `lib/store-questions.ts` | 题库、错题池、回答历史 |

使用 Zustand 的 `create` + 手动合并：
```typescript
// lib/store.ts — 组合所有 slices
export const useGameStore = create<GameState>()(
  persist(
    (...a) => ({
      ...battleSlice(...a),
      ...collectionSlice(...a),
      ...questionSlice(...a),
    }),
    {
      name: 'drivingDefense',  // 合并为单个 localStorage key
      partialize: (state) => ({
        // 只持久化需要存储的字段
        gold: state.gold,
        bulletLevel: state.bulletLevel,
        hpLevel: state.hpLevel,
        pokeKills: state.pokeKills,
        unlocked: state.unlocked,
        activePokemon: state.activePokemon,
        allQuestions: state.allQuestions,
      }),
    }
  )
);
```

### 2.3 localStorage 迁移策略

原有 7 个 key → Zustand persist 自动处理：

```
原 key                              迁移后
───────────────────────────────     ─────────────────────────
drivingDefenseStats          →      store 中的 dailyStats（日期感知，自动处理跨天）
drivingDefenseUpgrades       →      store gold/bulletLevel/hpLevel
drivingDefensePokeKills      →      store pokeKills
drivingDefensePokeUnlocks    →      store unlocked
drivingDefenseActivePkm      →      store activePokemon
drivingDefenseImportedBank   →      store allQuestions
drivingDefenseBest           →      store bestScore
```

**迁移兼容**：在 store 初始化时，先尝试读取旧 key，若存在则迁移到新 store：
```typescript
onRehydrateStorage: () => (state) => {
  // 兼容旧数据迁移
  if (state && !state._migrated) {
    migrateFromLegacyKeys(state);
  }
}
```

---

## Phase 3: CSS 迁移

### 3.1 策略：保留 CSS 变量体系

原有 CSS 设计良好（暗色主题、CSS 变量、safe-area 支持），直接复制到 `app/globals.css`。

不需要 Tailwind 的原因：
- 原有 CSS 已经很好，重写成本高且无收益
- CSS 变量 (--cyan, --magenta 等) 在整个代码中广泛使用
- 保持样式与逻辑的紧密对应，减少迁移风险

### 3.2 需要调整的部分

| 原写法 | Next.js 写法 |
|--------|-------------|
| `@import url('https://fonts.googleapis.com/...')` | `next/font/google` 本地化加载 |
| `id` 选择器 (`#game-canvas`) | `className` + CSS Modules（或保留全局 CSS） |
| 绝对定位依赖于父容器 | 保持相同的 DOM 嵌套结构即可 |
| `@media(max-width:480px)` | 原样保留，已验证良好 |

### 3.3 字体加载优化

```typescript
// app/layout.tsx
import { Noto_Sans_SC } from 'next/font/google';

const notoSansSC = Noto_Sans_SC({
  weight: ['400', '700', '900'],
  subsets: ['latin'],
  display: 'swap',  // 字体加载期间使用系统字体
  preload: true,
});
```

这解决了 Google Fonts 在国内不可用的问题（Next.js 构建时下载字体并自托管）。

---

## Phase 4: 组件实现

### 4.1 实现顺序（由外向内，由简到繁）

```
ParticleCanvas  →  TabBar  →  Header  →  Footer
→  ConfirmDialog  →  Toast
→  StartOverlay  →  GameOverOverlay
→  QuestionPanel  →  UpgradePanel  →  SkillButton
→  DefenseLine  →  Monster  →  MonsterLane
→  GameArea  →  ComboNotify
→  PokedexPanel  →  PokemonCard  →  GachaButton
→  QuestionBank
→  page.tsx（组装）
```

### 4.2 关键组件设计

#### ParticleCanvas.tsx
```typescript
'use client';
// 使用 useRef 管理 canvas，useEffect 启动 rAF 循环
// 从 store 读取 monsters 来绘制怪物光晕
// 粒子系统完全保留原有逻辑
// 注意：canvas ref 在 useEffect cleanup 时 cancelAnimationFrame
```

#### MonsterLane.tsx + Monster.tsx
```typescript
// MonsterLane: 相对定位的跑道容器
// Monster: 绝对定位，通过 style.top 控制位置
//
// 关键决策：怪物位置变化频繁（每 50ms），直接操作 DOM style 
// 比 React setState 性能更好。使用 useRef + 直接操作：
//
// const monsterRefs = useRef<Map<number, HTMLDivElement>>(new Map());
// gameLoop 中直接更新 ref.style.top，绕过 React 渲染
//
// HP 条同理：直接操作 ref.querySelector('.hp-fill').style.width
```

> **性能说明**：每 50ms 更新位置的 Monster 是性能敏感路径。使用 React state 会导致每帧重渲染所有怪物，在低端手机上可能有卡顿。保留"ref + 直接 DOM 操作"模式，这与 React 的"escape hatch"理念一致。

#### GameArea.tsx
```typescript
// 组合 MonsterLane + DefenseLine + SkillButton
// 管理游戏循环 (requestAnimationFrame + setInterval)
// useEffect 启动循环，cleanup 停止
```

#### QuestionPanel.tsx
```typescript
// 纯 React 组件（不涉及高频更新）
// 从 store 读取 currentQ，渲染题目和选项
// handleAnswer 调用 store action
// 选项按钮状态（correct/wrong/disabled）由组件 state 管理
```

### 4.3 Tab 切换架构

```typescript
// page.tsx
export default function Home() {
  const activeTab = useGameStore(s => s.activeTab);

  return (
    <div id="app">
      <ParticleCanvas />
      <TabBar />
      {activeTab === 'battle' && <BattleView />}
      {activeTab === 'bank' && <QuestionBank />}
      {activeTab === 'pokedex' && <PokedexPanel />}
      <ConfirmDialog />
      <Toast />
    </div>
  );
}
```

BattleView 内部包含：Header、GameArea、QuestionPanel、UpgradePanel、StartOverlay、GameOverOverlay

---

## Phase 5: 游戏逻辑迁移

### 5.1 游戏循环重构

```typescript
// lib/game-engine.ts 或直接在 GameArea.tsx 的 useEffect 中

export function startGameLoop() {
  let lastTime = performance.now();
  let animFrame: number;

  function loop(time: number) {
    const state = useGameStore.getState();
    if (state.gameOver) return;

    const dt = Math.min((time - lastTime) / 1000, 0.05);
    lastTime = time;

    // 直接操作 Monster refs，不触发 React 重渲染
    updateMonsterPositions(dt);

    animFrame = requestAnimationFrame(loop);
  }

  animFrame = requestAnimationFrame(loop);

  // setInterval 作为 fallback（标签页不活跃时 rAF 暂停）
  const interval = setInterval(() => {
    const state = useGameStore.getState();
    if (state.gameOver) return;
    const now = performance.now();
    updateMonsterPositions(Math.min((now - lastTime) / 1000, 0.05));
    lastTime = now;
  }, 50);

  return () => {
    cancelAnimationFrame(animFrame);
    clearInterval(interval);
  };
}
```

### 5.2 怪物生成逻辑

```typescript
// lib/game-engine.ts

export function spawnMonsterLogic() {
  const state = useGameStore.getState();
  if (state.gameOver || state.isLoading || state.monsters.length >= 6) return null;

  const pool = PKM;  // 从 data/pokemon-data.ts 导入
  if (pool.length === 0) return null;

  // ...权重随机选择（同原逻辑）
  // 返回 monster 对象（不含 DOM 引用，那是组件的事）
  const monster = {
    id: state.monsterIdCounter,
    pkmId: pkm.id,
    pokeData: pkm,
    name: pkm.c,
    maxHp: hp,
    hp: hp,
    color: /* ... */,
    speed: /* ... */,
    y: -80,
    dead: false,
    reached: false,
  };

  useGameStore.setState({
    monsters: [...state.monsters, monster],
    monsterIdCounter: state.monsterIdCounter + 1,
  });

  return monster;
}
```

### 5.3 答题流程重构

```
用户点击选项
  → QuestionPanel.handleAnswer(index)
    → store.handleAnswer(index)
      → 判断正确/错误
      → 更新 score/combo/errorPool
      → 正确: store.shootClosestMonster()
      → 错误: store.damagePlayer()
      → 更新 stats
      → setTimeout → store.nextQuestion() (500/800ms)
```

整个流程在一个 store action 中完成，保证状态一致性。

---

## Phase 6: 移动端优化

### 6.1 Viewport & Meta（保留原有）
```html
<!-- app/layout.tsx metadata -->
<meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no, viewport-fit=cover">
<meta name="theme-color" content="#0a0a1a">
```

### 6.2 Safe Area Insets（保留原有 CSS 变量）
```css
:root {
  --sat: env(safe-area-inset-top, 0px);
  --sab: env(safe-area-inset-bottom, 0px);
  --sal: env(safe-area-inset-left, 0px);
  --sar: env(safe-area-inset-right, 0px);
}
```

### 6.3 性能优化清单

| 优化项 | 实现方式 | 优先级 |
|--------|---------|--------|
| 字体本地化 | `next/font/google` | P0 |
| POKEMON_ICONS 懒加载 | `dynamic(() => import('@/data/pokemon-icons'), { ssr: false })` | P0 |
| Monster 位置更新走 ref | 绕过 React 渲染管线 | P0 |
| 题目选项无动画（避免 layout thrashing）| 使用 `transition: none` on mobile | P1 |
| Pokedex 列表虚拟化 | 如果解锁很多（>50），考虑虚拟滚动 | P2 |
| WebP 图标 | 将 base64 PNG 转为 WebP base64（体积减 ~30%） | P2 |
| PWA（离线可用） | `next-pwa` 或手动 service worker | P2 |

### 6.4 iOS Safari 特殊处理

- `100dvh` 已使用（解决 iOS 地址栏挤压问题）
- `touch-action: manipulation` 保留（消除 300ms 延迟）
- `overscroll-behavior: none` 添加（防止下拉刷新触发）
- iOS 音频需要用户手势触发（当前应用无音频，无需处理）

---

## Phase 7: Vercel 部署

### 7.1 构建配置

```json
// next.config.js
/** @type {import('next').NextConfig} */
const nextConfig = {
  // 纯静态输出（无 API Routes）
  // output: 'export',  // 如果不需要 ISR/SSR

  // 图片优化（Vercel 自动处理）
  images: {
    unoptimized: true,  // base64 图标不需要 Next.js 优化
  },

  // 安全头
  headers: async () => [{
    source: '/:path*',
    headers: [
      { key: 'X-Frame-Options', value: 'DENY' },
      { key: 'X-Content-Type-Options', value: 'nosniff' },
    ],
  }],
};
```

### 7.2 环境变量（无需特殊配置）

此应用为纯客户端，无 API Keys、无数据库、无第三方服务。

### 7.3 部署命令

```bash
# 关联 Vercel 项目
vercel link

# 部署
vercel --prod
```

### 7.4 性能目标

| 指标 | 目标值 |
|------|--------|
| FCP (First Contentful Paint) | < 1.5s |
| LCP (Largest Contentful Paint) | < 2.5s |
| TTI (Time to Interactive) | < 3s |
| TBT (Total Blocking Time) | < 200ms |
| Lighthouse Performance | > 90 |

---

## 实施顺序（按 Phase 执行）

```
Phase 0: 项目初始化 ─────────────────────────── 1 小时
Phase 1: 数据拆分 ───────────────────────────── 2 小时
Phase 2: Zustand Store ──────────────────────── 3 小时
Phase 3: CSS 迁移 ───────────────────────────── 1 小时
Phase 4: 组件实现（由外向内）─────────────────── 8 小时
  ├─ 4.1 基础设施组件 (ParticleCanvas, TabBar, 弹窗)  ~2h
  ├─ 4.2 战斗组件 (Header, QuestionPanel, UpgradePanel)  ~2h
  ├─ 4.3 游戏核心 (GameArea, Monster, 游戏循环)  ~2h
  └─ 4.4 图鉴/题库 (PokedexPanel, QuestionBank)  ~2h
Phase 5: 游戏逻辑集成 ───────────────────────── 3 小时
Phase 6: 移动端优化 & 测试 ──────────────────── 2 小时
Phase 7: Vercel 部署 ────────────────────────── 0.5 小时
                                          ─────────
                                          约 20.5 小时
```

---

## 风险点 & 缓解措施

| 风险 | 影响 | 缓解 |
|------|------|------|
| Monster 动画用 React state 性能差 | 游戏卡顿 | **使用 ref + 直接 DOM 操作**，跳过 React 渲染管线 |
| POKEMON_ICONS 400KB 阻塞首屏 | LCP 超标 | 使用 `dynamic import` 懒加载 |
| localStorage 在 SSR 时不可用 | 构建/水合报错 | Zustand persist 中间件自动处理 SSR；所有访问包裹在 client-only guard |
| 题库数据格式在 import 时与内置不一致 | 游戏逻辑出错 | 添加运行时校验和 normalize 步骤（原应用已有） |
| CSS 安全区域在桌面浏览器不生效 | 不影响 | `env()` 在不支持时回退到 0px |
| Vercel 冷启动影响性能 | 无明显影响 | 此应用为纯客户端静态资源，无 Serverless Function |

---

## 不做的事情（明确排除）

1. **不做后端/数据库** — 所有数据本地存储，无需 API Routes
2. **不做用户系统/登录** — 保持纯单机游戏
3. **不做国际化 (i18n)** — 驾考题库只有中文
4. **不用 Tailwind CSS** — 保留原有 CSS 变量体系
5. **不用 React Router** — 三 Tab 用 state 切换即可
6. **不做 SSR / ISR** — 纯客户端应用，不需要服务端渲染
7. **不拆分 Monster 为独立 route** — 保持单页体验
