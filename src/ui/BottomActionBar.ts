// @ts-nocheck
export class BottomActionBar {
  constructor(private scene, private player, private abilities, private getItemCount){
    const w=scene.scale.width,h=scene.scale.height;
    this.root=scene.add.container(w/2,h).setScrollFactor(0).setDepth(700);
    // Moldura nativa da revisão: 2 consumíveis + 8 habilidades + 4 comandos.
    // Em telas estreitas o conjunto inteiro reduz uniformemente; a arte nunca
    // é esticada em apenas um eixo.
    this.frameWidth=1320;
    this.frameHeight=154;
    this.frame=scene.add.image(0,0,'bottom_hud_frame').setOrigin(.5,1);
    this.root.add(this.frame);

    const orbX=this.frameWidth*.433;
    const orbY=-this.frameHeight*.51;
    const orbRadius=this.frameHeight*.225;
    this.hpBack=scene.add.circle(-orbX,orbY,orbRadius,0x17070c,.88);
    this.hpOrb=scene.add.arc(-orbX,orbY,orbRadius-2,-90,270,false,0xc53c52,.94);
    this.hpShine=scene.add.circle(-orbX-9,orbY-11,orbRadius*.34,0xff9aac,.14);
    this.hpText=scene.add.text(-orbX,orbY-1,'',{fontFamily:'Georgia, serif',fontSize:12,color:'#fff6f4',fontStyle:'bold',stroke:'#28070d',strokeThickness:3,align:'center'}).setOrigin(.5);
    this.manaBack=scene.add.circle(orbX,orbY,orbRadius,0x06111d,.9);
    this.manaOrb=scene.add.arc(orbX,orbY,orbRadius-2,-90,270,false,0x347fca,.95);
    this.manaShine=scene.add.circle(orbX-9,orbY-11,orbRadius*.34,0x9ed4ff,.14);
    this.manaText=scene.add.text(orbX,orbY-1,'',{fontFamily:'Georgia, serif',fontSize:12,color:'#f2f8ff',fontStyle:'bold',stroke:'#06162c',strokeThickness:3,align:'center'}).setOrigin(.5);
    this.root.add([this.hpBack,this.hpOrb,this.hpShine,this.hpText,this.manaBack,this.manaOrb,this.manaShine,this.manaText]);

    this.statusText=scene.add.text(0,-132,'',{fontFamily:'Georgia, serif',fontSize:10,color:'#e4c77c',fontStyle:'bold',stroke:'#080c12',strokeThickness:2}).setOrigin(.5);
    this.root.add(this.statusText);

    this.slotBacks=[];
    this.slotTexts=[];
    this.slotIcons=[];
    this.slotKeyTexts=[];
    const slotWidth=52,slotGap=6,slotY=-76;
    const firstX=-(slotWidth+slotGap)*6.5;
    const iconTextures={0:'hud_action_healing',1:'hud_action_mana',10:'hud_action_skills',11:'hud_action_inventory',12:'hud_action_controls',13:'hud_action_menu'};
    const commandKeys={0:'H',1:'M',10:'K',11:'I',12:'C',13:'P'};
    for(let index=0;index<14;index++){
      const x=firstX+index*(slotWidth+slotGap);
      const special=index<2||index>=10;
      const back=scene.add.rectangle(x,slotY,slotWidth,58,0x101a2a,.92)
        .setStrokeStyle(1.35,special?0xb28a45:index<6?0x8d713d:0x52627b,.96);
      const text=scene.add.text(x,slotY+20,'',{fontFamily:'Arial',fontSize:7,color:'#eef2f8',fontStyle:'bold',align:'center',lineSpacing:1,wordWrap:{width:slotWidth-4}}).setOrigin(.5);
      this.root.add([back,text]);
      this.slotBacks.push(back);
      this.slotTexts.push(text);
      if(special){
        const icon=scene.add.image(x,slotY-6,iconTextures[index]).setDisplaySize(30,30);
        const key=scene.add.text(x-slotWidth*.39,slotY-25,commandKeys[index],{fontFamily:'Arial',fontSize:9,color:'#fff2c0',fontStyle:'bold',stroke:'#080c12',strokeThickness:2}).setOrigin(.5);
        this.root.add([icon,key]);
        this.slotIcons[index]=icon;
        this.slotKeyTexts[index]=key;
      }
    }

    this.xpBg=scene.add.rectangle(-278,-37,556,5,0x202b3d,1).setOrigin(0,.5);
    this.xpFill=scene.add.rectangle(-278,-37,0,5,0x68b8d8,1).setOrigin(0,.5);
    this.xpText=scene.add.text(0,-26,'',{fontFamily:'Arial',fontSize:9,color:'#aebcd0',fontStyle:'bold',stroke:'#080c12',strokeThickness:2}).setOrigin(.5);
    this.root.add([this.xpBg,this.xpFill,this.xpText]);
    this.visible=true;
    this.resizeHandler=(gameSize)=>this.layout(gameSize.width,gameSize.height);
    scene.scale.on(Phaser.Scale.Events.RESIZE,this.resizeHandler);
    scene.events.once('shutdown',()=>scene.scale.off(Phaser.Scale.Events.RESIZE,this.resizeHandler));
    this.layout(w,h);
    this.update();
  }

