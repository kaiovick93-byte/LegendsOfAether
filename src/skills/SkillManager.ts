// @ts-nocheck
export class SkillManager{
 constructor(player){this.player=player;this.points=0;this.ranks={primary:0,secondary:0,mobility:0}}
 grant(){this.points++}
 getName(id){const c=this.player.characterClass;const map={warrior:{primary:'Golpe Giratório',secondary:'Golpe de Escudo',mobility:'Investida'},mage:{primary:'Nova de Gelo',secondary:'Lança Arcana',mobility:'Teleporte'},ranger:{primary:'Chuva de Flechas',secondary:'Flecha Perfurante',mobility:'Rolamento'}};return map[c][id]}
 getRank(id){return this.ranks[id]||0}
 can(id){return this.points>0&&(this.ranks[id]||0)<5}
 upgrade(id){if(!this.can(id))return false;this.ranks[id]++;this.points--;return true}
 serialize(){return{points:this.points,ranks:{...this.ranks}}}
 load(s){if(!s)return;this.points=s.points||0;this.ranks={primary:s.ranks?.primary||0,secondary:s.ranks?.secondary||0,mobility:s.ranks?.mobility||0}}
}
