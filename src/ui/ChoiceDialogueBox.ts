// @ts-nocheck
export class ChoiceDialogueBox{
 constructor(scene){
  this.scene=scene;
  this.options=[];
  this.bg=scene.add.rectangle(0,0,920,175,0x182033,.97).setOrigin(0).setScrollFactor(0).setDepth(850).setVisible(false);
  this.title=scene.add.text(0,0,'',{fontFamily:'Arial',fontSize:'18px',color:'#ffd166',fontStyle:'bold'}).setScrollFactor(0).setDepth(851).setVisible(false);
  this.body=scene.add.text(0,0,'',{fontFamily:'Arial',fontSize:'15px',color:'#ecf0ff',wordWrap:{width:850}}).setScrollFactor(0).setDepth(851).setVisible(false);
  this.resizeHandler=(gameSize)=>this.layout(gameSize.width,gameSize.height);
  scene.scale.on(Phaser.Scale.Events.RESIZE,this.resizeHandler);
  scene.events.once('shutdown',()=>scene.scale.off(Phaser.Scale.Events.RESIZE,this.resizeHandler));
  this.layout(scene.scale.width,scene.scale.height);
 }
 layout(width,height){
  this.left=(width-920)/2;
  this.top=height-195;
  this.bg.setPosition(this.left,this.top);
  this.title.setPosition(this.left+16,this.top+17);
  this.body.setPosition(this.left+16,this.top+55);
  this.hint?.setPosition(this.left+16,this.top+147);
  this.positionOptions();
 }
 positionOptions(){this.options.forEach((option,index)=>option.setPosition(this.left+20+index*285,this.top+125))}
 open(title,body,choices=[]){
  this.bg.setVisible(true);this.title.setVisible(true);this.body.setVisible(true);
  this.hint??=this.scene.add.text(this.left+16,this.top+147,'F / Esc • fechar',{fontFamily:'Arial',fontSize:11,color:'#9aa8c7'}).setScrollFactor(0).setDepth(851);
  this.hint.setVisible(true);this.title.setText(title);this.body.setText(body);
  this.options.forEach(x=>x.destroy());this.options=[];
  choices.slice(0,3).forEach((choice,index)=>{
   const text=this.scene.add.text(this.left+20+index*285,this.top+125,`${index+1}. ${choice.label}`,{fontFamily:'Arial',fontSize:'13px',color:'#73e6a8',backgroundColor:'#24314d',padding:8}).setScrollFactor(0).setDepth(852).setInteractive({useHandCursor:true});
   text.on('pointerdown',()=>choice.onSelect?.());this.options.push(text);
  });
 }
 close(){this.bg.setVisible(false);this.title.setVisible(false);this.body.setVisible(false);this.hint?.setVisible(false);this.options.forEach(x=>x.destroy());this.options=[]}
 isOpen(){return this.bg.visible}
}
