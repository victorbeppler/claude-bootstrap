# Procedimento de promoção de artefatos

Fonte única deste procedimento. O `SKILL.md`, a Fase 2 (`fases/2-caca.md`) e as Fases 3–6
(`fases/3-6-validacao-e-relatorio.md`) apontam para cá. **Copie o bloco abaixo literalmente** em
todo prompt de caçador e de verificador — sem resumir, sem reordenar.

```text
Procedimento de promoção de artefatos (somente código confiável do lado do orquestrador):
Apenas referência para você: o orquestrador executa estes passos; você nunca os executa.

Antes da execução, o orquestrador abre e retém descritores de diretório confiáveis e
não herdáveis para as raízes scratch/ e artifacts/ do agente, e registra uma allowlist
dos arquivos de artefato esperados (relativos ao scratch) com limites explícitos de
bytes por arquivo e acumulado. Nunca passe esses descritores ao agente nem ao sandbox.
Depois que o sandbox e todos os seus processos terminarem, código confiável do lado do
orquestrador promove cada arquivo da allowlist separadamente:

1. Valide o caminho relativo declarado: rejeite componentes absolutos, vazios, `.`,
   `..` ou que sejam symlink.
2. Percorra cada componente pai a partir do descritor retido da raiz scratch com
   operações relativas a diretório e sem seguir links; nunca reabra por caminho.
3. Abra a folha sem seguir links e em modo não bloqueante.
4. Confirme com `fstat` que é um arquivo regular, com contagem de links exatamente um
   e dentro dos limites de bytes registrados (por arquivo e acumulado).
5. Aplique esses limites de novo durante a leitura desse descritor.
6. Copie exatamente o tamanho verificado, repita o `fstat` e rejeite se a identidade,
   o tipo, a contagem de links ou o tamanho mudarem.
7. No destino, percorra cada componente pai a partir do descritor retido da raiz
   artifacts com operações relativas a diretório e sem seguir links; exija que cada
   componente existente seja um diretório real e crie de forma exclusiva qualquer
   diretório ausente antes de reabri-lo e verificá-lo sem seguir links.
8. Crie a folha de forma exclusiva sem seguir links, confirme que o destino aberto é
   um arquivo regular com contagem de links exatamente um e copie a partir do
   descritor de origem verificado, sem reabrir nenhum dos dois caminhos.
9. Em sistemas não POSIX, use APIs equivalentes e seguras contra corrida.
10. Nunca copie recursivamente nem use glob no scratch, nunca extraia arquivo compactado
    dentro de artifacts e nunca abra ou promova symlink, FIFO, socket, dispositivo,
    diretório, arquivo com hard link, arquivo que esteja mudando ou que exceda o limite.
11. Se alguma conferência estiver indisponível, não puder ser aplicada ou falhar,
    descarte a entrada do scratch; se ela for evidência decisiva, mantenha
    `needs_validation` com o bloqueio exato da promoção.
```
