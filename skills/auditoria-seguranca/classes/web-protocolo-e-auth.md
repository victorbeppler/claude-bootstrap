# Caça em protocolo HTTP e autenticação

#### Quando usar este arquivo

Recorra a este arquivo quando o alvo fala HTTP numa fronteira de parsing, cache, autenticação de navegador ou identidade: aplicações web, APIs, proxies reversos, CDNs, gateways, servidores HTTP próprios e serviços que implementam sessões, JWT, OAuth/OIDC, SAML, recuperação de senha, MFA, passkeys, API keys ou mTLS. Use este arquivo com `base.md`: a revisão de controle de acesso pergunta se um principal pode executar uma operação; este arquivo pergunta se a camada HTTP ou de identidade consegue confundir a qual principal, requisição, nível de garantia (assurance) ou token a operação pertence.

Escolha as classes a partir da Fase 1. Divida um alvo grande em framing de requisição e política de cache, autenticação de navegador, identidade federada, autenticação forte e recuperação, credenciais de serviço e ciclo de vida de sessão. Um único servidor atrás de um proxy gerenciado não observado tem pouca superfície de smuggling confirmável pelo código-fonte; um proxy ou parser próprio tem muito mais.

## Disciplina central (incluir em todo prompt de agente deste domínio)

```
- Achados de framing e cache exigem duas interpretações da mesma requisição, resposta ou chave. Nomeie os dois componentes e o valor normalizado exato de cada lado.
- Para toda credencial, encontre a verificação de assinatura ou segredo e toda vinculação (binding) exigida pelo seu papel: issuer, audience, origin, RP, client, sessão, principal, recurso, garantia, expiração e estado de uso único.
- Host, Forwarded, X-Forwarded-*, Origin, Referer, destinos de redirect, state de callback e URLs derivadas da requisição são decisões de confiança. Rastreie cada um até a identidade ou resposta afetada.
- Um header, atributo de cookie, prompt de MFA ou rate limit ausente não é achado sozinho. Exija uma requisição inválida aceita, impacto entre principais, rebaixamento de garantia ou divulgação de credencial.
- Classifique como `confirmed` só a partir de evidência completa no código-fonte e de testes locais limitados de requisição/token. Use `needs_validation` quando proxy, IdP, navegador, certificado, segredo ou configuração de deploy for necessário mas não estiver visível.
```

## Classes de ataque de framing HTTP e cache (subagent_type: `general-purpose`)

**Framing e dessincronização de requisição**
Front end e back end discordam sobre o tamanho da requisição ou a normalização de headers. Revise múltiplos valores de `Content-Length`, `Transfer-Encoding`, downgrade de HTTP/2 ou HTTP/3, normalização de nomes de header, headers de conexão proibidos e conversão de CR/LF. Confirme quais bytes um componente atribui a uma requisição e quais bytes o seu par atribui à requisição seguinte.

**Envenenamento de cache web por entrada fora da chave**
Um valor da requisição altera o conteúdo em cache ou headers relevantes para segurança, mas não faz parte da chave de cache. Compare a construção da chave de cache com toda variante de resposta, incluindo host/scheme encaminhados, cookies selecionados, normalização de query, headers de idioma/dispositivo e estado de autorização.

**Cache deception e cache de resposta privada**
O roteamento do cache trata um caminho dinâmico privado como asset estático público, ou guarda em cache uma resposta cujas entradas de identidade e autorização faltam na política. Compare a cacheabilidade na borda com o parsing de rotas da aplicação, a normalização de sufixo/parâmetro de caminho e as diretivas de cache da resposta.

**Confiança em Host e headers encaminhados**
Metadados de host/proxy não confiáveis determinam URLs absolutas, roteamento de tenant, callbacks, links de reset, chaves de cache ou o endereço de cliente usado pela autorização. Confirme quem pode fornecer o header e se a entrada (ingress) confiável remove as cópias enviadas pelo cliente.

**Injeção em header de resposta**
Dados não confiáveis chegam a `Location`, `Set-Cookie`, CSP ou outro header de resposta com caracteres de controle ou normalização inseguros. Verifique a rejeição pelo framework antes de reportar e exija uma mudança de resposta relevante para segurança.

## Classes de ataque de sessão de navegador (subagent_type: `general-purpose`)

