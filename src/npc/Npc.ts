// @ts-nocheck
import {IsoContainer} from '../isometric/IsoOcclusion';
/**
 * NPC base class.
 *
 * Round 47 removes the old player-tracking facing behaviour. Fixed NPCs now
 * keep a natural orientation and live through subtle breathing + profession-
 * specific idle actions. Interaction UI remains completely independent.
 */
export class Npc extends IsoContainer{
 constructor(scene,x,y,name,text,actions={}){
  // Projeção cartesiana de compatibilidade: mantém x/y visuais dos mapas
  // legados, mas conserva a fórmula depth=(isoX+isoY)*100. A cidade troca
  // imediatamente esta configuração pela malha 96×48 oficial.
  const legacyIsoSum=y/100000;
  super({
   scene,isoX:(x+legacyIsoSum)/2,isoY:(legacyIsoSum-x)/2,isoZ:0,
   tileWidth:2,tileHeight:200000,depthBase:5,depthOffset:.04
  });
  this.isoDriven=false;
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
  this.isoActionRepeat=0;
  this.isoActionPause=700;
  this.idleMinDelay=3000;
  this.idleMaxDelay=6200;
  this.isoActionProp=null;
  this.isoEffects=[];
  this.nextIdleAction=scene.time.now+Phaser.Math.Between(1600,3200);
  this.actionSignature='';

  this.createInteractionUi();
  this.createConversationIcon();
  this.setInteractionActions(actions.shop
   ? [{key:'F',label:'Conversar',type:'talk'},{key:'T',label:'Loja',type:'shop'}]
   : [{key:'F',label:'Conversar',type:'talk'}]);

  this.setDepth(25);
  scene.events.on('update', this.handleNpcUpdate, this);
  scene.events.once('shutdown', ()=>this.cleanupNpc());
  scene.events.once('destroy', ()=>this.cleanupNpc());
 }

 enableIsoPosition(config,x,y,z=0){
  this.isoDriven=true;
  this.configureIsoProjection(config);
  this.setIsoPosition(x,y,z);
  return this;
 }

 createInteractionUi(){
  const scene=this.scene;
  // Uma única placa branca discreta: nome, função e ação permanecem juntos
  // e a âncora fica exatamente sobre o centro da cabeça do NPC.
  this.interactionVisualHeight=110;
  this.interactionHasSecondary=false;
  this.interactionAnchorY=-150;
  this.interactionUi=scene.add.container(0,this.interactionAnchorY).setAlpha(0).setVisible(false);
  this.interactionPanel=scene.add.graphics();
  this.nameText=scene.add.text(0,-14,this.npcName,{
   fontFamily:'Georgia, serif',fontSize:11,color:'#18212d',fontStyle:'bold',align:'center'
  }).setOrigin(.5);
  this.roleText=scene.add.text(0,-1,this.npcRole||'',{
   fontFamily:'Georgia, serif',fontSize:8,color:'#647080',fontStyle:'italic',align:'center'
  }).setOrigin(.5);
  this.interactionUi.add([this.interactionPanel,this.nameText,this.roleText]);

  const primary=this.makeInteractionRow('F','Conversar',17);
  this.primaryAction=primary.container;
  this.primaryKey=primary.keyText;
  this.primaryText=primary.label;
  this.interactionUi.add(this.primaryAction);

  const secondary=this.makeInteractionRow('T','Loja',35);
  this.secondaryAction=secondary.container.setVisible(false);
  this.secondaryKey=secondary.keyText;
  this.secondaryText=secondary.label;
  this.interactionUi.add(this.secondaryAction);

  this.redrawInteractionPanel(false);
  this.setInteractionAnchor(this.interactionVisualHeight);
  this.add(this.interactionUi);
 }

 redrawInteractionPanel(hasSecondary){
  const height=hasSecondary?76:58;
  const top=-26;
  this.interactionPanel.clear();
  this.interactionPanel.fillStyle(0xffffff,.92).fillRoundedRect(-96,top,192,height,9);
  this.interactionPanel.lineStyle(1,0xc4ccd5,.96).strokeRoundedRect(-96,top,192,height,9);
  this.interactionPanel.lineStyle(1,0xffffff,.78).strokeRoundedRect(-94,top+2,188,height-4,7);
 }

