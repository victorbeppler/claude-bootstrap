# Caça em supply chain e release

#### Quando usar este arquivo

Recorra a este arquivo quando o alvo resolve dependências, faz build a partir de contribuições não confiáveis, roda CI, cria artefatos de release, assina ou promove builds, carrega plugins ou atualiza software em produção. Este domínio cobre as passagens de confiança desde o código-fonte e as dependências até o artefato que um usuário executa. Use `memoria-e-binario.md` para falhas dentro de um loader binário local e `cloud-e-deploy.md` para a autoridade do workload em runtime.

Divida alvos grandes em resolução de dependências, isolamento de CI, procedência de artefato, autorização de release e confiança em updater/plugin.

## Disciplina central (incluir em todo prompt de agente deste domínio)

```
- Uma dependência mutável ou com vulnerabilidade conhecida não é achado por si só. Mostre quem pode influenciar a resolução, qual build a consome e que fronteira de execução ou de release vem depois.
- Siga a integridade em toda passagem: identidade do código-fonte, entradas resolvidas, worker de build, identidade do artefato, resultado de teste, assinatura/atestação, promoção e consumidor da atualização.
- Configuração de CI é código de autorização. Estabeleça qual evento disparou um workflow, de quem é o código que roda, quais segredos e tokens existem e o que ele pode publicar ou alterar.
- Um checksum buscado no mesmo local não confiável que o artefato não estabelece integridade independente. Identifique a raiz confiável e o comportamento em caso de falha.
- Use `confirmed` para falhas de fluxo de controle dentro do repositório com validação local limitada. Use `needs_validation` para fatos de proteção de branch, runner hospedado, registry, serviço de assinatura ou promoção para produção que não são observáveis.
```

## Classes de ataque de dependências e entradas de build (subagent_type: `general-purpose`)

**Confusão de origem e namespace de dependência**
A configuração do resolver pode selecionar um namespace público/privado, registry de fallback, mirror, repositório ou URL de origem não pretendidos. Revise nomes de pacote, prioridade de origem, uso de lockfile e checksum, arquivos de build alternativos, resolução específica por plataforma e o comportamento da primeira instalação em comparação com a atualização.

**Entradas de build mutáveis e não vinculadas**
Builds consomem branches, tags, submódulos não verificados, ferramentas baixadas, assets gerados, includes remotos, actions de CI flutuantes ou tags de contêiner cujo conteúdo pode mudar sem revisão do código-fonte. Exija um escritor de menor confiança e um caminho até a saída de build confiável; reprodutibilidade por si só não prova autenticidade.

**Lacunas de procedência de código gerado**
Schemas, arquivos vendorizados, clients gerados, localização, exemplos de documentação ou blobs binários produzem conteúdo executável ou distribuído sem a mesma revisão e o mesmo filtro de integridade do código-fonte. Compare a regeneração local com a saída commitada e verifique quem controla a entrada e o gerador.

**Inclusão pelo contexto de build**
Segredos, configuração local, metadados do repositório, fixtures de teste ou artefatos de desenvolvedor entram num pacote ou imagem porque o contexto de build e as regras de ignore excedem as entradas de release pretendidas. Confirme que o artefato resultante expõe uma credencial real, dados privados ou configuração privilegiada.

## Classes de ataque de CI e automação (subagent_type: `general-purpose`)

**Código não confiável em workflow privilegiado**
Um pull request, comentário de issue, fork, atualização de dependência ou evento externo roda código controlado pelo contribuidor com segredos protegidos, tokens de escrita, autoridade de deploy ou um runner confiável. Compare tipo de gatilho, ref do checkout, filtro de aprovação, proteção de ambiente e estreitamento de permissões. Não presuma defaults do host do repositório que não estão no código-fonte.

**Confusão de comando e expressão de workflow**
Nomes de branch, mensagens de commit, campos de issue, nomes de artefato, valores de matriz ou saídas geradas controlados pelo atacante entram em comandos shell, expressões de template, caminhos ou entradas privilegiadas de workflow sem validação canônica.

**Mistura de confiança em cache, artefato e workspace**
Um job de menor confiança consegue popular um cache, artefato, workspace compartilhado ou saída que um job de maior confiança depois restaura e executa ou publica. Revise chaves e namespaces de cache, identidade do produtor do artefato, vinculação por digest, retenção e se a promoção volta a resolver por nome mutável.

**Excesso de identidade de automação**
Jobs de CI recebem permissões além da operação, do repositório, do ambiente ou da duração necessários, e entradas não confiáveis do job conseguem selecionar o recurso afetado. A falta de menor privilégio sozinha é hardening; exija uma ação privilegiada alcançável.

## Classes de ataque de release e atualização (subagent_type: `general-purpose`)

**Substituição entre build e promoção**
Testes, revisão, assinatura e publicação referem-se a tags, nomes de arquivo, canais ou IDs de artefato mutáveis, em vez do mesmo digest imutável. Verifique toda cópia, reempacotamento, merge de arquiteturas e etapa de procedência entre o build e o release.

**Lacunas de autorização de release e política de assinatura**
Um release ou assinatura é aceito vindo do workflow, repositório, branch, ambiente, papel de chave ou threshold errado. Revise as claims de identidade dentro das atestações e verifique se o consumidor as valida, não só uma assinatura válida. Rotação, expiração e revogação devem falhar fechadas onde a política exige.

**Confusão de metadados de atualização e rollback**
Um updater autentica os bytes do payload, mas não a versão, o produto, a plataforma, o canal, o caminho de destino, a expiração ou o estado de rollback, ou aceita metadados e payload de transações autorizadas diferentes. Verifique a instalação atômica e o comportamento de recuperação. Uma chamada de API de assinatura sem vinculação de política está incompleta.

**Expansão de confiança de plugin e extensão**
Um pacote de extensão ganha autoridade no host além do escopo declarado, um publicador de menor confiança consegue substituir a identidade de outro publicador, ou hooks de instalação/atualização rodam antes das checagens de autenticidade e capacidade. Instalação pretendida de plugins arbitrários do mesmo usuário não é fronteira de privilégio.

## Movimentos universais (aplicar a todos os acima)

- Volte a partir de um digest publicado ou de uma atualização instalada até toda origem, entrada gerada, credencial, worker, cache, resultado de teste e decisão de autorização.
- Compare lado a lado os eventos de workflow não confiáveis e os protegidos. Marque cada canal persistido que cruza entre eles e exija uma identidade imutável mais confiança no produtor.
- Revise os caminhos de chave revogada, download com falha, atestação ausente, release parcial por plataforma, rollback e indisponibilidade do registry. A política de falha faz parte da integridade do release.

## Regras de validação (aplicar antes de reportar QUALQUER achado daqui)

1. Nomeie o ator de menor confiança, a origem/cache/artefato/metadado controlável, o job confiável ou updater que consome e a publicação não autorizada, inclusão de código, divulgação de segredo ou execução privilegiada resultante.
2. Prove a identidade do artefato através da passagem quebrada. Um nome mutável diferente ou um digest não vinculado deve chegar a um consumidor real.
3. Verifique os defaults embutidos do gerenciador de pacotes, do host do repositório, do registry e de assinatura para a versão fixada. Controles hospedados desconhecidos exigem `needs_validation`.
4. Mantenha a validação local limitada: use um repositório fixture inofensivo, um marcador de credencial fictício, registry/config local e um namespace de artefato fora de produção. Não publique nem altere um release real.
5. Devolva `confirmed` só com uma passagem completa visível no código-fonte e resultado relevante. Devolva `needs_validation` com o fato preciso de branch, runner, registry, assinatura ou deploy que um dono deve observar.
