# Caça em segurança de memória, binários e kernel

#### Quando usar este arquivo

Recorra a este arquivo quando o alvo processa bytes não confiáveis em um contexto sem segurança de memória ou privilegiado: C/C++/Objective-C, Rust `unsafe`, FFI, módulos e drivers de kernel, parsers e decodificadores, daemons de rede, firmware, carregadores de binários, runtimes de linguagem e JITs. Use `protocolos-rpc-e-mensageria.md` para autorização de protocolo e lógica de máquina de estados, e este arquivo para integridade de processo, segurança de memória, fronteiras de ABI e comportamento do carregador.

Escolha as classes relevantes a partir da Fase 1 e divida alvos grandes por parser, alocador/tempo de vida, FFI, concorrência, carregador, runtime ou interface privilegiada.

## Disciplina central (incluir em todo prompt de agente deste domínio)

```
- Re-derive todo limite e todo tempo de vida a partir das entradas controladas pelo atacante e de todos os chamadores. Valide contra o pior caso aceito, não contra um vetor de teste típico.
- Um panic, um achado de sanitizer ou um crash só prova um defeito quando uma entrada não confiável realista o alcança. Não infira corrupção de memória, execução de código ou impacto de disponibilidade compartilhada só a partir de um rótulo.
- Valide em um harness local com sanitizers, testes de concorrência determinísticos, alvos de fuzz existentes e classificação de falha assistida por depurador. Pare depois de provar o invariante violado e o impacto observável; não desenvolva técnicas pós-corrupção.
- Assembly, código JIT, alocadores customizados, acessos intra-objeto e bibliotecas externas podem escapar da cobertura do sanitizer. Identifique quais instruções relevantes estão instrumentadas.
- Classifique como `confirmed` só depois que a evidência no código-fonte e uma validação local limitada estabelecerem o defeito e o efeito. Use `needs_validation` quando fatos de ABI, alocador, arquitetura, feature, deploy ou alcançabilidade continuarem desconhecidos.
```

## Classes de ataque de limites, inteiros e representação (subagent_type: `general-purpose`)

**Leitura ou escrita fora dos limites**
Um comprimento, offset, índice ou terminador chega a um buffer fixo ou alocado sem um limite correto. Recalcule o espaço disponível depois de prefixos, alinhamento, padding e terminadores. Verifique a capacidade da origem e do destino, e se uma entrada curta é lida antes que seu comprimento declarado seja considerado confiável.

**Overflow, underflow, truncamento e sinal de inteiros**
Revise a aritmética controlada pelo atacante antes de operações de alocação, cópia, laço, indexação e ponteiro. Padrões de alto acerto incluem `a - b` com `b > a`, `count * element_size`, somas perto do máximo do tipo, valores negativos convertidos para unsigned, comprimentos de 64 bits estreitados para campos de 32 bits, e valores sentinela como `-1` virando um tamanho grande. Confirme qual representação verificada é usada depois.

**Confusão de unidade e de profundidade de ponteiro**
O código mistura bytes, elementos, unidades de código, páginas, palavras, unidades do wire ou tamanhos de elemento de ponteiros aninhados. Compare a unidade no parse, na validação, na alocação, na fronteira da API e na cópia. Uma verificação de limites que usa a mesma unidade errada da alocação continua errada.

**Dados não inicializados ou parcialmente inicializados**
Um buffer, padding, campo de struct ou capacidade de vetor é retornado, comparado, hasheado, serializado ou passado através de uma fronteira de confiança antes da inicialização. Exija um consumidor observável e um comprimento de saída realista; alocação na pilha, por si só, não é vazamento.

## Classes de ataque de tempo de vida, tipo e concorrência (subagent_type: `general-purpose`)

**Use-after-free, visão obsoleta e double free**
Donos são liberados enquanto callbacks, filas de espera, timers, iteradores, slices emprestados ou ponteiros crus em cache ainda podem usá-los. Revise todo caminho de erro, cancelamento, fechamento e realloc. Para âncoras de notificação embutidas, todo caminho de liberação deve drenar ou desanexar todos os observadores.

