# Portfólio de Ryan Lucas Cardoso

Site estático em Astro + Tailwind, no formato Resume as Code: `src/data/resume.json` é a única fonte do site e do PDF.

## Comandos

```bash
npm install
npm run dev      # valida os dados, gera o PDF e abre o site local
npm run build    # valida, gera o PDF e publica em dist/
```

## Como atualizar

Edite `src/data/resume.json` (português) e `src/data/resume.en.json` (inglês). Os dois precisam ter a mesma estrutura, ou o build falha. O build falha se o arquivo tiver telefone, endereço, HTML, credencial, link sem https ou status desconhecido. E-mail só é aceito em `contact.email`.

## Estrutura

| Caminho | Função |
| --- | --- |
| `src/data/resume.json`, `resume.en.json` | Fonte da verdade, uma por idioma |
| `src/lib/i18n.mjs` | Textos fixos da interface e do PDF |
| `src/lib/status.mjs` | Status e rótulos dos badges |
| `src/components/` | `Portfolio` (a página), `StatusBadge`, `TagList`, `DataTable`, `KanbanBoard`, `ProjectCard`, `AsciiSky` |
| `scripts/check-data.mjs` | Validação de segurança e privacidade dos dados |
| `scripts/generate-resume.mjs` | Gera o PDF e sua prévia em `public/` |
| `scripts/resume-document.mjs` | Layout do PDF |
| `scripts/generate-clouds.mjs` | Gera as nuvens em ASCII colorido |
| `public/_headers` | CSP e cabeçalhos de segurança (Cloudflare Pages) |

## Deploy no Cloudflare Pages

1. Envie o repositório ao GitHub.
2. No Cloudflare: Workers & Pages → Create → Pages → conecte o repositório.
3. Build command: `npm run build`. Output directory: `dist`.
4. Se o endereço final não for `ryanlucascardoso.pages.dev`, atualize `meta.siteUrl` no `resume.json`.
