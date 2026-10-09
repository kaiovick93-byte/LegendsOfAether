// @ts-nocheck

/**
 * v0.3.1 Round 16 — chão sinistro + transições.
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

// Borda entre a floresta ancestral existente (lado do mapa) e o novo chão
// sombrio (lado da cobertura fora do mapa).
const FOREST_EDGE_TRANSITIONS=Object.freeze([
  [4.25,75.40,.34,.76,-.20,true],
  [3.55,76.30,.35,.78,-.16,true],
  [2.75,77.20,.36,.80,-.10,true],
  [1.90,78.00,.35,.80,-.04,true],
  [1.00,78.55,.34,.78,.02,true]
]);

// Borda onde o novo chão sombrio encosta no terreno verde já existente da
// faixa inferior aprovada (wedge do Round 13).
const GRASS_EDGE_TRANSITIONS=Object.freeze([]);

// Margens da estrada onde a cobertura toca a Estrada Velha no início do mapa.
const ROAD_EDGE_TRANSITIONS=Object.freeze([
  [1.10,82.25,.34,.80,-.24,true],
  [3.00,82.90,.36,.82,-.18,true],
  [5.10,83.85,.38,.82,-.10,true],
  [7.20,85.05,.38,.80,-.02,true],
  [8.70,86.20,.36,.78,.06,true]
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
    this.floorSprites=[];
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
      const baseA=this.scene.add.tileSprite(x,y,width,height,SURFACE_KEYS[0]).setOrigin(0,0).setAlpha(.64);
      baseA.tilePositionX=168;
      baseA.tilePositionY=96;
      baseA.tileScaleX=.52;
      baseA.tileScaleY=.52;
      container.add(baseA);
      this.floorSprites.push(baseA);
    }

    if(this.scene.textures.exists(SURFACE_KEYS[1])){
      const baseB=this.scene.add.tileSprite(x-48,y-36,width+96,height+72,SURFACE_KEYS[1]).setOrigin(0,0).setAlpha(.38);
      baseB.tilePositionX=392;
      baseB.tilePositionY=148;
      baseB.tileScaleX=.48;
      baseB.tileScaleY=.48;
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

    // Transições: a leitura do limite entre o mapa original e o novo chão
    // precisa ficar orgânica. As três famílias abaixo tratam exatamente das
    // bordas criticadas pelo usuário: floresta, grama e estrada.
    for(const [u,v,scale,alpha,rotation,flipX] of FOREST_EDGE_TRANSITIONS){
      this.addGroundDecal(container,DECAL_KEYS.forestToSwamp,u,v,{scale,alpha,rotation,flipX,originX:.82,originY:.56});
    }
    for(const [u,v,scale,alpha,rotation,flipX] of GRASS_EDGE_TRANSITIONS){
      this.addGroundDecal(container,DECAL_KEYS.grassToSwamp,u,v,{scale,alpha,rotation,flipX,originX:.80,originY:.56});
    }
    for(const [u,v,scale,alpha,rotation,flipX] of ROAD_EDGE_TRANSITIONS){
      this.addGroundDecal(container,DECAL_KEYS.roadToSwamp,u,v,{scale,alpha,rotation,flipX,originX:.82,originY:.56});
    }

    container.setMask(mask);
    this.textureLayer=container;
  }

  buildOrganicGroundDetails(mask){
    const rng=mulberry32(271828);
    const details=this.scene.add.graphics();
    details.setDepth(this.territory.groundDepth(-89.95));

    // Manchas suaves para quebrar repetição do tile, sem introduzir props altos.
    for(let i=0;i<40;i++){
      const u=-55+rng()*63;
      const v=49+rng()*51;
      if(!this.isInsideApprovedCoverage(u,v))continue;
      const p=this.territory.project(u,v);
      const w=120+rng()*220;
      const h=28+rng()*70;
      details.fillStyle(rng()>.55?0x1b241f:0x342c24,.07+rng()*.08);
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

    const data={
      version:'v0.3.1-round17-border-transition-fix',
      purpose:'sinister-forest-ground-with-transitions',
      geometrySource:'v0.3.1-round13-approved',
      geometryFrozen:true,
      visualOnly:true,
      collision:false,
      expandsPlayableBounds:false,
      stage2:{
        largeTrees:false,
        largeLogs:false,
        spiderWebProps:false,
        roadExtension:false,
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
    this.graphics?.destroy?.();
    this.maskGraphics?.destroy?.();
    this.floorSprites=[];
    this.textureLayer=null;
    this.detailGraphics=null;
    this.graphics=null;
    this.maskGraphics=null;
  }
}
