#!/usr/bin/env node
// Instala as skills do claude-bootstrap em <projeto>/.claude/skills ou em ~/.claude/skills.
import { cpSync, existsSync, mkdirSync, readdirSync, rmSync } from 'node:fs';
import { homedir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const SKILLS_DIR = join(dirname(fileURLToPath(import.meta.url)), '..', 'skills');
const AVAILABLE = readdirSync(SKILLS_DIR, { withFileTypes: true })
  .filter((d) => d.isDirectory())
  .map((d) => d.name)
  .sort();

const HELP = `claude-bootstrap — instala skills do Claude Code

Uso:
  npx github:victorbeppler/claude-bootstrap [destino] [opções]

Argumentos:
  destino              Pasta do projeto (padrão: diretório atual).
                       As skills vão para <destino>/.claude/skills/

Opções:
  -g, --global         Instala em ~/.claude/skills/ (vale para todos os projetos)
  -o, --only <lista>   Só estas skills, separadas por vírgula (padrão: todas)
  -f, --force          Sobrescreve skills que já existem no destino
  -l, --list           Lista as skills disponíveis
  -h, --help           Mostra esta ajuda

Skills disponíveis: ${AVAILABLE.join(', ')}
`;

function parseArgs(argv) {
  const opts = { target: process.cwd(), global: false, only: AVAILABLE, force: false };
  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    switch (arg) {
      case '-g':
      case '--global':
        opts.global = true;
        break;
      case '-o':
      case '--only': {
        const value = argv[++i];
        if (!value) fail('--only precisa de uma lista (ex.: --only bootstrap,pentest)');
        opts.only = value.split(',').map((s) => s.trim()).filter(Boolean);
        break;
      }
      case '-f':
      case '--force':
        opts.force = true;
        break;
      case '-l':
      case '--list':
        console.log(AVAILABLE.join('\n'));
        process.exit(0);
      case '-h':
      case '--help':
        console.log(HELP);
        process.exit(0);
      default:
        if (arg.startsWith('-')) fail(`opção desconhecida: ${arg}`);
        opts.target = resolve(arg);
    }
  }
  return opts;
}

function fail(message) {
  console.error(`✖ ${message}\n`);
  console.error(HELP);
  process.exit(1);
}

const opts = parseArgs(process.argv.slice(2));

const unknown = opts.only.filter((name) => !AVAILABLE.includes(name));
if (unknown.length) fail(`skill inexistente: ${unknown.join(', ')}`);

if (!opts.global && !existsSync(opts.target)) fail(`destino não existe: ${opts.target}`);

const dest = opts.global
  ? join(homedir(), '.claude', 'skills')
  : join(opts.target, '.claude', 'skills');
mkdirSync(dest, { recursive: true });

console.log(`→ Instalando em ${dest}\n`);

let installed = 0;
for (const name of opts.only) {
  const to = join(dest, name);
  if (existsSync(to)) {
    if (!opts.force) {
      console.log(`  ⏭  ${name} (já existe — use --force para sobrescrever)`);
      continue;
    }
    rmSync(to, { recursive: true, force: true });
  }
  cpSync(join(SKILLS_DIR, name), to, { recursive: true });
  console.log(`  ✔  ${name}`);
  installed++;
}

console.log(`\n${installed} skill(s) instalada(s).`);
if (installed) {
  console.log(`
Próximos passos:
  1. Abra o Claude Code na raiz do projeto:   claude
  2. Use o modelo e esforço máximos:          /model opus   e   /effort max
  3. Rode a skill:                            /bootstrap
`);
}
