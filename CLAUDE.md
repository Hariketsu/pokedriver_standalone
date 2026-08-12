@AGENTS.md

# 宝可驾 · 交规地牢

- 主应用位于仓库根目录，使用 TypeScript、React 19 与 Next.js 16 App Router。
- `app/`、`components/`、`lib/`、`data/` 构成生产应用。
- `ref/` 只用于历史实现对照，不参与构建；业务代码不得从中导入。
- 应用以 `output: "export"` 生成纯静态站点，部署配置需保持静态托管兼容。
