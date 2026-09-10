// @ts-nocheck
import {EliteEnemy} from './EliteEnemy';
export class RuinGuardian extends EliteEnemy{
  constructor(scene,x,y){
    super(scene,x,y,'Guardião das Ruínas',{
      hp:150,speed:62,attackDamage:22,attackRange:34,aggroRange:300,xpReward:85,attackCooldown:850,tint:0x8f6bb8
    },{itemId:'forest_cloak',quantity:1});
    this.setScale(1.28);
  }
}
