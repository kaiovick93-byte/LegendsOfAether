// @ts-nocheck
import {Npc} from './Npc';export class WanderingNpc extends Npc{constructor(scene,x,y,name,text){super(scene,x,y,name,text);this.home={x,y};this.timer=scene.time.addEvent({delay:1500+Math.random()*1600,loop:true,callback:()=>{const tx=this.home.x+(Math.random()-.5)*70,ty=this.home.y+(Math.random()-.5)*70;scene.tweens.add({targets:this,x:tx,y:ty,duration:900,ease:'Sine.InOut'})}})}}
