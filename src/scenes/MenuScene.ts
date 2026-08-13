// @ts-nocheck
import {SaveManager} from '../save/SaveManager';
import {ScreenFade} from '../ui/ScreenFade';
export class MenuScene extends Phaser.Scene{
  constructor(){super('MenuScene')}
  create(){
    this.sm=new SaveManager();
    this.fade=new ScreenFade(this);
    this.add.rectangle(480,360,960,720,0x0d1220,1);
    this.add.text(480,105,'LEGENDS OF AETHER',{fontFamily:'Arial',fontSize:'44px',color:'#ecf0ff',fontStyle:'bold'}).setOrigin(.5);
    this.add.text(480,155,'Action RPG de navegador',{fontFamily:'Arial',fontSize:'18px',color:'#7ee0ff'}).setOrigin(.5);
    const has=this.sm.hasSave();
    const start=this.add.text(480,245,has?'CONTINUAR':'NOVO JOGO',{fontFamily:'Arial',fontSize:'24px',color:'#73e6a8',backgroundColor:'#24314d',padding:16}).setOrigin(.5).setInteractive({useHandCursor:true});
    start.on('pointerover',()=>start.setStyle({color:'#ffffff',backgroundColor:'#36507c'}));
    start.on('pointerout',()=>start.setStyle({color:'#73e6a8',backgroundColor:'#24314d'}));
    start.on('pointerdown',()=>{this.fade.out(()=>this.scene.start(has?(this.sm.load()?.lastScene||'WorldScene'):'PrologueScene'))});
    const ng=this.add.text(480,305,'NOVO JOGO',{fontFamily:'Arial',fontSize:'18px',color:'#ecf0ff',backgroundColor:'#24314d',padding:12}).setOrigin(.5).setInteractive({useHandCursor:true});
    ng.on('pointerover',()=>ng.setStyle({color:'#ffffff',backgroundColor:'#36507c'}));
    ng.on('pointerout',()=>ng.setStyle({color:'#ecf0ff',backgroundColor:'#24314d'}));
    ng.on('pointerdown',()=>{this.sm.clear();this.fade.out(()=>this.scene.start('PrologueScene'))});
    const options=this.add.text(480,365,'OPÇÕES / SOBRE',{fontFamily:'Arial',fontSize:'18px',color:'#ecf0ff',backgroundColor:'#24314d',padding:12}).setOrigin(.5).setInteractive({useHandCursor:true});
    options.on('pointerover',()=>options.setStyle({color:'#ffffff',backgroundColor:'#36507c'}));
    options.on('pointerout',()=>options.setStyle({color:'#ecf0ff',backgroundColor:'#24314d'}));
    options.on('pointerdown',()=>this.fade.out(()=>this.scene.start('OptionsScene')));
    this.add.text(480,620,'Legends of Aether • Alpha 0.1.3',{fontFamily:'Arial',fontSize:'13px',color:'#7280a8'}).setOrigin(.5);
    this.fade.in();
  }
}
