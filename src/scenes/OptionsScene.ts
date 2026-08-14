// @ts-nocheck
import { ScreenFade } from '../ui/ScreenFade';

export class OptionsScene extends Phaser.Scene {
  constructor(){ super('OptionsScene') }

  create(){
    this.cameras.main.setBackgroundColor('#0d1220');
    this.fade = new ScreenFade(this);
    this.panelOpen = false;
    this.esc = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.ESC);

    this.add.rectangle(this.scale.width/2,this.scale.height/2,this.scale.width,this.scale.height,0x0d1220,1);
    this.add.text(this.scale.width/2,56,'OPÇÕES / SOBRE',{fontFamily:'Arial',fontSize:30,color:'#ecf0ff',fontStyle:'bold'}).setOrigin(.5).setDepth(2);

    this.addButton('CONTROLES',170,()=>this.showPanel('CONTROLES'));
    this.addButton('SOBRE',235,()=>this.showPanel('SOBRE'));
    this.addButton('VOLTAR AO MENU',310,()=>this.fade.out(()=>this.scene.start('MenuScene')));

    this.fade.in();
  }

  update(){
    if(this.panelOpen && Phaser.Input.Keyboard.JustDown(this.esc)) this.closePanel();
  }

  addButton(text,y,callback){
    const b=this.add.text(this.scale.width/2,y,text,{fontFamily:'Arial',fontSize:18,color:'#ecf0ff',backgroundColor:'#24314d',padding:{left:20,right:20,top:10,bottom:10}}).setOrigin(.5).setDepth(2).setInteractive({useHandCursor:true});
    b.on('pointerover',()=>b.setBackgroundColor('#36507c'));
    b.on('pointerout',()=>b.setBackgroundColor('#24314d'));
    b.on('pointerdown',callback);
    return b;
  }

  showPanel(kind){
    this.closePanel();
    this.panelOpen=true;

    this.panel=this.add.rectangle(this.scale.width/2,this.scale.height/2+10,780,380,0x101827,.99)
      .setStrokeStyle(2,0x4b5f87,1).setDepth(10);

    this.pt=this.add.text(this.scale.width/2,150,kind,{fontFamily:'Arial',fontSize:24,color:'#ffd166',fontStyle:'bold'})
      .setOrigin(.5).setDepth(11);

    let content;
    if(kind==='CONTROLES'){
      content=[
        'MOVIMENTO',
        'WASD / Setas',
        '',
        'COMBATE',
        'Espaço — Ataque básico',
        'Q — Habilidade principal',
        '1 — Habilidade secundária',
        '2 — Mobilidade',
        '',
        'ITENS E INTERAÇÃO',
        'H — Poção de HP    •    M — Poção de Mana',
        'E — Interagir / coletar    •    F — Conversar',
        'T — Loja (perto do Mercador)    •    I — Inventário',
        'K — Habilidades    •    R — Equipar',
        '',
        'INTERFACE',
        'C — Controles    •    P — Pausa    •    Esc — Fechar'
      ].join('\n');
    }else{
      content=[
        'Legends of Aether é um RPG de ação 2D para navegador.',
        '',
        'Explore o reino de Aether, escolha uma classe, enfrente criaturas corrompidas,',
        'encontre equipamentos, complete missões e descubra a origem da corrupção.',
        '',
        'Versão 0.1.6 • Alpha'
      ].join('\n');
    }

    this.pb=this.add.text(this.scale.width/2,300,content,{fontFamily:'Arial',fontSize:14,color:'#c8d1ea',align:'center',lineSpacing:5,wordWrap:{width:700}})
      .setOrigin(.5).setDepth(11);

    this.pc=this.add.text(this.scale.width/2,470,'ESC — FECHAR',{fontFamily:'Arial',fontSize:13,color:'#9aa8c7',backgroundColor:'#24314d',padding:{left:10,right:10,top:6,bottom:6}})
      .setOrigin(.5).setDepth(11).setInteractive({useHandCursor:true});
    this.pc.on('pointerdown',()=>this.closePanel());
  }

  closePanel(){
    if(!this.panelOpen)return;
    [this.panel,this.pt,this.pb,this.pc].forEach(o=>o?.destroy());
    this.panelOpen=false;
  }
}
