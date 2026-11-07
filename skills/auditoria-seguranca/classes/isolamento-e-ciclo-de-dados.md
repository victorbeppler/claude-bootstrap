# Caça em isolamento e ciclo de vida de dados

#### Quando usar este arquivo

Recorra a este arquivo quando o alvo armazena dados multi-tenant ou com controle de acesso, deriva cópias de busca/índice/cache/analytics, emite links de objeto, exporta ou restaura registros, migra schemas, ou promete comportamento de exclusão, revogação e retenção. Este domínio segue um item de dado através de toda cópia e transição de estado. Use `base.md` para controle de acesso no nível de endpoint e `cloud-e-deploy.md` para política de armazenamento no nível do provedor.

Divida alvos grandes por armazenamento primário, cache/busca, armazenamento de objetos/blobs, analytics/logging, exportação/backup, exclusão/revogação e migração.

## Disciplina central (incluir em todo prompt de agente deste domínio)

```
- Um campo de tenant ou de dono em um registro não é isolamento. Encontre a consulta, chave, caminho, política ou controle em nível de linha que o aplica em cada caminho de leitura e escrita.
- Rastreie as cópias derivadas. Dados primários sanitizados podem se tornar inseguros em busca, cache, analytics, exportação, previews, logs, réplicas e backups com regras diferentes de ACL e retenção.
- Exclusão e revogação são contratos de ciclo de vida. Verifique as cópias atuais, históricas, em cache, indexadas, exportadas, restauradas e enfileiradas dentro da fronteira declarada pelo produto.
- Preferência de privacidade ou de retenção não é automaticamente uma vulnerabilidade de segurança. Exija uma fronteira explícita de acesso a dados ou uma garantia de exclusão/revogação e um leitor ou operação posterior não autorizado.
- Use `confirmed` para linhagem completa visível no código-fonte e testes limitados com tenants fictícios. Use `needs_validation` quando política de armazenamento externo, retenção, comportamento de CDN, atraso de réplica ou acesso a backup não estão disponíveis.
```

## Classes de ataque de isolamento de tenant e objeto (subagent_type: `general-purpose`)

**Aplicação ausente de tenant ou dono**
Uma consulta de leitura, atualização, exclusão, listagem, contagem ou em massa identifica um objeto sem vinculá-lo ao tenant/dono autenticado, ou confia em campos do corpo para fornecer essa identidade. Compare os caminhos de busca direta, relacionamento aninhado, background, admin, importação e legado.

**Colisão de chave composta e namespace**
Chaves de cache, caminhos de objeto, unicidade no banco, IDs de documento de busca, arquivos temporários ou chaves de deduplicação omitem o tenant ou o ambiente. Dois principais conseguem sobrescrever ou recuperar a mesma chave lógica, mesmo que os registros da aplicação tenham donos separados.

**Divergência entre política e consulta**
Política em nível de linha, scopes padrão do ORM, filtros de autorização e clientes crus/de bypass aplicam predicados diferentes. Verifique joins, agregações, aliases, views, transações, clientes `unscoped` ou de serviço, e caminhos de erro em que o contexto está ausente.

**Alcance excessivo de blob e referência assinada**
Chaves de objeto, IDs de anexo, IDs de versão, links compartilhados ou URLs assinadas permitem operações ou namespaces além do acesso do principal emissor, ou continuam válidos depois que a ACL subjacente muda. Vincule operação, objeto/versão exato, audiência, expiração e tenant.

## Classes de ataque de dados derivados e vazamento (subagent_type: `general-purpose`)

**Deriva de ACL em busca, cache e índice**
A ACL ou o ciclo de vida de um registro primário muda sem invalidar uma cópia pesquisável, em cache, embedding, thumbnail, RSS, preview ou de índice. Valide a filtragem no momento da recuperação, além da ingestão e da invalidação do documento.

**Analytics, logs, traces e diagnósticos como leitores alternativos**
Conteúdo privado ou credenciais são emitidos para sistemas com acesso mais amplo, retenção mais longa ou mistura de tenants. Confirme a classe do dado e um leitor realista; nomes de campos, identificadores públicos e conteúdo exclusivo de operador sob a política pretendida não bastam.

**Oráculos de enumeração e agregação**
Contagens, filtros, ordenação, erros, constraints de unicidade, tempos, comportamento de notificação ou verificações de existência revelam o estado de um objeto ou conta protegido. Exija um predicado confidencial concreto e uma distinção observável, não variação genérica de resposta.

