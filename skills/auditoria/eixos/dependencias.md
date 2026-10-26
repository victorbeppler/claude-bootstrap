# Eixo — Dependências

O que o subagente `eixo-dependencias` audita: a cadeia de terceiros. CVEs conhecidas, versão podre, supply
chain e licença. Read-only — o agente **lê** manifestos e lockfiles e, quando disponível, **lê a saída** de um
scanner que o usuário já tenha; não instala nem roda build.

Saída: card por achado em `templates/achado.md` (ID `P-01`...). Toda CVE citada vem com o identificador
(`CVE-...`/`GHSA-...`), o pacote e a versão — número concreto, não "tem vulnerabilidade".

## P1 — Vulnerabilidade conhecida (CVE)

- **Audit do ecossistema:** rode o que o projeto já tem, em modo leitura:
  - Node: `npm audit --json` / `pnpm audit --json` / `yarn npm audit`
  - Python: `pip-audit` / `safety check`
  - PHP: `composer audit`
  - Go: `govulncheck`; Rust: `cargo audit`
- Liste por severidade, com CVE/GHSA, pacote, versão instalada e versão que corrige. Separe **direta** de
  **transitiva** (a transitiva pode depender de subir a direta).

## P2 — Versão e manutenção

- **Desatualização:** quão atrás da última versão estável (`npm outdated`, `pip list --outdated`)? Major atrás
  de major é dívida e risco.
- **Abandono:** pacote sem release há anos, arquivado, deprecado, ou com um só mantenedor. Dependência de risco
  mesmo sem CVE ainda.
- **Runtime:** versão do Node/Python/PHP/… fora de suporte (EOL) — não recebe patch de segurança.

## P3 — Supply chain e integridade

- **Lockfile:** existe e está versionado (`package-lock.json`/`pnpm-lock.yaml`/`poetry.lock`/`composer.lock`)?
  Sem lockfile, o build não é reprodutível e um patch malicioso entra sozinho.
- **Origem:** dependência de git/URL/tarball fora do registro oficial; typosquatting (nome quase igual a um
  pacote popular); escopo errado.
- **Script de instalação:** `postinstall`/`preinstall` de terceiros que roda código na instalação.
- **Fixação:** versão com `^`/`~`/`*` aberta demais em pacote sensível.

## P4 — Licença

- Licença incompatível com uso comercial do cliente (GPL/AGPL num produto fechado), ou pacote sem licença.
  Liste as licenças presentes e marque as de risco.

## P5 — Segredo e configuração

- Segredo em `.env`/CI versionado puxado por dependência de build; token de registro privado exposto
  (`.npmrc` com `_authToken`). **Mascare na saída.**

## O que olhar, mecanicamente

- Manifesto + lockfile de cada ecossistema; `.nvmrc`/`engines`/`runtime.txt` para versão de runtime.
- Se o scanner não estiver disponível no ambiente, **diga isso na cobertura** e liste o que dá para ver só
  pelo manifesto (versões atrás, pacotes abandonados, licenças) — não invente CVE.

## Cobertura a declarar

| Frente | Total | Revisado | Não coberto |
|---|---|---|---|
| Dependências diretas | | | |
| Ecossistemas (npm/pip/...) | | | |
| Lockfiles presentes | | | |
| Scanner rodou? | sim/não | — | — |
