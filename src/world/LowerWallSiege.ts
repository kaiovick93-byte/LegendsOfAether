// @ts-nocheck
import {IsoSprite} from '../isometric/IsoOcclusion';

/**
 * Cerco estritamente cenográfico dos dois muros inferiores da cidade.
 *
 * Nenhum ator possui corpo físico, vida, prompt, alvo de combate ou entrada
 * nas listas de NPCs/inimigos. A barreira lógica da cena é a única autoridade
 * de gameplay; esta classe cuida apenas de imagem, tempo e profundidade.
 */
export class LowerWallSiege {
  constructor(scene, config) {
    this.scene=scene;
    this.config=config;
    this.active=true;
    this.stations=[];
    this.timers=[];
    this.effects=[];
    this.ensureArrowTexture();
    this.createStations();
  }

  ensureArrowTexture(){
    if(this.scene.textures.exists('siege_arrow'))return;
    const g=this.scene.add.graphics();
    g.lineStyle(3,0x8b572f,1).lineBetween(2,5,35,5);
    g.fillStyle(0xd7d0bd,1).fillTriangle(34,1,44,5,34,9);
    g.fillStyle(0x37506c,1).fillTriangle(5,5,0,1,0,9);
    g.generateTexture('siege_arrow',45,10);
    g.destroy();
  }

  createStations(){
    const specs=[
      {wall:'south',lane:6.20, delay:100},
      {wall:'south',lane:9.45, delay:780},
      {wall:'south',lane:18.55,delay:350},
      {wall:'south',lane:21.80,delay:1040},
      {wall:'east', lane:7.10, delay:520},
      {wall:'east', lane:20.85,delay:1250}
    ];
    specs.forEach((spec,index)=>this.createStation(spec,index));
  }

  createStation(spec,index){
    const south=spec.wall==='south';
    const archerIso=south
      ?{u:spec.lane,v:25.55,z:78}
      :{u:25.55,v:spec.lane,z:78};
    const attackIso=south
      ?{u:spec.lane,v:26.78,z:0}
      :{u:26.78,v:spec.lane,z:0};
    const spawnIso=south
      ?{u:spec.lane,v:27.62,z:0}
      :{u:27.62,v:spec.lane,z:0};
    const wallIso=south
      ?{u:spec.lane,v:26,z:0}
      :{u:26,v:spec.lane,z:0};

    const archer=this.addIsoSprite('siege_archer',archerIso,118,.20)
      .setFlipX(south).setData('decorativeOnly',true);
    const goblin=this.addIsoSprite('siege_goblin',spawnIso,106,.18)
      .setFlipX(south).setData('decorativeOnly',true).setVisible(false);
    archer.disableInteractive();
    goblin.disableInteractive();

    const station={
      index,spec,archer,goblin,archerIso,attackIso,spawnIso,wallIso,
      archerScale:archer.scaleX,goblinScale:goblin.scaleX,
      cycle:0
    };
    this.stations.push(station);
    this.scene.tweens.add({
      targets:archer,y:archer.y-2,duration:1250+(index%3)*170,
      ease:'Sine.InOut',yoyo:true,repeat:-1
    });
    this.schedule(spec.delay,()=>this.spawnGoblin(station));
  }

  addIsoSprite(texture,position,targetHeight,depthOffset){
    const source=this.scene.textures.get(texture).getSourceImage();
    const scale=targetHeight/source.height;
    return new IsoSprite({
      scene:this.scene,isoX:position.u,isoY:position.v,isoZ:position.z,
      texture,tileWidth:this.config.tileWidth,tileHeight:this.config.tileHeight,
      screenOriginX:this.config.originX,screenOriginY:this.config.originY,
      depthBase:this.config.depthBase,depthOffset
    }).setScale(scale);
  }

  schedule(delay,callback){
    if(!this.active)return null;
    const timer=this.scene.time.delayedCall(delay,()=>{
      this.timers=this.timers.filter(item=>item!==timer);
      if(this.active)callback();
    });
    this.timers.push(timer);
    return timer;
  }

  spawnGoblin(station){
    if(!this.active||!station.goblin?.active)return;
    const {goblin,spawnIso,attackIso,goblinScale}=station;
    this.scene.tweens.killTweensOf(goblin);
    goblin.setIsoPosition(spawnIso.u,spawnIso.v,0)
      .setVisible(true).setAlpha(0).clearTint().setAngle(0)
      .setScale(goblinScale*.78);
    const motion={u:spawnIso.u,v:spawnIso.v};
    this.scene.tweens.add({
      targets:motion,u:attackIso.u,v:attackIso.v,
      duration:720+(station.index%2)*90,ease:'Sine.Out',
      onUpdate:()=>goblin.setIsoPosition(motion.u,motion.v,0),
      onComplete:()=>{
        goblin.setIsoPosition(attackIso.u,attackIso.v,0);
        this.schedule(160,()=>this.goblinStrike(station,0));
      }
    });
    this.scene.tweens.add({
      targets:goblin,alpha:1,scaleX:goblinScale,scaleY:goblinScale,
      duration:380,ease:'Sine.Out'
    });
  }

