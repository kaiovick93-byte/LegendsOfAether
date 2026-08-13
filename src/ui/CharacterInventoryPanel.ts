// @ts-nocheck
import { getItemDefinition, rarityColor } from '../items/itemCatalog';
export class CharacterInventoryPanel {
  constructor(scene, player, inventory, equipment, save) {
    this.scene=scene; this.player=player; this.inv=inventory; this.equipment=equipment; this.save=save; this.visible=false;
    const w=scene.scale.width,h=scene.scale.height;
    this.bg=scene.add.rectangle(w/2,h/2,w-70,h-70,0x0d1422,.99).setScrollFactor(0).setDepth(950).setStrokeStyle(2,0x526a93,1).setVisible(false);
    this.title=scene.add.text(w/2,36,'PERSONAGEM • EQUIPAMENTOS • INVENTÁRIO',{fontFamily:'Arial',fontSize:22,color:'#ecf0ff',fontStyle:'bold'}).setOrigin(.5).setScrollFactor(0).setDepth(951).setVisible(false);
    this.closeBtn=scene.add.text(w-42,24,'I • FECHAR',{fontFamily:'Arial',fontSize:11,color:'#9aa8c7',backgroundColor:'#182033',padding:{left:7,right:7,top:5,bottom:5}}).setOrigin(1,0).setScrollFactor(0).setDepth(952).setInteractive({useHandCursor:true}).setVisible(false);
    this.closeBtn.on('pointerdown',()=>this.hide());
    this.statusBg=scene.add.rectangle(w/2,112,w-120,92,0x182033,.98).setScrollFactor(0).setDepth(951).setStrokeStyle(1,0x32405f,1).setVisible(false);
    this.classText=scene.add.text(70,78,'',{fontFamily:'Arial',fontSize:17,color:'#ffd166',fontStyle:'bold'}).setScrollFactor(0).setDepth(952).setVisible(false);
    this.statsText=scene.add.text(70,110,'',{fontFamily:'Arial',fontSize:12,color:'#c8d1ea',lineSpacing:4}).setScrollFactor(0).setDepth(952).setVisible(false);
    this.xpBg=scene.add.rectangle(w-390,90,260,8,0x3a465f,1).setScrollFactor(0).setDepth(952).setVisible(false);
    this.xpFill=scene.add.rectangle(w-520,90,0,8,0x7ee0ff,1).setOrigin(0,.5).setScrollFactor(0).setDepth(953).setVisible(false);
    this.xpText=scene.add.text(w-520,102,'',{fontFamily:'Arial',fontSize:10,color:'#9aa8c7'}).setScrollFactor(0).setDepth(953).setVisible(false);
    this.attrTitle=scene.add.text(w-520,124,'',{fontFamily:'Arial',fontSize:11,color:'#ffd166'}).setScrollFactor(0).setDepth(952).setVisible(false);
    this.attrButtons=[];

    this.equipBg=scene.add.rectangle(235,356,300,300,0x182033,.98).setScrollFactor(0).setDepth(951).setStrokeStyle(1,0x32405f,1).setVisible(false);
    this.equipTitle=scene.add.text(235,218,'EQUIPAMENTOS',{fontFamily:'Arial',fontSize:16,color:'#ecf0ff',fontStyle:'bold'}).setOrigin(.5).setScrollFactor(0).setDepth(952).setVisible(false);
    this.appearance=scene.add.image(235,306,'player',1).setScale(.62).setScrollFactor(0).setDepth(953).setVisible(false);
    this.appearanceText=scene.add.text(235,382,'VISUAL DO PERSONAGEM',{fontFamily:'Arial',fontSize:10,color:'#9aa8c7'}).setOrigin(.5).setScrollFactor(0).setDepth(953).setVisible(false);

    this.invBg=scene.add.rectangle(690,356,420,300,0x182033,.98).setScrollFactor(0).setDepth(951).setStrokeStyle(1,0x32405f,1).setVisible(false);
    this.invTitle=scene.add.text(690,218,'INVENTÁRIO',{fontFamily:'Arial',fontSize:16,color:'#ecf0ff',fontStyle:'bold'}).setOrigin(.5).setScrollFactor(0).setDepth(952).setVisible(false);
    this.hint=scene.add.text(690,500,'Clique no equipamento usado para desequipar.\nClique em arma/armadura/trinket para equipar.',{fontFamily:'Arial',fontSize:10,color:'#9aa8c7',align:'center'}).setOrigin(.5).setScrollFactor(0).setDepth(953).setVisible(false);
    this.slots=[];this.rows=[];this.refresh();
  }
  isVisible(){return this.visible}
  show(){this.setVisible(true);this.refresh()}
  hide(){this.setVisible(false)}
  toggle(){this.setVisible(!this.visible); if(this.visible)this.refresh()}
  setVisible(v){this.visible=v;const arr=[this.bg,this.title,this.closeBtn,this.statusBg,this.classText,this.statsText,this.xpBg,this.xpFill,this.xpText,this.attrTitle,this.equipBg,this.equipTitle,this.appearance,this.appearanceText,this.invBg,this.invTitle,this.hint,...this.attrButtons];arr.forEach(o=>o?.setVisible(v));this.slots.forEach(s=>{s.box.setVisible(v);s.label.setVisible(v);s.value.setVisible(v)});this.rows.forEach(r=>r.setVisible(v));}
  refresh(){
    const names={warrior:'Guerreiro',mage:'Mago',ranger:'Caçador'};
    this.classText.setText(`${names[this.player.characterClass]||'Aventureiro'}  •  Nível ${this.player.level}  •  Ouro ${this.player.gold}`);
    this.statsText.setText(`HP ${this.player.hp}/${this.player.maxHp}   •   MANA ${this.player.mana}/${this.player.maxMana}\nATQ ${this.player.attackDamage}   •   DEF ${this.player.defense}   •   SPD ${this.player.speed}`);
    const need=Math.max(1,this.player.level*100);const ratio=Phaser.Math.Clamp(this.player.xp/need,0,1);this.xpFill.width=260*ratio;this.xpText.setText(`XP ${this.player.xp}/${need}`);
    this.attrTitle.setText(`Pontos de atributos disponíveis: ${this.player.attributePoints}`);
    this.buildAttrButtons(); this.buildSlots(); this.buildRows();
    this.appearance.setFrame({warrior:1,mage:5,ranger:13}[this.player.facing]??1);
  }
  buildAttrButtons(){this.attrButtons.forEach(b=>b.destroy());this.attrButtons=[];[['HP','hp'],['MANA','mana'],['ATQ','attack'],['DEF','defense']].forEach(([n,id],i)=>{const b=this.scene.add.text(350+i*67,122,`+${n}`,{fontFamily:'Arial',fontSize:10,color:'#73e6a8',backgroundColor:'#24314d',padding:5}).setOrigin(.5).setScrollFactor(0).setDepth(954).setInteractive({useHandCursor:true}).setVisible(this.visible);b.on('pointerdown',()=>{if(this.player.allocateAttribute(id)){this.refresh();this.save()}});this.attrButtons.push(b)})}
  buildSlots(){this.slots.forEach(s=>{s.box.destroy();s.label.destroy();s.value.destroy()});this.slots=[];[['weapon','ARMA'],['armor','ARMADURA'],['trinket','TRINKET']].forEach(([slot,label],i)=>{const y=275+i*78;const box=this.scene.add.rectangle(235,y,260,58,0x24314d,1).setScrollFactor(0).setDepth(954).setStrokeStyle(1,0x4a5e82,1).setInteractive({useHandCursor:true}).setVisible(this.visible);const l=this.scene.add.text(108,y-18,label,{fontFamily:'Arial',fontSize:9,color:'#9aa8c7'}).setScrollFactor(0).setDepth(955).setVisible(this.visible);const id=this.equipment.slots[slot];const item=getItemDefinition(id);const value=this.scene.add.text(108,y+1,item?`${item.name}\n${this.describe(item)}`:'Vazio',{fontFamily:'Arial',fontSize:10,color:item?this.color(item.rarity):'#9aa8c7',wordWrap:{width:230}}).setScrollFactor(0).setDepth(955).setVisible(this.visible);box.on('pointerdown',()=>{if(this.equipment.unequip(slot,this.inv)){this.refresh();this.save()}});this.slots.push({box,label:l,value})})}
  buildRows(){this.rows.forEach(r=>r.destroy());this.rows=[];const items=this.inv.items||[];const rows=items.slice(0,14);if(!rows.length){const empty=this.scene.add.text(690,330,'Inventário vazio',{fontFamily:'Arial',fontSize:14,color:'#9aa8c7'}).setOrigin(.5).setScrollFactor(0).setDepth(955).setVisible(this.visible);this.rows.push(empty);return}rows.forEach((entry,i)=>{const item=getItemDefinition(entry.id);const col=i%2,row=Math.floor(i/2);const x=575+col*210,y=255+row*32;const t=this.scene.add.text(x,y,`${item?.name||entry.id} x${entry.qty}`,{fontFamily:'Arial',fontSize:10,color:item?this.color(item.rarity):'#ecf0ff',backgroundColor:'#24314d',padding:{left:6,right:6,top:4,bottom:4},fixedWidth:195}).setOrigin(.5).setScrollFactor(0).setDepth(955).setInteractive({useHandCursor:true}).setVisible(this.visible);t.on('pointerdown',()=>{if(item&&['weapon','armor','trinket'].includes(item.type)&&this.equipment.equip(item.id,this.inv)){this.refresh();this.save()}});this.rows.push(t)})}
  describe(item){return Object.entries(item.stats||{}).filter(([,v])=>v).map(([k,v])=>`+${v} ${({attack:'ATQ',defense:'DEF',hp:'HP',mana:'MP',speed:'SPD'}[k]||k)}`).join(' • ')}
  color(r){return rarityColor(r)}
}