**Confusão de tipo e downcast inválido**
Uma tag, vtable, discriminador de union, tipo de objeto ou handle externo é verificado de forma diferente da representação lida depois. Procure dynamic casts não verificados, tags obsoletas depois de reuso e tipos serializados cujo elemento validado difere do elemento consumido. Confirme localmente uma leitura ou escrita de tipo errado sem estender o teste além do invariante violado.

**Corridas de contagem de referência e de posse**
Retain/release não atômico, uma verificação seguida de um uso sem lock, ou posse inconsistente entre threads pode liberar ou mutar um objeto durante o acesso. Compare os caminhos rápido, de erro, de desligamento e de compatibilidade quanto às mesmas regras de lock e de posse.

**Corridas de estado compartilhado e TOCTOU**
Streams de parser concorrentes, caches globais, inicialização preguiçosa, handlers de sinal e teardown de recursos podem invalidar limites, política ou ponteiros estabelecidos antes. Verifique a corrida com um escalonamento local repetível, uma barreira ou um thread sanitizer; um entrelaçamento hipotético sem transição de estado relevante para segurança continua `needs_validation`.

**Ordem de lock, deadlock e inanição**
Operações alcançáveis externamente adquirem locks em ordem inconsistente ou os mantêm através de callbacks e I/O bloqueante. Reporte como disponibilidade só quando uma entrada limitada puder parar o progresso compartilhado; caso contrário, registre como defeito de concorrência a corrigir.

## Classes de ataque de FFI e ABI (subagent_type: `general-purpose`)

**Contrato divergente de ponteiro, comprimento e posse**
Chamador e chamado discordam sobre quem aloca, libera, fixa ou muta um buffer, por quanto tempo um ponteiro continua válido, ou se um comprimento é em bytes ou em elementos. Rastreie os dois lados de todo `extern`, binding CGo/JNI/Python/nativo e wrapper gerado. Verifique null, comprimento zero, aliasing e retenção de callback.

**Divergência de layout, alinhamento e enum**
Código externo recebe uma struct, bitfield, registro packed, assinatura de callback, largura de inteiro, enum ou convenção de chamada que difere por arquitetura ou flag de build. Verifique `repr`, packing, alinhamento, endianness e tipos específicos de ABI. Uma divergência de declaração dentro do repositório pode ser confirmada localmente; uma implementação externa opaca exige `needs_validation`.

**Violações de unwind, exceção e afinidade de thread**
Exceções ou panics atravessam uma ABI que proíbe unwinding, callbacks rodam depois do teardown, ou APIs que exigem uma única thread de runtime são invocadas em outra. Revise a conversão de erros e o cancelamento. Confirme se o processo aborta ou se o estado é corrompido antes de atribuir impacto.

## Classes de ataque de carregamento de binários e runtime (subagent_type: `general-purpose`)

**Confiança na ordem de busca de bibliotecas, plugins e executáveis**
Um processo privilegiado carrega uma biblioteca, plugin, imagem de runtime ou helper a partir de um caminho gravável por um principal menos confiável, ou resolve um nome sem caminho através de um diretório de trabalho ou ambiente influenciável pelo atacante. Compare a posse pretendida da instalação com cada caminho de busca de fallback e de compatibilidade. Um usuário carregando o próprio plugin no próprio processo não é violação de fronteira.

**Identidade ou assinatura de artefato não vinculada**
Um carregador verifica um arquivo ou registro de metadados, mas mapeia uma imagem diferente porque resolução de caminho, substituição de arquivo, fatias de arquitetura ou recursos embutidos não estão vinculados à verificação. Autenticidade do canal de fornecimento pertence a `supply-chain-e-release.md`; esta classe cobre a lacuna local entre verificação e mapeamento.

