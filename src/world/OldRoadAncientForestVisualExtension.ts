// @ts-nocheck

/**
 * v0.3.1 Round 24 — Floresta Sinistra + reconstrução visual da Floresta Ancestral.
 *
 * Regras preservadas:
 * - A geometria aprovada no Round 13 continua CONGELADA.
 * - A área/colisão da Floresta Ancestral continua sendo a marcação histórica exata.
 * - Não altera bounds jogáveis, estrada, placa, cerca, escarpa ou gameplay.
 * - A referência visual aprovada é a fonte de verdade para a composição.
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

// Geometria autoritativa da Floresta Ancestral — mesma marcação histórica.
const ANCESTRAL_FOREST_POLYGON=Object.freeze([
  {u:0.000,v:48.969},{u:1.495,v:51.330},{u:1.952,v:52.779},
  {u:2.059,v:52.806},{u:2.220,v:52.672},{u:2.355,v:52.752},
  {u:3.242,v:54.228},{u:4.183,v:55.220},{u:4.747,v:56.159},
  {u:6.710,v:58.172},{u:7.220,v:58.950},{u:6.790,v:60.264},
  {u:7.059,v:61.606},{u:7.086,v:62.867},{u:6.952,v:63.538},
  {u:6.441,v:63.967},{u:5.634,v:63.994},{u:4.694,v:63.565},
  {u:3.296,v:63.404},{u:2.301,v:64.396},{u:1.952,v:65.094},
  {u:1.737,v:66.221},{u:1.925,v:67.187},{u:3.054,v:69.038},
  {u:4.425,v:70.809},{u:4.962,v:71.748},{u:5.124,v:72.419},
  {u:4.855,v:73.331},{u:4.909,v:73.975},{u:4.828,v:74.243},
  {u:4.048,v:75.182},{u:4.021,v:75.531},{u:3.699,v:75.933},
  {u:3.376,v:77.221},{u:2.866,v:78.214},{u:2.005,v:78.750},
  {u:1.468,v:78.885},{u:0.715,v:78.804},{u:0.231,v:79.019},
  {u:0.000,v:79.019}
]);

const ANCESTRAL_START_CLEAR_ZONE=Object.freeze({u:3.027,v:76.443,radius:.78});

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

const SINISTER_FOREST_KEYS=Object.freeze({
  wall:'sinister_forest_wall_mass_01',
  grove:'sinister_forest_grove_roots_01',
  hero:'sinister_forest_hero_tree_01',
  clearing:'sinister_forest_ground_clearing_01',
  webRoots:'sinister_forest_web_roots_01',
  corruptionTransition:'sinister_forest_corruption_transition_01'
});

// Massa da floresta sinistra fora do mapa — Round 22 aprovado como base.
const SINISTER_MASS_SETTINGS=Object.freeze({
  background:{startU:-54,endU:-6.0,stepU:6.3,startV:51.0,endV:98.0,stepV:6.2,rowOffset:3.0},
  middle:{startU:-51,endU:-4.6,stepU:7.4,startV:53.5,endV:97.0,stepV:7.0,rowOffset:3.5}
});

const SINISTER_HERO_TREES=Object.freeze([
  [-48.0,55.0,.78,false,.98,-.03],[-38.5,58.5,.74,true,.98,-.02],
  [-29.0,62.0,.80,false,.99,-.01],[-19.5,66.0,.76,true,.99,.00],
  [-10.5,70.0,.74,false,.99,.01],[-5.2,74.0,.70,true,.98,.02],
  [-45.0,76.0,.82,true,.98,-.01],[-34.0,81.0,.78,false,.99,.00],
  [-23.0,86.0,.76,true,.99,.01],[-13.0,91.0,.74,false,.99,.02],
  [-5.5,95.0,.70,true,.98,.03]
]);

const SINISTER_EDGE_ROOTS=Object.freeze([
  [-3.8,58.0,.34,false,-.10,.90],[-3.2,65.5,.32,true,.04,.90],
  [-2.8,72.5,.34,false,-.06,.92],[-2.4,78.0,.31,true,.05,.92],
  [-2.0,86.0,.30,false,-.08,.90],[-1.6,94.0,.28,true,.03,.88]
]);

const SINISTER_GROUND_CLUSTERS=Object.freeze([
  [-48,57,.34,false,-.08,.72],[-38,63,.32,true,.05,.70],[-28,69,.34,false,-.03,.74],
  [-18,75,.32,true,.08,.72],[-9,81,.30,false,-.05,.72],[-44,86,.34,true,.04,.70],
  [-31,91,.32,false,-.07,.72],[-18,96,.31,true,.06,.70],[-7,98,.28,false,-.04,.68]
]);

const SINISTER_CORRUPTION_EDGE=Object.freeze([
  [-1.6,55.0,.29,.82,-.08,false],[-1.4,63.0,.28,.84,.05,true],
  [-1.2,71.0,.28,.86,-.04,false],[-1.0,77.0,.26,.86,.03,true],
  [-0.8,88.0,.25,.82,-.05,false],[-0.6,96.0,.24,.80,.04,true]
]);

// Reconstrução da Floresta Ancestral segundo a imagem de referência:
// parede fechada de fundo + raízes intermediárias + árvores dominantes na frente.
const ANCESTRAL_MASS_SETTINGS=Object.freeze({
  background:{startU:.35,endU:6.9,stepU:2.05,startV:50.0,endV:78.4,stepV:3.45,rowOffset:.95},
  middle:{startU:.65,endU:6.6,stepU:2.35,startV:51.0,endV:78.0,stepV:3.85,rowOffset:1.10}
});

const ANCESTRAL_HERO_TREES=Object.freeze([
  [0.76,52.0,.34,false,.99,-.02],[2.15,54.8,.33,true,.99,-.01],
  [4.20,56.7,.35,false,.99,.00],[6.10,59.1,.32,true,.99,.00],
  [4.95,62.0,.34,false,.99,.01],[2.70,63.6,.33,true,.99,.01],
  [1.10,66.2,.35,false,.99,.01],[2.35,69.2,.34,true,.99,.02],
  [4.20,71.5,.35,false,.99,.02],[4.05,74.2,.33,true,.99,.02],
  [2.10,77.6,.34,false,.99,.03],[0.85,78.0,.32,true,.99,.03]
]);

const ANCESTRAL_GROUND_CLUSTERS=Object.freeze([
  [0.70,51.8,.22,false,-.05,.82],[1.65,54.8,.23,true,.04,.84],
  [3.50,56.8,.24,false,-.03,.86],[5.55,59.2,.23,true,.05,.84],
  [5.85,62.3,.22,false,-.04,.83],[3.55,63.8,.23,true,.06,.85],
  [1.55,65.2,.22,false,-.05,.84],[1.65,68.2,.23,true,.04,.84],
  [3.15,70.5,.24,false,-.03,.86],[4.25,72.4,.23,true,.05,.85],
  [3.35,74.7,.22,false,-.04,.83],[1.45,78.0,.22,true,.04,.82]
]);

const ANCESTRAL_WEB_ROOTS=Object.freeze([
  [0.62,53.1,.19,false,-.08,.94],[2.65,55.5,.20,true,.05,.95],
  [5.20,58.2,.20,false,-.05,.95],[6.10,61.7,.19,true,.04,.94],
  [3.75,63.6,.20,false,-.06,.95],[1.35,66.0,.19,true,.05,.94],
  [2.25,69.0,.20,false,-.04,.95],[4.20,71.9,.20,true,.04,.95],
  [3.75,74.8,.19,false,-.05,.94],[1.55,77.7,.19,true,.04,.94]
]);

const SWAMP_PATCHES=Object.freeze([
  [-48.2,55.4,.20,.34,-.10,false],[-39.6,61.1,.18,.36,.08,true],
  [-29.4,66.6,.22,.34,-.04,false],[-18.7,71.8,.19,.33,.14,true],
  [-10.1,76.3,.17,.35,-.08,false],[-44.3,82.2,.21,.30,.10,true],
  [-33.8,87.4,.18,.32,-.12,false],[-22.0,92.6,.20,.31,.06,true],
  [-11.2,96.4,.17,.30,-.10,false],[2.6,88.8,.18,.28,.10,true]
]);

const DEBRIS_PATCHES=Object.freeze([
  [-52.0,52.8,.13,.32,-.18,false],[-45.0,58.8,.15,.28,.10,true],
  [-35.2,63.2,.14,.30,-.06,false],[-25.6,68.2,.13,.28,.12,true],
  [-16.6,73.0,.15,.27,-.14,false],[-7.8,77.2,.12,.30,.06,true],
  [-48.6,80.8,.14,.27,-.10,false],[-39.4,85.0,.13,.27,.14,true],
  [-29.1,89.5,.15,.28,-.08,false],[-18.5,94.0,.13,.27,.11,true],
  [-9.0,98.0,.12,.25,-.12,false],[3.8,86.0,.14,.24,.05,true]
]);

const LEAF_PILES=Object.freeze([
  [-49.8,56.8,.11,.34,.06,false],[-42.4,60.0,.10,.36,-.09,true],
  [-32.8,65.4,.12,.35,.04,false],[-22.7,70.6,.11,.34,.10,true],
  [-13.6,75.7,.10,.33,-.07,false],[-5.1,79.0,.12,.34,.08,true],
  [-46.2,84.0,.11,.32,-.04,false],[-35.6,88.6,.10,.33,.07,true],
  [-25.0,93.1,.11,.31,-.09,false],[-13.1,97.2,.10,.30,.05,true],
  [1.3,84.8,.10,.28,-.03,false],[4.9,90.6,.11,.26,.08,true]
]);

const ROOT_ACCENTS=Object.freeze([
  [-46.8,57.3,.16,.26,-.18,false],[-35.0,64.5,.17,.24,.08,true],
  [-23.0,71.2,.18,.24,-.12,false],[-11.4,77.8,.17,.22,.16,true],
  [-31.5,87.2,.18,.22,-.10,false],[-14.3,96.0,.18,.20,.12,true]
]);

// Borda vermelha aprovada pelo usuário — não alterar.
const FOREST_EDGE_TRANSITIONS=Object.freeze([
  [0.000,80.42,.16,.90,-2.6779450446,true]
]);
const GRASS_EDGE_TRANSITIONS=Object.freeze([
  [1.70,82.000,.18,.90,2.6779450446,true],
  [4.55,82.000,.18,.90,2.6779450446,true],
  [7.55,82.000,.18,.90,2.6779450446,true]
]);
const ROAD_EDGE_TRANSITIONS=Object.freeze([
  [0.000,82.000,.16,.92,3.1415926536,true]
]);

const rectanglePoints=b=>[
  {u:b.minU,v:b.minV},{u:b.maxU,v:b.minV},
  {u:b.maxU,v:b.maxV},{u:b.minU,v:b.maxV}
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

function worldBoundsFromPolygons(polygons=[]){
  let minX=Infinity,minY=Infinity,maxX=-Infinity,maxY=-Infinity;
  for(const poly of polygons)for(const p of poly){
    if(p.x<minX)minX=p.x;if(p.y<minY)minY=p.y;
    if(p.x>maxX)maxX=p.x;if(p.y>maxY)maxY=p.y;
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
    this.ancestralMaskGraphics=null;
    this.detailGraphics=null;
    this.transitionLayer=null;
    this.floorSprites=[];
    this.treeSprites=[];
    this.ancestralSprites=[];
    this.ancestralGroundSprites=[];
    this.sinisterMassCount=0;
    this.ancestralMassCount=0;
    this.legacyAncestralHidden=false;
    this.build();
    // A Floresta Ancestral histórica é criada depois desta extensão em AetherTerritory.
    // Ocultamos somente seus sprites visuais após a montagem, preservando colisão,
    // sombras, névoa e todos os sistemas de gameplay originais.
    this.scene.events.once('postupdate',this.syncAncestralReferenceReplacement,this);
  }

  projectPolygon(logicalPoints){return logicalPoints.map(({u,v})=>this.territory.project(u,v))}

  drawWorldPolygon(graphics,worldPoints){
    graphics.beginPath();graphics.moveTo(worldPoints[0].x,worldPoints[0].y);
    for(let i=1;i<worldPoints.length;i++)graphics.lineTo(worldPoints[i].x,worldPoints[i].y);
    graphics.closePath();graphics.fillPath();
  }

  isInsideApprovedCoverage(u,v){
    if(u>=OLD_ROAD_ANCIENT_FOREST_VISUAL_EXTENSION_BASE.minU&&u<=OLD_ROAD_ANCIENT_FOREST_VISUAL_EXTENSION_BASE.maxU&&
       v>=OLD_ROAD_ANCIENT_FOREST_VISUAL_EXTENSION_BASE.minV&&v<=OLD_ROAD_ANCIENT_FOREST_VISUAL_EXTENSION_BASE.maxV)return true;
    if(u>=OLD_ROAD_ANCIENT_FOREST_VISUAL_EXTENSION_LEFT_CONTINUATION.minU&&u<=OLD_ROAD_ANCIENT_FOREST_VISUAL_EXTENSION_LEFT_CONTINUATION.maxU&&
       v>=OLD_ROAD_ANCIENT_FOREST_VISUAL_EXTENSION_LEFT_CONTINUATION.minV&&v<=OLD_ROAD_ANCIENT_FOREST_VISUAL_EXTENSION_LEFT_CONTINUATION.maxV)return true;
    return pointInPolygon(u,v,OLD_ROAD_ANCIENT_FOREST_VISUAL_EXTENSION_BOTTOM_WEDGE);
  }

  isInsideAncestralForest(u,v){
    if(!pointInPolygon(u,v,ANCESTRAL_FOREST_POLYGON))return false;
    const du=u-ANCESTRAL_START_CLEAR_ZONE.u,dv=v-ANCESTRAL_START_CLEAR_ZONE.v;
    return (du*du+dv*dv)>(ANCESTRAL_START_CLEAR_ZONE.radius*ANCESTRAL_START_CLEAR_ZONE.radius);
  }

  buildMask(worldPolygons){
    const maskGraphics=this.scene.make.graphics({x:0,y:0,add:false});
    maskGraphics.fillStyle(0xffffff,1);
    for(const points of worldPolygons)this.drawWorldPolygon(maskGraphics,points);
    const mask=maskGraphics.createGeometryMask();this.maskGraphics=maskGraphics;return mask;
  }

  buildAncestralMask(){
    const graphics=this.scene.make.graphics({x:0,y:0,add:false});
    graphics.fillStyle(0xffffff,1);
    this.drawWorldPolygon(graphics,this.projectPolygon(ANCESTRAL_FOREST_POLYGON));
    const mask=graphics.createGeometryMask();this.ancestralMaskGraphics=graphics;return mask;
  }

  addGroundDecal(container,key,u,v,{scale=.2,alpha=.3,rotation=0,flipX=false,flipY=false,originX=.5,originY=.5,tint=null,depthBias=0}={}){
    if(!this.isInsideApprovedCoverage(u,v)||!this.scene.textures.exists(key))return null;
    const p=this.territory.project(u,v);
    const sprite=this.scene.add.image(p.x,p.y,key).setOrigin(originX,originY).setScale(scale).setAlpha(alpha)
      .setRotation(rotation).setFlipX(flipX).setFlipY(flipY);
    if(tint!=null)sprite.setTint(tint);
    if(depthBias)sprite.setDepth(this.territory.groundDepth(-89.96+depthBias));
    container.add(sprite);this.floorSprites.push(sprite);return sprite;
  }

  addTransitionDecal(container,key,u,v,{scale=.16,alpha=.9,rotation=0,flipX=false,flipY=false,originX=.5,originY=.5}={}){
    if(!this.scene.textures.exists(key))return null;
    const p=this.territory.project(u,v);
    const sprite=this.scene.add.image(p.x,p.y,key).setOrigin(originX,originY).setScale(scale).setAlpha(alpha)
      .setRotation(rotation).setFlipX(flipX).setFlipY(flipY);
    container.add(sprite);this.floorSprites.push(sprite);return sprite;
  }

  addSinisterVertical(key,u,v,{scale=.7,alpha=1,flipX=false,depthOffset=0,tint=null}={}){
    if(!this.isInsideApprovedCoverage(u,v)||!this.scene.textures.exists(key))return null;
    const p=this.territory.project(u,v),source=this.scene.textures.get(key)?.getSourceImage?.();
    const originY=source?.height?Math.max(.90,Math.min(1,(source.height-18)/source.height)):.96;
    const sprite=this.scene.add.image(p.x,p.y,key).setOrigin(.5,originY).setScale(scale).setAlpha(alpha)
      .setFlipX(flipX).setDepth(this.territory.depthAt(u,v,.10+depthOffset));
    if(tint!=null)sprite.setTint(tint);this.treeSprites.push(sprite);return sprite;
  }

  addSinisterGround(key,u,v,{scale=.3,alpha=.75,rotation=0,flipX=false,depthBias=0,mask=null}={}){
    if(!this.isInsideApprovedCoverage(u,v)||!this.scene.textures.exists(key))return null;
    const p=this.territory.project(u,v);
    const sprite=this.scene.add.image(p.x,p.y,key).setOrigin(.5,.58).setScale(scale).setAlpha(alpha)
      .setRotation(rotation).setFlipX(flipX).setDepth(this.territory.groundDepth(-89.70+depthBias));
    if(mask)sprite.setMask(mask);this.floorSprites.push(sprite);return sprite;
  }

  addAncestralVertical(key,u,v,{scale=.31,alpha=.99,flipX=false,depthOffset=0}={}){
    if(!this.isInsideAncestralForest(u,v)||!this.scene.textures.exists(key))return null;
    const p=this.territory.project(u,v),source=this.scene.textures.get(key)?.getSourceImage?.();
    const originY=source?.height?Math.max(.90,Math.min(1,(source.height-18)/source.height)):.96;
    const sprite=this.scene.add.image(p.x,p.y,key).setOrigin(.5,originY).setScale(scale).setAlpha(alpha)
      .setFlipX(flipX).setDepth(this.territory.depthAt(u,v,.12+depthOffset));
    sprite.setData('ancestralSinisterReference',{u,v,key,layer:'vertical',round:24});
    this.ancestralSprites.push(sprite);return sprite;
  }

  addAncestralGround(key,u,v,{scale=.22,alpha=.86,rotation=0,flipX=false,depthBias=0,mask=null}={}){
    if(!this.isInsideAncestralForest(u,v)||!this.scene.textures.exists(key))return null;
    const p=this.territory.project(u,v);
    const sprite=this.scene.add.image(p.x,p.y,key).setOrigin(.5,.58).setScale(scale).setAlpha(alpha)
      .setRotation(rotation).setFlipX(flipX).setDepth(this.territory.groundDepth(-70.39+depthBias));
    if(mask)sprite.setMask(mask);
    sprite.setData('ancestralSinisterReference',{u,v,key,layer:'ground',round:24});
    this.ancestralGroundSprites.push(sprite);return sprite;
  }

  buildSinisterForestMass(mask){
    const rng=mulberry32(220126);let count=0;
    for(const [u,v,scale,flipX,rotation,alpha] of SINISTER_GROUND_CLUSTERS)
      if(this.addSinisterGround(SINISTER_FOREST_KEYS.clearing,u,v,{scale,flipX,rotation,alpha,mask}))count++;
    for(const [u,v,scale,alpha,rotation,flipX] of SINISTER_CORRUPTION_EDGE)
      if(this.addSinisterGround(SINISTER_FOREST_KEYS.corruptionTransition,u,v,{scale,alpha,rotation,flipX,mask,depthBias:.02}))count++;

    const bg=SINISTER_MASS_SETTINGS.background;let row=0;
    for(let v=bg.startV;v<=bg.endV;v+=bg.stepV,row++){
      const off=row%2?bg.rowOffset:0;
      for(let u=bg.startU+off;u<=bg.endU;u+=bg.stepU){
        const uu=u+(rng()-.5)*1.25,vv=v+(rng()-.5)*1.05;
        if(!this.isInsideApprovedCoverage(uu,vv))continue;
        if(this.addSinisterVertical(SINISTER_FOREST_KEYS.wall,uu,vv,{scale:.56+rng()*.09,alpha:.90+rng()*.08,flipX:rng()>.5,depthOffset:-.04}))count++;
      }
    }

    const mid=SINISTER_MASS_SETTINGS.middle;row=0;
    for(let v=mid.startV;v<=mid.endV;v+=mid.stepV,row++){
      const off=row%2?mid.rowOffset:0;
      for(let u=mid.startU+off;u<=mid.endU;u+=mid.stepU){
        const uu=u+(rng()-.5)*1.6,vv=v+(rng()-.5)*1.35;
        if(!this.isInsideApprovedCoverage(uu,vv))continue;
        if(this.addSinisterVertical(SINISTER_FOREST_KEYS.grove,uu,vv,{scale:.58+rng()*.11,alpha:.92+rng()*.07,flipX:rng()>.5,depthOffset:.01}))count++;
      }
    }

    for(const [u,v,scale,flipX,alpha,depthOffset] of SINISTER_HERO_TREES)
      if(this.addSinisterVertical(SINISTER_FOREST_KEYS.hero,u,v,{scale,flipX,alpha,depthOffset}))count++;
    for(const [u,v,scale,flipX,rotation,alpha] of SINISTER_EDGE_ROOTS)
      if(this.addSinisterGround(SINISTER_FOREST_KEYS.webRoots,u,v,{scale,flipX,rotation,alpha,mask,depthBias:.04}))count++;
    this.sinisterMassCount=count;
  }

  buildAncestralReferenceMass(){
    const rng=mulberry32(241024);let count=0;
    const mask=this.buildAncestralMask();

    // Chão contínuo de folhas mortas/raízes — elimina os vazios verdes da composição antiga.
    for(const [u,v,scale,flipX,rotation,alpha] of ANCESTRAL_GROUND_CLUSTERS){
      if(this.addAncestralGround(SINISTER_FOREST_KEYS.clearing,u,v,{scale,flipX,rotation,alpha,mask}))count++;
    }
    for(const [u,v,scale,flipX,rotation,alpha] of ANCESTRAL_WEB_ROOTS){
      if(this.addAncestralGround(SINISTER_FOREST_KEYS.webRoots,u,v,{scale,flipX,rotation,alpha,mask,depthBias:.03}))count++;
    }

    // Camada 1 — muralha fechada de árvores. Pequeno espaçamento + sobreposição forte.
    const bg=ANCESTRAL_MASS_SETTINGS.background;let row=0;
    for(let v=bg.startV;v<=bg.endV;v+=bg.stepV,row++){
      const off=row%2?bg.rowOffset:0;
      for(let u=bg.startU+off;u<=bg.endU;u+=bg.stepU){
        const uu=u+(rng()-.5)*.52,vv=v+(rng()-.5)*.62;
        if(!this.isInsideAncestralForest(uu,vv))continue;
        if(this.addAncestralVertical(SINISTER_FOREST_KEYS.wall,uu,vv,{scale:.30+rng()*.055,alpha:.96+rng()*.035,flipX:rng()>.5,depthOffset:-.08}))count++;
      }
    }

    // Camada 2 — raízes e bosque retorcido cobrindo as emendas do fundo.
    const mid=ANCESTRAL_MASS_SETTINGS.middle;row=0;
    for(let v=mid.startV;v<=mid.endV;v+=mid.stepV,row++){
      const off=row%2?mid.rowOffset:0;
      for(let u=mid.startU+off;u<=mid.endU;u+=mid.stepU){
        const uu=u+(rng()-.5)*.66,vv=v+(rng()-.5)*.72;
        if(!this.isInsideAncestralForest(uu,vv))continue;
        if(this.addAncestralVertical(SINISTER_FOREST_KEYS.grove,uu,vv,{scale:.285+rng()*.055,alpha:.97+rng()*.025,flipX:rng()>.5,depthOffset:-.015}))count++;
      }
    }

    // Camada 3 — árvores hero maiores na frente, seguindo a leitura da referência aprovada.
    for(const [u,v,scale,flipX,alpha,depthOffset] of ANCESTRAL_HERO_TREES){
      if(this.addAncestralVertical(SINISTER_FOREST_KEYS.hero,u,v,{scale,flipX,alpha,depthOffset}))count++;
    }

    this.ancestralMassCount=count;
  }

  syncAncestralReferenceReplacement(){
    const legacy=this.territory.oldRoadAncientForest;
    if(!legacy){
      this.scene.events.once('postupdate',this.syncAncestralReferenceReplacement,this);
      return;
    }

    for(const sprite of legacy.sprites??[])sprite?.setVisible?.(false);
    this.legacyAncestralHidden=true;

    // Preservar a lanterna/placa à frente apenas quando houver sobreposição real.
    const lanternEntry=this.territory.oldRoadProps?.props?.find?.(prop=>prop.role==='start-sign-lantern');
    const lantern=lanternEntry?.sprite;
    if(lantern?.getBounds){
      const lanternBounds=lantern.getBounds();let maxDepth=-Infinity;
      for(const sprite of this.ancestralSprites){
        if(!sprite?.getBounds)continue;
        if(Phaser.Geom.Intersects.RectangleToRectangle(lanternBounds,sprite.getBounds()))maxDepth=Math.max(maxDepth,sprite.depth);
      }
      if(maxDepth>-Infinity&&lantern.depth<=maxDepth)lantern.setDepth(maxDepth+.01);
    }

    this.scene.registry.set('ancestralSinisterReferenceReplacement',{
      version:'v0.3.1-round24-reference-rebuild',
      reference:'floresta-sinistra-aprovada',
      geometryPreserved:true,
      collisionPreserved:true,
      legacyVisualSpritesHidden:(legacy.sprites??[]).length,
      newVisualSprites:this.ancestralSprites.length,
      newGroundSprites:this.ancestralGroundSprites.length,
      massCount:this.ancestralMassCount,
      layers:['dead-leaf-root-ground','wall-background','grove-middle','hero-front']
    });
  }

  buildTransitionLayer(){
    const container=this.scene.add.container(0,0).setDepth(this.territory.groundDepth(-79.55));
    for(const [u,v,scale,alpha,rotation,flipX] of FOREST_EDGE_TRANSITIONS)
      this.addTransitionDecal(container,DECAL_KEYS.forestToSwamp,u,v,{scale,alpha,rotation,flipX});
    for(const [u,v,scale,alpha,rotation,flipX] of GRASS_EDGE_TRANSITIONS)
      this.addTransitionDecal(container,DECAL_KEYS.grassToSwamp,u,v,{scale,alpha,rotation,flipX});
    for(const [u,v,scale,alpha,rotation,flipX] of ROAD_EDGE_TRANSITIONS)
      this.addTransitionDecal(container,DECAL_KEYS.roadToSwamp,u,v,{scale,alpha,rotation,flipX});
    this.transitionLayer=container;
  }

  buildFloorTextureLayer(mask,worldPolygons){
    const depth=this.territory.groundDepth(-89.96),container=this.scene.add.container(0,0).setDepth(depth);
    const bounds=worldBoundsFromPolygons(worldPolygons),pad=160;
    const x=bounds.minX-pad,y=bounds.minY-pad,width=Math.ceil(bounds.width+pad*2),height=Math.ceil(bounds.height+pad*2);

    if(this.scene.textures.exists(SURFACE_KEYS[0])){
      const baseA=this.scene.add.tileSprite(x,y,width,height,SURFACE_KEYS[0]).setOrigin(0,0).setAlpha(.64);
      baseA.tilePositionX=168;baseA.tilePositionY=96;baseA.tileScaleX=.52;baseA.tileScaleY=.52;
      container.add(baseA);this.floorSprites.push(baseA);
    }
    if(this.scene.textures.exists(SURFACE_KEYS[1])){
      const baseB=this.scene.add.tileSprite(x-48,y-36,width+96,height+72,SURFACE_KEYS[1]).setOrigin(0,0).setAlpha(.38);
      baseB.tilePositionX=392;baseB.tilePositionY=148;baseB.tileScaleX=.48;baseB.tileScaleY=.48;
      container.add(baseB);this.floorSprites.push(baseB);
    }

    const veil=this.scene.add.rectangle(bounds.minX+bounds.width/2,bounds.minY+bounds.height/2,width,height,0x17211d,.12);
    container.add(veil);this.floorSprites.push(veil);

    for(const [u,v,scale,alpha,rotation,flipX] of SWAMP_PATCHES)
      this.addGroundDecal(container,DECAL_KEYS.swamp,u,v,{scale,alpha,rotation,flipX,originY:.54});
    for(const [u,v,scale,alpha,rotation,flipX] of DEBRIS_PATCHES)
      this.addGroundDecal(container,DECAL_KEYS.debris,u,v,{scale,alpha,rotation,flipX,originY:.54});
    for(const [u,v,scale,alpha,rotation,flipX] of LEAF_PILES)
      this.addGroundDecal(container,DECAL_KEYS.leafPile,u,v,{scale,alpha,rotation,flipX,originY:.56});
    for(const [u,v,scale,alpha,rotation,flipX] of ROOT_ACCENTS)
      this.addGroundDecal(container,DECAL_KEYS.roots,u,v,{scale,alpha,rotation,flipX,originY:.58});

    container.setMask(mask);this.textureLayer=container;
  }

  buildOrganicGroundDetails(mask){
    const rng=mulberry32(271828),details=this.scene.add.graphics();
    details.setDepth(this.territory.groundDepth(-89.95));
    for(let i=0;i<40;i++){
      const u=-55+rng()*63,v=49+rng()*51;if(!this.isInsideApprovedCoverage(u,v))continue;
      const p=this.territory.project(u,v),w=120+rng()*220,h=28+rng()*70;
      details.fillStyle(rng()>.55?0x1b241f:0x342c24,.07+rng()*.08);details.fillEllipse(p.x,p.y,w,h);
    }
    details.setMask(mask);this.detailGraphics=details;
  }

  build(){
    const baseLogical=rectanglePoints(OLD_ROAD_ANCIENT_FOREST_VISUAL_EXTENSION_BASE);
    const leftLogical=rectanglePoints(OLD_ROAD_ANCIENT_FOREST_VISUAL_EXTENSION_LEFT_CONTINUATION);
    const wedgeLogical=OLD_ROAD_ANCIENT_FOREST_VISUAL_EXTENSION_BOTTOM_WEDGE.map(point=>({...point}));
    const baseWorld=this.projectPolygon(baseLogical),leftWorld=this.projectPolygon(leftLogical),wedgeWorld=this.projectPolygon(wedgeLogical);
    const worldPolygons=[baseWorld,leftWorld,wedgeWorld];

    const graphics=this.scene.add.graphics();graphics.setDepth(this.territory.groundDepth(-90));
    graphics.fillStyle(BASE_SOIL_COLOR,1);this.drawWorldPolygon(graphics,baseWorld);this.drawWorldPolygon(graphics,leftWorld);this.drawWorldPolygon(graphics,wedgeWorld);
    graphics.fillStyle(BASE_SOIL_SECONDARY,.40);
    const pA=this.territory.project(-29,66),pB=this.territory.project(-31,88);
    graphics.fillEllipse(pA.x,pA.y,1320,420);graphics.fillEllipse(pB.x,pB.y,1180,360);
    graphics.fillStyle(BASE_SOIL_SHADOW,.28);const pC=this.territory.project(-48,74);graphics.fillEllipse(pC.x,pC.y,920,300);

    const mask=this.buildMask(worldPolygons);graphics.setMask(mask);
    this.buildFloorTextureLayer(mask,worldPolygons);
    this.buildOrganicGroundDetails(mask);
    this.buildTransitionLayer();
    this.buildSinisterForestMass(mask);
    this.buildAncestralReferenceMass();

    const data={
      version:'v0.3.1-round24-ancestral-reference-rebuild',
      purpose:'sinister-reference-mass-plus-ancestral-reference-rebuild',
      geometrySource:'v0.3.1-round13-approved + ancestral-marked-polygon',
      geometryFrozen:true,visualOnly:true,collision:false,expandsPlayableBounds:false,
      sinisterMass:{assets:Object.values(SINISTER_FOREST_KEYS),count:this.sinisterMassCount,layers:['ground-organic','background-wall','middle-grove','hero-front','web-root-edge']},
      ancestralRebuild:{sameAssets:true,count:this.ancestralMassCount,polygon:ANCESTRAL_FOREST_POLYGON.map(p=>({...p})),layers:['dead-leaf-root-ground','wall-background','grove-middle','hero-front'],collisionPreserved:true},
      approvedBase:{bounds:{...OLD_ROAD_ANCIENT_FOREST_VISUAL_EXTENSION_BASE},logicalPoints:baseLogical.map(point=>({...point})),worldPoints:baseWorld.map(point=>({x:point.x,y:point.y}))},
      approvedCorrections:{
        leftContinuation:{bounds:{...OLD_ROAD_ANCIENT_FOREST_VISUAL_EXTENSION_LEFT_CONTINUATION},logicalPoints:leftLogical.map(point=>({...point})),worldPoints:leftWorld.map(point=>({x:point.x,y:point.y}))},
        bottomWedge:{logicalPoints:wedgeLogical.map(point=>({...point})),worldPoints:wedgeWorld.map(point=>({x:point.x,y:point.y}))}
      }
    };
    graphics.setData?.('oldRoadAncientForestVisualExtension',data);this.graphics=graphics;
    this.scene.registry.set('oldRoadAncientForestVisualExtension',data);
  }

  destroy(){
    this.scene?.events?.off?.('postupdate',this.syncAncestralReferenceReplacement,this);
    if(this.legacyAncestralHidden){
      for(const sprite of this.territory.oldRoadAncientForest?.sprites??[])sprite?.setVisible?.(true);
    }
    this.textureLayer?.destroy?.(true);this.detailGraphics?.destroy?.();this.transitionLayer?.destroy?.(true);
    this.treeSprites?.forEach(sprite=>sprite?.destroy?.());
    this.ancestralSprites?.forEach(sprite=>sprite?.destroy?.());
    this.ancestralGroundSprites?.forEach(sprite=>sprite?.destroy?.());
    this.graphics?.destroy?.();this.maskGraphics?.destroy?.();this.ancestralMaskGraphics?.destroy?.();
    this.floorSprites=[];this.treeSprites=[];this.ancestralSprites=[];this.ancestralGroundSprites=[];
    this.textureLayer=null;this.detailGraphics=null;this.transitionLayer=null;this.graphics=null;this.maskGraphics=null;this.ancestralMaskGraphics=null;
  }
}
