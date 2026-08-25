// @ts-nocheck
/**
 * NPC base class.
 *
 * Round 47 removes the old player-tracking facing behaviour. Fixed NPCs now
 * keep a natural orientation and live through subtle breathing + profession-
 * specific idle actions. Interaction UI remains completely independent.
 */
export class Npc extends Phaser.GameObjects.Container{
 constructor(scene,x,y,name,text,actions={}){
  super(scene,x,y);
  this.npcName=name;
  this.npcRole=actions.role||'';
  this.npcPortrait=actions.portrait||'';
  this.text=text||['Olá, viajante.'];
  this.actions=actions;
  this.placeholderParts=[
    scene.add.circle(0,-14,10,0xffe6c7),
    scene.add.rectangle(0,8,20,28,0xffd166)
  ];
  this.add(this.placeholderParts);

  this.sprite=null;
  this.characterVisual=null;
  this.textureKey=null;
  this.currentFacing=actions.idleFacing||'down';
  this.idleFacing=actions.idleFacing||null;
  this.idleProfile=actions.idleProfile||'';
  this.visualScale=actions.visualScale??.46;
  this.nearby=false;
  this.idleBobTween=null;
  this.interactionTween=null;
  this.idleActionTween=null;
  this.idleActionActive=false;
  this.idleDecor=[];
  this.idleProp=null;
  this.nextIdleAction=scene.time.now+Phaser.Math.Between(1600,3200);
  this.actionSignature='';

  this.createInteractionUi();
  this.setInteractionActions(actions.shop
   ? [{key:'F',label:'Conversar',type:'talk'},{key:'T',label:'Loja',type:'shop'}]
   : [{key:'F',label:'Conversar',type:'talk'}]);

  scene.add.existing(this);
  this.setDepth(25);
  scene.events.on('update', this.handleNpcUpdate, this);
  scene.events.once('shutdown', ()=>this.cleanupNpc());
  scene.events.once('destroy', ()=>this.cleanupNpc());
 }

 createInteractionUi(){
  const scene=this.scene;
  this.interactionUi=scene.add.container(0,-101).setAlpha(0).setVisible(false);

  if(scene.textures.exists('npc_prompt_panel')){
   this.uiPanel=scene.add.image(0,0,'npc_prompt_panel').setDisplaySize(246,79);
  }else{
   this.uiPanel=scene.add.rectangle(0,0,246,79,0x121822,.96).setStrokeStyle(2,0xb68a49,.95);
  }
  this.interactionUi.add(this.uiPanel);

  this.nameText=scene.add.text(0,-25,this.npcName,{
   fontFamily:'Georgia, serif',fontSize:13,color:'#f0d392',fontStyle:'bold',
   stroke:'#0b0e14',strokeThickness:2,align:'center'
  }).setOrigin(.5);
  this.interactionUi.add(this.nameText);

  this.roleText=scene.add.text(0,-9,this.npcRole?`• ${this.npcRole} •`:'',{
   fontFamily:'Georgia, serif',fontSize:9,color:'#aeb8c7',fontStyle:'italic',
   stroke:'#0b0e14',strokeThickness:1,align:'center'
  }).setOrigin(.5);
  this.interactionUi.add(this.roleText);

  this.primaryAction=scene.add.container(-61,18);
  this.primaryKey=this.makeKeycap('F',-39,0);
  this.primaryIcon=this.makeActionIcon('talk',-17,0);
  this.primaryText=scene.add.text(-2,0,'Conversar',{
   fontFamily:'Georgia, serif',fontSize:10,color:'#e8eee9',fontStyle:'bold',
   stroke:'#0b0e14',strokeThickness:1
  }).setOrigin(0,.5);
  this.primaryAction.add([this.primaryKey,this.primaryIcon,this.primaryText]);
  this.interactionUi.add(this.primaryAction);

  this.secondaryAction=scene.add.container(61,18).setVisible(false);
  this.secondaryKey=this.makeKeycap('T',-38,0);
  this.secondaryIcon=this.makeActionIcon('shop',-16,0);
  this.secondaryText=scene.add.text(-1,0,'Loja',{
   fontFamily:'Georgia, serif',fontSize:10,color:'#f0d392',fontStyle:'bold',
   stroke:'#0b0e14',strokeThickness:1
  }).setOrigin(0,.5);
  this.secondaryAction.add([this.secondaryKey,this.secondaryIcon,this.secondaryText]);
  this.interactionUi.add(this.secondaryAction);

  this.add(this.interactionUi);
 }

