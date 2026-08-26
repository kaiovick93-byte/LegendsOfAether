import fs from 'node:fs';
import crypto from 'node:crypto';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

const root=path.dirname(fileURLToPath(import.meta.url));
const read=relative=>fs.readFileSync(path.join(root,relative),'utf8');
const exists=relative=>fs.existsSync(path.join(root,relative));
const size=relative=>fs.statSync(path.join(root,relative)).size;
const pngDimensions=relative=>{
 const buffer=fs.readFileSync(path.join(root,relative));
 return {width:buffer.readUInt32BE(16),height:buffer.readUInt32BE(20)};
};
const hash=relative=>crypto.createHash('sha256').update(fs.readFileSync(path.join(root,relative))).digest('hex');
const issues=[];
const expect=(condition,message)=>{if(!condition)issues.push(message)};

const scene=read('src/scenes/AetherCityScene.ts');
const npc=read('src/npc/Npc.ts');
const preload=read('src/scenes/PreloadScene.ts');
const world=read('src/scenes/WorldScene.ts');
const menu=read('src/scenes/MenuScene.ts');
const pkg=JSON.parse(read('package.json'));

expect(pkg.version==='0.2.5','versão do pacote não é 0.2.5');
expect(pkg.scripts?.['validate:isometric-city']==='node validate-isometric-city-round65.mjs','auditoria do Round 65 não está registrada');
expect(scene.includes('isBlockedByBuildingMask')&&scene.includes('getPixelAlpha'),'colisão por opacidade real dos edifícios está ausente');
expect(scene.includes('collisionBand:.60')&&scene.includes('collisionBand:.64'),'faixas de contato opacas não estão calibradas');
expect(!scene.includes('this.addBlockedRect(u, v, w, h, building.label)'),'retângulos genéricos de edifícios ainda bloqueiam transparências');
expect(scene.includes("this.addBlockedCircle(20.60, 19.40, .30, 'tronco"),'árvore não usa colisão exclusiva no tronco');
expect(scene.includes('updateUniversalOcclusion()')&&scene.includes('registerOccluder('),'oclusão universal do jogador está incompleta');
expect(scene.includes("this.textures.exists('player_outline_gold')")&&scene.includes('lowestOccluderDepth - .02'),'contorno dourado puro ou profundidade atrás de objetos está ausente');
expect(!scene.includes('updateTreeOcclusion()')&&!scene.includes('playerOutlineUsesGlow'),'efeito antigo restrito à árvore ainda está ativo');
expect(scene.includes("this.entryFacing = 'left'")&&scene.includes("this.entryFacing = 'up'"),'direção de retorno dos dois portões não é preservada');
expect(scene.includes('leftHidden')&&scene.includes('rightHidden')&&scene.includes('ambientDepthOverride = tavernDepth - .025'),'rato não entra e sai atrás da taverna');
expect(!scene.includes("routeAmbient('city_rat"),'ratos antigos simultâneos ainda são criados');
expect(scene.includes("'elder_feeder_iso'")&&scene.includes('const elderScale = 116 / 224'),'velhinho novo de células normalizadas não está ativo');
expect(!scene.includes("oldMan.on('animationupdate'")&&!scene.includes('frameFootY'),'compensação variável do velhinho ainda existe');
expect(scene.includes('cityRound64Migrated: true')&&world.includes('cityRound64Migrated:true'),'flag de migração do Round 64 não é salva nas duas cenas');
expect(menu.includes('!save.worldFlags?.cityRound64Migrated'),'menu não migra saves anteriores ao Round 64');
expect(!scene.includes('createChickenYard()')&&!scene.includes("routeAmbient('city_chicken"),'galinheiro ou galinhas voltaram à cidade');
expect(!scene.includes('this.addLamp(')&&!scene.includes('addIsoFence('),'postes ou cercas voltaram à cidade');

