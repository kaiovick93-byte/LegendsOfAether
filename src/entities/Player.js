export class Player extends Phaser.Physics.Arcade.Sprite{
  constructor(scene,x,y){super(scene,x,y,'player',0);scene.add.existing(this);scene.physics.add.existing(this);this.setScale(.54);this.setDepth(20);this.setCollideWorldBounds(true);this.body.setSize(58,58,true);this.hp=120;this.maxHp=120;this.mana=60;this.maxMana=60;this.level=1;this.xp=0;this.gold=25;this.attackDamage=14;this.defense=2;this.speed=170;this.characterClass='warrior';this.facing='down';this.dead=false;this.skillPoints=0;this.nextAttack=0}
  move(dx,dy){if(this.dead)return false;const b=this.body;b.setVelocity(dx*this.speed,dy*this.speed);if(dx||dy){b.velocity.normalize().scale(this.speed);this.facing=Math.abs(dx)>Math.abs(dy)?(dx>0?'right':'left'):(dy>0?'down':'up');}return !!(dx||dy)}
  playMove(moving){if(this.dead)return;if(!moving){this.anims.stop();this.setFrame(this.idleFrame());return}this.anims.play(`player-walk-${this.facing}`,true)}
  idleFrame(){return {down:1,up:5,left:9,right:13}[this.facing]}
  takeDamage(n){if(this.dead)return;this.hp=Math.max(0,this.hp-Math.max(1,n-this.defense));this.setTint(0xff9999);this.scene.time.delayedCall(90,()=>this.clearTint());if(this.hp===0){this.dead=true;this.body.setVelocity(0);this.setTint(0x555555)}}
  heal(n){this.hp=Math.min(this.maxHp,this.hp+n)}
  gainMana(n){this.mana=Math.min(this.maxMana,this.mana+n)}
  gainXp(n){this.xp+=n;while(this.xp>=this.level*100){this.xp-=this.level*100;this.level++;this.skillPoints++;this.maxHp+=6;this.maxMana+=3;this.attackDamage+=2;this.hp=this.maxHp;this.mana=this.maxMana}}
  selectClass(id){this.characterClass=id;this.applyClass()}
  applyClass(){const s={warrior:{hp:40,mana:0,attack:6,defense:4,speed:0},mage:{hp:0,mana:45,attack:3,defense:0,speed:0},ranger:{hp:12,mana:12,attack:4,defense:1,speed:18}}[this.characterClass].stats;this.maxHp=120+s.hp;this.maxMana=60+s.mana;this.attackDamage=14+s.attack;this.defense=s.defense;this.speed=170+s.speed;this.hp=this.maxHp;this.mana=this.maxMana}
  serialize(){return {hp:this.hp,mana:this.mana,level:this.level,xp:this.xp,gold:this.gold,characterClass:this.characterClass,skillPoints:this.skillPoints}}
  loadState(s){this.hp=s.hp;this.mana=s.mana;this.level=s.level;this.xp=s.xp;this.gold=s.gold;this.characterClass=s.characterClass||'warrior';this.skillPoints=s.skillPoints||0;this.applyClass()}
  respawn(x,y){this.setPosition(x,y);this.dead=false;this.hp=this.maxHp;this.mana=this.maxMana;this.clearTint()}
}