 makeKeycap(key,x,y){
  const texture=key==='T'?'npc_key_t':'npc_key_f';
  if(this.scene.textures.exists(texture))return this.scene.add.image(x,y,texture).setDisplaySize(20,20);
  const c=this.scene.add.container(x,y);
  const bg=this.scene.add.rectangle(0,0,20,20,0x252d38,1).setStrokeStyle(1,0xd0a65c,1);
  const t=this.scene.add.text(0,0,key,{fontFamily:'Arial',fontSize:10,color:'#f3ead6',fontStyle:'bold'}).setOrigin(.5);
  c.add([bg,t]);return c;
 }

 makeActionIcon(type,x,y){
  const texture=type==='shop'?'npc_icon_shop':'npc_icon_talk';
  if(this.scene.textures.exists(texture))return this.scene.add.image(x,y,texture).setDisplaySize(18,18);
  return this.scene.add.circle(x,y,7,type==='shop'?0xc6924c:0x65a98f,1);
 }

 setRole(role){
  this.npcRole=role||'';
  this.roleText?.setText(this.npcRole?`• ${this.npcRole} •`:'');
  return this;
 }

 setInteractionActions(items=[]){
  const normalized=(items&&items.length?items:[{key:'F',label:'Conversar',type:'talk'}]).slice(0,2);
  const sig=normalized.map(a=>`${a.key}:${a.label}:${a.type||''}`).join('|');
  if(sig===this.actionSignature)return;
  this.actionSignature=sig;

  const a=normalized[0];
  this.primaryText?.setText(a.label||'Conversar');
  if(this.primaryKey){this.primaryKey.destroy();this.primaryKey=this.makeKeycap(a.key||'F',-39,0);this.primaryAction.addAt(this.primaryKey,0)}
  if(this.primaryIcon){this.primaryIcon.destroy();this.primaryIcon=this.makeActionIcon(a.type||'talk',-17,0);this.primaryAction.addAt(this.primaryIcon,1)}

  const b=normalized[1];
  this.secondaryAction?.setVisible(!!b);
  if(b){
   this.secondaryText?.setText(b.label||'Ação');
   if(this.secondaryKey){this.secondaryKey.destroy();this.secondaryKey=this.makeKeycap(b.key||'T',-38,0);this.secondaryAction.addAt(this.secondaryKey,0)}
   if(this.secondaryIcon){this.secondaryIcon.destroy();this.secondaryIcon=this.makeActionIcon(b.type||'shop',-16,0);this.secondaryAction.addAt(this.secondaryIcon,1)}
   this.primaryAction?.setX(-61);
  }else{
   this.primaryAction?.setX(-15);
  }
 }

 // Compatibilidade com cenas antigas que ainda chamam setPrompt().
 setPrompt(text){
  if(typeof text!=='string')return;
  if(text.includes('T'))this.setInteractionActions([{key:'F',label:'Conversar',type:'talk'},{key:'T',label:text.toLowerCase().includes('loja')?'Loja':'Ação',type:'shop'}]);
  else this.setInteractionActions([{key:'F',label:'Conversar',type:'talk'}]);
 }

 showInteractionUi(){
  if(!this.interactionUi)return;
  this.interactionTween?.stop();
  this.interactionUi.setVisible(true).setAlpha(0).setY(-95);
  this.interactionTween=this.scene.tweens.add({targets:this.interactionUi,alpha:1,y:-101,duration:145,ease:'Sine.Out'});
 }

