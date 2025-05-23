/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_URL: string;
  readonly VITE_PORT: string;
  readonly VITE_USE_MOCK_API: string;
  // thêm các biến môi trường khác ở đây
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
} 