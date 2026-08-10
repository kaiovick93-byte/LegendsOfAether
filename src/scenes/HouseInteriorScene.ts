import Phaser from "phaser";
import { GAME_HEIGHT, GAME_WIDTH } from "../config";

export class HouseInteriorScene extends Phaser.Scene {
  private exitKey!: Phaser.Input.Keyboard.Key;
  private bedKey!: Phaser.Input.Keyboard.Key;
  private goldText!: Phaser.GameObjects.Text;
  private messageText!: Phaser.GameObjects.Text;

  constructor() {
    super("HouseInteriorScene");
  }

  create(): void {
    this.cameras.main.setBackgroundColor("#2a1f2f");

    // Piso
    for (let x = 0; x < 30; x++) {
      for (let y = 0; y < 17; y++) {
        const shade = (x + y) % 2 === 0 ? 0x4a3a4e : 0x433545;
        this.add.rectangle(x * 32, y * 32, 32, 32, shade, 1).setOrigin(0);
      }
    }

    // Parede e mobília simples
    this.add.rectangle(0, 0, 960, 32, 0x6a4f3f, 1).setOrigin(0);
    this.add.rectangle(0, 0, 32, 540, 0x6a4f3f, 1).setOrigin(0);
    this.add.rectangle(928, 0, 32, 540, 0x6a4f3f, 1).setOrigin(0);
    this.add.rectangle(0, 508, 960, 32, 0x6a4f3f, 1).setOrigin(0);

    this.add.rectangle(140, 180, 84, 40, 0x8d6e63, 1);
    this.add.rectangle(300, 220, 120, 56, 0x5c4b43, 1);
    this.add.rectangle(540, 170, 92, 36, 0x7b5b4d, 1);

    this.add.text(480, 84, "Casa da Vila", {
      fontFamily: "Arial",
      fontSize: "30px",
      color: "#ecf0ff",
      fontStyle: "bold"
    }).setOrigin(0.5);

    this.add.text(480, 126, "Um lugar seguro para descansar e organizar seus itens.", {
      fontFamily: "Arial",
      fontSize: "16px",
      color: "#c8d1ea"
    }).setOrigin(0.5);

    this.goldText = this.add.text(24, 20, "", {
      fontFamily: "Arial",
      fontSize: "16px",
      color: "#ffd166",
      backgroundColor: "#182033",
      padding: { left: 8, right: 8, top: 5, bottom: 5 }
    });

    this.messageText = this.add.text(GAME_WIDTH / 2, GAME_HEIGHT - 54, "", {
      fontFamily: "Arial",
      fontSize: "16px",
      color: "#73e6a8",
      backgroundColor: "#182033",
      padding: { left: 10, right: 10, top: 6, bottom: 6 }
    }).setOrigin(0.5, 1);

    this.add.text(480, 300, "Pressione E perto da porta para sair.", {
      fontFamily: "Arial",
      fontSize: "18px",
      color: "#ecf0ff"
    }).setOrigin(0.5);

    this.add.text(480, 340, "Pressione H para descansar na cama.", {
      fontFamily: "Arial",
      fontSize: "16px",
      color: "#c8d1ea"
    }).setOrigin(0.5);

    this.add.rectangle(460, 402, 90, 48, 0x8cc0ff, 1);
    this.add.rectangle(466, 406, 78, 40, 0xffffff, 0.18);

    this.exitKey = this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.E);
    this.bedKey = this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.H);

    this.refreshText();

    this.events.on("wake", this.refreshText, this);
  }

  update(): void {
    if (Phaser.Input.Keyboard.JustDown(this.exitKey)) {
      this.scene.start("WorldScene");
      return;
    }

    if (Phaser.Input.Keyboard.JustDown(this.bedKey)) {
      this.showMessage("Você descansou. Vida e mana restauradas.");
      this.refreshText();
    }
  }

  private refreshText(): void {
    const saved = this.registry.get("playerState") as { gold?: number; hp?: number; mana?: number } | undefined;

    this.goldText.setText(`Ouro: ${saved?.gold ?? 0}`);
  }

  private showMessage(text: string): void {
    this.messageText.setText(text);
    this.messageText.setAlpha(1);

    this.tweens.killTweensOf(this.messageText);
    this.tweens.add({
      targets: this.messageText,
      alpha: 0,
      delay: 1200,
      duration: 700
    });
  }
}