## Classes de ataque de exportação, backup, restore e migração (subagent_type: `general-purpose`)

**Expansão de escopo em exportação e backup**
Uma exportação, snapshot, pacote de portabilidade, relatório ou backup inclui outros tenants, campos de objeto inacessíveis, dados com soft delete, valores secretos ou histórico acima do acesso do requisitante. Verifique a autorização por item depois da seleção e a autorização para baixar o artefato final.

**Expansão de autoridade em importação e restore**
Restore/importação contorna regras de dono, schema, ACL, unicidade ou validação, sobrescreve recursos existentes ou recria registros em um tenant em que o requisitante não pode escrever. Valide o conteúdo do arquivo compactado como não confiável e autorize a operação resultante em vez de confiar na procedência anterior.

**Confusão de padrão e de posse em migração**
Registros antigos não têm campos de tenant/ACL/ciclo de vida, IDs incompatíveis colidem, ou um rollout parcial faz leitores novos e antigos aplicarem padrões diferentes. Revise os caminhos de backfill, dual-read/write, compatibilidade, rollback e migração retomada.

**Deriva de fronteira em backup e replicação**
Chaves de criptografia, contas de armazenamento, réplicas entre regiões, ambientes de restauração ou snapshots de suporte têm escopo de identidade ou de tenant mais amplo que os dados primários. O código-fonte só consegue confirmar a política que está no repositório; acesso hospedado e retenção exigem `needs_validation`.

## Classes de ataque de exclusão, revogação e ciclo de vida (subagent_type: `general-purpose`)

**Bypass de soft delete e tombstone**
Busca direta, pesquisa, travessia de relação, link de objeto, processador em background ou restore ignora o predicado de ciclo de vida e retorna ou age sobre um registro excluído/revogado. Verifique se identificadores com soft delete podem ser registrados de novo antes que todas as referências tenham desaparecido.

**Autorização obsoleta e uso de cópia derivada**
Remoção de membership, atualização de ACL, retirada de consentimento, revogação de segredo ou rebaixamento de papel não invalida sessões, caches, assinaturas, jobs ou dados materializados que continuam autorizando operações futuras.

**Estouro de retenção e de trabalho enfileirado**
A exclusão termina no armazenamento primário enquanto processadores enfileirados, retries, exportações, analytics ou artefatos gerados recriam ou retêm os dados além da fronteira prometida. Encontre a exclusão idempotente e a propagação de tombstones.

**Restore reintroduz estado inválido**
Backup, undo, undelete ou recuperação de réplica restaura dados, credenciais, memberships ou permissões que a política atual não permite mais. Reautorize o estado restaurado e reaplique as mudanças de ciclo de vida feitas depois do snapshot.

## Movimentos universais (aplicar a todos os acima)

- Escolha um registro protegido e desenhe os caminhos de escrita primária, consulta, cache, índice, evento, exportação, backup, exclusão e restore. Marque o principal e o tenant em cada aresta.
- Compare dois tenants fictícios através dos mesmos métodos de serviço locais e repita depois de mudança de ACL, exclusão, troca de conta e restore. Não use dados reais de usuários.
- Comece pelos clientes de bypass, jobs em background, migrações, unicidade global e chaves de cache. Esses caminhos costumam omitir a identidade do escopo da requisição que os endpoints interativos carregam.

## Regras de validação (aplicar antes de reportar QUALQUER achado daqui)

1. Nomeie o atacante ou principal de menor confiança, o dado/estado protegido, o dono/tenant afetado, a cópia ou operação alternativa e o vazamento ou mutação não autorizado.
2. Cite tanto a política pretendida da fonte da verdade quanto o caminho que a omite ou diverge dela. Confirme que outra camada não aplica a mesma condição de tenant/ciclo de vida.
3. Use tenants fictícios locais e fixtures não sensíveis para provar acesso entre escopos ou comportamento de ciclo de vida obsoleto. Pare no registro ou operação mínimo observável.
4. Se for necessária política externa de cache, armazenamento de objetos, réplicas, analytics, backup ou retenção, classifique como `needs_validation` e declare a verificação a ser observada pelo responsável.
5. Devolva `confirmed` só com linhagem completa e impacto concreto na fronteira. Devolva `needs_validation` com o fato exato não resolvido de armazenamento, ACL, invalidação, retenção ou restore.
