// @ts-nocheck
import {Enemy} from './Enemy.js';
export class EliteEnemy extends Enemy{constructor(scene,x,y,name,stats,reward){super(scene,x,y,name,{...stats,scale:1.18});this.guaranteedReward=reward;this.setTint(stats.tint||0xffd166)}updateAI(p){super.updateAI(p);if(this.isAlive()&&this.hp<=this.maxHp*.35)this.setTint(0xff9f1c)}}
