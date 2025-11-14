# M3U8 Capture UserScript

这是一个使用 TypeScript 编写的油猴用户脚本，用于自动抓取网页中的媒体链接。

## 项目结构

```
packages/m3u8-capture/
├── src/
│   ├── main.ts          # 主入口文件
│   ├── types.ts         # 类型定义
│   ├── types.d.ts       # 全局类型声明（GM API、Swal 等）
│   ├── config.ts        # 配置常量
│   ├── storage.ts       # 存储相关函数
│   ├── utils.ts         # 工具函数
│   ├── media.ts         # 媒体相关函数
│   ├── hooks.ts         # 网络请求拦截器
│   ├── swal.ts          # SweetAlert2 集成
│   └── ui.ts            # UI 相关逻辑
├── package.json
├── tsconfig.json
└── vite.config.ts
```

## 开发

```bash
# 安装依赖
pnpm install

# 开发模式（监听文件变化）
pnpm dev

# 构建
pnpm build
```

构建产物会输出到 `client/m3u8-capture.user.js`。

## 扩展参考

- [Violentmonkey 暴力猴文档](https://violentmonkey.github.io)
- [Tampermonkey 油猴文档](https://www.tampermonkey.net/documentation.php)