 hideInteractionUi(immediate=false){
  if(!this.interactionUi)return;
  this.interactionTween?.stop();
  if(immediate){this.interactionUi.setAlpha(0).setVisible(false).setY(-95);return}
  this.interactionTween=this.scene.tweens.add({
   targets:this.interactionUi,alpha:0,y:-95,duration:115,ease:'Sine.In',
   onComplete:()=>this.interactionUi?.setVisible(false)
  });
 }

 // Round 47: proximidade só controla a interface. O NPC não gira mais para o jogador.
 setNearby(v){
  const next=!!v;
  const changed=this.nearby!==next;
  this.nearby=next;
  if(changed){
   if(next)this.showInteractionUi();
   else this.hideInteractionUi();
  }
 }

 setNpcVisible(v){
  this.setVisible(v);
  if(!v)this.hideInteractionUi(true);
  else if(this.nearby)this.showInteractionUi();
 }

 setRealSprite(textureKey:string){
  if(!this.scene.textures.exists(textureKey)) return false;
  this.textureKey=textureKey;
  if(this.placeholderParts){for(const part of this.placeholderParts){part.destroy()}this.placeholderParts=[]}
  if(this.characterVisual){this.characterVisual.destroy(true);this.characterVisual=null;this.sprite=null}
  else if(this.sprite){try{this.sprite.destroy()}catch(e){}this.sprite=null}

  this.characterVisual=this.scene.add.container(0,0);
  this.addAt(this.characterVisual,0);
  this.sprite=this.scene.add.sprite(0,8,textureKey,0);
  this.sprite.setOrigin(.5,1).setScale(this.visualScale);
  this.characterVisual.add(this.sprite);

  this.createMoveAnimations(textureKey);
  this.idleProfile=this.idleProfile||this.resolveIdleProfile();
  const facing=this.idleFacing||this.defaultIdleFacing(this.idleProfile);
  this.setFacing(facing);
  this.startIdleBreathing();
  this.createIdleProp();
  this.nextIdleAction=this.scene.time.now+Phaser.Math.Between(1200,2800);
  return true;
 }

 createMoveAnimations(textureKey:string){
  const rows={down:0,up:5,left:10,right:15};
  for(const [dir,start] of Object.entries(rows)){
   const key=`npc-${textureKey}-${dir}`;
   if(!this.scene.anims.exists(key)){
    this.scene.anims.create({key,frames:this.scene.anims.generateFrameNumbers(textureKey,{start,end:start+4}),frameRate:6,repeat:-1});
   }
  }
 }

 setFacing(dir){
  if(!this.sprite) return;
  const frameMap={down:0,up:5,left:10,right:15};
  const frame=frameMap[dir] ?? 0;
  this.currentFacing=dir;
  this.sprite.stop();
  this.sprite.setFrame(frame);
 }

 ensureIdleFacing(){
  if(!this.sprite)return;
  const target=this.idleFacing||this.currentFacing||'down';
  if(this.currentFacing!==target)this.setFacing(target);
 }

 // Mantido apenas por compatibilidade com código externo antigo. Não é mais usado
 // automaticamente ao aproximar ou conversar.
 facePlayer(){return this}

 normalizeRoleText(){
  return `${this.npcRole||''} ${this.npcName||''}`.normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase();
 }

 resolveIdleProfile(){
  const s=this.normalizeRoleText();
  if(s.includes('mercador'))return'merchant';
  if(s.includes('ferreiro'))return'blacksmith';
  if(s.includes('curandeira')||s.includes('curandeiro'))return'healer';
  if(s.includes('taverneiro'))return'tavernkeeper';
  if(s.includes('erudita')||s.includes('erudito'))return'scholar';
  if(s.includes('artesa')||s.includes('artesao'))return'artisan';
  if(s.includes('ancia')||s.includes('anciao'))return'elder';
  if(s.includes('guarda do portao leste'))return'east_guard';
  if(s.includes('guarda do sul'))return'south_guard';
  if(s.includes('morador'))return'resident';
  if(s.includes('viajante'))return'traveler';
  return'breath';
 }

