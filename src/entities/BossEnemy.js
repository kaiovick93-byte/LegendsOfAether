import {Enemy} from './Enemy.js';
export class BossEnemy extends Enemy{constructor(scene,x,y,name,stats={}){super(scene,x,y,name,{...stats,tint:0xc084fc});this.setScale(1.8);this.maxHp=stats.hp??400;this.hp=this.maxHp;this.aggroRange=420;this.attackDamage=stats.attackDamage??22;this.speed=stats.speed??50;this.xpReward=stats.xpReward??200}}
