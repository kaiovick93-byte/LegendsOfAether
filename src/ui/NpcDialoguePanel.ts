// @ts-nocheck
export class NpcDialoguePanel{
 constructor(scene){
  this.scene=scene;
  this.pageIndex=0;
  this.pages=[];
  this.secondaryAction=null;
  this.visible=false;
  this.build();
 }

 build(){
  const s=this.scene,W=s.scale.width,H=s.scale.height;
  this.root=s.add.container(0,0).setScrollFactor(0).setDepth(1600).setVisible(false).setAlpha(0);
  this.backdrop=s.add.rectangle(0,0,W,H,0x050810,.58).setOrigin(0);

  this.bodyX=16;this.bodyY=Math.max(176,H-330);
  this.bodyPanel=s.add.image(this.bodyX,this.bodyY,'dialogue_body_panel').setOrigin(0).setDisplaySize(620,308);
  this.headerX=36;this.headerY=this.bodyY-36;
  this.header=s.add.image(this.headerX,this.headerY,'dialogue_header_bar').setOrigin(0).setDisplaySize(590,68);

  this.portraitFrameX=W-350;this.portraitFrameY=Math.max(42,H-480);
  this.portrait=s.add.image(this.portraitFrameX+8,this.portraitFrameY+9,'portrait_aldren').setOrigin(0).setDisplaySize(326,440);
  this.portraitFrame=s.add.image(this.portraitFrameX,this.portraitFrameY,'dialogue_portrait_frame').setOrigin(0).setDisplaySize(342,458);

  this.name=s.add.text(78,this.headerY+12,'',{
   fontFamily:'Georgia, serif',fontSize:24,color:'#f2d18b',fontStyle:'bold',
   stroke:'#080b10',strokeThickness:3
  }).setOrigin(0,0);
  this.role=s.add.text(80,this.headerY+43,'',{
   fontFamily:'Georgia, serif',fontSize:13,color:'#c9d2df',fontStyle:'italic',
   stroke:'#080b10',strokeThickness:2
  }).setOrigin(0,0);

  this.quote=s.add.text(56,this.bodyY+56,'“',{
   fontFamily:'Georgia, serif',fontSize:38,color:'#e8bd65',fontStyle:'bold'
  }).setOrigin(0,0);
  this.body=s.add.text(92,this.bodyY+73,'',{
   fontFamily:'Georgia, serif',fontSize:18,color:'#eef2f7',fontStyle:'italic',
   lineSpacing:8,wordWrap:{width:475},stroke:'#080b10',strokeThickness:1
  }).setOrigin(0,0);
  this.pageCounter=s.add.text(585,this.bodyY+265,'',{
   fontFamily:'Georgia, serif',fontSize:11,color:'#93a2b9'
  }).setOrigin(1,.5);

  this.footerY=H-28;
  this.primary=this.makeActionButton(112,this.footerY,'dialogue_button_blue','npc_key_f','Continuar');
  this.secondary=this.makeActionButton(374,this.footerY,'dialogue_button_green','npc_key_t','Loja');
  this.closeBtn=this.makeActionButton(W-167,this.footerY,'dialogue_button_red','dialogue_key_esc','Fechar',true);

  this.primary.container.setInteractive(new Phaser.Geom.Rectangle(-95,-23,190,46),Phaser.Geom.Rectangle.Contains);
  this.primary.container.on('pointerdown',()=>this.onPrimary?.());
  this.secondary.container.setInteractive(new Phaser.Geom.Rectangle(-95,-23,190,46),Phaser.Geom.Rectangle.Contains);
  this.secondary.container.on('pointerdown',()=>this.onSecondary?.());
  this.closeBtn.container.setInteractive(new Phaser.Geom.Rectangle(-95,-23,190,46),Phaser.Geom.Rectangle.Contains);
  this.closeBtn.container.on('pointerdown',()=>this.onClose?.());

  this.root.add([
   this.backdrop,this.bodyPanel,this.header,this.portrait,this.portraitFrame,
   this.name,this.role,this.quote,this.body,this.pageCounter,
   this.primary.container,this.secondary.container,this.closeBtn.container
  ]);
 }

