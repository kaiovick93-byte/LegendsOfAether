// @ts-nocheck
import {SaveManager} from '../save/SaveManager';
import {ScreenFade} from '../ui/ScreenFade';
export class MenuScene extends Phaser.Scene{
 constructor(){super('MenuScene')}
 create(){
  this.sm=new SaveManager(); this.fade=new ScreenFade(this);
  this.add.text(480,75,'LEGENDS OF AETHER',{fontFamily:'Arial',fontSize:42,color:'#ecf0ff',fontStyle:'bold'}).setOrigin(.5);
  this.add.text(480,120,'Action RPG de navegador',{fontFamily:'Arial',fontSize:17,color:'#7ee0ff'}).setOrigin(.5);
  const save=this.sm.load();
  const continueBtn=this.addButton('CONTINUAR',220,()=>this.startExisting(save),!!save);
  this.addButton('NOVO JOGO',285,()=>{this.sm.clear();this.fade.out(()=>this.scene.start('PrologueScene'))},true);
  this.addButton('PROTÓTIPO ISOMÉTRICO (R59)',350,()=>this.fade.out(()=>this.scene.start('IsometricPrototypeScene')),true);
  this.addButton('OPÇÕES / SOBRE',415,()=>this.fade.out(()=>this.scene.start('OptionsScene')),true);
  if(save){
    this.add.text(480,480,`Save encontrado • Nível ${save.player.level} • ${save.lastScene||'WorldScene'}`,{fontFamily:'Arial',fontSize:12,color:'#9aa8c7'}).setOrigin(.5)
  }else{
    this.add.text(480,480,'Nenhum save encontrado. CONTINUAR está desabilitado.',{fontFamily:'Arial',fontSize:12,color:'#7280a8'}).setOrigin(.5)
  }
  this.fade.in()
 }
 addButton(t,y,cb,enabled){
  const obj=this.add.text(480,y,t,{fontFamily:'Arial',fontSize:20,color:enabled?'#ecf0ff':'#626d83',backgroundColor:enabled?'#24314d':'#161d2a',padding:{left:20,right:20,top:10,bottom:10}}).setOrigin(.5);
  if(!enabled)return obj;
  obj.setInteractive({useHandCursor:true}).on('pointerover',()=>obj.setBackgroundColor('#36507c')).on('pointerout',()=>obj.setBackgroundColor('#24314d')).on('pointerdown',cb);
  return obj;
 }
 startExisting(save){
  if(!save)return;
  let target=save.lastScene||'AetherCityScene';
  const pos=save.scenePositions?.WorldScene;
  const inOldCity=!pos||(pos.x>=80&&pos.x<=1480&&pos.y>=80&&pos.y<=1120);
  if(target==='WorldScene'&&inOldCity&&!save.worldFlags?.cityRound66Migrated)target='AetherCityScene';
  this.fade.out(()=>this.scene.start(target));
 }
}
