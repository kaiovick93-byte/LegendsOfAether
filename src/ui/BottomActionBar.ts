// @ts-nocheck
export class BottomActionBar {
  constructor(private scene, private player, private abilities, private getItemCount, private onAction=()=>{}){
    const w=scene.scale.width,h=scene.scale.height;
    this.root=scene.add.container(w/2,h).setScrollFactor(0).setDepth(700);
    this.tooltip=scene.add.container(0,-188).setVisible(false);
    this.tooltipBg=scene.add.graphics();
    this.tooltipText=scene.add.text(0,0,'',{fontFamily:'Georgia, serif',fontSize:10,color:'#273342',fontStyle:'bold',align:'center'}).setOrigin(.5);
    this.tooltip.add([this.tooltipBg,this.tooltipText]);
    this.root.add(this.tooltip);

    // Moldura inteiramente nova e única. A imagem permanece sempre em sua
    // proporção nativa; toda adaptação de viewport ocorre no container com o
    // mesmo fator em X e Y. Assim os dois encaixes 1:1 nunca viram elipses.
    this.frameWidth=1320;
    this.frameHeight=200;

    const orbX=558;
    const orbY=-100;
    const orbRadius=58;
    this.hpBack=scene.add.circle(-orbX,orbY,orbRadius,0x17070c,.88);
    this.hpOrb=scene.add.arc(-orbX,orbY,orbRadius-2,-90,270,false,0xc53c52,.94);
    this.hpShine=scene.add.circle(-orbX-14,orbY-17,orbRadius*.31,0xff9aac,.14);
    this.hpText=scene.add.text(-orbX,orbY-1,'',{fontFamily:'Georgia, serif',fontSize:12,color:'#fff6f4',fontStyle:'bold',stroke:'#28070d',strokeThickness:3,align:'center'}).setOrigin(.5);
    this.manaBack=scene.add.circle(orbX,orbY,orbRadius,0x06111d,.9);
    this.manaOrb=scene.add.arc(orbX,orbY,orbRadius-2,-90,270,false,0x347fca,.95);
    this.manaShine=scene.add.circle(orbX-14,orbY-17,orbRadius*.31,0x9ed4ff,.14);
    this.manaText=scene.add.text(orbX,orbY-1,'',{fontFamily:'Georgia, serif',fontSize:12,color:'#f2f8ff',fontStyle:'bold',stroke:'#06162c',strokeThickness:3,align:'center'}).setOrigin(.5);
    this.root.add([this.hpBack,this.hpOrb,this.hpShine,this.manaBack,this.manaOrb,this.manaShine]);
    this.frame=scene.add.image(0,0,'bottom_hud_frame_v2').setOrigin(.5,1);
    this.root.add([this.frame,this.hpText,this.manaText]);

    this.statusText=scene.add.text(0,-174,'',{fontFamily:'Georgia, serif',fontSize:10,color:'#e4c77c',fontStyle:'bold',stroke:'#080c12',strokeThickness:2}).setOrigin(.5);
    this.root.add(this.statusText);

    this.slotBacks=[];
    this.slotTexts=[];
    this.slotIcons=[];
    this.slotKeyTexts=[];
    const slotWidth=44,slotGap=5,slotY=-101,slotCount=15;
    const firstX=-(slotWidth+slotGap)*(slotCount-1)/2;
    const iconTextures={
      0:'hud_action_healing',1:'hud_action_mana',10:'hud_action_skills',11:'hud_action_inventory',
      12:'hud_action_map',13:'hud_action_controls',14:'hud_action_menu'
    };
    const commandKeys={0:'H',1:'J',10:'K',11:'I',12:'M',13:'C',14:'P'};
    const actionIds={0:'healing',1:'mana',10:'skills',11:'inventory',12:'map',13:'controls',14:'pause'};
    for(let index=0;index<slotCount;index++){
      const x=firstX+index*(slotWidth+slotGap);
      const special=index<2||index>=10;
      const back=scene.add.rectangle(x,slotY,slotWidth,54,0x101a2a,.92)
        .setStrokeStyle(1.35,special?0xb28a45:index<6?0x8d713d:0x52627b,.96);
      const text=scene.add.text(x,slotY+20,'',{fontFamily:'Arial',fontSize:7,color:'#eef2f8',fontStyle:'bold',align:'center',lineSpacing:1,wordWrap:{width:slotWidth-4}}).setOrigin(.5);
      this.root.add([back,text]);
      this.slotBacks.push(back);
      this.slotTexts.push(text);
      if(special){
        const icon=scene.add.image(x,slotY-6,iconTextures[index]).setDisplaySize(34,34);
        const key=scene.add.text(x-slotWidth*.39,slotY-23,commandKeys[index],{fontFamily:'Arial',fontSize:9,color:'#fff2c0',fontStyle:'bold',stroke:'#080c12',strokeThickness:2}).setOrigin(.5);
        back.setInteractive({useHandCursor:true});
        back.on('pointerover',()=>{back.setStrokeStyle(2,0xe0bd72,1);this.showTooltip(index,x)});
        back.on('pointerout',()=>{back.setStrokeStyle(1.35,0xb28a45,.96);this.tooltip.setVisible(false)});
        back.on('pointerdown',()=>this.onAction(actionIds[index]));
        this.root.add([icon,key]);
        this.slotIcons[index]=icon;
        this.slotKeyTexts[index]=key;
      }else{
        back.setInteractive({useHandCursor:true});
        back.on('pointerover',()=>{back.setStrokeStyle(2,0xe0bd72,1);this.showTooltip(index,x)});
        back.on('pointerout',()=>{back.setStrokeStyle(1.35,index<6?0x8d713d:0x52627b,.96);this.tooltip.setVisible(false)});
      }
    }

    this.xpWidth=500;
    this.xpBg=scene.add.rectangle(-this.xpWidth/2,-43,this.xpWidth,5,0x202b3d,1).setOrigin(0,.5);
    this.xpFill=scene.add.rectangle(-this.xpWidth/2,-43,0,5,0x68b8d8,1).setOrigin(0,.5);
    this.xpText=scene.add.text(0,-32,'',{fontFamily:'Arial',fontSize:9,color:'#aebcd0',fontStyle:'bold',stroke:'#080c12',strokeThickness:2}).setOrigin(.5);
    this.root.add([this.xpBg,this.xpFill,this.xpText]);
    this.attackIcon=scene.add.text(this.slotBacks[5].x,this.slotBacks[5].y-8,'',{fontFamily:'Arial',fontSize:22,color:'#f0c66b',fontStyle:'bold',stroke:'#080c12',strokeThickness:3}).setOrigin(.5);
    this.root.add(this.attackIcon);
    this.visible=true;
    this.resizeHandler=(gameSize)=>this.layout(gameSize.width,gameSize.height);
    scene.scale.on(Phaser.Scale.Events.RESIZE,this.resizeHandler);
    scene.events.once('shutdown',()=>scene.scale.off(Phaser.Scale.Events.RESIZE,this.resizeHandler));
    this.layout(w,h);
    this.update();
  }