 defaultIdleFacing(profile){
  // Todo NPC fixo inicia olhando para a câmera. NPCs ambulantes alteram a
  // direção somente enquanto percorrem suas rotas.
  return'down';
 }

 startIdleBreathing(){
  if(!this.characterVisual||this.idleBobTween)return;
  this.characterVisual.setScale(1,1).setY(0);
  // Movimento muito pequeno: leitura de respiração, não de "flutuação".
  this.idleBobTween=this.scene.tweens.add({
   targets:this.characterVisual,
   y:{from:0,to:-1.15},
   scaleX:{from:1,to:1.006},
   scaleY:{from:1,to:.988},
   duration:Phaser.Math.Between(1050,1350),
   yoyo:true,repeat:-1,ease:'Sine.easeInOut'
  });
 }

 addIdleDecor(go){
  if(!go)return go;
  this.idleDecor.push(go);
  this.characterVisual?.add(go);
  return go;
 }

 createIdleProp(){
  for(const go of this.idleDecor){try{go.destroy()}catch(e){}}
  // Round 57: movimentos usam somente quadros do próprio sprite. Os antigos
  // martelos, canecas, livros e brilhos desenhados por Graphics destoavam do
  // pixel art e foram removidos.
  this.idleDecor=[];this.idleProp=null;
 }

 canPlayIdleAction(){return !this.routeMoving}

 handleNpcUpdate(time){
  if(!this.active||!this.visible||!this.sprite)return;
  if(!this.canPlayIdleAction())return;
  if(this.idleActionActive||time<this.nextIdleAction)return;
  this.nextIdleAction=time+Phaser.Math.Between(3000,6200);
  this.playIdleAction();
 }

 playIdleAction(){
  if(!this.sprite||!this.characterVisual||this.idleActionActive)return;
  this.idleActionActive=true;
  const p=this.idleProfile||'breath';
  const profiles={
   merchant:{seq:[0,1,0,4,0],delay:190,x:1.2,angle:.35},
   blacksmith:{seq:[0,3,0,4,0],delay:165,x:-1.1,angle:-.55},
   healer:{seq:[0,1,0,2,0],delay:235,x:.7,angle:.28},
   tavernkeeper:{seq:[0,4,0,1,0],delay:205,x:1.15,angle:.5},
   scholar:{seq:[0,1,0,3,0],delay:260,x:-.55,angle:-.25},
   artisan:{seq:[0,2,0,1,0],delay:180,x:.9,angle:.4},
   elder:{seq:[0,1,0,4,0],delay:285,x:-.6,angle:-.2},
   east_guard:{seq:[0,1,0],delay:310,x:.45,angle:.18},
   south_guard:{seq:[0,1,0],delay:330,x:-.45,angle:-.18},
   resident:{seq:[0,1,0],delay:255,x:.75,angle:.25},
   traveler:{seq:[0,4,0],delay:230,x:-.8,angle:-.3},
   breath:{seq:[0,1,0],delay:300,x:.35,angle:.15}
  };
  const cfg=profiles[p]||profiles.breath;
  const base={down:0,up:5,left:10,right:15}[this.currentFacing]??0;
  const total=cfg.delay*cfg.seq.length;
  this.idleActionTween=this.scene.tweens.add({targets:this.characterVisual,x:cfg.x,angle:cfg.angle,duration:Math.max(240,total/2),yoyo:true,ease:'Sine.easeInOut'});
  let i=0;
  const advance=()=>{
   if(!this.sprite?.active){this.finishIdleAction();return}
   if(i>=cfg.seq.length){this.sprite.setFrame(base);this.characterVisual.setX(0).setAngle(0);this.idleFrameEvent=null;this.finishIdleAction(350);return}
   this.sprite.setFrame(base+cfg.seq[i++]);
   this.idleFrameEvent=this.scene.time.delayedCall(cfg.delay,advance);
  };
  advance();
 }

 finishIdleAction(extraDelay=0){
  this.idleActionActive=false;
  this.nextIdleAction=this.scene.time.now+Phaser.Math.Between(3000+extraDelay,6200+extraDelay);
 }

