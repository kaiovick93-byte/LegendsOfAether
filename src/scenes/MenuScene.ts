import Phaser from "phaser";
import { GAME_WIDTH, GAME_HEIGHT, COLORS } from "../config";

export class MenuScene extends Phaser.Scene {
  constructor() {
    super("MenuScene");
  }

  create(): void {
    this.cameras.main.setBackgroundColor(COLORS.bg);

    this.add.text(GAME_WIDTH / 2, 120, "LEGENDS OF AETHER", {
      fontFamily: "Arial",
      fontSize: "42px",
      color: "#ecf0ff",
      fontStyle: "bold"
    }).setOrigin(0.5);

    this.add.text(GAME_WIDTH / 2, 178, "Action RPG de navegador", {
      fontFamily: "Arial",
      fontSize: "18px",
      color: "#7ee0ff"
    }).setOrigin(0.5);

    const panel = this.add.rectangle(GAME_WIDTH / 2, GAME_HEIGHT / 2, 420, 220, 0x182033, 1);
    panel.setStrokeStyle(2, 0x32405f, 1);

    const startButton = this.add.text(GAME_WIDTH / 2, GAME_HEIGHT / 2 - 25, "INICIAR / CONTINUAR", {
      fontFamily: "Arial",
      fontSize: "24px",
      color: "#73e6a8",
      backgroundColor: "#24314d",
      padding: { left: 18, right: 18, top: 12, bottom: 12 }
    }).setOrigin(0.5).setInteractive({ useHandCursor: true });

    startButton.on("pointerover", () => startButton.setStyle({ color: "#ffffff", backgroundColor: "#36507c" }));
    startButton.on("pointerout", () => startButton.setStyle({ color: "#73e6a8", backgroundColor: "#24314d" }));
    startButton.on("pointerdown", () => this.scene.start("WorldScene"));

    this.add.text(GAME_WIDTH / 2, GAME_HEIGHT / 2 + 55, "Use WASD ou setas para mover", {
      fontFamily: "Arial",
      fontSize: "16px",
      color: "#c8d1ea"
    }).setOrigin(0.5);

    this.add.text(GAME_WIDTH / 2, GAME_HEIGHT / 2 + 82, "Combate, loot e inventário serão adicionados na próxima entrega", {
      fontFamily: "Arial",
      fontSize: "13px",
      color: "#9aa8c7"
    }).setOrigin(0.5);
  }
}
