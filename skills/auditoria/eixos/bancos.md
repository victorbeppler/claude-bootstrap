# Eixo — Bancos

O que o subagente `eixo-bancos` audita: como o sistema fala com o banco e como protege o dado em repouso.
Cruza com o P2 (IDOR) e o P7 (contrato) da skill `pentest`, mas pelo ângulo da camada de dados. Read-only.

Saída: card por achado em `templates/achado.md` (ID `B-01`...).

## B1 — Injection

- **Query dinâmica:** SQL/NoSQL montado por concatenação de string com entrada do usuário? Procure
  interpolação em query (`` `SELECT ... ${ } ` ``, `+ req.`, `.raw(`, `queryRaw`, `$where`, `.find(req.body)`).
- **Parametrização:** usa query parametrizada / ORM com bind, ou escapa à mão? ORM mal usado (`raw`) reabre a
  porta.
- **Outras injeções:** ORDER BY / nome de coluna vindo do cliente (não parametrizável — tem de ser lista
  branca); LIKE com curinga do usuário; projeção/filtro NoSQL vindo cru do corpo.

## B2 — Acesso e isolamento do dado (IDOR na camada de dados)

- **Escopo por tenant/dono:** toda consulta filtra por `tenant_id`/`owner_id` do usuário logado, ou dá para ler
  o id de outro? O filtro está no repositório/use-case, ou alguém esqueceu numa query?
- **Piso temporal do vínculo (P6):** consulta histórica respeita a data de início do vínculo (não devolve dado
  anterior)?
- **Mass assignment:** `update(req.body)` que deixa o cliente setar coluna que não devia (papel, saldo, flag)?

## B3 — Segredo e configuração de conexão

- **String de conexão:** credencial em `.env` versionado, hardcoded, ou em log? (`grep` por `DATABASE_URL`,
  `mongodb://`, `postgres://`, `password=`). **Na saída, mascare a credencial.**
- **TLS no banco:** conexão cifrada (sslmode/tls) para banco gerenciado/remoto?
- **Usuário do app:** o app conecta com usuário de menor privilégio, ou com superusuário/owner que pode
  `DROP`? Permissões por tabela.

## B4 — Dado em repouso e PII

- **PII e sensível:** CPF, e-mail, telefone, cartão, token — cifrados/tokenizados quando exigido? Senha nunca
  em texto (cruza com A2).
- **Exposição:** `SELECT *` que arrasta coluna sensível para a resposta (cruza com P5 — resposta mínima); dump/
  seed com dado real versionado.
- **Soft delete e retenção:** dado "apagado" só marcado e ainda consultável por outra rota; retenção/anonimização
  conforme LGPD.

## B5 — Migrations e integridade

- **Migrations versionadas** e reversíveis; nada de alterar schema à mão em produção.
- **Integridade:** FK, `NOT NULL`, `UNIQUE`, índice onde há filtro quente; constraint que o código assume mas o
  banco não garante.
- **Transação:** operação multi-tabela (split/comissão/estorno) dentro de transação e idempotente — sem crédito
  em dobro (cruza com os fluxos de dinheiro do pentest).

## O que olhar, mecanicamente

- Camada de acesso a dados (repositórios, ORM, migrations). `grep -rn "raw\|queryRaw\|\\$where\|SELECT \*\|+ req\.\|\\${"`.
- Arquivos de config/env e `.gitignore` (o `.env` está ignorado mesmo?).
- Schema/migrations para constraints e privilégio do usuário de conexão.

## Cobertura a declarar

| Frente | Total | Revisado | Não coberto |
|---|---|---|---|
| Queries / repositórios | | | |
| Migrations | | | |
| Pontos com PII | | | |
| Configs de conexão | | | |
