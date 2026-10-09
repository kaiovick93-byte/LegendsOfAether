// @ts-nocheck

/**
 * v0.3.1 Round 12 — ETAPA 1
 *
 * Fundação visual da futura extensão da Floresta Ancestral.
 * Esta etapa deliberadamente NÃO adiciona árvores, estrada, teias, props,
 * colisão, interação ou expansão de bounds. Ela só cobre o vazio preto que
 * aparece fora da borda u=0, entre o início da Estrada Velha e o fim atual da
 * Floresta Ancestral.
 *
 * Fonte de verdade espacial:
 * - u=0 é a borda lógica real do mapa.
 * - v=79.019 é o início do trecho junto à entrada da Estrada Velha.
 * - v=48.969 é o fim atual da Floresta Ancestral.
 *
 * A extensão segue para u negativo, portanto fica exclusivamente FORA da área
 * jogável. O valor -56 é somente profundidade de cobertura para garantir que a
 * câmera nunca revele preto à esquerda/atrás neste trecho; ele não muda os
 * limites lógicos/físicos do mapa.
 */

export const OLD_ROAD_ANCIENT_FOREST_VISUAL_EXTENSION_BOUNDS=Object.freeze({
  minU:-56,
  maxU:0,
  minV:48.969,
  maxV:79.019
});

const DEBUG_FILL_COLOR=0x31453f;
const DEBUG_EDGE_COLOR=0x6e9185;

export class OldRoadAncientForestVisualExtension{
  constructor(territory){
    this.territory=territory;
    this.scene=territory.scene;
    this.graphics=null;
    this.build();
  }

  build(){
    const b=OLD_ROAD_ANCIENT_FOREST_VISUAL_EXTENSION_BOUNDS;

    // Ordem dos vértices no plano lógico: fim da floresta -> borda do mapa ->
    // início da estrada -> extensão externa. A projeção real do projeto é usada
    // diretamente; nenhuma posição é estimada em pixels de screenshot.
    const logicalPoints=[
      {u:b.minU,v:b.minV},
      {u:b.maxU,v:b.minV},
      {u:b.maxU,v:b.maxV},
      {u:b.minU,v:b.maxV}
    ];
    const points=logicalPoints.map(({u,v})=>this.territory.project(u,v));

    const graphics=this.scene.add.graphics();
    graphics.setDepth(this.territory.groundDepth(-90));
    graphics.fillStyle(DEBUG_FILL_COLOR,1);
    graphics.beginPath();
    graphics.moveTo(points[0].x,points[0].y);
    for(let i=1;i<points.length;i++)graphics.lineTo(points[i].x,points[i].y);
    graphics.closePath();
    graphics.fillPath();

    // Contorno propositalmente discreto nesta etapa para o usuário conseguir
    // confirmar visualmente onde a cobertura termina. Será removido quando a
    // geometria for aprovada e a ambientação real começar.
    graphics.lineStyle(3,DEBUG_EDGE_COLOR,.8);
    graphics.beginPath();
    graphics.moveTo(points[0].x,points[0].y);
    for(let i=1;i<points.length;i++)graphics.lineTo(points[i].x,points[i].y);
    graphics.closePath();
    graphics.strokePath();

    graphics.setData?.('oldRoadAncientForestVisualExtension',{
      version:'v0.3.1-round12-step1',
      purpose:'geometry-validation-only',
      visualOnly:true,
      collision:false,
      expandsPlayableBounds:false,
      bounds:{...b},
      logicalPoints:logicalPoints.map(point=>({...point})),
      worldPoints:points.map(point=>({x:point.x,y:point.y}))
    });

    this.graphics=graphics;
    this.scene.registry.set('oldRoadAncientForestVisualExtension',{
      version:'v0.3.1-round12-step1',
      status:'geometry-validation',
      visualOnly:true,
      collision:false,
      expandsPlayableBounds:false,
      bounds:{...b},
      logicalPoints:logicalPoints.map(point=>({...point})),
      worldPoints:points.map(point=>({x:point.x,y:point.y}))
    });
  }

  destroy(){
    this.graphics?.destroy?.();
    this.graphics=null;
  }
}
