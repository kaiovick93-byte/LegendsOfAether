// @ts-nocheck
import {centerReferenceViewport} from '../render/Viewport';
export class HouseInteriorScene extends Phaser.Scene {
  constructor(){super('HouseInteriorScene')}
  create(){
    centerReferenceViewport(this);
    this.cameras.main.setBackgroundColor('#2b1f2f');
    this.add.text(480,100,'CASA DA VILA',{fontFamily:'Arial',fontSize:30,color:'#ecf0ff'}).setOrigin(.5);
    this.add.text(480,260,'Pressione X para voltar à cidade.\nPressione H para descansar.',{fontFamily:'Arial',fontSize:18,color:'#c8d1ea',align:'center'}).setOrigin(.5);
    this.x=this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.X);
    this.h=this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.H);
  }
  update(){
    if(Phaser.Input.Keyboard.JustDown(this.x))this.scene.start('AetherCityScene');
    if(Phaser.Input.Keyboard.JustDown(this.h))this.scene.start('AetherCityScene');
  }
}
