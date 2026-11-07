# Caça em client-side e navegador

#### Quando usar este arquivo

Recorra a este arquivo quando decisões de confiança relevantes ou renderização não confiável acontecem num navegador: single-page apps, extensões de navegador, webviews embutidas, service workers, aplicações offline e código que renderiza no DOM conteúdo influenciável pelo atacante, recebe mensagens entre janelas ou usa armazenamento do navegador. Esses caminhos incluem fontes que o servidor nunca vê, como fragmentos de URL, `window.name`, `postMessage` e conteúdo em cache de antes.

Use junto com `base.md`. Este arquivo cobre fontes e sinks do navegador, fronteiras de origin, persistência no navegador e oráculos de estado cross-site. Use `desktop-mobile-e-ipc.md` para o lado nativo de uma bridge de webview, e `web-protocolo-e-auth.md` para CSRF no servidor, sessões e callbacks de autenticação.

## Disciplina central (incluir em todo prompt de agente deste domínio)

```
- Um candidato client-side precisa de uma fonte controlável e de um sink que executa ou divulga. Nomeie os dois e mostre dados influenciados pelo atacante chegando ao sink.
- O impacto deve alcançar a sessão de uma vítima, outra origin ou persistência compartilhada. Autoinjeção e divulgação dos próprios dados do atacante não são achados.
- Escaping do framework, same-origin policy do navegador, CSP, COOP/CORP, escopo de service worker e os defaults modernos de noopener são controles reais. Verifique-os antes de atribuir impacto.
- Armazenamento e caches do navegador são compartilhados por origin e podem sobreviver ao estado de login. Identifique quem escreve, quem lê e qual conta, tenant ou ciclo de vida de worker limpa cada registro.
- Use `confirmed` só com evidência completa no código-fonte mais testes locais limitados no navegador. Use `needs_validation` quando um comportamento de renderizador, permissão de extensão, header de deploy ou política de navegador for necessário mas não estiver disponível.
```

## Classes de ataque de DOM e estado de objeto (subagent_type: `general-purpose`)

**XSS baseado em DOM**
Rastreie campos de `location`, `document.referrer`, `window.name`, dados de mensagem, armazenamento e estado de documento controlado pelo navegador até `innerHTML`, `outerHTML`, `document.write`, APIs que avaliam strings, URLs executáveis, APIs HTML do jQuery ou escape hatches do framework. Interpolação escapada pelo framework não é achado.

**DOM clobbering**
Atributos `id` ou `name` injetados pelo atacante sombreiam uma global, propriedade de formulário, objeto de configuração ou flag de inicialização em que o código confia depois. Exija tanto um caminho de markup que preserve o atributo quanto um uso relevante para segurança do valor sobrescrito.

**Prototype pollution e cadeia de gadget**
Uma chave controlada pelo atacante chega a uma escrita recursiva, como deep merge ou atribuição por caminho, e modifica o estado do protótipo. Depois, um gadget alcançável consome a propriedade poluída para mudar autorização, execução, navegação ou renderização. `JSON.parse`, uma cópia rasa ou poluição sem gadget não bastam.

## Classes de ataque de mensageria cross-origin e rede (subagent_type: `general-purpose`)

**Confiança em origin e source de `postMessage`**
Um handler executa uma ação sensível com `event.data` sem allowlist exata de origin e, onde vários frames compartilham uma origin, sem o `event.source` esperado. No lado do envio, dados sensíveis enviados para `*` chegam a um embedder não pretendido. Comparação fraca de origin por substring, prefixo, sufixo ou regex sem âncora não é checagem de origin.

**Uso cross-site de requisição WebSocket**
Um upgrade de WebSocket aceita cookies ambientes de uma origin não confiável sem checagem de `Origin` nem token específico do canal, permitindo que a sessão da vítima leia ou altere dados. Confirme tanto o comportamento do upgrade quanto um handler de mensagem relevante para segurança.

**Confiança em CORS com credenciais**
O servidor reflete ou compara de forma fraca o `Origin` enquanto permite credenciais e devolve respostas sensíveis. Um wildcard puro com credenciais é rejeitado pelos navegadores; reporte só o caminho real de origin refletida/permitida e os dados ou a mutação cross-origin.

## Classes de ataque de service worker e armazenamento do navegador (subagent_type: `general-purpose`)

**Tomada de registro e escopo de service worker**
Conteúdo influenciável pelo atacante consegue virar o script de worker registrado, controlar um caminho que recebe um escopo `Service-Worker-Allowed` amplo demais ou alterar imports de atualização sem controle de integridade. Verifique a URL final do script, o MIME type da resposta, a origin, o escopo e quem controla cada script importado. Um worker same-origin normal com o escopo pretendido não é defeito.

