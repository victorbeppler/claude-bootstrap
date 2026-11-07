# Caça em IA, LLM e agentes

#### Quando usar este arquivo

Recorra a este arquivo quando um modelo de linguagem participa de uma decisão sensível à confiança: chatbots e assistentes, pipelines de RAG, memória persistente de agente, loops de agente/tool calling, servidores e clientes MCP, código que monta prompts a partir de entrada não confiável, ou código que consome a saída do modelo e age sobre ela. O fluxo de dados que importa é *conteúdo não confiável → modelo ou memória → capacidade, autoridade ou sink*.

Use este arquivo junto com `base.md`, não no lugar dele. Transporte, controle de acesso, construção de consultas, uso do sistema de arquivos e renderização de saída continuam sendo fronteiras de confiança comuns. Este arquivo cobre a camada de delegação específica do modelo. Divida alvos grandes por recuperação (retrieval), memória, despacho de ferramentas, MCP e tratamento de saída.

## Disciplina central (incluir em todo prompt de agente deste domínio)

```
- Prompt injection sozinha não é achado. Exija uma falha de fronteira no nível do código: o conteúdo chega ao contexto de outro principal, invoca autoridade que o solicitante não tem, revela dados que ele não pode ler ou aciona um sink que ele não alcança diretamente.
- Saída do modelo, memória, descrições de ferramentas e respostas MCP são entradas não confiáveis. Aponte o código que concede autoridade, confia na saída, grava estado durável ou alimenta um sink.
- Um prompt de guardrail não é fronteira de segurança. Conte só verificações determinísticas, autorização com escopo de recurso, isolamento, vinculação (binding) e credenciais restritas.
- Declare o atacante, o principal afetado, a identidade de execução efetiva, o recurso, a ação exata, a autoridade usada e o impacto observável. Um pedido direto e intencional de usar a autoridade que o solicitante já tem não é defeito de delegação só porque um modelo o executa.
- Autorização e vinculação de ação são controles separados. Conteúdo controlado pelo atacante que causa uma ação sob a autoridade válida de um principal afetado é falha de vinculação de ação quando esse principal não pediu nem aprovou intencionalmente a ação exata.
- Classifique um candidato como `confirmed` só depois que evidência no código-fonte e validação local limitada estabelecerem a fronteira e o resultado. Use `needs_validation` quando um comportamento necessário de provedor, deploy, modelo, renderizador ou identidade não for observável localmente.
```

## Classes de ataque de contexto, recuperação e memória (subagent_type: `general-purpose`)

**Injeção indireta por conteúdo recuperado**
Um atacante consegue escrever um documento de RAG, página indexada, arquivo, e-mail, corpo de issue, resposta de ferramenta ou metadado que entra no contexto de modelo de outro principal. Rastreie quem pode escrever em cada fonte, como a recuperação limita o escopo dela, qual sessão a consome e que capacidade é habilitada ali. Verifique separadamente isolamento, autorização de recurso e vinculação à intenção do principal consumidor. O defeito é a ausência de um controle determinístico, não um texto persuasivo por si só.

**Vazamento de contexto entre sessões ou tenants**
Histórico de conversa, embeddings, resultados de recuperação ou caches de prompt usam chaves amplas demais. Verifique os filtros de tenant e de ACL na própria consulta e em toda chave de cache. Um campo de tenant gravado no objeto não é aplicação de controle se uma consulta alternativa, um cache compartilhado ou um caminho em lote o omite.

**Envenenamento de memória persistente**
Conteúdo controlado pelo atacante ou resumos do modelo são gravados em memória que depois molda outra tarefa, outro usuário ou uma sessão privilegiada. Revise quem pode criar, atualizar, mesclar e apagar memória; sua procedência e escopo de tenant; se observações de baixa confiança viram instruções ou fatos duráveis; e se a recuperação distingue preferências do usuário de política de ferramenta. Memória salva intencionalmente por um usuário e usada só nos pedidos intencionais e permitidos desse mesmo usuário não é achado de cruzamento de fronteira.

**Confusão de papel e procedência no prompt**
A montagem do prompt permite que texto não confiável se passe por mensagem de sistema, turno anterior, resultado de ferramenta, política ou registro de memória. Procure concatenação de strings, histórico sem tipo, campos de papel (role) controlados pelo chamador e ciclos de serialização que perdem os rótulos de origem. Confirme que a procedência forjada altera uma decisão de confiança determinística ou alcança uma capacidade relevante.

## Classes de ataque de ferramentas e ações (subagent_type: `general-purpose`)

**Injeção de argumento de ferramenta em sink**
Argumentos produzidos pelo modelo chegam a SQL, shell, arquivo, busca de URL ou APIs privilegiadas sem validação no handler. Trate o schema da ferramenta como parsing de entrada e siga cada campo da chamada decodificada até o sink. Saída estruturada restringe o formato; ela não estabelece autorização, caminhos seguros, URLs seguras nem semântica de consulta.

**Agência excessiva e confused deputy**
O agente usa uma identidade de serviço ou credencial ampla, enquanto o handler da ferramenta não volta a checar a permissão do principal solicitante sobre o recurso nomeado. Verifique tanto a identidade efetiva quanto se o chamador poderia executar exatamente aquela operação pela interface normal do produto. Uma credencial compartilhada com escopo de consulta por usuário aplicado não é defeito.

