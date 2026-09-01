// @ts-nocheck
import {appearanceFor,defaultAppearanceForClass,facingFromVector,idleFrameForFacing,playerOutlineTextureKey,playerTextureKey} from '../character/PlayerAppearance';
import {IsoPhysicsSprite} from '../isometric/IsoOcclusion';
export class Player extends IsoPhysicsSprite{
  constructor(scene,x,y){
    const appearanceId=scene.registry.get('selectedAppearance')||'warrior_m';
    const texture=scene.textures.exists(playerTextureKey(appearanceId,'base'))?playerTextureKey(appearanceId,'base'):'player-fallback';
    // A projeção cartesiana 2×2 preserva os mapas legados. A Cidade de
    // Aether substitui esta projeção pela malha 96×48 após criar o jogador.
    super({scene,isoX:(x+y)/2,isoY:(y-x)/2,isoZ:0,texture,frame:texture==='player-fallback'?0:1,tileWidth:2,tileHeight:2});
    this.isoDriven=false;
    this.setScale(.7).setDepth(20).setCollideWorldBounds(true);
    // Regra do arquivo phaser_isometric_collision.ts: somente os pés têm
    // corpo físico. Cabeça, cabelo, capa e armas nunca antecipam colisões.
    this.body.setSize(32,16,false);
    this.body.setOffset((this.width-32)/2,this.height-16);
    this.hp=120;this.maxHp=120;this.mana=60;this.maxMana=60;this.level=1;this.xp=0;this.gold=25;this.attackDamage=14;this.defense=0;this.speed=170;this.characterClass=appearanceFor(appearanceId).classId;this.appearanceId=appearanceFor(appearanceId).id;this.visualState='base';this.facing='down';this.dead=false;this.skillPoints=0;this.attributePoints=0;this.nextAttack=0;this.equipment={attack:0,defense:0,hp:0,mana:0,speed:0};this.skills={attack:0,hp:0,mana:0,speed:0};this.attributeBonuses={hp:0,mana:0,attack:0,defense:0};
  }
  enableIsoMovement(config,x,y,z=0){
    this.isoDriven=true;
    this.configureIsoProjection(config);
    this.setIsoPosition(x,y,z);
    const body=this.body as Phaser.Physics.Arcade.Body|undefined;
    if(body){
      // Na cidade, isoX/isoY são a única autoridade de movimento. Um corpo
      // Arcade dinâmico reaplicaria x/y no postUpdate e disputaria posição
      // com updateIsoPosition(), fazendo o herói parecer preso no início.
      body.setVelocity(0,0);
      body.setCollideWorldBounds(false);
      body.moves=false;
      body.updateFromGameObject();
    }
    return this;
  }
  move(dx,dy){if(this.dead)return false;this.body.setVelocity(dx*this.speed,dy*this.speed);if(dx||dy){this.body.velocity.normalize().scale(this.speed);this.updateFacing(dx,dy)}return !!(dx||dy)}
  updateFacing(dx,dy){this.facing=facingFromVector(dx,dy,this.facing);return this.facing}
  playMove(moving){if(this.dead)return;if(!moving){this.anims.stop();this.setFrame(this.getIdleFrame());return}const key=`${this.getTextureKey()}-walk-${this.facing}`;if(this.scene.anims.exists(key))this.anims.play(key,true);else this.setFrame(this.getIdleFrame())}
  takeDamage(n){if(this.dead)return;const final=Math.max(1,Math.round(n-this.defense));this.hp=Math.max(0,this.hp-final);this.setTint(0xff9999);this.scene.time.delayedCall(90,()=>this.clearTint());if(this.hp<=0){this.dead=true;this.body.setVelocity(0);this.setTint(0x555555)}}
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
  getIdleFrame(){return idleFrameForFacing(this.facing)}
  refreshAppearanceTexture(){if(!this.scene?.textures)return;const key=this.getTextureKey();if(this.scene.textures.exists(key)){const wasPlaying=this.anims?.isPlaying;this.setTexture(key,this.getIdleFrame());if(wasPlaying)this.playMove(true)}this.scene.registry.set('playerAppearanceId',this.appearanceId)}
  recalc(reset=false){this.maxHp=(this.base?.hp||120)+this.skills.hp+this.equipment.hp+this.attributeBonuses.hp;this.maxMana=(this.base?.mana||60)+this.skills.mana+this.equipment.mana+this.attributeBonuses.mana;this.attackDamage=(this.base?.attack||14)+this.skills.attack+this.equipment.attack+this.attributeBonuses.attack;this.defense=(this.base?.defense||0)+this.equipment.defense+this.attributeBonuses.defense;this.speed=(this.base?.speed||170)+this.skills.speed+this.equipment.speed;if(reset){this.hp=this.maxHp;this.mana=this.maxMana}else{this.hp=Math.min(this.hp,this.maxHp);this.mana=Math.min(this.mana,this.maxMana)}}
  allocateAttribute(stat){if(this.attributePoints<=0)return false;if(stat==='hp'){this.attributeBonuses.hp+=5;this.maxHp+=5;this.hp+=5}if(stat==='mana'){this.attributeBonuses.mana+=3;this.maxMana+=3;this.mana+=3}if(stat==='attack'){this.attributeBonuses.attack+=1;this.attackDamage+=1}if(stat==='defense'){this.attributeBonuses.defense+=1;this.defense+=1}this.attributePoints--;return true}
  serialize(){return{hp:this.hp,mana:this.mana,level:this.level,xp:this.xp,gold:this.gold,characterClass:this.characterClass,appearanceId:this.appearanceId,skillPoints:this.skillPoints,attributePoints:this.attributePoints,attributeBonuses:{...this.attributeBonuses}}}
  loadState(s){this.level=s.level||1;this.xp=s.xp||0;this.gold=s.gold||0;this.skillPoints=s.skillPoints||0;this.attributePoints=s.attributePoints||0;this.attributeBonuses={hp:s.attributeBonuses?.hp||0,mana:s.attributeBonuses?.mana||0,attack:s.attributeBonuses?.attack||0,defense:s.attributeBonuses?.defense||0};this.appearanceId=appearanceFor(s.appearanceId||defaultAppearanceForClass(s.characterClass||'warrior')).id;this.applyClass(s.characterClass||'warrior');this.hp=Math.min(s.hp??this.maxHp,this.maxHp);this.mana=Math.min(s.mana??this.maxMana,this.maxMana);this.dead=false;this.refreshAppearanceTexture()}
  respawn(x,y){if(this.isoDriven){const iso=this.screenToIso(x,y);this.setIsoPosition(iso.x,iso.y,this.isoZ)}else{this.setPosition(x,y);const iso=this.screenToIso(x,y);this.isoX=iso.x;this.isoY=iso.y}this.dead=false;this.hp=this.maxHp;this.mana=this.maxMana;this.clearTint();this.setAlpha(1)}
  isDead(){return this.dead}
}
