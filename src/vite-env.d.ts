/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly LOCAL_ASSET_BASE_URL: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
