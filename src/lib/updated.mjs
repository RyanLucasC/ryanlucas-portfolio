// Data da última alteração de conteúdo: o último commit em src/data. Sem git, cai na data do build.
import { execFileSync } from 'node:child_process';

let cached;

export function contentUpdatedAt() {
  if (cached) return cached;
  try {
    const out = execFileSync('git', ['log', '-1', '--format=%cI', '--', 'src/data'], {
      cwd: process.cwd(),
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'ignore'],
    }).trim();
    if (out) cached = new Date(out);
  } catch {
    // git ausente ou fora de um repositório
  }
  cached ??= new Date();
  return cached;
}
