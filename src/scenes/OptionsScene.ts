// @ts-nocheck
import {ScreenFade} from '../ui/ScreenFade';
export class OptionsScene extends Phaser.Scene{
 constructor(){super('OptionsScene')}
 create(){
  this.fade=new ScreenFade(this);this.panelOpen=false;this.esc=this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.ESC);
  this.add.text(480,55,'OPÇÕES / SOBRE',{fontFamily:'Arial',fontSize:30,color:'#ecf0ff',fontStyle:'bold'}).setOrigin(.5);
  this.addButton('CONTROLES',180,()=>this.showPanel('CONTROLES'));
  this.addButton('SOBRE',245,()=>this.showPanel('SOBRE'));
  this.addButton('VOLTAR AO MENU',330,()=>this.fade.out(()=>this.scene.start('MenuScene')));
  this.fade.in()
 }
 update(){if(this.panelOpen&&Phaser.Input.Keyboard.JustDown(this.esc))this.closePanel()}
 addButton(t,y,cb){this.add.text(480,y,t,{fontFamily:'Arial',fontSize:19,color:'#ecf0ff',backgroundColor:'#24314d',padding:{left:18,right:18,top:9,bottom:9}}).setOrigin(.5).setInteractive({useHandCursor:true}).on('pointerover',e=>e.setBackgroundColor('#36507c')).on('pointerout',e=>e.setBackgroundColor('#24314d')).on('pointerdown',cb)}
 showPanel(kind){this.closePanel();this.panelOpen=true;this.panel=this.add.rectangle(480,285,760,365,0x101827,.99).setStrokeStyle(2,0x4b5f87,1);this.pt=this.add.text(480,145,kind,{fontFamily:'Arial',fontSize:23,color:'#ffd166',fontStyle:'bold'}).setOrigin(.5);
  if(kind==='CONTROLES'){
   this.pb=this.add.text(480,205,[
    'MOVIMENTO:  WASD / Setas',
    'COMBATE:  Espaço ataque • Q / 1 / 2 habilidades',
    'ITENS:  H poção HP • M poção Mana • I inventário • R equipar',
    'MUNDO:  E coletar • F conversar • T loja (Mercador)',
    'INTERFACE:  K skills • C controles • P pausa • Esc fechar',
   ].join('\n\n'),{fontFamily:'Arial',fontSize:15,color:'#c8d1ea',align:'center',lineSpacing:4,wordWrap:{width:660}}).setOrigin(.5);
  }else{
   this.pb=this.add.text(480,255,'Legends of Aether é um RPG de ação 2D para navegador.\n\nExplore Aether, enfrente monstros corrompidos, escolha sua classe, encontre equipamentos e descubra o que aconteceu com o antigo reino.\n\nVersão 0.1.4 — Alpha',{fontFamily:'Arial',fontSize:16,color:'#c8d1ea',align:'center',lineSpacing:6,wordWrap:{width:610}}).setOrigin(.5);
  }
  this.pc=this.add.text(480,440,'Esc — fechar',{fontFamily:'Arial',fontSize:13,color:'#9aa8c7',backgroundColor:'#24314d',padding:8}).setOrigin(.5).setInteractive({useHandCursor:true});this.pc.on('pointerdown',()=>this.closePanel())
 }
 closePanel(){if(!this.panelOpen)return;[this.panel,this.pt,this.pb,this.pc].forEach(o=>o?.destroy());this.panelOpen=false}
}
