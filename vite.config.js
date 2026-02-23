import { defineConfig } from 'vite';

export default defineConfig({
  server: {
    port: 3000,
    open: true,
    proxy: {
      '/api/shorten': 'http://localhost:8787',
      '/s/': 'http://localhost:8787',
    },
  },
  build: {
    outDir: 'dist',
    sourcemap: true,
  },
});
