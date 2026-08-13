// @ts-nocheck
import {ScreenFade} from '../ui/ScreenFade';
import {GAME_WIDTH,GAME_HEIGHT} from '../config';

export class OptionsScene extends Phaser.Scene {
  constructor(){super('OptionsScene')}

  create(){
    this.fade=new ScreenFade(this);
    this.page='root';
    this.renderRoot();
    this.fade.in();
  }

  clearPage(){
    if(this.pageObjects){
      for(const o of this.pageObjects){o.destroy();}
    }
    this.pageObjects=[];
  }

  addText(text,x,y,style={}){
    const t=this.add.text(x,y,text,{fontFamily:'Arial',fontSize:'18px',color:'#ecf0ff',...style}).setOrigin(.5);
    this.pageObjects.push(t);
    return t;
  }

  button(label,y,onClick,accent=false){
    const b=this.add.text(GAME_WIDTH/2,y,label,{fontFamily:'Arial',fontSize:20,color:accent?'#73e6a8':'#ecf0ff',backgroundColor:'#24314d',padding:{left:22,right:22,top:11,bottom:11}}).setOrigin(.5).setInteractive({useHandCursor:true});
    b.on('pointerover',()=>b.setStyle({color:'#ffffff',backgroundColor:'#36507c'}));
    b.on('pointerout',()=>b.setStyle({color:accent?'#73e6a8':'#ecf0ff',backgroundColor:'#24314d'}));
    b.on('pointerdown',onClick);
    this.pageObjects.push(b);
    return b;
  }

  renderRoot(){
    this.clearPage();
    this.add.text(GAME_WIDTH/2,80,'OPÇÕES / SOBRE',{fontFamily:'Arial',fontSize:34,color:'#ecf0ff',fontStyle:'bold'}).setOrigin(.5);
    this.pageObjects.push(this.children.list[this.children.list.length-1]);
    this.addText('Consulte os comandos do jogo ou conheça o mundo de Aether.',GAME_WIDTH/2,128,{fontSize:15,color:'#9aa8c7'});
    this.button('CONTROLES',220,()=>this.renderControls());
    this.button('SOBRE',285,()=>this.renderAbout());
    this.button('VOLTAR AO MENU',350,()=>this.returnMenu(),true);
  }

  renderControls(){
    this.clearPage();
    this.addText('CONTROLES',GAME_WIDTH/2,65,{fontSize:32,fontStyle:'bold'});
    const left=[
      ['WASD / Setas','Mover'],['Espaço','Ataque básico'],['Q','Habilidade principal'],['1','Habilidade secundária'],['2','Mobilidade'],['H','Poção de HP']
    ];
    const right=[
      ['M','Poção de Mana'],['I','Inventário'],['R','Equipar'],['E','Interagir / coletar'],['F','Conversar'],['T','Loja (Mercador)'],['K','Skills'],['C','Controles'],['P','Pausa'],['Esc','Fechar janela']
    ];
    const startY=125;
    left.forEach((r,i)=>this.addText(`${r[0]}  —  ${r[1]}`,255,startY+i*38,{fontSize:16,color:'#c8d1ea'}).setOrigin(.5));
    right.forEach((r,i)=>this.addText(`${r[0]}  —  ${r[1]}`,705,startY+i*38,{fontSize:16,color:'#c8d1ea'}).setOrigin(.5));
    this.button('VOLTAR',GAME_HEIGHT-70,()=>this.renderRoot(),true);
  }

  renderAbout(){
    this.clearPage();
    this.addText('SOBRE',GAME_WIDTH/2,70,{fontSize:32,fontStyle:'bold'});
    const text='Legends of Aether é um RPG de ação 2D para navegador.\n\nExplore o reino de Aether, escolha entre Guerreiro, Mago e Caçador,\nenfrente criaturas corrompidas, encontre equipamentos, complete missões\ne descubra a origem da corrupção que tomou o castelo.\n\nEsta é uma versão Alpha em desenvolvimento, com foco em combate,\nprogressão de personagem, exploração e narrativa.';
    this.addText(text,GAME_WIDTH/2,250,{fontSize:17,color:'#c8d1ea',align:'center',wordWrap:{width:700},lineSpacing:8});
    this.addText('Legends of Aether • Alpha 0.1.3',GAME_WIDTH/2,460,{fontSize:14,color:'#7280a8'});
    this.button('VOLTAR',GAME_HEIGHT-70,()=>this.renderRoot(),true);
  }

  returnMenu(){
    this.fade.out(()=>this.scene.start('MenuScene'));
  }
}
