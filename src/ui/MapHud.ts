// @ts-nocheck
import {BottomActionBar} from './BottomActionBar';import {ControlsPanel} from './ControlsPanel';import {Minimap} from './Minimap';import {PauseMenu} from './PauseMenu';import {CharacterInventoryPanel} from './CharacterInventoryPanel';import {SkillPanel} from './SkillPanel';import {useHealing,useMana} from '../items/itemUse';
export class MapHud{
 constructor(scene,opts){this.scene=scene;this.player=opts.player;this.inventory=opts.inventory;this.equipment=opts.equipment;this.abilities=opts.abilities;this.skills=opts.skills;this.save=opts.save;this.onMenu=opts.onMenu||(()=>this.scene.scene.start('MenuScene'));this.bottom=new BottomActionBar(scene,this.player,this.abilities,(id)=>this.inventory.count(id));this.minimap=new Minimap(scene,opts.worldWidth,opts.worldHeight,opts.localName);(opts.markers||[]).forEach(m=>this.minimap.addMarker(m));this.controls=new ControlsPanel(scene);this.inventoryPanel=new CharacterInventoryPanel(scene,this.player,this.inventory,this.equipment,()=>this.save());this.skillPanel=new SkillPanel(scene,this.skills);this.pause=new PauseMenu(scene,()=>this.save(),()=>{this.save();this.onMenu()},()=>{this.save();this.onMenu()},()=>{this.modal=false;this.abilities.resume?.();this.showHud()});this.keys={c:this.key('C'),i:this.key('I'),k:this.key('K'),p:this.key('P'),esc:this.key('ESC'),h:this.key('H'),m:this.key('M'),r:this.key('R'),e:this.key('E'),f:this.key('F'),t:this.key('T')};this.modal=false}
 key(k){return this.scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes[k])}
 update(){if(!this.modal){this.bottom.update();this.minimap.update(this.player.x,this.player.y)}else{this.bottom.setVisible(false);this.minimap.setVisible(false)}}
 isModal(){return this.modal||this.controls.isVisible()||this.pause.isOpen()||this.inventoryPanel.isVisible()||this.skillPanel.visible}
 handle(actions){
  if(Phaser.Input.Keyboard.JustDown(this.keys.esc)){this.closeAll();return true}
  if(Phaser.Input.Keyboard.JustDown(this.keys.c)){if(this.controls.isVisible()){this.controls.setVisible(false);this.modal=false;this.abilities.resume?.();this.showHud();return true}this.closeAll();this.controls.setVisible(true);this.modal=true;this.abilities.pause?.();this.hideHud();return true}
  if(Phaser.Input.Keyboard.JustDown(this.keys.p)){if(this.pause.isOpen()){this.pause.close();this.modal=false;this.abilities.resume?.();this.showHud()}else{this.closeAll();this.pause.open();this.modal=true;this.abilities.pause?.();this.hideHud()}return true}
  if(this.controls.isVisible()||this.pause.isOpen())return true;
  if(Phaser.Input.Keyboard.JustDown(this.keys.i)){this.skillPanel.setVisible(false);this.inventoryPanel.toggle();this.modal=this.inventoryPanel.isVisible();this.modal?(this.abilities.pause?.(),this.hideHud()):(this.abilities.resume?.(),this.showHud());return true}
  if(Phaser.Input.Keyboard.JustDown(this.keys.k)){this.inventoryPanel.hide();this.skillPanel.toggle();this.modal=this.skillPanel.visible;this.modal?(this.abilities.pause?.(),this.hideHud()):(this.abilities.resume?.(),this.showHud());return true}
  if(this.inventoryPanel.isVisible()||this.skillPanel.visible)return true;
  if(Phaser.Input.Keyboard.JustDown(this.keys.h)){useHealing(this.player,this.inventory);actions.afterAction?.();return true}
  if(Phaser.Input.Keyboard.JustDown(this.keys.m)){useMana(this.player,this.inventory);actions.afterAction?.();return true}
  if(Phaser.Input.Keyboard.JustDown(this.keys.r)){this.equipment.autoEquipBest(this.inventory);actions.afterAction?.();return true}
  if(Phaser.Input.Keyboard.JustDown(this.keys.e)){actions.collect?.();return true}
  if(Phaser.Input.Keyboard.JustDown(this.keys.f)){actions.talk?.();return true}
  if(Phaser.Input.Keyboard.JustDown(this.keys.t)){actions.shop?.();return true}
  return false
 }
 openExternalModal(){this.modal=true;this.abilities.pause?.();this.hideHud()}
 closeExternalModal(){this.modal=false;this.abilities.resume?.();this.showHud()}
 hideHud(){this.bottom.setVisible(false);this.minimap.setVisible(false)}
 showHud(){this.bottom.setVisible(true);this.minimap.setVisible(true);this.update()}
 closeAll(){this.controls.setVisible(false);this.inventoryPanel.hide();this.skillPanel.setVisible(false);this.pause.close();this.modal=false;this.showHud()}
 destroy(){this.bottom.destroy?.();this.minimap.destroy()}
}
