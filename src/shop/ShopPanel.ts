// @ts-nocheck
export class ShopPanel{constructor(scene,player,inv){this.scene=scene;this.player=player;this.inv=inv;this.visible=false;this.text=scene.add.text(330,150,'',{fontFamily:'Arial',fontSize:'14px',color:'#ecf0ff',backgroundColor:'#182033',padding:12}).setScrollFactor(0).setDepth(450).setVisible(false);this.items=[['healing_potion',20],['mana_potion',25],['iron_sword',70]]}toggle(){this.visible=!this.visible;this.text.setVisible(this.visible);this.refresh()}refresh(){this.text.setText(`LOJA
1. Poção de Cura — 20
2. Poção de Mana — 25
3. Espada de Ferro — 70

Ouro: ${this.player.gold}`)}buy(i){const it=this.items[i];if(!it||this.player.gold<it[1])return false;this.player.gold-=it[1];return this.inv.add(it[0],1)}}
