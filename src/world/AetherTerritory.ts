// @ts-nocheck
import {IsoSprite} from '../isometric/IsoOcclusion';
import {
  AETHER_EAST_MAIN_ROAD,AETHER_FUTURE_NEW_GAME_SPAWN,AETHER_GREENWOODS_BLOCK,AETHER_LAKE,AETHER_LANDMARKS,
  AETHER_LOGICAL_BOUNDS,AETHER_OLD_ROAD,AETHER_SECONDARY_ROADS,AETHER_SOUTH_MAIN_ROAD,
  AETHER_STREAM,distanceToSegmentSquared,getAetherSector,isAetherWaterBlocked
} from './AetherTerritoryLayout';
import {ensureAetherTerritoryMap} from './AetherTerritoryMap';

const SECTOR_NAMES={
  CITY_CENTER:'CIDADE DE AETHER • CENTRO',CITY_RESIDENTIAL:'CIDADE DE AETHER • RESIDENCIAL',
  CITY_SOUTH_GATE:'PORTÃO SUL DE AETHER',CITY_EAST_GATE:'PORTÃO LESTE DE AETHER',
  OUTSKIRTS_OLD_AETHER_ROAD:'ESTRADA VELHA DE AETHER',OUTSKIRTS_NEAR_CITY:'ARREDORES PRÓXIMOS',
  OUTSKIRTS_MAIN_ROAD:'ESTRADA PRINCIPAL',OUTSKIRTS_FARM:'FAZENDA DE AETHER',
  OUTSKIRTS_STREAM:'RIACHO DOS ARREDORES',OUTSKIRTS_LAKE:'LAGO DE AETHER',
  OUTSKIRTS_SHRINE:'SANTUÁRIO ANTIGO',OUTSKIRTS_RUINS:'RUÍNAS DOS ARREDORES',
  OUTSKIRTS_CAVE:'CAVERNA / FENDA',OUTSKIRTS_GREENWOODS_GATE:'ENTRADA DE GREENWOODS'
};

// Camadas estáveis para superfícies que nunca podem participar da oclusão
// dinâmica. A ordenação de atores e objetos volumétricos continua usando a
// base dos pés em depthAt(); somente o solo recebe esta classificação.
export const AETHER_TERRITORY_RENDER_LAYERS=Object.freeze({TERRAIN:-80,ROAD:-70});

/**
 * Culling e ativação por proximidade sem destruir estado persistente. Objetos
 * distantes deixam de renderizar/animar; entidades futuras podem registrar
 * callbacks de AI no mesmo gerenciador.
 */
export class TerritorySectorManager{
  constructor(scene,worldFlags={}){
    this.scene=scene;this.worldFlags=worldFlags;this.entries=[];this.lastUpdate=-Infinity;
    this.activeSector='CITY_CENTER';this.worldFlags.discoveredLandmarks??={};
  }
  register(object,u,v,options={}){
    const entry={object,u,v,visibleRadius:options.visibleRadius??31,activeRadius:options.activeRadius??38,onActive:options.onActive,alwaysActive:!!options.alwaysActive,active:null};
    this.entries.push(entry);return entry;
  }
  update(time,u,v,force=false){
    if(!force&&time-this.lastUpdate<180)return {sector:this.activeSector,discovered:false};
    this.lastUpdate=time;this.activeSector=getAetherSector(u,v);this.scene.registry.set('aetherActiveSector',this.activeSector);
    for(const entry of this.entries){
      const eu=typeof entry.u==='function'?entry.u():entry.u,ev=typeof entry.v==='function'?entry.v():entry.v;
      const distanceSquared=(u-eu)**2+(v-ev)**2;
      const visible=entry.alwaysActive||distanceSquared<=entry.visibleRadius**2;
      const active=entry.alwaysActive||distanceSquared<=entry.activeRadius**2;
      entry.object?.setVisible?.(visible);
      entry.object?.setActive?.(active);
      if(entry.active!==active){entry.active=active;entry.onActive?.(active,entry.object)}
    }
    let discovered=false;
    for(const landmark of AETHER_LANDMARKS){
      if(this.worldFlags.discoveredLandmarks[landmark.id])continue;
      if((u-landmark.u)**2+(v-landmark.v)**2<=landmark.discoveryRadius**2){
        this.worldFlags.discoveredLandmarks[landmark.id]=true;discovered=true;
      }
    }
    return{sector:this.activeSector,discovered};
  }
  destroy(){this.entries.length=0}
}

