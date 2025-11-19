# m3u8-dl Portal

m3u8-dl 项目的静态宣传门户网站。

## 功能

- 🏠 **首页**：展示项目介绍、功能特性、使用方式等
- 📥 **下载页面**：自动从 GitHub Release API 获取下载信息，智能识别适合当前系统的下载文件

## 开发

```bash
# 安装依赖
pnpm install

# 启动开发服务器
pnpm dev

# 构建生产版本
pnpm build

# 预览构建结果
pnpm preview
```

## 技术栈

- Vue 3
- TypeScript
- Vite
- Tailwind CSS
- Vue Router

## 系统检测

下载页面会自动检测用户的系统信息（Windows/macOS/Linux）和架构（x64/arm64/ia32），并推荐合适的下载文件。

## 环境变量

项目支持通过环境变量配置网站分析工具：

- `MD_GA_ID`: Google Analytics (GA4) 跟踪 ID，如果设置将启用 Google Analytics
- `MD_BAIDU_ID`: 百度统计跟踪 ID，如果设置将启用百度统计

创建 `.env` 文件（或 `.env.local`）并设置相应的环境变量：

```bash
# Google Analytics (GA4)
MD_GA_ID=G-XXXXXXXXXX

# 百度统计
MD_BAIDU_ID=xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

如果环境变量未设置，相应的分析工具将不会加载。

## 部署

构建后的文件在 `dist` 目录，可以部署到任何静态文件服务器。
