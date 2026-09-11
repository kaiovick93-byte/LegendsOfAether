// @ts-nocheck
import {IsoSprite} from '../isometric/IsoOcclusion';
import {
  AETHER_EAST_MAIN_ROAD,AETHER_FUTURE_NEW_GAME_SPAWN,AETHER_GREENWOODS_BLOCK,AETHER_LAKE,AETHER_LANDMARKS,
  AETHER_LOGICAL_BOUNDS,AETHER_SECONDARY_ROADS,AETHER_SOUTH_MAIN_ROAD,
  AETHER_NEW_GAME_SPAWN,AETHER_STREAM,distanceToSegmentSquared,getAetherSector,isAetherWaterBlocked
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

// Camadas estáveis: chão nunca participa da oclusão por pés dos atores.
const OLD_ROAD_PROTOTYPE_LAYERS=Object.freeze({TERRAIN:-80,ROAD:-70});
// Prompt 9D-B4.0B — somente a base dos Arredores muda. Uma superfície
// contínua é mascarada no mesmo losango lógico do terreno provisório, logo os
// bounds e qualquer boca da Estrada Velha ficam matematicamente inalterados.
const OUTSKIRTS_B4_GROUND_SURFACE='outskirts_ground_b4_surface';
const OUTSKIRTS_B4_GROUND_DETAILS=Object.freeze([
  'outskirts_ground_b4_detail_0','outskirts_ground_b4_detail_1',
  'outskirts_ground_b4_detail_2','outskirts_ground_b4_detail_3'
]);
/**
 * Prompt 9D-B3.5 — contrato único de conectores da Estrada Velha.
 * As medidas são de mundo; os PNGs foram publicados em 4x para entrarem todos
 * com a mesma escala uniforme de 0.25.  Nenhum encaixe depende de stretch,
 * squash, profundidade dinâmica ou compensação visual escondida.
 */
const OLD_ROAD_CONNECTOR_STANDARD=Object.freeze({
  scale:.25,
  roadWidth:96,
  walkableWidth:64,
  edgeWidth:16,
  stableRun:32,
  cleanSeam:12,
  curveRadius:128,
  yTrunk:48,
  yBranchAngle:35*Math.PI/180
});
const OLD_ROAD_CONNECTOR_KIT=Object.freeze({
  straightLong:{
    texture:'old_road_connector_straight_long_v2',size:{width:512,height:768},
    connectors:{north:{x:255.5,y:0},south:{x:255.5,y:768}}
  },
  straightShort:{
    texture:'old_road_connector_straight_short_v2',size:{width:512,height:384},
    connectors:{north:{x:255.5,y:0},south:{x:255.5,y:384}}
  },
  curveRight:{
    texture:'old_road_connector_curve_right_v2',size:{width:1408,height:1408},
    connectors:{south:{x:704,y:1408},east:{x:1408,y:704}}
  },
  yJunction:{
    texture:'old_road_connector_y_junction_v2',size:{width:1600,height:1600},
    connectors:{trunk:{x:800,y:1600},left:{x:157.6,y:490.6},right:{x:1442.4,y:490.6}}
  },
  // B4.0A troca somente o material pintado; as bocas e os pontos de mundo
  // aprovados no B3.8A permanecem idênticos.
  startRun:{
    texture:'old_road_connector_start_run_v2',size:{width:3200,height:1280},
    connectors:{start:{x:256,y:704},end:{x:2921.726260,y:634.759872}}
  },
  gateTransition:{
    texture:'old_road_connector_gate_transition_v3',size:{width:1280,height:1280},
    // A boca inferior encaixa no tronco do Y; a superior chega ao centro
    // visual do vão do arco, não ao centro lógico atrás do Portão Sul.
    connectors:{from:{x:640,y:1280},to:{x:946.913502,y:780.900709}}
  }
});
// Prompt 9D-B3.8 — rota visual aprovada da Estrada Velha. Os módulos partem
// do canto inferior esquerdo, passam pelos encontros do prólogo e chegam ao
// Portão Sul. Cada ângulo abaixo representa uma curva suave de poucos graus
// entre bocas idênticas; não há escala não uniforme nem remendo visual.
const OLD_ROAD_ROUTE_START=Object.freeze({u:.5,v:80.8});
const OLD_ROAD_START_RUN_SEGMENTS=4;
const OLD_ROAD_ROUTE_SEGMENTS=Object.freeze([
  {module:'straightLong',heading:7.99},{module:'straightLong',heading:.16},
  {module:'straightLong',heading:-7.26},{module:'straightShort',heading:-12.19},
  {module:'straightLong',heading:-16.21},{module:'straightLong',heading:-20.23},
  {module:'straightShort',heading:-22.21},{module:'straightLong',heading:-23.18},
  {module:'straightLong',heading:-23.17},{module:'straightLong',heading:-22.03},
  {module:'straightShort',heading:-20.97},{module:'straightLong',heading:-19.80},
  {module:'straightLong',heading:-18.14},{module:'straightShort',heading:-17.78},
  {module:'straightLong',heading:-19.15},{module:'straightLong',heading:-20.21},
  {module:'straightShort',heading:-20.00},{module:'straightLong',heading:-18.76}
]);
const OLD_ROAD_FINAL_Y=Object.freeze({
  // A boca superior do Y encaixa no acesso preservado do Portão Sul. A
  // rotação leva o ramo esquerdo exatamente à vista de Aether, que encerra o
  // trajeto vermelho antes da entrada na cidade.
  gate:{u:14,v:29.1},rotation:40.27311450169119*Math.PI/180
});
// O centro lógico do portão continua em 14,26.03 para a cidade e colisões.
// Esta referência cai no centro visual da abertura isométrica do arco.
const OLD_ROAD_SOUTH_GATE=Object.freeze({u:14.5,v:26.7});
const OLD_ROAD_MAIN_ROAD_STUB=Object.freeze([
  {module:'straightLong',heading:95},{module:'straightShort',heading:91}
]);

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
  groundDepth(layer=OLD_ROAD_PROTOTYPE_LAYERS.TERRAIN){return this.config.depthBase+layer}

  track(object,u,v,options={}){
    if(!object)return object;this.objects.push(object);this.sectors.register(object,u,v,options);return object;
  }

  addFlat(texture,u,v,scale=1,rotation=0,depthOffset=-48,options={}){
    if(!this.scene.textures.exists(texture))return null;
    const p=this.project(u,v),image=this.scene.add.image(p.x,p.y,texture).setOrigin(.5).setScale(scale).setRotation(rotation).setDepth(this.depthAt(u,v,depthOffset));
    if(options.flipX)image.setFlipX(true);if(options.alpha!=null)image.setAlpha(options.alpha);if(options.tint)image.setTint(options.tint);
    return this.track(image,u,v,{visibleRadius:options.visibleRadius??34,activeRadius:options.activeRadius??40});
  }

  // Ground do protótipo é deliberadamente estático e sem colisão: não pode
  // ocultar jogador, NPC, criatura ou prop alto.
  addGround(texture,u,v,scale=1,layer=OLD_ROAD_PROTOTYPE_LAYERS.TERRAIN,options={}){
    if(!this.scene.textures.exists(texture))return null;
    const p=this.project(u,v),image=this.scene.add.image(p.x,p.y,texture).setOrigin(.5).setScale(scale).setDepth(this.groundDepth(layer));
    if(options.rotation)image.setRotation(options.rotation);
    if(options.flipX)image.setFlipX(true);
    if(options.flipY)image.setFlipY(true);
    if(options.alpha!=null)image.setAlpha(options.alpha);
    image.setData?.('aetherRenderClass','ground');
    return this.track(image,u,v,{visibleRadius:options.visibleRadius??18,activeRadius:options.activeRadius??22});
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
    // Prompt 9D-B3.6A — reset visual provisório dos Arredores.  A geografia
    // lógica, os setores, colisões, marcos, spawns e estados continuam vivos
    // para a reconstrução posterior; somente a composição desenhada é
    // reduzida a grama contínua + protótipo da Estrada Velha + acesso sul.
    this.createGroundMosaic();
    this.createOldRoadPrototype();
    this.createGateApproaches();
    this.scene.registry.set('aetherOutskirtsVisualResetV1',{
      mode:'grass-old-road-south-gate',
      suppressed:['road-network','water','farm','old-road-props','landmarks','vegetation']
    });
    this.scene.registry.set('aetherFutureNewGameSpawn',{...AETHER_FUTURE_NEW_GAME_SPAWN});
  }

  createGroundMosaic(){
    // B4.0B: em vez de losangos de arte diferentes lado a lado, um material
    // contínuo cobre a mesma área lógica e recebe um mask no losango exato
    // U/V 0…82. Isso elimina o desenho de grade sem expandir o terreno.
    const bounds=AETHER_LOGICAL_BOUNDS;
    const top=this.project(bounds.minU,bounds.minV),right=this.project(bounds.maxU,bounds.minV),
      bottom=this.project(bounds.maxU,bounds.maxV),left=this.project(bounds.minU,bounds.maxV),
      center=this.project((bounds.minU+bounds.maxU)/2,(bounds.minV+bounds.maxV)/2);
    const width=right.x-left.x,height=bottom.y-top.y;
    const ground=this.scene.add.tileSprite(center.x,center.y,width,height,OUTSKIRTS_B4_GROUND_SURFACE)
      .setOrigin(.5).setDepth(this.groundDepth(OLD_ROAD_PROTOTYPE_LAYERS.TERRAIN));
    const maskShape=this.scene.make.graphics({x:0,y:0,add:false});
    maskShape.fillStyle(0xffffff,1).beginPath();
    maskShape.moveTo(top.x,top.y).lineTo(right.x,right.y).lineTo(bottom.x,bottom.y).lineTo(left.x,left.y).closePath().fillPath();
    ground.setMask(maskShape.createGeometryMask());
    ground.setData?.('aetherRenderClass','ground');
    this.groundMask=maskShape;this.groundSurface=ground;

    // Detalhes transparentes leves: não são árvores, placas, rochas grandes
    // nem props narrativos. Eles só reduzem a leitura de repetição no solo.
    const spacing=7.8,firstU=bounds.minU+spacing/2,firstV=bounds.minV+spacing/2;
    let row=0;
    for(let u=firstU;u<=bounds.maxU;u+=spacing,row++){
      let column=0;
      for(let v=firstV;v<=bounds.maxV;v+=spacing,column++){
        const hash=(row*37+column*53+row*column*11)>>>0;
        if(hash%9>=2)continue;
        const detail=OUTSKIRTS_B4_GROUND_DETAILS[(hash>>>3)%OUTSKIRTS_B4_GROUND_DETAILS.length];
        this.addGround(detail,u,v,1.026,OLD_ROAD_PROTOTYPE_LAYERS.TERRAIN+.15,{
          flipX:(hash&1)===1,flipY:(hash%5)===0,alpha:.82,visibleRadius:29,activeRadius:34
        });
      }
    }
  }

  screenToLogical(x,y){
    const tileWidth=this.config.tileWidth??96,tileHeight=this.config.tileHeight??48;
    const localX=(x-(this.config.originX??0))/tileWidth,localY=(y-(this.config.originY??0))/tileHeight;
    return {u:localX+localY,v:localY-localX};
  }

  connectorVector(spec,connector,rotation=0,flipX=false,flipY=false){
    const point=spec.connectors[connector],scale=OLD_ROAD_CONNECTOR_STANDARD.scale;
    let x=(point.x-spec.size.width/2)*scale,y=(point.y-spec.size.height/2)*scale;
    if(flipX)x=-x;if(flipY)y=-y;
    const cos=Math.cos(rotation),sin=Math.sin(rotation);
    return{x:x*cos-y*sin,y:x*sin+y*cos};
  }

  /**
   * Posiciona uma peça pelo centro lógico de uma boca. Esse é o ponto crucial
   * do contrato: peças consecutivas compartilham a mesma coordenada de boca,
   * em vez de dependerem de overlap arbitrário de PNG, escala diferente ou
   * correção manual por olho.
   */
  placeRoadConnectorModule(moduleName,anchorScreen,connector,options={}){
    const spec=OLD_ROAD_CONNECTOR_KIT[moduleName];
    if(!spec||!spec.connectors[connector])return null;
    const rotation=options.rotation??0,flipX=!!options.flipX,flipY=!!options.flipY;
    const anchorVector=this.connectorVector(spec,connector,rotation,flipX,flipY);
    const center={x:anchorScreen.x-anchorVector.x,y:anchorScreen.y-anchorVector.y};
    const point=this.screenToLogical(center.x,center.y);
    const sprite=this.addGround(spec.texture,point.u,point.v,OLD_ROAD_CONNECTOR_STANDARD.scale,OLD_ROAD_PROTOTYPE_LAYERS.ROAD,{
      rotation,flipX,flipY,visibleRadius:options.visibleRadius??24,activeRadius:options.activeRadius??28
    });
    const connectors={};
    Object.keys(spec.connectors).forEach(name=>{
      const vector=this.connectorVector(spec,name,rotation,flipX,flipY);
      connectors[name]={x:center.x+vector.x,y:center.y+vector.y};
    });
    return{sprite,center,connectors,moduleName,rotation,flipX,flipY};
  }

  /**
   * Prompt 9D-B3.8: a Estrada Velha deixa de ser um teste isolado e passa a
   * ligar o ponto inicial inferior esquerdo ao Portão Sul. O caminho é montado
   * de trás para frente a partir da boca esquerda do Y: assim a conexão final
   * é matematicamente a mesma coordenada, sem uma emenda aproximada no portão.
   */
  createOldRoadPrototype(){
    const gateAnchor=this.project(OLD_ROAD_FINAL_Y.gate.u,OLD_ROAD_FINAL_Y.gate.v);
    const junction=this.placeRoadConnectorModule('yJunction',gateAnchor,'trunk',{
      rotation:OLD_ROAD_FINAL_Y.rotation,flipY:true,visibleRadius:29,activeRadius:34
    });
    const oldRoadModules=[];
    let oldRoadAnchor=junction.connectors.left;
    // O começo é uma única corrida contínua; todos os módulos posteriores
    // preservam as mesmas bocas e posições da rota B3.8.
    [...OLD_ROAD_ROUTE_SEGMENTS.slice(OLD_ROAD_START_RUN_SEGMENTS)].reverse().forEach(segment=>{
      const rotation=segment.heading*Math.PI/180-Math.PI/2;
      const module=this.placeRoadConnectorModule(segment.module,oldRoadAnchor,'south',{
        rotation,visibleRadius:29,activeRadius:34
      });
      oldRoadModules.unshift(module);
      oldRoadAnchor=module.connectors.north;
    });
    const startRun=this.placeRoadConnectorModule('startRun',oldRoadAnchor,'end',{
      visibleRadius:29,activeRadius:34
    });
    oldRoadModules.unshift(startRun);
    oldRoadAnchor=startRun.connectors.start;

    // A aproximação curta usa a mesma boca-mestra do Y e termina na soleira
    // externa do arco. Ela corrige a leitura visual sem reposicionar o portão.
    const southGate=this.placeRoadConnectorModule('gateTransition',junction.connectors.trunk,'from',{
      rotation:OLD_ROAD_FINAL_Y.rotation,visibleRadius:29,activeRadius:34
    });

    // O ramo direito é propositalmente curto: apenas estabelece a saída da
    // futura Estrada Principal, sem reconstruir o restante dos Arredores.
    const mainRoadModules=[];
    let mainRoadAnchor=junction.connectors.right;
    OLD_ROAD_MAIN_ROAD_STUB.forEach(segment=>{
      const rotation=segment.heading*Math.PI/180-Math.PI/2;
      const module=this.placeRoadConnectorModule(segment.module,mainRoadAnchor,'north',{
        rotation,visibleRadius:29,activeRadius:34
      });
      mainRoadModules.push(module);
      mainRoadAnchor=module.connectors.south;
    });

    const requestedStart=this.project(OLD_ROAD_ROUTE_START.u,OLD_ROAD_ROUTE_START.v);
    this.scene.registry.set('oldRoadConnectorTest',{
      standard:OLD_ROAD_CONNECTOR_STANDARD,route:'old-road-to-south-gate',
      start:{requested:requestedStart,actual:oldRoadAnchor},gate:gateAnchor,
      junction:{center:junction.center,connectors:junction.connectors,rotation:junction.rotation,flipY:true},
      southGateTransition:{center:southGate.center,connectors:southGate.connectors,rotation:southGate.rotation,target:this.project(OLD_ROAD_SOUTH_GATE.u,OLD_ROAD_SOUTH_GATE.v)},
      oldRoad:oldRoadModules.map(item=>({module:item.moduleName,center:item.center,connectors:item.connectors,rotation:item.rotation})),
      mainRoad:mainRoadModules.map(item=>({module:item.moduleName,center:item.center,connectors:item.connectors,rotation:item.rotation}))
    });
  }

  createGateApproaches(){
    // A entrada externa agora é concluída por gateTransition, com a mesma
    // largura e boca dos módulos de estrada. Não adicionamos pavimento solto
    // aqui: ele criava quadrados claros e costuras entre o Y e o arco.
  }

  nearCrossing(u,v,padding=.45){
    return AETHER_STREAM.crossings.some(c=>{
      const length=Math.hypot(c.axisU,c.axisV)||1,axisU=c.axisU/length,axisV=c.axisV/length;
      const du=u-c.u,dv=v-c.v,along=du*axisU+dv*axisV,across=Math.abs(-axisV*du+axisU*dv);
      return Math.abs(along)<=c.length/2+padding&&across<=c.width/2+padding;
    });
  }

  stampPolyline(points,scale,spacing=2.05){
    for(let index=1;index<points.length;index++){
      const a=points[index-1],b=points[index],length=Math.hypot(b.u-a.u,b.v-a.v),steps=Math.max(1,Math.ceil(length/spacing));
      const screenA=this.project(a.u,a.v),screenB=this.project(b.u,b.v),rotation=Math.atan2(screenB.y-screenA.y,screenB.x-screenA.x);
      for(let step=0;step<steps;step++){
        const t=(step+.5)/steps,u=Phaser.Math.Linear(a.u,b.u,t),v=Phaser.Math.Linear(a.v,b.v,t);
        if(this.nearCrossing(u,v))continue;
        // Variações discretas de recorte/espelhamento quebram a leitura de
        // "carimbos" idênticos sem escalar ou distorcer a arte.
        const stampIndex=index*97+step;
        this.addFlat('outskirts_old_road_v2',u,v,scale*(.97+(stampIndex%3)*.018),rotation+(stampIndex%2?.018:-.018),-43,{visibleRadius:30,flipX:stampIndex%3===1,alpha:.94+(stampIndex%3)*.02});
      }
    }
  }

  createRoadNetwork(){
    // 9D-B3.3: a Estrada Velha usa exclusivamente o kit modular acima. Não
    // carimbar o asset legado evita uma segunda estrada por baixo do protótipo.
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
    // Só os dois marcos narrativos permanecem. Os demais props aguardam a
    // próxima etapa para a área não virar decoração definitiva antes do aval
    // da estrada modular.
    this.addIsoImage('outskirts_aether_sign_v2',12.4,35.7,170,{solid:{label:'placa para Aether',width:108,height:20,yOffset:-7},visibleRadius:29});
    this.addIsoImage('outskirts_aether_sign_v2',8.5,66,150,{solid:{label:'marco antigo da estrada',width:96,height:18,yOffset:-6},flipX:true,visibleRadius:29});
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
    const isOldRoadPrototypeClearing=(u,v)=>u<=18.5&&v>=29;
    const trees=[
      [8,33,174],[18.5,31.5,166],[7,39.5,180],[18,38.8,170],[5.2,48.5,184],[16,50.5,170],
      [4.8,58,180],[14.2,61,166],[4.5,72,184],[12.5,75,178],[18,44,164],[34.5,55.5,170],
      [38,27,172],[49,18,168],[61,27,184],[60.5,53.5,178],[64.5,38,188],[67.5,36.5,198],
      [69.5,58.5,206],[74,61,218],[77,42,226],[78,54.5,220],[66,67,180],[45,65,170]
    ];
    trees.filter(([u,v])=>!isOldRoadPrototypeClearing(u,v)).forEach(([u,v,height],index)=>this.addIsoImage('city_tree',u,v,height,{solid:{label:'tronco de árvore',width:27+height*.035,height:14+height*.018,yOffset:-6},flipX:index%3===1,visibleRadius:34}));
    [[31,34],[35,39],[39,58],[42,62],[62,19],[63,31],[70,30],[73,67],[79,37],[16,70]]
      .filter(([u,v])=>!isOldRoadPrototypeClearing(u,v))
      .forEach(([u,v],index)=>this.addFlat(index%2?'outskirts_bush_cluster':'outskirts_grass_patch',u,v,.72+(index%3)*.08,index*.31,-23,{visibleRadius:29}));
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

  destroy(){this.groundSurface?.destroy?.();this.groundMask?.destroy?.();this.sectors.destroy();this.objects.length=0;this.waterSprites.length=0}
}