  layout(width,height){
    const scale=Math.min(1,width/this.frameWidth);
    this.root.setPosition(width/2,height).setScale(scale);
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
    this.slotTexts[0].setText(`VIDA ×${this.getItemCount('healing_potion')}`);
    this.slotTexts[1].setText(`MANA ×${this.getItemCount('mana_potion')}`);

    const classNames={warrior:'GUERREIRO',mage:'MAGO',ranger:'CAÇADOR'};
    this.statusText.setText(`${classNames[this.player.characterClass]||'AVENTUREIRO'}  •  NÍVEL ${this.player.level}  •  OURO ${this.player.gold}`);
    const need=Math.max(1,this.player.level*100);
    this.xpFill.width=556*Phaser.Math.Clamp(this.player.xp/need,0,1);
    this.xpText.setText(`XP ${this.player.xp}/${need}`);

    const loadout=this.abilities.loadout();
    const abilitySlots=[
      {id:'primary',key:'Q'},
      {id:'secondary',key:'1'},
      {id:'mobility',key:'2'}
    ];
    for(let index=0;index<3;index++){
      const visualIndex=index+2;
      const slot=abilitySlots[index];
      const definition=loadout[slot.id];
      const cooldown=this.abilities.cooldown(slot.id);
      const rank=this.player.scene.skillManager?.getRank(slot.id)||0;
      const mana=definition[1]+Math.max(0,rank-1)*3;
      const state=rank<=0?'BLOQ.':cooldown>0?`${(cooldown/1000).toFixed(1)}s`:`${mana} MP`;
      this.slotTexts[visualIndex].setPosition(this.slotTexts[visualIndex].x,-76).setFontSize(7.5)
        .setText(`${slot.key}\n${definition[0]}\n${state}`)
        .setColor(rank<=0?'#758299':cooldown>0?'#a6afbd':'#f2f4f7');
      this.slotBacks[visualIndex].setFillStyle(rank<=0?0x0c121d:cooldown>0?0x151c28:0x101a2a,.92);
    }
    this.slotTexts[5].setPosition(this.slotTexts[5].x,-76).setFontSize(7.5).setText('ESPAÇO\nATAQUE\nBÁSICO').setColor('#f2f4f7');
    this.slotBacks[5].setFillStyle(0x171824,.94);
    for(let index=6;index<10;index++){
      this.slotTexts[index].setPosition(this.slotTexts[index].x,-76).setFontSize(7.5).setText(`${index-3}\n—\nVAZIO`).setColor('#66748a');
      this.slotBacks[index].setFillStyle(0x0b111b,.86);
    }
    this.slotTexts[10].setText('SKILLS');
    this.slotTexts[11].setText('INVENTÁRIO');
    this.slotTexts[12].setText('CONTROLES');
    this.slotTexts[13].setText('MENU');
  }

  destroy(){this.scene.scale.off(Phaser.Scale.Events.RESIZE,this.resizeHandler);this.root.destroy(true)}
}
