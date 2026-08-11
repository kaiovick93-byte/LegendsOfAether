// @ts-nocheck
import {MiniBossEnemy} from './MiniBossEnemy.js';
export class CaveMiniBoss extends MiniBossEnemy{constructor(scene,x,y){super(scene,x,y,{name:'Espectro Ancestral',hp:280,speed:65,attackDamage:22,xpReward:120,specialRadius:100,specialDamage:32,reward:{itemId:'wraith_blade',quantity:1},tint:0x8cc0ff})}}