/** Construtor visual/físico da expansão integrada à própria AetherCityScene. */
export class AetherTerritory{
  constructor(scene,config){
    this.scene=scene;this.config=config;this.objects=[];this.waterSprites=[];
    this.worldFlags=config.worldFlags??{};this.worldFlags.discoveredLandmarks??={};
    this.sectors=new TerritorySectorManager(scene,this.worldFlags);
    this.mapKey=ensureAetherTerritoryMap(scene);
    this.build();
  }

  project(u,v){return this.config.project(u,v)}
  depthAt(u,v,offset=0){return this.config.depthBase+(u+v)*100+offset}
  groundDepth(layer=AETHER_TERRITORY_RENDER_LAYERS.TERRAIN){return this.config.depthBase+layer}

  track(object,u,v,options={}){
    if(!object)return object;this.objects.push(object);this.sectors.register(object,u,v,options);return object;
  }

  addFlat(texture,u,v,scale=1,rotation=0,depthOffset=-48,options={}){
    if(!this.scene.textures.exists(texture))return null;
    const p=this.project(u,v),image=this.scene.add.image(p.x,p.y,texture).setOrigin(.5).setScale(scale).setRotation(rotation).setDepth(this.depthAt(u,v,depthOffset));
    if(options.flipX)image.setFlipX(true);if(options.alpha!=null)image.setAlpha(options.alpha);if(options.tint)image.setTint(options.tint);
    return this.track(image,u,v,{visibleRadius:options.visibleRadius??34,activeRadius:options.activeRadius??40});
  }

  // Ground não é um objeto oclusor: seu depth é estável e fica abaixo de
  // qualquer ator cuja posição lógica esteja dentro do mundo jogável.
  addGround(texture,u,v,scale=1,rotation=0,layer=AETHER_TERRITORY_RENDER_LAYERS.TERRAIN,options={}){
    if(!this.scene.textures.exists(texture))return null;
    const p=this.project(u,v),image=this.scene.add.image(p.x,p.y,texture).setOrigin(.5).setScale(scale).setRotation(rotation).setDepth(this.groundDepth(layer));
    if(options.flipX)image.setFlipX(true);if(options.alpha!=null)image.setAlpha(options.alpha);if(options.tint)image.setTint(options.tint);
    image.setData?.('aetherRenderClass','ground');image.setData?.('aetherGroundLayer',layer);
    return this.track(image,u,v,{visibleRadius:options.visibleRadius??34,activeRadius:options.activeRadius??40});
  }

  addIsoImage(texture,u,v,targetHeight,options={}){
    if(!this.scene.textures.exists(texture))return null;
    const source=this.scene.textures.get(texture).getSourceImage();
    const sprite=new IsoSprite({
      scene:this.scene,isoX:u,isoY:v,isoZ:options.isoZ??0,texture,
      tileWidth:this.config.tileWidth,tileHeight:this.config.tileHeight,
      screenOriginX:this.config.originX,screenOriginY:this.config.originY,
      depthBase:this.config.depthBase,depthOffset:options.depthOffset??.05
    }).setScale(targetHeight/source.height);
    if(options.flipX)sprite.setFlipX(true);if(options.alpha!=null)sprite.setAlpha(options.alpha);if(options.tint)sprite.setTint(options.tint);
    this.track(sprite,u,v,{visibleRadius:options.visibleRadius??32,activeRadius:options.activeRadius??39,onActive:options.onActive});
    if(options.occluder!==false)this.config.registerOccluder?.(sprite,texture,sprite.y+(options.baseYOffset??-2),{behindMargin:options.behindMargin??7});
    if(options.solid){
      const solid=options.solid;
      this.config.registerSolidMask?.(sprite,texture,{
        label:solid.label??texture,mode:solid.mode??'footprint',
        footprintWidth:solid.width??54,footprintHeight:solid.height??20,
        footprintYOffset:solid.yOffset??-8,sourceMinY:solid.sourceMinY??.55,
        alphaThreshold:solid.alphaThreshold??36,minHits:solid.minHits??2,
        active:()=>sprite.active&&sprite.visible
      });
    }
    return sprite;
  }