 playMerchantIdle(){
  const prop=this.idleProp;
  if(!prop)return this.finishIdleAction();
  prop.setVisible(true).setAlpha(0).setY(-16).setScale(.82).setAngle(-6);
  this.idleActionTween=this.scene.tweens.add({targets:prop,alpha:1,y:-21,scale:1,duration:180,ease:'Sine.Out',onComplete:()=>{
   this.idleActionTween=this.scene.tweens.add({targets:prop,angle:{from:-6,to:8},yoyo:true,repeat:2,duration:170,ease:'Sine.easeInOut',onComplete:()=>{
    this.idleActionTween=this.scene.tweens.add({targets:prop,alpha:0,y:-17,duration:170,onComplete:()=>{prop.setVisible(false);this.finishIdleAction(300)}});
   }});
  }});
 }

 playBlacksmithIdle(){
  const prop=this.idleProp;
  if(!prop)return this.finishIdleAction();
  prop.setVisible(true).setAlpha(.98).setAngle(-34).setY(-28);
  const strike=()=>{
   this.idleActionTween=this.scene.tweens.add({targets:prop,angle:24,y:-14,duration:210,ease:'Quad.In',onComplete:()=>{
    this.spawnForgeSparks();
    this.scene.tweens.add({targets:prop,angle:-34,y:-28,duration:260,ease:'Quad.Out',onComplete:()=>{
     this.idleActionTween=this.scene.tweens.add({targets:prop,alpha:0,duration:160,onComplete:()=>{prop.setVisible(false);this.finishIdleAction(650)}});
    }});
   }});
  };
  strike();
 }

 spawnForgeSparks(){
  if(!this.characterVisual)return;
  for(let i=0;i<4;i++){
   const sp=this.scene.add.circle(-10+Phaser.Math.Between(-3,3),-2,1.1+(i%2)*.5,0xf3a442,.92);
   this.characterVisual.add(sp);this.idleDecor.push(sp);
   this.scene.tweens.add({targets:sp,x:sp.x+Phaser.Math.Between(-8,10),y:sp.y-Phaser.Math.Between(5,13),alpha:0,duration:320+70*i,ease:'Quad.Out',onComplete:()=>sp.destroy()});
  }
 }

 playHealerIdle(){
  const prop=this.idleProp;
  if(!prop)return this.finishIdleAction();
  prop.setVisible(true).setAlpha(0).setScale(.7).setY(-24);
  this.idleActionTween=this.scene.tweens.add({targets:prop,alpha:1,scale:1,y:-31,duration:320,ease:'Sine.Out',onComplete:()=>{
   this.scene.tweens.add({targets:prop,angle:{from:-8,to:8},scale:{from:.96,to:1.08},duration:520,yoyo:true,repeat:1,ease:'Sine.easeInOut',onComplete:()=>{
    this.scene.tweens.add({targets:prop,alpha:0,y:-25,duration:260,onComplete:()=>{prop.setVisible(false);this.finishIdleAction(400)}});
   }});
  }});
 }

 playTavernIdle(){
  const prop=this.idleProp;
  if(!prop)return this.finishIdleAction();
  prop.setVisible(true).setAlpha(0).setAngle(-8);
  this.idleActionTween=this.scene.tweens.add({targets:prop,alpha:1,duration:180,onComplete:()=>{
   this.scene.tweens.add({targets:prop,angle:{from:-8,to:10},x:{from:10,to:13},duration:260,yoyo:true,repeat:2,ease:'Sine.easeInOut',onComplete:()=>{
    this.scene.tweens.add({targets:prop,alpha:0,duration:180,onComplete:()=>{prop.setVisible(false);this.finishIdleAction(500)}});
   }});
  }});
 }

