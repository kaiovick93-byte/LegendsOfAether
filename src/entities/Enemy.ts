// @ts-nocheck
export class Enemy extends Phaser.Physics.Arcade.Sprite{
 constructor(scene,x,y,name='Goblin',stats={}){
  super(scene,x,y,'enemy',0);scene.add.existing(this);scene.physics.add.existing(this);
  this.name=name;this.maxHp=stats.hp||30;this.hp=this.maxHp;this.speed=stats.speed||70;this.attackDamage=stats.attackDamage||8;this.aggroRange=stats.aggroRange||220;this.xpReward=stats.xpReward||10;this.attackCooldown=stats.attackCooldown||900;this.nextAttack=0;this.dead=false;this.rewardGranted=false;
  this.setTint(stats.tint||0xff6b6b);this.setScale(stats.scale||1);this.setDepth(15);
  this.hpBg=scene.add.rectangle(0,-32,54,6,0x202838,0.95).setOrigin(0.5).setDepth(40);
  this.hpFill=scene.add.rectangle(-27,-32,54,6,0x73e6a8,1).setOrigin(0,0.5).setDepth(41);
  this.nameText=scene.add.text(0,-46,name,{fontFamily:'Arial',fontSize:11,color:'#ecf0ff',backgroundColor:'#182033',padding:{left:4,right:4,top:2,bottom:2}}).setOrigin(0.5).setDepth(42);
  this.updateBars();
 }

 preUpdate(time,delta){
  super.preUpdate(time,delta);
  if(this.hpBg){this.hpBg.setPosition(this.x,this.y-32);this.hpFill.setPosition(this.x-27,this.y-32);this.nameText.setPosition(this.x,this.y-46)}
 }
 updateAI(player){if(this.dead)return;const d=Phaser.Math.Distance.Between(this.x,this.y,player.x,player.y);if(d<=this.aggroRange)this.scene.physics.moveToObject(this,player,this.speed);else this.body.setVelocity(0)}
 isAlive(){return !this.dead&&this.hp>0}
 takeDamage(n){if(this.dead)return;this.hp=Math.max(0,this.hp-n);this.updateBars();this.setTint(0xffffff);this.scene.time.delayedCall(70,()=>{if(!this.dead)this.setTint(this.originalTint??0xff6b6b)});if(this.hp<=0){this.dead=true;this.body.setVelocity(0);this.setAlpha(.35);this.setUiVisible(false)}}
 updateBars(){if(this.hpFill)this.hpFill.width=54*Math.max(0,Math.min(1,this.hp/this.maxHp));}
 setUiVisible(v){this.hpBg?.setVisible(v);this.hpFill?.setVisible(v);this.nameText?.setVisible(v)}
 destroy(fromScene){this.hpBg?.destroy();this.hpFill?.destroy();this.nameText?.destroy();super.destroy(fromScene)}
}
