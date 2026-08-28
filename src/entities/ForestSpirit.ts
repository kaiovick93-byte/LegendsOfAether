// @ts-nocheck
import {Enemy} from './Enemy';
export class ForestSpirit extends Enemy{
  constructor(scene,x,y){
    super(scene,x,y,'Espírito da Floresta',{hp:52,speed:78,attackDamage:12,xpReward:28,aggroRange:240,tint:0x73e6a8,scale:1.05});
    this.setTint(0x73e6a8);
  }
}
