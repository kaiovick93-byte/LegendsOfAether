// @ts-nocheck
export class Waystone extends Phaser.GameObjects.Container{
  constructor(scene,x,y,areaName,textureKey='waystone_dormant'){
    super(scene,x,y);
    this.areaName=areaName;
    this.textureKey=textureKey;
    this.cityWideArt=textureKey==='waystone_city_dormant';
    this.useSprite=scene.textures.exists(textureKey);

    if(this.useSprite){
      this.sprite=scene.add.image(0,0,textureKey).setOrigin(.5,this.cityWideArt ? .90 : .88);
      this.sprite.setDisplaySize(this.cityWideArt?246:124,this.cityWideArt?205:124);
      this.baseShadow=scene.add.ellipse(0,this.cityWideArt?17:6,this.cityWideArt?218:88,this.cityWideArt?42:28,0x000000,this.cityWideArt ? .12 : .22);
      this.label=scene.add.text(0,this.cityWideArt?48:34,'MARCO DE SENDA',{fontFamily:'Arial',fontSize:11,color:'#cfd8e6',backgroundColor:'#182033',padding:{left:5,right:5,top:3,bottom:3}}).setOrigin(.5);
      this.prompt=this.createInteractionPrompt(this.cityWideArt?-148:-88);
      this.add([this.baseShadow,this.sprite,this.label,this.prompt]);
      if(!this.cityWideArt)scene.tweens.add({targets:this.sprite,y:{from:0,to:-2},duration:1800,yoyo:true,repeat:-1,ease:'Sine.easeInOut'});
    }else{
      this.glyph=scene.add.circle(0,0,24,0x26344d,.95).setStrokeStyle(3,0x7ee0ff,.9);
      this.core=scene.add.circle(0,0,8,0x7ee0ff,.75);
      this.label=scene.add.text(0,38,'MARCO DE SENDA',{fontFamily:'Arial',fontSize:11,color:'#7ee0ff',backgroundColor:'#182033',padding:4}).setOrigin(.5);
      this.prompt=this.createInteractionPrompt(-58);
      this.add([this.glyph,this.core,this.label,this.prompt]);
      scene.tweens.add({targets:this.core,scale:{from:.8,to:1.2},alpha:{from:.45,to:1},duration:900,yoyo:true,repeat:-1,ease:'Sine.easeInOut'});
    }

    scene.add.existing(this);
    this.setDepth(30);

    // A cidade isométrica usa a máscara alfa completa do próprio sprite e não
    // deve receber um segundo retângulo invisível. As cenas cartesianas antigas
    // mantêm o pequeno bloqueio de base até adotarem o mesmo movimento lógico.
    if(!scene.usesLogicalAlphaCollision){
      this.blocker=scene.add.rectangle(x,y+4,58,38,0x000000,0).setDepth(0);
      scene.physics.add.existing(this.blocker,true);
      if(scene.player) this.playerCollider=scene.physics.add.collider(scene.player,this.blocker);
    }
    scene.events.once('shutdown',()=>{
      try{this.playerCollider?.destroy()}catch(e){}
      try{this.blocker?.destroy()}catch(e){}
    });
  }
  createInteractionPrompt(y){
    const scene=this.scene;
    const prompt=scene.add.container(0,y).setVisible(false);
    const panel=scene.add.graphics();
    panel.fillStyle(0x02050b,.34).fillRoundedRect(-91,-17,184,34,7);
    panel.fillStyle(0x080f1d,.97).fillRoundedRect(-93,-19,184,34,7);
    panel.lineStyle(1.4,0x657186,.95).strokeRoundedRect(-93,-19,184,34,7);
    panel.lineStyle(1,0x263247,.9).strokeRoundedRect(-90,-16,178,28,5);
    const key=scene.add.graphics();
    key.fillStyle(0x02040a,.55).fillRoundedRect(-84,-13,26,26,5);
    key.fillStyle(0xf7f7f2,1).fillRoundedRect(-86,-15,26,26,5);
    key.lineStyle(1.5,0xc7ced7,1).strokeRoundedRect(-86,-15,26,26,5);
    const keyText=scene.add.text(-73,-2,'F',{fontFamily:'Arial',fontSize:13,color:'#111927',fontStyle:'bold'}).setOrigin(.5);
    const bullet=scene.add.circle(-49,-2,2.2,0xd7b56d,1);
    const label=scene.add.text(-40,-2,'Examinar',{fontFamily:'Georgia, serif',fontSize:12,color:'#f2f4f7',fontStyle:'bold',stroke:'#06090f',strokeThickness:1}).setOrigin(0,.5);
    prompt.add([panel,key,keyText,bullet,label]);
    return prompt;
  }
  updatePrompt(px,py){this.prompt.setVisible(Phaser.Math.Distance.Between(px,py,this.x,this.y)<=88)}
  readMessage(){
    return `Este Marco de Senda está desativado.

Ele pertence a uma antiga rede de teletransporte, mas ainda precisa ser ativado.

Talvez uma futura missão revele como restaurá-lo.`;
  }
}
