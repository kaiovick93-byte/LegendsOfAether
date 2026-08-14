// @ts-nocheck
export class Enemy extends Phaser.Physics.Arcade.Sprite{
 constructor(scene,x,y,name='Goblin',stats={}){
  super(scene,x,y,'enemy',0);scene.add.existing(this);scene.physics.add.existing(this);
  this.name=name;this.maxHp=stats.hp||30;this.hp=this.maxHp;this.speed=stats.speed||70;this.attackDamage=stats.attackDamage||8;this.aggroRange=stats.aggroRange||220;this.xpReward=stats.xpReward||10;this.attackCooldown=stats.attackCooldown||900;this.nextAttack=0;this.dead=false;this.rewardGranted=false;
  this._baseTint=stats.tint||0xff6b6b;this.setTint(this._baseTint);this.setScale(stats.scale||1);this.setDepth(15);
  this.nameText=scene.add.text(x,y-44,name,{fontFamily:'Arial',fontSize:11,color:'#ecf0ff',fontStyle:'bold',backgroundColor:'#182033',padding:{left:4,right:4,top:2,bottom:2}}).setOrigin(.5).setDepth(120);
  this.hpBg=scene.add.rectangle(x,y-28,52,6,0x3a465f,1).setOrigin(.5).setDepth(119);
  this.hpFill=scene.add.rectangle(x-26,y-28,52,6,0xff6b6b,1).setOrigin(0,.5).setDepth(121);
  this.syncHealthUI();
 }
 updateAI(player){
  if(this.dead){this.syncHealthUI();return}
  const d=Phaser.Math.Distance.Between(this.x,this.y,player.x,player.y);if(d<=this.aggroRange)this.scene.physics.moveToObject(this,player,this.speed);else this.body.setVelocity(0);this.syncHealthUI()
 }
 isAlive(){return !this.dead&&this.hp>0}
 takeDamage(n){if(this.dead)return;this.hp=Math.max(0,this.hp-n);this.setTint(0xffffff);this.scene.time.delayedCall(70,()=>{if(!this.dead)this.setTint(this._baseTint||0xff6b6b)});if(this.hp<=0){this.dead=true;this.body.setVelocity(0);this.setAlpha(.35);this.syncHealthUI()}else this.syncHealthUI()}
 syncHealthUI(){const ratio=Phaser.Math.Clamp(this.hp/Math.max(1,this.maxHp),0,1);this.nameText?.setPosition(this.x,this.y-44);this.hpBg?.setPosition(this.x,this.y-28);this.hpFill?.setPosition(this.x-26,this.y-28);if(this.hpFill)this.hpFill.width=52*ratio;const visible=!this.dead&&this.active;this.nameText?.setVisible(visible);this.hpBg?.setVisible(visible);this.hpFill?.setVisible(visible)}
 destroy(fromScene){this.nameText?.destroy();this.hpBg?.destroy();this.hpFill?.destroy();super.destroy(fromScene)}
}