**CSRF comum**
Um navegador envia credenciais ambientes a um endpoint que muda estado e aceita requisição cross-site sem token anti-CSRF efetivo, vinculação de requisição same-site ou validação estrita de Origin/Referer. Inventarie toda mutação autenticada por cookie, incluindo rotas de formulário, do tipo JSON, multipart, de method-override e legadas. SameSite só é efetivo para o cookie e os contextos de navegador realmente usados; CSRF de login e requisições cross-site de sub-recursos podem ter exigências diferentes.

**Fixação e invalidação de sessão**
Identificadores de sessão não são rotacionados em login, troca de conta, conclusão de MFA, impersonação ou outras mudanças de privilégio, ou continuam válidos depois de logout, troca de senha, revogação e desativação da conta. Verifique sessões no servidor, refresh tokens, cookies assinados, estado de websocket, cópias em cache e endpoints de fallback.

**Escopo e transporte de cookie**
Um cookie sensível tem `Domain` ou `Path` amplos demais, pode atravessar um transporte inseguro ou conflita com um cookie irmão que outro componente seleciona de outro jeito. Flags simplesmente ausentes continuam sendo notas de hardening, a menos que uma origem menos confiável realista, uma posição de rede ou um caminho de navegador consiga obter ou substituir a credencial.

## Classes de ataque de identidade federada (subagent_type: `general-purpose`)

Primeiro estabeleça o papel. Controles do authorization server, como allowlist de redirect e emissão de código, não pertencem a um client relying party. Defeitos de verificação e vinculação pertencem ao componente que consome o artefato.

**Verificação de JWT e vinculação de claims**
Verifique a checagem de assinatura, o algoritmo e a fonte de chave fixados no servidor, e depois `exp`, `nbf`, `aud` e `iss`. Revise `kid`, `jku` e `x5u` como seletores de chave não confiáveis, normalização de duplicatas/headers e caminhos de decode sem verify. Um token válido para outro serviço é inválido aqui mesmo quando assinado por um issuer confiável.

**Vinculação de requisição e callback OAuth/OIDC**
Valide a posse exata do `redirect_uri` quando o alvo é o authorization server; `state` vinculado à sessão; PKCE e vinculação do authorization code onde se aplicar; issuer/audience/assinatura/nonce do ID token; e vinculação ao IdP selecionado em fluxos com múltiplos provedores. Compare as rotas de callback inicial, retentativa, mobile/deep link e vinculação de conta.

**Objeto assinado e vinculação de asserção SAML**
Garanta que o elemento cuja assinatura é validada é o elemento usado como identidade. Revise caminhos sem assinatura/de fallback, configuração segura do parser XML, diferenças de canonicalização e campos de frescor/vinculação, como janelas de validade, audience/recipient, correlação de requisição e estado de replay.

## Classes de ataque de MFA, passkey e transição de conta (subagent_type: `general-purpose`)

**Cadastro de MFA e rebaixamento de garantia**
Cadastro, substituição, desativação, geração de códigos de recuperação, criação de dispositivo confiável e login de fallback exigem a garantia prévia pretendida. Verifique que um primeiro fator válido não consegue cadastrar nem substituir o segundo fator sem a autenticação recente exigida pela política, e que fatores desativados ou obsoletos deixam de autorizar sessões.

**Vinculação e bypass de step-up**
Um desafio bem-sucedido eleva a sessão, conta, tenant, ação ou requisição de API errada, ou uma rota alternativa omite a checagem de garantia. Vincule o desafio ao principal, à sessão atual, ao alvo de garantia, à operação ou recurso quando exigido, à expiração e à conclusão de uso único. Compare os caminhos de UI, API, lote, recuperação e fluxo retomado.

**Verificação de WebAuthn e passkey**
No registro, vincule challenge, RP ID, origin esperada, credencial, user/userHandle, algoritmo e a verificação de usuário exigida pela política à sessão que iniciou. Na autenticação, verifique challenge, RP/origin, pertença da credencial, assinatura e a presença/verificação de usuário pretendida. Verifique fluxos de descoberta e vinculação de conta quanto a confusão de userHandle ou de credencial com conta. O tratamento do contador de assinatura só é relevante quando o produto trata regressões como sinal de clonagem.

**Vinculação de conta e colisão de identidade**
Adicionar um IdP, passkey, e-mail, telefone, dispositivo ou conta externa a uma conta existente deve exigir sessão autenticada atual, posse verificada da nova identidade, step-up exigido pela política e state de callback vinculado à conta que iniciou a vinculação. Revise os caminhos de desvincular/revincular e de aceite de convite quanto a colisões de identificador verificado ou de tenant.

