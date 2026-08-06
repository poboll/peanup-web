import { defineConfig } from 'astro/config';

export default defineConfig({
  output: 'static',
  site: 'https://pean.caiths.com',
  devToolbar: {
    enabled: false,
  },
  server: {
    host: '127.0.0.1',
    port: 4321,
  },
  vite: {
    server: {
      strictPort: true,
    },
    preview: {
      port: 4321,
      strictPort: true,
    },
    build: {
      assetsInlineLimit: 4096,
    },
  },
});
