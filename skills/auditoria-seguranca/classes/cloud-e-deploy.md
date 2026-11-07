# Caça em cloud e deploy

#### Quando usar este arquivo

Recorra a este arquivo quando o repositório define identidade de cloud, infraestrutura, contêineres, Kubernetes, service mesh, funções serverless, edge workers, ingress, object storage, serviços gerenciados ou configuração específica por ambiente. Este domínio pergunta se os componentes em produção recebem a identidade, o isolamento, a alcançabilidade de rede, os segredos e a política pretendidos. O código-fonte muitas vezes expressa intenção, não fato ativo, então separe defeitos confirmados pelo código-fonte de necessidades de validação no deploy.

Use `supply-chain-e-release.md` para a confiança de build e promoção, `web-protocolo-e-auth.md` para a semântica de proxy HTTP e `isolamento-e-ciclo-de-dados.md` para o escopo de tenant em armazenamentos de dados.

## Disciplina central (incluir em todo prompt de agente deste domínio)

```
- Não infira uma exposição ativa a partir de um manifesto sozinho. Estabeleça qual ambiente o consome, quais defaults ou overlays o modificam e se o caminho no código-fonte está ativo.
- Mapeie a identidade de cada workload para operações e recursos específicos. Política ampla só é achado quando uma entrada de menor confiança consegue alcançar uma ação não autorizada.
- Ingress, proxies, service mesh, serviços de metadados e política de admissão são fronteiras reais, mas só conte um controle quando sua configuração e sua associação (attachment) estiverem visíveis.
- Referências a segredos não são divulgação de segredo. Exija um leitor de menor confiança, saída, artefato, caminho de log ou fallback inseguro.
- Use `confirmed` para configurações ativas dentro do repositório e validação local de renderização/política. Use `needs_validation` para política de conta, associação de rede, admissão em runtime, metadados hospedados ou drift que precisem de observação do dono.
```

## Classes de ataque de identidade de workload e IAM (subagent_type: `general-purpose`)

**Excesso de identidade de workload**
Uma identidade de workload, pod, função, edge worker ou nó consegue agir sobre tenants, contas, recursos ou APIs além do seu papel, e uma entrada não confiável de requisição ou job seleciona esse alvo. Revise condições de política de cloud, padrões de recurso, associação de service account, mapeamento de namespace e credenciais de fallback.

**Confusão de papel entre contas ou tenants**
Assunção de papel, external IDs, troca de token, federação de workload ou políticas de recurso aceitam claims de identidade não vinculadas à conta de origem, audience, repositório, namespace ou workload pretendidos. Estabeleça tanto a política de confiança quanto a claim controlada pelo chamador.

**Autorização da aplicação delegada a metadados de cloud**
Uma aplicação confia em headers de identidade, tags, labels, IDs de conta ou metadados de recurso fornecidos pelo chamador sem verificar que vieram do control plane da cloud ou de um proxy confiável. IAM de cloud e autorização da aplicação são checagens separadas.

## Classes de ataque de ingress, rede e control plane (subagent_type: `general-purpose`)

**Alcançabilidade inesperada de serviço ou plano de gerenciamento**
Um ingress, service, listener, security group, anotação de load balancer, mapeamento de porta ou bind de servidor expõe uma API de admin, debug, métricas, nó, control plane ou interna a uma rede de menor confiança. A ausência de controles de rede sozinha é `needs_validation`; uma rota pública controlada pelo repositório até um handler sensível pode ser `confirmed`.

**Bypass de identidade de proxy confiável e mesh**
Um backend aceita identidade encaminhada, subject mTLS ou metadados de autorização de peers fora do ingress/sidecar pretendido, ou uma porta alternativa e um caminho de health/legado contornam a mesh. Verifique a remoção de headers, a alcançabilidade dos peers e o comportamento fail-open quando o proxy está ausente.

**Alcançabilidade de metadados e serviços internos**
Uma URL, destino ou seleção de protocolo não confiável alcança metadados de instância/contêiner, sockets do control plane ou APIs internas com credenciais do workload. Rastreie o parsing de URL e o tratamento de redirect segundo `base.md`; aqui, estabeleça as fronteiras de rede no deploy, de versão do serviço de metadados e de identidade.

## Classes de ataque de contêineres e orquestração (subagent_type: `general-purpose`)

**Exposição de capacidade do host ou do control plane**
Um workload de menor confiança consegue selecionar modo privilegiado, capabilities, namespaces do host, host paths, montagens de dispositivo, sockets do runtime de contêiner ou tokens de service account que cruzam para a autoridade do nó/control plane. A simples ausência de seccomp ou de sistema de arquivos só de leitura é hardening, a menos que uma operação alcançável cruze essa fronteira.

