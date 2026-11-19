// Logotipo de cada tecnologia, em public/icons/ (licenças em public/icons/LICENSES.txt).
// Tag sem logotipo, ou com um que não se lê em 16 px (SQL, Alembic, nginx...), aparece só com o nome.
const ICONS = {
  Python: 'python',
  JavaScript: 'javascript',
  FastAPI: 'fastapi',
  SQLite: 'sqlite',
  Linux: 'linux',
  Git: 'git',
  pytest: 'pytest',
  'GitHub Actions': 'githubactions',
  HTML: 'html5',
  CSS: 'css3',
  Astro: 'astro',
  'Tailwind CSS': 'tailwindcss',
  'Node.js': 'nodejs',
  React: 'react',
  Claude: 'claude',
  Gemini: 'gemini',
  Antigravity: 'antigravity',
  DeepSeek: 'deepseek',
};

export const iconFor = (tag) => (ICONS[tag] ? `/icons/${ICONS[tag]}.svg` : null);
