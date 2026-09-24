// @ts-nocheck
import {SaveManager} from '../save/SaveManager';
import {ScreenFade} from '../ui/ScreenFade';
import {centerReferenceViewport} from '../render/Viewport';
import {worldClock} from '../world/WorldClock';

/** The painted menu already contains the button labels. HTML hit targets are
 * placed over the canvas so mouse/touch input does not depend on Phaser's
 * camera scroll, resize or transparent GameObject hit testing. */
export class MenuScene extends Phaser.Scene{
 constructor(){super('MenuScene')}
 create(){
  this.menuBusy=false;
  this.sm=new SaveManager();
  centerReferenceViewport(this);
  const w=this.scale.width,h=this.scale.height;
  this.add.image(w/2,h/2,'aether_main_menu').setDisplaySize(w,h).setScrollFactor(0);
  this.fade=new ScreenFade(this);
  this.createMenuButtons();
  this.fade.in();
 }

 createMenuButtons(){
  const parent=this.game.canvas.parentElement;
  if(!parent)return;
  // Match the visible painting, which stretches to the entire game canvas.
  const overlay=document.createElement('div');
  overlay.setAttribute('aria-label','Menu principal de Legends of Aether');
  overlay.style.cssText='position:absolute;inset:0;pointer-events:none;z-index:2;';
  const positions=[
   {name:'Jogar',y:43.1,fn:()=>this.newGame()},
   {name:'Continuar',y:52.1,fn:()=>this.continueGame()},
   {name:'Configurações',y:61.2,fn:()=>this.goOptions()}
  ];
  this.menuOverlay=overlay;
  for(const item of positions){
   const button=document.createElement('button');
   button.type='button';
   button.setAttribute('aria-label',item.name);
   button.title=item.name;
   button.style.cssText=`position:absolute;left:7%;top:${item.y-3.8}%;width:23%;height:7.6%;padding:0;border:0;border-radius:12px;background:transparent;color:transparent;cursor:pointer;pointer-events:auto;touch-action:manipulation;`;
   button.addEventListener('focus',()=>{button.style.outline='2px solid #7dc9ff';});
   button.addEventListener('blur',()=>{button.style.outline='none';});
   button.addEventListener('click',()=>{if(!this.menuBusy&&this.scene.isActive()){item.fn();}});
   if(item.name==='Continuar'){
    button.disabled=!this.sm.load();
    button.style.cursor=button.disabled?'not-allowed':'pointer';
    button.style.background=button.disabled?'rgba(9,12,19,.55)':'transparent';
   }
   overlay.appendChild(button);
  }
  parent.appendChild(overlay);
  // Every transition (including return to menu) must release the old targets.
  this.events.once(Phaser.Scenes.Events.SHUTDOWN,()=>{
   overlay.remove();
   if(this.menuOverlay===overlay)this.menuOverlay=null;
  });
 }

 newGame(){
  this.menuBusy=true;
  this.sm.clear();
  this.fade.out(()=>this.scene.start('PrologueScene'));
 }
 continueGame(){
  // Read at click time so a save created since the menu opened is respected.
  const save=this.sm.load();
  if(!save)return;
  this.menuBusy=true;
  worldClock.restore(save.worldClock);
  let target=save.lastScene||'AetherCityScene';
  if(target==='WorldScene')target='AetherCityScene';
  this.fade.out(()=>this.scene.start(target));
 }
 goOptions(){
  this.menuBusy=true;
  this.fade.out(()=>this.scene.start('OptionsScene'));
 }
}
