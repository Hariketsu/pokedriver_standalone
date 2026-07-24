# HANDOFF — pokedriver_standalone（主版本 Next.js）

> 交接日期：2026-07-24  
> 分支：`master`（相对 `origin/master` 本地多提交、待 push；首页方案 A + 本 HANDOFF 一并入库）  
> 主产品路径：仓库根目录 Next.js 16 App Router  
> 旁路：`standalone/` 原生 JS 实验版（CharlieJ086 提交，**勿与主线 store 混用**）

---

## 1. 项目一句话

**宝可驾 · 交规地牢**：驾考答题驱动的宝可梦爬塔。  
主版本 = **React + Zustand + Three.js 战斗**；`standalone/` = 卡组/无限层实验，**不是**要整包替换的主线。

---

## 2. 已完成的工作

### 2.1 架构迁移（较早，已在远程历史中）

| 节点 | 说明 |
|------|------|
| `3eb7ed4` / rebase 后 `08d33b5` | 备份归档 `ref/pokedriver` 与素材 |
| `9039f0c` | 清空旧「驾考保卫战」Next 实现 |
| `f92723d` | 接入题库/宝可梦 JSON + three |
| `8d54655` | 核心逻辑 + 音画 |
| `d386b63` | 全屏 React UI |
| `26a0dfe` | **他人**新增 `standalone/` 原生版 + README 双版本说明 |

### 2.2 战斗与移植 bugfix（已在 `d386b63` 一带及后续逻辑中）

- 首题不出现 / 进度条不动：Strict Mode 下 sticky `introDone` → 改为 **store.startBattle 内 setTimeout 出题**
- 计时器依赖整个 `battle` 对象导致 interval 重置
- 答题双触发：`lastAnswer.id` 去重
- 伤害对齐原版：命中帧 `commitPlayerHit` / `commitEnemyHit`
- BattleFX canvas remount dispose/rebind；精灵不同步每 tick 重建

### 2.3 Standalone vs Next 对照结论（已调研）

两版是**玩法分叉**，不是双壳：

| | Next 主版本 | standalone/ |
|--|-------------|-------------|
| 战斗 | 一题一攻防 · 多宠 · 计时 | 连答攒能量 → 出牌 · 单 HP |
| 地图 | 固定 15 层 | 无限层 + event/treasure |
| 3D | Three.js | 无 |
| 数据 | 721 宠 / 1034 题 | 1010 宠 / ~1024 题 |
| 存档 | `pd_meta_v1` / `pd_save_v1` | `dungeonDrive_*` |

**明确不迁**：卡组主循环、扩到 1010、去掉 Three.js、单 HP 壳。

### 2.4 P0 + P1 + 额外需求（已实现，部分已 commit）

**已提交（本地 ahead 3，未 push）：**

| Commit | 内容 |
|--------|------|
| `bfc3670` | 修正 `data/pokemon.json` id **86–117** 中文名（如 86→小海狮） |
| `ff1c7d7` | types/store/map/shop/battle/events/exam helpers、多球、metaGold、event/treasure |
| `70f9f3a` | boot-gate、Exam/Wrong/Train UI、图鉴卡牌风、Modal 多球/事件 |

**功能清单：**

1. **P0 中文名**：86–117 已对齐 standalone 的 `c` 字段  
2. **Loading 门控**：`GameApp` 在 `hydrated && dataReady` 前显示 boot-gate  
3. **event / treasure**：`lib/map.ts` 权重；`lib/events.ts` 奖励；Modal 交互；节点先 `done`，关闭可强制跳过  
4. **多球**：`normal | great | ultra | master`（master 每局上限见 `MASTER_BALL_RUN_CAP`）；商店 SKU；捕获 UI；**未改** `lib/fx3d.ts` 的 capture 签名  
5. **metaGold + 养成**：结算入账；`TrainScreen` 永久 ATK/HP 等级硬顶；`newRun` 吃 meta 加成  
6. **图鉴**：trading-card 风网格与详情（`dex-*` CSS）  
7. **模考**：全页 `ExamScreen`，**100 题 / 45 分钟**，超时交卷，错题写入 `wrongQ`  
8. **错题本**：`WrongBookScreen` 列表 + 练习掌握移除  
9. **存档兼容**：`normalizeMeta` / `normalizeRun`；`superBalls` 与 `greatBalls` 双写过渡  

### 2.5 首页方案 A（已实现并入库）

- `TitleScreen`：双主 CTA + 2×2 卡片（图鉴/学习/养成/设置）+ 右上角设置  
- 新增 `StudyHubScreen`（`screen: "study"`）：模考 · 错题本 · 题库浏览  
- 模考/错题/题库 **返回 → study**，不再直接堆回标题 8 按钮  
- `lib/types.ts` 增加 `"study"`；`GameApp` 路由与 BGM  
- `globals.css` 标题卡片 + 学习中心样式  

`npm run build` 在改完方案 A 后已通过。

---

## 3. 试过但没成功 / 踩过的坑

