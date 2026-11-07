# Caça em protocolos, RPC e mensageria

#### Quando usar este arquivo

Recorra a este arquivo quando o alvo usa gRPC, transportes de GraphQL, Cap'n Proto, Thrift, Protobuf, protocolos binários customizados, RPC por streaming, webhooks, brokers, filas, pub/sub ou barramentos de eventos. Ele cobre identidade do peer, interpretação lógica de mensagens, roteamento, replay, ordenação e semântica de entrega. Use `memoria-e-binario.md` para segurança de memória de parsers, `web-protocolo-e-auth.md` para framing HTTP e `exaustao-de-recursos.md` para impacto de disponibilidade.

Divida sistemas grandes por par produtor/consumidor, papel de peer externo/interno, RPC síncrono, streaming e caminho de mensagem assíncrono.

## Disciplina central (incluir em todo prompt de agente deste domínio)

```
- "Interno" não é autenticação. Nomeie a identidade do peer em cada salto e mostre como ela se torna o principal de aplicação usado na autorização.
- Validação de schema prova a forma da mensagem, não a procedência, a autoridade sobre o recurso, a ordenação nem a segurança dos valores. Siga os campos decodificados até a política e os efeitos colaterais.
- Garantias do broker e garantias da aplicação são diferentes. Anote o comportamento de retry, ordenação, acknowledgement, deduplicação e transação antes de avaliar mudanças de estado.
- Divergência de parser exige dois consumidores, versões de schema ou representações de wire concretos e um valor divergente relevante para segurança.
- Use `confirmed` para caminhos completos no código-fonte mais testes locais limitados de produtor/consumidor. Use `needs_validation` para ACL de broker, identidade de service mesh, vínculo de tópico ou comportamento de compatibilidade fora do repositório.
```

## Classes de ataque de framing, schema e interpretação (subagent_type: `general-purpose`)

**Divergência de fronteira de mensagem e canonicalização**
Componentes discordam sobre comprimento, compressão, campos duplicados, campos desconhecidos, codificação, largura numérica, normalização ou precedência entre envelope e corpo. Compare parsers gerados e customizados, gateways, bindings de linguagem e conversores de versão. Confirme qual principal, recurso ou operação difere depois da decodificação.

**Confusão de union, enum e valor padrão**
Variantes desconhecidas, discriminadores ausentes, valores zero, privilégios padrão ou mapeamentos de compatibilidade chegam a código que presume um caso validado. Revise dispatch exaustivo, branches padrão e como consumidores antigos interpretam campos recém-adicionados.

**Divergência de identidade entre envelope e payload**
A autorização usa metadados de roteamento ou de envelope de aparência confiável enquanto o handler age sobre um tenant, conta, sujeito, objeto ou remetente conflitante no corpo. Identifique qual fonte é a autoritativa e garanta que clientes não possam sobrescrevê-la.

## Classes de ataque de identidade e autorização em RPC (subagent_type: `general-purpose`)

**Inconsistência entre interceptor e caminho de método**
Um interceptor de authn/authz se aplica a métodos unários, mas não a streams, reflection, health, caminhos transcodificados pelo gateway, serviços de compatibilidade ou mensagens individuais de stream. Compare todo registro e toda rota para a mesma operação.

**Confusão entre identidade do peer e principal de aplicação**
mTLS, identidade de workload, metadados bearer, identidade encaminhada ou credenciais de broker autenticam um canal, mas um campo controlado pelo chamador seleciona o usuário ou o tenant. A identidade do canal e o principal alegado devem ser vinculados por política determinística.

**Lacunas de autorização por item e em streaming**
Um stream, assinatura, lote ou mensagem em massa é autorizado uma vez, e depois itens posteriores nomeiam recursos diferentes ou continuam após revogação de papel, de membership ou de token. Verifique de novo onde o escopo pode mudar e vincule assinaturas ao principal original.

**Confusão de callback e de correlação de resposta**
IDs de correlação previsíveis, reutilizados ou entre tenants permitem que uma resposta, webhook, cancelamento ou acknowledgement satisfaça a operação pendente de outro chamador. Vincule cada requisição pendente ao peer autenticado, ao tenant, à operação e ao ciclo de vida.