 makeActionButton(x,y,buttonTexture,keyTexture,label,wideKey=false){
  const s=this.scene,c=s.add.container(x,y);
  const bg=s.add.image(0,0,buttonTexture).setDisplaySize(190,46);
  const key=s.add.image(-58,0,keyTexture).setDisplaySize(wideKey?48:28,wideKey?28:28);
  const text=s.add.text(-33,0,label,{
   fontFamily:'Georgia, serif',fontSize:15,color:'#f4ead1',fontStyle:'bold',
   stroke:'#080b10',strokeThickness:2
  }).setOrigin(0,.5);
  c.add([bg,key,text]);
  return{container:c,bg,key,text};
 }

 open(config={}){
  this.pages=(config.pages||[config.text||'...']).filter(x=>x!=null&&String(x).trim()!=='').map(String);
  if(!this.pages.length)this.pages=['...'];
  this.pageIndex=0;
  this.name.setText(config.name||'Viajante');
  this.role.setText(config.role||'');
  this.secondaryAction=config.secondaryAction||null;
  this.onPrimary=config.onPrimary||null;
  this.onSecondary=config.onSecondary||null;
  this.onClose=config.onClose||null;

  const portraitKey=config.portraitKey;
  const spriteKey=config.spriteKey;
  if(portraitKey&&this.scene.textures.exists(portraitKey)){
   this.portrait.setTexture(portraitKey).setDisplaySize(326,440).setOrigin(0);
  }else if(spriteKey&&this.scene.textures.exists(spriteKey)){
   // Functional fallback: the NPC map sprite still appears if its high-res portrait is missing.
   this.portrait.setTexture(spriteKey,0).setDisplaySize(250,330).setOrigin(.5,1);
   this.portrait.setPosition(this.portraitFrameX+171,this.portraitFrameY+438);
  }
  if(portraitKey&&this.scene.textures.exists(portraitKey))this.portrait.setPosition(this.portraitFrameX+8,this.portraitFrameY+9);

  this.secondary.container.setVisible(!!this.secondaryAction);
  if(this.secondaryAction)this.secondary.text.setText(this.secondaryAction.label||'Ação');
  this.refreshPage();
  this.root.setVisible(true).setAlpha(0).setY(10);
  this.visible=true;
  this.scene.tweens.add({targets:this.root,alpha:1,y:0,duration:170,ease:'Sine.Out'});
 }

 refreshPage(){
  this.body.setText(this.pages[this.pageIndex]||'');
  const total=this.pages.length;
  this.pageCounter.setText(total>1?`${this.pageIndex+1} / ${total}`:'');
  this.primary.text.setText(this.pageIndex<total-1?'Continuar':'Fechar');
 }

 advance(){
  if(!this.visible)return false;
  if(this.pageIndex<this.pages.length-1){
   this.pageIndex++;
   this.refreshPage();
   this.body.setAlpha(.15);
   this.scene.tweens.add({targets:this.body,alpha:1,duration:120,ease:'Sine.Out'});
   return true;
  }
  return false;
 }

 triggerSecondary(){
  if(!this.visible||!this.secondaryAction)return false;
  this.onSecondary?.();
  return true;
 }

 close(immediate=false){
  if(!this.visible&&!this.root.visible)return;
  this.visible=false;
  this.scene.tweens.killTweensOf(this.root);
  if(immediate){this.root.setVisible(false).setAlpha(0).setY(10);return}
  this.scene.tweens.add({targets:this.root,alpha:0,y:10,duration:120,ease:'Sine.In',onComplete:()=>this.root.setVisible(false)});
 }

 isOpen(){return !!this.visible}
 hasSecondaryAction(){return !!this.secondaryAction}
}
