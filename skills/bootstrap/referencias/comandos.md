# Slash commands (`.claude/commands/`)

Cada arquivo `.md` tem frontmatter YAML + prompt e é invocado com `/nome-do-arquivo`.
`$ARGUMENTS` recebe o que o usuário digitar depois do comando.

| Comando | Delega para | Para quê |
|---|---|---|
| `/update-memory` | `docs` | Salvar o que foi feito na sessão no memory bank |
| `/security-scan` | `security` | Scan OWASP do projeto ou de um arquivo |
| `/new-feature` | `architect` / `new-features` | Feature end-to-end com plano aprovado |
| `/bug-fix` | `bug-fix` | Correção com causa raiz e teste de regressão |
| `/create-pr` | `pr-writer` | Título e corpo de PR |
| `/explain-codebase` | subagentes em paralelo | Guia para dev novo no projeto |

## `update-memory.md`

```markdown
---
description: Atualiza o memory bank com o que foi feito nesta sessão
---

Delegue ao subagente `docs`:
1. Analisar os arquivos modificados (`git diff` + `git status`).
2. Atualizar `memory-bank/activeContext.md` (data, foco, arquivos, tarefas, próximos passos).
3. Atualizar `memory-bank/progress.md` (mover concluídos, registrar débitos).
4. Se houve mudança arquitetural: atualizar `systemPatterns.md`.
5. Se houve nova dependência ou variável de ambiente: atualizar `techContext.md`.
```

## `security-scan.md`

```markdown
---
description: Análise de segurança OWASP do projeto ou de um arquivo específico
argument-hint: "[arquivo ou pasta]"
---

Delegue ao subagente `security`:
- Com `$ARGUMENTS`: analisar especificamente esse alvo.
- Sem argumentos: analisar os arquivos críticos (guards, gateways, webhooks, uploads, entrypoint, config).
- Cobertura: OWASP Top 10 Web, OWASP para aplicações agênticas (se houver), segredos, audit de dependências.
- Relatório por severidade; ao final, instruir `docs`.
- Para auditoria profunda (ledger de cobertura + verificador independente), sugerir
  `/auditoria-seguranca completo` se a skill estiver instalada.
```

## `new-feature.md`

```markdown
---
description: Implementa uma feature completa end-to-end com testes e revisão de segurança
argument-hint: "<descrição ou ID do ticket>"
---

Delegue ao subagente `architect` (ou `new-features`) com `$ARGUMENTS`:
1. Ler o memory bank.
2. Montar plano detalhado e **apresentar para aprovação**.
3. Após aprovação, delegar a implementação.
4. Garantir testes (`tester`), segurança (`security`) e docs (`docs`).
```

## `bug-fix.md`

```markdown
---
description: Diagnostica e corrige um bug com causa raiz, teste de regressão e revisão
argument-hint: "<descrição, stack trace ou ID do ticket>"
---

Delegue ao subagente `bug-fix` com `$ARGUMENTS`:
1. Ler o memory bank. Se houver MCP de tickets, buscar o ticket.
2. Reproduzir → Diagnosticar → Corrigir → Validar → Prevenir regressão.
3. Delegar `tester`, `security` (se relevante) e `docs`.
```

## `create-pr.md`

```markdown
---
description: Gera título e descrição de PR a partir dos commits da branch atual
---

Delegue ao subagente `pr-writer`:
1. Identificar a branch atual e a branch base.
2. Coletar commits e diffs.
3. Agrupar mudanças por tema.
4. Gerar título + corpo no template do time.
5. **G1 obrigatório:** nunca incluir o trailer `Co-Authored-By:`. Se algum commit da branch
   tiver o trailer, alertar no output e sugerir limpar o histórico antes de abrir o PR.
6. Apresentar o Markdown final.
```

## `explain-codebase.md`

```markdown
---
description: Explica a arquitetura e o funcionamento do projeto para um dev novo
---

Lance em paralelo:
1. **Arquitetura:** `systemPatterns.md` + estrutura de pastas.
2. **Fluxos:** controllers/services → fluxos principais.
3. **Setup:** `techContext.md` → passo a passo local.

Consolide num guia: o que o projeto faz, como funciona (com Mermaid), como rodar, e os
5 arquivos mais importantes.
```
