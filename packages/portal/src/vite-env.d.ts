/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly MD_GA_ID?: string;
  readonly MD_BAIDU_ID?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
