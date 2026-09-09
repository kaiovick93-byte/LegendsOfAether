import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

const root=process.cwd();
const territorySource=fs.readFileSync(path.join(root,'src/world/AetherTerritory.ts'),'utf8')
  .replace(/^import[\s\S]*?;\n/gm,'')
  .replace(/^export const /gm,'const ')
  .replace(/^export class /gm,'class ');
const layoutSource=fs.readFileSync(path.join(root,'src/world/AetherTerritoryLayout.ts'),'utf8')
  .replace(/^export const /gm,'const ')
  .replace(/^export function /gm,'function ');
const {AETHER_OLD_ROAD,AETHER_PROLOGUE_ANCHORS}=new Function(`${layoutSource}\nreturn {AETHER_OLD_ROAD,AETHER_PROLOGUE_ANCHORS};`)();
const AetherTerritory=new Function('Phaser',`${territorySource}\nreturn AetherTerritory;`)({
  Math:{Linear:(a,b,t)=>a+(b-a)*t}
});

class FakeImage {
  constructor(x,y,texture){this.x=x;this.y=y;this.texture={key:texture};this.active=true;this.visible=true;this.data=new Map();}
  setOrigin(){return this} setScale(value){this.scaleX=value;this.scaleY=value;return this}
  setRotation(value){this.rotation=value;return this} setDepth(value){this.depth=value;return this}
  setData(key,value){this.data.set(key,value);return this} getData(key){return this.data.get(key)}
  setFlipX(value){this.flipX=value;return this} setAlpha(value){this.alpha=value;return this}
  setTint(value){this.tint=value;return this} setVisible(value){this.visible=value;return this}
  setActive(value){this.active=value;return this}
}

const depthBase=-20000;
const scene={
  textures:{exists:()=>true},
  add:{image:(x,y,key)=>new FakeImage(x,y,key)},
  project:(u,v)=>({x:1600+(u-v)*48,y:250+(u+v)*24})
};
const territory=Object.create(AetherTerritory.prototype);
territory.scene=scene;
territory.config={depthBase,project:scene.project};
territory.objects=[];
territory.sectors={register:()=>{}};
territory.nearCrossing=()=>false;

// Executa a mesma função usada em runtime, sem o resto do mapa: cada estampa
// da Estrada Velha precisa ser classificada como ground estável.
territory.stampPolyline(AETHER_OLD_ROAD,.53,2.25,true);
const roads=territory.objects.filter(item=>item.texture.key==='outskirts_old_road_v2');
assert(roads.length>0,'Nenhuma estampa da Estrada Velha foi criada.');
for(const road of roads){
  assert.equal(road.getData('aetherRenderClass'),'ground','Estrada Velha perdeu sua classe de ground.');
  assert.equal(road.depth,-20070,'Estampa da Estrada Velha não recebeu depth de ground estável.');
}

const actorDepth=(anchor,offset)=>depthBase+(anchor.u+anchor.v)*100+offset;
for(const [label,anchor,offset] of [
  ['Lobo Jovem',AETHER_PROLOGUE_ANCHORS.youngWolf,.16],
  ['Goblin 1',AETHER_PROLOGUE_ANCHORS.goblinScouts[0],.16],
  ['Goblin 2',AETHER_PROLOGUE_ANCHORS.goblinScouts[1],.16],
  ['Carroça',AETHER_PROLOGUE_ANCHORS.attackedWagon,.08],
  ['Patrulheiro',AETHER_PROLOGUE_ANCHORS.patrol,.07]
])assert(-20070<actorDepth(anchor,offset),`${label}: ground não ficou abaixo da base do ator.`);

console.log(`OLD_ROAD_GROUND_RUNTIME=PASS stamps=${roads.length} groundDepth=-20070 actors=5`);
