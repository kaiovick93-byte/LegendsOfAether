// @ts-nocheck
export class DialogueBox{
 constructor(scene){
  this.scene=scene;
  this.bg=scene.add.rectangle(0,0,920,142,0x182033,.97).setOrigin(0).setScrollFactor(0).setDepth(850).setVisible(false);
  this.title=scene.add.text(0,0,'',{fontFamily:'Arial',fontSize:'18px',color:'#ffd166',fontStyle:'bold'}).setScrollFactor(0).setDepth(851).setVisible(false);
  this.body=scene.add.text(0,0,'',{fontFamily:'Arial',fontSize:'15px',color:'#ecf0ff',wordWrap:{width:860}}).setScrollFactor(0).setDepth(851).setVisible(false);
  this.resizeHandler=(gameSize)=>this.layout(gameSize.width,gameSize.height);
  scene.scale.on(Phaser.Scale.Events.RESIZE,this.resizeHandler);
  scene.events.once('shutdown',()=>scene.scale.off(Phaser.Scale.Events.RESIZE,this.resizeHandler));
  this.layout(scene.scale.width,scene.scale.height);
 }
 layout(width,height){const left=(width-920)/2,top=height-162;this.bg.setPosition(left,top);this.title.setPosition(left+16,top+14);this.body.setPosition(left+16,top+52)}
 open(name,body){this.bg.setVisible(true);this.title.setVisible(true);this.body.setVisible(true);this.title.setText(name);this.body.setText(body)}
 close(){this.bg.setVisible(false);this.title.setVisible(false);this.body.setVisible(false)}
 isOpen(){return this.bg.visible}
}
