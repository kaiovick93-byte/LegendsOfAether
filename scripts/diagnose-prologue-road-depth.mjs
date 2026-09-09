import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

const root=process.cwd();
const source=file=>fs.readFileSync(path.join(root,file),'utf8');
const layoutSource=source('src/world/AetherTerritoryLayout.ts')
  .replace(/^export const /gm,'const ')
  .replace(/^export function /gm,'function ');
const {AETHER_OLD_ROAD,AETHER_PROLOGUE_ANCHORS}=new Function(`${layoutSource}\nreturn {AETHER_OLD_ROAD,AETHER_PROLOGUE_ANCHORS};`)();
const territorySource=source('src/world/AetherTerritory.ts');
const layersMatch=territorySource.match(/AETHER_TERRITORY_RENDER_LAYERS=Object\.freeze\((\{[^}]+\})\)/);
assert(layersMatch,'Camadas de renderização da Estrada Velha não encontradas.');
const layers=new Function(`return (${layersMatch[1]});`)();
assert.equal(layers.ROAD,-70,'A camada de estrada deixou de ser estável.');
assert(territorySource.includes('this.stampPolyline(AETHER_OLD_ROAD,.53,2.25,true)'),'A Estrada Velha não usa a camada de ground.');

const readPngSize=file=>{
  const bytes=fs.readFileSync(path.join(root,file));
  return {width:bytes.readUInt32BE(16),height:bytes.readUInt32BE(20)};
};
const roadSource=readPngSize('assets/images/environment/outskirts/v2/outskirts_old_road_v2.png');
const project=(u,v)=>({x:1600+(u-v)*48,y:250+(u+v)*24});
const depthBase=-20000;
const groundDepth=depthBase+layers.ROAD;
const actorDepth=(u,v,offset)=>depthBase+(u+v)*100+offset;

const oldRoadStamps=[];
for(let index=1;index<AETHER_OLD_ROAD.length;index++){
  const a=AETHER_OLD_ROAD[index-1],b=AETHER_OLD_ROAD[index];
  const length=Math.hypot(b.u-a.u,b.v-a.v),steps=Math.max(1,Math.ceil(length/2.25));
  const screenA=project(a.u,a.v),screenB=project(b.u,b.v),rotation=Math.atan2(screenB.y-screenA.y,screenB.x-screenA.x);
  for(let step=0;step<steps;step++){
    const t=(step+.5)/steps,u=a.u+(b.u-a.u)*t,v=a.v+(b.v-a.v)*t;
    const stampIndex=index*97+step,scale=.53*(.97+(stampIndex%3)*.018);
    const width=roadSource.width*scale,height=roadSource.height*scale;
    const angle=rotation+(stampIndex%2?.018:-.018),cos=Math.abs(Math.cos(angle)),sin=Math.abs(Math.sin(angle));
    const p=project(u,v);
    oldRoadStamps.push({x:p.x,y:p.y,width:width*cos+height*sin,height:width*sin+height*cos,depth:groundDepth});
  }
}
const overlaps=(a,b)=>Math.abs(a.x-b.x)<(a.width+b.width)/2&&Math.abs(a.y-b.y)<(a.height+b.height)/2;
const actors=[
  ['Lobo Jovem',AETHER_PROLOGUE_ANCHORS.youngWolf,.16,82,82],
  ['Goblin 1',AETHER_PROLOGUE_ANCHORS.goblinScouts[0],.16,76,76],
  ['Goblin 2',AETHER_PROLOGUE_ANCHORS.goblinScouts[1],.16,76,76],
  ['Carroça',AETHER_PROLOGUE_ANCHORS.attackedWagon,.08,213,142],
  ['Patrulheiro',AETHER_PROLOGUE_ANCHORS.patrol,.07,98,142]
].map(([label,anchor,offset,width,height])=>{
  const p=project(anchor.u,anchor.v);
  return {label,u:anchor.u,v:anchor.v,depth:actorDepth(anchor.u,anchor.v,offset),x:p.x,y:p.y-height/2,width,height};
});

for(const actor of actors){
  const overlapCount=oldRoadStamps.filter(road=>overlaps(actor,road)).length;
  // Cada ator foi posicionado sobre a Estrada Velha; a sobreposição de arte
  // existe, mas o terreno agora precisa permanecer sempre atrás dele.
  assert(overlapCount>0,`${actor.label} não sobrepõe nenhuma estampa da Estrada Velha; o teste perdeu o ponto narrativo.`);
  assert(groundDepth<actor.depth,`${actor.label}: a camada de chão ainda está sobre a base do ator.`);
  actor.roadOverlapCount=overlapCount;
  actor.groundBelowBy=actor.depth-groundDepth;
}

console.table(actors.map(actor=>({
  ator:actor.label,
  x:actor.x.toFixed(1),
  y:actor.y.toFixed(1),
  depthAtor:actor.depth.toFixed(2),
  depthEstrada:groundDepth.toFixed(2),
  estradaAbaixoPor:actor.groundBelowBy.toFixed(2),
  sobreposicoesDeArte:actor.roadOverlapCount
})));
console.log(`PROLOGUE_ROAD_DEPTH_AUDIT=PASS stamps=${oldRoadStamps.length} groundDepth=${groundDepth}`);
