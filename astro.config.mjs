import { defineConfig } from 'astro/config';
import tailwindcss from '@tailwindcss/vite';
import { readFileSync } from 'node:fs';

const resume = JSON.parse(readFileSync(new URL('./src/data/resume.json', import.meta.url), 'utf8'));

export default defineConfig({
  site: resume.meta.siteUrl,
  // CSS sempre em arquivo: a CSP não precisa de 'unsafe-inline'.
  build: { inlineStylesheets: 'never' },
  vite: {
    plugins: [tailwindcss()],
    build: { assetsInlineLimit: 0 },
  },
});
