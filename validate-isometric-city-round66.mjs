import fs from 'node:fs';
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
const issues=[];
const expect=(condition,message)=>{if(!condition)issues.push(message)};

const scene=read('src/scenes/AetherCityScene.ts');
const preload=read('src/scenes/PreloadScene.ts');
const npcSource=read('src/npc/Npc.ts');
const world=read('src/scenes/WorldScene.ts');
const menu=read('src/scenes/MenuScene.ts');
const pkg=JSON.parse(read('package.json'));

expect(pkg.version==='0.2.6','versão do pacote não é 0.2.6');
expect(pkg.scripts?.['validate:isometric-city']==='node validate-isometric-city-round66.mjs','auditoria do Round 66 não está registrada');

// Muralha: base inteira bloqueada, envelope sem frestas e módulos uniformes.
expect(scene.includes('const wall = 1.10'),'espessura de contato do muro não cobre a base visível');
expect(scene.includes('isOutsideCityWallEnvelope(u, v, radius)'),'envelope contínuo de colisão da muralha está ausente');
expect(scene.includes('const innerMin = C.CITY_MIN + .55')&&scene.includes('const innerMax = C.CITY_MAX - .55'),'faces internas da muralha não estão calibradas');
expect(scene.includes('Math.round((end - start) / 3)')&&scene.includes('const step = (end - start) / count'),'módulos visuais do muro não têm comprimento uniforme');
expect(scene.includes('visualLength = step + .24')&&!scene.includes('cursor + span + .12'),'emenda antiga com último módulo desnivelado ainda está ativa');

// Oclusão: o contorno só pode ser calculado atrás da linha de apoio.
expect(scene.includes('behindMargin: options.behindMargin ?? 7'),'margem de profundidade dos oclusores está ausente');
expect(scene.includes('this.player.y >= occluder.baseY - occluder.behindMargin'),'oclusão não exige que o jogador esteja atrás do objeto');
expect(!scene.includes('this.player.y > occluder.baseY + 8'),'regra frontal antiga do contorno ainda está ativa');
expect(scene.includes('lowestOccluderDepth - .02')&&scene.includes("this.textures.exists('player_outline_gold')"),'silhueta dourada universal foi removida');

const project=(u,v)=>({x:1600+(u-v)*48,y:250+(u+v)*24});
const buildings=[
  {id:'merchant',name:'Mercado',key:'merchant_shop',u:6.60,v:13.35,height:238,ratio:528/497,rect:[4.95,11.85,3.25,2.90],npc:[6.58,13.87]},
  {id:'scholar',name:'Arquivo',key:'scholar_house',u:6.40,v:8.35,height:232,ratio:486/528,rect:[4.75,6.85,3.25,2.90],npc:[6.81,8.44]},
  {id:'blacksmith',name:'Ferraria',key:'blacksmith_shop',u:10.00,v:6.30,height:225,ratio:501/528,rect:[8.30,4.80,3.40,2.90],npc:[10.71,6.09]},
  {id:'healer',name:'Botica',key:'healer_house',u:14.85,v:6.30,height:232,ratio:528/366,rect:[13.10,4.80,3.50,2.90],npc:[14.52,7.13]},
  {id:'tavern',name:'Taverna',key:'tavern_house',u:19.55,v:6.65,height:238,ratio:528/473,rect:[17.70,5.10,3.70,3.00],npc:[19.80,6.90]},
  {id:'artisan',name:'Ateliê',key:'artisan_house',u:13.40,v:18.40,height:230,ratio:528/492,rect:[11.70,16.85,3.40,3.00],npc:[13.48,18.91]},
  {id:'house_red',name:'Casa vermelha',key:'residential_house_red',u:4.60,v:19.00,height:218,ratio:1,rect:[3.20,17.45,2.80,2.70]},
  {id:'house_green',name:'Casa verde',key:'residential_house_green',u:7.80,v:19.00,height:218,ratio:1,rect:[6.40,17.45,2.80,2.70]},
  {id:'house_blue',name:'Casa azul',key:'residential_house_blue',u:4.60,v:22.20,height:218,ratio:1,rect:[3.20,20.65,2.80,2.70]},
  {id:'house_orange',name:'Casa laranja',key:'residential_house_orange',u:7.80,v:22.20,height:218,ratio:1,rect:[6.40,20.65,2.80,2.70]}
];

