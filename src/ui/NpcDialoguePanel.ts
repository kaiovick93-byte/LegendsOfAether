// @ts-nocheck
/**
 * Full-width lower dialogue for the isometric city.
 *
 * It deliberately reuses the white/graphite visual language of the compact
 * proximity card. NPC artwork is taken from the transparent map sprite, so no
 * painted portrait background or decorative frame can cover the city.
 */
export class NpcDialoguePanel{
 constructor(scene){
  this.scene=scene;
  this.pageIndex=0;
  this.pages=[];
  this.secondaryAction=null;
  this.visible=false;
  this.build();
  this.resizeHandler=()=>this.layout();
  scene.scale.on(Phaser.Scale.Events.RESIZE,this.resizeHandler);
  scene.events.once(Phaser.Scenes.Events.SHUTDOWN,()=>scene.scale.off(Phaser.Scale.Events.RESIZE,this.resizeHandler));
 }

 build(){
  const s=this.scene;
  this.root=s.add.container(0,0).setScrollFactor(0).setDepth(1900).setVisible(false).setAlpha(0);
  this.backdrop=s.add.rectangle(0,0,1,1,0x05080c,.68).setOrigin(0);
  this.panel=s.add.graphics();
  this.headerRule=s.add.graphics();
  this.portrait=s.add.sprite(0,0,'merchant_iso',0).setOrigin(.5,1);

  this.name=s.add.text(0,0,'',{
   fontFamily:'Georgia, serif',fontSize:25,color:'#18212d',fontStyle:'bold'
  }).setOrigin(0,0);
  this.role=s.add.text(0,0,'',{
   fontFamily:'Georgia, serif',fontSize:13,color:'#647080',fontStyle:'italic'
  }).setOrigin(0,0);
  this.quote=s.add.text(0,0,'“',{
   fontFamily:'Georgia, serif',fontSize:35,color:'#b7893d',fontStyle:'bold'
  }).setOrigin(0,0);
  this.body=s.add.text(0,0,'',{
   fontFamily:'Georgia, serif',fontSize:18,color:'#273342',fontStyle:'italic',lineSpacing:7,
   wordWrap:{width:420}
  }).setOrigin(0,0);
  this.pageCounter=s.add.text(0,0,'',{
   fontFamily:'Georgia, serif',fontSize:11,color:'#788492',fontStyle:'bold'
  }).setOrigin(1,.5);

  this.primary=this.makeActionButton('F','Continuar');
  this.secondary=this.makeActionButton('T','Loja');
  this.closeBtn=this.makeActionButton('ESC','Fechar');
  this.primary.container.on('pointerdown',()=>this.onPrimary?.());
  this.secondary.container.on('pointerdown',()=>this.onSecondary?.());
  this.closeBtn.container.on('pointerdown',()=>this.onClose?.());

  this.root.add([
   this.backdrop,this.panel,this.headerRule,this.portrait,this.name,this.role,this.quote,this.body,this.pageCounter,
   this.primary.container,this.secondary.container,this.closeBtn.container
  ]);
  this.layout();
 }

 makeActionButton(key,label){
  const s=this.scene;
  const container=s.add.container(0,0);
  const bg=s.add.rectangle(0,0,132,36,0xf8f9fa,1).setStrokeStyle(1,0xaeb8c3,1);
  const keycap=s.add.rectangle(-43,0,key==='ESC'?42:28,24,0xeef1f4,1).setStrokeStyle(1,0x8c98a5,1);
  const keyText=s.add.text(-43,0,key,{
   fontFamily:'Arial',fontSize:key==='ESC'?10:11,color:'#17202b',fontStyle:'bold'
  }).setOrigin(.5);
  const text=s.add.text(key==='ESC'?-15:-22,0,label,{
   fontFamily:'Georgia, serif',fontSize:13,color:'#273342',fontStyle:'bold'
  }).setOrigin(0,.5);
  container.add([bg,keycap,keyText,text]);
  container.setSize(132,36).setInteractive({useHandCursor:true});
  container.on('pointerover',()=>bg.setFillStyle(0xffffff,1).setStrokeStyle(1,0xb7893d,1));
  container.on('pointerout',()=>bg.setFillStyle(0xf8f9fa,1).setStrokeStyle(1,0xaeb8c3,1));
  return{container,bg,keycap,keyText,text};
 }

 resizeButton(button,width){
  const keyWidth=button===this.closeBtn?42:28;
  const keyX=-width/2+20+(keyWidth-28)/2;
  button.bg.setSize(width,36);
  button.keycap.setPosition(keyX,0).setSize(keyWidth,24);
  button.keyText.setX(keyX);
  button.text.setX(keyX+keyWidth/2+9);
  button.container.setSize(width,36);
  if(button.container.input?.hitArea)button.container.input.hitArea.setTo(-width/2,-18,width,36);
 }

