// @ts-nocheck
import {BootScene} from './scenes/BootScene.ts';
import {PreloadScene} from './scenes/PreloadScene.ts';
import {MenuScene} from './scenes/MenuScene.ts';
import {CharacterSelectScene} from './scenes/CharacterSelectScene.ts';
import {WorldScene} from './scenes/WorldScene.ts';
import {HouseInteriorScene} from './scenes/HouseInteriorScene.ts';
import {GreenWoodsScene} from './scenes/GreenWoodsScene.ts';
import {CaveScene} from './scenes/CaveScene.ts';
import {CastleScene} from './scenes/CastleScene.ts';
import {VictoryScene} from './scenes/VictoryScene.ts';
import {GAME_WIDTH,GAME_HEIGHT} from './config.ts';
new Phaser.Game({type:Phaser.AUTO,parent:'game',width:GAME_WIDTH,height:GAME_HEIGHT,backgroundColor:'#0d1220',physics:{default:'arcade',arcade:{gravity:{y:0},debug:false}},scene:[BootScene,PreloadScene,MenuScene,CharacterSelectScene,WorldScene,HouseInteriorScene,GreenWoodsScene,CaveScene,CastleScene,VictoryScene]});
