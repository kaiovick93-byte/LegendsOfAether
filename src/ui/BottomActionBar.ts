// @ts-nocheck
export class BottomActionBar {
  constructor(private scene, private player, private abilities, private getItemCount){
    const w=scene.scale.width,h=scene.scale.height;
    this.root=scene.add.container(w/2,h).setScrollFactor(0).setDepth(700);
    this.frameWidth=Math.min(960,w);
    this.frameHeight=154*(this.frameWidth/960);
    this.frame=scene.add.image(0,0,'bottom_hud_frame').setOrigin(.5,1).setDisplaySize(this.frameWidth,this.frameHeight);
    this.root.add(this.frame);

    const orbX=this.frameWidth*.405;
    const orbY=-this.frameHeight*.51;
    const orbRadius=this.frameHeight*.225;
    this.hpBack=scene.add.circle(-orbX,orbY,orbRadius,0x17070c,.88);
    this.hpOrb=scene.add.arc(-orbX,orbY,orbRadius-2,-90,270,false,0xc53c52,.94);
    this.hpShine=scene.add.circle(-orbX-9,orbY-11,orbRadius*.34,0xff9aac,.14);
    this.hpText=scene.add.text(-orbX,orbY-1,'',{fontFamily:'Georgia, serif',fontSize:11,color:'#fff6f4',fontStyle:'bold',stroke:'#28070d',strokeThickness:3,align:'center'}).setOrigin(.5);
    this.hpPotion=scene.add.text(-orbX,orbY+orbRadius+8,'',{fontFamily:'Arial',fontSize:8,color:'#edcfd3',fontStyle:'bold',stroke:'#090d14',strokeThickness:2}).setOrigin(.5);

    this.manaBack=scene.add.circle(orbX,orbY,orbRadius,0x06111d,.9);
    this.manaOrb=scene.add.arc(orbX,orbY,orbRadius-2,-90,270,false,0x347fca,.95);
    this.manaShine=scene.add.circle(orbX-9,orbY-11,orbRadius*.34,0x9ed4ff,.14);
    this.manaText=scene.add.text(orbX,orbY-1,'',{fontFamily:'Georgia, serif',fontSize:11,color:'#f2f8ff',fontStyle:'bold',stroke:'#06162c',strokeThickness:3,align:'center'}).setOrigin(.5);
    this.manaPotion=scene.add.text(orbX,orbY+orbRadius+8,'',{fontFamily:'Arial',fontSize:8,color:'#c8e3ff',fontStyle:'bold',stroke:'#090d14',strokeThickness:2}).setOrigin(.5);
    this.root.add([this.hpBack,this.hpOrb,this.hpShine,this.hpText,this.hpPotion,this.manaBack,this.manaOrb,this.manaShine,this.manaText,this.manaPotion]);

    this.statusText=scene.add.text(0,-131,'',{fontFamily:'Georgia, serif',fontSize:8,color:'#e4c77c',fontStyle:'bold',stroke:'#080c12',strokeThickness:2}).setOrigin(.5);
    this.commands=scene.add.text(0,-116,'H • VIDA   M • MANA   I • INVENTÁRIO   K • HABILIDADES   C • CONTROLES   P • PAUSA',{fontFamily:'Arial',fontSize:7,color:'#bac8dc',fontStyle:'bold',stroke:'#080c12',strokeThickness:2}).setOrigin(.5);
    this.root.add([this.statusText,this.commands]);

    this.slotBacks=[];
    this.slotTexts=[];
    const slotWidth=57,slotGap=6,slotY=-75;
    const firstX=-(slotWidth+slotGap)*3.5;
    for(let index=0;index<8;index++){
      const x=firstX+index*(slotWidth+slotGap);
      const back=scene.add.rectangle(x,slotY,slotWidth,56,0x101a2a,.9).setStrokeStyle(1.4,index<4?0xa27c3e:0x52627b,.95);
      const text=scene.add.text(x,slotY,'',{fontFamily:'Arial',fontSize:8,color:'#eef2f8',fontStyle:'bold',align:'center',lineSpacing:1,wordWrap:{width:slotWidth-5}}).setOrigin(.5);
      this.root.add([back,text]);
      this.slotBacks.push(back);
      this.slotTexts.push(text);
    }

    this.xpBg=scene.add.rectangle(-218,-37,436,5,0x202b3d,1).setOrigin(0,.5);
    this.xpFill=scene.add.rectangle(-218,-37,0,5,0x68b8d8,1).setOrigin(0,.5);
    this.xpText=scene.add.text(0,-26,'',{fontFamily:'Arial',fontSize:7,color:'#aebcd0',fontStyle:'bold',stroke:'#080c12',strokeThickness:2}).setOrigin(.5);
    this.root.add([this.xpBg,this.xpFill,this.xpText]);
    this.visible=true;
    this.update();
  }

