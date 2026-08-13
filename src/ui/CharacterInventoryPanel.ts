// @ts-nocheck
import {getItemDefinition,rarityColor} from '../items/itemCatalog';
export class CharacterInventoryPanel{
 constructor(scene,player,inventory,equipment,save){
  this.scene=scene;this.player=player;this.inv=inventory;this.equipment=equipment;this.save=save;this.visible=false;
  const w=scene.scale.width,h=scene.scale.height;
  this.bg=scene.add.rectangle(w/2,h/2,w-50,h-38,0x0d1422,.99).setScrollFactor(0).setDepth(950).setStrokeStyle(2,0x526a93,1).setVisible(false);
  this.title=scene.add.text(w/2,28,'PERSONAGEM • EQUIPAMENTOS • INVENTÁRIO',{fontFamily:'Arial',fontSize:21,color:'#ecf0ff',fontStyle:'bold'}).setOrigin(.5).setScrollFactor(0).setDepth(951).setVisible(false);
  this.closeBtn=scene.add.text(w-30,17,'I • FECHAR',{fontFamily:'Arial',fontSize:11,color:'#9aa8c7',backgroundColor:'#182033',padding:{left:7,right:7,top:4,bottom:4}}).setOrigin(1,0).setScrollFactor(0).setDepth(952).setInteractive({useHandCursor:true}).setVisible(false);this.closeBtn.on('pointerdown',()=>this.hide());
  // compact status row
  this.statusBg=scene.add.rectangle(w/2,88,w-90,82,0x182033,.98).setScrollFactor(0).setDepth(951).setStrokeStyle(1,0x32405f,1).setVisible(false);
  this.classText=scene.add.text(45,58,'',{fontFamily:'Arial',fontSize:16,color:'#ffd166',fontStyle:'bold'}).setScrollFactor(0).setDepth(952).setVisible(false);
  this.statsText=scene.add.text(45,86,'',{fontFamily:'Arial',fontSize:11,color:'#c8d1ea',lineSpacing:3}).setScrollFactor(0).setDepth(952).setVisible(false);
  this.xpBg=scene.add.rectangle(w-380,67,230,7,0x3a465f,1).setOrigin(.5).setScrollFactor(0).setDepth(952).setVisible(false);this.xpFill=scene.add.rectangle(w-495,67,0,7,0x7ee0ff,1).setOrigin(0,.5).setScrollFactor(0).setDepth(953).setVisible(false);this.xpText=scene.add.text(w-495,80,'',{fontFamily:'Arial',fontSize:10,color:'#9aa8c7'}).setScrollFactor(0).setDepth(953).setVisible(false);
  this.attrTitle=scene.add.text(w-495,96,'',{fontFamily:'Arial',fontSize:11,color:'#ffd166'}).setScrollFactor(0).setDepth(952).setVisible(false);this.attrButtons=[];
  this.buildAttrButtons();
  // equipment + appearance area
  this.equipBg=scene.add.rectangle(250,335,330,300,0x182033,.98).setScrollFactor(0).setDepth(951).setStrokeStyle(1,0x32405f,1).setVisible(false);
  this.equipTitle=scene.add.text(250,198,'EQUIPAMENTOS',{fontFamily:'Arial',fontSize:15,color:'#ecf0ff',fontStyle:'bold'}).setOrigin(.5).setScrollFactor(0).setDepth(952).setVisible(false);
  this.appearanceBg=scene.add.rectangle(250,340,120,190,0x111827,1).setScrollFactor(0).setDepth(952).setStrokeStyle(1,0x3f5072,1).setVisible(false);
  this.appearance=scene.add.image(250,335,'player',1).setScale(.55).setScrollFactor(0).setDepth(954).setVisible(false);
  this.appearanceText=scene.add.text(250,425,'VISUAL',{fontFamily:'Arial',fontSize:10,color:'#9aa8c7'}).setOrigin(.5).setScrollFactor(0).setDepth(955).setVisible(false);
  this.slotArea=[];this.buildSlots();
  // inventory area
  this.invBg=scene.add.rectangle(700,380,420,340,0x182033,.98).setScrollFactor(0).setDepth(951).setStrokeStyle(1,0x32405f,1).setVisible(false);
  this.invTitle=scene.add.text(700,198,'INVENTÁRIO — ITENS',{fontFamily:'Arial',fontSize:15,color:'#ecf0ff',fontStyle:'bold'}).setOrigin(.5).setScrollFactor(0).setDepth(952).setVisible(false);
  this.hint=scene.add.text(700,520,'Clique em arma/armadura/trinket para equipar.\\nClique no equipamento usado para desequipar.',{fontFamily:'Arial',fontSize:10,color:'#9aa8c7',align:'center'}).setOrigin(.5).setScrollFactor(0).setDepth(953).setVisible(false);
  this.rows=[];this.refresh();
 }
 isVisible(){return this.visible}
 show(){this.setVisible(true);this.refresh()} hide(){this.setVisible(false)} toggle(){this.setVisible(!this.visible);if(this.visible)this.refresh()}
 setVisible(v){this.visible=v;[this.bg,this.title,this.closeBtn,this.statusBg,this.classText,this.statsText,this.xpBg,this.xpFill,this.xpText,this.attrTitle,this.equipBg,this.equipTitle,this.appearanceBg,this.appearance,this.appearanceText,this.invBg,this.invTitle,this.hint,...this.attrButtons].forEach(o=>o?.setVisible(v));this.slotArea.forEach(s=>{s.box.setVisible(v);s.label.setVisible(v);s.value.setVisible(v)});this.rows.forEach(r=>r.setVisible(v))}
 buildAttrButtons(){[['HP','hp'],['MANA','mana'],['ATQ','attack'],['DEF','defense']].forEach(([name,id],i)=>{const b=this.scene.add.text(355+i*70,115,`+${name}`,{fontFamily:'Arial',fontSize:9,color:'#73e6a8',backgroundColor:'#24314d',padding:4}).setOrigin(.5).setScrollFactor(0).setDepth(954).setInteractive({useHandCursor:true}).setVisible(false);b.on('pointerdown',()=>{if(this.player.allocateAttribute(id)){this.refresh();this.save()}});this.attrButtons.push(b)})}
 buildSlots(){const defs=[['weapon','ARMA'],['armor','ARMADURA'],['trinket','TRINKET']];defs.forEach(([slot,label],i)=>{const y=272+i*80;const box=this.scene.add.rectangle(390,y,160,58,0x24314d,1).setScrollFactor(0).setDepth(954).setStrokeStyle(1,0x4a5e82,1).setInteractive({useHandCursor:true}).setVisible(false);const l=this.scene.add.text(315,y-20,label,{fontFamily:'Arial',fontSize:9,color:'#9aa8c7'}).setScrollFactor(0).setDepth(955).setVisible(false);this.slotArea.push({slot,label:l,box,value:null})})
  for(const s of this.slotArea){s.value=this.scene.add.text(315,s.box.y-1,'Vazio',{fontFamily:'Arial',fontSize:10,color:'#9aa8c7',wordWrap:{width:145}}).setScrollFactor(0).setDepth(955).setVisible(false);s.box.on('pointerdown',()=>{if(this.equipment.unequip(s.slot,this.inv)){this.refresh();this.save()}})}
 }
 refresh(){const names={warrior:'Guerreiro',mage:'Mago',ranger:'Caçador'};this.classText.setText(`${names[this.player.characterClass]||'Aventureiro'} • Nível ${this.player.level} • Ouro ${this.player.gold}`);this.statsText.setText(`HP ${this.player.hp}/${this.player.maxHp}   MANA ${this.player.mana}/${this.player.maxMana}\nATQ ${this.player.attackDamage}   DEF ${this.player.defense}   SPD ${this.player.speed}`);const need=Math.max(1,this.player.level*100),ratio=Phaser.Math.Clamp(this.player.xp/need,0,1);this.xpFill.width=230*ratio;this.xpText.setText(`XP ${this.player.xp}/${need}`);this.attrTitle.setText(`Pontos de atributos disponíveis: ${this.player.attributePoints}`);
  const offsets=this.slotArea;for(const s of offsets){const id=this.equipment.slots[s.slot],item=getItemDefinition(id);s.value.setText(item?`${item.name}\n${this.describe(item)}`:'Vazio');s.value.setColor(item?this.color(item.rarity):'#9aa8c7')}
  this.rows.forEach(r=>r.destroy());this.rows=[];const items=this.inv.items||[];if(!items.length){const e=this.scene.add.text(700,340,'Nenhum item no inventário',{fontFamily:'Arial',fontSize:14,color:'#9aa8c7'}).setOrigin(.5).setScrollFactor(0).setDepth(955).setVisible(this.visible);this.rows.push(e)}else items.slice(0,16).forEach((entry,i)=>{const item=getItemDefinition(entry.id),col=i%2,row=Math.floor(i/2),x=600+col*200,y=245+row*38;const t=this.scene.add.text(x,y,`${item?.name||entry.id} x${entry.qty}`,{fontFamily:'Arial',fontSize:10,color:item?this.color(item.rarity):'#ecf0ff',backgroundColor:'#24314d',padding:{left:7,right:7,top:5,bottom:5},fixedWidth:188}).setOrigin(.5).setScrollFactor(0).setDepth(955).setInteractive({useHandCursor:true}).setVisible(this.visible);t.on('pointerdown',()=>{if(item&&['weapon','armor','trinket'].includes(item.type)&&this.equipment.equip(item.id,this.inv)){this.refresh();this.save()}});this.rows.push(t)});
  this.appearance.setFrame({warrior:1,mage:5,ranger:13}[this.player.facing]??1);
 }
 describe(item){return Object.entries(item.stats||{}).filter(([,v])=>v).map(([k,v])=>`+${v} ${({attack:'ATQ',defense:'DEF',hp:'HP',mana:'MP',speed:'SPD'}[k]||k)}`).join(' • ')}
 color(r){return rarityColor(r)}
}