 layout(){
  const W=this.scene.scale.width,H=this.scene.scale.height;
  const margin=Phaser.Math.Clamp(Math.round(W*.018),12,22);
  const compact=W<700;
  const panelHeight=Phaser.Math.Clamp(Math.round(H*(compact ? .56 : .36)),compact ? 206 : 190,232);
  const panelX=margin,panelY=H-panelHeight-margin,panelW=W-margin*2;
  this.panelBounds={x:panelX,y:panelY,width:panelW,height:panelHeight};
  this.backdrop.setSize(W,H);

  this.panel.clear();
  this.panel.fillStyle(0x000000,.24).fillRoundedRect(panelX+4,panelY+6,panelW,panelHeight,14);
  this.panel.fillStyle(0xffffff,.965).fillRoundedRect(panelX,panelY,panelW,panelHeight,14);
  this.panel.lineStyle(1.5,0xc4ccd5,1).strokeRoundedRect(panelX,panelY,panelW,panelHeight,14);
  this.panel.lineStyle(1,0xffffff,.9).strokeRoundedRect(panelX+3,panelY+3,panelW-6,panelHeight-6,11);
  this.panel.fillStyle(0xb7893d,1).fillRoundedRect(panelX+18,panelY+18,4,panelHeight-36,2);

  const portraitHeight=Phaser.Math.Clamp(Math.min(H*.66,panelHeight*1.72),238,380);
  const portraitMaxWidth=Phaser.Math.Clamp(W*.34,190,330);
  const frameWidth=this.portrait.frame?.realWidth||this.portrait.frame?.width||208;
  const frameHeight=this.portrait.frame?.realHeight||this.portrait.frame?.height||224;
  const portraitScale=Math.min(portraitHeight/frameHeight,portraitMaxWidth/frameWidth);
  this.portrait.setScale(portraitScale);
  const portraitWidth=frameWidth*portraitScale;
  const portraitX=W-Math.max(112,Math.round(W*.14));
  this.portrait.setPosition(portraitX,H-margin+7);

  const contentX=panelX+38;
  const portraitLeft=portraitX-portraitWidth*.52;
  const contentRight=Math.max(contentX+250,Math.min(panelX+panelW-30,portraitLeft-18));
  const textWidth=Math.max(220,contentRight-contentX-26);
  this.name.setPosition(contentX,panelY+18).setFontSize(W<700?21:25);
  this.role.setPosition(contentX+2,panelY+50).setFontSize(W<700?11:13);

  this.headerRule.clear();
  this.headerRule.lineStyle(1,0xd8dde3,1).lineBetween(contentX,panelY+70,contentRight,panelY+70);
  this.headerRule.fillStyle(0xb7893d,1).fillCircle(contentX,panelY+70,2.5);
  this.quote.setPosition(contentX,panelY+76).setFontSize(W<700?29:35);
  this.body.setPosition(contentX+27,panelY+84).setFontSize(compact?14:18).setLineSpacing(compact?3:7).setWordWrapWidth(textWidth-27,true);

  const footerY=panelY+panelHeight-29;
  const buttonArea=Math.max(300,contentRight-contentX);
  const buttonWidth=Phaser.Math.Clamp(Math.floor((buttonArea-24)/3),104,142);
  for(const button of [this.primary,this.secondary,this.closeBtn])this.resizeButton(button,buttonWidth);
  this.primary.container.setPosition(contentX+buttonWidth/2,footerY);
  this.secondary.container.setPosition(contentX+buttonWidth*1.5+12,footerY);
  this.closeBtn.container.setPosition(contentRight-buttonWidth/2,footerY);
  this.pageCounter.setPosition(contentRight,panelY+88);
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

  // The map sprite is the canonical transparent cutout. Painted portrait
  // files remain available elsewhere, but are intentionally not used here.
  const spriteKey=config.spriteKey;
  const portraitKey=config.portraitKey;
  if(spriteKey&&this.scene.textures.exists(spriteKey))this.portrait.setTexture(spriteKey,config.spriteFrame??0);
  else if(portraitKey&&this.scene.textures.exists(portraitKey))this.portrait.setTexture(portraitKey,0);
  this.portrait.setFlipX(!!config.flipX).clearTint().setAlpha(1);

  this.secondary.container.setVisible(!!this.secondaryAction);
  if(this.secondaryAction)this.secondary.text.setText(this.secondaryAction.label||'Ação');
  this.refreshPage();
  this.layout();
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
