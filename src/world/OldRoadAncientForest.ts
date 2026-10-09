// @ts-nocheck
import {worldClock} from './WorldClock';

/**
 * Round 79.17 — Floresta Ancestral da Estrada Velha (névoa pseudo-volumétrica).
 *
 * IMPORTANTE:
 * - A borda laranja abaixo foi reconstruída a partir da marcação vermelha
 *   feita pelo usuário em `PRIMEIRA PARTE.png` e convertida para coordenadas
 *   lógicas (u,v) usando os pontos de controle do mapa.
 * - A marcação é a geometria autoritativa: não é spline, faixa aproximada,
 *   offset de estrada ou distribuição procedural.
 * - Bases dos assets ficam dentro do polígono marcado.
 * - Sprites NÃO recebem máscara do terreno. Copas/galhos podem avançar sobre
 *   o vazio preto além de u=0 sem serem cortados, como solicitado.
 */

const BASE_PATH='assets/images/environment/outskirts/old-road-ancient-forest';

function asset(key,file,category){return Object.freeze({key,file,category,path:`${BASE_PATH}/${file}`})}

export const OLD_ROAD_ANCIENT_FOREST_ASSETS=Object.freeze({
  large01:asset('ancient_forest_tree_large_01','ancient_tree_large_01.png','tree'),
  large02:asset('ancient_forest_tree_large_02','ancient_tree_large_02.png','tree'),
  large03:asset('ancient_forest_tree_large_03','ancient_tree_large_03.png','tree'),
  large04:asset('ancient_forest_tree_large_04','ancient_tree_large_04.png','tree'),
  large05:asset('ancient_forest_tree_large_05','ancient_tree_large_05.png','tree'),
  large06:asset('ancient_forest_tree_large_06','ancient_tree_large_06.png','tree'),
  medium01:asset('ancient_forest_tree_medium_01','ancient_tree_medium_01.png','tree'),
  medium02:asset('ancient_forest_tree_medium_02','ancient_tree_medium_02.png','tree'),
  medium03:asset('ancient_forest_tree_medium_03','ancient_tree_medium_03.png','tree'),
  medium04:asset('ancient_forest_tree_medium_04','ancient_tree_medium_04.png','tree'),
  dead01:asset('ancient_forest_tree_dead_01','ancient_tree_dead_01.png','tree'),
  dead02:asset('ancient_forest_tree_dead_02','ancient_tree_dead_02.png','tree'),
  dead03:asset('ancient_forest_tree_dead_03','ancient_tree_dead_03.png','tree'),
  log01:asset('ancient_forest_log_01','fallen_ancient_log_01.png','structure'),
  log02:asset('ancient_forest_log_02','fallen_ancient_log_02.png','structure'),
  log03:asset('ancient_forest_log_03','fallen_ancient_log_03.png','structure'),
  log04:asset('ancient_forest_log_04','fallen_ancient_log_04.png','structure'),
  log05:asset('ancient_forest_log_05','fallen_ancient_log_05.png','structure'),
  root01:asset('ancient_forest_root_01','ancient_root_cluster_01.png','structure'),
  root02:asset('ancient_forest_root_02','ancient_root_cluster_02.png','structure'),
  root03:asset('ancient_forest_root_03','ancient_root_cluster_03.png','structure'),
  root04:asset('ancient_forest_root_04','ancient_root_cluster_04.png','structure'),
  root05:asset('ancient_forest_root_05','ancient_root_cluster_05.png','structure'),
  root06:asset('ancient_forest_root_06','ancient_root_cluster_06.png','structure'),
  thorn01:asset('ancient_forest_thorn_01','ancient_thorn_cluster_01.png','ground'),
  thorn02:asset('ancient_forest_thorn_02','ancient_thorn_cluster_02.png','ground'),
  thorn03:asset('ancient_forest_thorn_03','ancient_thorn_cluster_03.png','ground'),
  thorn04:asset('ancient_forest_thorn_04','ancient_thorn_cluster_04.png','ground'),
  thorn05:asset('ancient_forest_thorn_05','ancient_thorn_cluster_05.png','ground'),
  thorn06:asset('ancient_forest_thorn_06','ancient_thorn_cluster_06.png','ground'),
  thorn07:asset('ancient_forest_thorn_07','ancient_thorn_cluster_07.png','ground'),
  thorn08:asset('ancient_forest_thorn_08','ancient_thorn_cluster_08.png','ground'),
  floor01:asset('ancient_forest_floor_01','ancient_forest_floor_01.png','ground'),
  floor02:asset('ancient_forest_floor_02','ancient_forest_floor_02.png','ground'),
  floor03:asset('ancient_forest_floor_03','ancient_forest_floor_03.png','ground'),
  floor04:asset('ancient_forest_floor_04','ancient_forest_floor_04.png','ground'),
  floor05:asset('ancient_forest_floor_05','ancient_forest_floor_05.png','ground'),
  floor06:asset('ancient_forest_floor_06','ancient_forest_floor_06.png','ground'),
  floor07:asset('ancient_forest_floor_07','ancient_forest_floor_07.png','ground'),
  floor08:asset('ancient_forest_floor_08','ancient_forest_floor_08.png','ground'),
  stump01:asset('ancient_forest_stump_01','ancient_stump_01.png','structure'),
  stump02:asset('ancient_forest_stump_02','ancient_stump_02.png','structure'),
  stump03:asset('ancient_forest_stump_03','ancient_stump_03.png','structure'),
  under01:asset('ancient_forest_underbrush_01','ancient_underbrush_01.png','ground'),
  under02:asset('ancient_forest_underbrush_02','ancient_underbrush_02.png','ground'),
  under03:asset('ancient_forest_underbrush_03','ancient_underbrush_03.png','ground'),
  wall01:asset('ancient_forest_thorn_wall_01','ancient_thorn_wall_01.png','structure'),
  wall02:asset('ancient_forest_thorn_wall_02','ancient_thorn_wall_02.png','structure'),
  wall03:asset('ancient_forest_thorn_wall_03','ancient_thorn_wall_03.png','structure'),
  vistaHauntedTree01:asset('ancient_forest_vista_haunted_tree_01','haunted_tree_moss_fungi_01.png','tree'),
  vistaRoots01:asset('ancient_forest_vista_roots_01','twisted_roots_forest_01.png','structure'),
  vistaDetritus01:asset('ancient_forest_vista_detritus_01','forest_detritus_roots_leaves_01.png','ground'),
  vistaWeb01:asset('ancient_forest_vista_web_01','ancient_web_dead_branches_01.png','structure'),
  vistaStartBackdrop01:asset('ancient_forest_vista_start_backdrop_01','ancient_forest_start_vista_haunted_path_01.png','vista'),
  vistaStartBackdrop02:asset('ancient_forest_vista_start_backdrop_02','ancient_forest_start_vista_haunted_path_02.png','vista'),
  vistaStartBackdrop03:asset('ancient_forest_vista_start_backdrop_03','ancient_forest_start_vista_haunted_path_03.png','vista')
});