for(const building of buildings){
  const [u,v,w,h]=building.rect;
  building.u1=u;building.v1=v;building.u2=u+w;building.v2=v+h;
  expect(scene.includes(`id:'${building.id}'`)&&scene.includes(`key:'${building.key}'`),`${building.name}: planta não está integrada`);
}
for(let i=0;i<buildings.length;i++)for(let j=i+1;j<buildings.length;j++){
  const a=buildings[i],b=buildings[j];
  expect(!(a.u1<b.u2&&a.u2>b.u1&&a.v1<b.v2&&a.v2>b.v1),`lotes sobrepostos: ${a.name} / ${b.name}`);
}

// Os seis NPCs ficam de 8 a 22 px abaixo da base da imagem, alinhados à porta.
for(const building of buildings.filter(item=>item.npc)){
  const base=project(building.u,building.v),front=project(...building.npc);
  const dx=front.x-base.x,dy=front.y-base.y;
  expect(dy>=8&&dy<=22,`${building.name}: NPC está distante da fachada (${dy.toFixed(1)} px)`);
  expect(Math.abs(dx)<=60,`${building.name}: NPC não está alinhado à entrada (${dx.toFixed(1)} px)`);
  expect(scene.includes(`npc:[${building.npc[0].toFixed(2)},${building.npc[1].toFixed(2)}]`),`${building.name}: posição visual do NPC diverge da planta auditada`);
}

const imageBox=building=>{
  const p=project(building.u,building.v),width=building.height*building.ratio;
  return {left:p.x-width/2,right:p.x+width/2,top:p.y-building.height,bottom:p.y};
};
const overlaps=(a,b)=>a.left<b.right&&a.right>b.left&&a.top<b.bottom&&a.bottom>b.top;
const artisan=buildings.find(item=>item.id==='artisan');
expect(!overlaps(imageBox(artisan),imageBox(buildings.find(item=>item.id==='tavern'))),'Ateliê ainda encobre a taverna');
expect(!overlaps(imageBox(artisan),imageBox(buildings.find(item=>item.id==='healer'))),'Ateliê ainda encobre a botica');
expect(Math.hypot(artisan.u-17.8,artisan.v-11.2)>5,'Ateliê permaneceu no antigo ponto de bloqueio visual');

// As seis folhas profissionais agora têm quatro células 256x256.
for(const role of ['merchant','blacksmith','healer','tavernkeeper','scholar','artisan']){
  const key=`${role}_iso_action`;
  const relative=`assets/images/characters/npcs/isometric/${key}.png`;
  expect(exists(relative),`ação profissional ausente: ${role}`);
  if(exists(relative)){
    const dimensions=pngDimensions(relative);
    expect(dimensions.width===1024&&dimensions.height===256,`${role}: folha não possui quatro células normalizadas 256x256`);
    expect(size(relative)>140000,`${role}: folha de ação vazia ou degradada`);
  }
  expect(preload.includes(`'${key}'`)&&preload.includes('{frameWidth:256,frameHeight:256}'),`${role}: célula normalizada não está carregada`);
  expect(scene.includes(`action: '${key}'`),`${role}: ação não está ligada ao NPC`);
}
expect(npcSource.includes('setTexture(this.isoActionTexture,0)')&&npcSource.includes("once('animationcomplete'"),'motor de ações profissionais está ausente');

const wallRects=[
  {name:'noroeste',u1:1.45,v1:1.45,u2:2.55,v2:26.55},
  {name:'nordeste',u1:1.45,v1:1.45,u2:26.55,v2:2.55},
  {name:'leste norte',u1:25.45,v1:1.45,u2:26.55,v2:12.02},
  {name:'leste sul',u1:25.45,v1:15.98,u2:26.55,v2:26.55},
  {name:'sul oeste',u1:1.45,v1:25.45,u2:12.02,v2:26.55},
  {name:'sul leste',u1:15.98,v1:25.45,u2:26.55,v2:26.55},
  {name:'torre leste norte',u1:25.20,v1:11.62,u2:26.65,v2:12.92},
  {name:'torre leste sul',u1:25.20,v1:15.08,u2:26.65,v2:16.38},
  {name:'torre sul oeste',u1:11.62,v1:25.20,u2:12.92,v2:26.65},
  {name:'torre sul leste',u1:15.08,v1:25.20,u2:16.38,v2:26.65}
];
const circles=[{name:'fonte',u:14,v:14,r:.95},{name:'Marco',u:17.5,v:17.8,r:.78},{name:'tronco',u:20.6,v:19.4,r:.30}];
const envelopeBlocked=(u,v,r=.27)=>{
  const eastGate=v-r>12.92&&v+r<15.08;
  const southGate=u-r>12.92&&u+r<15.08;
  return u-r<2.55||v-r<2.55||(u+r>25.45&&!eastGate)||(v+r>25.45&&!southGate);
};
const rectHit=(u,v,r,rect)=>{
  const nu=Math.max(rect.u1,Math.min(u,rect.u2)),nv=Math.max(rect.v1,Math.min(v,rect.v2));
  return Math.hypot(u-nu,v-nv)<r;
};
const blocked=(u,v,r=.27)=>{
  if(envelopeBlocked(u,v,r))return'envelope';
  for(const rect of [...wallRects,...buildings])if(rectHit(u,v,r,rect))return rect.name;
  for(const circle of circles)if(Math.hypot(u-circle.u,v-circle.v)<r+circle.r)return circle.name;
  return null;
};
const sampleSegment=(a,b,r=.20)=>{
  const steps=Math.max(1,Math.ceil(Math.hypot(b[0]-a[0],b[1]-a[1])/.04));
  for(let i=0;i<=steps;i++){
    const t=i/steps,u=a[0]+(b[0]-a[0])*t,v=a[1]+(b[1]-a[1])*t,hit=blocked(u,v,r);
    if(hit)return{u,v,hit};
  }
  return null;
};

