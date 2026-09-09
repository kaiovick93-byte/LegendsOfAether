import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

const root=process.cwd();
const source=fs.readFileSync(path.join(root,'src/prologue/OldAetherPrologue.ts'),'utf8')
  .replace(/^import .*$/gm,'')
  .replace(/^export const /gm,'const ')
  .replace(/^export class /gm,'class ');

class DisplayObject{
  constructor(x=0,y=0,key=''){this.x=x;this.y=y;this.textureKey=key;this.active=true;this.visible=true;this.alpha=1;this.children=[];this.body={setAllowGravity:()=>this.body,setVelocity:()=>this.body};}
  setName(value){this.name=value;return this} setTexture(key,frame=0){this.textureKey=key;this.frame={name:frame,height:256};return this}
  setOrigin(){return this} setScale(value){this.scaleX=value;this.scaleY=value;return this} setDepth(value){this.depth=value;return this}
  setFlipX(value){this.flipX=value;return this} clearTint(){return this} setActive(value){this.active=value;return this}
  setVisible(value){this.visible=value;return this} setAlpha(value){this.alpha=value;return this} setFrame(value){this.frame={name:value,height:256};return this}
  setPosition(x,y){this.x=x;this.y=y;return this} setScrollFactor(){return this} setText(value){this.text=value;return this}
  setWordWrapWidth(){return this} setInteractive(){return this} setStrokeStyle(){return this} setFillStyle(){return this}
  fillRoundedRect(){return this} fillStyle(){return this} lineStyle(){return this} strokeRoundedRect(){return this} clear(){return this}
  add(items){this.children.push(...(Array.isArray(items)?items:[items]));return this} play(key){this.animation=key;return this}
  destroy(){this.active=false;this.destroyed=true;return this}
}

class FakeEnemy extends DisplayObject{
  constructor(scene,x,y,name,stats){super(x,y,'enemy');this.scene=scene;this.name=name;this.maxHp=stats.hp;this.hp=stats.hp;this.dead=false;this.hpBg=new DisplayObject();this.hpFill=new DisplayObject();this.nameText=new DisplayObject();}
  isAlive(){return !this.dead&&this.hp>0} setUiVisible(value){this.hpBg.setVisible(value);this.hpFill.setVisible(value);this.nameText.setVisible(value);return this}
  takeDamage(){return this}
}

class FakeNpc extends DisplayObject{
  constructor(scene,x,y,name){super(x,y,'npc');this.scene=scene;this.npcName=name;this.sprite=new DisplayObject(0,8);this.isoDisplayScale=1;}
  setIsometricSprite(texture,{height}){this.textureKey=texture;this.isoBaseTexture=texture;this.isoDisplayScale=height/756;this.sprite.setTexture(texture,0).setScale(this.isoDisplayScale);return true}
  setInteractionAnchor(){return this} enableIsoPosition(_config,u,v){this.iso={u,v};return this} setNpcVisible(value){this.setVisible(value);return this}
}

const anchors={
  spawn:{u:7.7,v:73.2},roadSign:{u:8.5,v:66},travelSupplies:{u:8,v:63.15},youngWolf:{u:9,v:59.55},
  attackedWagon:{u:11.25,v:45.35},goblinScouts:[{u:10.5,v:48.8},{u:12.15,v:47.25}],patrol:{u:11.9,v:41.55},cityVista:{u:13.1,v:34.5},southGate:{u:14,v:26.2}
};

const Phaser={
  Math:{Clamp:(value,min,max)=>Math.max(min,Math.min(max,value)),Between:()=>2000,Distance:{Between:(x1,y1,x2,y2)=>Math.hypot(x2-x1,y2-y1)}},
  Scale:{Events:{RESIZE:'resize'}}
};

function makeScene(worldFlags={}){
  const animationKeys=new Set();
  const assets={
    prologue_young_wolf_8dir:{sourceHeight:1280,frameHeight:256},prologue_goblin_scout_8dir:{sourceHeight:1280,frameHeight:256},
    prologue_young_wolf:{sourceHeight:724,frameHeight:724},prologue_goblin_scout:{sourceHeight:724,frameHeight:724},
    aether_patrolman:{sourceHeight:756,frameHeight:756},abandoned_wagon_v3:{sourceHeight:1024,frameHeight:1024},street_crates:{sourceHeight:256,frameHeight:256},street_logs:{sourceHeight:256,frameHeight:256},outskirts_fence_segment:{sourceHeight:256,frameHeight:256}
  };
  const scene={
    worldFlags,cityActors:[],solidMasks:[],occluders:[],scale:{width:960,height:540,on(){},off(){}},
    add:{container:(x,y)=>new DisplayObject(x,y),graphics:()=>new DisplayObject(),text:(x,y,text)=>new DisplayObject(x,y).setText(text),image:(x,y,key)=>new DisplayObject(x,y,key),circle:(x,y)=>new DisplayObject(x,y)},
    textures:{exists:key=>!!assets[key],get:key=>({getSourceImage:()=>({height:assets[key].sourceHeight}),get:()=>({height:assets[key].frameHeight})})},
    anims:{exists:key=>animationKeys.has(key),create:config=>animationKeys.add(config.key),generateFrameNumbers:(texture,{frames})=>(Array.isArray(frames)?frames:[frames]).map(frame=>({key:texture,frame}))},
    time:{now:0,delayedCall:()=>({remove(){},paused:false})},tweens:{add:()=>({stop(){},pause(){},resume(){}}),killTweensOf(){}},
    player:{isoX:7.7,isoY:73.2,isDead:()=>false},inv:{add(){}},dialogueOpen:false,
    project:(u,v)=>({x:1600+(u-v)*48,y:250+(u+v)*24}),depthAt:(u,v,offset=0)=>-20000+(u+v)*100+offset,
    registerSolidMask(...args){this.solidMasks.push(args)},registerOccluder(...args){this.occluders.push(args)},saveGame(){},
    isNearWaystone:()=>false
  };
  scene.animationKeys=animationKeys;
  return scene;
}

