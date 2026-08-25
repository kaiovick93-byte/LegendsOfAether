import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

const root=path.dirname(fileURLToPath(import.meta.url));
const read=relative=>fs.readFileSync(path.join(root,relative),'utf8');
const issues=[];
const expect=(condition,message)=>{if(!condition)issues.push(message)};

const scene=read('src/scenes/AetherCityScene.ts');
const world=read('src/scenes/WorldScene.ts');
const menu=read('src/scenes/MenuScene.ts');
const pkg=JSON.parse(read('package.json'));

expect(pkg.version==='0.2.1','versão do pacote não é 0.2.1');
expect(pkg.scripts?.['validate:isometric-city']==='node validate-isometric-city-round61.mjs','auditoria do Round 61 não está registrada');
expect(scene.includes('getBuildingPlan()'),'planta urbana compartilhada está ausente');
expect(scene.includes('Object.fromEntries(this.getBuildingPlan()'),'NPCs não usam a mesma planta das construções');
expect(scene.includes("this.fountain = this.addIsoImage('city_fountain', 14, 14"),'fonte não ocupa o centro exato da praça');
expect(scene.includes('const center = this.project(17.50, 17.80)'),'Marco de Senda não está em região própria');
expect(scene.includes('const homeLogical = {u: 15.50, v: 15.30}'),'velhinho não está próximo à fonte');
expect(!scene.includes('createChickenYard()'),'galinheiro ainda é criado');
expect(!scene.includes("routeAmbient('city_chicken"),'galinhas ainda são criadas na cidade');
expect(!scene.includes("this.addIsoImage('street_"),'props continuam diante dos estabelecimentos');
expect(!scene.includes('this.addLamp('),'postes ainda são criados na cidade');
expect(!scene.includes('addIsoFence('),'cercas ainda são criadas na cidade');
expect(scene.includes("routeAmbient('city_cat'")&&scene.includes("routeAmbient('city_dog'"),'gato ou cachorro foi removido');
expect(scene.includes('cityRound61Migrated: true')&&world.includes('cityRound61Migrated:true'),'flag de migração do Round 61 não é salva nas duas cenas');
expect(menu.includes('!save.worldFlags?.cityRound61Migrated'),'menu não migra saves urbanos antigos');
expect(world.includes('const nearEast=')&&world.includes('const nearSouth='),'zonas persistentes de retorno estão ausentes');
expect(world.includes("if(nearEast){this.enterConvertedCity('east')")&&world.includes("if(nearSouth){this.enterConvertedCity('south')"),'zonas de retorno não iniciam a cidade');

const buildings=[
 {id:'merchant',name:'Loja',u1:3.35,v1:11.65,u2:6.65,v2:14.50,npc:[7.25,15.10]},
 {id:'scholar',name:'Erudita',u1:3.15,v1:6.15,u2:6.45,v2:9.05,npc:[7.05,9.65]},
 {id:'blacksmith',name:'Ferraria',u1:7.90,v1:3.10,u2:11.30,v2:6.00,npc:[11.95,6.65]},
 {id:'healer',name:'Botica',u1:12.75,v1:3.10,u2:16.25,v2:6.00,npc:[16.90,6.65]},
 {id:'tavern',name:'Taverna',u1:18.15,v1:3.25,u2:21.85,v2:6.25,npc:[22.50,6.90]},
 {id:'artisan',name:'Oficina',u1:15.80,v1:9.00,u2:19.20,v2:12.00,npc:[19.80,12.65]},
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
 {name:'fonte',u:14,v:14,r:.95},{name:'Marco',u:17.5,v:17.8,r:.78},
 {name:'árvore',u:3.6,v:3.8,r:.34},{name:'árvore',u:23.3,v:4,r:.34},{name:'árvore',u:22.9,v:21.7,r:.34}
];
const fixedNpcs=[
 [7.25,15.10,'Aldren'],[7.05,9.65,'Lysandra'],[11.95,6.65,'Borin'],[16.90,6.65,'Elara'],[22.50,6.90,'Garrick'],[19.80,12.65,'Maelis'],
 [12,17.05,'Mira'],[23.50,16.50,'Kael'],[17.50,24.50,'Bren']
];