// Linha direita/inferior EXATA recuperada da marcação do usuário.
// Ordem: topo (próximo à carroça) -> início da estrada (próximo à placa).
export const OLD_ROAD_ANCIENT_FOREST_MARKED_EDGE=Object.freeze([
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
  {u:1.468,v:78.885},{u:0.715,v:78.804},{u:0.231,v:79.019}
]);

// Fecha a área exatamente contra a borda lógica u=0 do mapa.
export const OLD_ROAD_ANCIENT_FOREST_POLYGON=Object.freeze([
  ...OLD_ROAD_ANCIENT_FOREST_MARKED_EDGE,
  {u:0.000,v:79.019}
]);

// Pontos de base previamente medidos dentro do polígono da marcação.
// Não há aleatoriedade: cada entrada é deliberada e reproduzível.
const TREE_BASES=Object.freeze([
  [0.769,51.679],[0.500,53.933],[2.005,55.140],[0.608,56.025],
  [3.780,56.830],[1.817,57.635],[3.403,58.548],[6.253,58.736],
  [0.903,59.432],[6.065,60.532],[2.247,60.801],[0.527,61.257],
  [4.962,63.082],[0.984,63.136],[0.984,65.443],[0.876,68.180],
  [2.409,69.172],[0.634,70.728],[2.651,71.077],[4.344,72.660],
  [2.355,72.928],[0.661,72.982],[0.823,75.343],[2.489,75.451],
  [2.543,77.490],[0.742,77.517]
]);