const build=new Function('Enemy','Npc','AETHER_PROLOGUE_ANCHORS','Phaser',`${source}\nreturn {OldAetherPrologue,OLD_AETHER_PROLOGUE_STAGES};`);
const {OldAetherPrologue,OLD_AETHER_PROLOGUE_STAGES}=build(FakeEnemy,FakeNpc,anchors,Phaser);

// Novo Jogo ignora uma flag de sessão antiga e cria a carroça imediatamente.
const scene=makeScene({prologue:{started:true,completed:true,waystone:{reacted:true}}});
const prologue=new OldAetherPrologue(scene,{freshNewGame:true});
assert.equal(prologue.state.stage,OLD_AETHER_PROLOGUE_STAGES.ARRIVAL_ON_OLD_ROAD);
assert.equal(prologue.wagon?.name,'prologue-abandoned-wagon');
assert.equal(prologue.wagon?.textureKey,'abandoned_wagon_v3');
assert.equal(prologue.wagon?.active,true);assert.equal(prologue.wagon?.visible,true);
assert.equal(scene.solidMasks.some(([object])=>object===prologue.wagon),true);

// Cada ator nasce no estágio real do encontro e mantém asset, posição, alpha,
// active e visible de runtime. Não é uma simples checagem de existência de PNG.
prologue.state.stage=OLD_AETHER_PROLOGUE_STAGES.DEFEAT_YOUNG_WOLF;
prologue.ensureScriptedActors();
assert.equal(prologue.wolf?.name,'prologue-youngWolf');
assert.equal(prologue.wolf?.textureKey,'prologue_young_wolf_8dir');
assert.deepEqual(prologue.wolf?.iso,{u:9,v:59.55,originU:9,originV:59.55});
assert.equal(prologue.wolf?.active,true);assert.equal(prologue.wolf?.visible,true);assert.equal(prologue.wolf?.alpha,1);
assert.equal(prologue.wolf?.animation,'prologue-wolf-idle-s');

prologue.state.encounters.youngWolf='defeated';
prologue.state.stage=OLD_AETHER_PROLOGUE_STAGES.DEFEAT_GOBLIN_SCOUTS;
prologue.ensureScriptedActors();
assert.equal(prologue.goblinScouts.length,2);
for(const [index,goblin] of prologue.goblinScouts.entries()){
  assert.equal(goblin?.name,`prologue-goblinScout${index}`);
  assert.equal(goblin?.textureKey,'prologue_goblin_scout_8dir');
  assert.deepEqual(goblin?.iso,{u:anchors.goblinScouts[index].u,v:anchors.goblinScouts[index].v,originU:anchors.goblinScouts[index].u,originV:anchors.goblinScouts[index].v});
  assert.equal(goblin?.active,true);assert.equal(goblin?.visible,true);assert.equal(goblin?.alpha,1);
  assert.equal(goblin?.animation,'prologue-goblin-idle-s');
}

prologue.state.encounters.goblinScoutsCompleted=true;
prologue.state.stage=OLD_AETHER_PROLOGUE_STAGES.SPEAK_TO_PATROL;
prologue.ensureScriptedActors();
assert.equal(prologue.patrol?.name,'prologue-patrolman');
assert.equal(prologue.patrol?.isoBaseTexture,'aether_patrolman');
assert.deepEqual(prologue.patrol?.iso,{u:11.9,v:41.55});
assert.equal(prologue.patrol?.active,true);assert.equal(prologue.patrol?.visible,true);
assert.equal(prologue.patrol?.sprite?.animation,'prologue-patrol-idle');
assert.equal(scene.cityActors.includes(prologue.patrol),true);

for(const direction of ['n','ne','e','se','s','sw','w','nw']){
  assert.equal(scene.animationKeys.has(`prologue-wolf-walk-${direction}`),true);
  assert.equal(scene.animationKeys.has(`prologue-wolf-attack-${direction}`),true);
  assert.equal(scene.animationKeys.has(`prologue-goblin-walk-${direction}`),true);
  assert.equal(scene.animationKeys.has(`prologue-goblin-attack-${direction}`),true);
}

console.log('PROLOGUE_RUNTIME_ACTORS=PASS');
console.log('New Game: carroça=active+visible; lobo=spawned; goblins=2 spawned; patrulheiro=spawned.');
