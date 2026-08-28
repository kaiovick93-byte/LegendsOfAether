// @ts-nocheck
import {getItemDefinition,rarityColor} from '../items/itemCatalog';
import {appearanceFor} from '../character/PlayerAppearance';

export class CharacterInventoryPanel{
  constructor(scene,player,inventory,equipment,save){
    this.scene=scene;this.player=player;this.inv=inventory;this.equipment=equipment;this.save=save;this.visible=false;
    const w=scene.scale.width,h=scene.scale.height;
    const top=24;
    this.bg=scene.add.rectangle(w/2,h/2,w-36,h-30,0x0d1422,.99).setScrollFactor(0).setDepth(950).setStrokeStyle(2,0x526a93,1).setVisible(false);
    this.title=scene.add.text(w/2,top+10,'PERSONAGEM • EQUIPAMENTOS • INVENTÁRIO',{fontFamily:'Arial',fontSize:20,color:'#ecf0ff',fontStyle:'bold'}).setOrigin(.5).setScrollFactor(0).setDepth(951).setVisible(false);
    this.closeBtn=scene.add.text(w-26,top+4,'I • FECHAR',{fontFamily:'Arial',fontSize:11,color:'#9aa8c7',backgroundColor:'#182033',padding:{left:7,right:7,top:4,bottom:4}}).setOrigin(1,0).setScrollFactor(0).setDepth(952).setInteractive({useHandCursor:true}).setVisible(false);
    this.closeBtn.on('pointerdown',()=>this.hide());

    this.statusBg=scene.add.rectangle(w/2,112,w-70,94,0x182033,.98).setScrollFactor(0).setDepth(951).setStrokeStyle(1,0x32405f,1).setVisible(false);
    this.classText=scene.add.text(38,78,'',{fontFamily:'Arial',fontSize:16,color:'#ffd166',fontStyle:'bold'}).setScrollFactor(0).setDepth(952).setVisible(false);
    this.statsText=scene.add.text(38,104,'',{fontFamily:'Arial',fontSize:11,color:'#c8d1ea',lineSpacing:3}).setScrollFactor(0).setDepth(952).setVisible(false);
    this.xpBg=scene.add.rectangle(w-400,76,230,7,0x3a465f,1).setOrigin(.5).setScrollFactor(0).setDepth(952).setVisible(false);
    this.xpFill=scene.add.rectangle(w-515,76,0,7,0x7ee0ff,1).setOrigin(0,.5).setScrollFactor(0).setDepth(953).setVisible(false);
    this.xpText=scene.add.text(w-515,90,'',{fontFamily:'Arial',fontSize:10,color:'#9aa8c7'}).setScrollFactor(0).setDepth(953).setVisible(false);

    this.attrTitle=scene.add.text(w-515,107,'',{fontFamily:'Arial',fontSize:11,color:'#ffd166'}).setScrollFactor(0).setDepth(952).setVisible(false);
    this.attrButtons=[];this.buildAttrButtons();

    this.equipBg=scene.add.rectangle(225,350,350,320,0x182033,.98).setScrollFactor(0).setDepth(951).setStrokeStyle(1,0x32405f,1).setVisible(false);
    this.equipTitle=scene.add.text(225,205,'EQUIPAMENTOS / APARÊNCIA',{fontFamily:'Arial',fontSize:15,color:'#ecf0ff',fontStyle:'bold'}).setOrigin(.5).setScrollFactor(0).setDepth(952).setVisible(false);
    this.appearanceBg=scene.add.rectangle(125,365,130,215,0x111827,1).setScrollFactor(0).setDepth(952).setStrokeStyle(1,0x3f5072,1).setVisible(false);
    this.appearance=scene.add.image(125,350,player.getTextureKey(),player.getIdleFrame()).setScale(1.18).setScrollFactor(0).setDepth(954).setVisible(false);
    this.appearanceText=scene.add.text(125,495,'APARÊNCIA',{fontFamily:'Arial',fontSize:10,color:'#9aa8c7'}).setOrigin(.5).setScrollFactor(0).setDepth(955).setVisible(false);

    this.slotArea=[];this.buildSlots();

    this.invBg=scene.add.rectangle(700,365,420,350,0x182033,.98).setScrollFactor(0).setDepth(951).setStrokeStyle(1,0x32405f,1).setVisible(false);
    this.invTitle=scene.add.text(700,205,'INVENTÁRIO — ITENS',{fontFamily:'Arial',fontSize:15,color:'#ecf0ff',fontStyle:'bold'}).setOrigin(.5).setScrollFactor(0).setDepth(952).setVisible(false);
    this.hint=scene.add.text(700,520,'Clique em um equipamento para equipar.\nClique no slot equipado para desequipar.',{fontFamily:'Arial',fontSize:10,color:'#9aa8c7',align:'center'}).setOrigin(.5).setScrollFactor(0).setDepth(953).setVisible(false);
    this.rows=[];this.refresh();
  }
  isVisible(){return this.visible}
  show(){this.setVisible(true);this.refresh()}
  hide(){this.setVisible(false)}
  toggle(){this.setVisible(!this.visible);if(this.visible)this.refresh()}
  setVisible(v){
    this.visible=v;
    [this.bg,this.title,this.closeBtn,this.statusBg,this.classText,this.statsText,this.xpBg,this.xpFill,this.xpText,this.attrTitle,this.equipBg,this.equipTitle,this.appearanceBg,this.appearance,this.appearanceText,this.invBg,this.invTitle,this.hint,...this.attrButtons].forEach(o=>o?.setVisible(v));
    this.slotArea.forEach(s=>{s.box.setVisible(v);s.label.setVisible(v);s.value.setVisible(v)});
    this.rows.forEach(r=>r.setVisible(v));
  }
  buildAttrButtons(){
    [['HP','hp'],['MANA','mana'],['ATQ','attack'],['DEF','defense']].forEach(([name,id],i)=>{
      const b=this.scene.add.text(358+i*70,142,`+${name}`,{fontFamily:'Arial',fontSize:9,color:'#73e6a8',backgroundColor:'#24314d',padding:{left:5,right:5,top:4,bottom:4}})
        .setOrigin(.5).setScrollFactor(0).setDepth(954).setInteractive({useHandCursor:true}).setVisible(false);
      b.on('pointerdown',()=>{if(this.player.allocateAttribute(id)){this.refresh();this.save()}});
      this.attrButtons.push(b);
    });
  }
  buildSlots(){
    const defs=[['weapon','ARMA'],['armor','ARMADURA'],['trinket','TRINKET']];
    defs.forEach(([slot,label],i)=>{
      const y=270+i*84;
      const box=this.scene.add.rectangle(355,y,155,62,0x24314d,1).setScrollFactor(0).setDepth(954).setStrokeStyle(1,0x4a5e82,1).setInteractive({useHandCursor:true}).setVisible(false);
      const l=this.scene.add.text(285,y-20,label,{fontFamily:'Arial',fontSize:9,color:'#9aa8c7'}).setScrollFactor(0).setDepth(955).setVisible(false);
      const value=this.scene.add.text(285,y-1,'Vazio',{fontFamily:'Arial',fontSize:10,color:'#9aa8c7',wordWrap:{width:135}}).setScrollFactor(0).setDepth(955).setVisible(false);
      box.on('pointerdown',()=>{if(this.equipment.unequip(slot,this.inv)){this.refresh();this.save()}});
      this.slotArea.push({slot,label:l,box,value});
    });
  }
  refresh(){
    const names={warrior:'Guerreiro',mage:'Mago',ranger:'Caçador'};
    const appearance=appearanceFor(this.player.appearanceId);
    this.classText.setText(`${names[this.player.characterClass]||'Aventureiro'} • ${appearance.genderLabel}  •  Nível ${this.player.level}  •  Ouro ${this.player.gold}`);
    this.appearance.setTexture(this.player.getTextureKey(),this.player.getIdleFrame());
    this.statsText.setText(`HP ${this.player.hp}/${this.player.maxHp}   MANA ${this.player.mana}/${this.player.maxMana}\nATQ ${this.player.attackDamage}   DEF ${this.player.defense}   SPD ${this.player.speed}`);
    const need=Math.max(1,this.player.level*100),ratio=Phaser.Math.Clamp(this.player.xp/need,0,1);
    this.xpFill.width=230*ratio;this.xpText.setText(`XP ${this.player.xp}/${need}`);
    this.attrTitle.setText(`Pontos de atributos disponíveis: ${this.player.attributePoints||0}`);

    for(const s of this.slotArea){
      const id=this.equipment.slots[s.slot],item=getItemDefinition(id);
      s.value.setText(item?`${item.name}\n${this.describe(item)}`:'Vazio');
      s.value.setColor(item?rarityTextColor(item.rarity):'#9aa8c7');
    }

    this.rows.forEach(r=>r.destroy());this.rows=[];
    const items=this.inv.items||[];
    if(!items.length){
      this.rows.push(this.scene.add.text(700,330,'Nenhum item no inventário',{fontFamily:'Arial',fontSize:14,color:'#9aa8c7'}).setOrigin(.5).setScrollFactor(0).setDepth(955).setVisible(this.visible));
      return;
    }
    items.slice(0,16).forEach((entry,i)=>{
      const item=getItemDefinition(entry.id),col=i%2,row=Math.floor(i/2),x=605+col*190,y=245+row*45;
      const card=this.scene.add.rectangle(x,y,180,36,0x24314d,1).setScrollFactor(0).setDepth(954).setStrokeStyle(1,0x3a4b6a,1).setVisible(this.visible);
      const text=this.scene.add.text(x,y,`${item?.name||entry.id}  x${entry.qty}`,{fontFamily:'Arial',fontSize:10,color:item?rarityTextColor(item.rarity):'#ecf0ff',align:'center',wordWrap:{width:166}}).setOrigin(.5).setScrollFactor(0).setDepth(955).setVisible(this.visible);
      const hit=item&&['weapon','armor','trinket'].includes(item.type);
      if(hit){
        card.setInteractive({useHandCursor:true});text.setInteractive({useHandCursor:true});
        const equip=()=>{if(this.equipment.equip(item.id,this.inv)){this.refresh();this.save()}};
        card.on('pointerdown',equip);text.on('pointerdown',equip);
      }
      this.rows.push(card,text);
    });
  }
  describe(item){return Object.entries(item.stats||{}).filter(([,v])=>v).map(([k,v])=>`+${v} ${({attack:'ATQ',defense:'DEF',hp:'HP',mana:'MP',speed:'SPD'}[k]||k)}`).join(' • ')}
}
function rarityTextColor(r){return r==='legendary'?'#ffd166':r==='epic'?'#c084fc':r==='rare'?'#7ee0ff':r==='uncommon'?'#73e6a8':'#ecf0ff'}
