// @ts-check
import { defineConfig, fontProviders, passthroughImageService } from 'astro/config';
import { satteri } from '@astrojs/markdown-satteri';
import sitemap from '@astrojs/sitemap';
import mdx from '@astrojs/mdx';
import rehypeLazyImages from './src/lib/rehype-lazy-images.mjs';

// https://astro.build/config
export default defineConfig({
  site: 'https://www.singureo.com',
  integrations: [sitemap(), mdx()],
  markdown: {
    processor: satteri({
      hastPlugins: [rehypeLazyImages()],
    }),
  },
  image: {
    service: passthroughImageService(),
  },
  fonts: [
    {
      provider: fontProviders.fontsource(),
      name: 'Noto Sans SC',
      cssVariable: '--font-noto-sans-sc',
      weights: [400],
      styles: ['normal'],
      subsets: ['chinese-simplified', 'latin'],
      fallbacks: ['sans-serif'],
    },
    {
      provider: fontProviders.fontsource(),
      name: 'Noto Sans JP',
      cssVariable: '--font-noto-sans-jp',
      weights: [400],
      styles: ['normal'],
      subsets: ['japanese', 'latin'],
      fallbacks: ['sans-serif'],
    },
    {
      provider: fontProviders.fontsource(),
      name: 'Noto Sans Mono',
      cssVariable: '--font-noto-sans-mono',
      weights: [400],
      styles: ['normal'],
      subsets: ['latin'],
      fallbacks: ['monospace'],
    },
  ],
  vite: {
    server: {
      watch: {
        usePolling: true,
        interval: 200,
      },
    },
    resolve: {
      alias: {
        '@': new URL('./src', import.meta.url).pathname,
      },
    },
  },
});
