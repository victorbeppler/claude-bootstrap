# Glossário e contrato de nomes

A prosa da skill é em português; **o contrato de máquina fica em inglês**, porque é o que os
validadores (`scripts/*.cjs`) e o `scripts/report-schema.json` conferem. Nunca traduza um item da
coluna "No JSON / no código".

## Papéis e ferramentas (Claude Code)

| Termo na skill | Significado | Na ferramenta |
|---|---|---|
| **orquestrador** | Agente que coordena a rodada e é o único que escreve os arquivos compartilhados | a sessão principal |
| **caçador** | Subagente que varre uma unidade do ledger e devolve candidatos estruturados | `Agent` com `subagent_type: general-purpose` |
| **crítico de cobertura** | Subagente que procura lacunas no ledger depois de cada onda | `Agent` com `subagent_type: Explore` |
| **verificador** | Subagente novo, sem contexto do caçador, que tenta derrubar o candidato | `Agent` com `subagent_type: general-purpose` (ou `Explore`, se for só leitura) |
| **agente de pesquisa** | Exploração focada de código e checagem de fato | `subagent_type: Explore` |
| **agente geral** | Investigação ampla e execução local limitada | `subagent_type: general-purpose` |

## Termos do método

| Termo na skill | Original | No JSON / no código |
|---|---|---|
| fronteira de confiança | trust boundary | `boundary` |
| superfície de entrada | entry surface | `surface` |
| principal | principal | — |
| unidade de cobertura | coverage unit | item de `coverage-ledger.json` |
| ledger de cobertura | coverage ledger | `coverage-ledger.json` |
| onda | wave | `wave` |
| candidato | candidate | `candidate` (status) |
| fingerprint | fingerprint | `fingerprint` |
| bloco de classe de ataque | attack-class block | `ordinary_attack_class_block`, `selected_companion_blocks` |
| arquivo de domínio | companion file | `classes/<domínio>.md` |
| rodada anterior | prior run | `prior_status` |
| perfil | profile | `quick` · `standard` · `deep` |
| orçamento | budget | `budget` |

## Veredictos (nunca traduzir no JSON)

| Na prosa | No JSON | Tem severidade? |
|---|---|---|
| confirmado | `confirmed` | Sim |
| precisa de validação | `needs_validation` | **Não** |
| rejeitado | `rejected` | Não |

## Status de unidade do ledger (nunca traduzir no JSON)

`planned` · `in_progress` · `blocked` · `covered` · `candidate` · `not_applicable` ·
`out_of_scope` · `deferred`

## Severidade

No JSON fica o valor em inglês; no relatório e nos cards, o rótulo em português (o mesmo das skills
`auditoria` e `pentest`).

| No JSON | No relatório |
|---|---|
| `critical` | Crítico |
| `high` | Alto |
| `medium` | Médio |
| `low` | Baixo |
| `informational` | Informativo |

## Referência de bloco

Uma referência de bloco é `<caminho relativo à skill>#<nome exato da classe>`, com o nome como
está escrito em negrito ou no título do arquivo — por exemplo `classes/base.md#Controle de acesso`
ou `classes/web-protocolo-e-auth.md#Disciplina central`. É texto comparado com o arquivo, não
âncora HTML: não passe para minúsculas nem gere slug.

Nos arquivos de domínio, os três blocos fixos são sempre `Disciplina central`,
`Movimentos universais` e `Regras de validação`.

## Arquivos da rodada

| Arquivo | Quem escreve | Formato |
|---|---|---|
| `run-metadata.json` | orquestrador | JSON (chaves em inglês) |
| `arquitetura.md` | orquestrador | Markdown |
| `coverage-ledger.json` | orquestrador | JSON validado por `scripts/validate-coverage-ledger.cjs` |
| `findings.json` | orquestrador | JSON validado por `scripts/validate-findings.cjs` |
| `RELATORIO.md` | orquestrador | Markdown |
| `ACHADOS-DETALHE.md` | orquestrador | Markdown |
| `PRECISA-VALIDACAO.md` | orquestrador | Markdown |
| `agents/<id>/scratch/` | o próprio agente | livre |
| `agents/<id>/artifacts/` | só a promoção do orquestrador | ver `referencias/procedimento-promocao.md` |
