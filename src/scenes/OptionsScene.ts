// @ts-nocheck
import {ScreenFade} from '../ui/ScreenFade';
export class OptionsScene extends Phaser.Scene{
 constructor(){super('OptionsScene')}
 create(){
  this.fade=new ScreenFade(this);this.panelOpen=false;
  this.esc=this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.ESC);
  const w=this.scale.width,h=this.scale.height;
  this.add.rectangle(w/2,h/2,w,h,0x0d1220,1);
  this.add.text(w/2,45,'OPÇÕES / SOBRE',{fontFamily:'Arial',fontSize:30,color:'#ecf0ff',fontStyle:'bold'}).setOrigin(.5);
  this.addButton('CONTROLES',145,()=>this.showControls());
  this.addButton('SOBRE',210,()=>this.showAbout());
  this.addButton('VOLTAR AO MENU',275,()=>this.fade.out(()=>this.scene.start('MenuScene')));
  this.fade.in();
 }
 update(){if(this.panelOpen&&Phaser.Input.Keyboard.JustDown(this.esc))this.closePanel()}
 addButton(text,y,callback){const b=this.add.text(this.scale.width/2,y,text,{fontFamily:'Arial',fontSize:18,color:'#ecf0ff',backgroundColor:'#24314d',padding:{left:22,right:22,top:10,bottom:10}}).setOrigin(.5).setInteractive({useHandCursor:true});b.on('pointerover',()=>b.setBackgroundColor('#36507c'));b.on('pointerout',()=>b.setBackgroundColor('#24314d'));b.on('pointerdown',callback);return b}
 showControls(){
  this.openPanel('CONTROLES');
  const left=[
   ['MOVIMENTO','WASD / Setas — Mover'],
   ['COMBATE','Espaço — Ataque básico'],
   ['','Q — Habilidade principal'],
   ['','1 — Habilidade secundária'],
   ['','2 — Mobilidade'],
   ['ITENS','H — Poção de HP'],
   ['','M — Poção de Mana'],
   ['','E — Interagir / coletar'],
  ];
  const right=[
   ['MUNDO','F — Conversar / Ler runa'],
   ['','T — Loja perto do Mercador'],
   ['INTERFACE','I — Inventário'],
   ['','K — Habilidades'],
   ['','R — Equipar'],
   ['','C — Controles'],
   ['','P — Pausa'],
   ['','Esc — Fechar janela'],
  ];
  this.renderColumn(left,185,250);this.renderColumn(right,185,540);
 }
 showAbout(){
  this.openPanel('SOBRE');
  const lines=[
   'Legends of Aether é um RPG de ação 2D para navegador.',
   'Explore o reino de Aether, escolha uma classe, enfrente',
   'criaturas corrompidas, encontre equipamentos e complete missões.',
   '',
   'A jornada cresce com novas regiões, cidades, masmorras',
   'e histórias descobertas ao longo da campanha.',
   '',
   'Versão Alpha 0.1.6'
  ];
  let y=205;for(const line of lines){this.addPanelText(line,y,'#c8d1ea',false,135);y+=24}
 }
 renderColumn(rows,x,y){for(const [section,line] of rows){if(section){this.addPanelText(section,y,'#ffd166',true,x);y+=21}this.addPanelText(line,y,'#c8d1ea',false,x);y+=22}}
 openPanel(title){this.closePanel();this.panelOpen=true;const w=this.scale.width,h=this.scale.height;this.panel=this.add.rectangle(w/2,h/2+4,700,470,0x101827,.99).setStrokeStyle(2,0x4b5f87,1).setDepth(10);this.pt=this.add.text(w/2,80,title,{fontFamily:'Arial',fontSize:24,color:'#ffd166',fontStyle:'bold'}).setOrigin(.5).setDepth(11);this.pc=this.add.text(w/2,h-55,'ESC — FECHAR',{fontFamily:'Arial',fontSize:13,color:'#9aa8c7',backgroundColor:'#24314d',padding:{left:10,right:10,top:6,bottom:6}}).setOrigin(.5).setDepth(11).setInteractive({useHandCursor:true});this.pc.on('pointerdown',()=>this.closePanel())}
 addPanelText(text,y,color,bold=false,x=160){this.created??=[];const t=this.add.text(x,y,text,{fontFamily:'Arial',fontSize:bold?13:12,color,fontStyle:bold?'bold':'normal',wordWrap:{width:245}}).setDepth(11);this.created.push(t);return t}
 closePanel(){if(!this.panelOpen)return;[this.panel,this.pt,this.pc,...(this.created||[])].forEach(o=>o?.destroy());this.created=[];this.panelOpen=false}
}
