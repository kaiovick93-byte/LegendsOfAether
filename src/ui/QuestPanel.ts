import Phaser from "phaser";

export class QuestPanel {
  private background: Phaser.GameObjects.Rectangle;
  private titleText: Phaser.GameObjects.Text;
  private bodyText: Phaser.GameObjects.Text;
  private hintText: Phaser.GameObjects.Text;

  constructor(private readonly scene: Phaser.Scene) {
    this.background = scene.add.rectangle(22, 348, 390, 132, 0x182033, 0.96)
      .setOrigin(0, 0)
      .setScrollFactor(0)
      .setStrokeStyle(2, 0x32405f, 1)
      .setDepth(95)
      .setVisible(false);

    this.titleText = scene.add.text(36, 360, "", {
      fontFamily: "Arial",
      fontSize: "18px",
      color: "#ecf0ff",
      fontStyle: "bold"
    }).setScrollFactor(0).setDepth(96).setVisible(false);

    this.bodyText = scene.add.text(36, 388, "", {
      fontFamily: "Arial",
      fontSize: "14px",
      color: "#c8d1ea",
      wordWrap: { width: 360 }
    }).setScrollFactor(0).setDepth(96).setVisible(false);

    this.hintText = scene.add.text(36, 452, "", {
      fontFamily: "Arial",
      fontSize: "13px",
      color: "#73e6a8"
    }).setScrollFactor(0).setDepth(96).setVisible(false);
  }

  public show(title: string, body: string, hint: string): void {
    this.background.setVisible(true);
    this.titleText.setVisible(true);
    this.bodyText.setVisible(true);
    this.hintText.setVisible(true);

    this.titleText.setText(title);
    this.bodyText.setText(body);
    this.hintText.setText(hint);
  }

  public hide(): void {
    this.background.setVisible(false);
    this.titleText.setVisible(false);
    this.bodyText.setVisible(false);
    this.hintText.setVisible(false);
  }
}