  setVisible(value){this.visible=value;this.root.setVisible(value)}

  update(){
    if(!this.visible)return;
    const healthRatio=Phaser.Math.Clamp(this.player.hp/Math.max(1,this.player.maxHp),0,1);
    const manaRatio=Phaser.Math.Clamp(this.player.mana/Math.max(1,this.player.maxMana),0,1);
    this.hpOrb.setEndAngle(-90+360*healthRatio).setAlpha(.54+.41*healthRatio);
    this.manaOrb.setEndAngle(-90+360*manaRatio).setAlpha(.54+.41*manaRatio);
    this.hpText.setText(`HP\n${this.player.hp}/${this.player.maxHp}`);
    this.manaText.setText(`MANA\n${this.player.mana}/${this.player.maxMana}`);
    this.hpPotion.setText(`H • POÇÃO ×${this.getItemCount('healing_potion')}`);
    this.manaPotion.setText(`M • POÇÃO ×${this.getItemCount('mana_potion')}`);

    const classNames={warrior:'GUERREIRO',mage:'MAGO',ranger:'CAÇADOR'};
    this.statusText.setText(`${classNames[this.player.characterClass]||'AVENTUREIRO'}  •  NÍVEL ${this.player.level}  •  OURO ${this.player.gold}`);
    const need=Math.max(1,this.player.level*100);
    this.xpFill.width=436*Phaser.Math.Clamp(this.player.xp/need,0,1);
    this.xpText.setText(`XP ${this.player.xp}/${need}`);

    const loadout=this.abilities.loadout();
    const abilitySlots=[
      {id:'primary',key:'Q'},
      {id:'secondary',key:'1'},
      {id:'mobility',key:'2'}
    ];
    for(let index=0;index<3;index++){
      const slot=abilitySlots[index];
      const definition=loadout[slot.id];
      const cooldown=this.abilities.cooldown(slot.id);
      const rank=this.player.scene.skillManager?.getRank(slot.id)||0;
      const mana=definition[1]+Math.max(0,rank-1)*3;
      const state=rank<=0?'BLOQUEADA':cooldown>0?`${(cooldown/1000).toFixed(1)}s`:`${mana} MP`;
      this.slotTexts[index].setText(`${slot.key}\n${definition[0]}\n${state}`);
      this.slotTexts[index].setColor(rank<=0?'#758299':cooldown>0?'#a6afbd':'#f2f4f7');
      this.slotBacks[index].setFillStyle(rank<=0?0x0c121d:cooldown>0?0x151c28:0x101a2a,.92);
    }
    this.slotTexts[3].setText('ESPAÇO\nATAQUE\nBÁSICO').setColor('#f2f4f7');
    this.slotBacks[3].setFillStyle(0x171824,.94);
    for(let index=4;index<8;index++){
      this.slotTexts[index].setText(`${index-1}\n—\nVAZIO`).setColor('#66748a');
      this.slotBacks[index].setFillStyle(0x0b111b,.86);
    }
  }

  destroy(){this.root.destroy(true)}
}
