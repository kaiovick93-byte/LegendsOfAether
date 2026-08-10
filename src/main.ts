import Phaser from "phaser";
import { GAME_WIDTH, GAME_HEIGHT } from "./config";
import { BootScene } from "./scenes/BootScene";
import { PreloadScene } from "./scenes/PreloadScene";
import { MenuScene } from "./scenes/MenuScene";
import { WorldScene } from "./scenes/WorldScene";

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
    scene: [BootScene, PreloadScene, MenuScene, WorldScene]
});

export default game;