// @ts-nocheck

/**
 * Fonte única de verdade para a geografia contínua Cidade de Aether +
 * Arredores. As coordenadas são lógicas/isométricas (u,v), nunca pixels de
 * uma pintura. Assim câmera, colisão, save, minimapa e descoberta consultam o
 * mesmo território.
 */
export const AETHER_LOGICAL_BOUNDS={minU:0,minV:0,maxU:82,maxV:82};

export const AETHER_WORLD_BOUNDS={
  left:-2700,
  top:-420,
  width:8700,
  height:5000
};

// Novo Jogo: pés do personagem no começo da Estrada Velha, ao lado da borda
// sudoeste do terreno e antes da placa Aether (referência visual do usuário).
// Não altera saves existentes, entradas por portões ou pontos de respawn.
export const AETHER_NEW_GAME_SPAWN={
  id:'old-aether-road-new-game',u:1.35,v:81.4,facing:'upRight',safeRadius:3.2
};

/** Mantém compatibilidade com consumidores do Prompt 9. */
export const AETHER_FUTURE_NEW_GAME_SPAWN=AETHER_NEW_GAME_SPAWN;

/** Pontos físicos do prólogo; todos vivem no território contínuo existente. */
export const AETHER_PROLOGUE_ANCHORS=Object.freeze({
  spawn:AETHER_NEW_GAME_SPAWN,
  roadSign:{u:8.5,v:66.0},
  travelSupplies:{u:8.0,v:63.15},
  youngWolf:{u:9.0,v:59.55},
  // A carroça fica depois dos Batedores no sentido da Cidade: o fluxo físico
  // acompanha a narrativa, sem retorno artificial pela estrada.
  attackedWagon:{u:11.25,v:45.35},
  goblinScouts:[{u:10.5,v:48.8},{u:12.15,v:47.25}],
  patrol:{u:11.9,v:41.55},
  cityVista:{u:13.1,v:34.5},
  southGate:{u:14,v:26.2}
});

export const AETHER_GATE_APPROACHES={
  south:{inside:{u:14,v:25.02},outside:{u:14,v:28.4}},
  east:{inside:{u:25.02,v:14},outside:{u:28.4,v:14}}
};

export const AETHER_OLD_ROAD=[
  {u:7.7,v:76},{u:7.5,v:71},{u:8.2,v:65.5},{u:9,v:59.5},
  {u:10,v:53.5},{u:10.9,v:47.5},{u:11.7,v:41.8},
  {u:12.8,v:35.2},{u:13.6,v:30.2},{u:14,v:26.2}
];

export const AETHER_LANDMARKS=[
  {id:'old-aether-road',label:'Estrada Velha de Aether',u:9.4,v:58.5,discoveryRadius:7.5,color:0xd6b06a},
  {id:'aether-vista',label:'Vista de Aether',u:13.1,v:34.5,discoveryRadius:5.4,color:0xf1d48d},
  {id:'stream',label:'Riacho dos Arredores',u:44.7,v:31,discoveryRadius:5.6,color:0x78cbe5},
  {id:'lake',label:'Lago de Aether',u:52,v:50.2,discoveryRadius:7.2,color:0x68bdda},
  {id:'shrine',label:'Santuário Antigo',u:55.5,v:23.2,discoveryRadius:5.8,color:0xc6b0e7},
  {id:'ruins',label:'Ruínas dos Arredores',u:20.4,v:66,discoveryRadius:5.8,color:0xbfa680},
  {id:'cave',label:'Caverna / Fenda',u:58.8,v:65,discoveryRadius:5.6,color:0xa6adb7},
  {id:'greenwoods-gate',label:'Entrada de Greenwoods',u:72,v:48.5,discoveryRadius:7.2,color:0x69b982}
];

