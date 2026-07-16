# 驾考保卫战 — 宝可梦版

一边答题一边打怪！宝可梦主题的驾考练习游戏，手机浏览器畅快访问。

## 玩法

- 回答驾考题来攻击怪物，答对扣血、答错自己受伤
- 连击（5/10 连击）触发双倍伤害
- 击杀同一宝可梦 10 次即可解锁，在图鉴中切换你的防守精灵
- 攒满技能条释放全屏清除
- 抽卡（200 金币）获取未解锁的稀有宝可梦
- 支持导入自定义题库（JSON 格式）

## 技术栈

| 层面 | 技术 |
|------|------|
| 框架 | Next.js 16 (App Router) + TypeScript |
| 状态管理 | Zustand + persist 中间件（localStorage） |
| 游戏循环 | requestAnimationFrame + setInterval 双保险 |
| 动画 | Canvas 粒子背景 + CSS 动画（怪物受伤/连击提示） |
| 字体 | next/font/google — Noto Sans SC，构建时自托管 |
| 数据 | 721 只宝可梦 + base64 图标 + 1034 道驾考题 |

## 快速开始

```bash
npm install
npm run dev        # http://localhost:3000
```

## 项目结构

```
├── app/                       # Next.js App Router
│   ├── layout.tsx             # 根布局（字体、viewport、PWA meta）
│   ├── page.tsx               # 主页面（三 Tab 协调）
│   └── globals.css            # 全局样式（暗色主题）
├── components/
│   ├── battle/                # 战斗系统（9 个组件）
│   │   ├── GameArea.tsx       # 核心：游戏循环 + 怪物跑道 + 射击 + 技能
│   │   ├── Monster.tsx        # 怪物（图标 + 血条 + 受伤动画）
│   │   ├── QuestionPanel.tsx  # 题目面板（4 选项）
│   │   ├── UpgradePanel.tsx   # 升级面板（伤害/生命）
│   │   └── ...
│   ├── pokedex/               # 宝可梦图鉴
│   ├── bank/                  # 题库浏览（搜索 + 分页）
│   ├── layout/                # TabBar、Header、Footer
│   └── ui/                    # ParticleCanvas、Toast、ConfirmDialog
├── lib/
│   ├── store.ts               # Zustand 全局状态（替代原 G 对象）
│   ├── pokemon.ts             # 宝可梦纯函数（查找、属性计算）
│   └── game-engine.ts         # 游戏引擎（生成、伤害、概率）
├── data/
│   ├── pokemon-data.ts        # 721 只宝可梦元数据
│   ├── pokemon-icons.ts       # base64 图标映射（~318KB）
│   └── questions-builtin.ts   # 1034 道内置驾考题
└── public/
    └── manifest.json          # PWA 清单
```

## 部署到 Vercel

```bash
npm run build
npx vercel --prod
```

纯客户端应用，无需 Serverless Functions 或数据库。首次访问即完全可用。

## 自定义题库

准备一个 JSON 文件：

```json
[
  {
    "id": "q0001",
    "question": "驾驶机动车在道路上违反道路交通安全法的行为，属于什么行为？",
    "options": ["违章行为", "违法行为", "过失行为", "违规行为"],
    "answer": 1
  }
]
```

字段要求：`question`（题目）、`options`（选项数组）、`answer`（正确答案索引，0-based）。

在游戏底部点击「导入题库」上传即可，数据保存在本地浏览器。

## 架构说明

### localStorage → Zustand

原有 7 个独立的 `drivingDefense*` key 合并为 1 个 Zustand persist store：

```
drivingDefenseStats / Upgrades / PokeKills / PokeUnlocks / ActivePkm / ImportedBank / Best
        ↓
drivingDefense (单一 key，partialize 只持久化必要字段)
```

首次加载自动迁移旧数据。

### 性能设计

- **Monster 位置更新**（~50ms 间隔）：使用 `useRef` + 直接 DOM 操作（`el.style.top`），绕过 React 渲染管线
- **POKEMON_ICONS**（318KB）：静态 import，Next.js 自动代码分割
- **粒子背景**：独立 Canvas，`pointer-events: none`，不阻塞交互
- **Safe Area**：全面支持 iPhone 刘海屏 / 底部指示条