  layout(width,height){
    this.currentFrameWidth=this.frameWidth;
    const horizontalInset=Math.min(28,Math.max(12,width*.02));
    const maxWidth=Math.max(1,width-horizontalInset*2);
    const maxHeight=Math.max(1,height*.30);
    const uniformScale=Math.min(1,maxWidth/this.frameWidth,maxHeight/this.frameHeight);
    this.root
      .setPosition(Math.round(width/2),Math.round(height))
      .setScale(uniformScale,uniformScale);
  }

  setVisible(value){this.visible=value;this.root.setVisible(value)}

  setPotionIconState(index,count){
    const available=count>0,icon=this.slotIcons[index];
    if(available)icon?.clearTint().setAlpha(1);
    else icon?.setTint(0x222936).setAlpha(.34);
    this.slotKeyTexts[index]?.setAlpha(available?1:.48);
    this.slotTexts[index]?.setColor(available?'#eef2f8':'#697382');
    this.slotBacks[index]?.setFillStyle(available?0x101a2a:0x080c12,available ? .92 : .78);
  }

  update(){
    if(!this.visible)return;
    const healthRatio=Phaser.Math.Clamp(this.player.hp/Math.max(1,this.player.maxHp),0,1);
    const manaRatio=Phaser.Math.Clamp(this.player.mana/Math.max(1,this.player.maxMana),0,1);
    this.hpOrb.setEndAngle(-90+360*healthRatio).setAlpha(.54+.41*healthRatio);
    this.manaOrb.setEndAngle(-90+360*manaRatio).setAlpha(.54+.41*manaRatio);
    this.hpText.setText(`HP\n${this.player.hp}/${this.player.maxHp}`);
    this.manaText.setText(`MANA\n${this.player.mana}/${this.player.maxMana}`);
    const healingCount=this.getItemCount('healing_potion');
    const manaCount=this.getItemCount('mana_potion');
    this.slotTexts[0].setText(`VIDA ×${healingCount}`);
    this.slotTexts[1].setText(`MANA ×${manaCount}`);
    this.setPotionIconState(0,healingCount);
    this.setPotionIconState(1,manaCount);

    const classNames={warrior:'GUERREIRO',mage:'MAGO',ranger:'CAÇADOR'};
    this.statusText.setText(`${classNames[this.player.characterClass]||'AVENTUREIRO'}  •  NÍVEL ${this.player.level}  •  OURO ${this.player.gold}`);
    const need=Math.max(1,this.player.level*100);
    this.xpFill.width=this.xpWidth*Phaser.Math.Clamp(this.player.xp/need,0,1);
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
      const safeLocked=this.scene.isSafeZone&&slot.id!=='mobility';
      const state=safeLocked?'ZONA SEGURA':rank<=0?'BLOQ.':cooldown>0?`${(cooldown/1000).toFixed(1)}s`:`${mana} MP`;
      this.slotTexts[visualIndex].setPosition(this.slotTexts[visualIndex].x,-101).setFontSize(7.5)
        .setText(`${slot.key}\n${definition[0]}\n${state}`)
        .setColor(safeLocked?'#687487':rank<=0?'#758299':cooldown>0?'#a6afbd':'#f2f4f7');
      this.slotBacks[visualIndex].setFillStyle(safeLocked?0x090e16:rank<=0?0x0c121d:cooldown>0?0x151c28:0x101a2a,.92);
    }
    const basic={warrior:['⚔','Corte Básico'],mage:['✦','Rajada Arcana'],ranger:['➶','Tiro Básico']}[this.player.characterClass]||['•','Ataque Básico'];
    this.attackIcon.setText(basic[0]);
    this.slotTexts[5].setPosition(this.slotTexts[5].x,-101).setFontSize(7.5).setText(`ESPAÇO\n${basic[1]}`).setColor('#f2f4f7');
    this.slotBacks[5].setFillStyle(0x171824,.94);
    for(let index=6;index<10;index++){
      this.slotTexts[index].setPosition(this.slotTexts[index].x,-101).setFontSize(7.5).setText(`${index-3}\n—\nVAZIO`).setColor('#66748a');
      this.slotBacks[index].setFillStyle(0x0b111b,.86);
    }
    for(const index of [10,11,12,13,14])this.slotTexts[index].setText('');
  }

  showTooltip(index,x){
    const loadout=this.abilities.loadout(),safe=this.scene.isSafeZone&&[2,3].includes(index);
    const info={
      0:['Poção de Vida',String(this.getItemCount('healing_potion'))+' disponível(is)'],
      1:['Poção de Mana',String(this.getItemCount('mana_potion'))+' disponível(is)'],
      2:[loadout.primary[0],safe?'Indisponível em zona segura':'Habilidade equipada'],
      3:[loadout.secondary[0],safe?'Indisponível em zona segura':'Habilidade equipada'],
      4:[loadout.mobility[0],'Habilidade equipada'],
      5:[({warrior:'Corte Básico',mage:'Rajada Arcana',ranger:'Tiro Básico'}[this.player.characterClass]||'Ataque Básico'),'Mouse / Espaço'],
      10:['Habilidades','K'],11:['Atributos e Inventário','I'],12:['Mapa completo','M'],13:['Controles','C'],14:['Menu / Pausa','P']
    }[index];
    if(!info)return;
    this.tooltipText.setText(info[0]+'\\n'+info[1]);
    const width=Phaser.Math.Clamp(this.tooltipText.width+24,94,174),height=this.tooltipText.height+16;
    this.tooltipBg.clear();this.tooltipBg.fillStyle(0xffffff,.96).fillRoundedRect(-width/2,-height/2,width,height,7);this.tooltipBg.lineStyle(1,0xc4ccd5,1).strokeRoundedRect(-width/2,-height/2,width,height,7);
    this.tooltip.setPosition(x,-188).setVisible(true);
  }

  destroy(){this.scene.scale.off(Phaser.Scale.Events.RESIZE,this.resizeHandler);this.root.destroy(true)}
}
