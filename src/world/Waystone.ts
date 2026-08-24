// @ts-nocheck
export class Waystone extends Phaser.GameObjects.Container{
  constructor(scene,x,y,areaName){
    super(scene,x,y);
    this.areaName=areaName;
    this.useSprite=scene.textures.exists('waystone_dormant');

    if(this.useSprite){
      this.sprite=scene.add.image(0,0,'waystone_dormant').setOrigin(.5,.88);
      this.sprite.setDisplaySize(124,124);
      this.baseShadow=scene.add.ellipse(0,6,88,28,0x000000,.22);
      this.label=scene.add.text(0,34,'MARCO DE SENDA',{fontFamily:'Arial',fontSize:11,color:'#cfd8e6',backgroundColor:'#182033',padding:{left:5,right:5,top:3,bottom:3}}).setOrigin(.5);
      this.prompt=scene.add.text(0,-84,'F • Examinar',{fontFamily:'Arial',fontSize:11,color:'#ffd166',backgroundColor:'#182033',padding:{left:5,right:5,top:3,bottom:3}}).setOrigin(.5).setVisible(false);
      this.add([this.baseShadow,this.sprite,this.label,this.prompt]);
      scene.tweens.add({targets:this.sprite,y:{from:0,to:-2},duration:1800,yoyo:true,repeat:-1,ease:'Sine.easeInOut'});
    }else{
      this.glyph=scene.add.circle(0,0,24,0x26344d,.95).setStrokeStyle(3,0x7ee0ff,.9);
      this.core=scene.add.circle(0,0,8,0x7ee0ff,.75);
      this.label=scene.add.text(0,38,'MARCO DE SENDA',{fontFamily:'Arial',fontSize:11,color:'#7ee0ff',backgroundColor:'#182033',padding:4}).setOrigin(.5);
      this.prompt=scene.add.text(0,-52,'F • Examinar',{fontFamily:'Arial',fontSize:11,color:'#ffd166',backgroundColor:'#182033',padding:{left:5,right:5,top:3,bottom:3}}).setOrigin(.5).setVisible(false);
      this.add([this.glyph,this.core,this.label,this.prompt]);
      scene.tweens.add({targets:this.core,scale:{from:.8,to:1.2},alpha:{from:.45,to:1},duration:900,yoyo:true,repeat:-1,ease:'Sine.easeInOut'});
    }

    scene.add.existing(this);
    this.setDepth(30);

    // Colisão física apenas na base do monumento. O topo permanece visual,
    // permitindo que o jogador circule naturalmente ao redor do Marco de Senda.
    this.blocker=scene.add.rectangle(x,y+4,58,38,0x000000,0).setDepth(0);
    scene.physics.add.existing(this.blocker,true);
    if(scene.player) this.playerCollider=scene.physics.add.collider(scene.player,this.blocker);
    scene.events.once('shutdown',()=>{
      try{this.playerCollider?.destroy()}catch(e){}
      try{this.blocker?.destroy()}catch(e){}
    });
  }
  updatePrompt(px,py){this.prompt.setVisible(Phaser.Math.Distance.Between(px,py,this.x,this.y)<=88)}
  readMessage(){
    return `Este Marco de Senda está desativado.

Ele pertence a uma antiga rede de teletransporte, mas ainda precisa ser ativado.

Talvez uma futura missão revele como restaurá-lo.`;
  }
}
