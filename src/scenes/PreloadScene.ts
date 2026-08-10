import Phaser from "phaser";
import { GAME_HEIGHT, GAME_WIDTH, COLORS } from "../config";

export class PreloadScene extends Phaser.Scene {
  private progressBar!: Phaser.GameObjects.Graphics;
  private progressBox!: Phaser.GameObjects.Graphics;
  private loadingText!: Phaser.GameObjects.Text;
  private percentText!: Phaser.GameObjects.Text;
  private readyText!: Phaser.GameObjects.Text;

  constructor() {
    super("PreloadScene");
  }

  preload(): void {
    this.createLoadingUI();

    this.load.on("progress", (value: number) => {
      this.percentText.setText(`${Math.round(value * 100)}%`);
      this.progressBar.clear();
      this.progressBar.fillStyle(0x7ee0ff, 1);
      this.progressBar.fillRect(
        GAME_WIDTH * 0.2,
        GAME_HEIGHT * 0.5,
        (GAME_WIDTH * 0.6) * value,
        18
      );
    });

    this.load.on("complete", () => {
      this.readyText.setText("Pronto!");
    });

    this.createPlaceholderTextures();
  }

  create(): void {
    this.time.delayedCall(250, () => {
      this.scene.start("MenuScene");
    });
  }

  private createLoadingUI(): void {
    this.cameras.main.setBackgroundColor(COLORS.bg);

    this.loadingText = this.add
      .text(GAME_WIDTH / 2, GAME_HEIGHT * 0.4, "Carregando Legends of Aether...", {
        fontFamily: "Arial",
        fontSize: "24px",
        color: "#ecf0ff"
      })
      .setOrigin(0.5);

    this.percentText = this.add
      .text(GAME_WIDTH / 2, GAME_HEIGHT * 0.58, "0%", {
        fontFamily: "Arial",
        fontSize: "18px",
        color: "#7ee0ff"
      })
      .setOrigin(0.5);

    this.progressBox = this.add.graphics();
    this.progressBox.fillStyle(0x222b44, 1);
    this.progressBox.fillRoundedRect(
      GAME_WIDTH * 0.2,
      GAME_HEIGHT * 0.5,
      GAME_WIDTH * 0.6,
      18,
      6
    );

    this.progressBar = this.add.graphics();

    this.readyText = this.add
      .text(GAME_WIDTH / 2, GAME_HEIGHT * 0.68, "", {
        fontFamily: "Arial",
        fontSize: "16px",
        color: "#73e6a8"
      })
      .setOrigin(0.5);
  }

  private createPlaceholderTextures(): void {
    const g = this.add.graphics();

    g.clear();
    g.fillStyle(0x4da3ff, 1);
    g.fillRoundedRect(0, 0, 24, 24, 6);
    g.generateTexture("player-placeholder", 24, 24);

    g.clear();
    g.fillStyle(0xff6b6b, 1);
    g.fillRoundedRect(0, 0, 24, 24, 6);
    g.generateTexture("enemy-placeholder", 24, 24);

    g.clear();
    g.fillStyle(0x2f8f5b, 1);
    g.fillRect(8, 0, 16, 22);
    g.fillStyle(0x6b3f2a, 1);
    g.fillRect(11, 18, 10, 14);
    g.generateTexture("tree-placeholder", 32, 32);

    g.clear();
    g.fillStyle(0x4b9b5a, 1);
    g.fillRect(0, 0, 32, 32);
    g.lineStyle(1, 0x3f824c, 1);
    for (let i = 0; i < 32; i += 4) {
      g.lineBetween(i, 0, i + 4, 32);
    }
    g.generateTexture("grass-placeholder", 32, 32);

    g.clear();
    g.fillStyle(0x2a78c7, 1);
    g.fillRect(0, 0, 32, 32);
    g.lineStyle(1, 0x6bb8ff, 0.6);
    g.lineBetween(0, 10, 32, 10);
    g.lineBetween(0, 20, 32, 20);
    g.generateTexture("water-placeholder", 32, 32);

    g.clear();
    g.fillStyle(0xb59b71, 1);
    g.fillRect(0, 0, 32, 32);
    g.lineStyle(1, 0x8d7652, 0.8);
    g.strokeRect(0, 0, 32, 32);
    g.generateTexture("path-placeholder", 32, 32);

    g.destroy();
  }
}
