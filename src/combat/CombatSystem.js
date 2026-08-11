export class CombatSystem{
  constructor(scene,onDefeat){this.scene=scene;this.onDefeat=onDefeat}
  playerAttack(player,targets){const now=this.scene.time.now;if(now<player.nextAttack)return;player.nextAttack=now+320;const range=58;for(const e of targets){if(!e?.active||!e.isAlive())continue;const d=Phaser.Math.Distance.Between(player.x,player.y,e.x,e.y);if(d<=range){const dmg=player.attackDamage;const alive=e.isAlive();e.takeDamage(dmg);this.float(e.x,e.y,`-${dmg}`,'#ffd166');if(alive&&!e.isAlive()){player.gainXp(e.xpReward);this.onDefeat?.(e,player)}}}}
  enemyAttack(enemy,player){if(!enemy?.active||!enemy.isAlive()||player.dead)return;const d=Phaser.Math.Distance.Between(enemy.x,enemy.y,player.x,player.y);const now=this.scene.time.now;if(d<38&&now>=enemy.nextAttack){enemy.nextAttack=now+enemy.attackCooldown;player.takeDamage(enemy.attackDamage)}}
  float(x,y,t,c){const txt=this.scene.add.text(x,y,t,{fontFamily:'Arial',fontSize:'16px',color:c,fontStyle:'bold'}).setOrigin(.5).setDepth(100);this.scene.tweens.add({targets:txt,y:y-25,alpha:0,duration:600,onComplete:()=>txt.destroy()})}
}
