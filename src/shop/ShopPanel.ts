// @ts-nocheck
export class ShopPanel{constructor(scene,player,inv){this.scene=scene;this.player=player;this.inv=inv;this.visible=false;this.text=scene.add.text(scene.scale.width/2,190,'',{fontFamily:'Arial',fontSize:14,color:'#ecf0ff',backgroundColor:'#182033',padding:14,align:'left'}).setOrigin(.5).setScrollFactor(0).setDepth(1000).setVisible(false);this.items=[['healing_potion',20],['mana_potion',25],['iron_sword',70]]}
toggle(){this.visible=!this.visible;this.text.setVisible(this.visible);this.refresh()}
refresh(){this.text.setText(`MERCADOR\n\n1. Poção de Cura — 20 ouro\n2. Poção de Mana — 25 ouro\n3. Espada de Ferro — 70 ouro\n\nOuro: ${this.player.gold}\n\nT / Esc — fechar loja`)}
buy(i){const it=this.items[i];if(!it||this.player.gold<it[1]){this.refresh();return false}const ok=this.inv.add(it[0],1);if(ok)this.player.gold-=it[1];this.refresh();return ok}
}