  build(){
    this.createGroundMosaic();
    this.createGateApproaches();
    this.createRoadNetwork();
    this.createWaterSystem();
    this.createFarmReserve();
    this.createOldRoadIdentity();
    this.createLandmarks();
    this.createVegetation();
    this.scene.registry.set('aetherFutureNewGameSpawn',{...AETHER_FUTURE_NEW_GAME_SPAWN});
  }

  createGroundMosaic(){
    // Cada módulo preserva a proporção nativa 2:1 (768×384 = 8×8 tiles).
    // Espelhamento, matiz muito sutil e fase deslocada eliminam a grade de
    // cópias exatamente iguais sem jamais esticar os módulos.
    let index=0;
    for(let u=3.9;u<=82;u+=7.8)for(let v=3.9;v<=82;v+=7.8){
      const p=this.project(u,v),shade=[0xffffff,0xf5f8ed,0xf8f2df,0xeaf4e4][index%4];
      const tile=this.scene.add.image(p.x,p.y,'outskirts_ground_tile_v2').setOrigin(.5)
        .setScale(1.018+(index%3)*.006).setFlipX(index%3===1).setFlipY(index%5===0)
        .setTint(shade).setDepth(this.groundDepth(AETHER_TERRITORY_RENDER_LAYERS.TERRAIN));
      tile.setData?.('aetherRenderClass','ground');tile.setData?.('aetherGroundLayer',AETHER_TERRITORY_RENDER_LAYERS.TERRAIN);
      this.track(tile,u,v,{visibleRadius:29,activeRadius:34});
      index++;
    }
  }

  createGateApproaches(){
    // Pedra bem cuidada prolonga-se para fora e se mistura aos poucos à terra.
    [[14,27.2],[14,29.1],[14,31],[27.2,14],[29.1,14],[31,14]].forEach(([u,v],index)=>{
      const key=index<3?'iso_pavement_tile_b':'iso_pavement_tile_c';
      this.addFlat(key,u,v,.72,index<3?0:Math.PI/2,-45,{visibleRadius:25});
    });
    [[10.8,29.5],[17.5,31.5],[29.5,10.8],[31.4,17.7]].forEach(([u,v],index)=>this.addFlat(index%2?'outskirts_bush_cluster':'outskirts_grass_patch',u,v,.72,0,-38,{alpha:.9,visibleRadius:25}));
  }

  nearCrossing(u,v,padding=.45){
    return AETHER_STREAM.crossings.some(c=>{
      const length=Math.hypot(c.axisU,c.axisV)||1,axisU=c.axisU/length,axisV=c.axisV/length;
      const du=u-c.u,dv=v-c.v,along=du*axisU+dv*axisV,across=Math.abs(-axisV*du+axisU*dv);
      return Math.abs(along)<=c.length/2+padding&&across<=c.width/2+padding;
    });
  }

