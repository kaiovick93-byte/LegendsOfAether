import Phaser from "phaser";
import { GAME_WIDTH, GAME_HEIGHT } from "./config";
import { BootScene } from "./scenes/BootScene";
import { PreloadScene } from "./scenes/PreloadScene";
import { MenuScene } from "./scenes/MenuScene";
import { WorldScene } from "./scenes/WorldScene";
import { HouseInteriorScene } from "./scenes/HouseInteriorScene";
import { GreenWoodsScene } from "./scenes/GreenWoodsScene";
import { CaveScene } from "./scenes/CaveScene";

const game = new Phaser.Game ({
    type: Phaser.AUTO,
    parent: "app",
    width: GAME_WIDTH,
    height: GAME_HEIGHT,
    backgroundColor: "#0d1220",
    pixelArt: false,
    roundPixels: true,
    antialias: true,
    physics: {
        default: "arcade",
        arcade: {
            gravity: { y: 0 },
            debug: false
        }
    },
    scene: [BootScene, PreloadScene, MenuScene, WorldScene, HouseInteriorScene, GreenWoodsScene, CaveScene]
});

export default game;