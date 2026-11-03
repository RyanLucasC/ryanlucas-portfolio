// Nuvens em ASCII colorido: volumes iluminados, um caractere por célula e cor por caractere.
// Saem como imagem porque milhares de <span> coloridos pesariam mais que um WebP pequeno.
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { GlobalFonts, createCanvas, loadImage } from '@napi-rs/canvas';

const COLS = 96;
const ROWS = 36;
const CELL = { w: 10, h: 20 }; // 2x: a imagem é exibida com metade deste tamanho
const ASPECT = CELL.h / CELL.w;
const SCALE = COLS / 64;
const BASE_Y = 44 * SCALE;
const FONT = 'Hanken Grotesk';

GlobalFonts.registerFromPath(
  fileURLToPath(new URL('../node_modules/@fontsource/hanken-grotesk/files/hanken-grotesk-latin-700-normal.woff2', import.meta.url)),
  FONT,
);

const SHAPE_A = [
  [13, 33, 10],
  [25, 25, 14],
  [39, 21, 14],
  [51, 32, 11],
  [32, 33, 12],
  [44, 35, 9],
  [20, 37, 8],
];
const SHAPE_B = [
  [11, 35, 9],
  [21, 28, 11],
  [32, 19, 14],
  [45, 27, 12],
  [54, 35, 8],
  [31, 34, 12],
  [42, 37, 8],
];

// Da sombra à luz; a última cor é o brilho do topo.
const CLOUDS = [
  { file: 'ec2', label: 'EC2', shape: SHAPE_A, mirror: false, ramp: ['#3b2a8c', '#7a4ff0', '#ab7df8', '#f08ad6', '#ffe9fb'] },
  { file: 's3', label: 'S3', shape: SHAPE_B, mirror: false, ramp: ['#123a7a', '#1f7ae0', '#38c8f0', '#7ff0e0', '#eafffb'] },
  { file: 'lambda', label: 'λ', shape: SHAPE_A, mirror: true, ramp: ['#5a1f7a', '#c23fc0', '#ff6fa8', '#ffa0a0', '#fff0ee'] },
  { file: 'rds', label: 'RDS', shape: SHAPE_B, mirror: true, ramp: ['#23307f', '#3f5ff0', '#7d8cff', '#b9a6ff', '#f2eeff'] },
];

const LIGHT = (() => {
  const [x, y, z] = [-0.55, -0.7, 0.45];
  const length = Math.hypot(x, y, z);
  return [x / length, y / length, z / length];
})();

const grain = (col, row) => Math.abs(Math.sin(col * 12.9898 + row * 78.233) * 43758.5453) % 1;

function surface(col, row, shape) {
  const puffs = shape.map(([cx, cy, r]) => [cx * SCALE, cy * SCALE, r * SCALE]);
  const x = col + 0.5;
  const y = (row + 0.5) * ASPECT;
  if (y > BASE_Y) return null;
  let top = null;
  for (const [cx, cy, r] of puffs) {
    const dx = x - cx;
    const dy = y - cy;
    const z2 = r * r - dx * dx - dy * dy;
    if (z2 <= 0) continue;
    const z = Math.sqrt(z2);
    if (!top || z > top.z) top = { z, nx: dx / r, ny: dy / r, nz: z / r };
  }
  if (!top) return null;
  const diffuse = top.nx * LIGHT[0] + top.ny * LIGHT[1] + top.nz * LIGHT[2];
  const belly = Math.min(1, (BASE_Y - y) / (12 * SCALE));
  const shade = (0.16 + diffuse * 0.8) * (0.5 + 0.5 * belly) + (grain(col, row) - 0.5) * 0.06;
  return { nx: top.nx, ny: top.ny, shade: Math.max(0, Math.min(0.999, shade)) };
}

// Mistura hachura que segue o volume com uma rampa de densidade, para dar textura.
const RAMP = '.:-=+*%#@';
function glyph({ nx, ny, shade }, col, row) {
  if (grain(row, col) > 0.45) return RAMP[Math.floor(shade * RAMP.length)];
  if (shade < 0.12) return '.';
  if (Math.abs(nx) > Math.abs(ny) * 1.8) return '|';
  if (Math.abs(ny) > Math.abs(nx) * 1.8) return '-';
  return nx * ny > 0 ? '\\' : '/';
}

