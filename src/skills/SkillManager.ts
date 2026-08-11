// @ts-nocheck
export class SkillManager{
 constructor(player){this.player=player;this.points=0;this.ranks={power_strike:0,arcane_mastery:0,swift_step:0,vitality:0,mana_well:0,critical_eye:0}}
 grant(){this.points++}
 can(id){return this.points>0&&(this.ranks[id]||0)<5}
 upgrade(id){if(!this.can(id))return false;this.ranks[id]++;this.points--;this.apply();return true}
 apply(){this.player.setSkillBonuses({attack:this.ranks.power_strike*4,speed:this.ranks.swift_step*5,hp:this.ranks.vitality*12,mana:this.ranks.mana_well*10})}
 serialize(){return{points:this.points,ranks:{...this.ranks}}}
 load(s){if(!s)return;this.points=s.points||0;this.ranks={...this.ranks,...(s.ranks||{})};this.apply()}
}
