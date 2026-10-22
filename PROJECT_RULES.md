# Legends of Aether — Regras consolidadas do projeto

## Princípio central

**Não substituir a intenção exata do usuário por uma interpretação conveniente.**

### Marcações em screenshots e mapas
As marcações do usuário são especificações espaciais exatas. Uma área marcada define o limite real do trabalho. Uma linha define o limite real. Um ponto define a posição real. Não são referências aproximadas.

### Mudanças visuais
Antes de implementar, verificar se os assets disponíveis conseguem atingir o conceito e o padrão visual solicitado. Quando não conseguem, parar a implementação e tratar a lacuna de assets primeiro. Não improvisar com assets inadequados apenas para produzir uma entrega.

### Continuidade
Preservar tudo que já foi aprovado. Um round rejeitado não deve contaminar o próximo. Sempre partir do último estado aprovado.

### Escopo
Mudanças devem ser localizadas. Nenhum sistema, mapa, asset, posição, trigger, UI ou comportamento fora do pedido deve mudar sem necessidade explícita.

### Evidência
Dizer o que foi realmente testado. Não transformar inferência em confirmação visual.

## Protocolo obrigatório para pedidos com marcação visual

1. Abrir a imagem de referência.
2. Identificar a marcação exata.
3. Identificar os pontos de controle do mapa presentes na imagem.
4. Converter a marcação para coordenadas do mundo.
5. Registrar o limite obtido no código/dados do round.
6. Manter toda alteração dentro desse limite.
7. Fazer checagem de inclusão: cada novo objeto deve pertencer à área permitida.
8. Fazer checagem negativa: nenhuma alteração pode aparecer fora da área.
9. Comparar o resultado com a imagem marcada antes da entrega, se houver renderização disponível.
10. Se não for possível validar visualmente, declarar isso em vez de afirmar que ficou certo.

## Protocolo obrigatório para nova ambientação

1. Definir o vocabulário visual necessário (ex.: árvores ancestrais, copa densa, raízes, transição de solo etc.).
2. Inventariar os assets existentes.
3. Classificar cada asset como adequado, complementar ou inadequado.
4. Se faltar o conjunto principal, criar/obter assets próprios antes de compor a cena.
5. Somente após aprovação/adequação dos assets, implementar colisão, profundidade e composição.
