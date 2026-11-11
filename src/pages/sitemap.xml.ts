import type { APIRoute } from 'astro';
import resume from '../data/resume.json';
import { UI } from '../lib/i18n.mjs';
import { contentUpdatedAt } from '../lib/updated.mjs';

// Páginas publicadas nos dois idiomas, relativas à raiz de cada idioma.
const PAGES = ['', 'erp/'];

const escape = (text: string) => text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

export const GET: APIRoute = () => {
  const href = (path: string) => escape(new URL(path, resume.meta.siteUrl).href);
  const lastmod = contentUpdatedAt().toISOString().slice(0, 10);
  const langs = Object.values(UI);
  const alternates = (page: string) =>
    [
      ...langs.map((t) => `    <xhtml:link rel="alternate" hreflang="${t.htmlLang}" href="${href(t.path + page)}" />`),
      `    <xhtml:link rel="alternate" hreflang="x-default" href="${href(UI.pt.path + page)}" />`,
    ].join('\n');
  const urls = PAGES.flatMap((page) =>
    langs.map(
      (t) => `  <url>\n    <loc>${href(t.path + page)}</loc>\n    <lastmod>${lastmod}</lastmod>\n${alternates(page)}\n  </url>`,
    ),
  ).join('\n');
  const body = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">\n${urls}\n</urlset>\n`;
  return new Response(body, { headers: { 'Content-Type': 'application/xml; charset=utf-8' } });
};
