// @ts-nocheck

/**
 * v0.3.1 Round 27 — ajuste final de integração do chão sinistro.
 *
 * Regras preservadas:
 * - A geometria aprovada no Round 13 continua CONGELADA.
 * - Não altera colisão, bounds jogáveis ou a posição dos props do mapa.
 * - O objetivo desta etapa é apenas melhorar a leitura do chão da floresta
 *   sinistra e suavizar as bordas entre o solo sombrio e o mapa existente.
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

// Geometria aprovada no Round 13 — NÃO ALTERAR.
export const OLD_ROAD_ANCIENT_FOREST_VISUAL_EXTENSION_BOTTOM_WEDGE=Object.freeze([
  {u:0.000,v:82.000},
  {u:9.240,v:82.000},
  {u:8.688,v:91.832},
  {u:0.479,v:100.000},
  {u:0.000,v:100.000}
]);

const BASE_SOIL_COLOR=0x202823;
const BASE_SOIL_SECONDARY=0x2a332d;
const BASE_SOIL_SHADOW=0x141a17;

const SURFACE_KEYS=Object.freeze([
  'sinister_ground_surface_dark_01',
  'sinister_ground_surface_wet_01'
]);

const DECAL_KEYS=Object.freeze({
  swamp:'sinister_ground_patch_swamp_01',
  debris:'sinister_ground_debris_01',
  leafPile:'sinister_ground_leaf_pile_01',
  roots:'sinister_ground_twisted_roots_01',
  grassToSwamp:'sinister_ground_transition_grass_swamp_01',
  forestToSwamp:'sinister_ground_transition_forest_swamp_01',
  roadToSwamp:'sinister_ground_transition_road_swamp_01'
});


const DEAD_TREE_VARIANTS=Object.freeze([
  'ancient_forest_tree_dead_01',
  'ancient_forest_tree_dead_02',
  'ancient_forest_tree_dead_03'
]);

// Round 21 — preencher toda a área aprovada com massa densa de árvores mortas.
// Não é mais um punhado de peças isoladas: a cobertura inteira recebe uma malha
// visual contínua, com linhas alternadas, jitter e profundidade progressiva.
const DEAD_TREE_FILL_SETTINGS=Object.freeze({
  startU:-54,
  endU:-1.2,
  stepU:5.4,
  startV:50.8,
  endV:99.2,
  stepV:5.0,
  rowOffset:2.5
});

const DEAD_TREE_HERO_CLUSTER=Object.freeze([
  ['ancient_forest_tree_dead_02',-50.0,55.4,1.16,false,.88,-.02],
  ['ancient_forest_tree_dead_01',-44.8,58.0,1.08,true,.84,-.01],
  ['ancient_forest_tree_dead_03',-38.8,61.0,1.12,false,.84,.00],
  ['ancient_forest_tree_dead_02',-32.4,64.0,1.06,true,.84,.00],
  ['ancient_forest_tree_dead_01',-26.8,67.2,1.04,false,.84,.01],
  ['ancient_forest_tree_dead_03',-20.5,70.0,1.02,true,.84,.01],
  ['ancient_forest_tree_dead_02',-14.4,73.2,1.00,false,.84,.02],
  ['ancient_forest_tree_dead_01',-8.8,76.4,.98,true,.86,.02],
  ['ancient_forest_tree_dead_03',-5.8,80.2,.96,false,.86,.03],
  ['ancient_forest_tree_dead_02',-47.5,83.8,1.10,true,.82,.00],
  ['ancient_forest_tree_dead_01',-37.2,88.4,1.02,false,.82,.01],
  ['ancient_forest_tree_dead_03',-25.2,92.2,.98,true,.82,.02],
  ['ancient_forest_tree_dead_02',-12.0,96.8,.94,false,.82,.03]
]);

const SWAMP_PATCHES=Object.freeze([
  [-48.2,55.4,.20,.34,-.10,false],
  [-39.6,61.1,.18,.36,.08,true],
  [-29.4,66.6,.22,.34,-.04,false],
  [-18.7,71.8,.19,.33,.14,true],
  [-10.1,76.3,.17,.35,-.08,false],
  [-44.3,82.2,.21,.30,.10,true],
  [-33.8,87.4,.18,.32,-.12,false],
  [-22.0,92.6,.20,.31,.06,true],
  [-11.2,96.4,.17,.30,-.10,false],
  [2.6,88.8,.18,.28,.10,true]
]);

const DEBRIS_PATCHES=Object.freeze([
  [-52.0,52.8,.13,.32,-.18,false],
  [-45.0,58.8,.15,.28,.10,true],
  [-35.2,63.2,.14,.30,-.06,false],
  [-25.6,68.2,.13,.28,.12,true],
  [-16.6,73.0,.15,.27,-.14,false],
  [-7.8,77.2,.12,.30,.06,true],
  [-48.6,80.8,.14,.27,-.10,false],
  [-39.4,85.0,.13,.27,.14,true],
  [-29.1,89.5,.15,.28,-.08,false],
  [-18.5,94.0,.13,.27,.11,true],
  [-9.0,98.0,.12,.25,-.12,false],
  [3.8,86.0,.14,.24,.05,true]
]);

const LEAF_PILES=Object.freeze([
  [-49.8,56.8,.11,.34,.06,false],
  [-42.4,60.0,.10,.36,-.09,true],
  [-32.8,65.4,.12,.35,.04,false],
  [-22.7,70.6,.11,.34,.10,true],
  [-13.6,75.7,.10,.33,-.07,false],
  [-5.1,79.0,.12,.34,.08,true],
  [-46.2,84.0,.11,.32,-.04,false],
  [-35.6,88.6,.10,.33,.07,true],
  [-25.0,93.1,.11,.31,-.09,false],
  [-13.1,97.2,.10,.30,.05,true],
  [1.3,84.8,.10,.28,-.03,false],
  [4.9,90.6,.11,.26,.08,true]
]);

const ROOT_ACCENTS=Object.freeze([
  [-46.8,57.3,.16,.26,-.18,false],
  [-35.0,64.5,.17,.24,.08,true],
  [-23.0,71.2,.18,.24,-.12,false],
  [-11.4,77.8,.17,.22,.16,true],
  [-31.5,87.2,.18,.22,-.10,false],
  [-14.3,96.0,.18,.20,.12,true]
]);

// Round 18 — costura EXATA na borda marcada pelo usuário.
// A marcação vermelha coincide com duas arestas lógicas já conhecidas do mapa:
//   1) aresta curta superior: u = 0, de v = 79.019 até v = 82;
//   2) aresta diagonal longa: v = 82, de u = 0 até u = 9.24.
// Nenhuma transição deve ser posicionada fora dessas duas arestas.
const FOREST_EDGE_TRANSITIONS=Object.freeze([
  // [u,v,scale,alpha,rotation,flipX]
  [0.000,80.42,.16,.90,-2.6779450446,true]
]);

const GRASS_EDGE_TRANSITIONS=Object.freeze([
  [1.70,82.000,.18,.90, 2.6779450446,true],
  [4.55,82.000,.18,.90, 2.6779450446,true],
  [7.55,82.000,.18,.90, 2.6779450446,true]
]);

const ROAD_EDGE_TRANSITIONS=Object.freeze([
  // Costura central da quina: lado claro/estrada voltado para o mapa.
  [0.000,82.000,.16,.92, 3.1415926536,true]
]);

// Round 27 — fechamento da Etapa 1. A borda inferior/direita do polígono
// aprovado ainda encontrava o gramado com uma linha muito abrupta. Estes dois
// segmentos são EXATAMENTE as arestas externas já aprovadas do bottom wedge;
// só recebem a mesma transição grass->swamp já existente, sem mudar geometria.
const WEDGE_OUTER_GRASS_TRANSITION_SEGMENTS=Object.freeze([
  [{u:9.240,v:82.000},{u:8.688,v:91.832},3],
  [{u:8.688,v:91.832},{u:.479,v:100.000},4]
]);


// Novo Round 22 (reiniciado a partir do Round 21 aprovado) — continuidade
// VISUAL da Estrada Velha para dentro da floresta sinistra. A referência
// aprovada mostra uma curva suave para cima/esquerda, saindo pelo lado esquerdo
// da tela. Estes módulos usam somente a arte já aprovada da Estrada Velha;
// não criam colisão, navegação, trigger, rota lógica ou expansão jogável.
const VISUAL_ROAD_CONTINUATION=Object.freeze([
  {module:'straightLong',rotation:-80*Math.PI/180},
  {module:'straightLong',rotation:-76*Math.PI/180},
  {module:'straightLong',rotation:-72*Math.PI/180},
  {module:'straightLong',rotation:-68*Math.PI/180},
  {module:'straightShort',rotation:-64*Math.PI/180},
  // Round 23 — completar EXATAMENTE o trecho restante indicado em vermelho:
  // a estrada continua até ultrapassar a borda esquerda da área visual.
  {module:'straightShort',rotation:-70*Math.PI/180},
  {module:'straightShort',rotation:-76*Math.PI/180}
]);

// Corredor visual em pixels ao redor da linha central. Apenas impede que a
// massa de árvores do Round 21 nasça em cima da estrada. Não altera colisão.

const VISUAL_ROAD_CLEAR_RADIUS=74;

// Round 24 — Etapa 1 da Floresta Sinistra ao redor da estrada visual.
// Somente chão/vegetação rasteira: solo escuro, folhas secas, detritos e
// raízes rasas. Não adiciona árvores, ossos, caveiras, colisão ou gameplay.
const SINISTER_ROADSIDE_GROUND=Object.freeze({
  innerOffset:92,
  outerOffset:132,
  sampleStepPx:92,
  sideJitterPx:10,
  alongJitterPx:8,
  baseScale:.145,
  alpha:.72
});

const SINISTER_ROADSIDE_KEYS=Object.freeze([
  DECAL_KEYS.swamp,
  DECAL_KEYS.debris,
  DECAL_KEYS.leafPile,
  DECAL_KEYS.roots
]);

// Round 25 — polimento do chão usando SOMENTE os assets já existentes.
// O objetivo é densificar o solo sombrio, suavizar a leitura das bordas
// junto à estrada e quebrar a aparência de faixa única/repetitiva.
const SINISTER_ROADSIDE_POLISH=Object.freeze({
  sampleStepPx:64,
  shoulderOffset:50,
  shoulderJitterPx:10,
  shoulderScale:.102,
  shoulderAlpha:.28,
  transitionOffset:118,
  transitionJitterPx:18,
  transitionScale:.118,
  transitionAlpha:.28,
  clusterRadiusPx:72
});

const SINISTER_ROADSIDE_RING_OFFSETS=Object.freeze([64,88,112]);

const SINISTER_ROADSIDE_RING_BIASES=Object.freeze([
  [DECAL_KEYS.roots,DECAL_KEYS.debris,DECAL_KEYS.leafPile],
  [DECAL_KEYS.swamp,DECAL_KEYS.debris,DECAL_KEYS.leafPile,DECAL_KEYS.roots],
  [DECAL_KEYS.swamp,DECAL_KEYS.debris,DECAL_KEYS.roots]
]);

const SINISTER_ROADSIDE_TRANSITION_KEYS=Object.freeze([
  DECAL_KEYS.roadToSwamp,
  DECAL_KEYS.forestToSwamp,
  DECAL_KEYS.grassToSwamp
]);


// Round 29 — Etapa 2 TESTE CONTROLADO.
// Base obrigatória: Round 27 aprovado. O Round 28 rejeitado NÃO é usado.
// Aplicar apenas em um trecho curto (~20% da continuação visual da estrada),
// para validar escala, leitura e integração antes de espalhar pelo restante.
const SINISTER_STAGE2_TEST_KEYS=Object.freeze({
  roots:'sinister_stage2_test_roots_01',
  stump:'ancient_forest_stump_02',
  thorns:'sinister_stage2_test_thorn_bush_01',
  web:'sinister_stage2_test_web_01',
  branchPile:'sinister_stage2_test_branch_pile_01'
});

const SINISTER_STAGE2_TEST_LAYOUT=Object.freeze([
  // Um único trecho curto concentrado entre o final do segmento 3 e início do 4.
  // Offsets mantêm os props fora da estrada; nada é espalhado pela extensão inteira.
  {seg:3,t:.18,side:-1,offset:102,key:SINISTER_STAGE2_TEST_KEYS.roots,scale:.074,alpha:.92,rot:-.08,flip:false,originY:.72},
  {seg:3,t:.38,side: 1,offset:108,key:SINISTER_STAGE2_TEST_KEYS.thorns,scale:.062,alpha:.90,rot:.10,flip:true,originY:.74},
  {seg:3,t:.60,side:-1,offset:116,key:SINISTER_STAGE2_TEST_KEYS.stump,scale:.46,alpha:.90,rot:-.04,flip:true,originY:.86},
  {seg:3,t:.82,side: 1,offset:112,key:SINISTER_STAGE2_TEST_KEYS.web,scale:.070,alpha:.84,rot:.06,flip:false,originY:.68},
  {seg:4,t:.10,side:-1,offset:110,key:SINISTER_STAGE2_TEST_KEYS.branchPile,scale:.066,alpha:.90,rot:-.07,flip:true,originY:.72}
]);

const rectanglePoints=b=>[
  {u:b.minU,v:b.minV},
  {u:b.maxU,v:b.minV},
  {u:b.maxU,v:b.maxV},
  {u:b.minU,v:b.maxV}
];

const pointInPolygon=(u,v,poly)=>{
  let inside=false;
  for(let i=0,j=poly.length-1;i<poly.length;j=i++){
    const a=poly[i],b=poly[j];
    const hit=((a.v>v)!==(b.v>v))&&(u<(b.u-a.u)*(v-a.v)/(b.v-a.v+1e-9)+a.u);
    if(hit)inside=!inside;
  }
  return inside;
};


const distancePointToSegment=(px,py,a,b)=>{
  const vx=b.x-a.x,vy=b.y-a.y;
  const wx=px-a.x,wy=py-a.y;
  const len2=vx*vx+vy*vy;
  const t=len2>0?Math.max(0,Math.min(1,(wx*vx+wy*vy)/len2)):0;
  const dx=px-(a.x+vx*t),dy=py-(a.y+vy*t);
  return Math.sqrt(dx*dx+dy*dy);
};

const mulberry32=seed=>()=>{
  seed|=0;seed=seed+0x6D2B79F5|0;
  let t=Math.imul(seed^seed>>>15,1|seed);
  t=t+Math.imul(t^t>>>7,61|t)^t;
  return ((t^t>>>14)>>>0)/4294967296;
};

function worldBoundsFromPolygons(polygons=[]){
  let minX=Infinity,minY=Infinity,maxX=-Infinity,maxY=-Infinity;
  for(const poly of polygons)for(const p of poly){
    if(p.x<minX)minX=p.x;
    if(p.y<minY)minY=p.y;
    if(p.x>maxX)maxX=p.x;
    if(p.y>maxY)maxY=p.y;
  }
  return {minX,minY,maxX,maxY,width:maxX-minX,height:maxY-minY};
}

export class OldRoadAncientForestVisualExtension{
  constructor(territory){
    this.territory=territory;
    this.scene=territory.scene;
    this.graphics=null;
    this.textureLayer=null;
    this.maskGraphics=null;
    this.detailGraphics=null;
    this.transitionLayer=null;
    this.floorSprites=[];
    this.treeSprites=[];
    this.visualRoadSprites=[];
    this.visualRoadPath=[];
    this.roadsideGroundSprites=[];
    this.roadsideGroundCount=0;
    this.stage2TestSprites=[];
    this.stage2TestCount=0;
    this.deadTreeCount=0;
    this.build();
  }

  projectPolygon(logicalPoints){
    return logicalPoints.map(({u,v})=>this.territory.project(u,v));
  }

  drawWorldPolygon(graphics,worldPoints){
    graphics.beginPath();
    graphics.moveTo(worldPoints[0].x,worldPoints[0].y);
    for(let i=1;i<worldPoints.length;i++)graphics.lineTo(worldPoints[i].x,worldPoints[i].y);
    graphics.closePath();
    graphics.fillPath();
  }

  isInsideApprovedCoverage(u,v){
    if(u>=OLD_ROAD_ANCIENT_FOREST_VISUAL_EXTENSION_BASE.minU&&
       u<=OLD_ROAD_ANCIENT_FOREST_VISUAL_EXTENSION_BASE.maxU&&
       v>=OLD_ROAD_ANCIENT_FOREST_VISUAL_EXTENSION_BASE.minV&&
       v<=OLD_ROAD_ANCIENT_FOREST_VISUAL_EXTENSION_BASE.maxV)return true;

    if(u>=OLD_ROAD_ANCIENT_FOREST_VISUAL_EXTENSION_LEFT_CONTINUATION.minU&&
       u<=OLD_ROAD_ANCIENT_FOREST_VISUAL_EXTENSION_LEFT_CONTINUATION.maxU&&
       v>=OLD_ROAD_ANCIENT_FOREST_VISUAL_EXTENSION_LEFT_CONTINUATION.minV&&
       v<=OLD_ROAD_ANCIENT_FOREST_VISUAL_EXTENSION_LEFT_CONTINUATION.maxV)return true;

    return pointInPolygon(u,v,OLD_ROAD_ANCIENT_FOREST_VISUAL_EXTENSION_BOTTOM_WEDGE);
  }

  buildMask(worldPolygons){
    const maskGraphics=this.scene.make.graphics({x:0,y:0,add:false});
    maskGraphics.fillStyle(0xffffff,1);
    for(const points of worldPolygons)this.drawWorldPolygon(maskGraphics,points);
    const mask=maskGraphics.createGeometryMask();
    this.maskGraphics=maskGraphics;
    return mask;
  }

  addGroundDecal(container,key,u,v,{scale=.2,alpha=.3,rotation=0,flipX=false,flipY=false,originX=.5,originY=.5,tint=null,depthBias=0}={}){
    if(!this.isInsideApprovedCoverage(u,v)||!this.scene.textures.exists(key))return null;
    const p=this.territory.project(u,v);
    const sprite=this.scene.add.image(p.x,p.y,key)
      .setOrigin(originX,originY)
      .setScale(scale)
      .setAlpha(alpha)
      .setRotation(rotation)
      .setFlipX(flipX)
      .setFlipY(flipY);
    if(tint!=null)sprite.setTint(tint);
    if(depthBias)sprite.setDepth(this.territory.groundDepth(-89.96+depthBias));
    container.add(sprite);
    this.floorSprites.push(sprite);
    return sprite;
  }

  addTransitionDecal(container,key,u,v,{scale=.16,alpha=.9,rotation=0,flipX=false,flipY=false,originX=.5,originY=.5}={}){
    if(!this.scene.textures.exists(key))return null;
    const p=this.territory.project(u,v);
    const sprite=this.scene.add.image(p.x,p.y,key)
      .setOrigin(originX,originY)
      .setScale(scale)
      .setAlpha(alpha)
      .setRotation(rotation)
      .setFlipX(flipX)
      .setFlipY(flipY);
    container.add(sprite);
    this.floorSprites.push(sprite);
    return sprite;
  }


  isInsideVisualRoadCorridor(u,v){
    if(!this.visualRoadPath||this.visualRoadPath.length<2)return false;
    const p=this.territory.project(u,v);
    for(let i=1;i<this.visualRoadPath.length;i++){
      if(distancePointToSegment(p.x,p.y,this.visualRoadPath[i-1],this.visualRoadPath[i])<=VISUAL_ROAD_CLEAR_RADIUS)return true;
    }
    return false;
  }

  buildVisualRoadContinuation(){
    const road=this.scene.registry.get('oldRoadConnectorTest');
    const start=road?.start?.actual;
    if(!start||!this.territory.placeRoadConnectorModule)return;

    let anchor={x:start.x,y:start.y};
    this.visualRoadPath=[{...anchor}];

    for(let i=0;i<VISUAL_ROAD_CONTINUATION.length;i++){
      const spec=VISUAL_ROAD_CONTINUATION[i];
      const module=this.territory.placeRoadConnectorModule(spec.module,anchor,'south',{
        rotation:spec.rotation,
        visibleRadius:40,
        activeRadius:44
      });
      if(!module)continue;
      module.sprite?.setData?.('oldRoadVisualContinuation',{
        version:'v0.3.1-round27-stage1-ground-final-integration',
        visualOnly:true,
        collision:false,
        expandsPlayableBounds:false,
        reference:'Captura de tela 2026-10-14 135850(1).png — corredor vermelho autoritativo',
        ordinal:i,
        module:spec.module,
        rotation:spec.rotation
      });
      if(module.sprite)this.visualRoadSprites.push(module.sprite);
      anchor={x:module.connectors.north.x,y:module.connectors.north.y};
      this.visualRoadPath.push({...anchor});
    }
  }



  addRoadsideGroundSprite(key,x,y,{scale=.15,alpha=.72,rotation=0,flipX=false,depthBias=0,originY=.56}={}){
    if(!this.scene.textures.exists(key))return null;
    const sprite=this.scene.add.image(x,y,key)
      .setOrigin(.5,originY)
      .setScale(scale)
      .setAlpha(alpha)
      .setRotation(rotation)
      .setFlipX(flipX)
      .setDepth(this.territory.groundDepth(-79.72+depthBias));
    sprite.setData('sinisterRoadsideGround',{
      version:'v0.3.1-round27-stage1-ground-final-integration',
      visualOnly:true,
      collision:false,
      key
    });
    this.roadsideGroundSprites.push(sprite);
    return sprite;
  }

  buildRoadsideSinisterGround(){
    if(!this.visualRoadPath||this.visualRoadPath.length<2)return;

    const rng=mulberry32(241015);
    let count=0;
    const cfg=SINISTER_ROADSIDE_GROUND;
    const polish=SINISTER_ROADSIDE_POLISH;

    for(let seg=1;seg<this.visualRoadPath.length;seg++){
      const a=this.visualRoadPath[seg-1];
      const b=this.visualRoadPath[seg];
      const dx=b.x-a.x,dy=b.y-a.y;
      const len=Math.hypot(dx,dy);
      if(len<1)continue;
      const tx=dx/len,ty=dy/len;
      const nx=-ty,ny=tx;
      const samples=Math.max(1,Math.ceil(len/polish.sampleStepPx));
      const upperSideBias=(side)=>side>0?-8:0;
      const roadAngle=Math.atan2(dy,dx);

      for(let i=0;i<=samples;i++){
        const t=Math.min(1,i/samples);
        const baseX=a.x+dx*t;
        const baseY=a.y+dy*t;

        for(const side of [-1,1]){
          const sideBias=side>0?-8:0;

          // Faixa principal do chão: três anéis mais estreitos e irregulares.
          for(let ring=0;ring<SINISTER_ROADSIDE_RING_OFFSETS.length;ring++){
            if(ring===2&&rng()<.28)continue;
            if(ring===1&&rng()<.10)continue;
            const offset=SINISTER_ROADSIDE_RING_OFFSETS[ring]+sideBias+(rng()-.5)*(cfg.sideJitterPx+ring*4);
            const along=(rng()-.5)*(cfg.alongJitterPx+10+ring*2);
            const x=baseX+nx*offset*side+tx*along;
            const y=baseY+ny*offset*side+ty*along;
            const pool=SINISTER_ROADSIDE_RING_BIASES[ring];
            const key=pool[Math.floor(rng()*pool.length)%pool.length];
            const scale=(ring===0?.152:ring===1?.140:.126)+(rng()-.5)*.022;
            const alpha=(ring===0?.72:ring===1?.58:.42)+(rng()-.5)*.10;
            const rotation=roadAngle+(rng()-.5)*.46;
            const flipX=rng()>.5;
            if(this.addRoadsideGroundSprite(key,x,y,{scale,alpha,rotation,flipX,depthBias:ring*.01,originY:ring===0?.57:.56}))count++;
          }

          // Costura rente à estrada com o asset já existente de transição.
          const shoulderOffset=polish.shoulderOffset+sideBias+(rng()-.5)*polish.shoulderJitterPx;
          const shoulderX=baseX+nx*shoulderOffset*side+tx*((rng()-.5)*8);
          const shoulderY=baseY+ny*shoulderOffset*side+ty*((rng()-.5)*8);
          if(this.addRoadsideGroundSprite(DECAL_KEYS.roadToSwamp,shoulderX,shoulderY,{
            scale:polish.shoulderScale+(rng()-.5)*.014,
            alpha:polish.shoulderAlpha+(rng()-.5)*.05,
            rotation:roadAngle,
            flipX:side<0,
            depthBias:.022,
            originY:.54
          }))count++;

          // Costura mais externa com o terreno/mata, ainda sem criar asset novo.
          const transKey=(side>0&&rng()<.55)?DECAL_KEYS.forestToSwamp:SINISTER_ROADSIDE_TRANSITION_KEYS[1+(Math.floor(rng()*2)%2)];
          const transOffset=polish.transitionOffset+sideBias+(rng()-.5)*polish.transitionJitterPx;
          const transX=baseX+nx*transOffset*side+tx*((rng()-.5)*14);
          const transY=baseY+ny*transOffset*side+ty*((rng()-.5)*14);
          if(this.addRoadsideGroundSprite(transKey,transX,transY,{
            scale:polish.transitionScale+(rng()-.5)*.016,
            alpha:polish.transitionAlpha+(rng()-.5)*.05,
            rotation:roadAngle+(rng()-.5)*.18,
            flipX:side<0,
            depthBias:.026,
            originY:.54
          }))count++;
        }
      }
    }

    // Reforço local no início da extensão, onde a curva encontra o trecho já existente.
    const first=this.visualRoadPath[0];
    const second=this.visualRoadPath[1];
    if(first&&second){
      const dx=second.x-first.x,dy=second.y-first.y,len=Math.hypot(dx,dy)||1;
      const tx=dx/len,ty=dy/len;
      const nx=-dy/len,ny=dx/len;
      const angle=Math.atan2(dy,dx);
      for(const side of [-1,1]){
        for(const localOffset of [66,88,108]){
          const x=first.x+nx*localOffset*side+tx*((rng()-.5)*18);
          const y=first.y+ny*localOffset*side+ty*((rng()-.5)*18);
          const localKey=side<0&&localOffset===66?DECAL_KEYS.roadToSwamp:SINISTER_ROADSIDE_KEYS[Math.floor(rng()*SINISTER_ROADSIDE_KEYS.length)%SINISTER_ROADSIDE_KEYS.length];
          if(this.addRoadsideGroundSprite(localKey,x,y,{
            scale:(localOffset===66?.146:.136)+(rng()-.5)*.018,
            alpha:(localOffset===66?.46:.62)+(rng()-.5)*.07,
            rotation:angle+(rng()-.5)*.28,
            flipX:side<0,
            depthBias:.03,
            originY:localOffset===66?.54:.56
          }))count++;
        }
      }
    }

    this.roadsideGroundCount=count;
  }


  addStage2TestSprite(key,x,y,{scale=.08,alpha=.90,rotation=0,flipX=false,originY=.72,depthBias=0}={}){
    if(!this.scene.textures.exists(key))return null;
    const sprite=this.scene.add.image(x,y,key)
      .setOrigin(.5,originY)
      .setScale(scale)
      .setAlpha(alpha)
      .setRotation(rotation)
      .setFlipX(flipX)
      .setDepth(this.territory.groundDepth(-69.92+depthBias));
    sprite.setData('sinisterStage2ControlledTest',{
      version:'v0.3.1-round30-remove-scattered-dead-trees',
      visualOnly:true,
      collision:false,
      key
    });
    this.stage2TestSprites.push(sprite);
    return sprite;
  }

  buildStage2ControlledTest(){
    if(!this.visualRoadPath||this.visualRoadPath.length<4)return;
    let count=0;
    for(const spec of SINISTER_STAGE2_TEST_LAYOUT){
      const a=this.visualRoadPath[spec.seg-1];
      const b=this.visualRoadPath[spec.seg];
      if(!a||!b)continue;
      const dx=b.x-a.x,dy=b.y-a.y;
      const len=Math.hypot(dx,dy)||1;
      const nx=-dy/len,ny=dx/len;
      const baseX=a.x+dx*spec.t;
      const baseY=a.y+dy*spec.t;
      const x=baseX+nx*spec.offset*spec.side;
      const y=baseY+ny*spec.offset*spec.side;
      const angle=Math.atan2(dy,dx)+spec.rot;
      if(this.addStage2TestSprite(spec.key,x,y,{
        scale:spec.scale,
        alpha:spec.alpha,
        rotation:angle,
        flipX:spec.flip,
        originY:spec.originY,
        depthBias:spec.side>0?.02:.01
      }))count++;
    }
    this.stage2TestCount=count;
  }

  addDeadTree(key,u,v,{scale=1,alpha=.82,flipX=false,depthOffset=0,tint=null}={}){
    if(!this.isInsideApprovedCoverage(u,v)||this.isInsideVisualRoadCorridor(u,v)||!this.scene.textures.exists(key))return null;
    const p=this.territory.project(u,v);
    const source=this.scene.textures.get(key)?.getSourceImage?.();
    const originY=source?.height?Math.max(.86,Math.min(1,(source.height-12)/source.height)):.94;
    const sprite=this.scene.add.image(p.x,p.y,key)
      .setOrigin(.5,originY)
      .setScale(scale)
      .setAlpha(alpha)
      .setFlipX(flipX)
      .setDepth(this.territory.depthAt(u,v,.08+depthOffset));
    if(tint!=null)sprite.setTint(tint);
    this.treeSprites.push(sprite);
    return sprite;
  }

  buildDeadTreeLayer(){
    const rng=mulberry32(424242);
    let count=0;

    // 1) Massa hero: algumas árvores maiores para quebrar a repetição.
    for(const [key,u,v,scale,flipX,alpha,depthOffset] of DEAD_TREE_HERO_CLUSTER){
      if(this.addDeadTree(key,u,v,{scale,flipX,alpha,depthOffset}))count++;
    }

    // 2) Malha principal: preencher toda a cobertura aprovada.
    const {startU,endU,stepU,startV,endV,stepV,rowOffset}=DEAD_TREE_FILL_SETTINGS;
    let rowIndex=0;
    for(let v=startV;v<=endV;v+=stepV,rowIndex++){
      const offset=(rowIndex%2===0)?0:rowOffset;
      for(let u=startU+offset;u<=endU;u+=stepU){
        const jitterU=(rng()-.5)*1.45;
        const jitterV=(rng()-.5)*1.25;
        const uu=u+jitterU;
        const vv=v+jitterV;
        if(!this.isInsideApprovedCoverage(uu,vv))continue;

        const variantIndex=Math.floor(rng()*DEAD_TREE_VARIANTS.length)%DEAD_TREE_VARIANTS.length;
        const key=DEAD_TREE_VARIANTS[variantIndex];
        const depthT=Math.max(0,Math.min(1,(vv-50)/50));
        const scale=.84 + depthT*.22 + rng()*.12;
        const alpha=.52 + depthT*.22 + rng()*.08;
        const flipX=rng()>.5;
        const depthOffset=-.02 + rng()*.05;
        if(this.addDeadTree(key,uu,vv,{scale,alpha,flipX,depthOffset}))count++;
      }
    }

    // 3) Faixa de borda: reforçar a leitura da parede de árvores na lateral esquerda.
    for(let v=52;v<=98;v+=4.8){
      const uu=-54.8 + (rng()-.5)*.9;
      const vv=v + (rng()-.5)*1.1;
      if(!this.isInsideApprovedCoverage(uu,vv))continue;
      const key=DEAD_TREE_VARIANTS[Math.floor(rng()*DEAD_TREE_VARIANTS.length)%DEAD_TREE_VARIANTS.length];
      const scale=1.02 + rng()*.20;
      const alpha=.74 + rng()*.10;
      const flipX=rng()>.5;
      if(this.addDeadTree(key,uu,vv,{scale,alpha,flipX,depthOffset:.02}))count++;
    }

    this.deadTreeCount=count;
  }

  addLogicalTransitionSegment(container,key,a,b,count,{scale=.145,alpha=.46,flipSeed=0}={}){
    const pa=this.territory.project(a.u,a.v);
    const pb=this.territory.project(b.u,b.v);
    const worldAngle=Math.atan2(pb.y-pa.y,pb.x-pa.x);
    // Mantém a orientação visual já usada nas transições aprovadas em v=82.
    const rotation=Math.PI-worldAngle;
    for(let i=1;i<=count;i++){
      const t=i/(count+1);
      const u=a.u+(b.u-a.u)*t;
      const v=a.v+(b.v-a.v)*t;
      this.addTransitionDecal(container,key,u,v,{
        scale:scale+((i%2)?-.008:.006),
        alpha:alpha+((i%2)?-.04:.03),
        rotation,
        flipX:((i+flipSeed)%2)===0,
        originY:.54
      });
    }
  }

  buildTransitionLayer(){
    // IMPORTANTE: esta camada NÃO recebe a máscara da cobertura externa.
    // A metade verde precisa avançar alguns pixels para dentro do mapa para
    // realmente costurar os dois solos. Ela fica acima do terreno-base (-80)
    // e abaixo da Estrada Velha (-70), portanto não cobre estrada ou props.
    const container=this.scene.add.container(0,0).setDepth(this.territory.groundDepth(-79.55));

    for(const [u,v,scale,alpha,rotation,flipX] of FOREST_EDGE_TRANSITIONS){
      this.addTransitionDecal(container,DECAL_KEYS.forestToSwamp,u,v,{scale,alpha,rotation,flipX});
    }
    for(const [u,v,scale,alpha,rotation,flipX] of GRASS_EDGE_TRANSITIONS){
      this.addTransitionDecal(container,DECAL_KEYS.grassToSwamp,u,v,{scale,alpha,rotation,flipX});
    }
    for(const [u,v,scale,alpha,rotation,flipX] of ROAD_EDGE_TRANSITIONS){
      this.addTransitionDecal(container,DECAL_KEYS.roadToSwamp,u,v,{scale,alpha,rotation,flipX});
    }

    // Suavização final da borda inferior/direita: apenas nas arestas já
    // aprovadas do wedge, usando o asset existente de transição com gramado.
    WEDGE_OUTER_GRASS_TRANSITION_SEGMENTS.forEach(([a,b,count],index)=>{
      this.addLogicalTransitionSegment(container,DECAL_KEYS.grassToSwamp,a,b,count,{
        scale:index===0?.142:.148,
        alpha:index===0?.44:.40,
        flipSeed:index
      });
    });

    this.transitionLayer=container;
  }

  buildFloorTextureLayer(mask,worldPolygons){
    const depth=this.territory.groundDepth(-89.96);
    const container=this.scene.add.container(0,0).setDepth(depth);
    const bounds=worldBoundsFromPolygons(worldPolygons);
    const pad=160;
    const x=bounds.minX-pad;
    const y=bounds.minY-pad;
    const width=Math.ceil(bounds.width+pad*2);
    const height=Math.ceil(bounds.height+pad*2);

    if(this.scene.textures.exists(SURFACE_KEYS[0])){
      const baseA=this.scene.add.tileSprite(x,y,width,height,SURFACE_KEYS[0]).setOrigin(0,0).setAlpha(.60);
      baseA.tilePositionX=168;
      baseA.tilePositionY=96;
      baseA.tileScaleX=.55;
      baseA.tileScaleY=.50;
      container.add(baseA);
      this.floorSprites.push(baseA);

      // Terceira leitura muito sutil do MESMO asset: escala e deslocamento
      // desencontrados quebram a repetição perceptível sem introduzir textura nova.
      const baseC=this.scene.add.tileSprite(x-72,y-54,width+144,height+108,SURFACE_KEYS[0]).setOrigin(0,0).setAlpha(.10);
      baseC.tilePositionX=517;
      baseC.tilePositionY=271;
      baseC.tileScaleX=.43;
      baseC.tileScaleY=.58;
      container.add(baseC);
      this.floorSprites.push(baseC);
    }

    if(this.scene.textures.exists(SURFACE_KEYS[1])){
      const baseB=this.scene.add.tileSprite(x-48,y-36,width+96,height+72,SURFACE_KEYS[1]).setOrigin(0,0).setAlpha(.34);
      baseB.tilePositionX=392;
      baseB.tilePositionY=148;
      baseB.tileScaleX=.47;
      baseB.tileScaleY=.53;
      container.add(baseB);
      this.floorSprites.push(baseB);
    }

    // Véu tonal para amarrar as superfícies e manter o solo sombrio.
    const veil=this.scene.add.rectangle(bounds.minX+bounds.width/2,bounds.minY+bounds.height/2,width,height,0x17211d,.12);
    container.add(veil);
    this.floorSprites.push(veil);

    for(const [u,v,scale,alpha,rotation,flipX] of SWAMP_PATCHES){
      this.addGroundDecal(container,DECAL_KEYS.swamp,u,v,{scale,alpha,rotation,flipX,originY:.54});
    }
    for(const [u,v,scale,alpha,rotation,flipX] of DEBRIS_PATCHES){
      this.addGroundDecal(container,DECAL_KEYS.debris,u,v,{scale,alpha,rotation,flipX,originY:.54});
    }
    for(const [u,v,scale,alpha,rotation,flipX] of LEAF_PILES){
      this.addGroundDecal(container,DECAL_KEYS.leafPile,u,v,{scale,alpha,rotation,flipX,originY:.56});
    }
    for(const [u,v,scale,alpha,rotation,flipX] of ROOT_ACCENTS){
      this.addGroundDecal(container,DECAL_KEYS.roots,u,v,{scale,alpha,rotation,flipX,originY:.58});
    }

    container.setMask(mask);
    this.textureLayer=container;
  }

  buildOrganicGroundDetails(mask){
    const rng=mulberry32(271828);
    const details=this.scene.add.graphics();
    details.setDepth(this.territory.groundDepth(-89.95));

    // Manchas suaves para quebrar repetição do tile, sem introduzir props altos.
    for(let i=0;i<52;i++){
      const u=-55+rng()*63;
      const v=49+rng()*51;
      if(!this.isInsideApprovedCoverage(u,v))continue;
      const p=this.territory.project(u,v);
      const w=120+rng()*220;
      const h=28+rng()*70;
      details.fillStyle(rng()>.55?0x1b241f:0x342c24,.055+rng()*.065);
      details.fillEllipse(p.x,p.y,w,h);
    }

    details.setMask(mask);
    this.detailGraphics=details;
  }

  build(){
    const baseLogical=rectanglePoints(OLD_ROAD_ANCIENT_FOREST_VISUAL_EXTENSION_BASE);
    const leftLogical=rectanglePoints(OLD_ROAD_ANCIENT_FOREST_VISUAL_EXTENSION_LEFT_CONTINUATION);
    const wedgeLogical=OLD_ROAD_ANCIENT_FOREST_VISUAL_EXTENSION_BOTTOM_WEDGE.map(point=>({...point}));

    const baseWorld=this.projectPolygon(baseLogical);
    const leftWorld=this.projectPolygon(leftLogical);
    const wedgeWorld=this.projectPolygon(wedgeLogical);
    const worldPolygons=[baseWorld,leftWorld,wedgeWorld];

    // Camada sólida: garante cobertura integral e elimina qualquer reaparição
    // de preto atrás das texturas transparentes.
    const graphics=this.scene.add.graphics();
    graphics.setDepth(this.territory.groundDepth(-90));
    graphics.fillStyle(BASE_SOIL_COLOR,1);
    this.drawWorldPolygon(graphics,baseWorld);
    this.drawWorldPolygon(graphics,leftWorld);
    this.drawWorldPolygon(graphics,wedgeWorld);

    // Massa tonal ampla por baixo dos assets de solo.
    graphics.fillStyle(BASE_SOIL_SECONDARY,.40);
    const pA=this.territory.project(-29,66);
    const pB=this.territory.project(-31,88);
    graphics.fillEllipse(pA.x,pA.y,1320,420);
    graphics.fillEllipse(pB.x,pB.y,1180,360);
    graphics.fillStyle(BASE_SOIL_SHADOW,.28);
    const pC=this.territory.project(-48,74);
    graphics.fillEllipse(pC.x,pC.y,920,300);

    const mask=this.buildMask(worldPolygons);
    graphics.setMask(mask);
    this.buildFloorTextureLayer(mask,worldPolygons);
    this.buildOrganicGroundDetails(mask);
    this.buildTransitionLayer();
    this.buildVisualRoadContinuation();
    this.buildRoadsideSinisterGround();
    this.buildStage2ControlledTest();
    // Round 30 — remover integralmente as árvores mortas espalhadas da Floresta Sinistra.
    // A camada procedural/hero/borda continua definida abaixo apenas para histórico,
    // mas NÃO é mais construída/renderizada no jogo.
    this.deadTreeCount=0;

    const data={
      version:'v0.3.1-round30-remove-scattered-dead-trees',
      purpose:'round29-controlled-test-minus-scattered-dead-trees',
      geometrySource:'v0.3.1-round13-approved',
      geometryFrozen:true,
      visualOnly:true,
      collision:false,
      expandsPlayableBounds:false,
      stage2:{
        largeTrees:false,
        largeLogs:false,
        spiderWebProps:false,
        roadExtension:true,
        groundAssets:{
          surfaces:[...SURFACE_KEYS],
          decals:[DECAL_KEYS.swamp,DECAL_KEYS.debris,DECAL_KEYS.leafPile,DECAL_KEYS.roots],
          transitions:[DECAL_KEYS.forestToSwamp,DECAL_KEYS.grassToSwamp,DECAL_KEYS.roadToSwamp]
        },
        palette:{
          base:'#202823',
          secondary:'#2a332d',
          shadow:'#141a17'
        }
      },
      stage3:{
        deadTreeMass:false,
        collision:false,
        assets:[...DEAD_TREE_VARIANTS],
        count:0,
        removedInRound:30,
        note:'árvores mortas espalhadas/procedurais removidas integralmente da Floresta Sinistra; solo, estrada e teste controlado da Etapa 2 preservados'
      },
      stage4:{
        visualRoadContinuation:true,
        collision:false,
        navigation:false,
        triggers:false,
        expandsPlayableBounds:false,
        reference:'Captura de tela 2026-10-14 135850(1).png — corredor vermelho autoritativo',
        modules:VISUAL_ROAD_CONTINUATION.map(item=>({module:item.module,rotation:item.rotation})),
        clearRadiusPx:VISUAL_ROAD_CLEAR_RADIUS,
        worldPath:this.visualRoadPath.map(point=>({x:point.x,y:point.y})),
        note:'continuidade exclusivamente visual da Estrada Velha, completada até a borda esquerda conforme a marcação vermelha do usuário'
      },
      stage5:{
        sinisterForestAroundRoadStage:1,
        visualOnly:true,
        collision:false,
        treesAdded:false,
        bonesAdded:false,
        roadChanged:false,
        groundSprites:this.roadsideGroundCount,
        polish:true,
        assets:[...SINISTER_ROADSIDE_KEYS,DECAL_KEYS.forestToSwamp],
        reference:'aether_caminho_na_floresta_assombrada.png',
        note:'Etapa 1 finalizada: transição inferior/direita suavizada nas arestas aprovadas do wedge e repetição superior quebrada com variação das mesmas texturas existentes; sem árvores novas, sem assets inéditos e sem mudança de geometria.'
      },
      stage6:{
        sinisterForestAroundRoadStage:2,
        mode:'controlled-test',
        visualOnly:true,
        collision:false,
        roadChanged:false,
        stage1GroundFrozen:true,
        fullRoadCoverage:false,
        testCoverage:'single short section (~20%)',
        propsPlaced:this.stage2TestCount,
        assets:[
          SINISTER_STAGE2_TEST_KEYS.roots,
          SINISTER_STAGE2_TEST_KEYS.stump,
          SINISTER_STAGE2_TEST_KEYS.thorns,
          SINISTER_STAGE2_TEST_KEYS.web,
          SINISTER_STAGE2_TEST_KEYS.branchPile
        ],
        reference:'aether_caminho_na_floresta_assombrada.png',
        note:'Etapa 2 reiniciada a partir do Round 27: apenas cinco props de massa baixa em um trecho curto para validação; Round 28 rejeitado não reutilizado.'
      },
      approvedBase:{
        bounds:{...OLD_ROAD_ANCIENT_FOREST_VISUAL_EXTENSION_BASE},
        logicalPoints:baseLogical.map(point=>({...point})),
        worldPoints:baseWorld.map(point=>({x:point.x,y:point.y}))
      },
      approvedCorrections:{
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
    this.textureLayer?.destroy?.(true);
    this.detailGraphics?.destroy?.();
    this.transitionLayer?.destroy?.(true);
    this.treeSprites?.forEach(sprite=>sprite?.destroy?.());
    this.visualRoadSprites?.forEach(sprite=>sprite?.destroy?.());
    this.roadsideGroundSprites?.forEach(sprite=>sprite?.destroy?.());
    this.stage2TestSprites?.forEach(sprite=>sprite?.destroy?.());
    this.graphics?.destroy?.();
    this.maskGraphics?.destroy?.();
    this.floorSprites=[];
    this.treeSprites=[];
    this.visualRoadSprites=[];
    this.visualRoadPath=[];
    this.roadsideGroundSprites=[];
    this.roadsideGroundCount=0;
    this.stage2TestSprites=[];
    this.stage2TestCount=0;
    this.textureLayer=null;
    this.detailGraphics=null;
    this.transitionLayer=null;
    this.graphics=null;
    this.maskGraphics=null;
  }
}
