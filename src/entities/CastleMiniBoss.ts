// @ts-nocheck
import {MiniBossEnemy} from './MiniBossEnemy.ts';
export class CastleMiniBoss extends MiniBossEnemy{constructor(scene,x,y){super(scene,x,y,{name:'Cavaleiro Amaldiçoado',hp:340,speed:58,attackDamage:26,xpReward:160,specialRadius:110,specialDamage:40,reward:{itemId:'royal_mage_staff',quantity:1},tint:0xc084fc})}}