const STRUCTURE_BASES=Object.freeze([
  [0.769,52.886],[3.108,55.757],[0.581,57.286],[1.763,58.708],
  [2.167,59.647],[3.753,61.177],[5.043,61.284],[6.306,62.304],
  [1.790,62.465],[1.387,64.262],[0.661,66.892],[1.683,67.401],
  [1.629,69.870],[3.242,69.950],[4.156,71.399],[3.215,71.962],
  [1.763,74.028],[3.914,74.136],[3.538,75.316]
]);

const GROUND_BASES=Object.freeze([
  [0.151,52.215],[1.979,53.852],[4.425,56.133],[1.710,56.589],
  [2.731,56.669],[4.828,57.286],[4.102,57.581],[6.038,57.796],
  [0.204,58.145],[5.177,59.674],[3.054,59.835],[3.618,60.291],
  [0.392,60.372],[3.403,61.847],[2.489,63.538],[0.419,64.209],
  [1.683,65.067],[1.118,66.328],[0.134,67.723],[2.059,68.126],
  [1.683,68.984],[0.258,69.628],[1.253,71.748],[0.312,74.511],
  [1.737,75.209],[0.957,76.255],
  // Round 79.6 — remover somente o thorn cluster ao lado da placa/lanterna.
  // A entrada [3.027,76.443] correspondia ao ancient_thorn_cluster_06.png
  // marcado pelo usuário e foi retirada sem alterar os demais props.
  [2.328,78.241],[1.602,78.536]
]);

const REMOVED_THORN06_CLEAR_ZONE=Object.freeze({u:3.027,v:76.443,radius:.42});

const TREE_VARIANTS=Object.freeze([
  ['large01',.94,false],['medium01',.92,true],['large02',.88,true],['dead01',.92,false],
  ['large03',.96,false],['medium02',.90,false],['large04',.90,true],['dead02',.88,true],
  ['large05',.93,false],['medium03',.94,true],['large06',.89,true],['dead03',.90,false],
  ['medium04',.96,false],['large01',.87,true],['large02',.91,false],['medium01',.89,false],
  ['large03',.92,true],['dead01',.86,true],['large04',.95,false],['medium02',.91,true],
  ['large05',.88,true],['dead02',.89,false],['large06',.93,false],['medium03',.90,false],
  ['large01',.86,false],['medium04',.93,true]
]);

const STRUCTURE_VARIANTS=Object.freeze([
  ['root01',.86,false],['log01',.77,true],['stump01',.82,false],['root02',.88,true],
  ['log02',.75,false],['root03',.84,false],['wall01',.86,false],['wall02',.84,true],
  ['log03',.76,true],['root04',.88,false],['stump02',.84,true],['root05',.86,true],
  ['log04',.74,false],['root06',.88,false],['wall03',.84,false],['stump03',.82,false],
  ['log05',.76,true],['under01',.82,false],['under02',.80,true]
]);

const GROUND_VARIANTS=Object.freeze([
  'floor01','thorn01','floor02','thorn02','under03','floor03','thorn03','floor04',
  'thorn04','floor05','thorn05','floor06','thorn06','floor07','thorn07','floor08',
  'thorn08','floor01','under01','floor02','thorn02','floor03','under02','floor04',
  'thorn04','floor05','thorn06','floor07','thorn08'
]);

// Round 79.7 — primeira passagem de atmosfera assustadora.
// Objetivo: fechar visualmente a mata, criar silhuetas mais estranhas e
// aumentar a sensação de pressão sobre a estrada sem mexer em gameplay.
const ATMOSPHERE_TREE_ACCENTS=Object.freeze([
  ['large05',0.462,54.870,.98,false],
  ['dead03',2.625,55.784,.96,true],
  ['large06',1.092,59.915,.95,false],
  ['dead02',4.516,60.935,.93,true],
  ['large03',1.215,68.662,.97,false],
  ['dead01',2.758,70.191,.95,true],
  ['large01',0.618,73.572,.98,false],
  ['dead03',2.973,74.672,.96,true],
  ['large04',0.984,76.658,.99,false],
  ['dead02',2.220,77.329,.95,true]
]);

const ATMOSPHERE_STRUCTURE_ACCENTS=Object.freeze([
  ['wall01',2.194,54.255,.90,false],
  ['root03',1.334,58.252,.88,true],
  ['wall02',4.613,61.069,.87,true],
  ['log04',2.838,69.521,.78,false],
  ['root06',1.495,71.238,.90,false],
  ['wall03',3.215,73.706,.86,false],
  ['root02',1.468,75.987,.88,true],
  ['wall01',2.597,77.248,.88,false]
]);

