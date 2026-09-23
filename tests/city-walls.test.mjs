import {test,after} from 'node:test';
import assert from 'node:assert/strict';
import {mkdtempSync,mkdirSync,readFileSync,writeFileSync,rmSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {dirname,resolve,join} from 'node:path';
import {fileURLToPath,pathToFileURL} from 'node:url';
import ts from 'typescript';
import {EventEmitter} from 'node:events';
import {inflateSync} from 'node:zlib';

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
  setTexture(key){this.key=key;return this;}
  setPosition(x,y){Object.assign(this,{x,y});return this;}
  setOrigin(x,y=x){this.originX=x;this.originY=y;return this;}
  setScale(x,y=x){this.scaleX=x;this.scaleY=y;return this;}
  setFlipX(v){this.flipX=v;return this;}
  setDepth(v){this.depth=v;return this;}
  setVisible(v){this.visible=v;return this;}
}
globalThis.Phaser={Scenes:{Events:{SHUTDOWN:'shutdown'}},Scene:class{},GameObjects:{Sprite,Container:class{}},Physics:{Arcade:{Sprite}},Math:{Clamp:(v,a,b)=>Math.max(a,Math.min(b,v))}};
const {AetherCityScene}=await import(pathToFileURL(compile('src/scenes/AetherCityScene.ts')).href);
const {Player}=await import(pathToFileURL(compile('src/entities/Player.ts')).href);
const {brokenWallGroundTransform,foundationColumns,isFoundationContact}=await import(pathToFileURL(compile('src/world/CityWallGrounding.ts')).href);
const {bridgeCenterU,SouthRiverCrossing}=await import(pathToFileURL(compile('src/world/SouthRiverBridge.ts')).href);
const {southRiverSections}=await import(pathToFileURL(compile('src/world/SouthRiver.ts')).href);
after(()=>rmSync(temporary,{recursive:true,force:true}));
function pngAlpha(path){
  const file=readFileSync(path),width=file.readUInt32BE(16),height=file.readUInt32BE(20),chunks=[];
  assert.equal(file[24],8);assert.equal(file[25],6);assert.equal(file[28],0);
  for(let p=8;p<file.length;){const length=file.readUInt32BE(p),type=file.toString('ascii',p+4,p+8);if(type==='IDAT')chunks.push(file.subarray(p+8,p+8+length));p+=length+12;}
  const input=inflateSync(Buffer.concat(chunks)),stride=width*4,rows=Buffer.alloc(height*stride),alpha=new Uint8Array(width*height);
  const paeth=(a,b,c)=>{const p=a+b-c,pa=Math.abs(p-a),pb=Math.abs(p-b),pc=Math.abs(p-c);return pa<=pb&&pa<=pc?a:pb<=pc?b:c;};
  for(let y=0;y<height;y++){const filter=input[y*(stride+1)];for(let x=0;x<stride;x++){
    const i=y*stride+x,a=x>=4?rows[i-4]:0,b=y?rows[i-stride]:0,c=y&&x>=4?rows[i-stride-4]:0;
    const prediction=[0,a,b,Math.floor((a+b)/2),paeth(a,b,c)][filter];
    rows[i]=(input[y*(stride+1)+1+x]+prediction)&255;if(x%4===3)alpha[y*width+(x>>2)]=rows[i];
  }}return {width,height,alpha};
}
const gateMask=pngAlpha(join(root,'assets/images/environment/isometric/isometric_city_gate_v3.png'));
const brokenMask=pngAlpha(join(root,'assets/images/environment/isometric/isometric_city_wall_broken.png'));
function scene(){
  const s=Object.create(AetherCityScene.prototype),objects=[],localTextures=new Map(textures);
  Object.assign(s,{
    textures:{get:k=>localTextures.get(k),exists:k=>localTextures.has(k),remove:k=>localTextures.delete(k),createCanvas:(key,width,height)=>{const size={width,height};const texture={getSourceImage:()=>size,get:()=>size,getContext:()=>({setTransform(){},drawImage(){}}),refresh(){}};localTextures.set(key,texture);return texture;}},
    events:new EventEmitter(),solidMasks:[],playerIsoRadius:.27,
    getTextureAlphaMask:()=>gateMask,
    add:{existing:o=>objects.push(o),zone:(x,y)=>new Sprite(s,x,y),graphics:()=>({fillStyle(){return this;},fillPoints(){return this;},setDepth(){return this;}})},
    player:{isoX:14,isoY:24,isoZ:-6,getLogicalCollisionSamples:Player.prototype.getLogicalCollisionSamples,
      getLogicalFootprintAt:Player.prototype.getLogicalFootprintAt,
      setIsoPosition(u,v,z){this.isoX=u;this.isoY=v;this.isoZ=z;}}
  });
  s.createWallsAndGates();return {s,objects};
}
const close=(a,b,message)=>assert.ok(Math.abs(a-b)<1e-6,`${message}: ${a} / ${b}`);

