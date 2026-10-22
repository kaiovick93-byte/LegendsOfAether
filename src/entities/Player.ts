// @ts-nocheck
import {
  appearanceFor,defaultAppearanceForClass,facingFromVector,idleFrameForFacing,
  playerOutlineTextureKey,playerTextureKey
} from '../character/PlayerAppearance';
import {IsoPhysicsSprite} from '../isometric/IsoOcclusion';

/**
 * Perfil único do corpo do jogador.
 *
 * A âncora lógica é o ponto dos pés. A textura, a aparência, o sexo, a arma,
 * a armadura e o quadro de animação nunca participam destas dimensões.
 */
export const PLAYER_LOGICAL_BODY=Object.freeze({
  width:32,
  height:16,
  radiusX:14,
  radiusY:7,
  centerYOffset:-8
});

const LOGICAL_BODY_SAMPLES=Object.freeze((()=>{
  const samples=[];
  const {radiusX,radiusY,centerYOffset}=PLAYER_LOGICAL_BODY;
  for(let y=-14;y<=-2;y+=3){
    for(let x=-14;x<=14;x+=4){
      const nx=x/radiusX;
      const ny=(y-centerYOffset)/radiusY;
      if(nx*nx+ny*ny<=1.02)samples.push(Object.freeze({x,y}));
    }
  }
  for(const sample of [{x:0,y:-15},{x:0,y:-8},{x:0,y:-1},{x:-14,y:-8},{x:14,y:-8}]){
    if(!samples.some(point=>point.x===sample.x&&point.y===sample.y))samples.push(Object.freeze(sample));
  }
  return samples;
})());

/** Normaliza teclado/controle uma única vez; diagonais mantêm a mesma rapidez. */
export function normalizePlayerInput(dx,dy){
  const length=Math.hypot(dx,dy);
  if(!length)return{x:0,y:0,length:0,moving:false};
  return{x:dx/length,y:dy/length,length,moving:true};
}

/** Vetor cartesiano desejado na tela: W é norte e A+W é noroeste. */
export function playerScreenVelocity(dx,dy,speed){
  const input=normalizePlayerInput(dx,dy);
  return{
    inputX:input.x,inputY:input.y,moving:input.moving,
    x:input.x*speed,y:input.y*speed
  };
}

/** Inversa exata da projeção isométrica 2:1 usada por IsoSprite. */
export function screenVelocityToIsoDelta(screenX,screenY,deltaSeconds,tileWidth,tileHeight){
  return{
    u:(screenX/tileWidth+screenY/tileHeight)*deltaSeconds,
    v:(-screenX/tileWidth+screenY/tileHeight)*deltaSeconds
  };
}

/** Sprite estritamente visual ligado ao corpo lógico do Player. */
export class PlayerVisual extends Phaser.GameObjects.Sprite{
  constructor(scene,body,texture,frame){
    super(scene,body.x,body.y,texture,frame);
    this.bodyOwner=body;
    this.setOrigin(.5,1);
    scene.add.existing(this);
  }

  syncFromBody(){
    if(!this.active||!this.bodyOwner?.active)return this;
    this.setPosition(this.bodyOwner.x,this.bodyOwner.y);
    this.setDepth(this.bodyOwner.depth+.001);
    return this;
  }
}

/**
 * Player é a entidade lógica autoritativa. Seu IsoPhysicsSprite invisível
 * guarda posição, corpo Arcade, interação e depth; PlayerVisual apenas pinta
 * a aparência/animação correspondente sobre a mesma âncora dos pés.
 */