**Confusão de cache e identidade no service worker**
O worker guarda em cache respostas personalizadas sem incluir conta, tenant, estado de autorização ou modo de requisição na sua política, e depois as serve após troca de conta ou logout. Revise o roteamento do evento fetch, nomes e chaves de cache, fallbacks de navegação, limpeza de cache e se caminhos de erro/offline devolvem a resposta anterior de outro usuário.

**Divulgação por armazenamento do navegador e autorização obsoleta**
Tokens, respostas privadas, rascunhos ou decisões de autorização permanecem em `localStorage`, `sessionStorage`, IndexedDB, Cache Storage, armazenamento de extensão ou estado do cliente e ficam legíveis por outra conta ou por um componente same-origin menos confiável. Guardar um token sozinho não é achado; exija um leitor realista com menos autoridade, ou uso continuado depois de revogação/logout.

**Confusão de armazenamento e broadcast entre contextos**
Eventos `storage`, `BroadcastChannel`, shared workers ou caches de toda a origin carregam identidade ou comandos entre abas sem vinculá-los à sessão atual. Verifique troca de conta, janelas privadas/públicas, mudanças de tenant e abas obsoletas que podem sobrescrever um estado de autenticação mais novo.

## Classes de vazamento de informação cross-site (subagent_type: `general-purpose`)

**XS-Leaks e oráculos de estado cross-origin**
Uma página do atacante consegue distinguir estado cross-origin protegido por eventos de carga/erro de recurso, estado de frame ou janela, comportamento de redirect, timing, estado de cache ou tamanho de resposta enquanto o navegador anexa as credenciais da vítima. Exija um predicado concreto que carregue segredo, como se um objeto privado, papel ou conta existe. Variação genérica de timing ou disponibilidade de recurso público não é achado.

**Divulgação de estado de janela e opener**
Os metadados permitidos ou o resultado de navegação de uma janela cross-origin revelam estado protegido, ou uma relação retida de opener/janela nomeada permite que uma página controlada pelo atacante influencie uma navegação privilegiada. Verifique COOP, proteções de frame, `noopener`, a origin exata e se o estado observável é confidencial.

## Classes de ataque de UI redress e navegação (subagent_type: `general-purpose`)

**Clickjacking**
Uma ação que muda estado, dentro de frame, não tem `frame-ancestors`, `X-Frame-Options` ou isolamento de UI equivalente efetivos. Exija a ação sensível e confirme que ela pode ser concluída no estado em frame; headers ausentes em conteúdo só de leitura são notas de hardening.

**Confusão de navegação client-side**
Uma fonte do cliente controla redirect ou navegação sem política de scheme e destino, incluindo destinos executáveis `javascript:` ou `data:`. Reverse tabnabbing só se aplica onde o código mantém explicitamente `window.opener`, usa `window.open` sem isolamento ou suporta um navegador sem `noopener` implícito.

## Movimentos universais (aplicar a todos os acima)

- Comece pelos sinks de DOM, navegação, worker, mensagem e armazenamento e rastreie de volta até as fontes exclusivas do navegador e as controladas pelo servidor. Registre a política do navegador que deveria barrar o caminho.
- Teste troca de conta, logout, atualização de worker, fallback offline e estado de aba obsoleta com uma origin de teste local e contas fictícias. Não use usuários, origins ou serviços compartilhados de produção.
- Para XS-Leaks, liste só predicados provados pelo código-fonte e pelo comportamento local do navegador. Depois identifique os headers de resposta ou a escolha de renderização que eliminariam o oráculo.

## Regras de validação (aplicar antes de reportar QUALQUER achado daqui)

1. Cite a fonte, o sink, a política do navegador, a origin/sessão afetada e a mutação ou divulgação observável.
2. Para prototype pollution, prove a escrita recursiva e um gadget relevante para segurança. Para DOM clobbering, prove que o markup sobrevive e que o valor sombreado é usado.
3. Para service workers e armazenamento, prove a alcançabilidade no ciclo de vida: uma escrita ou entrada de cache controlada pelo atacante deve chegar a outra conta, outro tenant ou a um estado de autorização posterior.
4. Para mensageria, CORS, WebSocket e XS-Leaks, mostre a validação exata de origin/source e o estado ou ação protegidos expostos. Confirme que CSP, COOP/CORP, cookies e a política SameSite já não bloqueiam o caminho.
5. Devolva achados `confirmed` só com um caminho completo no cliente e evidência local limitada. Devolva `needs_validation` com o header de deploy, a permissão de extensão, a versão do navegador ou o comportamento de renderizador preciso que um dono deve verificar.
