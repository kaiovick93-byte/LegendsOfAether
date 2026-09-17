// @ts-nocheck
import {IsoSprite} from '../isometric/IsoOcclusion';

/** Cerco puramente cenográfico: sem corpos, dano, XP, loot ou interação. */
export class LowerWallSiege {
  constructor(scene,config){this.scene=scene;this.config=config;this.active=true;this.regionActive=true;this.stations=[];this.timers=[];this.tweens=[];this.effects=[];this.ensureArrowTexture();this.ensureAnimations();this.createStations()}
  ensureArrowTexture(){if(this.scene.textures.exists('siege_arrow'))return;const g=this.scene.add.graphics();g.lineStyle(3,0x8b572f,1).lineBetween(2,5,35,5);g.fillStyle(0xd7d0bd,1).fillTriangle(34,1,44,5,34,9);g.fillStyle(0x37506c,1).fillTriangle(5,5,0,1,0,9);g.generateTexture('siege_arrow',45,10);g.destroy()}
  ensureAnimations(){
    const ensure=(key,texture,frames,frameRate,repeat=0)=>{
      if(!this.scene.textures.exists(texture)||this.scene.anims.exists(key))return;
      this.scene.anims.create({key,frames:this.scene.anims.generateFrameNumbers(texture,{frames}),frameRate,repeat});
    };
    ensure('siege-archer-guard','siege_archer_action_v2',[0],4,-1);
    ensure('siege-archer-nock','siege_archer_action_v2',[1],6,0);
    ensure('siege-archer-draw','siege_archer_action_v2',[2],6,0);
    ensure('siege-archer-release','siege_archer_action_v2',[3],7,0);
    ensure('siege-goblin-walk','prologue_goblin_scout',[1,2],7,-1);
    ensure('siege-goblin-attack','prologue_goblin_scout',[3,4],7,0);
    ensure('siege-goblin-hit','prologue_goblin_scout',[4,0],7,0);
    ensure('siege-goblin-death','prologue_goblin_scout',[4,5],6,0);
  }
  createStations(){[
    {wall:'south',lane:6.70,delay:180},{wall:'south',lane:10.15,delay:960},{wall:'south',lane:17.90,delay:430},{wall:'south',lane:21.30,delay:1410},
    {wall:'east',lane:10.85,delay:650},{wall:'east',lane:18.40,delay:1180}
  ].forEach((spec,index)=>this.createStation(spec,index))}
  createStation(spec,index){
    const south=spec.wall==='south',archerIso=south?{u:spec.lane,v:25.36,z:78}:{u:25.36,v:spec.lane,z:78},attackIso=south?{u:spec.lane,v:26.82}:{u:26.82,v:spec.lane},spawnIso=south?{u:spec.lane,v:27.72}:{u:27.72,v:spec.lane},wallIso=south?{u:spec.lane,v:26}:{u:26,v:spec.lane};
    const archer=this.addIsoSprite('siege_archer_action_v2',archerIso,112,.20,0).setFlipX(south).setData('decorativeOnly',true);
    const goblin=this.addIsoSprite('prologue_goblin_scout',spawnIso,92,.18,0).setFlipX(south).setData('decorativeOnly',true).setVisible(false);
    const corpse=this.addIsoSprite('prologue_goblin_scout',attackIso,92,.17,5).setFlipX(south).setData('decorativeOnly',true).setVisible(false);
    [archer,goblin,corpse].forEach(actor=>actor.disableInteractive());
    const station={index,spec,archer,goblin,corpse,archerIso,attackIso,spawnIso,wallIso,archerScale:archer.scaleX,goblinScale:goblin.scaleX,cycle:0,archerBob:null,goblinStride:null};
    this.stations.push(station);this.startArcherGuard(station);this.schedule(spec.delay,()=>this.spawnGoblin(station));
  }
  addIsoSprite(texture,position,targetHeight,depthOffset,frame=0){const source=this.scene.textures.get(texture);const cell=source?.get?.(frame);const height=cell?.height||source?.getSourceImage?.().height||1;return new IsoSprite({scene:this.scene,isoX:position.u,isoY:position.v,isoZ:position.z||0,texture,frame,tileWidth:this.config.tileWidth,tileHeight:this.config.tileHeight,screenOriginX:this.config.originX,screenOriginY:this.config.originY,depthBase:this.config.depthBase,depthOffset}).setScale(targetHeight/height)}
  addTween(config){const complete=config.onComplete,tween=this.scene.tweens.add({...config,onComplete:(...args)=>{this.tweens=this.tweens.filter(item=>item!==tween);complete?.(...args)}});this.tweens.push(tween);return tween}
  disposeTween(tween){if(!tween)return;tween.stop?.();tween.remove?.();this.tweens=this.tweens.filter(item=>item!==tween)}
  schedule(delay,callback){if(!this.active||!this.regionActive)return null;const timer=this.scene.time.delayedCall(delay,()=>{this.timers=this.timers.filter(item=>item!==timer);if(this.active&&this.regionActive)callback()});this.timers.push(timer);return timer}
  startArcherGuard(station){const archer=station.archer;if(!this.active||!this.regionActive||!archer?.active)return;archer.play('siege-archer-guard',true);this.disposeTween(station.archerBob);station.archerBob=this.addTween({targets:archer,y:archer.y-1.5,duration:1180+(station.index%3)*170,ease:'Sine.InOut',yoyo:true,repeat:-1})}
  spawnGoblin(station){
    if(!this.active||!this.regionActive||!station.goblin?.active)return;const {goblin,spawnIso,attackIso,goblinScale}=station;this.scene.tweens.killTweensOf(goblin);this.disposeTween(station.goblinStride);
    goblin.setIsoPosition(spawnIso.u,spawnIso.v,0).setVisible(true).setAlpha(0).clearTint().setAngle(0).setScale(goblinScale*.82).play('siege-goblin-walk',true);
    const motion={u:spawnIso.u,v:spawnIso.v};station.goblinStride=this.addTween({targets:goblin,angle:{from:-2.2,to:2.2},duration:155,yoyo:true,repeat:-1,ease:'Sine.InOut'});
    this.addTween({targets:motion,u:attackIso.u,v:attackIso.v,duration:760+(station.index%3)*75,ease:'Sine.Out',onUpdate:()=>{if(this.regionActive)goblin.setIsoPosition(motion.u,motion.v,0)},onComplete:()=>{if(!this.regionActive)return;this.disposeTween(station.goblinStride);station.goblinStride=null;goblin.setIsoPosition(attackIso.u,attackIso.v,0).setAngle(0);this.removeCorpseWhenAttackBegins(station);this.schedule(170+station.index%4*45,()=>this.goblinStrike(station,0))}});
    this.addTween({targets:goblin,alpha:1,scaleX:goblinScale,scaleY:goblinScale,duration:380,ease:'Sine.Out'});
  }
  removeCorpseWhenAttackBegins(station){const corpse=station.corpse;if(!corpse?.visible)return;this.scene.tweens.killTweensOf(corpse);this.addTween({targets:corpse,alpha:0,duration:260,ease:'Sine.In',onComplete:()=>corpse.setVisible(false).setAlpha(1).setAngle(0)})}
  goblinStrike(station,strike){
    if(!this.active||!this.regionActive||!station.goblin?.visible)return;const goblin=station.goblin,base={x:goblin.x,y:goblin.y},wallPoint=this.config.project(station.wallIso.u,station.wallIso.v),dx=(wallPoint.x-base.x)*.17,dy=(wallPoint.y+12-base.y)*.17,angle=station.spec.wall==='south'?-7:7;goblin.play('siege-goblin-attack',true);
    this.addTween({targets:goblin,x:base.x+dx,y:base.y+dy,angle,duration:170,ease:'Quad.In',yoyo:true,hold:45,onYoyo:()=>this.emitWallImpact(station),onComplete:()=>{if(!this.regionActive)return;goblin.setIsoPosition(station.attackIso.u,station.attackIso.v,0).setAngle(0);if(strike<1)this.schedule(255+station.index%3*40,()=>this.goblinStrike(station,strike+1));else this.schedule(210+station.index%4*55,()=>this.archerPrepareAndFire(station))}});
  }
  emitWallImpact(station){if(!this.regionActive)return;const p=this.config.project(station.wallIso.u,station.wallIso.v),depth=Math.max(station.archer.depth,station.goblin.depth)+.5;for(let i=0;i<4;i++){const fleck=this.scene.add.circle(p.x+Phaser.Math.Between(-9,9),p.y+Phaser.Math.Between(-2,13),Phaser.Math.Between(1,3),i%2?0xc69b63:0x80664b,.82).setDepth(depth);this.effects.push(fleck);this.addTween({targets:fleck,x:fleck.x+Phaser.Math.Between(-15,15),y:fleck.y+Phaser.Math.Between(7,22),alpha:0,scale:.35,duration:360+Phaser.Math.Between(0,170),ease:'Quad.Out',onComplete:()=>this.disposeEffect(fleck)})}}
  archerPrepareAndFire(station){
    if(!this.active||!this.regionActive||!station.archer?.active||!station.goblin?.visible)return;
    const archer=station.archer,side=station.spec.wall==='south'?-1:1,base={x:archer.x,y:archer.y};
    this.disposeTween(station.archerBob);station.archerBob=null;
    this.scene.tweens.killTweensOf(archer);
    archer.play('siege-archer-nock',true);
    this.addTween({
      targets:archer,x:base.x+side*2,y:base.y-1,angle:side*-2,duration:150,ease:'Sine.Out',
      onComplete:()=>{
        archer.play('siege-archer-draw',true);
        this.addTween({
          targets:archer,x:base.x+side*5,y:base.y-3,angle:side*-5,duration:180,ease:'Quad.Out',
          onComplete:()=>{
            archer.play('siege-archer-release',true);
            this.fireArrow(station);
            this.addTween({
              targets:archer,x:base.x,y:base.y,angle:0,duration:250,ease:'Sine.InOut',
              onComplete:()=>this.startArcherGuard(station)
            });
          }
        });
      }
    });
  }
  fireArrow(station){
    if(!this.active||!this.regionActive||!station.goblin?.visible)return;const {archer,goblin}=station,side=station.spec.wall==='south'?-1:1,start={x:archer.x+side*11,y:archer.y-61},end={x:goblin.x,y:goblin.y-60},arrow=this.scene.add.image(start.x,start.y,'siege_arrow').setOrigin(.75,.5).setRotation(Math.atan2(end.y-start.y,end.x-start.x));
    this.effects.push(arrow);const flight={t:0};this.addTween({targets:flight,t:1,duration:360+station.index%3*25,ease:'Quad.In',onUpdate:()=>{const t=flight.t;arrow.x=Phaser.Math.Linear(start.x,end.x,t);arrow.y=Phaser.Math.Linear(start.y,end.y,t)-26*4*t*(1-t);arrow.setDepth(Phaser.Math.Linear(archer.depth,goblin.depth,t)+1.5);arrow.setRotation(Math.atan2(end.y-start.y+26*(8*t-4),end.x-start.x))},onComplete:()=>{this.disposeEffect(arrow);this.goblinReactAndDie(station)}});
  }
  goblinReactAndDie(station){if(!this.active||!this.regionActive||!station.goblin?.visible)return;const goblin=station.goblin,base={x:goblin.x,y:goblin.y};goblin.play('siege-goblin-hit',true).setTint(0xffdf9c);this.addTween({targets:goblin,x:base.x+(station.spec.wall==='south'?7:-7),duration:85,yoyo:true,repeat:1,ease:'Quad.Out',onComplete:()=>this.defeatGoblin(station)})}
  defeatGoblin(station){const {goblin,corpse,goblinScale,attackIso}=station;if(!this.active||!this.regionActive||!goblin?.active)return;const fallAngle=station.spec.wall==='south'?68:-68;goblin.play('siege-goblin-death',true);this.addTween({targets:goblin,y:goblin.y+12,angle:fallAngle,scaleX:goblinScale*.76,scaleY:goblinScale*.76,duration:430,ease:'Quad.In',onComplete:()=>{corpse.setIsoPosition(attackIso.u,attackIso.v,0).setFrame(5).setVisible(true).setAlpha(.82).setAngle(fallAngle).setScale(goblinScale*.76).clearTint();goblin.setVisible(false).setAlpha(1).clearTint().setAngle(0).setScale(goblinScale);station.cycle++;this.schedule(650+station.index%3*140,()=>this.spawnGoblin(station))}})}
  disposeEffect(effect){effect?.destroy?.();this.effects=this.effects.filter(item=>item!==effect)}
  clearRuntime(){for(const timer of this.timers)timer?.remove?.(false);for(const tween of this.tweens){tween?.stop?.();tween?.remove?.()}for(const effect of this.effects)effect?.destroy?.();this.timers=[];this.tweens=[];this.effects=[]}
  setRegionActive(value){value=!!value;if(!this.active||this.regionActive===value)return;this.regionActive=value;this.clearRuntime();for(const station of this.stations){station.archerBob=null;station.goblinStride=null;station.archer.setVisible(value).setFrame(0);station.goblin.setVisible(false).setAlpha(1).clearTint().setAngle(0).setScale(station.goblinScale).setFrame(0);station.corpse.setVisible(false).setAlpha(1).setAngle(0).setFrame(5);if(value){this.startArcherGuard(station);this.schedule(180+station.index*145,()=>this.spawnGoblin(station))}}}
  destroy(){if(!this.active&&this.stations.length===0)return;this.active=false;this.regionActive=false;this.clearRuntime();for(const station of this.stations){for(const actor of [station.archer,station.goblin,station.corpse]){this.scene.tweens.killTweensOf(actor);actor?.destroy?.()}}this.stations=[]}
}