export class Player extends IsoPhysicsSprite{
  constructor(scene,x,y){
    const appearanceId=scene.registry.get('selectedAppearance')||'warrior_m';
    const appearanceTexture=scene.textures.exists(playerTextureKey(appearanceId,'base'))
      ?playerTextureKey(appearanceId,'base'):'player-fallback';
    const logicalTexture=scene.textures.exists('player-logical-body')?'player-logical-body':'player-fallback';
    // A projeção cartesiana 2×2 preserva os mapas legados. A Cidade de
    // Aether troca apenas a projeção, mantendo este mesmo corpo lógico.
    super({scene,isoX:(x+y)/2,isoY:(y-x)/2,isoZ:0,texture:logicalTexture,frame:0,tileWidth:2,tileHeight:2});
    this.isoDriven=false;
    this.logicalBodyProfile=PLAYER_LOGICAL_BODY;
    this.configureLogicalBody();
    super.setVisible(false).setAlpha(0).setDepth(20);
    this.visual=new PlayerVisual(scene,this,appearanceTexture,appearanceTexture==='player-fallback'?0:1)
      .setScale(.7);
    this.visualVisible=true;
    this.setCollideWorldBounds(true);

    this.hp=120;this.maxHp=120;this.mana=60;this.maxMana=60;this.level=1;this.xp=0;this.gold=25;
    this.attackDamage=14;this.defense=0;this.speed=170;
    this.characterClass=appearanceFor(appearanceId).classId;
    this.appearanceId=appearanceFor(appearanceId).id;
    this.visualState='base';this.facing='down';this.dead=false;
    this.skillPoints=0;this.attributePoints=0;this.nextAttack=0;
    this.equipment={attack:0,defense:0,hp:0,mana:0,speed:0};
    this.skills={attack:0,hp:0,mana:0,speed:0};
    this.attributeBonuses={hp:0,mana:0,attack:0,defense:0};

    this.syncVisualTransform();
    scene.events.on(Phaser.Scenes.Events.POST_UPDATE,this.syncVisualTransform,this);
    scene.events.once(Phaser.Scenes.Events.SHUTDOWN,()=>this.detachVisual());
  }

  configureLogicalBody(){
    const {width,height}=PLAYER_LOGICAL_BODY;
    const offsetX=(this.width-width)/2;
    const offsetY=this.height-height;
    this.body?.setSize(width,height,false).setOffset(offsetX,offsetY);
    return this;
  }

  getLogicalCollisionSamples(){return LOGICAL_BODY_SAMPLES}
  getLogicalFootprintAt(x=this.x,y=this.y){
    const profile=PLAYER_LOGICAL_BODY;
    return{x,y:y+profile.centerYOffset,radiusX:profile.radiusX,radiusY:profile.radiusY};
  }
  getVisualSprite(){return this.visual}
  getVisualFrame(){return this.visual?.frame}
  getVisualFrameNumber(){
    const value=Number(this.visual?.frame?.name);
    return Number.isFinite(value)?value:this.getIdleFrame();
  }
  getVisualMetrics(){
    return{
      width:this.visual?.displayWidth??0,height:this.visual?.displayHeight??0,
      scaleX:this.visual?.scaleX??1,scaleY:this.visual?.scaleY??1,
      flipX:!!this.visual?.flipX,flipY:!!this.visual?.flipY
    };
  }
  setVisualScale(x,y=x){this.visual?.setScale(x,y);return this}
  setVisualVisible(value){this.visualVisible=!!value;this.visual?.setVisible(!!value);return this}
  setVisualAlpha(value){this.visual?.setAlpha(value);return this}
  setVisualDepth(value){this.visual?.setDepth(value);return this}
  setVisualTint(value){this.visual?.setTint(value);return this}
  clearVisualTint(){this.visual?.clearTint();return this}

  syncVisualTransform(){
    if(!this.visual?.active)return this;
    this.visual.syncFromBody();
    return this;
  }

  detachVisual(){
    this.scene?.events?.off(Phaser.Scenes.Events.POST_UPDATE,this.syncVisualTransform,this);
    if(this.visual?.active)this.visual.destroy();
    this.visual=null;
  }

  updateIsoPosition(){
    super.updateIsoPosition();
    this.syncVisualTransform?.();
    return this;
  }

  enableIsoMovement(config,x,y,z=0){
    this.isoDriven=true;
    this.configureIsoProjection(config);
    this.setIsoPosition(x,y,z);
    if(this.body){this.body.setVelocity(0,0);this.body.moves=false;this.configureLogicalBody()}
    return this;
  }

