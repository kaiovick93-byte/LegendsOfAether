// @ts-nocheck
export class Waystone extends Phaser.GameObjects.Container{
  constructor(scene,x,y,areaName){super(scene,x,y);this.areaName=areaName;this.glyph=scene.add.circle(0,0,24,0x26344d,.95).setStrokeStyle(3,0x7ee0ff,.9);this.core=scene.add.circle(0,0,8,0x7ee0ff,.75);this.label=scene.add.text(0,38,'MARCO DE SENDA',{fontFamily:'Arial',fontSize:11,color:'#7ee0ff',backgroundColor:'#182033',padding:4}).setOrigin(.5);this.prompt=scene.add.text(0,-52,'F • Examinar',{fontFamily:'Arial',fontSize:11,color:'#ffd166',backgroundColor:'#182033',padding:{left:5,right:5,top:3,bottom:3}}).setOrigin(.5).setVisible(false);this.add([this.glyph,this.core,this.label,this.prompt]);scene.add.existing(this);this.setDepth(80);this.setAlpha(1);scene.tweens.add({targets:this.core,scale:{from:.8,to:1.2},alpha:{from:.45,to:1},duration:900,yoyo:true,repeat:-1,ease:'Sine.easeInOut'})}
  updatePrompt(px,py){this.prompt.setVisible(Phaser.Math.Distance.Between(px,py,this.x,this.y)<=85)}
  readMessage(){return `Este Marco de Senda está desativado.\n\nEle parece pertencer a uma antiga rede de teletransporte, mas precisa ser ativado antes de funcionar.\n\nTalvez alguém em Aether saiba como restaurá-lo.`}
}
