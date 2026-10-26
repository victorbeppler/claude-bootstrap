# Eixo — Design System / Smell Code

O que o subagente `eixo-design-smell` audita. Frente de **qualidade**, não de segurança: consistência visual,
saúde do código e dívida técnica. Cada achado precisa de **número concreto** (`54 estilos inline`, `822 linhas
num arquivo`) — achado de qualidade sem número vira opinião, e opinião não entra no relatório do cliente.

Saída: um card por achado em `templates/achado.md` (ID `D-01`, `D-02`...). Só leitura.

## D1 — Design System / consistência visual

- **Tokens vs. valores soltos:** cores, espaçamentos, tipografia, raio e sombra vêm de token/tema, ou há hex,
  `px` e `rgba` soltos espalhados? Conte os valores fora do sistema (`grep` por `#[0-9a-fA-F]{3,6}`, `style=`,
  `px`).
- **Componentes duplicados:** o mesmo botão/card/input reimplementado em telas diferentes em vez de um
  componente compartilhado. Liste os pares.
- **Estilo inline e CSS morto:** `style=` inline, classes nunca referenciadas, `!important` em excesso.
- **Acessibilidade mínima:** `alt` em imagem, `label` em input, contraste, foco visível, ordem de heading. Não
  é auditoria WCAG completa — é o que salta aos olhos.
- **Responsividade:** largura fixa que estoura no mobile, breakpoints inconsistentes.

## D2 — Smell code (estrutura)

- **Arquivos e funções gigantes:** liste os N maiores arquivos (linhas) e funções (complexidade/linhas). Dê o
  número. Component/serviço "deus" que faz tudo.
- **Duplicação:** blocos copiados (mesma lógica em 3+ lugares). Aponte os `arquivo:linha`.
- **Acoplamento e camadas:** regra de negócio dentro do controller/componente de UI; acesso a banco direto da
  camada de apresentação; dependência circular entre módulos.
- **Nomes e tipos:** `any` em TypeScript, variável `data`/`temp`/`x`, função que não diz o que faz, número
  mágico sem constante.
- **Tratamento de erro:** `catch` vazio, erro engolido, `console.log` esquecido, `TODO`/`FIXME` antigos.
- **Morte e repetição:** código morto, import não usado, flag que ninguém liga.

## D3 — Padrão e convenção

- **Consistência de projeto:** o código segue um padrão único (lint configurado e passando) ou cada arquivo
  tem um estilo? Há `.editorconfig`/ESLint/Prettier e eles rodam no CI?
- **Estrutura de pastas:** organização previsível (por feature/por camada) ou pasta-despejo.
- **Teste:** existe suíte? Cobre o caminho crítico? Teste que confere a linha no banco em vez do comportamento
  conta como falso-positivo de cobertura.

## O que olhar, mecanicamente

- `cloc`/`wc -l` para tamanho; `grep -rn "style=\|!important\|: any\|console\.log\|TODO\|FIXME"`.
- Config de lint/format (`.eslintrc*`, `.prettierrc*`, `biome.json`) e se o CI roda.
- Presença de um design system real (pasta de tokens/tema, biblioteca de componentes) vs. UI ad-hoc.

## Cobertura a declarar

| Frente | Total | Revisado | Não coberto |
|---|---|---|---|
| Arquivos de UI/componentes | | | |
| Módulos de domínio | | | |
| Config de lint/CI | | | |
| Suíte de testes | | | |
