# Round 49 — Auditoria de colisões e circulação dos Arredores

## Objetivo
Refinar colisões e circulação do mapa expandido dos Arredores da Cidade, levando em conta o corpo físico do jogador (`58x58 px`) e garantindo caminhos reais entre os principais pontos de interesse.

## Portões da Cidade
- **Portão Sul**: continua funcionando como saída para os Arredores e é a rota visual mais natural para a Fazenda.
- **Portão Leste**: continua como segunda saída oficial para os Arredores, preservando a estrutura da Cidade de Aether.

## Correções realizadas

### 1. Estrada ao redor do Lago do Salgueiro
No Round 48, a trilha principal passava visualmente pela área do lago.

No Round 49:
- a rota foi desviada para **contornar o lago pela parte sul**;
- foi criado um pequeno acesso secundário até a margem para exploração/contemplação;
- os colliders do lago foram refinados para impedir que o jogador atravesse o núcleo da água.

### 2. Riacho e pontes
- o núcleo do riacho agora possui colisão;
- foram preservadas duas travessias oficiais:
  - travessia do eixo que sai do **Portão Leste**;
  - travessia do eixo que vem do **Portão Sul**;
- ambas receberam leitura visual de ponte.

### 3. Curral e chiqueiro
Os grandes colliders internos do Round 48 foram removidos.

Agora a colisão acompanha as **bordas das cercas**, com entradas reais:
- curral das vacas: abertura frontal de aproximadamente **96 px**;
- chiqueiro: abertura frontal de aproximadamente **90 px**.

Isso permite entrar nos cercados sem atravessar visualmente as cercas.

### 4. Fazenda
- carroça recebeu collider compacto;
- cavalo permanece com collider pequeno;
- casa, galpão e galinheiro continuam sólidos;
- trabalhadores rurais mantêm colliders pequenos sem criar gargalos.

### 5. Caverna
- acesso ao prompt continua livre;
- foi criado um bloqueio discreto mais ao fundo da entrada para impedir que o personagem atravesse a arte da caverna;
- o comando **F - Entrar** foi corrigido para funcionar antes do comando genérico de conversa;
- a caverna continua bloqueada narrativamente, exibindo apenas a mensagem da futura missão.

### 6. Portal da Floresta
- as árvores laterais do portal passaram a ter colisões compactas;
- o corredor central do portal permanece livre;
- o retorno da `GreenWoodsScene` foi atualizado da antiga posição (`2420,380`) para a nova área do portal (`3780,650`), evitando reaparecimento em local incorreto.

## Auditoria de acessibilidade
Foi realizada uma verificação geométrica considerando uma margem equivalente à metade do corpo do jogador.

A partir do **Portão Sul** e do **Portão Leste**, todos os seguintes destinos permaneceram alcançáveis:
- Fazenda
- interior do curral
- interior do chiqueiro
- margem do Lago do Salgueiro
- Totens Musgosos
- Ruínas Antigas
- Boca da Caverna
- Portal da Floresta

## Arquivos alterados
- `src/scenes/WorldScene.ts`
- `src/scenes/GreenWoodsScene.ts`

## Validação
- `npx tsc --noEmit`: sem erros.
