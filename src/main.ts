// @ts-nocheck
import {BootScene} from './scenes/BootScene';
import {PreloadScene} from './scenes/PreloadScene';
import {MenuScene} from './scenes/MenuScene';
import {OptionsScene} from './scenes/OptionsScene';
import {PrologueScene} from './scenes/PrologueScene';
import {CharacterSelectScene} from './scenes/CharacterSelectScene';
import {AetherCityScene} from './scenes/AetherCityScene';
import {WorldScene} from './scenes/WorldScene';
import {HouseInteriorScene} from './scenes/HouseInteriorScene';
import {GreenWoodsScene} from './scenes/GreenWoodsScene';
import {CaveScene} from './scenes/CaveScene';
import {CastleScene} from './scenes/CastleScene';
import {VictoryScene} from './scenes/VictoryScene';
import {GAME_WIDTH,GAME_HEIGHT} from './config';
import {centerReferenceViewport} from './render/Viewport';

// As pinturas 2,5D e os textos não são pixel art. Cada Text recebe uma
// textura interna de alta resolução, mas conserva o mesmo tamanho lógico.
const textFactory=Phaser.GameObjects.GameObjectFactory.prototype.text;
if(!textFactory.__aetherHighDpi){
  const highDpiText=function(x,y,value,style={}){
    const density=Math.min(2,Math.max(1,window.devicePixelRatio||1));
    return textFactory.call(this,x,y,value,{...style,resolution:Math.max(style?.resolution||0,density)});
  };
  highDpiText.__aetherHighDpi=true;
  Phaser.GameObjects.GameObjectFactory.prototype.text=highDpiText;
}

new Phaser.Game({
  type:Phaser.AUTO,
  parent:'game',
  width:GAME_WIDTH,
  height:GAME_HEIGHT,
  scale:{
    mode:Phaser.Scale.RESIZE,
    autoCenter:Phaser.Scale.CENTER_BOTH,
    width:'100%',
    height:'100%',
    expandParent:true
  },
  backgroundColor:'#0d1220',
  pixelArt:false,
  antialias:true,
  antialiasGL:true,
  roundPixels:false,
  callbacks:{postBoot(game){
    const centered=new Set(['MenuScene','OptionsScene','PrologueScene','CharacterSelectScene','HouseInteriorScene','VictoryScene']);
    for(const scene of game.scene.scenes){
      scene.events.on(Phaser.Scenes.Events.CREATE,()=>{
        scene.cameras.main.setRoundPixels(false);
        if(centered.has(scene.scene.key)){
          centerReferenceViewport(scene);
          const recenter=()=>centerReferenceViewport(scene);
          scene.scale.on(Phaser.Scale.Events.RESIZE,recenter);
          scene.events.once(Phaser.Scenes.Events.SHUTDOWN,()=>scene.scale.off(Phaser.Scale.Events.RESIZE,recenter));
        }
      });
    }
  }},
  physics:{default:'arcade',arcade:{gravity:{y:0},debug:false}},
  scene:[BootScene,PreloadScene,MenuScene,OptionsScene,PrologueScene,CharacterSelectScene,AetherCityScene,WorldScene,HouseInteriorScene,GreenWoodsScene,CaveScene,CastleScene,VictoryScene]
});
