// @ts-nocheck
import {MiniBossEnemy} from './MiniBossEnemy';
export class ForestMiniBoss extends MiniBossEnemy{constructor(scene,x,y){super(scene,x,y,{name:'Guardião da Mata',hp:220,speed:50,attackDamage:18,xpReward:90,specialRadius:90,specialDamage:28,reward:{itemId:'brute_armor',quantity:1},tint:0x73e6a8})}}
