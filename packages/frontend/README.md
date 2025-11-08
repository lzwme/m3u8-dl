# M3U8-DL Frontend

Vue3 + TypeScript 前端项目，用于重构原有的 Vue2 单页应用。

## 技术栈

- Vue 3 (Composition API)
- TypeScript
- Vite
- Pinia (状态管理)
- Vue Router (路由)
- TailwindCSS (样式)

## 开发

```bash
# 安装依赖
pnpm install

# 启动开发服务器
pnpm dev

# 构建生产版本（输出到 ../../client）
pnpm build

# 预览构建结果
pnpm preview
```

## 项目结构

```
packages/frontend/
├── src/
│   ├── main.ts              # 入口文件
│   ├── App.vue              # 根组件
│   ├── router/              # 路由配置
│   ├── stores/              # Pinia stores
│   ├── views/               # 页面组件
│   ├── components/          # 公共组件
│   ├── composables/         # Composition API 组合函数
│   ├── types/               # TypeScript 类型定义
│   ├── utils/               # 工具函数
│   └── assets/              # 静态资源
├── public/                  # 公共资源（会复制到 client）
└── index.html               # HTML 模板
```

## 构建输出

构建后的文件会输出到 `../../client` 目录，保持与现有 Server 和 Electron 应用的兼容性。

## 注意事项

1. 构建后的 `index.html` 会被 Server 读取并替换 `{{version}}` 占位符
2. `play.html` 保持独立，不参与 Vue 构建
3. 静态资源（如 `logo.png`）需要放在 `public/` 目录