expect(envelopeBlocked(2.75,10,.27),'faixa interna do muro oeste ainda é caminhável');
expect(envelopeBlocked(10,2.75,.27),'faixa interna do muro superior ainda é caminhável');
expect(envelopeBlocked(25.25,10,.27),'faixa interna do muro leste ainda é caminhável');
expect(envelopeBlocked(10,25.25,.27),'faixa interna do muro sul ainda é caminhável');
expect(!sampleSegment([14,21.40],[14,26.70],.27),'corredor do Portão Sul está bloqueado');
expect(!sampleSegment([21.40,14],[26.70,14],.27),'corredor do Portão Leste está bloqueado');

const routes={
  resident:[[9.8,15.8],[10.2,17.2],[10.4,19.6],[11,20.5],[13,21.2],[15.6,21.1],[16.2,20.4],[16.5,18.8],[16.2,17],[15.8,15.8],[13.8,15.6],[11.4,15.6]],
  traveler:[[9.8,11.5],[10,10],[11.8,9],[13.5,9.2],[15,9],[15.4,10.2],[15,11.4],[14,12],[12.4,11.8],[11,11.4]],
  dog:[[10.2,13.8],[10.7,12.2],[12.2,10.8],[14,10.6],[15.3,11],[15.3,11.8],[15.4,13.4],[16.5,14.4],[17.8,15.7],[16.7,15.6],[15.2,15.5],[13.5,15.5],[11.8,16]],
  cat:[[16,14],[18,12],[20,10],[22,8],[20,10],[18,12]]
};
for(const [name,route] of Object.entries(routes))for(let i=0;i<route.length;i++){
  const hit=sampleSegment(route[i],route[(i+1)%route.length]);
  expect(!hit,`${name}: trecho ${i} bloqueado${hit?` por ${hit.hit}`:''}`);
}
expect(routes.cat.every(([u,v])=>u+v===30),'rota horizontal do gato foi perdida');

expect(scene.includes('cityRound66Migrated: true')&&world.includes('cityRound66Migrated:true'),'flag do Round 66 não é salva nas duas cenas');
expect(menu.includes('!save.worldFlags?.cityRound66Migrated'),'menu não migra saves anteriores ao Round 66');
expect(exists('ROUND66_CITY_VISUAL_QA.png'),'render de auditoria visual do Round 66 está ausente');

const imageFiles=[];
const scan=directory=>{
  for(const entry of fs.readdirSync(directory,{withFileTypes:true})){
    const absolute=path.join(directory,entry.name);
    if(entry.isDirectory())scan(absolute);else imageFiles.push(absolute);
  }
};
scan(path.join(root,'assets/images'));
expect(!imageFiles.some(file=>/round\d+/i.test(path.basename(file))),'há asset com número de Round no nome');

if(issues.length){
  console.error('ISOMETRIC_CITY_ROUND66_AUDIT_FAILED');
  for(const issue of issues)console.error(`- ${issue}`);
  process.exit(1);
}
console.log('ISOMETRIC_CITY_ROUND66_AUDIT_OK walls=continuous+sealed occlusion=behind-only businesses=6-contact-aligned artisan=relocated actions=6x4-normalized routes=4 gates=2');
