# Legends of Aether — Regras obrigatórias para qualquer agente

Este arquivo deve ser lido **antes de qualquer alteração** no projeto. As regras abaixo são vinculantes e têm prioridade sobre conveniência técnica, aproximações, improvisos e refatorações não solicitadas.

## 1. Marcações visuais do usuário = geometria exata

Sempre que o usuário marcar um mapa, screenshot ou referência visual:

- ponto marcado = posição exata solicitada;
- linha marcada = limite exato solicitado;
- área pintada/hachurada = polígono exato de atuação;
- seta = direção/relacionamento exato indicado;
- nada deve ser colocado, removido ou alterado fora da marcação, salvo pedido explícito.

**PROIBIDO** tratar marcação como aproximação, inspiração, região genérica ou sugestão de composição.

Se a marcação precisar ser convertida de pixels da imagem para coordenadas do mundo:

1. identificar pontos de controle visíveis e estáveis no screenshot;
2. medir a marcação em pixels;
3. mapear esses pontos para coordenadas do mundo;
4. construir o polígono/posição real a partir dessa conversão;
5. testar cada elemento novo contra esse limite;
6. remover/rejeitar qualquer elemento fora da área marcada.

Se não houver dados suficientes para mapear com segurança, **não improvisar**. Medir novamente, inspecionar o projeto ou pedir a informação indispensável.

## 2. Auditoria de assets antes de implementar qualquer pedido visual

Antes de iniciar uma feature visual nova:

1. definir o que o conceito visual exige;
2. auditar os assets existentes;
3. decidir se eles são realmente adequados ao propósito e ao padrão artístico atual;
4. somente então implementar.

Um asset ser tecnicamente reutilizável **não significa** que seja artisticamente adequado.

Se os assets existentes não forem suficientes, **não montar uma versão improvisada com assets parecidos**. Primeiro criar, obter ou aprovar os assets corretos; depois integrar.

## 3. Base sempre no último estado aprovado

- Um round rejeitado visual ou funcionalmente não pode virar base do próximo trabalho.
- O próximo round deve partir do último estado aprovado pelo usuário, preservando tudo que já funciona.
- Alterações previamente aprovadas são consideradas fixas até o usuário pedir mudança.

## 4. Escopo fechado

- Alterar somente o que foi pedido.
- Não reposicionar, refatorar, substituir ou “melhorar” elementos fora do escopo.
- Não aproveitar um pedido local para mexer em sistemas adjacentes.
- Qualquer mudança colateral necessária deve ser mínima e explicitamente documentada.

## 5. Validação antes de declarar sucesso

Não usar termos como “garantido”, “definitivo”, “correto” ou “validado visualmente” sem evidência correspondente.

Antes de entregar um round:

- verificar arquivos alterados;
- verificar integridade do ZIP;
- executar testes disponíveis que sejam pertinentes;
- conferir regressões no escopo afetado;
- para mudanças visuais, comparar com a referência/marcação quando houver renderização disponível;
- se não houver renderização/browser, declarar exatamente o que foi validado e o que permanece sem confirmação visual.

## 6. Regra especial para mapas do Legends of Aether

Em mapas, a marcação do usuário é a **fonte de verdade espacial**. Nenhuma rotina procedural, spline, faixa, offset médio, linha reta, heurística de composição ou distribuição automática pode substituir o desenho feito pelo usuário.

Se a área marcada for irregular, a implementação deve respeitar essa irregularidade.

## 7. Entrega

Toda entrega de round deve informar:

- base utilizada;
- arquivos alterados/adicionados/removidos;
- testes realmente executados;
- limitações de validação, se houver;
- link do ZIP somente após confirmar que o arquivo existe e passa no teste de integridade.