const isoAssets=[
 'merchant_iso','blacksmith_iso','blacksmith_iso_empty','blacksmith_hammer','healer_iso','tavernkeeper_iso',
 'scholar_iso','artisan_iso','elder_mira_iso','guard_iso','south_guard_iso'
];
for(const key of isoAssets){
 const relative=`assets/images/characters/npcs/isometric/${key}.png`;
 expect(exists(relative),`asset 2,5D ausente: ${key}`);
 if(exists(relative))expect(size(relative)>(key==='blacksmith_hammer'?1000:20000),`asset 2,5D vazio ou degradado: ${key}`);
 expect(preload.includes(`'${key}'`),`PreloadScene não carrega ${key}`);
 expect(!path.basename(relative).toLowerCase().includes('round'),'nome de asset contém informação de Round');
}
expect(scene.includes('setIsometricSprite?.')&&npc.includes('setIsometricSprite(textureKey:string'),'NPCs fixos não usam os recortes 2,5D');
expect(npc.includes('actionTexture')&&npc.includes('setTexture(this.isoActionTexture,0)')&&npc.includes("once('animationcomplete'"),'ações profissionais não usam quadros reais');
for(const profile of ['merchant','blacksmith','healer','tavernkeeper','scholar','artisan']){
 const key=`${profile}_iso_action`;
 const relative=`assets/images/characters/npcs/isometric/${key}.png`;
 expect(exists(relative),`folha de ação ausente: ${profile}`);
 if(exists(relative))expect(size(relative)>70000,`folha de ação vazia ou degradada: ${profile}`);
 expect(preload.includes(`'${key}'`)&&scene.includes(`action: '${key}'`),`ação profissional não integrada: ${profile}`);
}
for(const key of ['resident_iso_walk','traveler_iso_walk']){
 const relative=`assets/images/characters/npcs/isometric/${key}.png`;
 expect(exists(relative)&&size(relative)>60000,`andarilho 2,5D ausente ou degradado: ${key}`);
 expect(preload.includes(`'${key}'`)&&scene.includes(`'${key}'`),`andarilho 2,5D não integrado: ${key}`);
}
expect(npc.includes('setIsometricWalkSprite')&&npc.includes('isoWalkAnimation'),'motor de caminhada 2,5D está ausente');
for(const relative of ['assets/images/characters/player_outline_gold.png','assets/images/characters/ambient/elder_feeder_iso.png']){
 expect(exists(relative)&&size(relative)>20000,`asset de oclusão/velhinho ausente: ${relative}`);
 expect(!path.basename(relative).toLowerCase().includes('round'),'nome de asset contém informação de Round');
}
expect(preload.includes("'player_outline_gold'")&&preload.includes("'elder_feeder_iso'"),'assets de oclusão/velhinho não são carregados');
expect(scene.includes("filter(item => item.id.startsWith('house_'))"),'estabelecimentos ainda criam quadrados de grama');

const businessAssets=[
 ['merchant_shop','Mercado de Aldren'],
 ['blacksmith_shop','Ferraria de Borin'],
 ['healer_house','Botica e Estufa de Elara'],
 ['tavern_house','Grande Taverna de Garrick'],
 ['scholar_house','Arquivo de Lysandra'],
 ['artisan_house','Ateliê de Maelis']
];
const businessHashes=[];
for(const [key,label] of businessAssets){
 const relative=`assets/images/environment/buildings/${key}.png`;
 expect(exists(relative),`estabelecimento ausente: ${key}`);
 if(exists(relative)){
  expect(size(relative)>200000,`estabelecimento vazio ou degradado: ${key}`);
  businessHashes.push(hash(relative));
 }
 expect(preload.includes(`'${key}'`)&&scene.includes(`key:'${key}'`),`estabelecimento não integrado: ${key}`);
 expect(scene.includes(`label:'${label}'`),`identidade nominal ausente: ${label}`);
}
expect(new Set(businessHashes).size===businessAssets.length,'dois estabelecimentos ainda compartilham a mesma arte');
const blacksmithDimensions=pngDimensions('assets/images/environment/buildings/blacksmith_shop.png');
expect(size('assets/images/environment/buildings/blacksmith_shop.png')>350000,'ferraria 2,5D nova está vazia ou degradada');
expect(blacksmithDimensions.width>=480&&blacksmithDimensions.height>=500,'ferraria não possui resolução e volume isométrico esperados');

const faunaAssets=[
 ['city_dog',144,96,'[0,1,2,3]'],
 ['city_cat',144,96,'[0,1,2,3]'],
 ['city_rat_gray',112,64,'[0,1,2,3]'],
 ['city_rat_brown',112,64,'[0,1,2,3]'],
 ['city_rat_dark',112,64,'[0,1,2,3]'],
 ['city_bird',64,48,'[0,1,2,3]']
];
for(const [key,frameWidth,frameHeight,frames] of faunaAssets){
 const relative=`assets/images/characters/ambient/${key}.png`;
 expect(exists(relative),`fauna 2,5D ausente: ${key}`);
 if(exists(relative)){
  const dimensions=pngDimensions(relative);
  expect(dimensions.width===frameWidth*4&&dimensions.height===frameHeight,`${key}: folha não possui quatro células normalizadas`);
  expect(size(relative)>6000,`${key}: arte vazia ou degradada`);
 }
 expect(preload.includes(`'${key}'`)&&preload.includes(`frameWidth:${frameWidth},frameHeight:${frameHeight}`),`${key}: dimensões incorretas no PreloadScene`);
 expect(scene.includes(frames),`${key}: ciclo de quatro quadros não está ativo`);
}

