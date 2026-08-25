// @ts-nocheck
import {EliteEnemy} from './EliteEnemy';
export class DeepWoodStag extends EliteEnemy{
  constructor(scene,x,y){
    super(scene,x,y,'Cervo Ancestral Corrompido',{hp:210,speed:72,attackDamage:25,xpReward:88,aggroRange:340,attackCooldown:760,tint:0xc084fc},{itemId:'brute_armor',quantity:1});
  }
}
