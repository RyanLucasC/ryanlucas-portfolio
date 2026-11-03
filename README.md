# Portfólio · Resume as Code

[**ryanlucascardoso.pages.dev**](https://ryanlucascardoso.pages.dev) · [English version](https://ryanlucascardoso.pages.dev/en/)

[![Prévia do portfólio](https://ryanlucascardoso.pages.dev/generated/og.jpg)](https://ryanlucascardoso.pages.dev)

Meu portfólio e meu currículo em PDF saem do mesmo lugar: um arquivo de dados por idioma. Atualizar a carreira é editar esse arquivo; o build valida o conteúdo, gera o site nos dois idiomas, gera o PDF e publica.

## O problema

Site, currículo e versão em inglês costumam ser mantidos à mão, em lugares diferentes, e logo passam a se contradizer. Aqui não existe cópia para esquecer de atualizar.

## Como funciona

```text
resume.json ─────┐
                 ├─► check-data ─► generate-resume ─► astro build ─► Cloudflare Pages
resume.en.json ──┘   validação     PDF + prévia        site estático   deploy a cada push
                                   generate-clouds
                                   arte ASCII e imagem de compartilhamento
```

## Destaques

- **Validação como portão do build:** telefone, endereço, HTML, credenciais, links sem HTTPS ou status desconhecido reprovam a publicação. As versões em português e inglês precisam ter a mesma estrutura, então nada some de um idioma sem aviso.
- **Currículo em PDF no estilo LaTeX**, gerado com `@react-pdf` e a fonte Computer Modern. A prévia exibida no site é renderizada do próprio PDF, por isso nunca fica desatualizada.
- **Segurança:** zero JavaScript no navegador, CSP `default-src 'none'`, cabeçalhos de segurança e foto sem metadados.
- **Desempenho e acessibilidade:** nota 100 no Lighthouse em desempenho, acessibilidade, boas práticas e SEO, link para pular ao conteúdo e animações que respeitam `prefers-reduced-motion`.
- **Arte ASCII gerada por código:** nuvens modeladas como volumes 3D iluminados, convertidas em caracteres com cor própria.
- **CI no GitHub Actions** (instalação limpa, `npm audit` e build) e deploy contínuo no Cloudflare Pages.

## Stack

| Área | Tecnologias |
| --- | --- |
| Site | Astro, Tailwind CSS |
| Geração | Node.js, React (`@react-pdf`), pdf.js, Canvas |
| Infra | GitHub Actions, Cloudflare Pages |

## Rodar localmente

```bash
npm install
npm run dev     # valida os dados, gera PDF e imagens e abre http://localhost:4321
npm run build   # gera a versão de produção em dist/
```

## Estrutura

| Caminho | Conteúdo |
| --- | --- |
| `src/data/` | `resume.json` e `resume.en.json`, a fonte de todo o conteúdo |
| `src/components/` | Página e componentes (tabelas, badges de status, kanban, cards, céu ASCII) |
| `src/lib/` | Textos fixos de cada idioma e vocabulário de status |
| `scripts/` | Validação, geração do PDF e da arte ASCII |
| `public/_headers` | CSP e cabeçalhos de segurança |
