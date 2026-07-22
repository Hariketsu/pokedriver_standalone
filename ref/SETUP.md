# 🚗 宝可驾开发环境搭建指南

> 写给 CharlieJ806 — Windows + PowerShell + Claude Code 环境

---

## 1. 前置准备

### 安装 Node.js

项目需要 Node.js 20+（推荐 22 LTS）。

1. 打开 https://nodejs.org ，下载 **22 LTS** 版本（.msi 安装包）
2. 安装时勾选 ✅ *"Automatically install the necessary tools"*
3. 安装完成后**重启 PowerShell**，验证：

```powershell
node --version   # 应该显示 v22.x.x 或 v20.x.x
npm --version    # 应该显示 10.x.x
```

### 安装 Git for Windows

1. 下载 https://git-scm.com/download/win （独立安装版）
2. 安装选项全部默认即可
3. 验证：

```powershell
git --version
```

### 安装 Claude Code

```powershell
npm install -g @anthropic-ai/claude-code
```

> 如果你已经装过，确保是最新版：`npm update -g @anthropic-ai/claude-code`

---

## 2. 配置 Git

在 PowerShell 中运行以下（替换为你的真实信息）：

```powershell
git config --global user.name "CharlieJ806"
git config --global user.email "1850341168@qq.com"

# 推荐：让 Git 使用 PowerShell 作为默认终端
git config --global core.editor "code --wait"

# 推荐：Windows 换行符设置（仓库使用 LF，检出时自动转为 CRLF）
git config --global core.autocrlf true
```

### 配置 GitHub 认证

**方式一（推荐）：GitHub CLI**

```powershell
winget install --id GitHub.cli   # 或者从 https://cli.github.com 下载
gh auth login
# 选择 GitHub.com → HTTPS → 用浏览器登录
```

**方式二：SSH Key**

```powershell
ssh-keygen -t ed25519 -C "你的邮箱@example.com"
# 一路回车即可

# 复制公钥
Get-Content ~/.ssh/id_ed25519.pub | Set-Clipboard
```

然后去 https://github.com/settings/keys → New SSH Key → 粘贴保存。

---

## 3. 克隆项目

```powershell
# 进入你要放代码的目录，例如：
cd D: Developers\

# HTTPS 方式（配合 gh）：
git clone https://github.com/Hariketsu/pokedriver_standalone.git

# 或 SSH 方式：
git clone git@github.com:Hariketsu/pokedriver_standalone.git

# 进入项目
cd pokedriver_standalone
```

---

## 4. 安装依赖 & 运行

```powershell
# 在项目根目录
npm install

# 启动开发服务器
npm run dev
```

浏览器打开 http://localhost:3000 即可看到效果。

### 常用命令

| 命令 | 用途 |
|------|------|
| `npm run dev` | 启动开发服务器（热更新） |
| `npm run build` | 生产构建（提交前务必跑一遍确认不报错） |
| `npm run lint` | 代码检查 |

---

## 5. 项目结构一览

