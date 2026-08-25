# Round 46 — Polimento global da cidade

## Objetivo
Aplicar um **polimento visual global** em Cidade de Aether para reforçar a **coesão estética e artística** em todo o mapa, sem alterar a identidade central da cidade nem prejudicar circulação, colisões e leitura de gameplay.

## Direção artística aplicada
Foi reforçada uma linguagem visual unificada baseada em:
- **madeira quente** (placas, molduras, tapetes/soleiras visuais, pequenos caixotes);
- **pedra clara** (pequenos “aprons”/soleiras de pedra nas entradas);
- **vegetação contida** (floreiras e pequenos tufos de ervas);
- **tecidos pendentes discretos** (banners curtos em fachadas importantes);
- **desgaste leve de chão** (poeira/uso nas entradas e pontos de passagem);
- **profundidade suave** com sombras pequenas e detalhes não intrusivos.

## O que foi implementado

### 1) Fachadas principais padronizadas
As edificações centrais agora compartilham elementos visuais coerentes:
- mini **banners decorativos**;
- **soleiras/tapetes visuais** nas entradas;
- **floreiras** e/ou pequenos acentos laterais;
- leves **marcas de uso** no chão.

Edifícios contemplados:
- Loja do Mercador
- Ferraria
- Casa da Curandeira
- Taverna
- Casa Arcana / Erudita
- Oficina / Casa da Artesã
- Núcleo residencial (casas principais)

### 2) Entradas com leitura mais nobre
Os acessos mais importantes da cidade receberam leitura visual mais consistente:
- **Portão Sul** com tratamento visual mais integrado ao restante da cidade;
- **Portão Leste** com reforço decorativo sutil.

### 3) Coesão urbana nas ruas
Foram distribuídos pequenos refinamentos urbanos, como:
- tufos de vegetação baixa;
- poeira/desgaste leve em pontos estratégicos;
- pequenos acentos visuais com a mesma paleta do restante da cidade.

## Arquivo alterado
- `src/scenes/WorldScene.ts`

## Garantias do round
- **Sem novas interações**.
- **Sem bloqueios extras relevantes**.
- **Sem comprometer rotas, corredores ou acesso aos NPCs**.
- O foco foi **polimento visual e coesão artística global**.