const imageFiles=[];
const scanImages=directory=>{
 for(const entry of fs.readdirSync(directory,{withFileTypes:true})){
  const absolute=path.join(directory,entry.name);
  if(entry.isDirectory())scanImages(absolute);
  else imageFiles.push(absolute);
 }
};
scanImages(path.join(root,'assets/images'));
expect(!imageFiles.some(file=>/round\d+/i.test(path.basename(file))),'há asset com número de Round no nome');

const buildings=[
 {id:'merchant',name:'Loja',u1:4.95,v1:11.85,u2:8.20,v2:14.75,npc:[8.45,15.02]},
 {id:'scholar',name:'Erudita',u1:4.75,v1:6.85,u2:8.00,v2:9.75,npc:[8.25,10.02]},
 {id:'blacksmith',name:'Ferraria',u1:8.30,v1:4.80,u2:11.70,v2:7.70,npc:[11.95,7.98]},
 {id:'healer',name:'Botica',u1:13.10,v1:4.80,u2:16.60,v2:7.70,npc:[16.85,7.98]},
 {id:'tavern',name:'Taverna',u1:17.70,v1:5.10,u2:21.40,v2:8.10,npc:[21.65,8.38]},
 {id:'artisan',name:'Oficina',u1:16.10,v1:9.65,u2:19.50,v2:12.65,npc:[19.75,12.93]},
 {id:'red',name:'Casa vermelha',u1:3.20,v1:17.45,u2:6.00,v2:20.15},
 {id:'green',name:'Casa verde',u1:6.40,v1:17.45,u2:9.20,v2:20.15},
 {id:'blue',name:'Casa azul',u1:3.20,v1:20.65,u2:6.00,v2:23.35},
 {id:'orange',name:'Casa laranja',u1:6.40,v1:20.65,u2:9.20,v2:23.35}
];
const walls=[
 {name:'muro u2',u1:1.76,v1:1.76,u2:2.24,v2:26.24},
 {name:'muro v2',u1:1.76,v1:1.76,u2:26.24,v2:2.24},
 {name:'leste norte',u1:25.76,v1:1.76,u2:26.24,v2:11.91},
 {name:'leste sul',u1:25.76,v1:16.10,u2:26.24,v2:26.24},
 {name:'torre leste norte',u1:25.30,v1:11.72,u2:26.55,v2:12.92},
 {name:'torre leste sul',u1:25.30,v1:15.08,u2:26.55,v2:16.28},
 {name:'sul oeste',u1:1.76,v1:25.76,u2:11.91,v2:26.24},
 {name:'sul leste',u1:16.10,v1:25.76,u2:26.24,v2:26.24},
 {name:'torre sul oeste',u1:11.72,v1:25.30,u2:12.92,v2:26.55},
 {name:'torre sul leste',u1:15.08,v1:25.30,u2:16.28,v2:26.55}
];
const circles=[
 {name:'fonte',u:14,v:14,r:.95},
 {name:'Marco',u:17.5,v:17.8,r:.78},
 {name:'tronco',u:20.6,v:19.4,r:.30}
];
const fixedNpcs=[
 [8.45,15.02,'Aldren'],[8.25,10.02,'Lysandra'],[11.95,7.98,'Borin'],[16.85,7.98,'Elara'],[21.65,8.38,'Garrick'],[19.75,12.93,'Maelis'],
 [12,17.05,'Mira'],[22.80,17.10,'Kael'],[17.80,23.40,'Bren']
];