```
pokedriver_standalone/
├── app/                      # Next.js App Router 页面
│   ├── globals.css           # 全局样式（从 .html 迁移）
│   ├── layout.tsx            # 根布局
│   └── page.tsx              # 主页面（初始化、加载题目、渲染组件）
├── components/
│   ├── battle/               # 战斗相关组件
│   │   ├── GameArea.tsx      # 战场区域（怪物生成、移动、射击）
│   │   ├── Monster.tsx       # 单个怪物渲染
│   │   ├── MonsterLane.tsx   # 怪物跑道容器
│   │   ├── DefenseLine.tsx   # 防线（你的宝可梦）
│   │   ├── QuestionPanel.tsx # 题目面板
│   │   ├── UpgradePanel.tsx  # 升级/金币面板
│   │   ├── SkillButton.tsx   # 必杀技按钮
│   │   ├── StartOverlay.tsx  # 开始画面
│   │   ├── GameOverOverlay.tsx # 结束画面
│   │   └── ComboNotify.tsx   # 连击提示
│   ├── layout/               # 布局组件
│   │   ├── Header.tsx        # 顶部状态栏
│   │   ├── Footer.tsx        # 底部工具栏
│   │   └── TabBar.tsx        # 标签栏
│   ├── pokedex/              # 图鉴相关
│   │   ├── PokedexPanel.tsx  # 图鉴面板
│   │   ├── PokemonCard.tsx   # 宝可梦卡片
│   │   └── GachaButton.tsx   # 抽奖按钮
│   ├── bank/                 # 题库面板
│   │   └── QuestionBank.tsx
│   └── ui/                   # 通用 UI
│       ├── ParticleCanvas.tsx # 粒子特效背景
│       ├── Toast.tsx          # 提示条
│       └── ConfirmDialog.tsx  # 确认弹窗
├── lib/
│   ├── store.ts              # Zustand 状态管理（核心！）
│   ├── game-engine.ts        # 游戏逻辑（生成怪物、伤害计算）
│   └── pokemon.ts            # 宝可梦数据、图标、颜色
├── data/
│   ├── questions-builtin.ts  # 内置题库
│   ├── pokemon-data.ts       # 宝可梦数据
│   └── constants.ts          # 常量
├── public/
│   └── pokemon/              # 宝可梦图标 PNG
├── pokedriver_standalone(20).html  # 原始单文件版本（参考）
└── package.json
```

---

## 6. Claude Code 开发工作流

你已经在原版 HTML 中用 CC 开发过，流程类似。在项目根目录打开 Claude Code：

```powershell
claude
```

### 重要：CLAUDE.md

项目根目录有 `CLAUDE.md`，内容指向 `AGENTS.md`。`AGENTS.md` 会告诉 Claude **这个 Next.js 版本有 breaking changes**，需要先读 `node_modules/next/dist/docs/` 里的文档。

### 开发建议

1. **先读 `lib/store.ts`** — 这是整个游戏的状态中心（Zustand），所有逻辑都围绕它
2. **原始 HTML 在根目录** — `pokedriver_standalone(20).html` 是参考实现，遇到不确定的 UI 行为可以对比
3. **CSS 是全局的** — `app/globals.css` 包含了所有样式，从原版 HTML 迁移过来
4. **怪物移动是直接操作 DOM** — `GameArea.tsx` 用 `requestAnimationFrame` + `el.style.top` 更新位置，不走 React 渲染
5. **提交前一定要 `npm run build`** — 确认编译和类型检查都通过

### 常见 CC 场景

```powershell
# 在 CC 中直接提需求
"帮我把怪物的速度调快 20%"

# 让 CC 对比原版 HTML 和当前实现
"对比 pokedriver_standalone(20).html，看看 XX 功能的实现差距"

# 构建验证
"npm run build 看看有没有报错，然后提交推送"
```

---

## 7. 分支 & 提交规范

```powershell
# 开发新功能前先拉最新代码
git pull

# 创建分支开发（不要直接在 master 上改）
git checkout -b feature/你的功能名

# 提交
git add -A
git commit -m "feat/fix: 简短描述"

# 推送
git push -u origin feature/你的功能名
```

> 目前的模式是直接在 master 上迭代。如果有需要可以改成 PR 工作流，你来定。

---

## 8. 快速排错

| 问题 | 解决 |
|------|------|
| `npm install` 报错 | 检查 Node.js 版本 ≥ 20，尝试删除 `node_modules` 和 `package-lock.json` 再装 |
| `npm run dev` 打不开 | 检查 3000 端口是否被占用 |
| CC 报权限错误 | 在 `.claude/settings.json` 中添加对应工具的 allow 规则 |
| Git push 被拒 | 先 `git pull` 拉最新，解决冲突后再 push |
| 字体加载慢 | 正常，`Noto Sans SC` 在首次加载时从 Next.js 自托管加载 |

---

