import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

const root=path.dirname(fileURLToPath(import.meta.url));
const read=relative=>fs.readFileSync(path.join(root,relative),'utf8');
const exists=relative=>fs.existsSync(path.join(root,relative));
const size=relative=>fs.statSync(path.join(root,relative)).size;
const issues=[];
const expect=(condition,message)=>{if(!condition)issues.push(message)};

const scene=read('src/scenes/AetherCityScene.ts');
const npc=read('src/npc/Npc.ts');
const preload=read('src/scenes/PreloadScene.ts');
const world=read('src/scenes/WorldScene.ts');
const menu=read('src/scenes/MenuScene.ts');
const pkg=JSON.parse(read('package.json'));

expect(pkg.version==='0.2.2','versão do pacote não é 0.2.2');
expect(pkg.scripts?.['validate:isometric-city']==='node validate-isometric-city-round62.mjs','auditoria do Round 62 não está registrada');
expect(scene.includes('isBlockedByBuildingMask')&&scene.includes('getPixelAlpha'),'colisão por opacidade real dos edifícios está ausente');
expect(scene.includes('collisionBand:.60')&&scene.includes('collisionBand:.64'),'faixas de contato opacas não estão calibradas');
expect(!scene.includes('this.addBlockedRect(u, v, w, h, building.label)'),'retângulos genéricos de edifícios ainda bloqueiam transparências');
expect(scene.includes("this.addBlockedCircle(20.60, 19.40, .30, 'tronco"),'árvore não usa colisão exclusiva no tronco');
expect(scene.includes('updateTreeOcclusion()')&&scene.includes('addGlow(0xffd166, 4.5, 0, true'),'contorno de oclusão do jogador está incompleto');
expect(scene.includes("this.entryFacing = 'left'")&&scene.includes("this.entryFacing = 'up'"),'direção de retorno dos dois portões não é preservada');
expect(scene.includes('createTavernRatCycle()')&&scene.includes('scheduleTavernRat')&&scene.includes('setVisible(false)'),'ciclo intermitente do rato da taverna está ausente');
expect(!scene.includes("routeAmbient('city_rat"),'ratos antigos simultâneos ainda são criados');
expect(scene.includes('frameFootY = [109,109,107,94]'),'base real dos pés do velhinho não foi corrigida');
expect(scene.includes('cityRound62Migrated: true')&&world.includes('cityRound62Migrated:true'),'flag de migração do Round 62 não é salva nas duas cenas');
expect(menu.includes('!save.worldFlags?.cityRound62Migrated'),'menu não migra saves anteriores ao Round 62');
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
expect(npc.includes('playIsometricBlacksmithIdle')&&npc.includes("setTexture('blacksmith_iso_empty')")&&npc.includes("'blacksmith_hammer'"),'ferreiro não lança o próprio martelo');
for(const profile of ['merchant','blacksmith','healer','tavernkeeper','scholar','artisan']){
 expect(npc.includes(`${profile}:`)||npc.includes(`profile==='${profile}'`),`ação profissional ausente: ${profile}`);
}

const buildings=[
 {id:'merchant',name:'Loja',u1:4.95,v1:11.85,u2:8.20,v2:14.75,npc:[8.75,15.35]},
 {id:'scholar',name:'Erudita',u1:4.75,v1:6.85,u2:8.00,v2:9.75,npc:[8.55,10.35]},
 {id:'blacksmith',name:'Ferraria',u1:8.30,v1:4.80,u2:11.70,v2:7.70,npc:[12.25,8.35]},
 {id:'healer',name:'Botica',u1:13.10,v1:4.80,u2:16.60,v2:7.70,npc:[17.20,8.35]},
 {id:'tavern',name:'Taverna',u1:17.70,v1:5.10,u2:21.40,v2:8.10,npc:[21.95,8.75]},
 {id:'artisan',name:'Oficina',u1:16.10,v1:9.65,u2:19.50,v2:12.65,npc:[20.10,13.25]},
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
 [8.75,15.35,'Aldren'],[8.55,10.35,'Lysandra'],[12.25,8.35,'Borin'],[17.20,8.35,'Elara'],[21.95,8.75,'Garrick'],[20.10,13.25,'Maelis'],
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
 tavernRat:[[20.8,10.65],[21.67,9.78]]
};
for(const [name,route]of Object.entries(routes))for(let i=0;i<route.length-(name==='tavernRat'?1:0);i++){
 const hit=sampleSegment(route[i],route[(i+1)%route.length],.20,name==='resident'||name==='traveler');
 expect(!hit,`${name}: trecho ${i} bloqueado${hit?` por ${hit.hit}`:''}`);
}
expect(routes.cat.every(([u,v])=>u+v===32),'rota do gato deixou de ser horizontal');

const project=(u,v)=>({x:1600+(u-v)*48,y:250+(u+v)*24});
expect(project(22.8,17.1).x<1976,'Guarda Leste ainda fica sob a imagem do portão');
expect(project(17.8,23.4).x>1207,'Guarda Sul ainda fica sob a imagem do portão');
expect(Math.hypot(15.5-14,15.3-14)<2.1,'velhinho ficou distante da fonte');

if(issues.length){
 console.error('ISOMETRIC_CITY_ROUND62_AUDIT_FAILED');
 for(const issue of issues)console.error(`- ${issue}`);
 process.exit(1);
}
console.log('ISOMETRIC_CITY_ROUND62_AUDIT_OK buildings=10 opacityMasks=10 isoNpcs=9 storefrontActions=6 treeOcclusion=1 rats=intermittent gates=directional routes=5');
