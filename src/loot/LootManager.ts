// @ts-nocheck
import {getRandomDropDefinition,getItemDefinition,rarityColor} from '../items/itemCatalog';
import {EliteEnemy} from '../entities/EliteEnemy';
import {MiniBossEnemy} from '../entities/MiniBossEnemy';
export class LootManager{constructor(scene,inventory){this.scene=scene;this.inventory=inventory;this.drops=[]}
 spawn(enemy){let item;if(enemy instanceof MiniBossEnemy||enemy instanceof EliteEnemy)item=getItemDefinition(enemy.guaranteedReward.itemId);else item=getRandomDropDefinition();if(!item)return;const c=this.scene.add.container(enemy.x,enemy.y-10).setDepth(100);c.add(this.scene.add.circle(0,0,9,rarityColor(item.rarity)).setStrokeStyle(2,0xffffff,.6));c.add(this.scene.add.text(16,-10,item.name,{fontFamily:'Arial',fontSize:'12px',color:'#ecf0ff',backgroundColor:'#182033',padding:{left:5,right:5,top:2,bottom:2}}));this.scene.tweens.add({targets:c,y:c.y-18,duration:700,yoyo:true,repeat:-1});this.drops.push({item,container:c})}
 collectNear(x,y){const i=this.drops.findIndex(d=>Phaser.Math.Distance.Between(x,y,d.container.x,d.container.y)<36);if(i<0)return null;const d=this.drops[i];if(!this.inventory.add(d.item.id,1))return null;d.container.destroy();this.drops.splice(i,1);return d.item}
 update(x,y){this.drops.forEach(d=>{const t=d.container.list[1];if(t?.setAlpha)t.setAlpha(Phaser.Math.Distance.Between(x,y,d.container.x,d.container.y)<52?1:.7)})}
 destroy(){this.drops.forEach(d=>d.container.destroy());this.drops=[]}
}
