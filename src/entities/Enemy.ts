// @ts-nocheck
export class Enemy extends Phaser.Physics.Arcade.Sprite{
 constructor(scene,x,y,name='Goblin',stats={}){super(scene,x,y,'enemy',0);scene.add.existing(this);scene.physics.add.existing(this);this.name=name;this.maxHp=stats.hp||30;this.hp=this.maxHp;this.speed=stats.speed||70;this.attackDamage=stats.attackDamage||8;this.aggroRange=stats.aggroRange||220;this.xpReward=stats.xpReward||10;this.attackCooldown=stats.attackCooldown||900;this.nextAttack=0;this.dead=false;this.rewardGranted=false;this.setTint(stats.tint||0xff6b6b);this.setScale(stats.scale||1);this.setDepth(15)}
 updateAI(player){if(this.dead)return;const d=Phaser.Math.Distance.Between(this.x,this.y,player.x,player.y);if(d<=this.aggroRange) this.scene.physics.moveToObject(this,player,this.speed);else this.body.setVelocity(0)}
 isAlive(){return !this.dead&&this.hp>0}
 takeDamage(n){if(this.dead)return;this.hp=Math.max(0,this.hp-n);this.setTint(0xffffff);this.scene.time.delayedCall(70,()=>{if(!this.dead)this.setTint(this.tint||0xff6b6b)});if(this.hp<=0){this.dead=true;this.body.setVelocity(0);this.setAlpha(.35)}}
}
