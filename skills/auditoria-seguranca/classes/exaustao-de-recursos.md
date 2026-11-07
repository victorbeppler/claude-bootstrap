# Caça em exaustão de recursos e disponibilidade

#### Quando usar este arquivo

Recorra a este arquivo quando requisições, mensagens, arquivos, estado de tenant ou trabalho de agente não confiáveis podem consumir CPU, memória, disco, conexões, slots de worker, APIs pagas ou capacidade de fila, ou podem causar deadlock/crash em um serviço compartilhado. Este domínio distingue uma vulnerabilidade de disponibilidade revisável no código-fonte de um problema genérico de desempenho. Nunca valide estressando um serviço compartilhado ou em produção.

Use `memoria-e-binario.md` para defeitos de integridade de memória e `protocolos-rpc-e-mensageria.md` para lógica de entrega do broker. Um erro fatal alcançável pertence a este arquivo pelo impacto compartilhado, mesmo quando o parser subjacente é coberto em outro lugar.

## Disciplina central (incluir em todo prompt de agente deste domínio)

```
- Exija um caminho de entrada até custo, um limite efetivo ausente e impacto sobre outro usuário, serviço compartilhado, função de segurança ou gasto do operador. Trabalho autolimitado no próprio processo do requisitante não é vulnerabilidade de serviço.
- Rate limit ausente não basta. Verifique limites de corpo/mensagem/arquivo, concorrência, filas, deadlines, constraints de banco de dados, gateways upstream e cotas por tenant antes de chamar um caminho de ilimitado.
- Não rode testes de estresse, de saturação ou em produção. Use análise assintótica, fixtures de limite pequenas, chamadas pagas mockadas, limites estritos de recursos locais e testes de cancelamento determinísticos.
- Declare o custo do atacante, o trabalho do serviço, a persistência, o escopo e a recuperação. Uma única entrada limitada com efeito compartilhado superlinear ou persistente é materialmente diferente de volume sustentado.
- Use `confirmed` para falhas de limite visíveis no código-fonte demonstradas com segurança. Use `needs_validation` quando limites upstream, topologia de deploy, autoscaling, cota paga ou comportamento de recuperação estão fora do repositório.
```

## Classes de ataque de amplificação computacional (subagent_type: `general-purpose`)

**Parsing, matching ou avaliação superlinear**
Uma entrada pequena aceita provoca backtracking catastrófico de regex, parsing aninhado, validação recursiva, avaliação simbólica, travessia de grafo, expansão de template ou comportamento adversarial de sort/hash. Derive a profundidade/cardinalidade aceita e a complexidade, e então demonstre localmente uma curva de crescimento limitada.

**Amplificação por descompressão e representação**
Entrada comprimida, esparsa, aninhada, com aliases ou codificada se expande muito além do tamanho de transferência ou de arquivo verificado. Verifique os limites depois de cada expansão e através dos estágios do parser, incluindo arquivos compactados, imagens, fontes, documentos estruturados e tabelas de compressão de protocolo.

**Amplificação de consultas a banco e downstream**
Uma requisição pequena gera scans amplos, joins patológicos, fan-out, sort/agregação ilimitados ou muitas chamadas downstream porque profundidade de consulta, cardinalidade de filtro, paginação ou campos de expansão não são limitados. Confirme que a autorização não permite intencionalmente o mesmo escopo de recursos.

## Classes de ataque de acúmulo de recursos (subagent_type: `general-purpose`)

**Buffering e cardinalidade ilimitados**
Corpos, streams fora de ordem, uploads, sessões, chaves de cache únicas, labels de métricas, campos de log, assinaturas ou jobs pendentes se acumulam sem limites por item e agregados. Encontre a limpeza e a expiração em desconexão, timeout, cancelamento e parse parcial.

**Vazamento de descritores, handles e recursos temporários**
Trabalho malformado ou cancelado pula a limpeza e retém sockets, arquivos, cursores de banco, timers, subprocessos, arquivos temporários ou referências a objetos. Confirme que o vazamento se repete em iterações locais limitadas e afeta um pool compartilhado.

**Trabalho desanexado após cancelamento**
Timeout do cliente, desconexão, job cancelado ou autorização com falha devolve o controle, mas deixa trabalho de banco, modelo, rede ou worker rodando. Rastreie a propagação de cancelamento e de deadline por todas as camadas.

