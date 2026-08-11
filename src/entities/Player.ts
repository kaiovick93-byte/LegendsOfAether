// @ts-nocheck
export class Player extends Phaser.Physics.Arcade.Sprite{
 constructor(scene,x,y){super(scene,x,y,'player',1);scene.add.existing(this);scene.physics.add.existing(this);this.setScale(.7);this.setDepth(20);this.setCollideWorldBounds(true);this.body.setSize(58,58,true);this.hp=120;this.maxHp=120;this.mana=60;this.maxMana=60;this.level=1;this.xp=0;this.gold=25;this.attackDamage=14;this.defense=0;this.speed=170;this.characterClass='warrior';this.facing='down';this.dead=false;this.skillPoints=0;this.nextAttack=0;this.equipment={attack:0,defense:0,hp:0,mana:0,speed:0};this.skills={attack:0,hp:0,mana:0,speed:0}}
 move(dx,dy){if(this.dead)return false;this.body.setVelocity(dx*this.speed,dy*this.speed);if(dx||dy){this.body.velocity.normalize().scale(this.speed);this.facing=Math.abs(dx)>Math.abs(dy)?(dx>0?'right':'left'):(dy>0?'down':'up')}return !!(dx||dy)}
 playMove(moving){if(this.dead)return;if(!moving){this.anims.stop();this.setFrame({down:1,up:5,left:9,right:13}[this.facing]);return}this.anims.play(`player-walk-${this.facing}`,true)}
 takeDamage(n){if(this.dead)return;const final=Math.max(1,Math.round(n-this.defense));this.hp=Math.max(0,this.hp-final);this.setTint(0xff9999);this.scene.time.delayedCall(90,()=>this.clearTint());if(this.hp<=0){this.dead=true;this.body.setVelocity(0);this.setTint(0x555555)}}
 heal(n){this.hp=Math.min(this.maxHp,this.hp+n)}
 restoreMana(n){this.mana=Math.min(this.maxMana,this.mana+n)}
 gainXp(n){this.xp+=n;while(this.xp>=this.level*100){this.xp-=this.level*100;this.level++;this.skillPoints++;this.maxHp+=6;this.maxMana+=3;this.attackDamage+=2;this.hp=this.maxHp;this.mana=this.maxMana;this.scene.sfx?.levelUp?.();this.scene.skillManager?.grant?.()}}
 applyClass(id){const s={warrior:{hp:40,mana:0,attack:6,defense:4,speed:0},mage:{hp:0,mana:45,attack:3,defense:0,speed:0},ranger:{hp:12,mana:12,attack:4,defense:1,speed:18}}[id]||null;if(!s)return;this.characterClass=id;this.base={hp:120+s.hp,mana:60+s.mana,attack:14+s.attack,defense:s.defense,speed:170+s.speed};this.recalc(true)}
 setSkillBonuses(b){this.skills={attack:b.attack||0,hp:b.hp||0,mana:b.mana||0,speed:b.speed||0};this.recalc()}
 setEquipmentBonuses(b){this.equipment={attack:b.attack||0,defense:b.defense||0,hp:b.hp||0,mana:b.mana||0,speed:b.speed||0};this.recalc()}
 recalc(reset=false){this.maxHp=(this.base?.hp||120)+this.skills.hp+this.equipment.hp;this.maxMana=(this.base?.mana||60)+this.skills.mana+this.equipment.mana;this.attackDamage=(this.base?.attack||14)+this.skills.attack+this.equipment.attack;this.defense=(this.base?.defense||0)+this.equipment.defense;this.speed=(this.base?.speed||170)+this.skills.speed+this.equipment.speed;if(reset){this.hp=this.maxHp;this.mana=this.maxMana}else{this.hp=Math.min(this.hp,this.maxHp);this.mana=Math.min(this.mana,this.maxMana)}}
 serialize(){return{hp:this.hp,mana:this.mana,level:this.level,xp:this.xp,gold:this.gold,characterClass:this.characterClass,skillPoints:this.skillPoints}}
 loadState(s){this.characterClass=s.characterClass||'warrior';this.applyClass(this.characterClass);this.level=s.level||1;this.xp=s.xp||0;this.gold=s.gold||0;this.skillPoints=s.skillPoints||0;this.hp=Math.min(s.hp??this.maxHp,this.maxHp);this.mana=Math.min(s.mana??this.maxMana,this.maxMana);this.dead=false}
 respawn(x,y){this.setPosition(x,y);this.dead=false;this.hp=this.maxHp;this.mana=this.maxMana;this.clearTint();this.setAlpha(1)}
 isDead(){return this.dead}
}
