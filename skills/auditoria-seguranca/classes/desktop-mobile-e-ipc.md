# Caça em desktop, mobile e IPC local

#### Quando usar este arquivo

Recorra a este arquivo quando o alvo é um app desktop ou mobile, helper privilegiado, updater, daemon local, host de webview, handler de deep link, host de native messaging do navegador, ou cliente/servidor de IPC local. Os atores não confiáveis relevantes podem ser um documento baixado, conteúdo web remoto, outro app local, outro usuário do SO, um processo em sandbox ou uma conta de menor privilégio. Declare essa capacidade inicial em vez de tratar todos os usuários locais como equivalentes.

Use `client-side.md` para o comportamento de webview do lado do navegador, `memoria-e-binario.md` para segurança de memória nativa e do carregador, e `supply-chain-e-release.md` para autenticidade de atualizações.

## Disciplina central (incluir em todo prompt de agente deste domínio)

```
- Estabeleça o atacante realista local ou de conteúdo remoto: outro app, outro usuário do SO, um processo filho em sandbox, um documento não confiável ou uma origem remota. Autodano dentro da mesma conta e autoridade não é violação de fronteira.
- Caminhos, nomes de processo, IDs de bundle/pacote e campos de remetente alegados não são autenticação de peer. Use credenciais de peer do SO, identidade de código, handles de capacidade ou estado protegido do canal.
- A bridge nativa ou o helper deve autorizar cada operação e o recurso final depois do parsing. Uma UI ou broker confiável não torna confiáveis argumentos influenciáveis pelo atacante.
- Sandbox do SO, assinatura, entitlements, permissões, ACLs de keychain, política de componentes exportados e comportamento de prompts são controles reais quando fixados e visíveis.
- Use `confirmed` para evidência no código-fonte mais testes locais/em emulador limitados. Use `needs_validation` quando assinatura, merge de manifest, versão do SO, política do dispositivo, ACL do instalador ou empacotamento são necessários mas não observáveis.
```

## Classes de ataque de deep link, callback e navegação (subagent_type: `general-purpose`)

**Ambiguidade de esquema customizado e deep link**
Outro app ou página consegue invocar uma rota que muta estado, importa dados, completa a autenticação ou seleciona uma conta sem vínculo com a sessão atual e com um callback de uso único. Revise a normalização de URI, campos de query duplicados, o casamento de scheme/host/path, a política de activity/handler exportado e links obsoletos/reenviados.

**Confusão de handoff entre app e conta**
Callbacks de OAuth, SSO, magic link, convite, pareamento de dispositivo, passwordless ou pagamento voltam para o app instalado, perfil, tenant ou transação pendente errado. Vincule o estado à identidade do app iniciador, à sessão atual, à conta, ao provedor, à operação e à expiração.

**Confusão de autoridade em abertura de arquivo e Intent**
Um arquivo associado, Intent de compartilhamento, item de arrastar/soltar, registro de pasteboard/clipboard, ação de notificação ou evento de abertura de arquivo dispara uma operação privilegiada sem confirmar o tipo de conteúdo, a confiança no remetente quando aplicável, a intenção atual do usuário e o alvo final.

## Classes de ataque de webview e bridge nativa (subagent_type: `general-purpose`)

**Confusão entre origem de navegação e bridge**
Frames remotos ou controlados pelo atacante conseguem alcançar uma bridge JavaScript/nativa destinada só a conteúdo empacotado. Valide a origem no momento da chamada e depois de toda navegação, redirect, criação de subframe, popup e página de erro/fallback. Verificações por prefixo de URL e verificações só no carregamento inicial são insuficientes.

**Capacidades excessivas da bridge nativa**
Conteúdo web consegue selecionar arquivos, comandos, métodos de IPC, credenciais ou ações de sistema arbitrários através de uma bridge genérica. Verifique allowlists de métodos, argumentos normalizados, autoridade de usuário/tenant, exigências de gesto/confirmação e vazamento pelo valor de retorno.

**Acesso a arquivos e acesso universal em webview**
Conteúdo remoto consegue ler arquivos locais do app, esquemas customizados privilegiados ou origens internas porque acesso a arquivos, acesso universal, conteúdo misto, interfaces de debug ou handlers de protocolo customizados unem origens de forma inesperada. A ausência de uma configuração restritiva sem conteúdo protegido alcançável é hardening.

## Classes de ataque de IPC local e componentes exportados (subagent_type: `general-purpose`)

**Lacunas de autenticação de peer em IPC**
Unix sockets, named pipes, XPC, Binder, D-Bus, native messaging, RPC, memória compartilhada ou listeners em loopback aceitam um peer de menor confiança sem verificar credenciais do SO, identidade de código, token de sandbox ou posse do canal. Exija um método ou vazamento significativo por trás do canal.

