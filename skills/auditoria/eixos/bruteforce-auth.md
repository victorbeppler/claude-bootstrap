# Eixo — Brute Force / Auth

O que o subagente `eixo-bruteforce-auth` audita. É o aprofundamento dos padrões **P4 (contador
furado)** e **P1 (estado que não propaga)** da skill `pentest`, focado em autenticação e
resistência a brute force. Read-only: o agente **descreve** a conferência ao vivo como passo, não a
executa.

Saída: card por achado em `templates/achado.md` (ID `A-01`...). Toda conferência ao vivo é passo
para o usuário rodar em **ambiente descartável/autorizado** — brute force gera carga e pode trancar
conta de gente real.

## A1 — Freio (rate limit / throttle)

- **Onde falta:** login, troca/reset de senha, reenvio de código (OTP/2FA), criação de conta,
  endpoints caros. Cada um tem freio?
- **Onde mora o contador:** Redis (vale para todas as instâncias) ou memória do processo? Em
  memória, o teto real = limite × nº de instâncias — na prática, sem freio.
- **Por conta E por origem:** limitar só por conta deixa espalhar o ataque por IPs; limitar só por
  IP não protege a conta atrás de NAT/CDN. Precisa dos dois. Quem repassa o IP real do cliente
  (`X-Forwarded-For`) atrás da borda?
- **Não vira negação de serviço:** o freio por conta pode ser abusado para **trancar a conta de
  outra pessoa**? Lockout deve usar backoff/captcha, não bloqueio duro acionável por terceiro.

## A2 — Política de senha e credencial

- **Hash:** senha com bcrypt/scrypt/argon2 e custo adequado — nunca MD5/SHA sem sal, nunca texto
  puro. Onde é feito?
- **Força mínima:** tamanho, bloqueio de senha vazada (lista conhecida), sem regra que force padrão
  fraco.
- **Segredo em repouso:** JWT secret, chave de API, credencial em `.env` versionado, hardcoded no
  código? (`grep` por `secret`, `password`, `api_key`, `BEGIN PRIVATE KEY`).

## A3 — Sessão e token

- **Expiração e revogação:** access token curto; refresh token rotacionado e **detecção de reuso**
  (refresh usado duas vezes = alerta/invalidação); logout realmente invalida.
- **Estado fresco (P1):** sessão revogada, vínculo encerrado, papel mudado, KYC recusado — a rota
  relê a cada request ou confia num token já emitido?
- **Transporte do token:** cookie `HttpOnly`+`Secure`+`SameSite`, ou token em `localStorage` exposto
  a XSS; token no querystring (vaza em log/Referer).

## A4 — MFA e recuperação

- **MFA:** existe? É obrigatório para papel sensível (admin)? O fluxo de reenvio de OTP tem freio
  (A1)?
- **Reset de senha:** token de reset de uso único, curto, invalidado após uso; não revela se a
  conta existe (enumeração); link não vaza em Referer.
- **Enumeração:** login/cadastro/reset respondem igual para conta existente e inexistente (mensagem
  e tempo)?

## O que olhar, mecanicamente

- Middleware/guard de throttle (`@Throttle`, `express-rate-limit`, `rate-limiter-flexible`) e
  **onde o store é Redis**; ausência dele nas rotas de A1.
- Função de hash de senha; config do JWT (tempo, segredo, algoritmo — cuidado com `alg: none`).
- `grep -rn "localStorage\|sessionStorage"` para token no cliente; flags de cookie na emissão.

## Passo de conferência ao vivo (para o usuário rodar, ambiente descartável)

- Dispare N tentativas de login erradas numa conta de teste: o freio entra antes de permitir brute
  force? A conta legítima continua acessível depois (não virou DoS)?
- Peça reset para conta inexistente e existente: a resposta é idêntica?

## Cobertura a declarar

| Frente | Total | Revisado | Não coberto |
|---|---|---|---|
| Rotas de autenticação | | | |
| Rotas com freio esperado | | | |
| Fluxos de recuperação/MFA | | | |
