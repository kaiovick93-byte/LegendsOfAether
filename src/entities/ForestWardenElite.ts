// @ts-nocheck
import {EliteEnemy} from './EliteEnemy';
export class ForestWardenElite extends EliteEnemy{
  constructor(scene,x,y){
    super(scene,x,y,'Guardião Antigo da Floresta',{hp:235,speed:62,attackDamage:27,xpReward:96,aggroRange:350,attackCooldown:740,tint:0x73e6a8},{itemId:'elder_talisman',quantity:1});
  }
}