const ATMOSPHERE_GROUND_ACCENTS=Object.freeze([
  ['thorn07',1.118,54.523,.86,false,-.04],
  ['thorn05',3.833,56.937,.84,true,.03],
  ['thorn08',2.516,60.935,.87,false,0],
  ['under03',1.898,64.799,.82,true,.05],
  ['thorn06',1.898,69.843,.86,true,-.02],
  ['under01',2.032,71.989,.84,false,.02],
  ['thorn07',1.226,73.384,.88,false,.04],
  ['under02',2.140,75.799,.82,true,-.03],
  ['thorn08',1.280,77.302,.86,true,.03]
]);

const FOREST_SHADOW_PATCHES=Object.freeze([
  ['broad',1.118,54.684,310,168,-.18,.18],
  ['broad',2.301,58.333,428,210,-.16,.22],
  ['broad',1.656,61.955,448,228,-.12,.24],
  ['dense',1.414,65.228,352,196,-.14,.27],
  ['broad',1.952,69.655,478,246,-.10,.30],
  ['dense',1.575,72.875,390,214,-.08,.32],
  ['dense',1.307,75.853,336,188,-.06,.28],
  ['soft',1.763,77.248,248,140,-.05,.16]
]);

// Round 79.28 — emissores de névoa rasteira. Cada ponto gera pequenos
// volumes procedurais independentes em background/mid/foreground; não existe
// mais um grande quad/shader recortado pelo polígono da floresta.
const FOREST_FOG_BANDS=Object.freeze([
  ['ribbon',1.145,54.657,300,58,-.12,.72,14,2,.30,.30],
  ['broad',2.382,58.494,420,66,-.10,.82,18,3,.27,1.10],
  ['ribbon',1.629,62.062,392,62,-.08,.86,16,2,.30,2.05],
  ['pocket',1.468,65.604,286,58,-.06,.90,11,3,.24,2.80],
  ['broad',2.005,69.655,450,72,-.05,.95,20,3,.22,3.55],
  ['ribbon',1.602,72.714,364,62,-.04,.88,14,2,.26,4.25],
  ['soft',1.361,74.109,252,52,-.03,.70,9,2,.28,5.10]
]);

function ensureForestShadowTexture(scene,key,{width=512,height=320,stops=[[0,.52],[.28,.34],[.58,.16],[1,0]]}={}){
  if(scene.textures.exists(key))return key;
  const texture=scene.textures.createCanvas(key,width,height);
  const ctx=texture?.getContext?.();
  if(!ctx)return key;
  ctx.clearRect(0,0,width,height);
  const cx=width*.5, cy=height*.5, rx=width*.5, ry=height*.5;
  for(let i=stops.length-1;i>=0;i--){
    const [offset,alpha]=stops[i];
    const r=Math.max(.01,1-offset);
    ctx.fillStyle=`rgba(0,0,0,${alpha})`;
    ctx.beginPath();
    ctx.ellipse(cx,cy,Math.max(1,rx*r),Math.max(1,ry*r),0,0,Math.PI*2);
    ctx.fill();
    ctx.fillStyle=`rgba(0,0,0,${Math.max(0,alpha*.68)})`;
    ctx.beginPath();
    ctx.ellipse(cx-width*.06,cy+height*.03,Math.max(1,rx*r*.86),Math.max(1,ry*r*.74),-.22,0,Math.PI*2);
    ctx.fill();
  }
  texture.refresh();
  return key;
}

function pointInPolygon(u,v,polygon=OLD_ROAD_ANCIENT_FOREST_POLYGON){
  let inside=false;
  for(let i=0,j=polygon.length-1;i<polygon.length;j=i++){
    const a=polygon[i],b=polygon[j];
    const crosses=((a.v>v)!==(b.v>v))&&(u<(b.u-a.u)*(v-a.v)/(b.v-a.v)+a.u);
    if(crosses)inside=!inside;
  }
  return inside;
}

