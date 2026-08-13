// @ts-nocheck
export class PauseMenu {
  constructor(private scene: Phaser.Scene, private onSave:()=>void, private onMenu:()=>void){
    const w=scene.scale.width,h=scene.scale.height;
    this.bg=scene.add.rectangle(w/2,h/2,w,h,0x060a12,.76).setScrollFactor(0).setDepth(1100).setVisible(false);
    this.panel=scene.add.rectangle(w/2,h/2,420,330,0x121a2a,.98).setScrollFactor(0).setDepth(1101).setStrokeStyle(2,0x526a93,1).setVisible(false);
    this.title=scene.add.text(w/2,h/2-120,'PAUSA',{fontFamily:'Arial',fontSize:34,color:'#ecf0ff',fontStyle:'bold'}).setOrigin(.5).setScrollFactor(0).setDepth(1102).setVisible(false);
    this.info=scene.add.text(w/2,h/2-75,'O jogo está pausado.',{fontFamily:'Arial',fontSize:14,color:'#9aa8c7'}).setOrigin(.5).setScrollFactor(0).setDepth(1102).setVisible(false);
    this.addButton('CONTINUAR JOGANDO',h/2-20,()=>this.close());
    this.addButton('SALVAR',h/2+35,()=>this.onSave());
    this.addButton('MENU PRINCIPAL',h/2+90,()=>this.onMenu());
    this.addButton('SAIR',h/2+145,()=>this.onMenu());
  }
  private buttons:any[]=[]; private visible=false;
  private addButton(label:string,y:number,cb:()=>void){const t=this.scene.add.text(this.scene.scale.width/2,y,label,{fontFamily:'Arial',fontSize:17,color:'#ecf0ff',backgroundColor:'#24314d',padding:{left:18,right:18,top:9,bottom:9}}).setOrigin(.5).setScrollFactor(0).setDepth(1102).setInteractive({useHandCursor:true}).setVisible(false);t.on('pointerover',()=>t.setBackgroundColor('#36507c'));t.on('pointerout',()=>t.setBackgroundColor('#24314d'));t.on('pointerdown',cb);this.buttons.push(t)}
  open(){this.visible=true;[this.bg,this.panel,this.title,this.info,...this.buttons].forEach(o=>o.setVisible(true))}
  close(){this.visible=false;[this.bg,this.panel,this.title,this.info,...this.buttons].forEach(o=>o.setVisible(false))}
  isOpen(){return this.visible}
}
