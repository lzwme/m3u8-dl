export default {
  common: {
    home: 'Home',
    download: 'Download',
    online: 'M3U8 Downloader Online',
    player: 'M3U8 Player Online',
    api: 'API',
    github: 'GitHub',
    language: 'Language',
    learnMore: 'Learn More',
    browserWarning: 'Your browser kernel version is detected to be too low, which may prevent some content from displaying correctly. It is recommended to upgrade to the latest version of Chrome, Edge, or other modern browsers.',
    close: 'Close',
  },
  home: {
    title: 'M3U8-DL - Powerful m3u8 Video Batch Downloader',
    description:
      'A free, open-source, and powerful m3u8 video batch downloader with multi-threaded downloading, play-while-downloading, WebUI management, video parsing, and more.',
    keywords: 'm3u8,download,video download,batch download,m3u8 downloader,video tools,open source tools',
    hero: {
      title: 'M3U8-DL',
      subtitle: 'A free, open-source, and powerful m3u8 video batch downloader',
      download: 'Download Now',
      viewSource: 'View Source',
      typewriter: ['M3U8-DL', 'Powerful Video Downloader', 'Open Source & Free', 'Multi-threaded Acceleration'],
      features: {
        smartExtract: 'Smart Extract',
        streamingPlayback: 'Stream & Download',
        cacheResume: 'Cache & Resume',
        fastDownload: 'Fast Download',
      },
    },
    features: {
      title: 'Features',
      multiThread: {
        title: 'Multi-threaded Downloading',
        desc: 'Uses thread pool mode with customizable thread count, significantly improving download speed',
      },
      playWhileDownload: {
        title: 'Play-While-Downloading',
        desc: 'Supports online playback using downloaded ts cache files without waiting for complete download',
      },
      batchDownload: {
        title: 'Batch Downloading',
        desc: 'Supports batch downloading of multiple m3u8 addresses, supports batch import from text files',
      },
      aesSupport: {
        title: 'AES Encryption Support',
        desc: 'Automatically identifies and decrypts common AES-128 encrypted video streams',
      },
      resumeFromCache: {
        title: 'Resume from Cache',
        desc: 'Failed downloads retain cache, retries only download failed segments, saving bandwidth and time',
      },
      webui: {
        title: 'WebUI Management',
        desc: 'Modern web interface built with Vue 3, real-time display of download progress and status',
      },
      videoParse: {
        title: 'Video Parsing',
        desc: 'Supports video sharing link parsing from platforms like Douyin, Weibo, Pipixia, watermark-free download',
      },
      smartExtract: {
        title: 'Smart Extraction',
        desc: 'Supports automatic extraction of m3u8 addresses from video playback pages, supports multi-level page search',
      },
      multipleWays: {
        title: 'Multiple Usage Methods',
        desc: 'Supports CLI command line, Node.js API, Web service, Docker deployment, Electron desktop application',
      },
    },
    usage: {
      title: 'Usage Methods',
      subtitle: 'Multiple usage methods to meet different needs',
      cli: {
        title: 'Command Line Tool',
        description: 'Quick Install, Ready to Use',
      },
      api: {
        title: 'Node.js API',
        description: 'Developer Friendly, Highly Customizable',
      },
      web: {
        title: 'Web Service',
        description: 'Visual Interface, Easy to Use',
      },
      docker: {
        title: 'Docker Deployment',
        description: 'Containerized Deployment, Easy to Manage',
      },
      client: {
        title: 'Install Client',
        description: 'Download desktop client for richer features and better user experience',
        link: '/download',
        linkText: 'Go to Download Page',
      },
      online: {
        title: 'Use Online Downloader',
        description: 'No installation required, use the online tool directly in your browser to download M3U8 videos',
        link: 'https://m3u8-downloader.lzw.me/en',
        linkText: 'Open Online Tool',
      },
    },
    cta: {
      title: 'Get Started with M3U8-DL',
      subtitle: 'Download now and experience the powerful m3u8 video downloading features',
      button: 'Go to Download Page',
    },
    browserExtension: {
      title: 'Browser Extension - m3u8-capture',
      subtitle: 'Automatically capture media links from web pages, one-click jump to download',
      description:
        'm3u8-capture is a browser userscript that automatically monitors and captures m3u8, mp4 and other media links from web pages, supporting one-click jump to M3U8-DL WebUI for downloading.',
      features: {
        autoCapture: {
          title: 'Auto Capture',
          desc: 'Automatically monitors network requests in web pages, when m3u8 or mp4 video links are detected, automatically adds them to the list',
        },
        videoNameExtract: {
          title: 'Video Name Extraction',
          desc: 'Prioritizes extracting video names from page h1, h2, or document.title',
        },
        jumpToDownload: {
          title: 'Jump to Download',
          desc: 'Click the "Jump to Download" button to automatically jump to M3U8-DL WebUI and fill in video link and name',
        },
        exclusionRules: {
          title: 'Exclusion Rules',
          desc: 'In settings, you can configure exclusion URL rule list, matching URLs will not show panel and will not capture video links',
        },
      },
      installation: {
        title: 'Installation',
        step1: {
          title: 'Install Userscript Manager',
          desc: 'Choose and install one of the following extensions:',
          options: ['Violentmonkey (Recommended)', 'Tampermonkey', 'Greasemonkey (Firefox only)'],
        },
        step2: {
          title: 'Install Script',
          desc: 'Open userscript manager, click "Add new script", copy and save the content from the following link:',
          link: 'https://raw.githubusercontent.com/lzwme/m3u8-dl/refs/heads/main/client/m3u8-capture.user.js',
        },
        step3: {
          title: 'Configure WebUI Address',
          desc: 'Visit any web page, click the 🎬 icon in the top right corner to open the capture panel, click the settings button ⚙️, enter your M3U8-DL WebUI address (e.g., http://localhost:6600), or enter https://m3u8-player.lzw.me/ to use the ad-free online player, save settings.',
        },
      },
      usage: {
        title: 'Usage Example',
        steps: [
          'Visit video playback page',
          'Script automatically captures video links, displayed in the panel in the bottom right corner',
          'Click "Jump to Download" button',
          'Automatically jumps to M3U8-DL WebUI, video link and name are automatically filled',
          'Click "Start Download" in WebUI',
        ],
      },
    },
  },
  download: {
    title: 'Download M3U8-DL',
    description: 'Choose the version suitable for your system',
    detectedSystem: 'Detected System',
    loading: 'Loading download information...',
    error: {
      title: 'Load Failed',
      retry: 'Retry',
    },
    recommended: {
      title: 'Recommended download for your system:',
      version: 'Version',
      releaseDate: 'Release Date',
      size: 'Size',
      downloadButton: 'Download Now',
    },
    releases: {
      prerelease: 'Pre-release',
      downloadFiles: 'Download List',
      recommended: 'Recommended',
      download: 'Download',
      publishedAt: 'Published',
      noReleases: 'No releases available',
    },
    client: {
      title: 'Download Client',
      subtitle: 'Recommended desktop client with richer features and better user experience',
    },
    cli: {
      title: 'CLI Installation',
      subtitle: 'Install via package manager',
      description: 'After installation, use the m3u8dl command in terminal to download',
      npm: {
        title: 'NPM Install',
      },
      yarn: {
        title: 'Yarn Install',
      },
      pnpm: {
        title: 'PNPM Install',
      },
      usage: {
        title: 'Usage Example',
      },
    },
    docker: {
      title: 'Docker Deployment',
      subtitle: 'Quickly deploy WebUI service with Docker',
      description: 'Run M3U8-DL WebUI via Docker container, supports web interface for managing download tasks',
      dockerRun: {
        title: 'Docker Run',
      },
      dockerCompose: {
        title: 'Docker Compose',
        fileSource: 'docker-compose.yml file source',
      },
      access: {
        title: 'Access URL',
        desc: 'After deployment, visit http://localhost:6600 to use WebUI',
      },
    },
    browserExtension: {
      title: 'Browser Extension - m3u8-capture',
      subtitle: 'Automatically capture media links from web pages, one-click jump to download',
      description:
        'm3u8-capture is a browser userscript that automatically monitors and captures m3u8, mp4 and other media links from web pages, supporting one-click jump to M3U8-DL WebUI for downloading.',
      features: {
        autoCapture: {
          title: 'Auto Capture',
          desc: 'Automatically monitors network requests in web pages, when m3u8 or mp4 video links are detected, automatically adds them to the list',
        },
        videoNameExtract: {
          title: 'Video Name Extraction',
          desc: 'Prioritizes extracting video names from page h1, h2, or document.title',
        },
        jumpToDownload: {
          title: 'Jump to Download',
          desc: 'Click the "Jump to Download" button to automatically jump to M3U8-DL WebUI and fill in video link and name',
        },
        exclusionRules: {
          title: 'Exclusion Rules',
          desc: 'In settings, you can configure exclusion URL rule list, matching URLs will not show panel and will not capture video links',
        },
      },
      installation: {
        title: 'Installation',
        step1: {
          title: 'Install Userscript Manager',
          desc: 'Choose and install one of the following extensions:',
          options: ['Violentmonkey (Recommended)', 'Tampermonkey', 'Greasemonkey (Firefox only)'],
        },
        step2: {
          title: 'Install Script',
          desc: 'Open userscript manager, click "Add new script", copy and save the content from the following link:',
          link: 'https://raw.githubusercontent.com/lzwme/m3u8-dl/refs/heads/main/client/m3u8-capture.user.js',
        },
        step3: {
          title: 'Configure WebUI Address',
          desc: 'Visit any web page, click the 🎬 icon in the top right corner to open the capture panel, click the settings button ⚙️, enter your M3U8-DL WebUI address (e.g., http://localhost:6600), or enter https://m3u8-player.lzw.me/ to use the ad-free online player, save settings.',
        },
      },
      usage: {
        title: 'Usage Example',
        steps: [
          'Visit video playback page',
          'Script automatically captures video links, displayed in the panel in the bottom right corner',
          'Click "Jump to Download" button',
          'Automatically jumps to M3U8-DL WebUI, video link and name are automatically filled',
          'Click "Start Download" in WebUI',
        ],
      },
    },
  },
  footer: {
    about: {
      title: 'About Project',
      description:
        'A free, open-source, and powerful m3u8 video batch downloader with multi-threaded downloading, play-while-downloading, WebUI management, video parsing, and more.',
    },
    links: {
      title: 'Quick Links',
      github: 'GitHub Repository',
      npm: 'NPM Package',
      download: 'Download Client',
    },
    license: {
      title: 'License',
      text: 'MIT License',
      copyright: '© 2024 lzwme. All rights reserved.',
    },
  },
};
