// @ts-nocheck
import {SaveManager} from '../save/SaveManager';
import {ScreenFade} from '../ui/ScreenFade';
import {centerReferenceViewport} from '../render/Viewport';
import {worldClock} from '../world/WorldClock';
export class MenuScene extends Phaser.Scene{
 constructor(){super('MenuScene')}
 create(){
  centerReferenceViewport(this);
  this.sm=new SaveManager();
  const save=this.sm.load();
  const w=this.scale.width,h=this.scale.height;
  // Interface e zonas de clique acompanham exatamente a imagem em RESIZE.
  this.add.image(w/2,h/2,'aether_main_menu').setDisplaySize(w,h).setScrollFactor(0);
  // A arte já contém títulos e rótulos. Os controles transparentes, separados
  // da pintura, deixam os fluxos existentes funcionais sem duplicar o texto.
  this.addMenuHitArea(.184,.431,.218,.075,()=>{
   this.sm.clear();this.fade.out(()=>this.scene.start('PrologueScene'));
  },true);
  this.addMenuHitArea(.184,.521,.218,.075,()=>this.startExisting(save),!!save);
  this.addMenuHitArea(.184,.612,.218,.075,()=>this.fade.out(()=>this.scene.start('OptionsScene')),true);
  // Créditos e Sair permanecem apenas na arte, sem ação nesta etapa.
  this.fade=new ScreenFade(this);
  this.fade.in();
 }
 addMenuHitArea(nx,ny,nw,nh,callback,enabled){
  const w=this.scale.width,h=this.scale.height;
  const x=nx*w,y=ny*h,bw=nw*w,bh=nh*h;
  if(!enabled){
   // A função Continuar só pode ser utilizada quando existe um save.
   this.add.rectangle(x,y,bw,bh,0x090c13,.58).setScrollFactor(0);
   return;
  }
  const hover=this.add.rectangle(x,y,bw,bh,0x7dc9ff,0)
   .setScrollFactor(0).setInteractive({useHandCursor:true});
  hover.on('pointerover',()=>hover.setFillStyle(0x7dc9ff,.16));
  hover.on('pointerout',()=>hover.setFillStyle(0x7dc9ff,0));
  hover.on('pointerdown',()=>{if(!this.menuBusy){this.menuBusy=true;callback();}});
 }
 startExisting(save){
  if(!save)return;
  worldClock.restore(save.worldClock);
  let target=save.lastScene||'AetherCityScene';
  // Todo save legado de WorldScene pertence agora ao mesmo território da
  // cidade. A própria AetherCityScene migra a posição antes do primeiro frame.
  if(target==='WorldScene')target='AetherCityScene';
  this.fade.out(()=>this.scene.start(target));
 }
}
