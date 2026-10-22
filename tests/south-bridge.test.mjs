import {test,after} from 'node:test';
import assert from 'node:assert/strict';
import {mkdtempSync,mkdirSync,readFileSync,writeFileSync,rmSync,existsSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {dirname,resolve,join} from 'node:path';
import {fileURLToPath,pathToFileURL} from 'node:url';
import ts from 'typescript';

const root=resolve(dirname(fileURLToPath(import.meta.url)),'..');
const temporary=mkdtempSync(join(tmpdir(),'aether-bridge-test-')),compiled=new Set();
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
globalThis.Phaser={Scene:class{},GameObjects:{Sprite:class{},Container:class{}},Physics:{Arcade:{Sprite:class{}}}};
const load=p=>import(pathToFileURL(compile(p)).href);
const {southRiverSections}=await load('src/world/SouthRiver.ts');
const {SouthRiverCrossing,SOUTH_BRIDGE,SOUTH_BRIDGE_ASSET,bridgeCenterU,bridgeArtTransform}=await load('src/world/SouthRiverBridge.ts');
const {AetherCityScene}=await load('src/scenes/AetherCityScene.ts');
const project=(u,v)=>({x:1600+(u-v)*48,y:250+(u+v)*24});
const sections=southRiverSections(project),crossing=new SouthRiverCrossing(sections);
after(()=>rmSync(temporary,{recursive:true,force:true}));

function scene(){
  const result=Object.create(AetherCityScene.prototype);
  result.southRiverBridge=crossing;result.playerIsoRadius=.27;
  result.getSolidMaskCollisionScore=()=>0;
  result.player={isoX:14,isoY:31,isoZ:-6,setIsoPosition(u,v,z){this.isoX=u;this.isoY=v;this.isoZ=z;}};
  return result;
}

test('the real movement method crosses both ways through the bridge and gate',()=>{
  const s=scene();
  for(const direction of [-1,1]){
    const start=direction<0?31:24.8,end=direction<0?24.8:31;
    s.player.setIsoPosition(bridgeCenterU(start),start,-6);
    for(let v=start+direction*.025;direction<0?v>=end:v<=end;v+=direction*.025)
      assert.equal(s.tryMoveStep(bridgeCenterU(v)-s.player.isoX,v-s.player.isoY),true,`blocked at ${v}`);
  }
});

test('water blocks crossing outside the bridge, including the river bend',()=>{
  const s=scene();
  for(const u of [1,5,10,18,24,28,32,35]){
    const p=sections.reduce((best,p)=>Math.abs(p.u-u)<Math.abs(best.u-u)?p:best,sections[0]);
    assert.equal(crossing.isBlocked(p.u,p.v,.27),true,`water at ${u}`);
    s.player.setIsoPosition(p.u,p.v+.4,-6);
    assert.equal(s.tryMoveStep(0,-.025),false,`movement into water at ${u}`);
  }
});

test('both parapets block lateral exits while the full floor remains traversable',()=>{
  for(let v=SOUTH_BRIDGE.city.v+.1;v<SOUTH_BRIDGE.road.v-.1;v+=.1){
    const u=bridgeCenterU(v);
    for(const offset of [-.5,0,.5])assert.equal(crossing.isBlocked(u+offset,v,.27),false);
    for(const side of [-1,1])assert.equal(crossing.isBlocked(u+side*SOUTH_BRIDGE.halfWidth,v,.27),true);
  }
});

test('dry banks and unrelated terrain retain their existing movement rules',()=>{
  for(const [u,v] of [[8,31],[22,31],[20,35],[8,60],[50,50],[14,24.5]])assert.equal(crossing.isBlocked(u,v,.27),false);
  const s=scene();
  assert.equal(s.isBlockedByCityBounds(10,26,.27),true,'city wall still blocks');
  s.aetherTerritory={isLogicalBarrierBlocked:()=>true};
  assert.equal(s.isBlockedByCityBounds(14,28,.27),true,'bridge must not bypass an existing barrier');
});

test('legacy positions in the water recover to a bank; valid positions are unchanged',()=>{
  const s=scene();
  for(const u of [1,8,19,30,35]){
    const p=sections.reduce((best,p)=>Math.abs(p.u-u)<Math.abs(best.u-u)?p:best,sections[0]);
    const safe=crossing.recoverPosition(p.u,p.v,.27,(u,v)=>!s.isBlockedByCityBounds(u,v,.27));
    assert.ok(safe);assert.equal(s.isBlockedByCityBounds(safe.u,safe.v,.27),false);
    assert.ok(Math.hypot(safe.u-p.u,safe.v-p.v)<4,'nearest bank, not a teleport to the gate');
  }
  assert.equal(crossing.recoverPosition(14,28,.27,()=>true),null);
  assert.equal(crossing.recoverPosition(8,60,.27,()=>true),null);
});

test('bridge art anchors map exactly to the functional landings and asset exists',()=>{
  const m=bridgeArtTransform(project),b=SOUTH_BRIDGE;
  for(const [x,y,u,v] of [[113,756,b.road.u-b.halfWidth,b.road.v],[515,1040,b.road.u+b.halfWidth,b.road.v],[775,337,b.city.u-b.halfWidth,b.city.v]]){
    const p=project(u,v);assert.ok(Math.hypot(m.a*x+m.c*y+m.e-p.x,m.b*x+m.d*y+m.f-p.y)<1e-7);
  }
  assert.ok(existsSync(join(root,SOUTH_BRIDGE_ASSET.path)));
});
