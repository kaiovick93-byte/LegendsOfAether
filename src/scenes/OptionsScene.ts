import Phaser from "phaser";
import { ScreenFade } from "../ui/ScreenFade";

export class OptionsScene extends Phaser.Scene {
  private fade!: ScreenFade;
  constructor(){super("OptionsScene")}
  create(){
    this.fade=new ScreenFade(this);
    this.cameras.main.setBackgroundColor("#0d1220");
    this.add.rectangle(this.scale.width/2,this.scale.height/2,this.scale.width,this.scale.height,0x0d1220,1);
    this.add.text(this.scale.width/2,54,"OPÇÕES / SOBRE",{fontFamily:"Arial",fontSize:"30px",color:"#ecf0ff",fontStyle:"bold"}).setOrigin(.5);
    const controls=this.add.text(90,105,[
      "CONTROLES",
      "",
      "MOVIMENTO",
      "WASD / Setas",
      "",
      "COMBATE",
      "Espaço — Ataque básico",
      "Q — Habilidade principal",
      "1 — Habilidade secundária",
      "2 — Mobilidade",
      "",
      "ITENS E INTERAÇÃO",
      "H — Poção de HP",
      "M — Poção de Mana",
      "E — Interagir / coletar",
      "F — Conversar",
      "T — Loja, perto do Mercador",
      "I — Inventário",
      "K — Habilidades",
      "R — Equipar",
      "C — Abrir controles",
      "P — Pausar jogo",
      "Esc — Fechar janela"
    ].join("\n"),{fontFamily:"Arial",fontSize:"14px",color:"#c8d1ea",lineSpacing:4});
    controls.setDepth(5);
    const about=this.add.text(this.scale.width-410,118,[
      "SOBRE",
      "",
      "Legends of Aether é um RPG de ação 2D",
      "para navegador, ambientado no reino de Aether.",
      "",
      "Explore regiões corrompidas, enfrente",
      "monstros, complete missões e descubra",
      "a origem da corrupção que tomou o reino.",
      "",
      "Versão 0.1.6 • Alpha"
    ].join("\n"),{fontFamily:"Arial",fontSize:"14px",color:"#c8d1ea",wordWrap:{width:330},lineSpacing:6});
    about.setDepth(5);
    const back=this.add.text(this.scale.width/2,this.scale.height-52,"VOLTAR AO MENU",{fontFamily:"Arial",fontSize:"18px",color:"#73e6a8",backgroundColor:"#24314d",padding:{left:16,right:16,top:9,bottom:9}}).setOrigin(.5).setInteractive({useHandCursor:true});
    back.on("pointerdown",()=>this.fade.fadeOut(180).then(()=>this.scene.start("MenuScene")));
    this.fade.fadeIn(180);
  }
}
