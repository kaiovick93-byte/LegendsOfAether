// @ts-nocheck
import {getItemDefinition} from '../items/itemCatalog.js';
export class EquipmentManager{
 constructor(player){this.player=player;this.slots={weapon:null,armor:null,trinket:null}}
 equip(itemId,inventory){const item=getItemDefinition(itemId);if(!item||!['weapon','armor','trinket'].includes(item.type)||!inventory.has(itemId))return false;const old=this.slots[item.type];this.slots[item.type]=itemId;inventory.remove(itemId,1);if(old)inventory.add(old,1);this.sync();return true}
 autoEquipBest(inventory){let changed=0;for(const slot of ['weapon','armor','trinket']){const candidates=inventory.items.filter(x=>getItemDefinition(x.id)?.type===slot);const best=candidates.sort((a,b)=>score(getItemDefinition(b.id))-score(getItemDefinition(a.id)))[0];if(best&&(!this.slots[slot]||score(getItemDefinition(best.id))>score(getItemDefinition(this.slots[slot])))){if(this.equip(best.id,inventory))changed++}}return changed}
 sync(){const b={attack:0,defense:0,hp:0,mana:0,speed:0};for(const id of Object.values(this.slots)){const s=getItemDefinition(id)?.stats||{};for(const k of Object.keys(b))b[k]+=s[k]||0}this.player.setEquipmentBonuses(b)}
 serialize(){return {...this.slots}}
 load(data,inventory){this.slots={weapon:data?.weapon||null,armor:data?.armor||null,trinket:data?.trinket||null};this.sync()}
}
function score(item){if(!item)return 0;const s=item.stats||{};return (s.attack||0)*4+(s.defense||0)*3+(s.hp||0)+(s.mana||0)+(s.speed||0)*2}