## Classes de ataque de isolamento de broker e fila (subagent_type: `general-purpose`)

**Lacunas de escopo de tópico, routing key e assinatura**
Um publicador ou assinante consegue selecionar o tópico, wildcard, consumer group, partição, fila de resposta ou rota de dead-letter de outro tenant. Verifique ACLs aplicadas pelo broker onde visíveis e a construção de namespace do lado da aplicação. Texto de tenant dentro de um payload não é isolamento.

**Vazamento por dead-letter, retry e diagnóstico**
Mensagens roteadas para filas de dead-letter, tópicos de erro, tracing ou visões de operador contêm segredos ou payloads de outros tenants acessíveis a um consumidor de menor confiança. Revise política e redação no caminho de falha, não só na entrega normal.

**Produtor não confiável tratado como plano de controle**
O corpo de uma mensagem consegue se declarar um evento de admin, callback de provedor, registro de replicação ou instrução de migração sem um produtor e um tipo de evento autenticados de forma independente. Verifique assinaturas e o vínculo de origem/conta/audiência antes do tratamento privilegiado.

## Classes de ataque de replay, ordenação e transação (subagent_type: `general-purpose`)

**Entrega duplicada e lacunas de idempotência**
Retries ou reentregas repetem um efeito colateral porque a deduplicação está ausente, ocorre depois da mutação, ou usa uma chave que colide entre tenants ou operações. Confirme o modelo de entrega do broker e o efeito colateral que não é naturalmente idempotente.

**Aceitação de mensagem fora de ordem e obsoleta**
Estado mais antigo, membership revogada, trabalho cancelado ou autorização anterior ao step-up chega depois de um estado mais novo e o sobrescreve. Revise verificações de sequência/versão, tombstones, mudanças de partição e fluxos de restore/replay.

**Defeitos de ordem entre acknowledgement e commit**
O acknowledgement ocorre antes do commit durável e perde trabalho relevante para segurança, ou o commit acontece antes de um acknowledgement não confiável e duplica uma mutação. Avalie o comportamento de transactional outbox/inbox e a recuperação de falhas.

**Transições parciais com múltiplos consumidores**
Vários consumidores implementam juntos uma transição de autorização ou de negócio, mas retries e falhas parciais deixam só um subconjunto com commit. Identifique os invariantes que devem se tornar duráveis atomicamente ou ser compensados com a autorização atual.

## Movimentos universais (aplicar a todos os acima)

- Desenhe produtor → broker/transporte → gateway → consumidor → armazenamento para cada família de mensagens. Em cada salto, registre o peer autenticado, os campos autoritativos de tenant/recurso, a validação e o efeito colateral.
- Alimente a mesma fixture pequena em toda versão de schema ou binding de linguagem do repositório. Teste mensagens duplicadas, ausentes, desconhecidas, de limite, reenviadas e reordenadas sem gerar carga.
- Compare as rotas normal, de retry, de dead-letter, de replay, de migração, de reflection, de stream e transcodificada pelo gateway. A política de segurança deve sobreviver a mudanças de transporte.

## Regras de validação (aplicar antes de reportar QUALQUER achado daqui)

1. Nomeie o produtor ou peer realista, a mensagem aceita, a identidade autenticada do canal, o principal/recurso afetado e a mutação ou vazamento não autorizado.
2. Para alegações de divergência, cite os dois parsers/consumidores e o valor decodificado divergente. Rejeição segura por qualquer um dos lados impede a confirmação.
3. Para alegações de replay/ordenação, estabeleça as garantias de entrega reais e reproduza a falha do invariante com um transporte local/em memória limitado.
4. Para autorização e isolamento, verifique todas as camadas de interceptor, ACL de broker, gateway e consumidor visíveis no código-fonte. Vínculos externos tornam o candidato `needs_validation`.
5. Devolva `confirmed` só com o ciclo de vida completo da mensagem e um resultado significativo observado. Devolva `needs_validation` com o fato exato de broker, identidade de serviço, rota ou entrega necessário.
