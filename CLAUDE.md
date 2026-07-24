@AGENTS.md

# 宝可驾 · 交规地牢 — 项目总览

本仓库包含同一游戏的**两套实现**：

## 1. Next.js 版（根目录）
- TypeScript + React 19 + Next.js 16 App Router
- 构建后部署，支持 Vercel
- 结构：`app/` `components/` `lib/` `data/`

## 2. Standalone 版（`standalone/`）
- 纯原生 HTML/CSS/JS，零依赖
- 浏览器直接打开 `standalone/index.html` 即可运行
- 结构参考了 `ref/pokedriver/`，从 4300+ 行单文件拆分
- 加载顺序：`data/*.js → game.js → battle.js → screens.js → main.js`
- `game.js` 定义全局 `$()`、`GS`、常量；所有脚本共享全局作用域
- 对比阅读 `ref/pokedriver/` 和 `standalone/` 可了解原生 JS 游戏架构

## 参考文件
- `ref/pokedriver/` — 原始参考实现（只读）
- `pokedriver_standalone(20).html` — 早期单文件版本
