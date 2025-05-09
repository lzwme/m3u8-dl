# 构建项目
FROM node:22-alpine AS builder
WORKDIR /app
COPY ./ ./
RUN npm i -g pnpm
RUN pnpm install
RUN pnpm build

# 生产环境镜像
FROM node:22-alpine
WORKDIR /app

ARG MAINTAINER="renxia"
LABEL maintainer="${MAINTAINER}"
ARG DS_PORT=6600
ARG DS_DEBUG=
ARG DS_SAVE_DIR=/app/downloads
ARG DS_CACHE_DIR=/app/cache

ENV DS_PORT=${DS_PORT} \
  DS_DEBUG=${DS_DEBUG} \
  DS_SAVE_DIR=${DS_SAVE_DIR} \
  DS_CACHE_DIR=${DS_CACHE_DIR} \
  LANG=C.UTF-8 \
  SHELL=/bin/bash \
  PS1="\u@\h:\w \$ " \
  NODE_ENV=production \
  TZ=Asia/Shanghai

VOLUME ["/app/cache", "/app/downloads"]

EXPOSE ${DS_PORT}

COPY --from=builder /app/cjs /app/cjs
COPY package.json client /app/

RUN npm install --production
RUN npm add express ws

# Install FFmpeg
RUN apk update && apk add ffmpeg

# Command to run the application
CMD ["node", "/app/cjs/server/index.js"]