  stampPolyline(points,scale,spacing=2.05,asGround=false){
    const add=asGround?this.addGround.bind(this):this.addFlat.bind(this);
    const layerOrOffset=asGround?AETHER_TERRITORY_RENDER_LAYERS.ROAD:-43;
    for(let index=1;index<points.length;index++){
      const a=points[index-1],b=points[index],length=Math.hypot(b.u-a.u,b.v-a.v),steps=Math.max(1,Math.ceil(length/spacing));
      const screenA=this.project(a.u,a.v),screenB=this.project(b.u,b.v),rotation=Math.atan2(screenB.y-screenA.y,screenB.x-screenA.x);
      for(let step=0;step<steps;step++){
        const t=(step+.5)/steps,u=Phaser.Math.Linear(a.u,b.u,t),v=Phaser.Math.Linear(a.v,b.v,t);
        if(this.nearCrossing(u,v))continue;
        // Variações discretas de recorte/espelhamento quebram a leitura de
        // "carimbos" idênticos sem escalar ou distorcer a arte.
        const stampIndex=index*97+step;
        add('outskirts_old_road_v2',u,v,scale*(.97+(stampIndex%3)*.018),rotation+(stampIndex%2?.018:-.018),layerOrOffset,{visibleRadius:30,flipX:stampIndex%3===1,alpha:.94+(stampIndex%3)*.02});
      }
    }
  }

  createRoadNetwork(){
    // A Estrada Velha é uma superfície contínua, nunca um oclusor. As demais
    // rotas mantêm seu comportamento atual até suas etapas próprias.
    this.stampPolyline(AETHER_OLD_ROAD,.53,2.25,true);
    this.stampPolyline(AETHER_SOUTH_MAIN_ROAD,.50,2.2);
    this.stampPolyline(AETHER_EAST_MAIN_ROAD,.50,2.2);
    Object.values(AETHER_SECONDARY_ROADS).forEach(points=>this.stampPolyline(points,.38,2));
  }

  stampStream(){
    for(let index=1;index<AETHER_STREAM.points.length;index++){
      const a=AETHER_STREAM.points[index-1],b=AETHER_STREAM.points[index],length=Math.hypot(b.u-a.u,b.v-a.v),steps=Math.max(1,Math.ceil(length/2.45));
      const pa=this.project(a.u,a.v),pb=this.project(b.u,b.v),rotation=Math.atan2(pb.y-pa.y,pb.x-pa.x);
      for(let step=0;step<steps;step++){
        const t=(step+.5)/steps,u=Phaser.Math.Linear(a.u,b.u,t),v=Phaser.Math.Linear(a.v,b.v,t);
        const stampIndex=index*83+step;
        const water=this.addFlat('outskirts_stream_v2',u,v,.45+(stampIndex%3)*.012,rotation+(stampIndex%2?.025:-.018),-44,{flipX:stampIndex%2===0,visibleRadius:31,alpha:.94+(stampIndex%3)*.018});
        if(water)this.waterSprites.push({sprite:water,phase:(index*steps+step)*.47});
      }
    }
  }

  createWaterSystem(){
    this.stampStream();
    const lake=this.addFlat('outskirts_lake_v2',AETHER_LAKE.u,AETHER_LAKE.v,.78,0,-45,{visibleRadius:35,alpha:.98});
    if(lake)this.waterSprites.push({sprite:lake,phase:1.7});
    for(const crossing of AETHER_STREAM.crossings){
      // O eixo do tabuleiro pintado fica perpendicular à água. Espelhar a
      // peça preserva sua perspectiva 2,5D sem rodá-la como um sticker.
      const bridge=this.addIsoImage('outskirts_bridge_v2',crossing.u,crossing.v,188,{occluder:false,depthOffset:.08,visibleRadius:31,flipX:true});
      // Duas cabeceiras conectam explicitamente a estrada ao piso da ponte.
      const length=Math.hypot(crossing.axisU,crossing.axisV)||1,axisU=crossing.axisU/length,axisV=crossing.axisV/length;
      for(const sign of [-1,1]){
        const u=crossing.u+axisU*(crossing.length/2+.48)*sign;
        const v=crossing.v+axisV*(crossing.length/2+.48)*sign;
        const from=this.project(crossing.u,crossing.v),to=this.project(u,v);
        this.addFlat('outskirts_old_road_v2',u,v,.47,Math.atan2(to.y-from.y,to.x-from.x),-42,{visibleRadius:31,alpha:.96,flipX:sign<0});
      }
      if(bridge)bridge.setData?.('walkway',crossing.id);
    }
    [[47.4,48.1],[48.5,54.5],[55.5,45.3],[57.2,52.4],[42.7,29.3],[46.4,34]].forEach(([u,v],index)=>this.addFlat('outskirts_reeds',u,v,.54+(index%2)*.06,index%2?-.22:.18,-35,{visibleRadius:27}));
    [[48.1,46.2],[57.4,48.6],[45.2,54.2]].forEach(([u,v],index)=>this.addFlat('outskirts_rock_cluster',u,v,.62,index*.3,-34,{visibleRadius:27}));
  }

