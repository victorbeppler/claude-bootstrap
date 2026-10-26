#!/usr/bin/env node
// Gera prompt/setup-claude.md (prompt único para copiar e colar) a partir da skill bootstrap.
// Fonte da verdade: skills/bootstrap/. Rode `npm run build:prompt` após editar a skill.
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const SKILL = join(ROOT, 'skills', 'bootstrap');
const OUT = join(ROOT, 'prompt', 'setup-claude.md');

const ANEXOS = [
  ['A', 'diretrizes.md'],
  ['B', 'arquivos-base.md'],
  ['C', 'agentes.md'],
  ['D', 'comandos.md'],
];

const read = (...p) => readFileSync(join(SKILL, ...p), 'utf8').trim();
const stripFrontmatter = (md) => md.replace(/^---\n[\s\S]*?\n---\n/, '').trim();

const header = `<!--
  GERADO AUTOMATICAMENTE por scripts/build-prompt.mjs a partir de skills/bootstrap/.
  Não edite este arquivo direto: edite a skill e rode \`npm run build:prompt\`.
-->

> **Como usar este prompt**
>
> 1. Abra o Claude Code na raiz do projeto e rode \`/model opus\` e \`/effort max\`.
> 2. Se o projeto tiver repositórios irmãos, troque \`$ORG_PATH\`, \`$SIBLING_PROJECTS\` e
>    \`$ORG_SKILL_NAMESPACE\` pelos valores reais (tabela da Fase 0). Se for isolado, diga
>    "projeto standalone" junto com o prompt.
> 3. Cole este arquivo inteiro.
>
> Prefere não copiar e colar? Instale a skill e rode \`/bootstrap\`, como explicado no README.
> Os arquivos \`referencias/*.md\` citados abaixo estão nos **Anexos A–D** ao final.`;

const body = stripFrontmatter(read('SKILL.md'));

const anexos = ANEXOS.map(([letra, arquivo]) => {
  const md = read('referencias', arquivo);
  return md.replace(/^# (.+)$/m, `# Anexo ${letra} — $1 (\`referencias/${arquivo}\`)`);
});

mkdirSync(dirname(OUT), { recursive: true });
writeFileSync(OUT, [header, body, ...anexos].join('\n\n---\n\n') + '\n');
console.log(`✔ ${OUT.replace(ROOT + '/', '')} gerado`);
