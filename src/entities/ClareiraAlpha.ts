// @ts-nocheck
import {EliteEnemy} from './EliteEnemy';
export class ClareiraAlpha extends EliteEnemy{
  constructor(scene,x,y){
    super(scene,x,y,'Lobo Alfa da Clareira',{hp:180,speed:84,attackDamage:21,xpReward:72,aggroRange:330,attackCooldown:780,tint:0xb8d879},{itemId:'forest_cloak',quantity:1});
  }
}