  createFarmReserve(){
    this.addIsoImage('farmhouse',21.6,48.3,248,{solid:{label:'casa principal da fazenda',width:174,height:31,yOffset:-11},visibleRadius:34});
    this.addIsoImage('farm_barn',29.7,49.5,226,{solid:{label:'celeiro da fazenda',width:158,height:29,yOffset:-10},visibleRadius:34});
    this.addIsoImage('farm_empty_wagon',18.8,53.4,126,{solid:{label:'carroça da fazenda',width:104,height:21,yOffset:-7},visibleRadius:30});
    const crops=['farm_crop_wheat','farm_crop_cabbage','farm_crop_vegetables'];
    for(let row=0;row<3;row++)for(let column=0;column<5;column++){
      const u=24+column*1.55,v=53.6+row*1.45;
      this.addIsoImage(crops[(row+column)%crops.length],u,v,74,{occluder:false,depthOffset:.01,visibleRadius:28});
    }
    [[18.1,47.2],[18.4,50],[18.7,56],[22.1,59],[28,59.4],[33.5,57.8],[34.1,51.6]].forEach(([u,v],index)=>this.addFlat('outskirts_fence_segment',u,v,.72,index<3?-.45:.36,-20,{visibleRadius:28}));
  }

  createOldRoadIdentity(){
    this.addIsoImage('outskirts_aether_sign_v2',12.4,35.7,170,{solid:{label:'placa para Aether',width:108,height:20,yOffset:-7},visibleRadius:29});
    this.addIsoImage('outskirts_aether_sign_v2',8.5,66,150,{solid:{label:'marco antigo da estrada',width:96,height:18,yOffset:-6},flipX:true,visibleRadius:29});
    // A carroça atacada é criada pelo prólogo no seu ponto narrativo oficial.
    // Assim há uma única instância visual/física e uma única fonte de interação.
    [[8,61],[10,44.2],[7.1,69]].forEach(([u,v],index)=>this.addIsoImage('street_logs',u,v,72+index*4,{solid:{label:'troncos na estrada',width:42,height:15,yOffset:-5},occluder:false,visibleRadius:27}));
    [[6.5,57.3],[10.8,64.4],[6.1,72.4]].forEach(([u,v],index)=>this.addFlat('outskirts_fence_segment',u,v,.75,index%2?.36:-.42,-22,{visibleRadius:27}));
  }

  createLandmarks(){
    this.addIsoImage('outskirts_shrine_v2',55.5,23.2,292,{solid:{label:'Santuário Antigo',width:184,height:35,yOffset:-12},visibleRadius:34});
    this.addIsoImage('outskirts_ruins_v2',20.4,66,270,{solid:{label:'arco em ruínas',width:204,height:38,yOffset:-13},visibleRadius:34});
    this.addIsoImage('outskirts_ruins_v2',28.3,69.2,174,{solid:{label:'ruínas menores',width:126,height:25,yOffset:-8},flipX:true,visibleRadius:31});
    this.addIsoImage('outskirts_cave_v2',58.8,65,300,{solid:{label:'entrada da caverna',width:218,height:42,yOffset:-14},visibleRadius:35});
    this.greenwoodsBlock=this.addIsoImage('outskirts_greenwoods_block_v2',72,48.5,410,{solid:{label:'raízes de Greenwoods',width:228,height:48,yOffset:-14},visibleRadius:39});
    [[53,20.2],[58.4,20.8],[52.2,25.7],[59,26.1]].forEach(([u,v],index)=>this.addFlat('outskirts_rock_cluster',u,v,.63,index*.38,-26,{visibleRadius:28}));
  }