**Vinculação de confirmação e aprovação de ação**
Um usuário aprova uma ação descrita, mas a execução pode usar argumentos alterados, outro recurso, outro principal ou um turno posterior do modelo. Também existe defeito de vinculação de ação quando conteúdo controlado pelo atacante causa um efeito colateral sob a autoridade válida de uma vítima sem pedido ou aprovação intencional dela, mesmo que a autorização genérica permita que a vítima o execute. Revise se a intenção ou a confirmação vincula o nome normalizado da ferramenta, o objeto completo de argumentos, o solicitante, o alvo, o valor, a expiração e a pertença ao lote. Verifique retentativas e sessões retomadas: uma aprovação não deve autorizar um efeito colateral mutado ou duplicado.

**Divergência entre schema e dispatcher de ferramenta**
O schema aceita aliases, campos extras, chaves duplicadas, coerções, objetos aninhados de forma livre ou valores fora da faixa que o dispatcher ou o handler interpretam de outro jeito. Compare validação de schema, canonicalização, bindings gerados e defaults do handler. Valide de novo onde os valores viram seletores de recurso ou opções relevantes para segurança.

**Loops de ação delegada sem limite**
Um pedido limitado consegue enfileirar gasto, envio, mutação ou trabalho em API externa repetidos sem orçamento por pedido, autorização por ação, cancelamento ou controle de idempotência. Confirme o impacto em custo compartilhado, cotas, outros usuários ou estado durável. Não teste esgotando um serviço; use contabilização no nível do código e um loop local limitado.

## Classes de confiança de MCP e subagentes (subagent_type: `general-purpose`)

**Herança de confiança por subagente e MCP**
Uma tarefa delegada recebe a sessão inteira, credenciais, memória ou capacidades em vez da menor autoridade necessária. Verifique o principal e o tenant levados a cada chamada, o estreitamento de capacidades, a audiência da credencial e se os resultados delegados são tratados como não confiáveis no retorno.

**Confusão de identidade de servidor e ferramenta MCP**
Chamadas ou resultados são roteados por nomes de servidor, nomes de ferramenta, IDs de requisição, URIs de recurso ou aliases escolhidos pelo modelo que o atacante consegue influenciar, em vez da conexão autenticada e da requisição pendente. Verifique se dois servidores podem reivindicar a mesma identidade de ferramenta ou recurso, se uma reconexão muda a vinculação e se a resposta de um servidor pode satisfazer a chamada pendente de outro.

**Metadados e schema MCP como política**
Descrições de ferramentas, metadados de recursos, prompts, dicas de completion ou schemas fornecidos por um peer MCP são tratados como política ou autorização. Esses campos podem guiar o modelo, mas não podem conceder capacidade. Encontre a allowlist determinística, a checagem de identidade do servidor e a autorização no handler que continuam valendo quando os metadados conflitam.

## Classes de ataque de saída e divulgação (subagent_type: `general-purpose`)

**Renderização insegura de saída**
A saída do modelo chega a um sink executável de HTML, Markdown, template, URL ou comando sem a codificação e a política que esse sink exige. Para renderização no navegador, verifique recursos carregados automaticamente e CSP ou sanitização em `client-side.md`; comportamento de renderizador fora do repositório torna o candidato `needs_validation`.

**Extração de contexto sensível**
O contexto montado contém credenciais, dados de outro usuário, código-fonte privado ou valores de política que por si só concedem acesso, e uma saída influenciada pelo usuário os expõe. Leia o código de montagem do prompt e de busca de dados. Divulgar instruções genéricas ou comportamento que não cruza uma fronteira de dados não é achado.

## Movimentos universais (aplicar a todos os acima)

- Desenhe quatro mapas primeiro: cada identidade de execução, cada capacidade, toda fonte de contexto ou memória gravável e cada destino de saída. Depois ligue o principal do início à autoridade do fim.
- Comece pelas ferramentas com efeito colateral e volte pelo dispatcher, schema, confirmação, contexto do modelo, recuperação e ingestão. Comece pelas leituras de memória durável e rastreie todo escritor.
- Compare os caminhos direto, enfileirado, de retentativa, de retomada, em lote e delegado da mesma ação. A barreira mais forte deve valer depois que os argumentos estão finais e antes de todo efeito colateral.

## Regras de validação (aplicar antes de reportar QUALQUER achado daqui)

1. Nomeie a fronteira cruzada e o resultado observável: atacante, principal afetado ou recurso compartilhado, identidade de execução, alvo e a ação ou divulgação não autorizada ou não solicitada.
2. Para alegações de confused deputy, prove que a ferramenta não tem autorização por solicitante e recurso e que o atacante não consegue executar a mesma ação normalmente. Para alegações de vinculação de ação, prove em vez disso que conteúdo controlado pelo atacante causou uma ação sob a autoridade do principal afetado que esse principal não pediu nem aprovou intencionalmente. Autorização genérica válida não estabelece essa intenção.
3. Para alegações de memória ou recuperação, cite tanto a escrita controlada pelo atacante quanto a leitura posterior por outro principal ou a decisão privilegiada. Um registro compartilhado sem consumidor alcançável não basta.
4. Para vinculação de ação, estabeleça o pedido intencional ou o objeto aprovado normalizado, se houver, e compare com o objeto que o handler usa. Confirme uma ação não solicitada, mutação, duplicata ou mudança de autoridade observável localmente, sem estender o teste a uma execução danosa. Para divergência de schema, compare o objeto validado normalizado com o objeto do handler.
5. Para alegações de identidade MCP, verifique a conexão autenticada, a correlação de requisições, o namespace de ferramentas e a credencial efetiva. Marque `needs_validation` se for necessária a identidade de um servidor externo ou o roteamento do deploy.
6. Devolva achados `confirmed` só com rastro completo no código-fonte e resultado relevante. Devolva `needs_validation` para um fato de fronteira específico não resolvido e declare a checagem local limitada ou observada pelo dono necessária para resolvê-lo.