const hex = (color) => [1, 3, 5].map((i) => parseInt(color.slice(i, i + 2), 16));

function colorAt(ramp, t) {
  const scaled = t * (ramp.length - 1);
  const i = Math.min(ramp.length - 2, Math.floor(scaled));
  const [a, b] = [hex(ramp[i]), hex(ramp[i + 1])];
  return `rgb(${a.map((v, c) => Math.round(v + (b[c] - v) * (scaled - i))).join(',')})`;
}

// Máscara do rótulo na mesma grade da nuvem.
function labelMask(label) {
  const canvas = createCanvas(COLS, ROWS);
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  ctx.fillStyle = '#000';
  ctx.fillRect(0, 0, COLS, ROWS);
  ctx.translate(COLS / 2, ROWS * 0.62);
  ctx.scale(ASPECT * 0.82, 1); // compensa a célula mais alta que larga
  ctx.fillStyle = '#fff';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.font = `700 ${label.length > 2 ? 15 : 18}px "${FONT}"`;
  ctx.fillText(label, 0, 0);
  const { data } = ctx.getImageData(0, 0, COLS, ROWS);
  return (col, row) => data[(row * COLS + col) * 4] > 110;
}

function renderCloud({ label, shape, mirror, ramp }) {
  const puffs = mirror ? shape.map(([x, y, r]) => [64 - x, y, r]) : shape;
  const inLabel = labelMask(label);
  const nearLabel = (col, row) =>
    [-1, 0, 1].some((dx) => [0].some((dy) => inLabel(Math.max(0, Math.min(COLS - 1, col + dx)), Math.max(0, Math.min(ROWS - 1, row + dy)))));

  const canvas = createCanvas(COLS * CELL.w, ROWS * CELL.h);
  const ctx = canvas.getContext('2d');
  ctx.font = `700 ${CELL.h * 0.9}px "${FONT}"`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';

  for (let row = 0; row < ROWS; row += 1) {
    for (let col = 0; col < COLS; col += 1) {
      const point = surface(col, row, puffs);
      if (!point) continue;
      const lit = inLabel(col, row);
      if (!lit && nearLabel(col, row)) continue; // respiro em volta do rótulo
      ctx.fillStyle = lit ? '#ffffff' : colorAt(ramp, 0.22 + 0.78 * point.shade ** 0.7);
      ctx.fillText(lit ? '#' : glyph(point, col, row), (col + 0.5) * CELL.w, (row + 0.5) * CELL.h);
    }
  }
  return canvas.toBuffer('image/webp', 72);
}

const out = new URL('../public/generated/clouds/', import.meta.url);
mkdirSync(out, { recursive: true });
for (const cloud of CLOUDS) {
  const buffer = renderCloud(cloud);
  writeFileSync(new URL(`${cloud.file}.webp`, out), buffer);
  console.log(`${cloud.file}: ${Math.round(buffer.length / 1024)} KB`);
}

// Imagem de compartilhamento: mesma identidade do site, com os dados do resume.json.
const { person } = JSON.parse(readFileSync(new URL('../src/data/resume.json', import.meta.url), 'utf8'));
const og = createCanvas(1200, 630);
const ctx = og.getContext('2d');
ctx.fillStyle = '#0d1117';
ctx.fillRect(0, 0, 1200, 630);
ctx.drawImage(await loadImage(readFileSync(new URL('ec2.webp', out))), 730, 145, 450, 338);
ctx.fillStyle = '#e6edf3';
ctx.font = `700 112px "${FONT}"`;
ctx.fillText('RYAN LUCAS', 64, 250);
ctx.fillText('CARDOSO', 64, 362);
ctx.fillStyle = '#ab7df8';
ctx.font = `700 34px "${FONT}"`;
ctx.fillText(person.headline, 64, 430);
writeFileSync(new URL('../og.jpg', out), og.toBuffer('image/jpeg', 86));
