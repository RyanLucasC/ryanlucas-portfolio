// Portão do build: os dados são publicados, então nada sensível ou inválido passa daqui.
import { readFileSync } from 'node:fs';
import { STATUS } from '../src/lib/status.mjs';
import { LANGS, dataFile } from '../src/lib/i18n.mjs';

const errors = [];

const PHONE = /(?:\+?55[\s-]?)?\(?\d{2}\)?[\s-]?9?\d{4}[\s-]?\d{4}\b/;
const EMAIL = /[\w.+-]+@[\w-]+\.[\w.]+/;
const ADDRESS = /\b(rua|avenida|av\.|travessa|cep)\b/i;
const SECRET = /(api[_-]?key|secret|token|password|senha)\s*["':=]/i;
const MARKUP = /[<>]/;

function walk(value, path, report) {
  if (Array.isArray(value)) return value.forEach((v, i) => walk(v, `${path}[${i}]`, report));
  if (value && typeof value === 'object') {
    return Object.entries(value).forEach(([k, v]) => walk(v, `${path}.${k}`, report));
  }
  if (typeof value !== 'string') return;

  if (PHONE.test(value)) report(`${path}: parece um telefone`);
  if (ADDRESS.test(value)) report(`${path}: parece um endereço físico`);
  if (MARKUP.test(value)) report(`${path}: marcação HTML não é permitida`);
  if (EMAIL.test(value) && path !== '$.contact.email') report(`${path}: e-mail fora de contact.email`);
  if (path.endsWith('.url') || path === '$.meta.siteUrl') {
    if (new URL(value).protocol !== 'https:') report(`${path}: só https é permitido`);
  }
  if (path.endsWith('.status') && !STATUS[value]) report(`${path}: status desconhecido "${value}"`);
}

// Os idiomas precisam ter a mesma estrutura: nada some de uma versão sem o build avisar.
function compare(a, b, path) {
  if (Array.isArray(a) !== Array.isArray(b) || typeof a !== typeof b) {
    errors.push(`${path}: tipos diferentes entre idiomas`);
    return;
  }
  if (Array.isArray(a)) {
    if (a.length !== b.length) errors.push(`${path}: ${a.length} itens em um idioma e ${b.length} no outro`);
    a.forEach((value, i) => i < b.length && compare(value, b[i], `${path}[${i}]`));
    return;
  }
  if (a && typeof a === 'object') {
    for (const key of new Set([...Object.keys(a), ...Object.keys(b)])) {
      if (key in a && key in b) compare(a[key], b[key], `${path}.${key}`);
      else errors.push(`${path}.${key}: falta em um idioma`);
    }
  }
}

const versions = LANGS.map((lang) => {
  const file = dataFile(lang);
  const raw = readFileSync(new URL(`../src/data/${file}`, import.meta.url), 'utf8');
  const resume = JSON.parse(raw);
  const report = (message) => errors.push(`${file} ${message}`);

  walk(resume, '$', report);
  if (SECRET.test(raw)) report('parece conter uma credencial');
  if (!/^[\w-]+\.pdf$/.test(resume.meta.pdfFile)) report('meta.pdfFile: nome de arquivo inválido');
  return resume;
});
compare(versions[0], versions[1], '$');

if (errors.length) {
  console.error(`Dados reprovados:\n- ${errors.join('\n- ')}`);
  process.exit(1);
}
console.log('Dados aprovados nos dois idiomas.');
