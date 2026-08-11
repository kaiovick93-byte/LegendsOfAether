// @ts-nocheck
import {getItemDefinition} from '../items/itemCatalog.ts';
export class InventoryPanel {
  constructor(scene,inv){
    this.inv=inv;
    this.text=scene.add.text(20,80,'',{fontFamily:'Arial',fontSize:'13px',color:'#ecf0ff',backgroundColor:'#182033',padding:10,wordWrap:{width:300}}).setScrollFactor(0).setDepth(450).setVisible(false);
  }
  toggle(){this.text.setVisible(!this.text.visible);this.refresh()}
  refresh(){
    const lines=this.inv.items.length?this.inv.items.map(i=>{const d=getItemDefinition(i.id);return `${d?.name||i.id} x${i.qty}`}).join('\n'):'(vazio)';
    this.text.setText(`INVENTÁRIO\n\n${lines}`);
  }
}
