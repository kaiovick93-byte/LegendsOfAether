import Phaser from "phaser";
import { GAME_HEIGHT, GAME_WIDTH } from "../config";

export class VictoryScene extends Phaser.Scene {
  constructor() {
    super("VictoryScene");
  }

  create(): void {
    this.cameras.main.setBackgroundColor("#0b1020");

    this.add.rectangle(GAME_WIDTH / 2, GAME_HEIGHT / 2, GAME_WIDTH, GAME_HEIGHT, 0x0b1020, 1);

    this.add.text(GAME_WIDTH / 2, 92, "VITÓRIA", {
      fontFamily: "Arial",
      fontSize: "54px",
      color: "#ffd166",
      fontStyle: "bold"
    }).setOrigin(0.5);

    this.add.text(GAME_WIDTH / 2, 150, "O castelo foi purificado e o Selo Real de Aether foi recuperado.", {
      fontFamily: "Arial",
      fontSize: "18px",
      color: "#ecf0ff"
    }).setOrigin(0.5);

    const panel = this.add.rectangle(GAME_WIDTH / 2, GAME_HEIGHT / 2 + 18, 560, 220, 0x182033, 0.96);
    panel.setStrokeStyle(2, 0x32405f, 1);

    const lines = [
      "Legends of Aether",
      "Projeto base: Phaser 3 + TypeScript",
      "Combate, loot, inventário, missões, loja e save automático",
      "Tela criada como fechamento do arco principal"
    ];

    this.add.text(GAME_WIDTH / 2, GAME_HEIGHT / 2 - 10, lines.join("\n\n"), {
      fontFamily: "Arial",
      fontSize: "18px",
      color: "#c8d1ea",
      align: "center",
      wordWrap: { width: 500 }
    }).setOrigin(0.5);

    const continueButton = this.add.text(GAME_WIDTH / 2, GAME_HEIGHT / 2 + 112, "CONTINUAR EXPLORANDO", {
      fontFamily: "Arial",
      fontSize: "18px",
      color: "#73e6a8",
      backgroundColor: "#24314d",
      padding: { left: 16, right: 16, top: 10, bottom: 10 }
    }).setOrigin(0.5).setInteractive({ useHandCursor: true });

    const menuButton = this.add.text(GAME_WIDTH / 2, GAME_HEIGHT / 2 + 160, "VOLTAR AO MENU", {
      fontFamily: "Arial",
      fontSize: "16px",
      color: "#ecf0ff",
      backgroundColor: "#24314d",
      padding: { left: 14, right: 14, top: 8, bottom: 8 }
    }).setOrigin(0.5).setInteractive({ useHandCursor: true });

    continueButton.on("pointerover", () => continueButton.setStyle({ color: "#ffffff", backgroundColor: "#36507c" }));
    continueButton.on("pointerout", () => continueButton.setStyle({ color: "#73e6a8", backgroundColor: "#24314d" }));
    continueButton.on("pointerdown", () => {
      this.scene.start("WorldScene");
    });

    menuButton.on("pointerover", () => menuButton.setStyle({ color: "#ffffff", backgroundColor: "#36507c" }));
    menuButton.on("pointerout", () => menuButton.setStyle({ color: "#ecf0ff", backgroundColor: "#24314d" }));
    menuButton.on("pointerdown", () => {
      this.scene.start("MenuScene");
    });

    this.add.text(GAME_WIDTH / 2, GAME_HEIGHT - 28, "Obrigado por jogar.", {
      fontFamily: "Arial",
      fontSize: "14px",
      color: "#9aa8c7"
    }).setOrigin(0.5);
  }
}
