import type { APIRoute } from 'astro';
import resume from '../data/resume.json';
import { UI } from '../lib/i18n.mjs';
import { contentUpdatedAt } from '../lib/updated.mjs';

const escape = (text: string) => text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

export const GET: APIRoute = () => {
  const href = (path: string) => escape(new URL(path, resume.meta.siteUrl).href);
  const lastmod = contentUpdatedAt().toISOString().slice(0, 10);
  const langs = Object.values(UI);
  const alternates = [
    ...langs.map((t) => `    <xhtml:link rel="alternate" hreflang="${t.htmlLang}" href="${href(t.path)}" />`),
    `    <xhtml:link rel="alternate" hreflang="x-default" href="${href(UI.pt.path)}" />`,
  ].join('\n');
  const urls = langs
    .map((t) => `  <url>\n    <loc>${href(t.path)}</loc>\n    <lastmod>${lastmod}</lastmod>\n${alternates}\n  </url>`)
    .join('\n');
  const body = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">\n${urls}\n</urlset>\n`;
  return new Response(body, { headers: { 'Content-Type': 'application/xml; charset=utf-8' } });
};