/** Setores lógicos: a ordem de AETHER_SECTOR_PRIORITY resolve sobreposições. */
export const AETHER_SECTORS={
  CITY_CENTER:{id:'CITY_CENTER',shape:'rect',u1:2,v1:2,u2:26,v2:26},
  CITY_RESIDENTIAL:{id:'CITY_RESIDENTIAL',shape:'rect',u1:2,v1:16,u2:12,v2:26},
  CITY_SOUTH_GATE:{id:'CITY_SOUTH_GATE',shape:'rect',u1:11.7,v1:22.4,u2:16.3,v2:33.2},
  CITY_EAST_GATE:{id:'CITY_EAST_GATE',shape:'rect',u1:22.4,v1:11.7,u2:33.2,v2:16.3},
  OUTSKIRTS_OLD_AETHER_ROAD:{id:'OUTSKIRTS_OLD_AETHER_ROAD',shape:'rect',u1:0,v1:29,u2:18.5,v2:82},
  OUTSKIRTS_NEAR_CITY:{id:'OUTSKIRTS_NEAR_CITY',shape:'rect',u1:0,v1:0,u2:39,v2:41},
  OUTSKIRTS_MAIN_ROAD:{id:'OUTSKIRTS_MAIN_ROAD',shape:'rect',u1:14,v1:27,u2:72,v2:50},
  OUTSKIRTS_STREAM:{id:'OUTSKIRTS_STREAM',shape:'rect',u1:36,v1:6,u2:51,v2:48},
  OUTSKIRTS_LAKE:{id:'OUTSKIRTS_LAKE',shape:'ellipse',u:52,v:50.2,radiusU:9.2,radiusV:7.7},
  OUTSKIRTS_SHRINE:{id:'OUTSKIRTS_SHRINE',shape:'rect',u1:48,v1:13,u2:62,v2:31},
  OUTSKIRTS_RUINS:{id:'OUTSKIRTS_RUINS',shape:'rect',u1:12,v1:59,u2:39,v2:78},
  OUTSKIRTS_CAVE:{id:'OUTSKIRTS_CAVE',shape:'rect',u1:48,v1:58,u2:65,v2:76},
  OUTSKIRTS_GREENWOODS_GATE:{id:'OUTSKIRTS_GREENWOODS_GATE',shape:'rect',u1:64,v1:32,u2:82,v2:69}
};

export const AETHER_SECTOR_PRIORITY=[
  'CITY_SOUTH_GATE','CITY_EAST_GATE','CITY_RESIDENTIAL','CITY_CENTER',
  'OUTSKIRTS_GREENWOODS_GATE','OUTSKIRTS_CAVE','OUTSKIRTS_RUINS',
  'OUTSKIRTS_LAKE','OUTSKIRTS_SHRINE',
  'OUTSKIRTS_STREAM','OUTSKIRTS_OLD_AETHER_ROAD','OUTSKIRTS_NEAR_CITY',
  'OUTSKIRTS_MAIN_ROAD'
];

export function pointInSector(sector,u,v){
  if(!sector)return false;
  if(sector.shape==='ellipse'){
    const du=(u-sector.u)/sector.radiusU,dv=(v-sector.v)/sector.radiusV;
    return du*du+dv*dv<=1;
  }
  return u>=sector.u1&&u<=sector.u2&&v>=sector.v1&&v<=sector.v2;
}

export function getAetherSector(u,v){
  for(const id of AETHER_SECTOR_PRIORITY){
    const sector=AETHER_SECTORS[id];
    if(pointInSector(sector,u,v))return id;
  }
  return 'OUTSKIRTS_MAIN_ROAD';
}

/** Migração determinística dos antigos Arredores cartesianos para o território. */
export function legacyWorldPositionToIso(position={}){
  const x=Number(position.x),y=Number(position.y);
  if(!Number.isFinite(x)||!Number.isFinite(y))return {u:14,v:25.02};
  if(x>=80&&x<=1480&&y>=80&&y<=1120)return {u:14,v:25.02};
  if(x>=3650&&y<900)return {u:68.2,v:47.2};
  if(x>=3200&&y>=1450)return {u:55.5,v:64.5};
  if(x>=2050&&x<=2700&&y>=1200)return {u:44,v:55.5};
  if(x>=1150&&x<=2200&&y>=1080)return {u:25,v:51.5};
  return {u:31,v:39};
}
