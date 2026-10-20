import {test, after} from 'node:test';
import assert from 'node:assert/strict';
import {mkdtempSync, mkdirSync, readFileSync, writeFileSync, rmSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {dirname, resolve, join} from 'node:path';
import {fileURLToPath, pathToFileURL} from 'node:url';
import ts from 'typescript';

const root=resolve(dirname(fileURLToPath(import.meta.url)),'..');
const temporary=mkdtempSync(join(tmpdir(),'aether-fog-test-'));
const compiled=new Set();
function compile(relative){
  const destination=join(temporary,relative.replace(/\.ts$/,'.mjs'));
  if(compiled.has(relative))return destination;
  compiled.add(relative);
  const source=readFileSync(join(root,relative),'utf8');
  for(const dependency of ts.preProcessFile(source).importedFiles){
    if(dependency.fileName.startsWith('.'))compile(join(dirname(relative),dependency.fileName+'.ts'));
  }
  const output=ts.transpileModule(source,{compilerOptions:{target:ts.ScriptTarget.ES2020,module:ts.ModuleKind.ESNext}})
    .outputText.replace(/from (['"])(\.[^'"]+)\1/g,'from $1$2.mjs$1');
  mkdirSync(dirname(destination),{recursive:true});writeFileSync(destination,output);return destination;
}
const load=relative=>import(pathToFileURL(compile(relative)).href);
globalThis.Phaser={BlendModes:{NORMAL:0}};
const {WorldFogSystem,fogFootprintOpacity}=await load('src/render/WorldFogSystem.ts');
const {worldClock}=await load('src/world/WorldClock.ts');
const {OldRoadAncientForest}=await load('src/world/OldRoadAncientForest.ts');
const {OldRoadAncientForestVisualExtension}=await load('src/world/OldRoadAncientForestVisualExtension.ts');
after(()=>rmSync(temporary,{recursive:true,force:true}));

const rect=[{x:0,y:0},{x:1000,y:0},{x:1000,y:1000},{x:0,y:1000}];
const footprint=(x,y,w=100,h=40,rotation=0)=>({x,y,displayWidth:w,displayHeight:h,rotation});

test('whole fog quad stays inside the region, including rotation and concave edges',()=>{
  assert.equal(fogFootprintOpacity(footprint(500,500),rect),1);
  assert.equal(fogFootprintOpacity(footprint(35,500),rect),0);
  assert.equal(fogFootprintOpacity(footprint(500,35,100,40,Math.PI/4),rect),0);
  // All four corners are inside, but the quad crosses a narrow concave notch.
  const notch=[...rect.slice(0,3),{x:600,y:1000},{x:600,y:450},{x:400,y:450},{x:400,y:1000},rect[3]];
  assert.equal(fogFootprintOpacity(footprint(500,500,500,40),notch),0);
});

test('road exclusion protects its full corridor and fades continuously toward its edge',()=>{
  const road=[{x:0,y:500},{x:1000,y:500}];
  assert.equal(fogFootprintOpacity(footprint(500,500),rect,road,74),0);
  assert.equal(fogFootprintOpacity(footprint(500,590),rect,road,74),0);
  const samples=[597,602,610,620,635].map(y=>fogFootprintOpacity(footprint(500,y),rect,road,74,38));
  assert.ok(samples[0]>0&&samples.at(-1)===1);
  assert.ok(samples.every((value,i)=>i===0||value>samples[i-1]));
  // A short road wholly contained by a sprite must also suppress that sprite.
  assert.equal(fogFootprintOpacity(footprint(500,500,400,200),rect,[{x:480,y:500},{x:520,y:500}],74),0);
});

function sceneStub(){
  const objects=[],removed=[];
  const image=(x,y,key)=>{
    const sprite={x,y,texture:{key},width:512,height:192,scaleX:1,scaleY:1,rotation:0,active:true,
      get displayWidth(){return this.width*this.scaleX;},get displayHeight(){return this.height*this.scaleY;},
      setOrigin(){return this;},setBlendMode(){return this;},setData(){return this;},
      setTint(tint){this.tintTopLeft=tint;return this;},setAlpha(alpha){this.alpha=alpha;return this;},
      setVisible(visible){this.visible=visible;return this;},setDepth(depth){this.depth=depth;return this;},
      setPosition(x,y){this.x=x;this.y=y;return this;},setRotation(rotation){this.rotation=rotation;return this;},
      setScale(x,y=x){this.scaleX=x;this.scaleY=y;return this;},
      setDisplaySize(w,h){return this.setScale(w/this.width,h/this.height);},destroy(){this.active=false;}
    };objects.push(sprite);return sprite;
  };
  return{objects,removed,add:{image},registry:{set(){}},textures:{exists:()=>true,remove:key=>removed.push(key)}};
}

test('existing clock curve drives increasing day/dusk/night fog without changing clock state',()=>{
  const scene=sceneStub(),fog=new WorldFogSystem(scene);scene.worldFog=fog;
  const extension=Object.create(OldRoadAncientForestVisualExtension.prototype);
  const project=(u,v)=>({x:1600+48*(u-v),y:250+24*(u+v)});
  const oldForest=Object.create(OldRoadAncientForest.prototype);
  Object.assign(extension,{scene,visualRoadPath:[],territory:{project,groundDepth:l=>-20000+l,
    screenToLogical:(x,y)=>({u:(x-1600)/96+(y-250)/48,v:(y-250)/48-(x-1600)/96}),
    oldRoadAncientForest:oldForest},forestMass:{images:[{depth:-20069.8}],entries:[
      {kind:'hero',...project(-25,72),width:490,height:610},
      {kind:'roots',...project(-29,78),width:230,height:180}
    ]}});
  extension.registerForestFog();
  const zone=fog.zones.get('old-road-sinister-forest');
  const totals=[];
  for(const hour of [12,17,18,18.5,19,19.5,22]){
    worldClock.restore({version:1,day:9,timeOfDayMs:hour*3600000});
    const before=worldClock.serialize();fog.elapsedMs=23000;fog.update(0,0);
    assert.deepEqual(worldClock.serialize(),before);
    totals.push(zone.wisps.reduce((sum,w)=>sum+w.sprite.alpha,0));
  }
  assert.ok(totals[0]>.1,'daytime fog must have a visible opacity budget');
  assert.equal(totals[0],totals[1]);
  assert.ok(totals.slice(2).every((n,i)=>n>totals[i+1]),'density must increase throughout dusk');
  assert.ok(totals.at(-1)>totals[0]*1.5);
  assert.deepEqual(new Set(zone.wisps.map(w=>w.sprite.depth)),new Set(Object.values(zone.layerDepths)));
  const night=zone.wisps[0].sprite.tintTopLeft;
  assert.ok((night&255)>((night>>16)&255),'night fog must have a cooler tint');
  const before=zone.wisps.map(w=>({x:w.sprite.x,y:w.sprite.y,alpha:w.sprite.alpha}));
  fog.elapsedMs+=9000;fog.update(0,0);
  assert.ok(zone.wisps.every((w,i)=>w.sprite.x!==before[i].x||w.sprite.y!==before[i].y));
  assert.ok(new Set(zone.wisps.map((w,i)=>(w.sprite.x-before[i].x).toFixed(3))).size>3,'drifts must differ');
  extension.fogZoneHandle.setEnabled(false);fog.update(0,16);
  assert.ok(zone.wisps.every(w=>!w.sprite.visible));
  extension.fogZoneHandle.setEnabled(true);fog.update(0,16);
  assert.ok(zone.wisps.every(w=>w.sprite.visible));
  extension.fogZoneHandle.destroy();assert.equal(fog.zones.size,0);
  assert.ok(scene.objects.every(s=>!s.active));fog.destroy();assert.equal(scene.removed.length,6);
});

// Round 37: valida a zona que permanecia invisível mesmo após a correção
// aplicada somente à Floresta Sinistra no Round 36.
test('ancient forest uses visible world fog in daylight, dusk and night without moving any emitters',()=>{
  const scene=sceneStub(),fog=new WorldFogSystem(scene);
  scene.worldFog=fog;
  scene.aetherTerritory={config:{tileWidth:96,tileHeight:48}};
  scene.depthAt=(u,v,offset=0)=>-20000+(u+v)*100+offset;
  const forest=Object.create(OldRoadAncientForest.prototype);
  const project=(u,v)=>({x:1600+(u-v)*48,y:250+(u+v)*24});
  Object.assign(forest,{scene,territory:{project},sprites:[]});
  forest.registerGlobalFogZone();
  const zone=fog.zones.get('old-road-ancient-forest');
  assert.ok(zone,'ancient forest must register its own zone');
  assert.equal(zone.bands.length,7,'do not change the number of original emitters');
  assert.equal(zone.wisps.length,38,'retain the existing multi-depth distribution');
  assert.deepEqual(zone.bands.map(b=>[b.u,b.v]),[
    [1.145,54.657],[2.382,58.494],[1.629,62.062],[1.468,65.604],
    [2.005,69.655],[1.602,72.714],[1.361,74.109]
  ],'emitter positions must be identical');
  assert.ok(zone.bands.every(b=>b.height>=110),'fog must reach visibly between forest roots and trees');

  const totals=[];
  for(const hour of [12,17.1,18,18.5,19,19.5,22]){
    worldClock.restore({version:1,day:1,timeOfDayMs:hour*3600000});
    const previousClock=worldClock.serialize();
    fog.elapsedMs=23000;
    fog.update(0,0);
    assert.deepEqual(worldClock.serialize(),previousClock,'fog cannot alter the world clock');
    const total=zone.wisps.reduce((sum,w)=>sum+w.sprite.alpha,0);
    const midMax=Math.max(...zone.wisps.filter(w=>w.layer==='mid').map(w=>w.sprite.alpha));
    totals.push(total);
    if(hour===17.1){
      assert.ok(midMax>.08,`at 17:06 mid-layer fog must be visible; received ${midMax}`);
      assert.ok(total>2,`at 17:06 combined atmospheric visibility too weak (${total})`);
    }
    assert.ok(zone.wisps.every(w=>w.sprite.visible),'registered fog must be visible');
  }
  assert.ok(totals[1]>=totals[0],'fog must not become weaker after 17:00');
  assert.ok(totals.slice(2).every((n,i)=>n>totals[i+1]),'fog intensity must rise through dusk and night');
  assert.ok(totals.at(-1)>totals[0]*2,'night atmosphere should be significantly denser than day');
  const mid=zone.wisps.find(w=>w.layer==='mid');
  const offset=fog.logicalOffsetFromScreen(mid.sprite.x-mid.bandX,mid.sprite.y-mid.bandY);
  assert.ok(mid.sprite.depth>scene.depthAt(mid.baseU+offset.du,mid.baseV+offset.dv,.06),'mid fog must appear ahead of trees at the same world position');
  forest.fogZoneHandle.destroy();fog.destroy();
});