function circleTouchesPolygon(u,v,_radius){
  // Round 79.6 — a vegetação removida ao lado da placa/lanterna não deve
  // deixar colisão fantasma. Abrir somente esse pequeno bolso local.
  const du=u-REMOVED_THORN06_CLEAR_ZONE.u;
  const dv=v-REMOVED_THORN06_CLEAR_ZONE.v;
  if((du*du+dv*dv)<=REMOVED_THORN06_CLEAR_ZONE.radius*REMOVED_THORN06_CLEAR_ZONE.radius)return false;

  // A marcação é o limite físico exato. Não dilatar o polígono pelo raio do
  // ator: isso criaria colisão fora da área vermelha e violaria a referência.
  return pointInPolygon(u,v);
}


export class OldRoadAncientForest{
  constructor(territory){
    this.territory=territory;
    this.scene=territory.scene;
    this.sprites=[];
    this.shadowSprites=[];
    this.fogZoneHandle=null;
    this.build();
    this.scene.events.on('update',this.updateShadowLayer,this);
    this.scene.events.once('shutdown',()=>this.destroy());
  }

  assertBaseInside(u,v,label){
    if(!pointInPolygon(u,v))throw new Error(`[OldRoadAncientForest] base fora da marcação: ${label} @ ${u},${v}`);
  }

  addVertical(assetName,u,v,scale,flipX=false){
    this.assertBaseInside(u,v,assetName);
    const art=OLD_ROAD_ANCIENT_FOREST_ASSETS[assetName];
    if(!art||!this.scene.textures.exists(art.key))return null;
    const p=this.territory.project(u,v);
    const source=this.scene.textures.get(art.key).getSourceImage();
    // O kit foi recortado com 12 px transparentes em cada margem. Ancorar no
    // último pixel útil evita que troncos/tocos pareçam flutuar.
    const originY=Math.max(.86,Math.min(1,(source.height-12)/source.height));
    const sprite=this.scene.add.image(p.x,p.y,art.key)
      .setOrigin(.5,originY).setScale(scale).setFlipX(flipX)
      .setDepth(this.territory.depthAt(u,v,.06));
    sprite.setData('oldRoadAncientForest',{asset:art.file,u,v,scale,markedArea:true,unmaskedAtWorldEdge:true});
    this.territory.track(sprite,u,v,{visibleRadius:35,activeRadius:40});
    this.sprites.push(sprite);
    return sprite;
  }

  addGround(assetName,u,v,scale=.86,flipX=false,rotation=0){
    this.assertBaseInside(u,v,assetName);
    const art=OLD_ROAD_ANCIENT_FOREST_ASSETS[assetName];
    if(!art||!this.scene.textures.exists(art.key))return null;
    const p=this.territory.project(u,v);
    const sprite=this.scene.add.image(p.x,p.y,art.key)
      .setOrigin(.5,.72).setScale(scale).setFlipX(flipX).setRotation(rotation)
      .setDepth(this.territory.groundDepth(-70.40));
    sprite.setData('aetherRenderClass','ground');
    sprite.setData('oldRoadAncientForest',{asset:art.file,u,v,scale,markedArea:true,unmaskedAtWorldEdge:true});
    this.territory.track(sprite,u,v,{visibleRadius:35,activeRadius:40});
    this.sprites.push(sprite);
    return sprite;
  }

  tryAddVertical(assetName,u,v,scale,flipX=false){
    if(!pointInPolygon(u,v))return null;
    return this.addVertical(assetName,u,v,scale,flipX);
  }

  tryAddGround(assetName,u,v,scale=.86,flipX=false,rotation=0){
    if(!pointInPolygon(u,v))return null;
    return this.addGround(assetName,u,v,scale,flipX,rotation);
  }


  addVistaSprite(textureKey,x,y,{originX=.5,originY=.98,scale=1,flipX=false,rotation=0,alpha=1,depth=null,blendMode=null,visibleRadius=36,activeRadius=42,meta={}}={}){
    if(!this.scene.textures.exists(textureKey))return null;
    const sprite=this.scene.add.image(x,y,textureKey)
      .setOrigin(originX,originY)
      .setScale(scale)
      .setFlipX(flipX)
      .setRotation(rotation)
      .setAlpha(alpha)
      .setDepth(depth??this.territory.groundDepth(-70.38));
    if(blendMode!=null)sprite.setBlendMode(blendMode);
    sprite.setData('oldRoadAncientForest',{
      stage:'v0.3.1-round10-start-vista',
      visualOnly:true,
      nonPlayable:true,
      ...meta
    });
    // Visual somente: registrar no mesmo setor do início da estrada para o
    // culling básico, sem criar colisão nem alterar bounds do mapa.
    this.territory.track(sprite,.8,77.4,{visibleRadius,activeRadius});
    this.sprites.push(sprite);
    return sprite;
  }

