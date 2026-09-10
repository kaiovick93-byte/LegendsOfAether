# Estrada Velha de Aether — padrão técnico de conectores v1

Este padrão é a fonte única para montagem modular da estrada. As medidas abaixo
existem em **pixels de mundo**, não em pixels do PNG. Os PNGs são publicados em
4× e entram em runtime com escala uniforme `0.25`.

![Guia técnico](../assets/images/environment/outskirts/old-road-v3/old_road_connector_technical_guide_v1.png)

| Regra | Medida |
| --- | ---: |
| Largura total da estrada | `96 px` |
| Faixa central útil/caminhável | `64 px` |
| Borda visual por lado | `16 px` |
| Trecho reto estável antes de uma boca | `32 px` |
| Zona limpa na borda da boca | `12 px` |
| Distância entre conectores do Straight Long | `192 px` |
| Distância entre conectores do Straight Short | `96 px` |
| Raio central da Curve | `128 px` |
| Tronco reto da Y antes de bifurcar | `48 px` |
| Abertura de cada braço da Y | `35°` |

## Contrato de encaixe

Cada boca ocupa exatamente `96 px`, com o eixo da estrada em seu centro. Os
últimos `32 px` de qualquer chegada/saída são retos e preservam a largura. Os
últimos `12 px` não possuem pedra grande, vegetação alta ou relevo que atravesse
a emenda. Assim, `Straight → Curve`, `Curve → Straight` e `Straight → Y` usam a
mesma interface geométrica, sem compensação por escala, squash ou deslocamento
manual.

## Runtime

Os módulos de estrada e o ground base são classificados como `ground`: ficam
abaixo de atores, não recebem colisão pelo retângulo do PNG e não participam da
oclusão dinâmica por pés. Apenas props altos futuros devem usar footprint e
oclusão próprios.