**Inconsistência de caminho de admissão e política**
Uma rota de deploy aplica política de identidade de imagem, namespace, recurso, segredo ou privilégio enquanto outro controller, job, upgrade, restore ou caminho de compatibilidade não aplica. Confirme a rota alternativa e o objeto implantado resultante.

**Confusão de confiança em namespace e label**
Política de rede, admissão, segredo ou identidade de workload depende de labels, anotações, nomes ou namespaces que um principal menos confiável consegue definir. Compare quem controla os seletores com a autoridade que a correspondência concede.

## Classes de ataque de configuração e ciclo de vida de segredos (subagent_type: `general-purpose`)

**Drift de precedência de controles de segurança**
Valores de desenvolvimento, defaults de chart, variáveis de ambiente, flags de linha de comando, feature gates, injeção de sidecar ou overlays por região desativam autenticação, segurança de transporte, escopo de tenant ou política de auditoria num ambiente implantado. Renderize a configuração final de cada deploy mantido, não só o arquivo base.

**Exposição de segredo entre fronteiras de workload**
Segredos entram em logs, relatórios de crash, argumentos de processo, ambiente compartilhado, volumes amplos, saídas de build, service discovery ou APIs de leitura acessíveis a outro workload ou tenant. Verifique o tipo do segredo e a autoridade; um endpoint público ou um key ID não é credencial.

**Renovação de credencial e fallback em indisponibilidade**
Falha ao montar, renovar, rotacionar ou revogar uma credencial de workload faz credenciais obsoletas continuarem ativas ou faz uma aplicação aceitar um modo de identidade menos confiável. Revise o comportamento de inicialização, readiness, reconexão e clients em cache.

## Classes de ataque de armazenamento gerenciado, eventos e edge (subagent_type: `general-purpose`)

**Confusão de política de objeto e signed URL**
Política de bucket/contêiner, chaves de objeto, origins de CDN ou signed URLs não vinculam principal, operação, namespace de objeto, audience ou expiração. Revise as operações de listagem/versão e os caminhos de escrita, além das leituras.

**Confusão de identidade da origem de eventos**
Uma função ou worker confia em campos do corpo do evento como identidade da origem sem validar o envelope assinado pelo provedor, a assinatura/tópico, a conta, a região e o estado de replay. Compare os caminhos de push, pull, retentativa e dead-letter.

**Divergência de fronteira entre edge e runtime**
Um runtime edge ou serverless presume uma política de segredo, API, sistema de arquivos, isolamento ou tenant diferente da do runtime de origem, e o fallback para a origem muda a autoridade ou o comportamento de cache. Confirme qual configuração seleciona cada caminho.

## Movimentos universais (aplicar a todos os acima)

- Renderize todo ambiente mantido e monte uma matriz de porta externa, identidade de workload, peers de rede, segredos montados e recursos de cloud. Diferenças exigem explicação do dono ou da política.
- Siga uma requisição, objeto, label ou evento de menor confiança até a política de cloud. Mostre qual credencial de workload executa a operação final e qual condição deveria limitar o seu escopo.
- Compare os caminhos de deploy normal, migração, restore, manutenção de nó, failover e local/emulador. Revise o comportamento quando o serviço de mesh, admissão, identidade, segredo ou política está indisponível.

## Regras de validação (aplicar antes de reportar QUALQUER achado daqui)

1. Estabeleça o caminho ativo no código-fonte e o objeto de deploy efetivo; caso contrário, use `needs_validation` e declare qual manifesto renderizado ou associação observada pelo dono está faltando.
2. Nomeie o chamador/workload de menor confiança, a identidade de cloud ou de aplicação, o seletor controlável, o recurso afetado e a operação ou divulgação não autorizada.
3. Verifique os defaults do provedor e do orquestrador na versão fixada. Não presuma um IP público, um serviço de metadados alcançável, um firewall permissivo ou a ausência de associação de admissão.
4. A validação local pode renderizar templates, avaliar políticas, inspecionar namespaces de contêiner/usuário numa fixture isolada ou rodar um emulador com identidades fictícias. Não sonde endpoints ativos nem altere recursos de cloud compartilhados.
5. Devolva `confirmed` só com um rastro completo e ativo no código-fonte e um resultado concreto de fronteira. Devolva `needs_validation` com a política implantada, associação de identidade, overlay, rede ou observação de drift exatos necessários.
