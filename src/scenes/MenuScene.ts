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
  // The original painting has a permanently blue Jogar button baked into it.
  // Opaque, artwork-aligned button surfaces cover ALL five painted buttons;
  // only the CSS hover/focus state adds blue, without touching the landscape.
  const overlay=document.createElement('div');
  overlay.setAttribute('aria-label','Menu principal de Legends of Aether');
  overlay.style.cssText='position:absolute;inset:0;pointer-events:none;z-index:2;';
  const style=document.createElement('style');
  style.textContent=`
   .aether-menu-button {
    position:absolute;left:6.8%;width:23.9%;height:7.9%;
    display:flex;align-items:center;justify-content:center;
    box-sizing:border-box;margin:0;padding:0 8px 0 22px;
    border:2px solid #b28b4b;border-radius:12px;
    outline:none;color:#f5e6c7;font:clamp(13px,2.05vw,34px) Georgia,serif;
    letter-spacing:.015em;text-shadow:0 2px 3px #090d15;
    background:linear-gradient(115deg,#252525 0%,#171c21 52%,#272523 100%);
    box-shadow:inset 0 0 0 2px #3f3124,inset 0 0 18px #080a10,
               0 2px 5px #1118,0 0 0 1px #302515;
    pointer-events:auto;cursor:pointer;touch-action:manipulation;
    transition:background .14s ease,box-shadow .14s ease,border-color .14s ease;
   }
   .aether-menu-button::before {
    content:'✧';position:absolute;left:10%;font-size:.9em;color:#c9a76a;
   }
   .aether-menu-button:not(:disabled):not(.aether-menu-pending):is(:hover,:focus-visible){
    border-color:#ecd18d;
    background:linear-gradient(115deg,#123453 0%,#135183 53%,#122c4c 100%);
    box-shadow:inset 0 0 0 2px #5f87ae,inset 0 0 17px #3aafff90,
               0 0 10px #47b9ffb0,0 0 0 1px #c7a264;
   }
   .aether-menu-button:disabled {cursor:not-allowed;color:#c6b9a4;}
   .aether-menu-button.aether-menu-pending {cursor:default;}
   .aether-menu-button.aether-menu-pending:hover {
    border-color:#ecd18d;
    background:linear-gradient(115deg,#123453 0%,#135183 53%,#122c4c 100%);
    box-shadow:inset 0 0 0 2px #5f87ae,inset 0 0 17px #3aafff90,
               0 0 10px #47b9ffb0,0 0 0 1px #c7a264;
   }
  `;
  overlay.appendChild(style);
  const positions=[
   {name:'Jogar',y:43.1,fn:()=>this.newGame()},
   {name:'Continuar',y:52.1,fn:()=>this.continueGame()},
   {name:'Configurações',y:61.2,fn:()=>this.goOptions()},
   {name:'Créditos',y:70.2},
   {name:'Sair',y:79.1}
  ];
  this.menuOverlay=overlay;
  for(const item of positions){
   const button=document.createElement('button');
   button.type='button';
   button.className='aether-menu-button';
   button.textContent=item.name;
   button.setAttribute('aria-label',item.name);
   button.style.top=`${item.y-3.95}%`;
   if(item.fn){
    button.addEventListener('click',()=>{
     if(!this.menuBusy&&this.scene.isActive())item.fn();
    });
   }else{
    // Visual hover is available; these destinations are intentionally not
    // implemented in the current game round.
    button.classList.add('aether-menu-pending');
    button.title=`${item.name} — em desenvolvimento`;
    button.setAttribute('aria-disabled','true');
   }
   if(item.name==='Continuar'){
    button.disabled=!this.sm.load();
    if(button.disabled)button.title='Nenhuma partida salva';
   }
   overlay.appendChild(button);
  }
  parent.appendChild(overlay);
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