 setInteractionAnchor(visualHeight=110){
  this.interactionVisualHeight=visualHeight;
  const lift=this.interactionHasSecondary?58:40;
  this.interactionAnchorY=-(visualHeight+lift);
  this.interactionUi?.setPosition(0,this.interactionAnchorY);
 }

 makeInteractionRow(key,label,y){
  const container=this.scene.add.container(0,y);
  const keycap=this.scene.add.graphics();
  keycap.fillStyle(0xf4f6f8,1).fillRoundedRect(-72,-10,22,20,5);
  keycap.lineStyle(1,0x8c98a5,1).strokeRoundedRect(-72,-10,22,20,5);
  const keyText=this.scene.add.text(-61,0,key,{fontFamily:'Arial',fontSize:11,color:'#17202b',fontStyle:'bold'}).setOrigin(.5);
  const text=this.scene.add.text(-42,0,label,{fontFamily:'Georgia, serif',fontSize:11,color:'#273342',fontStyle:'bold'}).setOrigin(0,.5);
  container.add([keycap,keyText,text]);
  return{container,keyText,label:text};
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
  this.primaryKey?.setText(a.key||'F');

  const b=normalized[1];
  this.interactionHasSecondary=!!b;
  this.secondaryAction?.setVisible(!!b);
  if(b){
   this.secondaryText?.setText(b.label||'Ação');
   this.secondaryKey?.setText(b.key||'T');
   this.primaryAction?.setY(16);
   this.secondaryAction?.setY(35);
  }else{
   this.primaryAction?.setY(17);
  }
  this.redrawInteractionPanel(!!b);
  this.setInteractionAnchor(this.interactionVisualHeight);
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
  this.interactionUi.setVisible(true).setAlpha(0).setPosition(0,this.interactionAnchorY+4);
  this.interactionTween=this.scene.tweens.add({targets:this.interactionUi,alpha:1,y:this.interactionAnchorY,duration:145,ease:'Sine.Out'});
 }

 hideInteractionUi(immediate=false){
  if(!this.interactionUi)return;
  this.interactionTween?.stop();
  if(immediate){this.interactionUi.setAlpha(0).setVisible(false).setPosition(0,this.interactionAnchorY+4);return}
  this.interactionTween=this.scene.tweens.add({
   targets:this.interactionUi,alpha:0,y:this.interactionAnchorY+4,duration:115,ease:'Sine.In',
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
  this.setInteractionAnchor(targetHeight);
  this.characterVisual.add(this.sprite);

  this.isIsometricStatic=true;
  this.isIsometricWalker=false;
  this.isoBaseTexture=textureKey;
  this.isoActionTexture=options.actionTexture&&this.scene.textures.exists(options.actionTexture)?options.actionTexture:null;
  this.isoActionAnimation=this.isoActionTexture?`npc-${this.isoActionTexture}-action`:null;
  this.isoActionRepeat=options.actionRepeat??0;
  this.isoActionPause=options.actionPause??700;
  this.idleMinDelay=options.idleMinDelay??3000;
  this.idleMaxDelay=Math.max(this.idleMinDelay,options.idleMaxDelay??6200);
  if(this.isoActionTexture&&!this.scene.anims.exists(this.isoActionAnimation)){
   this.scene.anims.create({
    key:this.isoActionAnimation,
    frames:this.scene.anims.generateFrameNumbers(this.isoActionTexture,{start:0,end:3}),
    frameRate:options.actionFrameRate??4.5,
    repeat:this.isoActionRepeat
   });
  }
  this.idleProfile=this.idleProfile||this.resolveIdleProfile();
  this.currentFacing=options.facing||this.idleFacing||this.defaultIdleFacing(this.idleProfile);
  try{this.idleBobTween?.stop()}catch(e){}
  this.idleBobTween=null;
  this.characterVisual.setPosition(0,0).setScale(1,1).setAngle(0);
  this.createIdleProp();
  this.nextIdleAction=this.scene.time.now+Phaser.Math.Between(
   options.initialIdleMin??Math.min(1300,this.idleMinDelay),
   options.initialIdleMax??Math.min(2800,this.idleMaxDelay)
  );
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
  this.setInteractionAnchor(targetHeight);
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
  this.nextIdleAction=time+Phaser.Math.Between(this.idleMinDelay,this.idleMaxDelay);
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
    this.finishIdleAction(this.isoActionPause);
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
  this.nextIdleAction=this.scene.time.now+Phaser.Math.Between(this.idleMinDelay+extraDelay,this.idleMaxDelay+extraDelay);
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
