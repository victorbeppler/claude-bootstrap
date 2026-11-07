# <ID> — <título curto do achado>

> Um card por achado. ID por eixo: D- (design/smell), A- (auth/brute force), B- (bancos),
> P- (dependências), S- (segurança por contrato), V- (segurança do código). Severidade: Crítico / Alto /
> Médio / Baixo (o V- pode ter também Informativo).

**Severidade:** <Crítico | Alto | Médio | Baixo>
**Eixo:** <Design System/Smell Code | Brute Force/Auth | Bancos | Dependências | Segurança por contrato | Segurança do código>
**Componente / rota / pacote:** `<arquivo, rota ou pacote@versão>`

## Descrição

O que acontece, em uma ou duas frases, com **número concreto** (`54 estilos inline`,
`CVE-2024-xxxx no lodash@4.17.19`, `822 linhas`). Qual falha e o que ela permite. Sem jargão de
código — o card é lido também por quem não abre o repositório.

## Impacto

O que um atacante, ou a própria dívida técnica, causa por causa disso. Quando o achado só é grave
**junto com outro** (ex.: sem freio de login + senha fraca), diga aqui e cite o outro ID.

## Evidência

Reproduzível: `arquivo:linha`, saída de comando (`npm audit`, `wc -l`), ou passo de conferência com
a resposta observada. **Segredo truncado/mascarado** — nunca cole token, senha, credencial de
conexão ou URL assinada inteira.

```
# arquivo:linha ou comando
# o que se observa
```

## Recomendação

Concreta e acionável — o que trocar pelo quê, não "melhorar X". Confira que o conserto não abre
outra porta (bloqueio por conta mal desenhado vira negação de serviço). Diga o esforço
(baixo/médio/alto).

## Referências

OWASP, CWE, CVE/GHSA, guia do framework, ou o card anterior da mesma classe.