 playScholarIdle(){
  const book=this.idleProp;
  if(!book)return this.finishIdleAction();
  book.setVisible(true).setAlpha(.96);
  const page=this.scene.add.rectangle(4,-1,8,7,0xf3e8c9,.94).setOrigin(0,.5).setScale(1,1).setAngle(7);
  book.add(page);this.idleDecor.push(page);
  this.idleActionTween=this.scene.tweens.add({targets:book,y:{from:-23,to:-25},angle:{from:-1,to:1},duration:420,yoyo:true,repeat:1,ease:'Sine.easeInOut',onComplete:()=>{
   this.scene.tweens.add({targets:page,scaleX:{from:1,to:.08},x:{from:4,to:-1},duration:260,yoyo:true,ease:'Sine.easeInOut',onComplete:()=>{
    page.destroy();this.finishIdleAction(850);
   }});
  }});
 }

 playArtisanIdle(){
  const prop=this.idleProp;
  if(!prop)return this.finishIdleAction();
  this.idleActionTween=this.scene.tweens.add({targets:prop,angle:{from:-3,to:5},x:{from:7,to:10},duration:260,yoyo:true,repeat:3,ease:'Sine.easeInOut',onComplete:()=>this.finishIdleAction(650)});
 }

 playElderIdle(){
  const prop=this.idleProp;
  if(!prop)return this.finishIdleAction();
  prop.setVisible(true).setAlpha(0).setScale(.7);
  this.idleActionTween=this.scene.tweens.add({targets:prop,alpha:.82,scale:1.15,duration:520,ease:'Sine.Out',onComplete:()=>{
   this.scene.tweens.add({targets:prop,alpha:{from:.45,to:.9},scale:{from:.95,to:1.12},duration:650,yoyo:true,repeat:1,ease:'Sine.easeInOut',onComplete:()=>{
    this.scene.tweens.add({targets:prop,alpha:0,scale:.8,duration:360,onComplete:()=>{prop.setVisible(false);this.finishIdleAction(1100)}});
   }});
  }});
 }

 playGuardIdle(profile){
  const dir=profile==='east_guard'?1:-1;
  this.idleActionTween=this.scene.tweens.add({targets:this.characterVisual,x:{from:0,to:1.6*dir},angle:{from:0,to:.8*dir},duration:360,yoyo:true,repeat:1,ease:'Sine.easeInOut',onComplete:()=>{
   if(this.idleProp){
    this.idleProp.setVisible(true).setAlpha(0).setScale(.5);
    this.scene.tweens.add({targets:this.idleProp,alpha:{from:0,to:.9},scale:{from:.5,to:1.35},duration:180,yoyo:true,onComplete:()=>this.idleProp?.setVisible(false)});
   }
   this.finishIdleAction(700);
  }});
 }

 playResidentIdle(){
  this.idleActionTween=this.scene.tweens.add({targets:this.characterVisual,x:{from:0,to:1.2},angle:{from:0,to:.6},duration:420,yoyo:true,repeat:1,ease:'Sine.easeInOut',onComplete:()=>this.finishIdleAction(450)});
 }

 playTravelerIdle(){
  this.idleActionTween=this.scene.tweens.add({targets:this.characterVisual,x:{from:0,to:-1.4},angle:{from:0,to:-1.1},duration:330,yoyo:true,repeat:2,ease:'Sine.easeInOut',onComplete:()=>this.finishIdleAction(650)});
 }

 playBreathOnlyIdle(){
  this.idleActionTween=this.scene.tweens.add({targets:this.characterVisual,angle:{from:-.35,to:.35},duration:420,yoyo:true,repeat:1,ease:'Sine.easeInOut',onComplete:()=>this.finishIdleAction()});
 }

 cleanupNpc(){
  try{this.scene?.events?.off('update',this.handleNpcUpdate,this)}catch(e){}
  try{this.idleBobTween?.stop()}catch(e){}
  try{this.idleActionTween?.stop()}catch(e){}
  try{this.idleFrameEvent?.remove(false)}catch(e){}
  try{this.interactionTween?.stop()}catch(e){}
  this.idleBobTween=null;this.idleActionTween=null;this.idleFrameEvent=null;this.interactionTween=null;
  for(const go of this.idleDecor){try{go?.destroy?.()}catch(e){}}
  this.idleDecor=[];
 }
}
