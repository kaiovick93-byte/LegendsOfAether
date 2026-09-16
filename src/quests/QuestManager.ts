// @ts-nocheck
import {QUESTS} from './questData';import {getItemDefinition} from '../items/itemCatalog';
export class QuestManager{constructor(){this.state={}}
 get(giver){return QUESTS.find(q=>q.giver===giver)}
 accept(giver){const q=this.get(giver);if(!q)return false;this.state[q.id]??={accepted:true,completed:false};this.state[q.id].accepted=true;return true}
 progress(giver,inv){const q=this.get(giver);return q?Math.min(inv.count(q.item),q.count):0}
 ready(giver,inv){const q=this.get(giver);return !!q&&this.state[q.id]?.accepted&&!this.state[q.id]?.completed&&this.progress(giver,inv)>=q.count}
 turnIn(giver,player,inv){const q=this.get(giver);if(!q||!this.ready(giver,inv))return false;inv.remove(q.item,q.count);player.gold+=q.gold;player.gainXp(q.xp);if(q.reward)inv.add(q.reward,1);this.state[q.id].completed=true;return true}
 serialize(){return this.state}
 load(s){this.state=s||{}}
}
