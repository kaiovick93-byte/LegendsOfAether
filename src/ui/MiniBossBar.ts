// @ts-nocheck
export class MiniBossBar{
 constructor(scene){
  this.scene=scene;
  this.bg=scene.add.rectangle(0,62,300,14,0x3a465f).setScrollFactor(0).setDepth(410).setVisible(false);
  this.fill=scene.add.rectangle(0,62,300,14,0xff6b6b).setOrigin(0,.5).setScrollFactor(0).setDepth(411).setVisible(false);
  this.title=scene.add.text(0,40,'',{fontFamily:'Arial',fontSize:'14px',color:'#ecf0ff',fontStyle:'bold'}).setOrigin(.5).setScrollFactor(0).setDepth(411).setVisible(false);
  this.resizeHandler=(gameSize)=>this.layout(gameSize.width);
  scene.scale.on(Phaser.Scale.Events.RESIZE,this.resizeHandler);
  this.layout(scene.scale.width);
  scene.events.once('shutdown',()=>scene.scale.off(Phaser.Scale.Events.RESIZE,this.resizeHandler));
 }
 layout(width){const x=width/2;this.bg.setX(x);this.fill.setX(x-150);this.title.setX(x)}
 show(e){this.bg.setVisible(true);this.fill.setVisible(true);this.title.setVisible(true);this.update(e)}
 hide(){this.bg.setVisible(false);this.fill.setVisible(false);this.title.setVisible(false)}
 update(e){if(!e)return;this.fill.width=300*Math.max(0,Math.min(1,e.hp/e.maxHp));this.title.setText(`${e.name} ${e.hp}/${e.maxHp}`)}
}