  buildStartVista(){
    const signEntry=this.territory.oldRoadProps?.props?.find?.(prop=>prop.role==='start-sign');
    if(!signEntry?.sprite)return;

    const sign=signEntry.sprite;
    const lanternEntry=this.territory.oldRoadProps?.props?.find?.(prop=>prop.role==='start-sign-lantern');
    const lantern=lanternEntry?.sprite??null;

    const baseDepth=this.territory.groundDepth(-70.42);

    // v0.3.1-round10 — a vista passa a ser tratada como backdrop ancorado
    // no mapa real e não como bloco jogado sobre a entrada. A arte usada aqui
    // já foi pré-recortada com alpha: a metade direita foi suavizada e a zona
    // jogável/estrada próxima à placa foi aberta, preservando a estrada atual,
    // impedindo o jogador de "andar sobre a imagem" e cobrindo toda a faixa
    // preta à esquerda.
    const backdrop=this.addVistaSprite('ancient_forest_vista_start_backdrop_03',sign.x-782,sign.y-486,{
      originX:0,
      originY:0,
      scale:.84,
      alpha:1,
      depth:baseDepth,
      visibleRadius:72,
      activeRadius:80,
      meta:{
        role:'start-vista-backdrop',
        integration:'anchored-left-backdrop-with-transparent-road-transition',
        visualOnly:true,
        anchoredTo:'start-sign',
        offsetX:-782,
        offsetY:-486,
        scale:.84,
        source:'ancient_forest_start_vista_haunted_path_03.png'
      }
    });

    // Sombra de assentamento do backdrop sobre o triângulo preto e de transição
    // com o chão real na entrada da Estrada Velha.
    const shadowTexture=ensureForestShadowTexture(this.scene,'old-road-start-vista-shadow-round10',{
      width:620,height:300,stops:[[0,.36],[.24,.18],[.58,.08],[1,0]]
    });
    this.addVistaSprite(shadowTexture,sign.x-352,sign.y+32,{
      originX:.5,originY:.5,scale:1,alpha:.30,depth:baseDepth-.04,
      blendMode:Phaser.BlendModes.MULTIPLY,
      meta:{role:'start-vista-shadow',integration:'anchored-left-backdrop'}
    })?.setDisplaySize?.(620,260);

    // Pequena sombra local apenas na junção da estrada para esconder a emenda
    // entre a trilha da arte sinistra e a estrada real do mapa.
    this.addVistaSprite(shadowTexture,sign.x-118,sign.y+8,{
      originX:.5,originY:.5,scale:1,alpha:.18,depth:baseDepth-.03,
      blendMode:Phaser.BlendModes.MULTIPLY,
      meta:{role:'start-vista-road-blend',integration:'road-transition-soft-shadow'}
    })?.setDisplaySize?.(220,110);

    if(backdrop?.setTint){
      // Leve resfriamento/desaturação para aproximar a paleta da floresta
      // sinistra aprovada, sem apagar detalhe do asset.
      backdrop.setTint(0xd2dbd7);
    }

    if(lantern?.setDepth&&backdrop){
      lantern.setDepth(Math.max(lantern.depth,backdrop.depth+.08));
    }
  }


  forestShadowIntensity(timeOfDayMs=worldClock.timeOfDayMs){
    const minutes=((timeOfDayMs/60000)%1440+1440)%1440;
    if(minutes>=1170||minutes<300)return 1; // 19:30–05:00
    if(minutes>=990)return .74+((minutes-990)/180)*.26; // 16:30–19:30
    if(minutes>=300&&minutes<360)return .90-((minutes-300)/60)*.16; // 05:00–06:00
    return .74;
  }