**Principal alegado versus identidade do canal**
O processo/canal autenticado pertence a um app ou usuário, mas campos da requisição selecionam outro usuário, tenant, perfil ou capacidade. Vincule cada método e recurso à credencial do peer em vez de a um identificador declarado pelo chamador.

**Alcance excessivo de service, activity, receiver ou provider exportado**
Um componente mobile ou endpoint de automação local pode ser invocado externamente e executa uma operação destinada ao próprio app. Revise os manifests finais após o merge, intent filters, nível de permissão/assinatura, concessões de caminho e aliases alternativos. Status do manifest desconhecido após o empacotamento exige `needs_validation`.

**Confusão de ciclo de vida e correlação em IPC**
IDs de requisição previsíveis, handles reutilizados, canais obsoletos, descritores herdados, caminhos de socket graváveis por qualquer um ou comportamento de reinício permitem que um peer responda, cancele ou reutilize a operação de outro peer. Revise as permissões de criação e a limpeza de arquivos de socket, locks, portas e mapeamentos compartilhados.

## Classes de ataque de helper privilegiado e arquivos locais (subagent_type: `general-purpose`)

**Helper privilegiado como confused deputy**
Um chamador de baixo privilégio consegue selecionar um comando, arquivo, serviço, usuário ou configuração de sistema privilegiado sem autorização por operação. Revise as regras de helper de sudo/polkit/UAC/XPC e garanta que o helper valide de forma independente os argumentos normalizados.

**Confiança em caminhos de instalação, atualização e reparo**
Um instalador/helper privilegiado lê manifests, scripts, pacotes, symlinks, diretórios de trabalho ou estado de reparo graváveis por um ator de menor confiança depois da autorização. Vincule a autorização a conteúdo imutável e a caminhos de destino seguros.

**Posse de arquivo local e TOCTOU**
O app verifica um arquivo/caminho e depois segue uma substituição, symlink, mount ou mudança de caixa/normalização durante uma leitura/escrita privilegiada. Use operações relativas a descritor e verifique a posse final. Concentre `memoria-e-binario.md` no parsing depois que o arquivo é aberto.

**Divergência de fronteira em armazenamento de credenciais e segredos locais**
Um item de keychain/keystore, arquivo de token, backup, log, clipboard, preview de notificação ou configuração local é legível por outro app/perfil/usuário com menos autoridade. Texto puro legível só pela mesma conta pretendida do SO não é automaticamente uma vulnerabilidade; declare o leitor de menor confiança e o poder da credencial.

## Classes de ataque de estado da aplicação e ciclo de vida do dispositivo (subagent_type: `general-purpose`)

**Vazamento em troca de conta, logout e restauração do dispositivo**
Dados em cache, tarefas em background, widgets, notificações, bancos de dados locais, armazenamento de webview ou aprovações biométricas sobrevivem ao logout/troca de conta e aparecem sob uma conta posterior. Revise o comportamento de backup/restore e de múltiplos perfis.

**Confusão de ação pendente e presença do usuário**
Notificação, widget, atalho, share sheet, prompt biométrico ou operação adiada autoriza uma ação diferente da exibida, executa depois da expiração ou usa o estado pendente de outro perfil. Vincule a confirmação à ação normalizada, ao recurso, à conta e ao estado atual de primeiro plano.

## Movimentos universais (aplicar a todos os acima)

- Enumere todo processo, componente de app, endpoint local, esquema de URI, associação de arquivo, origem de webview e helper. Registre a identidade no SO, o privilégio em runtime, o chamador e a operação invocável.
- Leia as entradas finais do empacotamento: manifest após merge, entitlements, regras do instalador, registro de native messaging, handlers de protocolo e criação de ACLs. Declarações no código-fonte podem ser sobrescritas mais adiante.
- Valide com perfis fictícios e fixtures locais não sensíveis em uma máquina/emulador isolado. Não interaja com apps, credenciais ou serviços de produção de outros usuários.

## Regras de validação (aplicar antes de reportar QUALQUER achado daqui)

1. Nomeie a capacidade inicial do atacante, o principal de SO/app atravessado, o canal de entrada, o argumento ou estado aceito e a operação ou vazamento não autorizado.
2. Confirme os controles aplicáveis de sandbox do SO, credencial de peer, assinatura, entitlement, permissão, consentimento do usuário e instalador. Fatos desconhecidos de empacotamento/runtime exigem `needs_validation`.
3. Para bridges de webview, cite tanto o controle de navegação/origem quanto o sink nativo privilegiado. Para IPC, cite a autenticação de peer e a autorização por recurso. Para helpers, verifique o destino final normalizado.
4. Mantenha os testes locais limitados e use conteúdo/contas fictícios. Pare depois de provar o resultado na fronteira; não estenda a prova para persistência ou modificação mais ampla do sistema.
5. Devolva `confirmed` só com uma cadeia completa de evidência no código-fonte e local. Devolva `needs_validation` com o fato exato de SO, manifest, assinatura, ACL ou ciclo de vida do dispositivo necessário.
