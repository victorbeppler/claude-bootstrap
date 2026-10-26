# Arquivos base

Tudo entre `[colchetes]` é instrução de preenchimento — **substitua por conteúdo real** da análise.
Nenhum colchete pode sobreviver no arquivo final.

## 1. `CLAUDE.md` (raiz)

O "cérebro" do Claude Code. Enxuto: **no máximo 180 linhas**. O que não couber vai para
`memory-bank/` e é referenciado com `@path`.

````markdown
# CLAUDE.md — [nome real do projeto]
> Última atualização: [data]

## Memory Bank
Leia no início de cada sessão, nesta ordem:
1. @memory-bank/projectBrief.md
2. @memory-bank/systemPatterns.md
3. @memory-bank/techContext.md
4. @memory-bank/activeContext.md
5. @memory-bank/progress.md

Ao finalizar tarefas complexas, delegue ao subagente `docs` a atualização de
activeContext.md e progress.md.

## Arquitetura
```mermaid
[flowchart TB real — camadas, módulos, integrações externas]
```
[3–5 linhas: padrão arquitetural e trade-offs]
Detalhes em @memory-bank/systemPatterns.md

## Stack & Comandos Rápidos
[Stack: linguagem vX, framework vY, banco Z, cache W]

| Ação | Comando |
|---|---|
| [dev, build, test, lint, format, cli — comandos reais] | |

Setup completo em @memory-bank/techContext.md

