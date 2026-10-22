// @ts-nocheck
import {Enemy} from './Enemy';
export class MiniBossEnemy extends Enemy {
  constructor(scene,x,y,config){
    super(scene,x,y,config.name,{...config,scale:1.35});
    this.guaranteedReward=config.reward;
    this.specialCooldown=config.specialCooldown||2800;
    this.nextSpecial=0;
    this.specialRadius=config.specialRadius||90;
    this.specialDamage=config.specialDamage||28;
    this.enraged=false;
    this.originalTint=config.tint||0xc084fc;this.setTint(this.originalTint);
  }
  updateAI(p){
    super.updateAI(p);
    if(!this.isAlive()) return;
    if(!this.enraged&&this.hp<=this.maxHp*.5){this.enraged=true;this.speed+=18;this.attackDamage+=8;this.setTint(0xff6b6b);}
    const d=Phaser.Math.Distance.Between(this.x,this.y,p.x,p.y);
    if(d<this.specialRadius&&this.scene.time.now>=this.nextSpecial){
      this.nextSpecial=this.scene.time.now+this.specialCooldown;
      const w=this.scene.add.circle(this.x,this.y,this.specialRadius,0xff6b6b,.14).setDepth(8);
      this.scene.tweens.add({targets:w,scale:1.25,alpha:.7,duration:260,yoyo:true,repeat:1,onComplete:()=>{w.destroy();if(Phaser.Math.Distance.Between(this.x,this.y,p.x,p.y)<this.specialRadius)p.takeDamage(this.specialDamage);}});
    }
  }
}
