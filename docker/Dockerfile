# 构建项目
FROM node:22-alpine AS builder
WORKDIR /app

ARG USE_PREBUILT=false

# 复制项目文件（包括可能存在的预构建产物）
COPY . .

# 如果使用预构建产物且产物已存在，直接使用；否则执行构建
RUN if [ "$USE_PREBUILT" = "true" ] && [ -d "/app/cjs" ] && [ -d "/app/client/ariang" ] && [ -f "/app/package.json" ]; then \
      echo "Using prebuilt artifacts (cjs and client directories found)..."; \
      echo "Skipping build steps"; \
    else \
      echo "Building from source..."; \
      apk update && apk add wget unzip && \
      npm i -g pnpm && \
      pnpm add -P express ws && \
      pnpm install && \
      pnpm build && \
      pnpm download-cdn && \
      wget https://github.com/mayswind/AriaNg/releases/download/1.3.11/AriaNg-1.3.11-AllInOne.zip -O ariang.zip && \
      unzip ariang.zip -d /app/client/ariang && \
      rm ariang.zip; \
    fi

# 生产环境镜像
FROM node:22-alpine
WORKDIR /app

ARG MAINTAINER="renxia"
LABEL maintainer="${MAINTAINER}"
ARG DS_PORT=6600
ARG DS_DEBUG=
ARG DS_SECRET=
ARG DS_SAVE_DIR=/app/downloads
ARG DS_CACHE_DIR=/app/cache
ARG DS_LIMTE_FILE_ACCESS=1
ARG DS_FFMPEG_PATH=

ENV DS_PORT=${DS_PORT} \
  DS_DEBUG=${DS_DEBUG} \
  DS_SECRET=${DS_SECRET} \
  DS_SAVE_DIR=${DS_SAVE_DIR} \
  DS_CACHE_DIR=${DS_CACHE_DIR} \
  DS_FFMPEG_PATH=${DS_FFMPEG_PATH} \
  LANG=C.UTF-8 \
  SHELL=/bin/bash \
  PS1="\u@\h:\w \$ " \
  NODE_ENV=production \
  TZ=Asia/Shanghai

VOLUME ["/app/cache", "/app/downloads"]

EXPOSE ${DS_PORT}

COPY --from=builder /app/package.json /app/package.json
COPY --from=builder /app/client /app/client
COPY --from=builder /app/cjs /app/cjs

# 安装生产依赖，并额外安装 express 和 ws（它们在 devDependencies 中但运行时需要）
RUN npm install --omit dev
RUN npm install express ws

# Install FFmpeg
RUN apk update && apk add ffmpeg

# Command to run the application
CMD ["node", "/app/cjs/server/index.js"]