  createVegetation(){
    const trees=[
      [8,33,174],[18.5,31.5,166],[7,39.5,180],[18,38.8,170],[5.2,48.5,184],[16,50.5,170],
      [4.8,58,180],[14.2,61,166],[4.5,72,184],[12.5,75,178],[18,44,164],[34.5,55.5,170],
      [38,27,172],[49,18,168],[61,27,184],[60.5,53.5,178],[64.5,38,188],[67.5,36.5,198],
      [69.5,58.5,206],[74,61,218],[77,42,226],[78,54.5,220],[66,67,180],[45,65,170]
    ];
    trees.forEach(([u,v,height],index)=>this.addIsoImage('city_tree',u,v,height,{solid:{label:'tronco de árvore',width:27+height*.035,height:14+height*.018,yOffset:-6},flipX:index%3===1,visibleRadius:34}));
    [[31,34],[35,39],[39,58],[42,62],[62,19],[63,31],[70,30],[73,67],[79,37],[16,70]].forEach(([u,v],index)=>this.addFlat(index%2?'outskirts_bush_cluster':'outskirts_grass_patch',u,v,.72+(index%3)*.08,index*.31,-23,{visibleRadius:29}));
  }

  update(time,u,v){
    const result=this.sectors.update(time,u,v);
    if(this.greenwoodsBlock&&this.worldFlags.greenwoodsGateOpened)this.greenwoodsBlock.setVisible(false).setActive(false);
    if(result.discovered)this.scene.hud?.refreshMapMarkers?.();
    for(const item of this.waterSprites){
      if(item.sprite?.visible)item.sprite.setAlpha(.955+Math.sin(time*.00135+item.phase)*.025);
    }
    return result.sector;
  }

  forceUpdate(time,u,v){return this.sectors.update(time,u,v,true).sector}
  getLocalName(u,v){const id=getAetherSector(u,v);return SECTOR_NAMES[id]??'ARREDORES DE AETHER'}

  getMapMarkers(){
    return AETHER_LANDMARKS.map(landmark=>({
      u:landmark.u,v:landmark.v,color:landmark.color,label:landmark.label,
      isVisible:()=>!!this.worldFlags.discoveredLandmarks?.[landmark.id]
    }));
  }

  getMinimapMarkers(){
    return[
      {u:26,v:14,color:0xffd166,label:'Portão Leste'},
      {u:14,v:26,color:0x73e6a8,label:'Portão Sul'}
    ];
  }

  isLogicalBarrierBlocked(u,v,radius=.27){
    const bounds=AETHER_LOGICAL_BOUNDS;
    if(u<bounds.minU+radius||v<bounds.minV+radius||u>bounds.maxU-radius||v>bounds.maxV-radius)return true;
    if(isAetherWaterBlocked(u,v,radius))return true;
    // O bloqueio usa somente raízes/troncos na base; a copa ampla segue sendo
    // decorativa e não cria uma parede invisível distante.
    const woodsU=(u-AETHER_GREENWOODS_BLOCK.u)/(AETHER_GREENWOODS_BLOCK.radiusU+radius),woodsV=(v-AETHER_GREENWOODS_BLOCK.v)/(AETHER_GREENWOODS_BLOCK.radiusV+radius);
    if(!this.worldFlags.greenwoodsGateOpened&&woodsU*woodsU+woodsV*woodsV<=1)return true;
    const caveU=(u-58.8)/(2+radius),caveV=(v-64.45)/(1.35+radius);
    return caveU*caveU+caveV*caveV<=1;
  }

  destroy(){this.sectors.destroy();this.objects.length=0;this.waterSprites.length=0}
}
