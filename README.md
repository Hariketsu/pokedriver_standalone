# 宝可驾 · 交规地牢

Slay the Spire 式答题爬塔：一边答驾考题，一边组队打宝可梦。手机浏览器可玩，进度本地保存。

> **两个版本**：本仓库包含同一游戏的两套实现——
> - **Next.js 版**（根目录）：TypeScript + React 19 + Three.js，需构建，支持部署到 Vercel
> - **Standalone 版**（[`standalone/`](standalone/)）：纯原生 HTML/CSS/JS，零依赖，浏览器直接打开即玩

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

## Standalone 版（原生 JS）

`standalone/` 目录包含完整的原生 JavaScript 实现——**无需 npm install、无需构建、无需任何工具链**。用浏览器打开 `standalone/index.html` 即可直接游玩。

### 与 Next.js 版的差异

| 维度 | Next.js 版 | Standalone 版 |
|------|-----------|---------------|
| 语言 | TypeScript + React 19 | 原生 JavaScript (ES6+) |
| 构建 | `npm run build` | 无需构建 |
| 3D | Three.js | 无 3D（纯 DOM/CSS 动画） |
| 模块化 | 组件化 + Zustand 状态管理 | 多文件脚本 + 全局状态对象 |
| UI 样式 | React 组件 + globals.css | 单 CSS 文件 |
| 题库 | 1034 题 (JSON) | 1034 题 (JS 变量) |
| 宝可梦 | 721 只 (JSON) | 1010 只 (JS 变量) |
| 地图 | 固定 15 层 | 无限闯关 |
| 卡片系统 | 无 | 技能卡片 / 牌组构建 |
| 养成系统 | 无 | 养成金币 / HP-ATK 升级 |
| 数据文件 | `data/*.json` | `data/data_*.js` |

### Standalone 项目结构

```
standalone/
├── index.html              # 入口 HTML
├── css/
│   └── style.css           # 全部样式
├── data/
│   ├── data_pokemon.js     # 宝可梦数据
│   ├── data_questions.js   # 题库
│   ├── data_bst.js         # 种族值
│   ├── data_icon_files.js  # 图标文件名映射
│   └── data_icons_hd.js    # 图标 base64
├── js/
│   ├── game.js             # 核心：常量/状态/地图/存档
│   ├── battle.js           # 战斗：音频/卡片/牌组/商店
│   ├── screens.js          # 界面：粒子/图鉴/题库/设置
│   └── main.js             # 入口：事件绑定/游戏循环/初始化
└── lib/                    # 预留外部库
```

### Standalone 独有玩法

相比 Next.js 版，Standalone 版新增了以下系统：

**🃏 技能卡片与牌组构建**
- 战斗中通过答题积攒能量，消耗能量打出攻击/防御/恢复/控制/异常 5 类技能卡
- 战后可获取新卡；在「构建牌组」页面自由编辑 12 张出战卡组
- 卡片按稀有度分级（普通/稀有/超稀有/传说），通过养成抽卡获得

**🧬 全局养成系统**
- 跨局积累养成金币，永久升级 HP（+3/级）和攻击力（+1/级）
- 抽卡系统：消耗养成金币随机获得技能卡片，稀有度越高越难出
- 已拥有的宝可梦和卡片跨局保留（localStorage `dungeonDrive_*`）

**🗺️ 无限闯关**
- 地图层数不再设限，每击败 BOSS 进入更深层，难度递增
- Slay the Spire 式节点路径：每层只能选一个节点前进，不可回头

**📖 图鉴与筛选**
- 收录 1010 只宝可梦，支持按稀有度、已收集/未解锁筛选
- 只有成功捕获的宝可梦才会解锁图鉴条目（击败不自动解锁）

### 开发说明

Standalone 版从原始 4300+ 行单文件 HTML 拆分而来，结构参考了 `ref/pokedriver/`。修改 JS 时注意**加载顺序**：

```
data/*.js → game.js → battle.js → screens.js → main.js
```

`game.js` 定义全局 `$()`、`GS` 状态、常量；后续文件依赖这些全局变量。所有脚本均为经典 `<script>` 标签（非 module），共享全局作用域。

## 参考实现

`ref/pokedriver/` 为原始单页 HTML 游戏（`js/game.js`、`battle.js`、`screens.js`、`audio.js`、`fx3d.js`）。本仓库为 Next.js + TypeScript 移植，逻辑与公式尽量一一对应；请勿在业务代码中 import `ref/`。
