import Phaser from "phaser";

export class DeathOverlay {
  private background: Phaser.GameObjects.Rectangle;
  private title: Phaser.GameObjects.Text;
  private body: Phaser.GameObjects.Text;
  private visible = false;

  constructor(private readonly scene: Phaser.Scene) {
    const centerX = scene.scale.width / 2;
    const centerY = scene.scale.height / 2;

    this.background = scene.add.rectangle(centerX, centerY, 420, 180, 0x000000, 0.72)
      .setScrollFactor(0)
      .setDepth(300)
      .setVisible(false);

    this.title = scene.add.text(centerX, centerY - 30, "VOCÊ CAIU EM BATALHA", {
      fontFamily: "Arial",
      fontSize: "26px",
      color: "#ff6b6b",
      fontStyle: "bold"
    }).setOrigin(0.5).setScrollFactor(0).setDepth(301).setVisible(false);

    this.body = scene.add.text(centerX, centerY + 20, "Respawn em instantes...", {
      fontFamily: "Arial",
      fontSize: "18px",
      color: "#ecf0ff"
    }).setOrigin(0.5).setScrollFactor(0).setDepth(301).setVisible(false);
  }

  public show(message = "Respawn em instantes..."): void {
    this.visible = true;
    this.background.setVisible(true);
    this.title.setVisible(true);
    this.body.setVisible(true);
    this.body.setText(message);
  }

  public hide(): void {
    this.visible = false;
    this.background.setVisible(false);
    this.title.setVisible(false);
    this.body.setVisible(false);
  }

  public isVisible(): boolean {
    return this.visible;
  }
}
