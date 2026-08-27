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
  this.isIsometricStatic=false;
  this.isIsometricWalker=false;
  this.isoBaseTexture=null;
  this.isoActionTexture=null;
  this.isoActionAnimation=null;
  this.isoWalkAnimation=null;
  this.isoDisplayScale=1;
  this.isoActionProp=null;
  this.isoEffects=[];
  this.nextIdleAction=scene.time.now+Phaser.Math.Between(1600,3200);
  this.actionSignature='';

  this.createInteractionUi();
  this.createConversationIcon();
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
  // Cartões compactos à direita do personagem: a leitura lembra um comando
  // de RPG, sem cobrir o rosto do NPC ou fundir duas ações em uma só placa.
  this.interactionUi=scene.add.container(120,-48).setAlpha(0).setVisible(false);

  this.nameBadge=scene.add.container(0,-47);
  this.namePanel=this.makePromptPanel(204,30,7,0x0b1322,0xb99155);
  this.nameText=scene.add.text(0,-5,this.npcName,{
   fontFamily:'Georgia, serif',fontSize:12,color:'#f4dcaa',fontStyle:'bold',
   stroke:'#070b12',strokeThickness:2,align:'center'
  }).setOrigin(.5);
  this.roleText=scene.add.text(0,8,this.npcRole||'',{
   fontFamily:'Georgia, serif',fontSize:8,color:'#b9c3d1',fontStyle:'italic',
   stroke:'#070b12',strokeThickness:1,align:'center'
  }).setOrigin(.5);
  this.nameBadge.add([this.namePanel,this.nameText,this.roleText]);
  this.interactionUi.add(this.nameBadge);

  const primary=this.makeInteractionRow('F','Conversar',-10);
  this.primaryAction=primary.container;
  this.primaryKey=primary.keycap;
  this.primaryText=primary.label;
  this.interactionUi.add(this.primaryAction);

  const secondary=this.makeInteractionRow('T','Loja',26);
  this.secondaryAction=secondary.container.setVisible(false);
  this.secondaryKey=secondary.keycap;
  this.secondaryText=secondary.label;
  this.interactionUi.add(this.secondaryAction);

  this.add(this.interactionUi);
 }

 makePromptPanel(width,height,radius=7,fill=0x0b1322,stroke=0x7f8998){
  const g=this.scene.add.graphics();
  g.fillStyle(0x02050b,.34).fillRoundedRect(-width/2+2,-height/2+3,width,height,radius);
  g.fillStyle(fill,.97).fillRoundedRect(-width/2,-height/2,width,height,radius);
  g.lineStyle(1.4,stroke,.92).strokeRoundedRect(-width/2,-height/2,width,height,radius);
  g.lineStyle(1,0x263247,.9).strokeRoundedRect(-width/2+3,-height/2+3,width-6,height-6,Math.max(3,radius-2));
  return g;
 }

 makeInteractionRow(key,label,y){
  const container=this.scene.add.container(0,y);
  const panel=this.makePromptPanel(204,32,7,0x080f1d,0x657186);
  const keycap=this.makeKeycap(key,-82,0);
  const bullet=this.scene.add.circle(-57,0,2.2,0xd7b56d,1);
  const text=this.scene.add.text(-48,0,label,{
   fontFamily:'Georgia, serif',fontSize:12,color:'#f2f4f7',fontStyle:'bold',
   stroke:'#06090f',strokeThickness:1
  }).setOrigin(0,.5);
  container.add([panel,keycap,bullet,text]);
  return{container,keycap,label:text};
 }

 makeKeycap(key,x,y){
  const c=this.scene.add.container(x,y);
  const bg=this.scene.add.graphics();
  bg.fillStyle(0x02040a,.55).fillRoundedRect(-11.5,-10.5,25,25,5);
  bg.fillStyle(0xf7f7f2,1).fillRoundedRect(-12.5,-12.5,25,25,5);
  bg.lineStyle(1.5,0xc7ced7,1).strokeRoundedRect(-12.5,-12.5,25,25,5);
  const t=this.scene.add.text(0,0,key,{fontFamily:'Arial',fontSize:13,color:'#111927',fontStyle:'bold'}).setOrigin(.5);
  c.add([bg,t]);return c;
 }

 createConversationIcon(){
  const scene=this.scene;
  this.conversationIcon=scene.add.container(0,-123).setVisible(false).setAlpha(0).setScale(.82);
  const bubble=scene.add.graphics();
  bubble.fillStyle(0x03060b,.34).fillRoundedRect(-24,-16,48,32,8);
  bubble.fillTriangle(-6,16,5,16,-2,24);
  bubble.fillStyle(0xf7f7f2,1).fillRoundedRect(-25,-18,48,32,8);
  bubble.fillTriangle(-7,13,5,13,-2,22);
  bubble.lineStyle(2,0x172131,1).strokeRoundedRect(-25,-18,48,32,8);
  const dots=[-10,0,10].map(x=>scene.add.circle(x,-2,3.1,0x111927,1));
  this.conversationIcon.add([bubble,...dots]);
  this.add(this.conversationIcon);
 }

 showConversationIcon(){
  if(!this.conversationIcon)return;
  this.conversationIconTween?.stop();
  this.conversationIconFloat?.stop();
  this.conversationIcon.setVisible(true).setAlpha(0).setScale(.82).setY(-119);
  this.conversationIconTween=this.scene.tweens.add({
   targets:this.conversationIcon,alpha:1,scale:1,y:-123,duration:150,ease:'Back.Out',
   onComplete:()=>{
    if(!this.conversationIcon?.visible)return;
    this.conversationIconFloat=this.scene.tweens.add({targets:this.conversationIcon,y:{from:-123,to:-126},duration:850,yoyo:true,repeat:-1,ease:'Sine.easeInOut'});
   }
  });
 }

 hideConversationIcon(immediate=false){
  if(!this.conversationIcon)return;
  this.conversationIconTween?.stop();
  this.conversationIconFloat?.stop();
  this.conversationIconFloat=null;
  if(immediate){this.conversationIcon.setVisible(false).setAlpha(0).setY(-119);return}
  this.conversationIconTween=this.scene.tweens.add({
   targets:this.conversationIcon,alpha:0,scale:.86,y:-119,duration:110,ease:'Sine.In',
   onComplete:()=>this.conversationIcon?.setVisible(false)
  });
 }

 setRole(role){
  this.npcRole=role||'';
  this.roleText?.setText(this.npcRole);
  return this;
 }

 setInteractionActions(items=[]){
  const normalized=(items&&items.length?items:[{key:'F',label:'Conversar',type:'talk'}]).slice(0,2);
  const sig=normalized.map(a=>`${a.key}:${a.label}:${a.type||''}`).join('|');
  if(sig===this.actionSignature)return;
  this.actionSignature=sig;

  const a=normalized[0];
  this.primaryText?.setText(a.label||'Conversar');
  if(this.primaryKey){this.primaryKey.destroy();this.primaryKey=this.makeKeycap(a.key||'F',-82,0);this.primaryAction.addAt(this.primaryKey,1)}

  const b=normalized[1];
  this.secondaryAction?.setVisible(!!b);
  if(b){
   this.secondaryText?.setText(b.label||'Ação');
   if(this.secondaryKey){this.secondaryKey.destroy();this.secondaryKey=this.makeKeycap(b.key||'T',-82,0);this.secondaryAction.addAt(this.secondaryKey,1)}
   this.nameBadge?.setY(-47);
   this.primaryAction?.setY(-10);
   this.secondaryAction?.setY(26);
  }else{
   this.nameBadge?.setY(-30);
   this.primaryAction?.setY(7);
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
  this.interactionUi.setVisible(true).setAlpha(0).setX(114);
  this.interactionTween=this.scene.tweens.add({targets:this.interactionUi,alpha:1,x:120,duration:145,ease:'Sine.Out'});
 }

 hideInteractionUi(immediate=false){
  if(!this.interactionUi)return;
  this.interactionTween?.stop();
  if(immediate){this.interactionUi.setAlpha(0).setVisible(false).setX(114);return}
  this.interactionTween=this.scene.tweens.add({
   targets:this.interactionUi,alpha:0,x:114,duration:115,ease:'Sine.In',
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
  if(!v){this.hideInteractionUi(true);this.hideConversationIcon(true)}
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
  this.isIsometricStatic=false;
  this.isIsometricWalker=false;
  this.isoBaseTexture=null;
  this.isoActionTexture=null;

  this.createMoveAnimations(textureKey);
  this.idleProfile=this.idleProfile||this.resolveIdleProfile();
  const facing=this.idleFacing||this.defaultIdleFacing(this.idleProfile);
  this.setFacing(facing);
  this.startIdleBreathing();
  this.createIdleProp();
  this.nextIdleAction=this.scene.time.now+Phaser.Math.Between(1200,2800);
  return true;
 }

 setIsometricSprite(textureKey:string,options={}){
  if(!this.scene.textures.exists(textureKey))return false;
  this.textureKey=textureKey;
  if(this.placeholderParts){for(const part of this.placeholderParts){part.destroy()}this.placeholderParts=[]}
  if(this.characterVisual){this.characterVisual.destroy(true);this.characterVisual=null;this.sprite=null}
  else if(this.sprite){try{this.sprite.destroy()}catch(e){}this.sprite=null}

  this.characterVisual=this.scene.add.container(0,0);
  this.addAt(this.characterVisual,0);
  this.sprite=this.scene.add.sprite(0,8,textureKey,0).setOrigin(.5,1);
  const source=this.scene.textures.get(textureKey).getSourceImage();
  const targetHeight=options.height??108;
  this.isoDisplayScale=targetHeight/source.height;
  this.sprite.setScale(this.isoDisplayScale).setFlipX(!!options.flipX);
  this.characterVisual.add(this.sprite);

  this.isIsometricStatic=true;
  this.isIsometricWalker=false;
  this.isoBaseTexture=textureKey;
  this.isoActionTexture=options.actionTexture&&this.scene.textures.exists(options.actionTexture)?options.actionTexture:null;
  this.isoActionAnimation=this.isoActionTexture?`npc-${this.isoActionTexture}-action`:null;
  if(this.isoActionTexture&&!this.scene.anims.exists(this.isoActionAnimation)){
   this.scene.anims.create({
    key:this.isoActionAnimation,
    frames:this.scene.anims.generateFrameNumbers(this.isoActionTexture,{start:0,end:3}),
    frameRate:4.5,
    repeat:0
   });
  }
  this.idleProfile=this.idleProfile||this.resolveIdleProfile();
  this.currentFacing=options.facing||this.idleFacing||this.defaultIdleFacing(this.idleProfile);
  try{this.idleBobTween?.stop()}catch(e){}
  this.idleBobTween=null;
  this.characterVisual.setPosition(0,0).setScale(1,1).setAngle(0);
  this.createIdleProp();
  this.nextIdleAction=this.scene.time.now+Phaser.Math.Between(1300,2800);
  return true;
 }

 setIsometricWalkSprite(textureKey:string,options={}){
  if(!this.scene.textures.exists(textureKey))return false;
  this.textureKey=textureKey;
  if(this.placeholderParts){for(const part of this.placeholderParts){part.destroy()}this.placeholderParts=[]}
  if(this.characterVisual){this.characterVisual.destroy(true);this.characterVisual=null;this.sprite=null}
  else if(this.sprite){try{this.sprite.destroy()}catch(e){}this.sprite=null}

  this.characterVisual=this.scene.add.container(0,0);
  this.addAt(this.characterVisual,0);
  this.sprite=this.scene.add.sprite(0,8,textureKey,0).setOrigin(.5,1);
  const frame=this.scene.textures.get(textureKey).get(0);
  const targetHeight=options.height??110;
  this.isoDisplayScale=targetHeight/(frame?.height||224);
  this.sprite.setScale(this.isoDisplayScale);
  this.characterVisual.add(this.sprite);

  this.isIsometricStatic=false;
  this.isIsometricWalker=true;
  this.isoBaseTexture=textureKey;
  this.isoActionTexture=null;
  this.isoDirectionRows={
   south:0,southWest:1,west:2,northWest:3,
   north:4,northEast:5,east:6,southEast:7
  };
  this.isoWalkAnimations={};
  for(const [direction,row] of Object.entries(this.isoDirectionRows)){
   const key=`npc-${textureKey}-walk-${direction}`;
   this.isoWalkAnimations[direction]=key;
   if(!this.scene.anims.exists(key)){
    const start=Number(row)*4;
    this.scene.anims.create({
     key,
     frames:this.scene.anims.generateFrameNumbers(textureKey,{start,end:start+3}),
     frameRate:7,
     repeat:-1
    });
   }
  }
  try{this.idleBobTween?.stop()}catch(e){}
  this.idleBobTween=null;
  this.characterVisual.setPosition(0,0).setScale(1,1).setAngle(0);
  this.currentFacing=options.facing||'south';
  this.sprite.setFlipX(false).setFrame((this.isoDirectionRows[this.currentFacing]??0)*4);
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
  if(this.isIsometricWalker){
   this.currentFacing=dir;
   const row=this.isoDirectionRows?.[dir]??0;
   this.sprite.stop().setFlipX(false).setFrame(row*4);
   return;
  }
  if(this.isIsometricStatic){this.currentFacing=dir;return}
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
  if(s.includes('general'))return'general';
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
  // Os personagens isométricos já carregam seus objetos profissionais na
  // própria arte. Efeitos temporários são criados somente durante cada ação.
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
  if(this.isIsometricStatic){this.playIsometricIdleAction(p);return}
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

 playIsometricIdleAction(profile){
  if(this.isoActionTexture&&this.isoActionAnimation&&this.scene.textures.exists(this.isoActionTexture)){
   this.sprite.setPosition(0,8).setAngle(0).setTexture(this.isoActionTexture,0);
   this.isoActionComplete=()=>{
    if(!this.sprite?.active)return;
    this.sprite.setTexture(this.isoBaseTexture,0).setPosition(0,8).setAngle(0);
    this.isoActionComplete=null;
    this.finishIdleAction(700);
   };
   this.sprite.once('animationcomplete',this.isoActionComplete);
   this.sprite.play(this.isoActionAnimation,true);
   return;
  }
  // NPCs isométricos sem uma folha de ação própria permanecem estáveis.
  // O corpo inteiro nunca é transladado para simular um gesto.
  this.finishIdleAction(2200);
 }

 playIsometricBlacksmithIdle(){
  if(!this.scene.textures.exists('blacksmith_iso_empty')||!this.scene.textures.exists('blacksmith_hammer')){
   this.resetIsometricPose();this.finishIdleAction();return;
  }
  this.sprite.setTexture('blacksmith_iso_empty').setPosition(0,8).setAngle(-.8);
  const hammer=this.scene.add.image(-31,-41,'blacksmith_hammer').setOrigin(.5).setScale(this.isoDisplayScale).setAngle(-12);
  this.characterVisual.add(hammer);
  this.isoActionProp=hammer;
  this.idleActionTween=this.scene.tweens.add({
   targets:hammer,x:-7,y:-116,angle:350,duration:450,ease:'Quad.Out',
   onComplete:()=>{
    this.idleActionTween=this.scene.tweens.add({
     targets:hammer,x:-31,y:-41,angle:710,duration:430,ease:'Quad.In',
     onComplete:()=>{
      this.spawnIsoSparkles(0xf3a442,-31,-42,5);
      hammer.destroy();this.isoActionProp=null;
      this.sprite.setTexture(this.isoBaseTexture);
      this.resetIsometricPose();this.finishIdleAction(900);
     }
    });
   }
  });
 }

 spawnIsoSparkles(color,x,y,count=3){
  if(!this.characterVisual)return;
  for(let i=0;i<count;i++){
   const spark=this.scene.add.star(x+Phaser.Math.Between(-5,5),y+Phaser.Math.Between(-4,5),4,1.1,2.5,color,.9).setScale(.55);
   this.characterVisual.add(spark);this.isoEffects.push(spark);
   this.scene.tweens.add({
    targets:spark,x:spark.x+Phaser.Math.Between(-8,8),y:spark.y-Phaser.Math.Between(8,18),alpha:0,scale:1.15,
    duration:430+i*65,ease:'Quad.Out',onComplete:()=>{this.isoEffects=this.isoEffects.filter(item=>item!==spark);spark.destroy()}
   });
  }
 }

 resetIsometricPose(){
  if(!this.isIsometricStatic||!this.sprite)return;
  this.sprite.setPosition(0,8).setAngle(0);
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
  try{this.conversationIconTween?.stop()}catch(e){}
  try{this.conversationIconFloat?.stop()}catch(e){}
  try{if(this.isoActionComplete)this.sprite?.off('animationcomplete',this.isoActionComplete)}catch(e){}
  this.idleBobTween=null;this.idleActionTween=null;this.idleFrameEvent=null;this.interactionTween=null;
  this.conversationIconTween=null;this.conversationIconFloat=null;
  for(const go of this.idleDecor){try{go?.destroy?.()}catch(e){}}
  try{this.isoActionProp?.destroy?.()}catch(e){}
  for(const go of this.isoEffects){try{go?.destroy?.()}catch(e){}}
  this.isoActionProp=null;this.isoEffects=[];
  this.isoActionComplete=null;
  this.idleDecor=[];
 }
}
