import Phaser from "phaser";

export class DialogueBox {
  private background: Phaser.GameObjects.Rectangle;
  private titleText: Phaser.GameObjects.Text;
  private bodyText: Phaser.GameObjects.Text;
  private hintText: Phaser.GameObjects.Text;
  private visible = false;

  constructor(private readonly scene: Phaser.Scene) {
    const x = 22;
    const y = 356;

    this.background = scene.add.rectangle(x, y, 916, 162, 0x182033, 0.96)
      .setOrigin(0, 0)
      .setScrollFactor(0)
      .setDepth(500)
      .setVisible(false);

    this.background.setStrokeStyle(2, 0x32405f, 1);

    this.titleText = scene.add.text(x + 16, y + 12, "", {
      fontFamily: "Arial",
      fontSize: "18px",
      color: "#ffd166",
      fontStyle: "bold"
    }).setScrollFactor(0).setDepth(501).setVisible(false);

    this.bodyText = scene.add.text(x + 16, y + 44, "", {
      fontFamily: "Arial",
      fontSize: "16px",
      color: "#ecf0ff",
      wordWrap: { width: 860 }
    }).setScrollFactor(0).setDepth(501).setVisible(false);

    this.hintText = scene.add.text(x + 16, y + 126, "Enter: avançar | Espaço: fechar", {
      fontFamily: "Arial",
      fontSize: "13px",
      color: "#9aa8c7"
    }).setScrollFactor(0).setDepth(501).setVisible(false);
  }

  public open(title: string, lines: string[]): void {
    this.visible = true;
    this.background.setVisible(true);
    this.titleText.setVisible(true);
    this.bodyText.setVisible(true);
    this.hintText.setVisible(true);

    this.titleText.setText(title);
    this.bodyText.setText(lines.join("\n\n"));
  }

  public close(): void {
    this.visible = false;
    this.background.setVisible(false);
    this.titleText.setVisible(false);
    this.bodyText.setVisible(false);
    this.hintText.setVisible(false);
  }

  public isOpen(): boolean {
    return this.visible;
  }
}
