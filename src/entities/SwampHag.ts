// @ts-nocheck
import {EliteEnemy} from './EliteEnemy';
export class SwampHag extends EliteEnemy{
  constructor(scene,x,y){
    super(scene,x,y,'Bruxa Anciã do Pântano',{hp:195,speed:58,attackDamage:23,xpReward:78,aggroRange:330,attackCooldown:820,tint:0x8aa4d6},{itemId:'shadow_amulet',quantity:1});
  }
}
