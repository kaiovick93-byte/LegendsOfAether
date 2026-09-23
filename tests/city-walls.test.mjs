import {test,after} from 'node:test';
import assert from 'node:assert/strict';
import {mkdtempSync,mkdirSync,readFileSync,writeFileSync,rmSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {dirname,resolve,join} from 'node:path';
import {fileURLToPath,pathToFileURL} from 'node:url';
import ts from 'typescript';

const root=resolve(dirname(fileURLToPath(import.meta.url)),'..');
const temporary=mkdtempSync(join(tmpdir(),'aether-walls-test-')),compiled=new Set();
function compile(relative){
  const destination=join(temporary,relative.replace(/\.ts$/,'.mjs'));
  if(compiled.has(relative))return destination;compiled.add(relative);
  const source=readFileSync(join(root,relative),'utf8');
  for(const dependency of ts.preProcessFile(source).importedFiles)if(dependency.fileName.startsWith('.'))
    compile(join(dirname(relative),dependency.fileName+'.ts'));
  const output=ts.transpileModule(source,{compilerOptions:{target:ts.ScriptTarget.ES2020,module:ts.ModuleKind.ESNext}})
    .outputText.replace(/from (['"])(\.[^'"]+)\1/g,'from $1$2.mjs$1');
  mkdirSync(dirname(destination),{recursive:true});writeFileSync(destination,output);return destination;
}
const assetNames={
  iso_city_wall:'isometric_city_wall_v2_aligned.png',
  iso_city_wall_broken:'isometric_city_wall_broken.png',
  iso_city_corner_tower:'isometric_city_corner_tower.png',
  iso_city_gate:'isometric_city_gate_v3.png',
  iso_city_gate_east:'isometric_city_gate_east_v3.png'
};
const textures=new Map(Object.entries(assetNames).map(([key,name])=>{
  const png=readFileSync(join(root,'assets/images/environment/isometric',name));
  const size={width:png.readUInt32BE(16),height:png.readUInt32BE(20)};
  return[key,{getSourceImage:()=>size,get:()=>size}];
}));
class Sprite{
  constructor(scene,x,y,key){Object.assign(this,{scene,x,y,key,active:true,scaleX:1,scaleY:1,originX:.5,originY:.5});}
  setPosition(x,y){Object.assign(this,{x,y});return this;}
  setOrigin(x,y=x){this.originX=x;this.originY=y;return this;}
  setScale(x,y=x){this.scaleX=x;this.scaleY=y;return this;}
  setFlipX(v){this.flipX=v;return this;}
  setDepth(v){this.depth=v;return this;}
  setVisible(v){this.visible=v;return this;}
}
globalThis.Phaser={Scene:class{},GameObjects:{Sprite,Container:class{}},Physics:{Arcade:{Sprite}},Math:{Clamp:(v,a,b)=>Math.max(a,Math.min(b,v))}};
const {AetherCityScene}=await import(pathToFileURL(compile('src/scenes/AetherCityScene.ts')).href);
after(()=>rmSync(temporary,{recursive:true,force:true}));
function scene(){
  const s=Object.create(AetherCityScene.prototype),objects=[];
  Object.assign(s,{
    textures:{get:k=>textures.get(k),exists:k=>textures.has(k)},solidMasks:[],playerIsoRadius:.27,
    add:{existing:o=>objects.push(o),zone:(x,y)=>new Sprite(s,x,y),graphics:()=>({fillStyle(){return this;},fillPoints(){return this;},setDepth(){return this;}})},
    player:{isoX:14,isoY:24,isoZ:-6,getLogicalCollisionSamples:()=>[{x:0,y:0}],
      getLogicalFootprintAt:(x,y)=>({x,y,radiusX:13,radiusY:7}),
      setIsoPosition(u,v,z){this.isoX=u;this.isoY=v;this.isoZ=z;}}
  });
  s.createWallsAndGates();return {s,objects};
}
const close=(a,b,message)=>assert.ok(Math.abs(a-b)<1e-6,`${message}: ${a} / ${b}`);

test('all 18 wall modules share a scale and meet at both base connectors',()=>{
  const {s,objects}=scene(),walls=objects.filter(o=>o.key==='iso_city_wall');
  assert.equal(walls.length,18);
  for(const wall of walls){
    close(wall.scaleX,wall.scaleY,'uniform wall scale');
    close(wall.scaleX,192/650,'approved four-tile module');
    close(wall.isoZ,0,'no lifted base');
    close(wall.originY,.705423803,'common ground pivot');
    // The approved normalized material has a 650 × 325 connector vector.
    // A vertical stretch breaks its 2:1 contact with the projected ground.
    const dx=650*wall.scaleX,dy=325*wall.scaleY;
    close(dx,192,'horizontal connector span');close(dy,96,'ground slope');
    const next=walls.find(n=>n!==wall&&n.flipX===wall.flipX&&
      (wall.flipX?n.isoY===wall.isoY&&n.isoX===wall.isoX+4:n.isoX===wall.isoX&&n.isoY===wall.isoY+4));
    if(next){close(Math.abs(next.x-wall.x),dx,'horizontal join');close(next.y-wall.y,dy,'base join');}
    const footprint=s.solidMasks.find(m=>m.image===wall).isoRect;
    assert.ok(s.isIsoRectBlocked(footprint,wall.isoX,wall.isoY,.27),'wall collision follows its base');
  }
});

test('corner feet reach the ground and their wall ends render behind the towers',()=>{
  const {s,objects}=scene(),walls=objects.filter(o=>o.key==='iso_city_wall');
  assert.equal(s.cornerTowerSprites.length,4);
  const anchors={'north-west':[2,2],'north-east':[26,2],'south-west':[2,26],'south-east':[26,26]};
  for(const tower of s.cornerTowerSprites){
    const [u,v]=anchors[tower.name],ground=s.project(u,v);
    // Opaque front foot measured in the approved 1086 × 1448 PNG.
    const footY=tower.y+(1428-1448*tower.originY)*tower.scaleY;
    assert.ok(footY>=ground.y&&footY<=ground.y+40,`${tower.name}: foot above/below the corner ground`);
    const adjacent=walls.filter(w=>Math.abs(w.isoX-u)+Math.abs(w.isoY-v)===2);
    assert.ok(adjacent.length>=1);
    for(const wall of adjacent)assert.ok(tower.depth>wall.depth,`${tower.name}: wall cuts across the tower`);
    const oldDepth=tower.depth;tower.updateIsoPosition();close(tower.depth,oldDepth,'depth survives projection update');
    const iso=s.unproject(tower.x,tower.y-24);
    assert.ok(s.getSolidMaskCollisionScore(iso.x,iso.y)>0,'tower footprint follows the rendered feet');
  }
});

test('gates, broken wall and other corner positions retain the approved transforms',()=>{
  const {s,objects}=scene();assert.equal(objects.length,25,'no duplicate wall or tower');
  for(const [gate,u,v] of [[s.southGateSprite,14,26.03],[s.eastGateSprite,26.03,14]]){
    close(gate.isoX,u,'gate u');close(gate.isoY,v,'gate v');close(gate.isoZ,-75,'gate z');
    close(gate.scaleX,.375,'gate scale');close(gate.scaleY,.375,'gate scale');
  }
  const broken=objects.filter(o=>o.key==='iso_city_wall_broken');assert.equal(broken.length,1);
  close(broken[0].isoX,26,'broken wall u');close(broken[0].isoY,22,'broken wall v');
  close(broken[0].originY,.864,'debris ground pivot');close(broken[0].scaleX,384/1448,'broken wall scale');
  for(const [name,u,v] of [['north-east',26.38,1.62],['south-west',1.62,26.38],['south-east',26.58,26.58]]){
    const t=s.cornerTowerSprites.find(t=>t.name===name);close(t.isoX,u,name);close(t.isoY,v,name);
  }
});

test('both gate corridors remain traversable and the entire wall perimeter blocks crossing',()=>{
  const {s}=scene();
  for(const south of [true,false])for(const direction of [-1,1]){
    const start=direction>0?24.5:28,end=direction>0?28:24.5;
    s.player.setIsoPosition(south?14:start,south?start:14,-6);
    for(let n=start+direction*.05;direction>0?n<=end:n>=end;n+=direction*.05){
      const u=south?14:n,v=south?n:14;
      assert.equal(s.tryMoveStep(u-s.player.isoX,v-s.player.isoY),true,`blocked gate at ${u},${v}`);
    }
  }
  for(let n=2;n<=26;n+=.25){
    assert.equal(s.isBlocked(2,n,.27),true,'north-west wall');
    assert.equal(s.isBlocked(n,2,.27),true,'north-east wall');
    if(n<13||n>15){
      assert.equal(s.isBlocked(26,n,.27),true,'east wall and broken section');
      assert.equal(s.isBlocked(n,26,.27),true,'south wall');
    }
  }
});