const rects=[...walls,...buildings];
const blocked=(u,v,r=.27,includeNpcs=false)=>{
 for(const rect of rects){
  const nu=Math.max(rect.u1,Math.min(u,rect.u2)),nv=Math.max(rect.v1,Math.min(v,rect.v2));
  if(Math.hypot(u-nu,v-nv)<r)return rect.name;
 }
 for(const c of circles)if(Math.hypot(u-c.u,v-c.v)<r+c.r)return c.name;
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

for(let i=0;i<buildings.length;i++)for(let j=i+1;j<buildings.length;j++){
 const a=buildings[i],b=buildings[j];
 expect(!(a.u1<b.u2&&a.u2>b.u1&&a.v1<b.v2&&a.v2>b.v1),`footprints sobrepostos: ${a.name} / ${b.name}`);
}
for(const building of buildings.filter(b=>b.npc)){
 expect(building.npc[0]>building.u2&&building.npc[1]>building.v2,`${building.name}: NPC não está diante da fachada`);
 expect(!blocked(building.npc[0],building.npc[1],.27,false),`${building.name}: posição do NPC invade outro footprint`);
}

const residences=buildings.slice(6);
expect(residences.every(h=>h.u1>=3.2&&h.u2<=9.2&&h.v1>=17.45&&h.v2<=23.35),'residências não formam uma região única');
expect(!blocked(7.25,15.75,.27,true),'acesso de interação do Mercador está bloqueado');
expect(!blocked(19.80,13.30,.27,true),'acesso de interação da Artesã está bloqueado');
expect(blocked(5,13,.27)==='Loja','centro da Loja do Mercador não bloqueia');
expect(blocked(17.5,10.5,.27)==='Oficina','centro da Oficina não bloqueia');

expect(!sampleSegment([14,21.40],[14,26.70]),'corredor do Portão Sul está bloqueado');
expect(!sampleSegment([21.40,14],[26.70,14]),'corredor do Portão Leste está bloqueado');
expect(!blocked(23.5,16.5,.27,false),'Guarda Leste invade muralha ou construção');
expect(!blocked(17.5,24.5,.27,false),'Guarda Sul invade muralha ou construção');

const routes={
 resident:[[9.5,14.5],[9.5,16],[10.2,17.2],[11,18.2],[13.5,19],[15.5,19.5],[15.8,18],[15.3,16.2],[13.5,16],[11.2,15]],
 traveler:[[13,11.5],[13,10],[14.5,8.5],[16,7.5],[18,7],[20,7.5],[21.5,9],[21.5,11.5],[21,13.5],[20.5,15.5],[19.5,16.5],[18.8,15],[17.8,13.5],[16,12.8],[15,11.5]],
 dog:[[9.8,13.5],[10.5,11],[12,9],[14,8],[16,8],[18,8],[20,8.2],[21.5,10.5],[21.5,13],[20,15],[18.5,16],[16,15.5],[14,16.5],[11.5,15.5]],
 cat:[[10,20],[12,18],[14,16],[16,14],[14,16],[12,18]],
 ratGray:[[12.5,9.2],[13.2,9.6],[14,9.8],[13.4,9.4]],
 ratBrown:[[11.8,9.2],[12.4,9.6],[13,9.9],[12.2,9.4]]
};
for(const [name,route]of Object.entries(routes))for(let i=0;i<route.length;i++){
 const hit=sampleSegment(route[i],route[(i+1)%route.length],.20,name==='resident'||name==='traveler');
 expect(!hit,`${name}: trecho ${i} bloqueado${hit?` por ${hit.hit}`:''}`);
}
expect(routes.cat.every(([u,v])=>u+v===30),'rota do gato deixou de ser horizontal');

const project=(u,v)=>({x:1600+(u-v)*48,y:250+(u+v)*24});
expect(project(23.5,16.5).x<1980,'Guarda Leste ainda fica sob a imagem do portão');
expect(project(17.5,24.5).x>1210,'Guarda Sul ainda fica sob a imagem do portão');
expect(Math.hypot(15.5-14,15.3-14)<2.1,'velhinho ficou distante da fonte');

if(issues.length){
 console.error('ISOMETRIC_CITY_ROUND61_AUDIT_FAILED');
 for(const issue of issues)console.error(`- ${issue}`);
 process.exit(1);
}
console.log('ISOMETRIC_CITY_ROUND61_AUDIT_OK buildings=10 storefronts=6 residences=4 guards=2 gates=2 routes=6 props=clean transitions=stable');
