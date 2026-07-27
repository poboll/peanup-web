import { defineConfig } from 'astro/config';

export default defineConfig({
  output: 'static',
  site: 'https://pean.caiths.com',
  vite: {
    build: {
      assetsInlineLimit: 4096,
    },
  },
});
