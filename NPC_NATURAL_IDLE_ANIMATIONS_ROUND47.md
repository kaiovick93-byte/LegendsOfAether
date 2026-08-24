# Round 47 — Idles naturais dos NPCs

## Objetivo
Remover o comportamento artificial em que todos os NPCs se viravam automaticamente para o jogador ao se aproximar e substituir isso por uma cidade mais viva, onde cada personagem parece ocupado com sua própria rotina.

## Mudança principal
- NPCs fixos **não acompanham mais o jogador com o olhar/direção**.
- Aproximar-se agora controla apenas a UI de interação.
- Cada NPC mantém uma orientação natural adequada à função/localização.
- Todos recebem um movimento-base de respiração extremamente sutil.

## Idles por NPC

### Aldren Voss — Mercador
- respiração sutil;
- pequeno gesto de contar/manusear moedas.

### Borin Ferramão — Ferreiro
- respiração sutil;
- movimento próprio com martelo;
- pequenas faíscas ocasionais para reforçar a leitura de trabalho na forja.

### Elara Veyn — Curandeira
- respiração sutil;
- manipulação de pequenas ervas/energia herbal.

### Garrick Brenn — Taverneiro
- respiração sutil;
- gesto de limpar/manusear uma caneca com pano.

### Lysandra Vael — Erudita
- mantém um pequeno livro aberto;
- movimento suave de leitura;
- animação ocasional de virar página.

### Maelis Tessara — Artesã
- pequeno tecido em mãos;
- gesto repetido de costura/manuseio de linha.

### Mira Edevane — Anciã de Aether
- postura calma com respiração sutil;
- pequeno brilho ocasional associado ao cajado;
- orientação fixa voltada para o interior da cidade, sem seguir o jogador.

### Kael Dorn — Guarda do Portão Leste
- permanece orientado para o Portão Leste;
- ajuste discreto de postura/peso;
- pequeno brilho ocasional na arma/armadura.

### Bren Harrow — Guarda do Sul
- permanece orientado para o Portão Sul;
- ajuste discreto de postura/peso;
- pequeno brilho ocasional na arma/armadura.

### Tomas Belmon — Morador
- continua seguindo sua rota normalmente;
- não para apenas porque o jogador se aproximou;
- durante pausas da rota executa pequeno movimento de postura/respiração.

### Darian Kestrel — Viajante
- continua seguindo sua rota normalmente;
- não para apenas porque o jogador se aproximou;
- durante pausas da rota executa gesto de ajuste de equipamento/mochila.

## Conversa com NPCs ambulantes
Anteriormente, Tomas e Darian pausavam a rota assim que o jogador entrava na distância de interação.

No Round 47:
- proximidade não interrompe a caminhada;
- a rota só é pausada quando o jogador realmente abre o diálogo;
- ao fechar o diálogo, a caminhada é retomada automaticamente.

## Arquivos alterados
- `src/npc/Npc.ts`
- `src/npc/WanderingNpc.ts`
- `src/scenes/WorldScene.ts`

## Compatibilidade preservada
Não foram alterados:
- nomes dos NPCs;
- posições dos NPCs fixos;
- rotas principais de Tomas e Darian;
- colisões;
- diálogos;
- retratos;
- sistema de loja;
- quests;
- UI de interação;
- fauna/ambientação da cidade.

## Validação
- `tsc --noEmit`: aprovado sem erros.
- busca por `facePlayer`: resta apenas o método vazio de compatibilidade; nenhum NPC o executa automaticamente.