  buildShadowLayer(){
    ensureForestShadowTexture(this.scene,'old-road-forest-shadow-soft',{
      width:360,height:220,stops:[[0,.42],[.28,.24],[.56,.11],[1,0]]
    });
    ensureForestShadowTexture(this.scene,'old-road-forest-shadow-broad',{
      width:520,height:320,stops:[[0,.54],[.26,.33],[.56,.17],[1,0]]
    });
    ensureForestShadowTexture(this.scene,'old-road-forest-shadow-dense',{
      width:420,height:260,stops:[[0,.62],[.22,.40],[.50,.22],[1,0]]
    });

    const textureByType={
      soft:'old-road-forest-shadow-soft',
      broad:'old-road-forest-shadow-broad',
      dense:'old-road-forest-shadow-dense'
    };
    const depth=this.territory.groundDepth(-70.34);

    FOREST_SHADOW_PATCHES.forEach(([type,u,v,width,height,rotation,baseAlpha],index)=>{
      this.assertBaseInside(u,v,`forest-shadow-${index+1}`);
      const p=this.territory.project(u,v);
      const sprite=this.scene.add.image(p.x,p.y,textureByType[type])
        .setOrigin(.5,.5)
        .setDisplaySize(width,height)
        .setRotation(rotation)
        .setAlpha(baseAlpha*this.forestShadowIntensity())
        .setBlendMode(Phaser.BlendModes.MULTIPLY)
        .setDepth(depth+.001*index);
      sprite.setData('oldRoadAncientForestShadow',{type,u,v,width,height,rotation,baseAlpha,stage:'Round79.8'});
      this.territory.track(sprite,u,v,{visibleRadius:40,activeRadius:46});
      this.shadowSprites.push(sprite);
    });
  }

  updateShadowLayer(){
    const intensity=this.forestShadowIntensity();
    for(const sprite of this.shadowSprites){
      const data=sprite?.getData?.('oldRoadAncientForestShadow');
      if(!data)continue;
      sprite.setAlpha(data.baseAlpha*intensity);
    }
  }

  forestFogIntensity(timeOfDayMs=worldClock.timeOfDayMs){
    const minutes=((timeOfDayMs/60000)%1440+1440)%1440;
    if(minutes>=1200||minutes<300)return 1; // 20:00–05:00
    if(minutes>=1140)return .72+((minutes-1140)/60)*.28; // 19:00–20:00
    if(minutes>=1080)return .40+((minutes-1080)/60)*.32; // 18:00–19:00
    if(minutes>=1020)return .18+((minutes-1020)/60)*.22; // 17:00–18:00
    if(minutes>=300&&minutes<390)return 1-((minutes-300)/90)*.82; // 05:00–06:30
    return .18;
  }

  registerGlobalFogZone(){
    const fog=this.scene.worldFog;
    if(!fog?.registerZone)return;

    const polygon=OLD_ROAD_ANCIENT_FOREST_POLYGON.map(point=>this.territory.project(point.u,point.v));
    const bands=FOREST_FOG_BANDS.map(([type,u,v,width,height,rotation,opacity,driftX,driftY,speed,phase])=>{
      this.assertBaseInside(u,v,`forest-fog-${type}`);
      const p=this.territory.project(u,v);
      return {type,x:p.x,y:p.y,u,v,width,height,rotation,opacity,driftX,driftY,speed,phase};
    });

    this.fogZoneHandle=fog.registerZone({
      id:'old-road-ancient-forest',
      polygon,
      bands,
      color:0x809087,
      density:.46,
      // Estratégia 2 usada apenas como perspectiva atmosférica muito sutil.
      // Ground decals ficam intactos; apenas árvores/estruturas distantes
      // recebem até ~6% de tint no pico da névoa.
      atmosphereTargets:this.sprites.filter(sprite=>sprite?.getData?.('aetherRenderClass')!=='ground'),
      atmosphereTintStrength:.06,
      schedule:(timeOfDayMs)=>this.forestFogIntensity(timeOfDayMs)
    });
  }