| 尝试 | 结果 | 教训 |
|------|------|------|
| SSH `git@github.com:...` push | 环境连到 `198.18.0.39:22` 被关 | 用 HTTPS + `gh auth`；`origin` 已是 HTTPS |
| 首次 push 被拒 | 远程多 `8ade42c` | rebase 后再推 |
| Workflow 脚本含 TypeScript 语法 | parse error | workflow 必须纯 JS |
| map/shop 专项 audit agent | Cloudflare 524 超时 | 对照不完整时靠手读代码 |
| 首题用 React effect + sticky ref | Strict Mode 清 timeout 后不再出题 | 出题调度放 store setTimeout |
| 计划里改 `BattleFX.capture({ ball })` | 与真实 `CaptureSeq` API 不符 | 多球只动库存/UI/概率，锁 fx3d |
| 并行 agent 抢 `store.ts` / CSS | 合并风险 | plan 里写清 ownership；build-fix 再 reconcile |
| 把 10 题 Review modal 当模考 | 易混淆 | 正式模考必须全页 100/45；结果文案已改为 /10 |
| 扩 1010 宠 / 卡组并入主线 | 产品否决 | 保持 721 + 答题多宠 3D |

---

## 4. 仓库结构（主版本相关）

```
app/                 # layout, page, globals.css
components/
  GameApp.tsx        # 路由 + boot-gate + BGM
  screens/           # Title, StudyHub, Exam, Wrong, Train, Map, Battle, …
  ui/Modal.tsx Toast.tsx
lib/
  store.ts           # 主状态 + 存档
  battle.ts formulas.ts map.ts shop.ts events.ts exam.ts
  audio.ts fx3d.ts
data/
  pokemon.json questions.json pokemon-icons.json …
standalone/          # 旁路原生版（参考勿混存档）
ref/                 # 参考与计划文档（部分未提交）
  pokedriver/        # Kimi 原版 HTML 参考
  PLAN-p0-p1-20260724.md   # 实现计划（未 commit，按用户要求可不管 ref）
```

**存档 key：** `pd_meta_v1` · `pd_save_v1`  
**跑起来：** `npm install && npm run dev` → http://localhost:3000  

---

## 5. 当前 Git 状态（写 handoff 时）

```
本地相对 origin 多提交（含方案 A + HANDOFF，待 push）：
  bfc3670 fix: 修正宝可梦 id 86–117 中文名错位
  ff1c7d7 feat: 扩展主版本数据模型与核心逻辑
  70f9f3a feat: 加载门控、模考错题本与图鉴/地图 UI
  （另：首页方案 A + HANDOFF.md）

未纳入版本库（可不管）：
  ref/HANDOFF-20260724-jxedt-question-crawl.md
  ref/PLAN-p0-p1-20260724.md
```

下一步运维：`git push origin master`（HTTPS；本环境 SSH 易失败）。

---

## 6. 已知限制 / 低优债

1. **题库 JSON 导入**（设置页）：计划标 optional，未做  
2. **模考未答题**：超时会整批进错题本（策略取舍，可改为仅「已答错」）  
3. **标题模考入口**：题库 &lt;100 时仅 Exam 内按钮禁用（内置 1034 无影响）  
4. **RestOptionId `"train"`** 与 ScreenId `"train"` 同名不同义（休息 XP vs 养成页）  
5. **`standalone/`** 与主版本数值/存档不兼容；README 已写双版本，贡献时勿混  
6. ESLint 可能扫到 hooks 警告；`next build` 当前绿  

---

## 7. 下一步该做什么（按优先级）

### P0 — 交接立刻

1. **推送远程**（若尚未 push）：`git push origin master`（HTTPS）  
2. **真机点一遍**  
   - loading → 标题层级（方案 A）→ 学习中心 → 模考开考/返回  
   - 开一局：event/treasure、商店多球、捕获、结算养成金  

### P1 — 产品 polish

1. 模考策略：未答是否进错题本  
2. 设置页题库导入（若需要自定义卷）  
3. 小屏标题再压：设置是否只保留右上角、去掉宫格第 4 格  
4. 通关后可选「无尽层」（对照计划 P2，未做）  

### P2 — 明确不要做（除非改产品方向）

- 把 standalone 卡组战斗做成唯一主循环  
- 图鉴扩到 1010 凑数  
- 去掉 Three.js  

### 可选工程

- `ref/PLAN-*.md` 可继续留本地或按需单独入库  
- CI：`npm run build` on PR  
- 为 `normalizeMeta/Run` 与 `exam` 采样写少量单测  

---

## 8. 关键文件速查

| 用途 | 路径 |
|------|------|
| 状态机 | `lib/store.ts` |
| 类型 | `lib/types.ts` |
| 地图 | `lib/map.ts` |
| 事件/宝箱 | `lib/events.ts` |
| 模考逻辑 | `lib/exam.ts` · `components/screens/ExamScreen.tsx` |
| 错题本 | `components/screens/WrongBookScreen.tsx` |
| 标题/学习 | `TitleScreen.tsx` · `StudyHubScreen.tsx` |
| 3D（勿轻易改 capture API） | `lib/fx3d.ts` |
| 实现计划 | `ref/PLAN-p0-p1-20260724.md` |
| Standalone 参考 | `standalone/` · `ref/pokedriver/` |

---

## 9. 验收口令（给下一任）

```bash
npm run build          # 必须绿
npm run dev
# 检查：id 86 中文 = 小海狮
# 检查：首页不是 8 条长按钮
# 检查：学习 → 模考 100/45
# 检查：有存档时主按钮是「继续冒险」
```

**产品身份一句话（勿丢）：**  
> Next 的 3D 多宠答题爬塔为躯干；event/多球/轻 meta 为血肉；不吃卡组与 1010 虚荣图鉴。
