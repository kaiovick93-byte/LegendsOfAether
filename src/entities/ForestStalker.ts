// @ts-nocheck
import {Enemy} from './Enemy';
export class ForestStalker extends Enemy{
  constructor(scene,x,y){
    super(scene,x,y,'Perseguidor da Mata',{hp:48,speed:96,attackDamage:13,xpReward:30,aggroRange:280,tint:0x5f8f52,scale:1.02});
    this.setTint(0x5f8f52);
  }
}
