import { defineConfig } from 'astro/config';
import vercel from '@astrojs/vercel';

export default defineConfig({
  output: 'static',
  adapter: vercel(),
  site: 'https://pean.caiths.com',
  vite: {
    build: {
      assetsInlineLimit: 4096,
    },
  },
});