## Classes de ataque de cota e escalonamento (subagent_type: `general-purpose`)

**Desequilíbrio de trabalho pré-autenticação**
Parsing caro, busca de chave, criptografia, descompressão ou requisições externas acontecem antes da autenticação e do primeiro gate de tamanho/taxa. Compare o esforço mínimo do requisitante com o custo do serviço compartilhado e verifique os limites upstream.

**Lacunas de escopo e de reset na contabilização de cota**
A contabilização usa IP, rota, tenant, prefixo de chave, ID de tarefa ou outra dimensão influenciável pelo atacante, permitindo que o trabalho de um principal escape do orçamento pretendido ou consuma a alocação de outro principal. Revise overflow de inteiro, corridas distribuídas, retries, reconexões e troca de conta.

**Inanição de worker, pool e prioridade**
Jobs de baixa prioridade ou controlados pelo atacante seguram locks, workers, pools de banco, turnos do event loop ou prioridade do escalonador compartilhados, necessários a usuários não relacionados. Exija um caminho que contorne a justiça de fila/concorrência ou retenha um slot além do deadline.

## Classes de ataque de falha e recuperação (subagent_type: `general-purpose`)

**Erro fatal ou deadlock alcançável**
Uma entrada não confiável alcança `panic`, abort, assertion fatal, exceção não tratada, saída do processo, ciclo de locks ou laço infinito em um processo compartilhado. Confirme o escopo do supervisor e se um worker ou o serviço inteiro fica indisponível. Um worker isolado reiniciado pode reduzir o impacto, mas não apaga o defeito.

**Tempestade de retries e amplificação fail-open**
Timeouts, erros de dependência, mensagens parcialmente processadas ou falhas de health check disparam retries sincronizados ou ilimitados sem jitter, teto, circuit breaking ou deduplicação. Verifique que uma única fonte de falha limitada consegue criar trabalho agregado persistente.

**Registro envenenado e bloqueio head-of-line**
Um registro ou mensagem malformado falha repetidamente na frente de uma fila, partição, varredura de inicialização, migração ou laço de recuperação compartilhado. Revise a política de skip/quarentena, os offsets e se outros tenants compartilham a unidade bloqueada.

**Recuperação insegura e rollback de capacidade**
Um caminho de reinício, restore, fallback ou limpeza reconstrói estado ilimitado, ignora as cotas atuais ou restaura a entrada que imediatamente repete a falha. A correção da recuperação faz parte da disponibilidade.

## Movimentos universais (aplicar a todos os acima)

- Monte uma tabela de entrada até recurso: primeiro tamanho/cardinalidade aceito, trabalho antes da autenticação, fan-out downstream, persistência, pool compartilhado, dono do limite e da limpeza, recuperação.
- Compare limites agregados com limites por objeto. Dez mil itens válidos de um byte podem escapar de um limite por mensagem enquanto esgotam o estado do tenant inteiro ou do processo inteiro.
- Valide só em uma fixture isolada com limites estritos de CPU/memória/tempo e pontos de crescimento pequenos. Faça mock das chamadas externas e pagas e pare assim que o limite ausente ou o cancelamento for observável.

## Regras de validação (aplicar antes de reportar QUALQUER achado daqui)

1. Nomeie a entrada não confiável, o trabalho do requisitante, a amplificação do serviço ou o recurso retido, o raio de impacto compartilhado e a recuperação. Limites ausentes sem impacto compartilhado concreto são hardening.
2. Confirme que nenhum limite visível no código-fonte, de upstream, parser, fila, tenant ou framework, impede o caminho. Controles de deploy desconhecidos exigem `needs_validation`.
3. Para comportamento superlinear, estabeleça a complexidade aceita e um crescimento local limitado. Para vazamentos, mostre retenção repetível depois do ponto em que a limpeza deveria ocorrer. Para caminhos fatais, identifique o isolamento de processo/supervisor.
4. Priorize por baixo trabalho do requisitante, alcançabilidade sem autenticação, escopo entre tenants, persistência e recuperação ruim; não valide causando impacto de disponibilidade.
5. Devolva `confirmed` só com prova local segura e efeito compartilhado significativo. Devolva `needs_validation` com o limite upstream, topologia, cota ou observação de recuperação exato que um responsável deve verificar.