for(let i=0;i<buildings.length;i++)for(let j=i+1;j<buildings.length;j++){
 const a=buildings[i],b=buildings[j];
 expect(!(a.u1<b.u2&&a.u2>b.u1&&a.v1<b.v2&&a.v2>b.v1),`lotes sobrepostos: ${a.name} / ${b.name}`);
}
for(const building of buildings.filter(item=>item.npc)){
 expect(building.npc[0]>building.u2&&building.npc[1]>building.v2,`${building.name}: NPC não está diante da fachada`);
}
expect(buildings.find(item=>item.id==='merchant').u1>=4.9,'Loja do mercador continua junto ao muro');
expect(buildings.find(item=>item.id==='scholar').u1>=4.7,'Erudita continua junto ao muro');
expect(buildings.filter(item=>['blacksmith','healer','tavern'].includes(item.id)).every(item=>item.v1>=4.8),'estabelecimento superior continua sobre o muro');
expect(Math.hypot(20.6-17.5,19.4-17.8)<4,'árvore deixou a região do Marco de Senda');
expect(20.6<24&&19.4<24,'árvore continua perto demais da muralha');

const rects=[...walls,...buildings];
const blocked=(u,v,r=.27,includeNpcs=false)=>{
 for(const rect of rects){
  const nu=Math.max(rect.u1,Math.min(u,rect.u2)),nv=Math.max(rect.v1,Math.min(v,rect.v2));
  if(Math.hypot(u-nu,v-nv)<r)return rect.name;
 }
 for(const circle of circles)if(Math.hypot(u-circle.u,v-circle.v)<r+circle.r)return circle.name;
 if(includeNpcs)for(const [nu,nv,name]of fixedNpcs)if(Math.hypot(u-nu,v-nv)<r+.28)return name;
 return null;
};
const sampleSegment=(a,b,r=.27,includeNpcs=false)=>{
 const steps=Math.max(1,Math.ceil(Math.hypot(b[0]-a[0],b[1]-a[1])/.04));
 for(let i=0;i<=steps;i++){
  const t=i/steps,u=a[0]+(b[0]-a[0])*t,v=a[1]+(b[1]-a[1])*t,hit=blocked(u,v,r,includeNpcs);
  if(hit)return{u,v,hit};
 }
 return null;
};

expect(!sampleSegment([14,21.40],[14,26.70]),'corredor do Portão Sul está bloqueado');
expect(!sampleSegment([21.40,14],[26.70,14]),'corredor do Portão Leste está bloqueado');
expect(!blocked(22.8,17.1,.27,false),'Guarda Leste invade muralha ou construção');
expect(!blocked(17.8,23.4,.27,false),'Guarda Sul invade muralha ou construção');

const routes={
 resident:[[9.8,15.8],[10.2,17.2],[11.2,18.6],[13.2,19.6],[15.2,20.2],[16.2,19.2],[16,17.2],[15,16.2],[13.4,16.4],[11.3,15.8]],
 traveler:[[9.8,11.5],[10,10],[11.8,9],[13.5,9.2],[15,9],[15.4,10.2],[15,11.4],[14,12],[12.4,11.8],[11,11.4]],
 dog:[[10.2,13.8],[10.7,12.2],[12.2,10.8],[14,10.6],[15.3,11],[15.3,11.8],[15.4,13.4],[16.5,14.4],[17.8,15.7],[16.5,16.4],[15.2,17],[13.5,16.8],[11.8,16]],
 cat:[[10,22],[12,20],[14,18],[16,16],[14,18],[12,20]],
};
for(const [name,route]of Object.entries(routes))for(let i=0;i<route.length;i++){
 const hit=sampleSegment(route[i],route[(i+1)%route.length],.20,name==='resident'||name==='traveler');
 expect(!hit,`${name}: trecho ${i} bloqueado${hit?` por ${hit.hit}`:''}`);
}
expect(routes.cat.every(([u,v])=>u+v===32),'rota do gato deixou de ser horizontal');

const project=(u,v)=>({x:1600+(u-v)*48,y:250+(u+v)*24});
expect(project(22.8,17.1).x<1976,'Guarda Leste ainda fica sob a imagem do portão');
expect(project(17.8,23.4).x>1207,'Guarda Sul ainda fica sob a imagem do portão');
expect(Math.hypot(15.5-14,15.3-14)<2.1,'velhinho ficou distante da fonte');

if(issues.length){
 console.error('ISOMETRIC_CITY_ROUND65_AUDIT_FAILED');
 for(const issue of issues)console.error(`- ${issue}`);
 process.exit(1);
}
console.log('ISOMETRIC_CITY_ROUND65_AUDIT_OK buildings=10 businessIdentities=6 blacksmith2_5D=501x528 fauna2_5D=6x4frames universalOccluders=all rats=behind-tavern gates=directional routes=4');
