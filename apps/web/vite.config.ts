import { defineConfig } from 'vite';
import { fileURLToPath } from 'node:url';

const coreEntry = fileURLToPath(new URL('../../packages/core/src/index.ts', import.meta.url));

export default defineConfig({
  // 相对 base：既能用 vite preview，也能直接丢进任意静态服务器 / WKWebView 壳
  base: './',
  resolve: {
    alias: {
      '@core': coreEntry,
    },
  },
  server: {
    host: '127.0.0.1',
    port: 5173,
    fs: {
      // 允许读取 packages/core（在工作区根之下）
      allow: [fileURLToPath(new URL('../..', import.meta.url))],
    },
  },
  build: {
    target: 'es2022',
    outDir: 'dist',
    sourcemap: true,
  },
});