## Regras de Código — Não Negociáveis
[5–8 regras extraídas dos padrões reais. Ex.: "Controllers nunca acessam Repository
diretamente — sempre via Service"]

## Segurança Obrigatória
[3–5 regras da análise. Ex.: "Nunca logar tokens ou senhas"]

## Proibições Absolutas
[5–7 itens. Ex.: "Nunca usar synchronize: true no ORM", "Nunca push --force em main"]
- **Nunca adicionar trailer Co-Authored-By em commits — nem do Claude, nem de agente** (G1)

## Subagentes Disponíveis
> Todos os agentes têm `model: opus` no frontmatter — alias para o Opus mais recente (G2).

| Agente | Quando é acionado |
|---|---|
| `architect` | Tarefas end-to-end com múltiplos especialistas |
| `backend` | Implementação [stack real] |
| `frontend` | Implementação [stack real] — só se houver frontend |
| `bug-fix` | Diagnóstico e correção com causa raiz e regressão |
| `new-features` | Planejamento e implementação de features end-to-end |
| `tester` | Testes com [framework real] |
| `security` | Auditoria OWASP e de segredos |
| `reviewer` | Code review de diffs/PRs |
| `pr-writer` | Título e corpo de PR a partir dos commits |
| `docs` | Documentação e memory bank |
| `devops` | Docker, CI/CD, infra e deploy |

## MCP Disponível
[MCPs configurados. Se nenhum, remover a seção]

## Navegação Cross-Project
[Só se houver ecossistema: agentes podem ler projetos em `$ORG_PATH` para consultar
entidades, contratos de API e padrões. Se standalone, remover a seção]

## Armadilhas Deste Projeto
[3–5 pegadinhas reais. Ex.: "Entidades vêm de @org/common-lib, não de src/"]
````

## 2. `AGENTS.md` (raiz)

Arquivo universal, lido também por Copilot, Cursor, Windsurf e outros agentes.

````markdown
# [Nome do Projeto] — Agent Reference

## Visão Geral
[2 frases sobre o que o projeto faz]

## Setup Rápido
[Comandos reais para clonar, instalar e rodar]

## Estrutura de Pastas
```mermaid
[flowchart TB das pastas principais]
```

## Comandos Disponíveis
| Comando | Descrição |
|---|---|
| [todos os scripts reais] | |

## Convenções
### Arquivos
[Padrões reais de nome: controllers, services, repos, DTOs, testes]
### Classes
[PascalCase, tokens de injeção, constantes]
### Commits
[Conventional commits, padrão de branch]
- **Sem trailer `Co-Authored-By:` — apenas o autor humano** (G1)

## Notas para Agentes de IA
- **Modelo padrão dos subagentes:** `model: opus` no frontmatter (G2)
- [Arquivos críticos que não se altera sem entender por completo]
- [Onde as entidades são definidas]
- [Lint automático: proibido ou não, e por quê]
- [Endpoints e seus guards]
````

## 3. `.mcp.json` (raiz)

```json
{
  "mcpServers": {}
}
```

Adicione MCPs conforme a stack detectada. Exemplo (PostgreSQL):

```json
{
  "mcpServers": {
    "postgres": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-postgres", "${DATABASE_URL}"]
    }
  }
}
```

> Nunca escreva credencial no `.mcp.json` — ele é commitado. Use variável de ambiente.

## 4. `.claude/settings.json` (commitável)

Permissões base, deny list e hooks. Ajuste ao package manager real (npm/yarn/pnpm/pip/cargo…).
Se o projeto for standalone, remova as linhas de `$ORG_PATH`.

```json
{
  "permissions": {
    "allow": [
      "WebFetch",
      "WebSearch",
      "Bash(git status*)",
      "Bash(git log*)",
      "Bash(git diff*)",
      "Bash(git branch*)",
      "Bash(git checkout*)",
      "Bash(git add*)",
      "Bash(git commit*)",
      "Bash(npm run*)",
      "Bash(npm test*)",
      "Bash(npm install*)",
      "Bash(npm audit*)",
      "Bash(npx *)",
      "Bash(cat $ORG_PATH*)",
      "Bash(ls $ORG_PATH*)",
      "Bash(find $ORG_PATH*)",
      "Bash(grep * $ORG_PATH*)"
    ],
    "deny": [
      "Bash(rm -rf *)",
      "Bash(curl * | bash)",
      "Bash(git push --force*)",
      "Bash(git reset --hard*)"
    ]
  },
  "hooks": {
    "Stop": [
      {
        "matcher": "",
        "hooks": [
          {
            "type": "command",
            "command": "echo '💾 Sessão encerrada. Rode /update-memory para salvar o contexto.'"
          }
        ]
      }
    ]
  }
}
```

## 5. `.claude/settings.local.json` (pessoal — adicionar ao `.gitignore`)

Permissões expandidas: GitHub CLI, domínios de documentação, MCPs e skills da organização.
Remova o que não se aplica.

```json
{
  "permissions": {
    "allow": [
      "WebFetch(domain:github.com)",
      "WebFetch(domain:[docs do framework real])",
      "Bash(gh pr:*)",
      "Bash(gh repo:*)",
      "Bash(git:*)",
      "Bash(node:*)",
      "mcp__[servidor]__[tool]",
      "Skill($ORG_SKILL_NAMESPACE:[skill])"
    ]
  },
  "enabledMcpjsonServers": []
}
```

> Para MCPs como Jira/Atlassian, prefira permissões granulares por tool
> (`mcp__claude_ai_Atlassian__getJiraIssue`, `...searchJiraIssuesUsingJql`) em vez de liberar o
> servidor inteiro.

## 6–11. `memory-bank/` (6 arquivos, ≤ 150 linhas cada)

| Arquivo | Conteúdo |
|---|---|
| `projectBrief.md` | Objetivo, problema que resolve, stakeholders, escopo, posição no ecossistema |
| `productContext.md` | Contexto de negócio, fluxos principais (das rotas/controllers), integrações, decisões de produto (tabela de trade-offs) |
| `systemPatterns.md` | Arquitetura expandida (≥ 2 Mermaid), design patterns com caminhos reais, fluxo entre camadas, convenções com exemplos, passo a passo para criar endpoint/serviço/módulo |
| `techContext.md` | Stack com versões exatas (tabela), variáveis do `.env.example` com descrição, setup local, como rodar/testar/buildar/deployar, dependências críticas, pacotes internos |
| `activeContext.md` | Estado atual — template abaixo |
| `progress.md` | Andamento — template abaixo |

### `memory-bank/activeContext.md`

```markdown
# Active Context
> Atualizado em: [data] | Atualizar ao fim de cada sessão

## Foco Atual
[Inferido do código mais recente, TODOs, branch atual]

## Arquivos Mais Ativos
[De git log, imports, tamanho, complexidade]

## Tarefas em Andamento
- [ ] [Inferidas de TODO/FIXME e do nome da branch]

## Decisões Pendentes
[Arquiteturais/técnicas não resolvidas]

## Próximos Passos Sugeridos
[3–5 sugestões]
```

### `memory-bank/progress.md`

```markdown
# Progress
> Atualizar ao finalizar features ou sessões longas

| Status | Item | Owner | Data |
|---|---|---|---|
| ✅ Implementado | | | |
| 🔄 Em desenvolvimento | | | |
| ❌ Ausente / planejado | | | |

## 🐛 Débitos Técnicos
[TODOs críticos, dependências desatualizadas, code smells]

## 🔐 Riscos de Segurança Identificados
[Do Security Auditor]
```
