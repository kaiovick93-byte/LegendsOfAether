// @ts-nocheck
export class DeathOverlay{
 constructor(scene){
  this.scene=scene;
  this.bg=scene.add.rectangle(0,0,450,170,0x000000,.78).setScrollFactor(0).setDepth(900).setVisible(false);
  this.t=scene.add.text(0,0,'VOCÊ CAIU EM BATALHA',{fontFamily:'Arial',fontSize:'24px',color:'#ff6b6b',fontStyle:'bold'}).setOrigin(.5).setScrollFactor(0).setDepth(901).setVisible(false);
  this.b=scene.add.text(0,0,'Respawn em instantes...',{fontFamily:'Arial',fontSize:'16px',color:'#ecf0ff'}).setOrigin(.5).setScrollFactor(0).setDepth(901).setVisible(false);
  this.resizeHandler=(gameSize)=>this.layout(gameSize.width,gameSize.height);
  scene.scale.on(Phaser.Scale.Events.RESIZE,this.resizeHandler);
  this.layout(scene.scale.width,scene.scale.height);
  scene.events.once('shutdown',()=>scene.scale.off(Phaser.Scale.Events.RESIZE,this.resizeHandler));
 }
 layout(width,height){const x=width/2,y=height/2;this.bg.setPosition(x,y);this.t.setPosition(x,y-35);this.b.setPosition(x,y+20)}
 show(msg){this.bg.setVisible(true);this.t.setVisible(true);this.b.setVisible(true);this.b.setText(msg)}
 hide(){this.bg.setVisible(false);this.t.setVisible(false);this.b.setVisible(false)}
}