  move(dx,dy){
    if(this.dead){this.body?.setVelocity(0,0);return false}
    const velocity=playerScreenVelocity(dx,dy,this.speed);
    this.body?.setVelocity(velocity.x,velocity.y);
    if(velocity.moving)this.updateFacing(velocity.inputX,velocity.inputY);
    return velocity.moving;
  }

  updateFacing(dx,dy){this.facing=facingFromVector(dx,dy,this.facing);return this.facing}

  playMove(moving){
    if(this.dead||!this.visual?.active)return;
    this.visual.setFlipX(false);
    if(!moving){this.visual.anims.stop();this.visual.setFrame(this.getIdleFrame());return}
    const key=`${this.getTextureKey()}-walk-${this.facing}`;
    if(this.scene.anims.exists(key))this.visual.anims.play(key,true);
    else this.visual.setFrame(this.getIdleFrame());
  }

  takeDamage(n){
    if(this.dead)return;
    const final=Math.max(1,Math.round(n-this.defense));
    this.hp=Math.max(0,this.hp-final);
    this.setVisualTint(0xff9999);
    this.scene.time.delayedCall(90,()=>this.clearVisualTint());
    if(this.hp<=0){this.dead=true;this.body?.setVelocity(0);this.setVisualTint(0x555555)}
  }
  heal(n){this.hp=Math.min(this.maxHp,this.hp+n)}
  restoreMana(n){this.mana=Math.min(this.maxMana,this.mana+n)}
  gainXp(n){this.xp+=n;while(this.xp>=this.level*100){this.xp-=this.level*100;this.level++;this.attributePoints+=3;this.hp=this.maxHp;this.mana=this.maxMana;this.scene.sfx?.levelUp?.();this.scene.skillManager?.grant?.();this.showLevelUpEffect()}}
  showLevelUpEffect(){const s=this.scene;if(!s||!s.add)return;const color=0xffd166;const ring1=s.add.circle(this.x,this.y,24,color,0).setStrokeStyle(4,color,.9).setDepth(60);const ring2=s.add.circle(this.x,this.y,10,color,.28).setStrokeStyle(2,0xfff1b0,.85).setDepth(60);const text=s.add.text(this.x,this.y-58,'LEVEL UP!',{fontFamily:'Arial',fontSize:22,color:'#ffd166',fontStyle:'bold',stroke:'#3a2b08',strokeThickness:4}).setOrigin(.5).setDepth(61);const note=s.add.text(this.x,this.y-34,'+1 Skill  •  +3 Atributos',{fontFamily:'Arial',fontSize:11,color:'#fff3c4',fontStyle:'bold',stroke:'#3a2b08',strokeThickness:3}).setOrigin(.5).setDepth(61);s.tweens.add({targets:[ring1,ring2],scale:3,alpha:0,duration:650,ease:'Cubic.Out',onComplete:()=>{ring1.destroy();ring2.destroy()}});s.tweens.add({targets:text,y:text.y-28,alpha:0,duration:1200,ease:'Cubic.Out',onComplete:()=>text.destroy()});s.tweens.add({targets:note,y:note.y-18,alpha:0,duration:1200,delay:80,ease:'Cubic.Out',onComplete:()=>note.destroy()})}
  applyClass(id){const s={warrior:{hp:40,mana:0,attack:6,defense:4,speed:0},mage:{hp:0,mana:45,attack:3,defense:0,speed:0},ranger:{hp:12,mana:12,attack:4,defense:1,speed:18}}[id]||null;if(!s)return;this.characterClass=id;if(appearanceFor(this.appearanceId).classId!==id)this.appearanceId=defaultAppearanceForClass(id);this.base={hp:120+s.hp,mana:60+s.mana,attack:14+s.attack,defense:s.defense,speed:170+s.speed};this.recalc(true);this.refreshAppearanceTexture()}
  setSkillBonuses(b){this.skills={attack:b.attack||0,hp:b.hp||0,mana:b.mana||0,speed:b.speed||0};this.recalc()}
  setEquipmentBonuses(b){this.equipment={attack:b.attack||0,defense:b.defense||0,hp:b.hp||0,mana:b.mana||0,speed:b.speed||0};this.recalc()}
  setAppearance(id){const a=appearanceFor(id);this.appearanceId=a.classId===this.characterClass?a.id:defaultAppearanceForClass(this.characterClass);this.refreshAppearanceTexture();return this.appearanceId}
  setEquipmentVisual(slots={}){const weapon=!!slots.weapon,armor=!!slots.armor;this.visualState=weapon&&armor?'weapon_armor':weapon?'weapon':armor?'armor':'base';this.refreshAppearanceTexture()}
  getTextureKey(){return playerTextureKey(this.appearanceId,this.visualState)}
  getOutlineTextureKey(){return playerOutlineTextureKey(this.appearanceId,this.visualState)}
  getIdleFrame(){return idleFrameForFacing(this.facing,this.appearanceId)}