  build(){
    GROUND_BASES.forEach(([u,v],i)=>{
      const name=GROUND_VARIANTS[i%GROUND_VARIANTS.length];
      this.addGround(name,u,v,.78+(i%4)*.035,!!(i%2),((i%5)-2)*.035);
    });

    STRUCTURE_BASES.forEach(([u,v],i)=>{
      const [name,scale,flipX]=STRUCTURE_VARIANTS[i];
      this.addVertical(name,u,v,scale,flipX);
    });

    TREE_BASES.forEach(([u,v],i)=>{
      const [name,scale,flipX]=TREE_VARIANTS[i];
      this.addVertical(name,u,v,scale,flipX);
    });

    ATMOSPHERE_GROUND_ACCENTS.forEach(([name,u,v,scale,flipX,rotation])=>{
      this.tryAddGround(name,u,v,scale,flipX,rotation);
    });

    ATMOSPHERE_STRUCTURE_ACCENTS.forEach(([name,u,v,scale,flipX])=>{
      this.tryAddVertical(name,u,v,scale,flipX);
    });

    ATMOSPHERE_TREE_ACCENTS.forEach(([name,u,v,scale,flipX])=>{
      this.tryAddVertical(name,u,v,scale,flipX);
    });

    this.buildShadowLayer();
    this.registerGlobalFogZone();
    this.buildStartVista();

    // Round 79.4 — a posição/escala/arte da lanterna aprovada não muda.
    // Apenas sua ordem de desenho é corrigida quando algum sprite da floresta
    // realmente ocupa a mesma área visual: a lanterna sobe somente o mínimo
    // necessário para ficar à frente desses sprites sobrepostos. Isso evita um
    // depth global exagerado e não altera a composição da floresta.
    this.keepStartLanternInFrontOfForest();

    this.scene.registry.set('oldRoadAncientForest',{
      version:'v0.3.1-round10',
      sourceReference:'PRIMEIRA PARTE.png',
      exactMarkedPolygon:true,
      maskedAtTerrainEdge:false,
      assetBases:{trees:TREE_BASES.length,structures:STRUCTURE_BASES.length,ground:GROUND_BASES.length},
      atmosphereAccents:{trees:ATMOSPHERE_TREE_ACCENTS.length,structures:ATMOSPHERE_STRUCTURE_ACCENTS.length,ground:ATMOSPHERE_GROUND_ACCENTS.length},
      localShadowPatches:FOREST_SHADOW_PATCHES.length,
      lowFogBands:FOREST_FOG_BANDS.length,
      fogSystem:'WorldFogSystem',
      fogRenderer:'world-space-multi-depth-procedural-wisps',
      fogLayerDepth:'depth-sorted-background-mid-foreground',
      fogAboveWorldLighting:false,
      fogReactsToLights:true,
      fogCollision:false,
      clearZoneRemovedThorn06:{...REMOVED_THORN06_CLEAR_ZONE},
      startVista:{
        version:'v0.3.1-round10',
        visualOnly:true,
        anchoredTo:'start-sign-lantern',
        backdropSprite:1,
        roadSegments:0,
        groundProps:0,
        structures:0,
        trees:0,
        webs:0,
        worldBoundsExpanded:false,
        collisionAdded:false
      },
      polygon:OLD_ROAD_ANCIENT_FOREST_POLYGON.map(p=>({...p}))
    });
  }


  keepStartLanternInFrontOfForest(){
    const lanternEntry=this.territory.oldRoadProps?.props?.find?.(prop=>prop.role==='start-sign-lantern');
    const lantern=lanternEntry?.sprite;
    if(!lantern?.getBounds)return;

    const lanternBounds=lantern.getBounds();
    let highestOverlappingForestDepth=-Infinity;
    let overlapCount=0;
    for(const sprite of this.sprites){
      if(!sprite?.getBounds)continue;
      const bounds=sprite.getBounds();
      if(!Phaser.Geom.Intersects.RectangleToRectangle(lanternBounds,bounds))continue;
      highestOverlappingForestDepth=Math.max(highestOverlappingForestDepth,sprite.depth);
      overlapCount++;
    }

    if(highestOverlappingForestDepth>-Infinity&&lantern.depth<=highestOverlappingForestDepth)
      lantern.setDepth(highestOverlappingForestDepth+.01);

    lantern.setData('oldRoadLanternForestDepthFix',{
      version:'Round79.16',
      overlapCount,
      lanternDepth:lantern.depth,
      highestOverlappingForestDepth:highestOverlappingForestDepth===-Infinity?null:highestOverlappingForestDepth,
      positionPreserved:true,
      scalePreserved:true
    });
  }

  isBlocked(u,v,radius=.27){return circleTouchesPolygon(u,v,radius)}

  destroy(){
    this.scene?.events?.off?.('update',this.updateShadowLayer,this);
    this.fogZoneHandle?.destroy?.();
    this.fogZoneHandle=null;
    for(const sprite of this.shadowSprites)sprite?.destroy?.();
    for(const sprite of this.sprites)sprite?.destroy?.();
    this.shadowSprites.length=0;
    this.sprites.length=0;
  }
}
