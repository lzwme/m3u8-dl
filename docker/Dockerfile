# 构建项目
FROM node:22-alpine AS builder
WORKDIR /app
COPY ./ ./

RUN apk update && apk add wget unzip

RUN npm i -g pnpm
RUN pnpm install
RUN pnpm add -P express ws
RUN pnpm build
# 下载 CDN 静态资源到本地
RUN pnpm download-cdn
# 下载ariang
RUN wget https://github.com/mayswind/AriaNg/releases/download/1.3.10/AriaNg-1.3.10-AllInOne.zip -O ariang.zip
RUN unzip ariang.zip -d /app/client/ariang
RUN rm ariang.zip

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

RUN npm install --production

# Install FFmpeg
RUN apk update && apk add ffmpeg

# Command to run the application
CMD ["node", "/app/cjs/server/index.js"]
