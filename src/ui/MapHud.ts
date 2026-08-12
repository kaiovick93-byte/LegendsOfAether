// @ts-nocheck
import { BottomActionBar } from './BottomActionBar';
import { ControlsPanel } from './ControlsPanel';
import { Minimap } from './Minimap';

export class MapHud {
  private bottom: BottomActionBar;
  private controls: ControlsPanel;
  private minimap: Minimap;
  private controlsKey: Phaser.Input.Keyboard.Key;
  private modal = false;

  constructor(private scene: Phaser.Scene, player:any, abilities:any, inventory:any, worldWidth=1920, worldHeight=1152, markers:any[]=[]){
    this.bottom = new BottomActionBar(scene, player, abilities, (id:string)=>inventory.count(id));
    this.minimap = new Minimap(scene, worldWidth, worldHeight);
    markers.forEach((m)=>this.minimap.addMarker(m));
    this.controls = new ControlsPanel(scene);
    this.controlsKey = scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.C);
  }

  update(player:any):void{
    if(Phaser.Input.Keyboard.JustDown(this.controlsKey)){
      const open=!this.controls.isVisible();
      this.controls.setVisible(open);
      this.setModal(open);
      return;
    }
    this.bottom.update();
    this.minimap.update(player.x,player.y);
  }

  setModal(open:boolean):void{
    this.modal=open;
    this.bottom.setVisible(!open);
    this.minimap.setVisible(!open);
    if(!open)this.controls.setVisible(false);
  }

  isControlsOpen():boolean{return this.controls.isVisible();}
  destroy():void{this.bottom.destroy();this.minimap.destroy();this.controls.setVisible(false);}
}
