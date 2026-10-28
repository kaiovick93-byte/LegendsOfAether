// @ts-nocheck
import {OldRoadSinisterForest} from './OldRoadSinisterForest';

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

const DECAL_KEYS=Object.freeze({
  swamp:'sinister_ground_patch_swamp_01',
  debris:'sinister_ground_debris_01',
  leafPile:'sinister_ground_leaf_pile_01',
  roots:'sinister_ground_twisted_roots_01',
  grassToSwamp:'sinister_ground_transition_grass_swamp_01',
  forestToSwamp:'sinister_ground_transition_forest_swamp_01',
  roadToSwamp:'sinister_ground_transition_road_swamp_01'
});



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


const mulberry32=seed=>()=>{
  seed|=0;seed=seed+0x6D2B79F5|0;
  let t=Math.imul(seed^seed>>>15,1|seed);
  t=t+Math.imul(t^t>>>7,61|t)^t;
  return ((t^t>>>14)>>>0)/4294967296;
};

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

  registerForestFog(){
    const fog=this.scene.worldFog;
    if(!fog?.registerZone)return;
    const base=OLD_ROAD_ANCIENT_FOREST_VISUAL_EXTENSION_BASE;
    const left=OLD_ROAD_ANCIENT_FOREST_VISUAL_EXTENSION_LEFT_CONTINUATION;
    const wedge=OLD_ROAD_ANCIENT_FOREST_VISUAL_EXTENSION_BOTTOM_WEDGE;
    // Contorno externo da união já aprovada. As junções internas não são bordas.
    const polygon=this.projectPolygon([
      {u:base.minU,v:base.minV},{u:base.maxU,v:base.minV},
      ...wedge,{u:left.minU,v:left.maxV}
    ]);
    // Emissores ancorados nas raízes e bases existentes, sem mover a composição.
    let tangleIndex=0;
    const anchors=this.forestMass.entries.filter(entry=>entry.kind==='hero'||entry.kind==='roots'||
      (entry.kind==='tangle'&&tangleIndex++%4===0));
    const bands=anchors.map((entry,i)=>{
      const hero=entry.kind==='hero';
      const x=entry.x,y=entry.y-(hero?entry.height*.13:0);
      const logical=this.territory.screenToLogical(x,y);
      return {type:hero?'broad':'ribbon',x,y,u:logical.u,v:logical.v,
        width:entry.width*(hero?2.5:3.2),height:hero?320:210,
        rotation:Math.sin(i*2.31)*.055,opacity:.82+(i%4)*.04,
        driftX:13+(i%5)*3,driftY:3+(i%3),speed:.055+(i%7)*.008,
        phase:i*2.39996323};
    }).filter(b=>this.isInsideApprovedCoverage(b.u,b.v));
    const forestDepth=this.forestMass.images[0]?.depth??this.territory.groundDepth(-69.8);
    this.fogZoneHandle=fog.registerZone({
      id:'old-road-sinister-forest',polygon,bands,
      constrainToPolygon:true,clearPath:this.visualRoadPath,
      clearRadius:VISUAL_ROAD_CLEAR_RADIUS,edgeFade:38,
      color:0xc1c1b2,nightColor:0xb8c8dc,density:.70,alphaGain:4,
      alphaLimits:{background:.46,mid:.64,foreground:.26},
      // A massa aprovada é um conjunto de tiles: fundo atrás deles, fios médios
      // e próximos acima, todos abaixo dos atores e da iluminação existente.
      layerDepths:{background:forestDepth-.05,mid:forestDepth+.03,foreground:forestDepth+.06},
      schedule:timeOfDayMs=>{
        const current=this.territory.oldRoadAncientForest?.forestFogIntensity(timeOfDayMs)??.18;
        // Reusa a curva e os horários existentes; corrige apenas o piso visual.
        return .32+.68*(current-.18)/.82;
      }
    });
  }

  build(){
    const baseLogical=rectanglePoints(OLD_ROAD_ANCIENT_FOREST_VISUAL_EXTENSION_BASE);
    const leftLogical=rectanglePoints(OLD_ROAD_ANCIENT_FOREST_VISUAL_EXTENSION_LEFT_CONTINUATION);
    const wedgeLogical=OLD_ROAD_ANCIENT_FOREST_VISUAL_EXTENSION_BOTTOM_WEDGE.map(point=>({...point}));

    const baseWorld=this.projectPolygon(baseLogical);
    const leftWorld=this.projectPolygon(leftLogical);
    const wedgeWorld=this.projectPolygon(wedgeLogical);
    const worldPolygons=[baseWorld,leftWorld,wedgeWorld];
    this.coverageWorldPolygons=worldPolygons;

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
    // v0.3.2-round01: toda a composição sinistra passa a usar o kit original
    // da Ancestral. Retirar da montagem as superfícies pantanosas, as teias e
    // as faixas antigas de raízes; preservar a estrada e o registro da névoa.
    this.buildVisualRoadContinuation();
    // As transições antigas atravessavam a borda aprovada. Preservar só seus
    // fragmentos EXTERNOS evita mudar a Ancestral, a estrada ou o gramado vizinho.
    // Dentro da Sinistra, nenhum pixel destes materiais antigos é desenhado.
    this.buildTransitionLayer();
    this.buildRoadsideSinisterGround();
    const exteriorMask=this.maskGraphics.createGeometryMask().setInvertAlpha(true);
    this.exteriorMask=exteriorMask;
    this.transitionLayer.setMask(exteriorMask);
    this.exteriorRoadsideLayer=this.scene.add.container(0,0)
      .setDepth(this.territory.groundDepth(-79.69)).setMask(exteriorMask);
    this.exteriorRoadsideLayer.add([...this.roadsideGroundSprites].sort((a,b)=>a.depth-b.depth));
    this.forestMass=new OldRoadSinisterForest(this);
    this.roadsideGroundCount=this.forestMass.summary.groundEntries;
    this.registerForestFog();

    const data={
      version:'v0.3.2-round01',
      purpose:'correcao-floresta-sinistra-base-round39',
      geometrySource:'v0.3.1-round13-approved',
      geometryFrozen:true,
      visualOnly:true,
      collision:false,
      expandsPlayableBounds:false,
      stage2:{
        largeTrees:true,largeLogs:true,spiderWebProps:false,roadExtension:true,
        groundAssets:{surfaces:[this.forestMass.summary.baseGroundKey],
          decals:this.forestMass.summary.assets.filter(path=>/floor|underbrush|thorn_cluster/.test(path)),transitions:[]},
        palette:{source:'arquivos originais da Floresta Ancestral',recolored:false}
      },
      stage3:{
        deadTreeMass:true,collision:false,
        assets:this.forestMass.summary.assets,
        count:this.forestMass.renderEntries.length,
        note:'v0.3.2-round01: árvores, troncos, raízes, espinhos e solo originais da Ancestral; escalas preservadas'
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
        sinisterForestAroundRoadStage:1,visualOnly:true,collision:false,
        treesAdded:true,bonesAdded:false,roadChanged:false,
        groundSprites:this.roadsideGroundCount,
        assets:this.forestMass.summary.assets,
        reference:'Floresta Ancestral original do Round 39',
        note:'Composição unificada; os dados dos emissores e as configurações de névoa do Round 39 permanecem idênticos.'
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
    this.fogZoneHandle?.destroy();
    this.fogZoneHandle=null;
    this.forestMass?.destroy();
    this.lowBorder?.destroy();
    this.exteriorRoadsideLayer?.destroy?.();
    this.exteriorMask?.destroy?.();
    this.textureLayer?.destroy?.(true);
    this.detailGraphics?.destroy?.();
    this.transitionLayer?.destroy?.(true);
    this.treeSprites?.forEach(sprite=>sprite?.destroy?.());
    this.visualRoadSprites?.forEach(sprite=>sprite?.destroy?.());
    this.roadsideGroundSprites?.forEach(sprite=>sprite?.destroy?.());
    this.graphics?.destroy?.();
    this.maskGraphics?.destroy?.();
    this.floorSprites=[];
    this.treeSprites=[];
    this.visualRoadSprites=[];
    this.visualRoadPath=[];
    this.roadsideGroundSprites=[];
    this.roadsideGroundCount=0;
    this.textureLayer=null;
    this.detailGraphics=null;
    this.transitionLayer=null;
    this.graphics=null;
    this.maskGraphics=null;
  }
}
