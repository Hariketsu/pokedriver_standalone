# 宝可驾 · 交规地牢

把科目一练习做成一局 Roguelike：沿 15 层地图前进，通过答题战斗、捕获伙伴、补给和养成，最终挑战 BOSS。

**[在线试玩](https://game01.hariketsu.tech)** · 手机与桌面浏览器均可运行 · 进度仅保存在本地浏览器

## 游戏特色

- **答题战斗**：答对造成伤害，答错或超时受到反击；连续答对可提高输出。
- **路线选择**：普通战、精英、商店、休息、事件、宝箱与两场 BOSS 战组成 15 层地图。
- **队伍构筑**：战后捕获伙伴，管理最多 6 名队员并在战斗中切换。
- **驾考练习**：内置 1034 道题，包含 100 题 / 45 分钟模拟考试与错题本。
- **本地优先**：无账号、无后端、无数据库；存档和设置写入 `localStorage`。

## 本地运行

需要 [Node.js 20.19+](https://nodejs.org/) 和 npm。

```bash
git clone https://github.com/Hariketsu/pokedriver_standalone.git
cd pokedriver_standalone
npm ci
npm run dev
```

打开 <http://localhost:3000>。

生产构建会静态导出到 `out/`：

```bash
npm run build
```

## 开发命令

```bash
npm run dev      # 启动开发服务器
npm run lint     # ESLint
npm run test     # 核心逻辑测试
npm run build    # 类型检查并生成静态站点
npm run check    # 依次执行 lint、test、build
```

## 技术与结构

- Next.js 16 App Router、React 19、TypeScript
- Zustand 管理本局进度与跨局数据
- Three.js 与 Web Audio API 提供战斗特效和音频
- Next.js static export，适合 Cloudflare Pages 等静态托管

```text
app/                 路由、元数据、字体与全局样式
components/screens/  游戏各屏幕
components/ui/       共享界面组件
lib/                 状态、战斗、地图、商店与公式
data/                题库、伙伴与规则数据
public/               PWA 清单和生产美术资源
scripts/              美术资源处理脚本
```

核心流程由 `ScreenId` 驱动；本局状态与跨局状态分别持久化到 `pd_save_v1` 和 `pd_meta_v1`。应用完全运行在客户端，不依赖仓库中的参考资料或构建期外部服务。

## 参与贡献

提交改动前请运行：

```bash
npm ci
npm run check
```

Pull Request 应聚焦一个可验证的问题，说明用户可见变化和验证方式；玩法或数据规则变更请同时更新对应测试。Bug 报告请提供浏览器、复现步骤、期望结果和实际结果。