**Reset de senha e recuperação ampla**
Tokens de recuperação, recuperação por suporte/admin, códigos de backup, migração de dispositivo e troca de e-mail ou telefone muitas vezes viram o caminho de autenticação mais fraco. Verifique aleatoriedade do token, vinculação a usuário/ação, expiração, estado de uso único, controles de taxa/contabilização, confiança na URL de entrega e invalidação de tokens e sessões anteriores. Respostas diferentes que só revelam a existência pública de uma conta não são automaticamente achados de segurança.

## Classes de ataque de API key e mTLS (subagent_type: `general-purpose`)

**Escopo de API key e vinculação a recurso**
Uma key autentica em tenants, recursos, ações ou ambientes mais amplos do que o seu registro no servidor concede, ou parâmetros da requisição sobrescrevem essas vinculações. Revise a busca da key, a verificação de prefixo/segredo completo, a confusão de tipo entre keys publicáveis e secretas, checagens de escopo, rotação, caches de revogação e endpoints em lote.

**Exposição de API key e transporte inseguro**
Keys aparecem em bundles de cliente, URLs, redirects, logs, caminhos de erro, artefatos de build ou respostas acessíveis a um principal de menor confiança. Um identificador público chamado de key não é segredo. Confirme o tipo da key e a autoridade obtida com a divulgação.

**Confusão entre peer mTLS e identidade de aplicação**
Um processo confia em headers de identidade de certificado de cliente vindos de qualquer peer de rede, verifica uma cadeia mas mapeia incorretamente para uma conta um texto de subject influenciável pelo atacante, ou aceita um certificado do trust domain, extended usage, audience ou política de validade errados. Onde um proxy confiável termina o mTLS, verifique que só esse proxy consegue conectar, que ele remove os headers de identidade de entrada e que o backend vincula a identidade sanitizada à requisição.

**Fallback no ciclo de vida de certificado**
Certificados expirados, revogados, ausentes ou com renovação falha causam fallback silencioso para operação só com bearer ou anônima, ou conexões de pool de longa duração mantêm autorização depois da revogação. Dados de revogação de deploy ausentes tornam o resultado `needs_validation`; um ramo fail-open no repositório é confirmável pelo código-fonte.

## Movimentos universais (aplicar a todos os acima)

- Percorra emissão → armazenamento → transmissão → consumo → renovação → revogação para toda credencial e desafio. Compare os caminhos normal, de erro, de retentativa, de migração, legado e de troca de conta.
- Enumere toda porta para a mesma identidade e toda rota para a mesma operação sensível. A política efetiva é o caminho paralelo mais fraco, não a UI mais polida.
- Compare lado a lado a normalização do parser, proxy, roteador, cache e aplicação. Para validação local, alimente cada componente com fixtures de requisição idênticas e limitadas, em vez de mandar tráfego para um deploy ativo.
- Para recuperação e vinculação, desenhe o grafo da conta antes/depois. Cada aresta deve nomear o principal atual, a prova da nova identidade, a garantia exigida, a vinculação de callback/sessão e o efeito de revogação.

## Regras de validação (aplicar antes de reportar QUALQUER achado daqui)

1. Aplique um filtro de visibilidade do código-fonte. Cadeias de proxy, chaves de cache na borda, política do IdP, confiança de certificado, comportamento de cookie do navegador, segredos e modos de autenticação do deploy podem estar fora do repositório. Registre um candidato `needs_validation` preciso em vez de afirmar um comportamento de infraestrutura ausente.
2. Para achados de framing e cache, nomeie os dois componentes e o parse/chave divergente. Confirme impacto entre requisições, entre usuários ou em resposta privada com fixtures locais limitadas.
3. Para achados de token, MFA, passkey, vinculação de conta, recuperação, API key e mTLS, cite a linha de verificação e a vinculação ausente de principal/sessão/recurso/origin/audience/ação/garantia. Prove que o servidor aceita a transição ou credencial inválida.
4. Para CSRF, nomeie a credencial ambiente, a rota que muda estado, o formato de requisição cross-site aceito, a política de cookie do navegador e a checagem efetiva ausente. Ações só de leitura e rotas que exigem um bearer token não ambiente não se qualificam.
5. Verifique os defaults do framework e da biblioteca. Se a versão ou configuração for desconhecida, use `needs_validation`; não transforme uma alegação crítica não verificada num achado `confirmed` de severidade menor.
6. Devolva `confirmed` só com rastro completo no código-fonte e identidade, estado ou divulgação não autorizados observáveis. Para `needs_validation`, nomeie o fato ausente e a checagem segura, local ou observada pelo dono, que o resolve.
