// @ts-nocheck

/**
 * v0.3.1 Round 13 — ETAPA 1B
 *
 * Correção EXCLUSIVA da geometria-base visual aprovada no Round 12.
 * A área já correta foi preservada. Esta versão acrescenta somente a região
 * preta marcada pelo usuário no print "Captura de tela 2026-10-09 103331.png".
 *
 * Nada desta classe cria colisão, interação, estrada, árvore, prop ou expansão
 * de bounds. É somente uma camada visual de validação atrás do mapa.
 *
 * Geometria já aprovada (preservada):
 *   u = -56..0
 *   v = 48.969..79.019
 *
 * Complemento marcado no print:
 *  A) continuação à esquerda do mapa, a partir de v=79.019 até v=100;
 *  B) cunha abaixo do limite v=82, entre u=0 e aproximadamente u=9.24,
 *     seguindo a marcação vermelha medida no screenshot.
 */

export const OLD_ROAD_ANCIENT_FOREST_VISUAL_EXTENSION_BASE=Object.freeze({
  minU:-56,
  maxU:0,
  minV:48.969,
  maxV:79.019
});

export const OLD_ROAD_ANCIENT_FOREST_VISUAL_EXTENSION_LEFT_CONTINUATION=Object.freeze({
  minU:-56,
  maxU:0,
  minV:79.019,
  maxV:100
});

// A borda interna começa EXATAMENTE no canto lógico do mapa (u=0,v=82).
// Os demais pontos derivam da marcação vermelha do screenshot. O polígono
// permanece fora da área jogável: v nunca é menor que 82 quando u>0.
export const OLD_ROAD_ANCIENT_FOREST_VISUAL_EXTENSION_BOTTOM_WEDGE=Object.freeze([
  {u:0.000,v:82.000},
  {u:9.240,v:82.000},
  {u:8.688,v:91.832},
  {u:0.479,v:100.000},
  {u:0.000,v:100.000}
]);

const DEBUG_FILL_COLOR=0x31453f;
const DEBUG_EDGE_COLOR=0x6e9185;

const rectanglePoints=b=>[
  {u:b.minU,v:b.minV},
  {u:b.maxU,v:b.minV},
  {u:b.maxU,v:b.maxV},
  {u:b.minU,v:b.maxV}
];

export class OldRoadAncientForestVisualExtension{
  constructor(territory){
    this.territory=territory;
    this.scene=territory.scene;
    this.graphics=null;
    this.build();
  }

  drawPolygon(graphics,logicalPoints,{outline=true}={}){
    const points=logicalPoints.map(({u,v})=>this.territory.project(u,v));
    graphics.beginPath();
    graphics.moveTo(points[0].x,points[0].y);
    for(let i=1;i<points.length;i++)graphics.lineTo(points[i].x,points[i].y);
    graphics.closePath();
    graphics.fillPath();

    if(outline){
      graphics.beginPath();
      graphics.moveTo(points[0].x,points[0].y);
      for(let i=1;i<points.length;i++)graphics.lineTo(points[i].x,points[i].y);
      graphics.closePath();
      graphics.strokePath();
    }
    return points;
  }

  build(){
    const baseLogical=rectanglePoints(OLD_ROAD_ANCIENT_FOREST_VISUAL_EXTENSION_BASE);
    const leftLogical=rectanglePoints(OLD_ROAD_ANCIENT_FOREST_VISUAL_EXTENSION_LEFT_CONTINUATION);
    const wedgeLogical=OLD_ROAD_ANCIENT_FOREST_VISUAL_EXTENSION_BOTTOM_WEDGE.map(point=>({...point}));

    const graphics=this.scene.add.graphics();
    graphics.setDepth(this.territory.groundDepth(-90));
    graphics.fillStyle(DEBUG_FILL_COLOR,1);
    graphics.lineStyle(3,DEBUG_EDGE_COLOR,.8);

    // 1) Área que o usuário já aprovou — não alterada.
    const baseWorld=this.drawPolygon(graphics,baseLogical);

    // 2) Área preta adicional marcada em vermelho — lado esquerdo.
    const leftWorld=this.drawPolygon(graphics,leftLogical);

    // 3) Área preta adicional que contorna o canto inferior do mapa (v=82).
    const wedgeWorld=this.drawPolygon(graphics,wedgeLogical);

    const data={
      version:'v0.3.1-round13-step1b',
      purpose:'geometry-validation-only',
      visualOnly:true,
      collision:false,
      expandsPlayableBounds:false,
      approvedBase:{
        bounds:{...OLD_ROAD_ANCIENT_FOREST_VISUAL_EXTENSION_BASE},
        logicalPoints:baseLogical.map(point=>({...point})),
        worldPoints:baseWorld.map(point=>({x:point.x,y:point.y}))
      },
      markedCorrection:{
        source:'Captura de tela 2026-10-09 103331.png',
        leftContinuation:{
          bounds:{...OLD_ROAD_ANCIENT_FOREST_VISUAL_EXTENSION_LEFT_CONTINUATION},
          logicalPoints:leftLogical.map(point=>({...point})),
          worldPoints:leftWorld.map(point=>({x:point.x,y:point.y}))
        },
        bottomWedge:{
          logicalPoints:wedgeLogical.map(point=>({...point})),
          worldPoints:wedgeWorld.map(point=>({x:point.x,y:point.y}))
        }
      }
    };

    graphics.setData?.('oldRoadAncientForestVisualExtension',data);
    this.graphics=graphics;
    this.scene.registry.set('oldRoadAncientForestVisualExtension',data);
  }

  destroy(){
    this.graphics?.destroy?.();
    this.graphics=null;
  }
}
