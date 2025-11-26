export default {
  common: {
    home: '首页',
    download: '下载',
    online: '在线下载器',
    player: '在线播放器',
    api: 'API',
    github: 'GitHub',
    language: '语言',
    learnMore: '了解更多',
    browserWarning: '检测到您的浏览器内核版本过低，可能无法正常显示部分内容。建议升级到最新版本的 Chrome、Edge 或其他现代浏览器。',
    close: '关闭',
    backToTop: '回到顶部',
  },
  home: {
    title: 'M3U8-DL - 强大的 m3u8 视频批量下载工具',
    description: '一个免费开源功能强大的 m3u8 视频批量下载工具，支持多线程下载、边下边播、WebUI 管理、视频解析等多种功能。',
    keywords: 'm3u8,下载,视频下载,批量下载,m3u8下载器,视频工具,开源工具',
    hero: {
      title: 'M3U8-DL',
      subtitle: '一个免费开源功能强大的 m3u8 视频批量下载工具',
      download: '立即下载',
      viewSource: '查看源码',
      typewriter: ['M3U8-DL', '强大的视频下载工具', '开源免费', '多线程加速'],
      features: {
        smartExtract: '智能提取',
        streamingPlayback: '边下边播',
        cacheResume: '缓存续传',
        fastDownload: '极速下载',
      },
    },
    features: {
      title: '功能特性',
      multiThread: {
        title: '多线程下载',
        desc: '采用线程池模式，支持自定义线程数，大幅提升下载速度',
      },
      playWhileDownload: {
        title: '边下边播',
        desc: '支持使用已下载的 ts 缓存文件在线播放，无需等待完整下载',
      },
      batchDownload: {
        title: '批量下载',
        desc: '支持指定多个 m3u8 地址批量下载，支持文本文件批量导入',
      },
      aesSupport: {
        title: 'AES 加密支持',
        desc: '自动识别并解密常见的 AES-128 加密视频流',
      },
      resumeFromCache: {
        title: '缓存续传',
        desc: '下载失败会保留缓存，重试时只下载失败的片段，节省带宽和时间',
      },
      webui: {
        title: 'WebUI 管理',
        desc: '基于 Vue 3 构建的现代化 Web 界面，实时显示下载进度和状态',
      },
      videoParse: {
        title: '视频解析',
        desc: '支持抖音、微博、皮皮虾等平台的视频分享链接解析，无水印下载',
      },
      smartExtract: {
        title: '智能提取',
        desc: '支持从视频播放页面自动提取 m3u8 地址，支持多层级页面搜索',
      },
      multipleWays: {
        title: '多种使用方式',
        desc: '支持 CLI 命令行、Node.js API、Web 服务、Docker 部署、Electron 桌面应用',
      },
    },
    usage: {
      title: '使用方式',
      subtitle: '多种使用方式，满足不同场景需求',
      cli: {
        title: '命令行工具',
        description: '快速安装，即刻使用',
      },
      api: {
        title: 'Node.js API',
        description: '开发者友好，高度可定制',
      },
      web: {
        title: 'Web 服务',
        description: '可视化界面，操作简单',
      },
      docker: {
        title: 'Docker 部署',
        description: '容器化部署，易于管理',
      },
      client: {
        title: '安装客户端',
        description: '下载桌面客户端，提供更丰富的功能和更好的用户体验',
        link: './download',
        linkText: '前往下载页面',
      },
      online: {
        title: '使用在线下载',
        description: '无需安装，直接在浏览器中使用在线工具下载 M3U8 视频',
        link: 'https://m3u8-downloader.lzw.me',
        linkText: '打开M3U8在线工具',
      },
    },
    cta: {
      title: '开始使用 M3U8-DL',
      subtitle: '立即下载并体验强大的 m3u8 视频下载功能',
      button: '前往下载页面',
    },
    browserExtension: {
      title: '浏览器插件 - m3u8-capture',
      subtitle: '自动抓取网页中的媒体链接，一键跳转下载',
      description:
        'm3u8-capture 是一个浏览器用户脚本（UserScript），可以自动监控并抓取网页中的 m3u8、mp4 等媒体链接，支持一键跳转到 M3U8-DL WebUI 进行下载。',
      features: {
        autoCapture: {
          title: '自动抓取',
          desc: '自动监控网页网络请求，检测到 m3u8 或 mp4 视频链接时自动添加到列表',
        },
        videoNameExtract: {
          title: '视频名称提取',
          desc: '优先从页面 h1、h2 或 document.title 提取视频名称',
        },
        jumpToDownload: {
          title: '一键跳转下载',
          desc: '点击"跳转下载"按钮，自动跳转到 M3U8-DL WebUI 并填充视频链接和名称',
        },
        exclusionRules: {
          title: '排除规则',
          desc: '可配置排除网址规则列表，匹配的网址不会显示面板且不会抓取视频链接',
        },
      },
      installation: {
        title: '安装方式',
        step1: {
          title: '安装用户脚本管理器',
          desc: '选择并安装以下任一扩展：',
          options: ['Violentmonkey (推荐)', 'Tampermonkey', 'Greasemonkey (仅 Firefox)'],
        },
        step2: {
          title: '安装脚本',
          desc: '打开用户脚本管理器，点击"添加新脚本"，复制以下链接内容并保存：',
          link: 'https://gh-proxy.com/https://raw.githubusercontent.com/lzwme/m3u8-dl/refs/heads/main/client/m3u8-capture.user.js',
        },
        step3: {
          title: '配置 WebUI 地址',
          desc: '访问任意网页，点击右上角的 🎬 图标打开抓取面板，点击设置按钮 ⚙️，输入您的 M3U8-DL WebUI 地址（如：http://localhost:6600），也可以输入 https://m3u8-player.lzw.me/ 使用无弹窗广告的在线播放器播放，保存设置。',
        },
      },
      usage: {
        title: '使用示例',
        steps: [
          '访问视频播放页面',
          '脚本自动抓取视频链接，显示在右下角面板中',
          '点击"跳转下载"按钮',
          '自动跳转到 M3U8-DL WebUI，视频链接和名称自动填充',
          '在 WebUI 中点击"开始下载"',
        ],
      },
    },
  },
  download: {
    title: '下载 M3U8-DL',
    description: '选择适合您系统的版本进行下载',
    detectedSystem: '检测到您的系统',
    loading: '正在加载下载信息...',
    error: {
      title: '加载失败',
      retry: '重试',
    },
    recommended: {
      title: '为您的系统推荐下载：',
      version: '版本',
      releaseDate: '发布日期',
      size: '大小',
      downloadButton: '立即下载',
    },
    releases: {
      prerelease: '预发布版',
      downloadFiles: '下载列表',
      recommended: '推荐',
      download: '下载',
      publishedAt: '发布时间',
      noReleases: '暂无可用版本',
    },
    client: {
      title: '下载客户端',
      subtitle: '推荐使用桌面客户端，提供更丰富的功能和更好的用户体验',
    },
    cli: {
      title: 'CLI 命令行安装',
      subtitle: '通过包管理器安装命令行工具',
      description: '安装后可在终端中使用 m3u8dl 命令进行下载',
      npm: {
        title: 'NPM 安装',
      },
      yarn: {
        title: 'Yarn 安装',
      },
      pnpm: {
        title: 'PNPM 安装',
      },
      usage: {
        title: '使用示例',
      },
    },
    docker: {
      title: 'Docker 部署',
      subtitle: '使用 Docker 快速部署 WebUI 服务',
      description: '通过 Docker 容器运行 M3U8-DL WebUI，支持 Web 界面管理下载任务',
      dockerRun: {
        title: 'Docker Run',
      },
      dockerCompose: {
        title: 'Docker Compose',
        fileSource: 'docker-compose.yml 文件内容来源',
      },
      access: {
        title: '访问地址',
        desc: '部署完成后，访问 http://localhost:6600 使用 WebUI',
      },
    },
    browserExtension: {
      title: '浏览器插件 - m3u8-capture',
      subtitle: '自动抓取网页中的媒体链接，一键跳转下载',
      description:
        'm3u8-capture 是一个浏览器用户脚本（UserScript），可以自动监控并抓取网页中的 m3u8、mp4 等媒体链接，支持一键跳转到 M3U8-DL WebUI 进行下载。',
      features: {
        autoCapture: {
          title: '自动抓取',
          desc: '自动监控网页网络请求，检测到 m3u8 或 mp4 视频链接时自动添加到列表',
        },
        videoNameExtract: {
          title: '视频名称提取',
          desc: '优先从页面 h1、h2 或 document.title 提取视频名称',
        },
        jumpToDownload: {
          title: '一键跳转下载',
          desc: '点击"跳转下载"按钮，自动跳转到 M3U8-DL WebUI 并填充视频链接和名称',
        },
        exclusionRules: {
          title: '排除规则',
          desc: '可配置排除网址规则列表，匹配的网址不会显示面板且不会抓取视频链接',
        },
      },
      installation: {
        title: '安装方式',
        step1: {
          title: '安装用户脚本管理器',
          desc: '选择并安装以下任一扩展：',
          options: ['Violentmonkey (推荐)', 'Tampermonkey', 'Greasemonkey (仅 Firefox)'],
        },
        step2: {
          title: '安装脚本',
          desc: '打开用户脚本管理器，点击"添加新脚本"，复制以下链接内容并保存：',
          link: 'https://gh-proxy.com/https://raw.githubusercontent.com/lzwme/m3u8-dl/refs/heads/main/client/m3u8-capture.user.js',
        },
        step3: {
          title: '配置 WebUI 地址',
          desc: '访问任意网页，点击右上角的 🎬 图标打开抓取面板，点击设置按钮 ⚙️，输入您的 M3U8-DL WebUI 地址（如：http://localhost:6600），也可以输入 https://m3u8-player.lzw.me/ 使用无弹窗广告在线播放器播放，保存设置。',
        },
      },
      usage: {
        title: '使用示例',
        steps: [
          '访问视频播放页面',
          '脚本自动抓取视频链接，显示在右下角面板中',
          '点击"跳转下载"按钮',
          '自动跳转到 M3U8-DL WebUI，视频链接和名称自动填充',
          '在 WebUI 中点击"开始下载"',
        ],
      },
    },
  },
  footer: {
    about: {
      title: '关于项目',
      description: '一个免费开源功能强大的 m3u8 视频批量下载工具，支持多线程下载、边下边播、WebUI 管理、视频解析等多种功能。',
    },
    links: {
      title: '快速链接',
      github: 'GitHub 仓库',
      npm: 'NPM 包',
      download: '下载客户端',
    },
    license: {
      title: '许可证',
      text: 'MIT License',
      copyright: '© 2024 lzwme. All rights reserved.',
    },
  },
};