**Metadados de binário e relocações malformados**
Offsets, contagens, seções, relocações, símbolos, bytecode ou metadados de debug são tratados como confiáveis antes das verificações de intervalo, sobreposição e representação. Teste parsers com fixtures locais limitadas e sanitizers. Separe corrupção de memória de um arquivo malformado rejeitado com segurança.

**Consistência de JIT e código gerado**
Validador, interpretador, otimizador e código gerado discordam sobre tipos, limites, efeitos colaterais ou tempo de vida. Compare os caminhos otimizado e não otimizado usando a mesma entrada local. Confirme um efeito na integridade do processo; variação de saída que permanece dentro da semântica da linguagem não é achado.

**Segurança de descarga, recarga e teardown**
Ponteiros de função vivos, callbacks, threads de trabalho ou visões de dados sobrevivem à descarga do módulo ou ao reset do runtime. Revise o desligamento e a limpeza de carregamento com falha com o mesmo rigor da inicialização.

## Classes de ataque de kernel e interface privilegiada (subagent_type: `general-purpose`)

**Limites de cópia de usuário e leituras repetidas**
Uma syscall, ioctl, driver ou parser de kernel deriva um fato confiável da memória de usuário e depois lê de novo o mesmo endereço mutável. Copie a requisição inteira uma vez ou revalide a cópia posterior. Audite também as verificações de tamanho, direção e acesso em cada primitiva de cópia de usuário.

**Ciclo de vida de objeto privilegiado e consistência de dispatch**
Objetos alcançáveis externamente têm retain/release desbalanceado, teardown sem drenar observadores, índices de seletor/tabela não verificados, ou caminhos de compatibilidade duplicados que omitem uma guarda. Compare cada caminho de dispatch e de liberação lado a lado.

**Interfaces poderosas sub-autorizadas**
Um nó de dispositivo, socket de administração, helper ou API de gerenciamento valida a forma, mas não a autoridade do chamador sobre o recurso. Estabeleça a posse e a alcançabilidade reais da interface; permissões ou política de sandbox fora do repositório tornam isto `needs_validation`.

## Movimentos universais (aplicar a todos os acima)

- Audite correções e caminhos duplicados em busca da mesma forma de origem até sink. Uma verificação em um chamador, arquitetura, papel de protocolo, feature flag ou caminho de compatibilidade não protege os irmãos.
- Monte uma tabela para todo parser ou fronteira de FFI: comprimento/tipo aceito, representação verificada, dono da alocação, consumidor, thread e teardown. A maioria dos achados nativos é uma divergência nessa tabela.
- Use corpora existentes e fixtures de limite pequenas geradas localmente. Salve a saída exata do sanitizer/runtime e a propriedade da entrada que a dispara; evite consumo grande de recursos e qualquer alvo vivo.

## Regras de validação (aplicar antes de reportar QUALQUER achado daqui)

1. Estabeleça uma entrada não confiável realista e a operação exata que viola um invariante de limites, tipo, tempo de vida, ABI, concorrência, carregador ou autoridade.
2. Classifique o efeito observável: leitura inválida, escrita inválida, alias obsoleto, objeto errado, saída não inicializada, carregamento de imagem não autorizado, deadlock ou término seguro do processo. Não alegue um efeito mais forte do que o observado.
3. Rode o harness local, teste existente, sanitizer ou fuzzer mais restrito necessário para reproduzir o efeito. Verifique a cobertura do sanitizer sobre a operação que falha e registre as condições de arquitetura/build.
4. Para concorrência, use um escalonamento determinístico ou um trace de sanitizer. Para carregamento de binários, prove que a identidade verificada difere da identidade mapeada e nomeie o escritor de menor confiança.
5. Devolva achados `confirmed` só com a entrada exata, o trace no código-fonte e o resultado observado. Devolva `needs_validation` para um fato específico não resolvido de alcançabilidade, ABI, build, deploy ou runtime, e declare a verificação limitada necessária.
