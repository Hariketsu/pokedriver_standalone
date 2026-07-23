# 宝可驾 · 交规地牢

Slay the Spire 式答题爬塔：一边答驾考题，一边组队打宝可梦。手机浏览器可玩，进度本地保存。

## 玩法

- **地图爬塔**：15 层节点地图（普通战 / 精英 / 商店 / 休息 / 中层 BOSS / 终局 BOSS）
- **答题战斗**：答对攻击敌人，答错或超时被反击；连击提升输出
- **捕获**：战后用精灵球 / 超级球捕获；队伍上限 6 只，满员可替换
- **商店**：买球、药水、永久攻防加成、复活等
- **休息**：全队回血、主动精灵加经验、或清空错题记录
- **图鉴 / 错题本 / 设置**：记录见过与捕获、复习错题、调节音量与难度

难度影响答题时限（`TIMER_SEC`：简单 30s / 普通 20s / 困难 12s）。精灵等级上限 `MAX_LEVEL = 10`，队伍 `MAX_TEAM = 6`。

## 技术栈

| 层面 | 技术 |
|------|------|
| 框架 | Next.js 16（App Router）+ TypeScript + React 19 |
| 状态 | Zustand + 手动 localStorage（`pd_meta_v1` / `pd_save_v1`） |
| 3D FX | Three.js（战斗场景，客户端） |
| 音频 | Web Audio API 合成 BGM / SFX |
| 数据 | 1034 道驾考题 + 721 只宝可梦 + 图标 JSON |

纯客户端应用，无后端、无数据库。

## 快速开始

```bash
npm install
npm run dev        # http://localhost:3000
```

生产构建：

```bash
npm run build
npm start
```

## 项目结构

```
├── app/
│   ├── layout.tsx          # 根布局、viewport、PWA meta
│   ├── page.tsx            # 入口（客户端 GameApp）
│   └── globals.css         # 全局样式（对齐原版 HTML）
├── components/
│   ├── GameApp.tsx         # 屏幕路由、音频/FX 生命周期
│   ├── screens/            # title / starter / map / battle / shop /
│   │                       # rest / dex / review / settings / over
│   └── ui/                 # Modal、Toast
├── lib/
│   ├── store.ts            # 全局状态与 run/meta 持久化
│   ├── formulas.ts         # HP/ATK/捕获/计分（含 TIMER_SEC、CATCH_BASE）
│   ├── battle.ts           # 战斗逻辑、出题、胜负结算
│   ├── map.ts              # 15 层地图生成与可达性
│   ├── shop.ts             # 商品池与购买效果
│   ├── audio.ts            # Web Audio 引擎
│   ├── fx3d.ts             # Three.js 战斗特效
│   ├── dom-fx.ts           # DOM 飘字 / 震动
│   └── types.ts            # Run / Battle / Modal 类型
├── data/
│   ├── questions.json      # 1034 题
│   ├── pokemon.json        # 721 宝可梦
│   ├── pokemon-icons.json  # 图标
│   ├── game_rules.json     # 稀有度倍率等规则
│   └── constants.ts        # GAME_CONST（MAX_TEAM / MAX_LEVEL …）
├── public/manifest.json
└── ref/                    # 原版 HTML/JS 参考实现（只读对照，不参与构建）
```

## 关键常量（与原版对齐）

| 常量 | 值 | 位置 |
|------|-----|------|
| `MAX_TEAM` | 6 | `data/constants.ts` → `GAME_CONST` |
| `MAX_LEVEL` | 10 | 同上 |
| `MAP_ROWS` | 15 | `lib/map.ts` |
| `TIMER_SEC` | easy 30 / normal 20 / hard 12 | `lib/formulas.ts` |
| `CATCH_BASE` | c 0.9 / u 0.7 / r 0.45 / l 0.22 | `lib/formulas.ts` |

## 架构要点

- **屏幕状态机**：`ScreenId` 驱动 `GameApp` 挂载对应 screen 组件。
- **Run vs Meta**：本局进度 `RunState` 与跨局图鉴/设置 `MetaState` 分 key 存储。
- **战斗**：出题 → 作答/超时 → 玩家攻击或敌方反击 → 濒死切换 → 胜后捕获/奖励 → 回地图。
- **客户端边界**：`page.tsx` / `GameApp` 均为 `"use client"`；Three.js 与 Audio 仅在浏览器副作用中初始化。

## 部署

```bash
npm run build
npx vercel --prod   # 或其他静态/Node 托管
```

## 参考实现

`ref/pokedriver/` 为原始单页 HTML 游戏（`js/game.js`、`battle.js`、`screens.js`、`audio.js`、`fx3d.js`）。本仓库为 Next.js + TypeScript 移植，逻辑与公式尽量一一对应；请勿在业务代码中 import `ref/`。
