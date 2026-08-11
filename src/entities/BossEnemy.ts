// @ts-nocheck
import {Enemy} from './Enemy';
export class BossEnemy extends Enemy{constructor(scene,x,y,name,stats={}){super(scene,x,y,name,{...stats,scale:1.7,tint:0xc084fc});this.maxHp=stats.hp||420;this.hp=this.maxHp;this.phaseTwo=false}updateAI(p){super.updateAI(p);if(!this.phaseTwo&&this.hp<=this.maxHp*.5){this.phaseTwo=true;this.speed+=20;this.attackDamage+=10;this.setTint(0xff6b6b);this.scene.cameras.main.shake(150,.003)}}}
