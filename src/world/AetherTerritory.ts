// @ts-nocheck
import {OLD_ROAD_B4D_TEXTURES} from './OldRoadVisuals';
import {OldRoadEscarpment} from './OldRoadEscarpment';
import {OldRoadProps} from './OldRoadProps';
import {AETHER_FUTURE_NEW_GAME_SPAWN,AETHER_LANDMARKS,AETHER_LOGICAL_BOUNDS,getAetherSector} from './AetherTerritoryLayout';
import {ensureAetherTerritoryMap} from './AetherTerritoryMap';

const SECTOR_NAMES={
  CITY_CENTER:'CIDADE DE AETHER • CENTRO',CITY_RESIDENTIAL:'CIDADE DE AETHER • RESIDENCIAL',
  CITY_SOUTH_GATE:'PORTÃO SUL DE AETHER',CITY_EAST_GATE:'PORTÃO LESTE DE AETHER',
  OUTSKIRTS_OLD_AETHER_ROAD:'ESTRADA VELHA DE AETHER',OUTSKIRTS_NEAR_CITY:'ARREDORES PRÓXIMOS',
  OUTSKIRTS_MAIN_ROAD:'ESTRADA PRINCIPAL',
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
// Espalhamento irregular deliberado: detalhes baixos de chão, nunca props,
// ficam sob a estrada e só quebram áreas amplas de grama repetida.
const OUTSKIRTS_B4_GROUND_DETAIL_LAYOUT=Object.freeze([
  {u:5.7,v:13.9,detail:0,scale:1.02,rotation:.03,flipX:false,flipY:true,alpha:.70},
  {u:8.8,v:47.2,detail:2,scale:.94,rotation:-.04,flipX:true,flipY:false,alpha:.64},
  {u:12.6,v:28.1,detail:1,scale:1.04,rotation:.02,flipX:false,flipY:false,alpha:.70},
  {u:16.1,v:68.3,detail:3,scale:.96,rotation:-.03,flipX:true,flipY:true,alpha:.60},
  {u:19.8,v:8.2,detail:2,scale:.93,rotation:.05,flipX:false,flipY:false,alpha:.62},
  {u:23.9,v:42.8,detail:0,scale:1.03,rotation:-.02,flipX:true,flipY:false,alpha:.68},
  {u:28.4,v:21.3,detail:3,scale:.96,rotation:.03,flipX:false,flipY:true,alpha:.61},
  {u:31.7,v:59.6,detail:1,scale:1.01,rotation:-.05,flipX:true,flipY:true,alpha:.69},
  {u:35.2,v:4.8,detail:0,scale:.95,rotation:.04,flipX:false,flipY:false,alpha:.65},
  {u:39.8,v:34.7,detail:2,scale:1.04,rotation:-.01,flipX:true,flipY:false,alpha:.63},
  {u:43.1,v:73.2,detail:3,scale:.97,rotation:.03,flipX:false,flipY:true,alpha:.60},
  {u:46.5,v:16.7,detail:1,scale:1.02,rotation:-.04,flipX:true,flipY:false,alpha:.68},
  {u:50.9,v:50.3,detail:0,scale:.95,rotation:.02,flipX:false,flipY:false,alpha:.66},
  {u:54.2,v:29.5,detail:2,scale:1.03,rotation:-.03,flipX:true,flipY:true,alpha:.62},
  {u:58.8,v:64.4,detail:3,scale:.98,rotation:.05,flipX:false,flipY:false,alpha:.61},
  {u:62.1,v:10.9,detail:1,scale:1.01,rotation:-.02,flipX:true,flipY:false,alpha:.68},
  {u:66.7,v:39.1,detail:0,scale:.96,rotation:.04,flipX:false,flipY:true,alpha:.65},
  {u:70.4,v:75.8,detail:2,scale:1.03,rotation:-.05,flipX:true,flipY:false,alpha:.63},
  {u:74.6,v:23.6,detail:3,scale:.94,rotation:.01,flipX:false,flipY:false,alpha:.60},
  {u:77.3,v:54.2,detail:1,scale:1.02,rotation:-.03,flipX:true,flipY:true,alpha:.68}
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
    texture:OLD_ROAD_B4D_TEXTURES.straightLong[0],size:{width:512,height:768},
    connectors:{north:{x:255.5,y:0},south:{x:255.5,y:768}}
  },
  straightShort:{
    texture:OLD_ROAD_B4D_TEXTURES.straightShort[0],size:{width:512,height:384},
    connectors:{north:{x:255.5,y:0},south:{x:255.5,y:384}}
  },
  curveRight:{
    texture:OLD_ROAD_B4D_TEXTURES.curveRight[0],size:{width:1408,height:1408},
    connectors:{south:{x:704,y:1408},east:{x:1408,y:704}}
  },
  yJunction:{
    texture:OLD_ROAD_B4D_TEXTURES.yJunction[0],size:{width:1600,height:1600},
    connectors:{trunk:{x:800,y:1600},left:{x:157.6,y:490.6},right:{x:1442.4,y:490.6}}
  },
  // B4.0A troca somente o material pintado; as bocas e os pontos de mundo
  // aprovados no B3.8A permanecem idênticos.
  startRun:{
    texture:OLD_ROAD_B4D_TEXTURES.startRun[0],size:{width:3200,height:1280},
    connectors:{start:{x:256,y:704},end:{x:2921.726260,y:634.759872}}
  },
  gateTransition:{
    texture:OLD_ROAD_B4D_TEXTURES.gateTransition[0],size:{width:1280,height:1280},
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
    this.scene=scene;this.config=config;this.objects=[];this.groundVariationLayers=[];
    this.roadVisualCounters={};
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

  build(){
    // Prompt 9D-B3.6A — reset visual provisório dos Arredores.  A geografia
    // lógica, os setores, colisões, marcos, spawns e estados continuam vivos
    // para a reconstrução posterior; somente a composição desenhada é
    // reduzida a grama contínua + protótipo da Estrada Velha + acesso sul.
    this.createGroundMosaic();
    this.createOldRoadPrototype();
    this.oldRoadEscarpment=new OldRoadEscarpment(this);
    this.oldRoadProps=new OldRoadProps(this);
    this.polishOldRoadJunction();
    this.scene.registry.set('aetherOutskirtsVisualResetV1',{
      mode:'grass-old-road-south-gate',
      suppressed:['legacy-road-network','legacy-water','farm-buildings','unused-landmarks','legacy-vegetation']
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

    // B4.0D: integration detail belongs to each complete road image.
    this.groundVariationLayers=[];

    // Detalhes transparentes leves: não são árvores, placas, rochas grandes
    // nem props narrativos. Uma distribuição irregular substitui a grade
    // provisória, sem mudar qualquer objeto estrutural dos Arredores.
    OUTSKIRTS_B4_GROUND_DETAIL_LAYOUT.forEach(spec=>{
      const detail=OUTSKIRTS_B4_GROUND_DETAILS[spec.detail];
      this.addGround(detail,spec.u,spec.v,spec.scale,OLD_ROAD_PROTOTYPE_LAYERS.TERRAIN+.15,{
        rotation:spec.rotation,flipX:spec.flipX,flipY:spec.flipY,alpha:spec.alpha,visibleRadius:29,activeRadius:34
      });
    });
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
    // B4.0D: one complete module replaces the old base and all loose overlays.
    const variants=OLD_ROAD_B4D_TEXTURES[moduleName];
    const ordinal=this.roadVisualCounters[moduleName]??0;
    this.roadVisualCounters[moduleName]=ordinal+1;
    const texture=variants[ordinal%variants.length];
    // B4E: gravel blends over the pavement edge, below walls/actors.
    // The tip alpha fades only inside the existing floor; draw order only.
    const visualLayer=moduleName==='gateTransition'?-57.45:OLD_ROAD_PROTOTYPE_LAYERS.ROAD;
    const sprite=this.addGround(texture,point.u,point.v,OLD_ROAD_CONNECTOR_STANDARD.scale,visualLayer,{
      rotation,flipX,flipY,visibleRadius:options.visibleRadius??24,activeRadius:options.activeRadius??28
    });
    const connectors={};
    Object.keys(spec.connectors).forEach(name=>{
      const vector=this.connectorVector(spec,name,rotation,flipX,flipY);
      connectors[name]={x:center.x+vector.x,y:center.y+vector.y};
    });
    const module={sprite,center,connectors,moduleName,rotation,flipX,flipY};
    sprite?.setData('oldRoadModule',{moduleName,texture,ordinal,connectors});
    return module;
  }

  /**
   * Prompt 9D-B3.8: a Estrada Velha deixa de ser um teste isolado e passa a
   * ligar o ponto inicial inferior esquerdo ao Portão Sul. O caminho é montado
   * de trás para frente a partir da boca esquerda do Y: assim a conexão final
   * é matematicamente a mesma coordenada, sem uma emenda aproximada no portão.
   */
  createOldRoadPrototype(){
    this.roadVisualCounters={};
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
    this.scene.registry.set('oldRoadVisualRebuild',{version:'B4.0D',mode:'complete-integrated-modules',moduleCounts:{...this.roadVisualCounters},looseOverlays:0});
  }

  polishOldRoadJunction(){
    // B4.2D: tiny existing ground details only at the Y and gate approach.
    // Preserve every road module, approved prop, connector and collision.
    const j=this.scene.registry.get('oldRoadConnectorTest').junction.center;
    const details=[
      ['iso_grass_tufts',0,-99.2,-90.4,.25,false],
      ['iso_grass_tufts',2,67.5,-152.3,.22,true],
      ['iso_grass_tufts',1,55.8,-56.6,.27,false],
      ['iso_grass_tufts',0,149.5,-85.9,.24,true],
      ['iso_grass_tufts',2,203.6,-150.3,.24,false],
      ['iso_grass_tufts',3,264.1,-154.2,.18,true],
      ['old_road_rocks_cluster_01',null,-80.9,-54.6,.12,true],
      ['old_road_rocks_cluster_01',null,126.8,-63.1,.15,false],
      ['old_road_rocks_cluster_01',null,236.1,-150.3,.12,false]
    ];
    for(const [key,frame,dx,dy,scale,flipX] of details){
      const x=j.x+dx,y=j.y+dy,p=this.screenToLogical(x,y);
      const image=this.scene.add.image(x,y,key,frame)
        .setOrigin(.5,key==='iso_grass_tufts'?1:.77).setScale(scale)
        .setFlipX(flipX).setAlpha(.88).setDepth(this.groundDepth(-57.4))
        .setData('aetherRenderClass','ground').setData('oldRoadJunctionPolish',true);
      this.track(image,p.u,p.v,{alwaysActive:true});
    }
  }

  update(time,u,v){
    const result=this.sectors.update(time,u,v);
    if(result.discovered)this.scene.hud?.refreshMapMarkers?.();
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
    // O limite externo do próprio terreno continua sólido; além dele não há
    // mapa renderizado. Dentro dos Arredores, porém, não pode existir colisão
    // sem uma barreira visual correspondente.
    if(u<bounds.minU+radius||v<bounds.minV+radius||u>bounds.maxU-radius||v>bounds.maxV-radius)return true;

    // A escarpa da Estrada Velha está efetivamente renderizada e a borda
    // contínua aprovada no Round96 continua sendo a barreira autoritativa.
    if(this.oldRoadEscarpment?.isBlocked?.(u,v,radius))return true;

    return false;
  }

  destroy(){this.oldRoadEscarpment?.destroy();this.groundVariationLayers?.forEach(layer=>layer?.destroy?.());this.groundSurface?.destroy?.();this.groundMask?.destroy?.();this.sectors.destroy();this.objects.length=0}
}