  refreshAppearanceTexture(){
    if(!this.scene?.textures||!this.visual?.active)return;
    const key=this.getTextureKey();
    if(this.scene.textures.exists(key)){
      const wasPlaying=this.visual.anims?.isPlaying;
      this.visual.setTexture(key,this.getIdleFrame());
      if(wasPlaying)this.playMove(true);
    }
    // Garantia explícita: trocar arte nunca recalcula ou redimensiona o corpo.
    this.configureLogicalBody();
    this.scene.registry.set('playerAppearanceId',this.appearanceId);
  }

  recalc(reset=false){this.maxHp=(this.base?.hp||120)+this.skills.hp+this.equipment.hp+this.attributeBonuses.hp;this.maxMana=(this.base?.mana||60)+this.skills.mana+this.equipment.mana+this.attributeBonuses.mana;this.attackDamage=(this.base?.attack||14)+this.skills.attack+this.equipment.attack+this.attributeBonuses.attack;this.defense=(this.base?.defense||0)+this.equipment.defense+this.attributeBonuses.defense;this.speed=(this.base?.speed||170)+this.skills.speed+this.equipment.speed;if(reset){this.hp=this.maxHp;this.mana=this.maxMana}else{this.hp=Math.min(this.hp,this.maxHp);this.mana=Math.min(this.mana,this.maxMana)}}
  allocateAttribute(stat){if(this.attributePoints<=0)return false;if(stat==='hp'){this.attributeBonuses.hp+=5;this.maxHp+=5;this.hp+=5}if(stat==='mana'){this.attributeBonuses.mana+=3;this.maxMana+=3;this.mana+=3}if(stat==='attack'){this.attributeBonuses.attack+=1;this.attackDamage+=1}if(stat==='defense'){this.attributeBonuses.defense+=1;this.defense+=1}this.attributePoints--;return true}
  serialize(){return{hp:this.hp,mana:this.mana,level:this.level,xp:this.xp,gold:this.gold,characterClass:this.characterClass,appearanceId:this.appearanceId,skillPoints:this.skillPoints,attributePoints:this.attributePoints,attributeBonuses:{...this.attributeBonuses}}}
  loadState(s){this.level=s.level||1;this.xp=s.xp||0;this.gold=s.gold||0;this.skillPoints=s.skillPoints||0;this.attributePoints=s.attributePoints||0;this.attributeBonuses={hp:s.attributeBonuses?.hp||0,mana:s.attributeBonuses?.mana||0,attack:s.attributeBonuses?.attack||0,defense:s.attributeBonuses?.defense||0};this.appearanceId=appearanceFor(s.appearanceId||defaultAppearanceForClass(s.characterClass||'warrior')).id;this.applyClass(s.characterClass||'warrior');this.hp=Math.min(s.hp??this.maxHp,this.maxHp);this.mana=Math.min(s.mana??this.maxMana,this.maxMana);this.dead=false;this.refreshAppearanceTexture()}
  respawn(x,y){if(this.isoDriven){const iso=this.screenToIso(x,y);this.setIsoPosition(iso.x,iso.y,this.isoZ)}else{this.setPosition(x,y);const iso=this.screenToIso(x,y);this.isoX=iso.x;this.isoY=iso.y}this.dead=false;this.hp=this.maxHp;this.mana=this.maxMana;this.clearVisualTint();this.setVisualAlpha(1).setVisualVisible(true);this.configureLogicalBody();this.syncVisualTransform()}
  isDead(){return this.dead}
}
