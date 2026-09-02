// @ts-nocheck
import {BottomActionBar} from './BottomActionBar';
import {ControlsPanel} from './ControlsPanel';
import {Minimap} from './Minimap';
import {MapPanel} from './MapPanel';
import {PauseMenu} from './PauseMenu';
import {CharacterInventoryPanel} from './CharacterInventoryPanel';
import {SkillPanel} from './SkillPanel';
import {useHealing,useMana} from '../items/itemUse';

export class MapHud{
 constructor(scene,opts){
  this.scene=scene;this.player=opts.player;this.inventory=opts.inventory;this.equipment=opts.equipment;
  this.abilities=opts.abilities;this.skills=opts.skills;this.save=opts.save;
  this.onMenu=opts.onMenu||(()=>this.scene.scene.start('MenuScene'));
  this.controls=new ControlsPanel(scene);
  this.inventoryPanel=new CharacterInventoryPanel(scene,this.player,this.inventory,this.equipment,()=>this.save());
  this.skillPanel=new SkillPanel(scene,this.skills);
  this.pause=new PauseMenu(scene,()=>this.save(),()=>{this.save();this.onMenu()},()=>{this.save();this.onMenu()},()=>this.leaveModal());
  const mapOptions={
   worldWidth:opts.worldWidth,worldHeight:opts.worldHeight,localName:opts.localName,markers:opts.markers||[],
   artKey:opts.mapTexture||null,projection:opts.mapProjection||'world',onClose:()=>this.closeAll()
  };
  this.minimap=new Minimap(scene,opts.worldWidth,opts.worldHeight,opts.localName,{artKey:mapOptions.artKey,projection:mapOptions.projection});
  (opts.markers||[]).forEach(marker=>this.minimap.addMarker(marker));
  this.mapPanel=new MapPanel(scene,mapOptions);
  this.bottom=new BottomActionBar(scene,this.player,this.abilities,id=>this.inventory.count(id),action=>this.handleHudAction(action));
  this.keys={c:this.key('C'),i:this.key('I'),k:this.key('K'),p:this.key('P'),esc:this.key('ESC'),h:this.key('H'),j:this.key('J'),m:this.key('M'),r:this.key('R'),e:this.key('E'),f:this.key('F'),t:this.key('T')};
  this.modal=false;
 }

 key(key){return this.scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes[key])}
 setLocalName(name){this.minimap.setLocalName(name);this.mapPanel.setLocalName(name)}
 update(){
  if(this.mapPanel.isVisible())this.mapPanel.updatePlayer(this.player);
  if(!this.modal){this.bottom.update();this.minimap.update(this.player.x,this.player.y,this.player)}
  else{this.bottom.setVisible(false);this.minimap.setVisible(false)}
 }
 isModal(){return this.modal||this.controls.isVisible()||this.pause.isOpen()||this.inventoryPanel.isVisible()||this.skillPanel.visible||this.mapPanel.isVisible()}

 handle(actions={}){
  if(Phaser.Input.Keyboard.JustDown(this.keys.esc)){this.closeAll();return true}
  if(Phaser.Input.Keyboard.JustDown(this.keys.m)){this.toggleMap();return true}
  if(Phaser.Input.Keyboard.JustDown(this.keys.c)){this.toggleControls();return true}
  if(Phaser.Input.Keyboard.JustDown(this.keys.p)){this.togglePause();return true}
  if(this.controls.isVisible()||this.pause.isOpen()||this.mapPanel.isVisible())return true;
  if(Phaser.Input.Keyboard.JustDown(this.keys.i)){this.toggleInventory();return true}
  if(Phaser.Input.Keyboard.JustDown(this.keys.k)){this.toggleSkills();return true}
  if(this.inventoryPanel.isVisible()||this.skillPanel.visible)return true;
  if(Phaser.Input.Keyboard.JustDown(this.keys.h)){useHealing(this.player,this.inventory);actions.afterAction?.();this.bottom.update();return true}
  if(Phaser.Input.Keyboard.JustDown(this.keys.j)){useMana(this.player,this.inventory);actions.afterAction?.();this.bottom.update();return true}
  if(Phaser.Input.Keyboard.JustDown(this.keys.r)){this.equipment.autoEquipBest(this.inventory);actions.afterAction?.();return true}
  if(Phaser.Input.Keyboard.JustDown(this.keys.e)){actions.collect?.();return true}
  if(Phaser.Input.Keyboard.JustDown(this.keys.f)){actions.talk?.();return true}
  if(Phaser.Input.Keyboard.JustDown(this.keys.t)){actions.shop?.();return true}
  return false;
 }

 handleHudAction(action){
  if(action==='healing'){useHealing(this.player,this.inventory);this.save?.();this.bottom.update();return}
  if(action==='mana'){useMana(this.player,this.inventory);this.save?.();this.bottom.update();return}
  if(action==='skills'){this.toggleSkills();return}
  if(action==='inventory'){this.toggleInventory();return}
  if(action==='map'){this.toggleMap();return}
  if(action==='controls'){this.toggleControls();return}
  if(action==='pause')this.togglePause();
 }

 closePanels(){
  this.controls.setVisible(false);this.inventoryPanel.hide();this.skillPanel.setVisible(false);this.pause.close();this.mapPanel.close(true);
 }
 enterModal(){this.modal=true;this.abilities.pause?.();this.hideHud()}
 leaveModal(){this.modal=false;this.abilities.resume?.();this.showHud()}
 toggleMap(){
  if(this.mapPanel.isVisible()){this.mapPanel.close();this.leaveModal();return}
  this.closePanels();this.mapPanel.open(this.player);this.enterModal();
 }
 toggleControls(){
  if(this.controls.isVisible()){this.controls.setVisible(false);this.leaveModal();return}
  this.closePanels();this.controls.setVisible(true);this.enterModal();
 }
 togglePause(){
  if(this.pause.isOpen()){this.pause.close();this.leaveModal();return}
  this.closePanels();this.pause.open();this.enterModal();
 }
 toggleInventory(){
  if(this.inventoryPanel.isVisible()){this.inventoryPanel.hide();this.leaveModal();return}
  this.closePanels();this.inventoryPanel.show();this.enterModal();
 }
 toggleSkills(){
  if(this.skillPanel.visible){this.skillPanel.setVisible(false);this.leaveModal();return}
  this.closePanels();this.skillPanel.setVisible(true);this.skillPanel.refresh();this.enterModal();
 }
 openExternalModal(){this.closePanels();this.enterModal()}
 closeExternalModal(){this.leaveModal()}
 hideHud(){this.bottom.setVisible(false);this.minimap.setVisible(false)}
 showHud(){this.bottom.setVisible(true);this.minimap.setVisible(true);this.update()}
 closeAll(){this.closePanels();this.leaveModal()}
 destroy(){this.bottom.destroy?.();this.minimap.destroy?.();this.mapPanel.destroy?.()}
}
