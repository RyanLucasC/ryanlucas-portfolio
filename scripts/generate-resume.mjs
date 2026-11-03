// Resume as Code: lê os dados de cada idioma e gera o PDF e sua prévia.
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { createElement } from 'react';
import { renderToBuffer } from '@react-pdf/renderer';
import { createCanvas } from '@napi-rs/canvas';
import { getDocument } from 'pdfjs-dist/legacy/build/pdf.mjs';
import { ResumeDocument } from './resume-document.mjs';
import { LANGS, dataFile } from '../src/lib/i18n.mjs';

const root = new URL('../', import.meta.url);
const generated = new URL('public/generated/', root);
mkdirSync(generated, { recursive: true });

const manifest = {};
for (const lang of LANGS) {
const resume = JSON.parse(readFileSync(new URL(`src/data/${dataFile(lang)}`, root)));
const pdf = await renderToBuffer(createElement(ResumeDocument, { resume, lang }));
writeFileSync(new URL(`public/${resume.meta.pdfFile}`, root), pdf);

// Prévia real do PDF gerado, para o site nunca mostrar uma imagem desatualizada.
const doc = await getDocument({ data: new Uint8Array(pdf), verbosity: 0 }).promise;
const pages = [];
for (let n = 1; n <= doc.numPages; n += 1) {
  const page = await doc.getPage(n);
  const viewport = page.getViewport({ scale: 1.5 });
  const canvas = createCanvas(viewport.width, viewport.height);
  await page.render({ canvasContext: canvas.getContext('2d'), viewport, canvas }).promise;
  const file = `curriculo-${lang}-${n}.webp`;
  writeFileSync(new URL(file, generated), canvas.toBuffer('image/webp', 82));
  pages.push({ file: `/generated/${file}`, width: Math.round(viewport.width), height: Math.round(viewport.height) });
}

manifest[lang] = { pages, pdfBytes: pdf.length };
console.log(`PDF ${lang}: ${doc.numPages} página(s), ${(pdf.length / 1024).toFixed(0)} KB.`);
}

writeFileSync(new URL('manifest.json', generated), JSON.stringify(manifest));
