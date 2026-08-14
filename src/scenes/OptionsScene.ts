// @ts-nocheck
import {ScreenFade} from '../ui/ScreenFade';
export class OptionsScene extends Phaser.Scene{
 constructor(){super('OptionsScene')}
 create(){
  this.fade=new ScreenFade(this);this.panelOpen=false;this.esc=this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.ESC);
  this.add.rectangle(this.scale.width/2,this.scale.height/2,this.scale.width,this.scale.height,0x0d1220,1);
  this.add.text(this.scale.width/2,55,'OPÇÕES / SOBRE',{fontFamily:'Arial',fontSize:30,color:'#ecf0ff',fontStyle:'bold'}).setOrigin(.5);
  this.addButton('CONTROLES',165,()=>this.showControls());
  this.addButton('SOBRE',230,()=>this.showAbout());
  this.addButton('VOLTAR AO MENU',295,()=>this.fade.out(()=>this.scene.start('MenuScene')));
  this.fade.in();
 }
 update(){if(this.panelOpen&&Phaser.Input.Keyboard.JustDown(this.esc))this.closePanel()}
 addButton(text,y,callback){const b=this.add.text(this.scale.width/2,y,text,{fontFamily:'Arial',fontSize:18,color:'#ecf0ff',backgroundColor:'#24314d',padding:{left:22,right:22,top:10,bottom:10}}).setOrigin(.5).setInteractive({useHandCursor:true});b.on('pointerover',()=>b.setBackgroundColor('#36507c'));b.on('pointerout',()=>b.setBackgroundColor('#24314d'));b.on('pointerdown',callback);return b}
 showControls(){
  this.openPanel('CONTROLES');
  const sections=[
   ['MOVIMENTO',['WASD / Setas — Mover']],
   ['COMBATE',['Espaço — Ataque básico','Q — Habilidade principal','1 — Habilidade secundária','2 — Mobilidade']],
   ['ITENS E INTERAÇÃO',['H — Poção de HP','M — Poção de Mana','E — Interagir / coletar','F — Conversar','T — Loja perto do Mercador','I — Inventário','K — Habilidades','R — Equipar']],
   ['INTERFACE',['C — Controles','P — Pausa','Esc — Fechar janela']]
  ];
  let y=198;
  sections.forEach(([title,lines])=>{this.addPanelText(title,y,'#ffd166',true);y+=22;lines.forEach(line=>{this.addPanelText(line,y,'#c8d1ea');y+=20});y+=8});
 }
 showAbout(){this.openPanel('SOBRE');const lines=['Legends of Aether é um RPG de ação 2D para navegador.','', 'Explore Aether, escolha uma classe, enfrente criaturas corrompidas, descubra equipamentos, complete missões e descubra a origem da corrupção.','', 'Aether será expandido com novas regiões, masmorras, cidades e histórias.'];let y=215;lines.forEach(l=>{this.addPanelText(l,y,'#c8d1ea');y+=28})}
 openPanel(title){this.closePanel();this.panelOpen=true;this.panel=this.add.rectangle(this.scale.width/2,this.scale.height/2+8,760,470,0x101827,.99).setStrokeStyle(2,0x4b5f87,1).setDepth(10);this.pt=this.add.text(this.scale.width/2,98,title,{fontFamily:'Arial',fontSize:24,color:'#ffd166',fontStyle:'bold'}).setOrigin(.5).setDepth(11);this.pc=this.add.text(this.scale.width/2,490,'ESC — FECHAR',{fontFamily:'Arial',fontSize:13,color:'#9aa8c7',backgroundColor:'#24314d',padding:{left:10,right:10,top:6,bottom:6}}).setOrigin(.5).setDepth(11).setInteractive({useHandCursor:true});this.pc.on('pointerdown',()=>this.closePanel())}
 addPanelText(text,y,color,bold=false){this.created??=[];const t=this.add.text(150,y,text,{fontFamily:'Arial',fontSize:bold?14:13,color,fontStyle:bold?'bold':'normal'}).setDepth(11);this.created.push(t);return t}
 closePanel(){if(!this.panelOpen)return;[this.panel,this.pt,this.pc,...(this.created||[])].forEach(o=>o?.destroy());this.created=[];this.panelOpen=false}
}
