// O Astro gera /en/404/index.html, mas o Cloudflare Pages procura o 404.html mais próximo na árvore: /en/404.html.
import { existsSync, renameSync, rmdirSync } from 'node:fs';

const dir = new URL('../dist/en/404/', import.meta.url);
const source = new URL('index.html', dir);
if (!existsSync(source)) {
  console.error('404 em inglês não encontrado em dist/en/404/index.html.');
  process.exit(1);
}
renameSync(source, new URL('../dist/en/404.html', import.meta.url));
rmdirSync(dir);
console.log('404 em inglês movido para dist/en/404.html.');
