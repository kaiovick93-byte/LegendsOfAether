// @ts-nocheck

/**
 * v0.3.1 Round 14 — ETAPA 2
 *
 * A geometria aprovada no Round 13 permanece CONGELADA.
 * Esta etapa troca apenas o preenchimento provisório de validação por uma
 * base visual de floresta sinistra: solo frio/escuro, manchas orgânicas e
 * cobertura baixa usando SOMENTE assets de chão já existentes.
 *
 * Não cria árvores, troncos grandes, teias, estrada, colisão, interação ou
 * expansão de bounds. Nenhuma geometria aprovada é alterada.
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

const BASE_SOIL_COLOR=0x1f2b27;
const BASE_SOIL_SECONDARY=0x2b3128;
const BASE_SOIL_SHADOW=0x141d1b;
const LEAF_COLOR_A=0x4a3a2c;
const LEAF_COLOR_B=0x5a4630;
const FLOOR_KEYS=Object.freeze([
  'ancient_forest_floor_02',
  'ancient_forest_floor_03',
  'ancient_forest_floor_06',
  'ancient_forest_floor_01'
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

  buildFloorTextureLayer(mask){
    const depth=this.territory.groundDepth(-89.96);
    const container=this.scene.add.container(0,0).setDepth(depth);
    const rng=mulberry32(314159);

    // Grade lógica determinística. Como o container recebe a máscara aprovada,
    // nenhum pixel de textura pode escapar para dentro do mapa jogável.
    for(let v=50;v<=99;v+=3.6){
      for(let u=-55;u<=8.4;u+=4.2){
        const ju=u+(rng()-.5)*1.8;
        const jv=v+(rng()-.5)*1.5;
        if(!this.isInsideApprovedCoverage(ju,jv))continue;
        const key=FLOOR_KEYS[Math.floor(rng()*FLOOR_KEYS.length)%FLOOR_KEYS.length];
        if(!this.scene.textures.exists(key))continue;
        const p=this.territory.project(ju,jv);
        const sprite=this.scene.add.image(p.x,p.y,key)
          .setOrigin(.5,.72)
          .setScale(.82+rng()*.34)
          .setRotation((rng()-.5)*.18)
          .setFlipX(rng()>.5)
          .setAlpha(.38+rng()*.20)
          .setTint(rng()>.45?0x58665b:0x4a584f);
        container.add(sprite);
        this.floorSprites.push(sprite);
      }
    }

    container.setMask(mask);
    this.textureLayer=container;
  }

  buildOrganicGroundDetails(mask){
    const rng=mulberry32(271828);
    const details=this.scene.add.graphics();
    details.setDepth(this.territory.groundDepth(-89.95));

    // Manchas maiores de terra fria e sombra para quebrar a uniformidade do
    // preenchimento sem introduzir props ou volumes altos.
    for(let i=0;i<150;i++){
      const u=-55+rng()*63;
      const v=49+rng()*51;
      if(!this.isInsideApprovedCoverage(u,v))continue;
      const p=this.territory.project(u,v);
      const w=45+rng()*105;
      const h=14+rng()*42;
      details.fillStyle(rng()>.55?0x27302b:0x3a3027,.10+rng()*.13);
      details.fillEllipse(p.x,p.y,w,h);
    }

    // Folhas secas muito discretas: detalhe de solo, não decoração/prop.
    for(let i=0;i<420;i++){
      const u=-55+rng()*63;
      const v=49+rng()*51;
      if(!this.isInsideApprovedCoverage(u,v))continue;
      const p=this.territory.project(u,v);
      const radius=1.1+rng()*2.0;
      details.fillStyle(rng()>.5?LEAF_COLOR_A:LEAF_COLOR_B,.18+rng()*.18);
      details.fillEllipse(p.x,p.y,radius*2.8,radius*1.25);
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

    // Camada sólida: mantém 100% da cobertura geométrica aprovada e elimina
    // qualquer risco de reaparecimento do preto entre texturas transparentes.
    const graphics=this.scene.add.graphics();
    graphics.setDepth(this.territory.groundDepth(-90));
    graphics.fillStyle(BASE_SOIL_COLOR,1);
    this.drawWorldPolygon(graphics,baseWorld);
    this.drawWorldPolygon(graphics,leftWorld);
    this.drawWorldPolygon(graphics,wedgeWorld);

    // Sombras/variação tonal ampla, ainda respeitando exatamente a geometria.
    graphics.fillStyle(BASE_SOIL_SECONDARY,.42);
    const pA=this.territory.project(-29,66);
    const pB=this.territory.project(-31,88);
    graphics.fillEllipse(pA.x,pA.y,1320,420);
    graphics.fillEllipse(pB.x,pB.y,1180,360);
    graphics.fillStyle(BASE_SOIL_SHADOW,.32);
    const pC=this.territory.project(-48,74);
    graphics.fillEllipse(pC.x,pC.y,900,300);

    const mask=this.buildMask(worldPolygons);
    graphics.setMask(mask);
    this.buildFloorTextureLayer(mask);
    this.buildOrganicGroundDetails(mask);

    const data={
      version:'v0.3.1-round14-step2',
      purpose:'sinister-forest-ground-base',
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
        floorTextures:[...FLOOR_KEYS],
        palette:{
          base:'#1f2b27',
          secondary:'#2b3128',
          shadow:'#141d1b',
          leaves:['#4a3a2c','#5a4630']
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