test('all 18 wall modules share a scale and meet at both base connectors',()=>{
  const {s,objects}=scene(),walls=objects.filter(o=>(o.key==='iso_city_wall'||o.key==='city_south_wall_join'));
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
  const {s,objects}=scene(),walls=objects.filter(o=>(o.key==='iso_city_wall'||o.key==='city_south_wall_join'));
  assert.equal(s.cornerTowerSprites.length,4);
  const anchors={'north-west':[2,2],'north-east':[26,2],'south-west':[2,26],'south-east':[26,26]};
  for(const tower of s.cornerTowerSprites){
    const [u,v]=anchors[tower.name],ground=s.project(u,v);
    // Opaque front foot measured in the approved 1086 × 1448 PNG.
    const footY=tower.y+(1428-1448*tower.originY)*tower.scaleY;
    assert.ok(footY>=ground.y&&footY<=ground.y+40,`${tower.name}: foot above/below the corner ground`);
    const adjacent=walls.filter(w=>Math.abs(w.isoX-u)+Math.abs(w.isoY-v)<=2.4);
    assert.ok(adjacent.length>=1);
    for(const wall of adjacent)assert.ok(tower.depth>wall.depth,`${tower.name}: wall cuts across the tower`);
    const oldDepth=tower.depth;tower.updateIsoPosition();close(tower.depth,oldDepth,'depth survives projection update');
    const iso=s.unproject(tower.x,tower.y-24);
    assert.ok(s.getSolidMaskCollisionScore(iso.x,iso.y)>0,'tower footprint follows the rendered feet');
  }
});

test('gates and towers retain the approved transforms; the broken section remains in its original span',()=>{
  const {s,objects}=scene();assert.equal(objects.length,25,'no duplicate wall or tower');
  for(const [gate,u,v] of [[s.southGateSprite,14,26.03],[s.eastGateSprite,26.03,14]]){
    close(gate.isoX,u,'gate u');close(gate.isoY,v,'gate v');close(gate.isoZ,-75,'gate z');
    close(gate.scaleX,.375,'gate scale');close(gate.scaleY,.375,'gate scale');
  }
  const broken=objects.filter(o=>o.key==='city_broken_wall_grounded');assert.equal(broken.length,1);
  close(broken[0].isoX,26,'broken wall u');close(broken[0].isoY,22,'broken wall v');
  close(broken[0].isoZ,0,'broken wall stays on the ground plane');
  for(const [name,u,v] of [['north-east',26.38,1.62],['south-west',1.62,26.38],['south-east',26.58,26.58]]){
    const t=s.cornerTowerSprites.find(t=>t.name===name);close(t.isoX,u,name);close(t.isoY,v,name);
  }
});

