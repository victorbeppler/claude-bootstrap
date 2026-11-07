# Classes de ataque

#### Classes de ataque — escolha e divida com base na Fase 1

Selecione as classes de ataque relevantes para o tipo de aplicação. Nem toda classe se aplica a toda base de código. A lista abaixo é um ponto de partida; acrescente classes específicas da aplicação a partir da Fase 1 e divida bases de código grandes por subsistema. Enquadre o trabalho como encontrar, validar, corrigir e priorizar vulnerabilidades. Mantenha a validação restrita à revisão de código-fonte e a fixtures locais limitadas; não desenvolva cadeias de payload, não teste disponibilidade em serviços em produção e não execute ações em ambientes compartilhados.

Use `confirmed` só quando a evidência no código-fonte e a validação limitada estabelecerem a fronteira completa e um resultado relevante. Use `needs_validation` quando um fato específico de deploy, provedor, plataforma, identidade ou runtime não estiver disponível; declare o fato ausente e a checagem segura, local ou observada pelo responsável, que o resolve.

> **Alvos nativos / binários / kernel** (C/C++/Rust-unsafe, módulos de kernel, parsers e decodificadores, FFI, runtimes concorrentes, carregadores de binário, JITs, firmware): use as classes de segurança de memória, inteiros/ABI, concorrência, carregador de binário e interface privilegiada em [classes/memoria-e-binario.md](memoria-e-binario.md).
>
> **Alvos de IA / LLM / agentes** (chatbots, RAG, memória persistente, agentes com chamada de ferramentas, servidores/clientes MCP, montagem de prompt ou ações controladas pelo modelo): use as classes de contexto, envenenamento de memória, vinculação de ação, schema de ferramenta, identidade MCP e saída em [classes/ia-e-llm.md](ia-e-llm.md).
>
> **Alvos HTTP, web e de identidade** (aplicações web comuns, APIs, proxies reversos, CDNs, gateways, parsers HTTP customizados, sessões, CSRF, JWT, OAuth/OIDC, SAML, MFA, passkeys, recuperação/vinculação de conta, chaves de API ou mTLS): use [classes/web-protocolo-e-auth.md](web-protocolo-e-auth.md).
>
> **Alvos client-side e de navegador** (SPAs, extensões de navegador, webviews embutidas, service workers, armazenamento do navegador, mensagens entre janelas, CORS, WebSockets ou renderização de DOM): use [classes/client-side.md](client-side.md).
>
> **Alvos de supply chain e release** (resolução de dependências, entradas geradas, CI, release/assinatura/promoção, atualizações, plugins ou extensões): use [classes/supply-chain-e-release.md](supply-chain-e-release.md).
>
> **Alvos de cloud e deploy** (IAM, infraestrutura como código, containers/Kubernetes, service mesh, serverless/edge, ingress, eventos de provedor ou configuração de runtime): use [classes/cloud-e-deploy.md](cloud-e-deploy.md).
>
> **Alvos de protocolo, RPC e mensageria** (gRPC, transportes GraphQL, Protobuf/Cap'n Proto/Thrift, protocolos customizados, filas, brokers, pub/sub, webhooks ou RPC em streaming): use [classes/protocolos-rpc-e-mensageria.md](protocolos-rpc-e-mensageria.md).
>
> **Alvos de exaustão de recursos e disponibilidade** (trabalho não confiável pode consumir CPU, memória, disco, conexões, workers, filas, cotas compartilhadas ou gasto do operador): use [classes/exaustao-de-recursos.md](exaustao-de-recursos.md).
>
> **Alvos de isolamento e ciclo de vida de dados** (stores multi-tenant, caches/busca, links de objeto, analytics, exportação/backup, migração, exclusão, retenção ou restauração): use [classes/isolamento-e-ciclo-de-dados.md](isolamento-e-ciclo-de-dados.md).
>
> **Alvos desktop, mobile e IPC local** (apps nativos, deep links, pontes de webview, componentes exportados, helpers privilegiados, daemons locais, sockets Unix/XPC/Binder/D-Bus): use [classes/desktop-mobile-e-ipc.md](desktop-mobile-e-ipc.md).

**Injeção** (subagent_type: `general-purpose`)
Rastreie a entrada não confiável do ponto de entrada até o sink perigoso. O que conta como "sink perigoso" depende da aplicação:
- Aplicações web: queries SQL, saída HTML, comandos de shell, template engines, caminhos de arquivo, redirecionamentos HTTP, desserialização
- Bibliotecas: qualquer função que processe dados fornecidos pelo chamador sem validação — operações de buffer, parsers, format strings
- Ferramentas CLI: construção de comandos de shell, manipulação de caminhos de arquivo, interpolação de variáveis de ambiente
- Serviços: construção de queries, serialização de mensagens, injeção em log, queries LDAP/XPATH
- Client-side (navegador/JS): DOM XSS, prototype pollution, confiança em `postMessage`/origin e outras classes do lado do navegador — cobertas pelos blocos de classe de ataque de [classes/client-side.md](client-side.md) quando selecionados

Não pare nos caminhos diretos óbvios. Procure injeção indireta: dado armazenado com segurança e depois recuperado e usado em um contexto perigoso por outro código. Procure injeção por nomes de campo, chaves, headers e metadados — não só valores. Procure injeção em sistemas secundários (logs, caches, índices de busca, analytics).

**Controle de acesso** (subagent_type: `general-purpose`)
Verifique que um chamador não consegue fazer algo fora da sua autoridade. Vá além de checar se as verificações de permissão existem — verifique se elas checam a permissão *certa* para o recurso *certo* pelo mecanismo *certo*:
- Existe um caminho para a mesma mudança de estado que checa uma permissão diferente (mais fraca)?
- Um campo no corpo da requisição consegue sobrescrever o que o sistema de permissões pretendia restringir?
- Há endpoints que exigem autenticação mas esquecem a autorização?
- O mesmo recurso tem vários caminhos de acesso com checagens inconsistentes?
- E as operações em massa/lote/exportação/importação — elas aplicam permissão por item?

Para modelos de acesso complexos, divida em agentes separados para bypass de autenticação versus lógica de autorização.

**Manipulação de recursos e arquivos** (subagent_type: `general-purpose`)
- Path traversal (ler/escrever fora dos diretórios previstos) — inclusive via symlinks, sequências codificadas e null bytes
- SSRF (fazer a aplicação buscar URLs controladas pelo atacante) — inclusive via redirecionamentos, DNS rebinding e diferenças entre parsers de URL
- Desserialização insegura, extração de arquivo compactado (zip slip), manipulação de arquivos temporários
- Segurança de memória (se aplicável): buffer overflow, use-after-free, integer overflow
- Condições de corrida em operações de arquivo (TOCTOU entre checagem e uso)

**Criptografia e segredos** (subagent_type: `general-purpose`)
- Aleatoriedade fraca para valores críticos de segurança (tokens, chaves, nonces)
- Segredos hardcoded, segredos em logs, mensagens de erro, URLs ou respostas visíveis ao cliente
- Derivação de chave quebrada, verificação de HMAC ausente, reúso de nonce
- Canais laterais de tempo na comparação de segredos
- Uso incorreto de primitivas criptográficas (modo ECB, criptografia sem autenticação, IVs estáticos etc.)
- O que acontece quando operações criptográficas falham? O caminho de erro cai para sem criptografia?

**Lógica de negócio** (subagent_type: `general-purpose`)
Cace erros de lógica manualmente: scanners comuns não os encontram, e eles rendem achados de alto impacto. Para cada fluxo principal:
- **Violações de máquina de estados**: dá para pular etapas? Voltar? Chegar a um estado inválido? O que acontece se você reproduzir um fluxo já concluído? E falha parcial — se a etapa 2 de 3 falha, a etapa 1 é revertida?
- **Condições de corrida com impacto de negócio**: operações concorrentes que produzem estados inválidos (gasto duplo, aprovação dupla, atualizações perdidas). Foque em operações que fazem check-then-act de forma não atômica.
- **Manipulação numérica/de quantidade**: valores negativos, valores zero, overflow, perda de precisão, coerção de tipo entre string e número.
- **Violações de fronteira de acesso**: não "a checagem de permissão existe?", mas "é a checagem certa para a regra de negócio?". A entrada de uma operação consegue contornar uma restrição aplicada em outra operação com o mesmo efeito?
- **Suposições implícitas de confiança**: dados vindos do storage, da configuração, de outros componentes ou de plugins presumidos seguros porque "validamos na entrada". E se outro caminho de código os escreveu?
- **Lógica baseada em tempo**: checagens de expiração, agendamento, janelas de rate, clock skew. O que acontece nos momentos exatos de fronteira? E diferenças de fuso horário entre componentes?
- **Comportamento padrão e de fallback**: qual é a postura de segurança quando falta configuração? Quando uma feature flag está desligada? Quando uma dependência está indisponível? Quando o sistema está no meio de uma migração?

**Abuso de funcionalidade e vazamento de dados** (subagent_type: `general-purpose`)
Funcionalidades legítimas usadas para fins não previstos. Procure bugs no design, não só no código:
- **Exportação/backup como exfiltração**: um usuário de baixo privilégio consegue disparar uma exportação, snapshot ou backup que inclua dados acima do seu nível de acesso? Consegue exportar dados de outros usuários? A exportação inclui conteúdo excluído/rascunho/privado? Histórico de revisões que deveria ter sido podado?
- **Importação/restauração como injeção**: a importação consegue sobrescrever dados existentes? Consegue criar registros que contornam a validação normal? Consegue injetar conteúdo em coleções às quais o usuário não tem acesso de escrita? Respeita o mesmo modelo de permissões da UI?
- **Busca/filtro/ordenação como oráculo**: queries de busca conseguem revelar se existe conteúdo que o usuário não pode acessar diretamente? Parâmetros de filtro permitem sondar status, papéis ou campos que o usuário não deveria conhecer? Ordenar por um campo oculto revela seus valores pela ordem dos resultados?
- **Enumeração por efeitos colaterais**: as mensagens de erro diferem entre "não existe" e "sem acesso"? Os tempos de resposta diferem? Os tamanhos de resposta? Os códigos de status HTTP? Dá para enumerar usuários pelos fluxos de redefinição de senha, convite ou cadastro?
- **Vazamento de preview/rascunho/staging**: tokens de preview têm escopo de um item ou liberam acesso mais amplo? Conteúdo em rascunho pode ser descoberto por busca, feeds RSS, sitemaps ou endpoints de listagem da API? Headers de cache podem fazer um CDN servir conteúdo privado publicamente?
- **Notificação/webhook como SSRF**: um usuário consegue definir uma URL de notificação, de webhook ou de callback que o servidor busca? Ela é validada contra redes internas? E depois de um redirecionamento?

**Vulnerabilidades encadeadas e fronteiras de confiança** (subagent_type: `general-purpose`)
Comportamento permitido ou contido isoladamente pode virar vulnerabilidade quando outro componente ou etapa do ciclo de vida depende de uma garantia mais forte:
- **Falhas de fronteira em múltiplas etapas**: mapeie o que um principal de baixo privilégio pode ler, escrever, invocar e reter, e então conecte só saídas concretas a decisões de confiança posteriores. Confirme cada pré-requisito e não presuma um efeito a jusante.
- **Lacunas de confiança entre componentes**: o componente A valida a entrada e a repassa ao componente B. Compare a garantia exata que A produz com o que B presume, incluindo truncamento, coerção de tipo, normalização, escopo de tenant e acesso de plugin/extensão.
- **Uso de segunda ordem**: dado seguro quando armazenado pode se tornar perigoso em um contexto posterior. Um nome de campo vira um JSON path, um slug vira um caminho de arquivo, texto escapado entra em renderização crua, ou uma string armazenada vira uma URL, regex, template ou expressão de política.
- **Crescimento de escopo e capacidade**: capacidades de token, chave de API, plugin, OAuth, MCP ou IA ficam mais amplas após delegação, refresh, cache, mudança de papel ou composição. Nomeie a operação concreta que o principal resultante não deveria ter.
- **Tempo e ordenação**: revise as janelas de setup, migração, soft-delete, revogação/expiração de cache, checagem/uso e validação/consumo. Confirme que estado obsoleto é aceito antes de reportar.
- **Rollback e recuperação**: undelete, restauração, rollback de revisão e cancelamento devem aplicar a titularidade, a validação e a autorização atuais. Confirme qual estado inválido é restaurado.

**Curinga** (subagent_type: `general-purpose`)
Você não recebe uma categoria. Encontre vulnerabilidades fora das classes padrão já atribuídas.

Leia código que parece entediante ou desconectado de segurança. Siga funcionalidades incompletas, experimentais, de compatibilidade e de fallback, mas mantenha os mesmos requisitos concretos de fronteira e validação de todas as outras classes.

Use estes pontos de partida, mas não se limite a eles:
- Qual é o código mais estranho da base? Por que ele existe? O que acontece se for abusado?
- Há funcionalidades que parecem pela metade, experimentais ou enxertadas? Essas têm a segurança mais fraca porque receberam menos revisão.
- O que acontece se você usar a API de um jeito que o frontend nunca usaria? A UI restringe os usuários, mas a API não. Quais chamadas de API são possíveis mas nunca feitas pelo cliente?
- Há endpoints, parâmetros, headers ou funcionalidades ocultos ou não documentados? Olhe registros de rotas, middleware e configuração atrás do que não está na documentação.
- O que acontece quando você mistura funcionalidades que não foram projetadas para funcionar juntas? Localização + preview + cache. Importação + plugins + webhooks. OAuth + personificação + chaves de API.
- Há algo interessante no histórico do git? Correções de segurança revertidas, checagens de auth comentadas, segredos que foram commitados e depois removidos (ainda no histórico).
- Quais ações de uma conta válida afetam outros usuários, a integridade compartilhada, a disponibilidade ou o custo do operador? Verifique contenção, cotas, autorização e recuperação em torno dessas ações.
- Quais operações são irreversíveis ou exigem confirmação elevada? Vincule autorização e aprovação ao principal, à ação e ao recurso finais.
- Que suposições o código faz sobre o ambiente? Que o banco é local, que o relógio é preciso, que o DNS é confiável, que o sistema de arquivos diferencia maiúsculas de minúsculas?
- Olhe os arquivos de teste — o que eles **não** testam? Compare os casos de borda em que o desenvolvedor pensou (existem testes) com os que ele não pensou (sem testes).

Persiga anomalias dentro do escopo atribuído até o invariante ser resolvido. Se algo parece estranho, leia até conseguir afirmar se é seguro. Se uma função tem um comentário explicando por que é segura, verifique a explicação. Se uma variável se chama `temp`, `hack` ou `legacy`, leia com atenção.

**Coisas óbvias** (subagent_type: `general-purpose`)
Outros agentes caçam bugs sutis. Este agente checa as exposições básicas que são fáceis de deixar passar porque todos presumem que alguém já checou:
- Há senhas, chaves de API, tokens ou segredos hardcoded no código-fonte? (grep por `password`, `secret`, `apikey`, `token`, `Bearer`, `-----BEGIN`, senhas padrão comuns)
- Há comentários TODO/FIXME/HACK/XXX que mencionam segurança? (`TODO: add auth`, `FIXME: validate input`, `HACK: skip permission check`)
- O modo debug / modo dev está devidamente protegido? Ele pode ser habilitado em produção via variável de ambiente, query parameter ou header?
- Há credenciais de teste/exemplo/seed que funcionam em produção?
- Há algum endpoint `/debug`, `/admin`, `/test`, `/status`, `/health`, `/metrics`, `/env`, `/.env`, `/config` desprotegido?
- Há arquivos `.env`, `.env.local`, `credentials.json`, `*.pem`, `*.key` commitados no repositório?
- O `.gitignore` realmente cobre segredos, uploads e configuração local?
- As dependências estão fixadas? Há CVEs conhecidos na árvore de dependências? (confira os lockfiles)
- Há algum `eval()`, `exec()`, `child_process`, `Function()`, `vm.runInContext`, `import()` com entrada dinâmica?
- Os headers CORS estão definidos como `*` ou permissivos demais? `Access-Control-Allow-Credentials` está combinado com origin curinga?
- Os cookies estão sem os atributos `HttpOnly`, `Secure` ou `SameSite`?
- Há open redirects? (parâmetros chamados `redirect`, `return`, `next`, `url`, `goto`, `continue` que alimentam redirecionamentos sem validação)
- O TLS é obrigatório? Há endpoints só HTTP?
- As respostas de erro em produção retornam stack traces, caminhos internos ou erros de SQL?

Este agente não precisa ser criativo. Precisa ser minucioso e literal. Cheque cada item. Reporte cada resultado.

**Importante**: para qualquer achado que este agente reporte, ele deve verificar o caminho de código completo, não só a aparência superficial. Se um cookie está sem `HttpOnly`, cheque se o cookie contém dado sensível para segurança e se o JS precisa lê-lo por design. Se uma mensagem de erro contém um nome de campo, cheque se esse campo chega de fato a ser preenchido com dado sensível. Uma flag não é um achado — rastreie o impacto antes de reportar.
