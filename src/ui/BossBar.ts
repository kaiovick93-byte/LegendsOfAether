import Phaser from "phaser";
import { BossEnemy } from "../entities/BossEnemy";

export class BossBar {
  private container: Phaser.GameObjects.Container;
  private bg: Phaser.GameObjects.Rectangle;
  private fill: Phaser.GameObjects.Rectangle;
  private label: Phaser.GameObjects.Text;
  private visible = false;

  constructor(private readonly scene: Phaser.Scene) {
    this.container = scene.add.container(480, 18).setScrollFactor(0).setDepth(200);

    this.bg = scene.add.rectangle(0, 0, 340, 16, 0x3a465f, 1).setOrigin(0.5);
    this.fill = scene.add.rectangle(-170, 0, 340, 16, 0xff6b6b, 1).setOrigin(0, 0.5);
    this.label = scene.add.text(0, -20, "Goblin King", {
      fontFamily: "Arial",
      fontSize: "15px",
      color: "#ecf0ff",
      fontStyle: "bold"
    }).setOrigin(0.5);

    this.container.add([this.bg, this.fill, this.label]);
    this.container.setVisible(false);
  }

  public show(boss: BossEnemy): void {
    this.visible = true;
    this.container.setVisible(true);
    this.label.setText(`${boss.bossName}  ${boss.hp}/${boss.maxHp}`);
    this.update(boss);
  }

  public hide(): void {
    this.visible = false;
    this.container.setVisible(false);
  }

  public update(boss: BossEnemy): void {
    if (!this.visible) {
      return;
    }

    const ratio = Phaser.Math.Clamp(boss.hp / boss.maxHp, 0, 1);
    this.fill.width = 340 * ratio;
    this.label.setText(`${boss.bossName}  ${boss.hp}/${boss.maxHp}`);
  }
}