test('both gate corridors remain traversable and the entire wall perimeter blocks crossing',()=>{
  const {s}=scene();
  for(const south of [true,false])for(const direction of [-1,1]){
    const start=direction>0?24.5:28,end=direction>0?28:24.5;
    s.player.setIsoPosition(south?bridgeCenterU(start):start,south?start:14,-6);
    for(let n=start+direction*.05;direction>0?n<=end:n>=end;n+=direction*.05){
      const u=south?bridgeCenterU(n):n,v=south?n:14;
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

test('both broken-wall feet meet the terrain while the standing pier stays 124px high',()=>{
  const {s}=scene(),m=brokenWallGroundTransform((u,v)=>s.project(u,v),26,18,26);
  const transform=(x,y)=>({x:m.a*x+m.c*y+m.e,y:m.b*x+m.d*y+m.f});
  for(const [x,y,v] of [[123,1076,26],[1370,651,18]]){
    assert.ok(brokenMask.alpha[y*brokenMask.width+x]>=100,'contact anchor is an opaque foot pixel');
    for(let below=y+1;below<brokenMask.height;below++)assert.ok(brokenMask.alpha[below*brokenMask.width+x]<100,'anchor is the bottom of the foot');
    const p=transform(x,y),ground=s.project(26,v);
    close(p.x,ground.x,'foot x');close(p.y,ground.y,'foot y');
  }
  close(transform(123,1076).y-transform(123,436).y,124,'standing masonry height');
  close(transform(123,1076).x,transform(123,436).x,'vertical stonework remains vertical');
});

test('actual PNG feet close previously penetrable gate contacts on both sides',()=>{
  const {s}=scene(),contact=s.solidMasks.find(m=>m.mode==='groundContour');
  const all=s.solidMasks,old=all.filter(m=>m!==contact);
  for(const [u,v] of [[12.35,24.9],[13,25.95],[14.75,26.25],[17,24.85]]){
    s.solidMasks=old;assert.equal(s.isBlocked(u,v,.27),false,'reproduces the old penetration');
    s.solidMasks=all;assert.equal(s.isBlocked(u,v,.27),true,`stone foot ${u},${v}`);
  }
  // Approach from the city and from outside with the actual movement method.
  for(const direction of [-1,1]){
    s.player.setIsoPosition(13,direction>0?24.4:27.5,-6);
    let stopped=false;
    for(let n=0;n<160;n++){
      if(!s.tryMoveStep(0,direction*.02)){stopped=true;break;}
      assert.equal(s.getSolidMaskCollisionScore(s.player.isoX,s.player.isoY),0,'no partial entry');
    }
    assert.ok(stopped,'stops at the gate footing');
    assert.equal(s.tryMoveStep(0,-direction*.04),true,'can step back from the stone');
  }
});

test('the real player footprint crosses the bridge and central arch in both directions',()=>{
  const {s}=scene();s.southRiverBridge=new SouthRiverCrossing(southRiverSections((u,v)=>s.project(u,v)));
  for(const direction of [-1,1]){
    const start=direction<0?31:24.5,end=direction<0?24.5:31;
    s.player.setIsoPosition(bridgeCenterU(start),start,-6);
    for(let v=start+direction*.025;direction<0?v>=end:v<=end;v+=direction*.025){
      assert.equal(s.tryMoveStep(bridgeCenterU(v)-s.player.isoX,v-s.player.isoY),true,`bridge/arch at ${v}`);
      assert.equal(s.getSolidMaskCollisionScore(s.player.isoX,s.player.isoY),0,'central crossing has no stone overlap');
    }
  }
});

test('the new contact band excludes overhead arch stone and grass in front of the bases',()=>{
  const columns=foundationColumns(gateMask);
  for(const x of [550,580,600])assert.equal(columns[x],-1,'arch underside is not a ground obstacle');
  for(const x of [65,350,450,700,850,1050]){
    const bottom=columns[x];assert.ok(bottom>0);
    assert.equal(isFoundationContact(columns,x,bottom-3,16/.375),true);
    assert.equal(isFoundationContact(columns,x,bottom+3,16/.375),false,'no contact outside the drawn foot');
    assert.equal(isFoundationContact(columns,x,bottom-100,16/.375),false,'no tall silhouette collision');
  }
});

test('projection and join textures are released on shutdown; approved source textures remain',()=>{
  const {s}=scene();
  for(const key of ['city_broken_wall_grounded','city_south_wall_join'])assert.ok(s.textures.exists(key));
  s.events.emit('shutdown');
  for(const key of ['city_broken_wall_grounded','city_south_wall_join'])assert.equal(s.textures.exists(key),false);
  for(const key of Object.keys(assetNames))assert.ok(s.textures.exists(key));
  const next=scene().s;assert.ok(next.textures.exists('city_broken_wall_grounded'));
});