  goblinStrike(station,strike){
    if(!this.active||!station.goblin?.visible)return;
    const goblin=station.goblin;
    const base={x:goblin.x,y:goblin.y};
    const wallPoint=this.config.project(station.wallIso.u,station.wallIso.v);
    const dx=(wallPoint.x-base.x)*.16;
    const dy=(wallPoint.y+12-base.y)*.16;
    const angle=station.spec.wall==='south'?-7:7;
    this.scene.tweens.add({
      targets:goblin,x:base.x+dx,y:base.y+dy,angle,
      duration:170,ease:'Quad.In',yoyo:true,hold:45,
      onYoyo:()=>this.emitWallImpact(station),
      onComplete:()=>{
        goblin.setIsoPosition(station.attackIso.u,station.attackIso.v,0).setAngle(0);
        if(strike<1)this.schedule(260,()=>this.goblinStrike(station,strike+1));
        else this.schedule(240,()=>this.fireArrow(station));
      }
    });
  }

  emitWallImpact(station){
    const point=this.config.project(station.wallIso.u,station.wallIso.v);
    const depth=Math.max(station.archer.depth,station.goblin.depth)+.5;
    for(let i=0;i<5;i++){
      const fleck=this.scene.add.circle(
        point.x+Phaser.Math.Between(-9,9),point.y+Phaser.Math.Between(-2,13),
        Phaser.Math.Between(1,3),i%2?0xc69b63:0x80664b,.82
      ).setDepth(depth);
      this.effects.push(fleck);
      this.scene.tweens.add({
        targets:fleck,x:fleck.x+Phaser.Math.Between(-15,15),
        y:fleck.y+Phaser.Math.Between(7,22),alpha:0,scale:.35,
        duration:360+Phaser.Math.Between(0,170),ease:'Quad.Out',
        onComplete:()=>{fleck.destroy();this.effects= this.effects.filter(item=>item!==fleck)}
      });
    }
  }

  fireArrow(station){
    if(!this.active||!station.archer?.active||!station.goblin?.visible)return;
    const {archer,goblin,archerScale}=station;
    const recoil=station.spec.wall==='south'?-3:3;
    this.scene.tweens.add({
      targets:archer,angle:recoil,duration:95,ease:'Quad.Out',yoyo:true,
      onComplete:()=>archer.setAngle(0)
    });

    const start={x:archer.x+(station.spec.wall==='south'?-8:8),y:archer.y-72};
    const end={x:goblin.x,y:goblin.y-65};
    const arrow=this.scene.add.image(start.x,start.y,'siege_arrow').setOrigin(.75,.5);
    arrow.setRotation(Math.atan2(end.y-start.y,end.x-start.x));
    arrow.setDepth(Math.max(archer.depth,goblin.depth)+2);
    this.effects.push(arrow);
    archer.setScale(archerScale);
    this.scene.tweens.add({
      targets:arrow,x:end.x,y:end.y,duration:330,ease:'Quad.In',
      onComplete:()=>{
        arrow.destroy();
        this.effects=this.effects.filter(item=>item!==arrow);
        this.defeatGoblin(station);
      }
    });
  }

  defeatGoblin(station){
    if(!this.active||!station.goblin?.active)return;
    const goblin=station.goblin;
    const fallAngle=station.spec.wall==='south'?68:-68;
    goblin.setTint(0xffdf9c);
    this.scene.tweens.add({
      targets:goblin,y:goblin.y+16,angle:fallAngle,alpha:0,
      scaleX:station.goblinScale*.72,scaleY:station.goblinScale*.72,
      duration:460,ease:'Quad.In',
      onComplete:()=>{
        goblin.setVisible(false).clearTint().setAngle(0);
        station.cycle++;
        this.schedule(620+(station.index%3)*120,()=>this.spawnGoblin(station));
      }
    });
  }

  destroy(){
    if(!this.active)return;
    this.active=false;
    for(const timer of this.timers)timer?.remove?.(false);
    for(const station of this.stations){
      this.scene.tweens.killTweensOf(station.archer);
      this.scene.tweens.killTweensOf(station.goblin);
      station.archer?.destroy?.();
      station.goblin?.destroy?.();
    }
    for(const effect of this.effects)effect?.destroy?.();
    this.timers=[];this.stations=[];this.effects=[];
  }
}
