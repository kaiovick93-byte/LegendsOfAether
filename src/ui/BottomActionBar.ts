// @ts-nocheck
export class BottomActionBar {
  private readonly root: Phaser.GameObjects.Container;
  private readonly hpOrb: Phaser.GameObjects.Arc;
  private readonly hpText: Phaser.GameObjects.Text;
  private readonly manaOrb: Phaser.GameObjects.Arc;
  private readonly manaText: Phaser.GameObjects.Text;
  private readonly classText: Phaser.GameObjects.Text;
  private readonly potionText: Phaser.GameObjects.Text;
  private readonly slots: Phaser.GameObjects.Text[] = [];
  private readonly backs: Phaser.GameObjects.Rectangle[] = [];
  private visible = true;

  constructor(private readonly scene: Phaser.Scene, private readonly player: any, private readonly abilities: any, private readonly getItemCount: (id: string) => number) {
    const scale = Math.min(1, scene.scale.width / 980);
    this.root = scene.add.container(scene.scale.width / 2, scene.scale.height - 8).setScrollFactor(0).setDepth(700);
    this.root.setScale(scale);

    const panel = scene.add.rectangle(0, -59, 940, 112, 0x0f1724, 0.97).setStrokeStyle(2, 0x35445f, 1);
    this.root.add(panel);

    const hpOuter = scene.add.circle(-410, -58, 40, 0x1b2330, 1).setStrokeStyle(3, 0x6f293b, 1);
    this.hpOrb = scene.add.circle(-410, -58, 32, 0xb83a4d, 1);
    this.hpText = scene.add.text(-410, -58, '', {fontFamily:'Arial',fontSize:12,color:'#fff',fontStyle:'bold',align:'center'}).setOrigin(.5);
    this.root.add([hpOuter, this.hpOrb, this.hpText]);

    const manaOuter = scene.add.circle(410, -58, 40, 0x1b2330, 1).setStrokeStyle(3, 0x31547e, 1);
    this.manaOrb = scene.add.circle(410, -58, 32, 0x3f8dcc, 1);
    this.manaText = scene.add.text(410, -58, '', {fontFamily:'Arial',fontSize:12,color:'#fff',fontStyle:'bold',align:'center'}).setOrigin(.5);
    this.root.add([manaOuter, this.manaOrb, this.manaText]);

    this.classText = scene.add.text(0, -104, '', {fontFamily:'Arial',fontSize:11,color:'#ffd166',fontStyle:'bold'}).setOrigin(.5);
    this.root.add(this.classText);

    const slotDefs = [
      {key:'Q', x:-150}, {key:'1', x:-53}, {key:'2', x:44}, {key:'ESPAÇO', x:141}
    ];
    slotDefs.forEach(({key,x})=>{
      const back=scene.add.rectangle(x,-58,82,68,0x24314d,1).setStrokeStyle(2,0x586b8c,1);
      const text=scene.add.text(x,-58,key,{fontFamily:'Arial',fontSize:10,color:'#fff',fontStyle:'bold',align:'center',wordWrap:{width:74}}).setOrigin(.5);
      this.root.add([back,text]); this.backs.push(back); this.slots.push(text);
    });

    this.potionText=scene.add.text(278,-37,'',{fontFamily:'Arial',fontSize:11,color:'#ecf0ff',align:'left'}).setOrigin(.5);
    this.root.add(this.potionText);

    const controls=scene.add.text(0,-5,'C  •  CONTROLES',{fontFamily:'Arial',fontSize:11,color:'#7ee0ff',fontStyle:'bold',backgroundColor:'#182033',padding:{left:8,right:8,top:4,bottom:4}}).setOrigin(.5);
    this.root.add(controls);
    this.update();
  }

  setVisible(value:boolean):void { this.visible=value; this.root.setVisible(value); }
  isVisible():boolean { return this.visible; }

  update():void {
    if(!this.visible)return;
    const hpRatio=Phaser.Math.Clamp(this.player.hp/Math.max(1,this.player.maxHp),0,1);
    const mpRatio=Phaser.Math.Clamp(this.player.mana/Math.max(1,this.player.maxMana),0,1);
    this.hpOrb.setScale(0.45+hpRatio*0.55); this.hpOrb.setAlpha(.45+hpRatio*.55);
    this.manaOrb.setScale(.45+mpRatio*.55); this.manaOrb.setAlpha(.45+mpRatio*.55);
    this.hpText.setText(`HP\n${this.player.hp}/${this.player.maxHp}`); this.manaText.setText(`MP\n${this.player.mana}/${this.player.maxMana}`);
    const classes:any={warrior:'GUERREIRO',mage:'MAGO',ranger:'CAÇADOR'}; this.classText.setText(classes[this.player.characterClass]||'AVENTUREIRO');
    const load=this.abilities.loadout?.()||{primary:['',0,0],secondary:['',0,0],mobility:['',0,0]};
    const ids=['primary','secondary','mobility']; const keys=['Q','1','2'];
    for(let i=0;i<3;i++){
      const cd=this.abilities.cooldown?.(ids[i])||0; const d=load[ids[i]];
      this.slots[i].setText(`${keys[i]}\n${d?.[0]||''}\n${d?.[1]??0} MP${cd>0?`\n${(cd/1000).toFixed(1)}s`:''}`);
      this.slots[i].setColor(cd>0?'#7b87a5':'#ecf0ff'); this.backs[i].setFillStyle(cd>0?0x1b2435:0x24314d,1);
    }
    this.slots[3].setText('ESPAÇO\nATAQUE'); this.potionText.setText(`H  Poção HP: ${this.getItemCount('healing_potion')}\nM  Poção MP: ${this.getItemCount('mana_potion')}`);
  }

  destroy():void{this.root.destroy(true)}
}
