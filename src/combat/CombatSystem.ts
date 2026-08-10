import Phaser from "phaser";
import { Enemy } from "../entities/Enemy";
import { Player } from "../entities/Player";

export class CombatSystem {
  constructor(private readonly scene: Phaser.Scene) {}

  public playerAttack(player: Player, enemies: Enemy[]): void {
    const now = this.scene.time.now;

    if (!player.canAttack(now)) {
      return;
    }

    player.registerAttack(now);

    const hitBox = this.getAttackHitBox(player);
    this.drawSlashEffect(hitBox, player.facing);

    let hitSomething = false;

    for (const enemy of enemies) {
      if (!enemy.active || !enemy.isAlive()) {
        continue;
      }

      const enemyBounds = enemy.getBounds();

      if (Phaser.Geom.Intersects.RectangleToRectangle(hitBox, enemyBounds)) {
        hitSomething = true;

        enemy.takeDamage(player.attackDamage);

        this.spawnFloatingText(
          enemy.x,
          enemy.y - 24,
          `-${player.attackDamage}`,
          "#ffdddd"
        );

        if (!enemy.isAlive() && !enemy.rewardGranted) {
          enemy.rewardGranted = true;
          player.gainXp(enemy.xpReward);
          this.spawnFloatingText(
            enemy.x,
            enemy.y - 42,
            `+${enemy.xpReward} XP`,
            "#73e6a8"
          );
        }
      }
    }

    if (!hitSomething) {
      this.spawnFloatingText(player.x, player.y - 30, "MISS", "#ffd166");
    }
  }

  public enemyAttack(enemy: Enemy, player: Player): void {
    const now = this.scene.time.now;

    if (!enemy.canAttack(now) || player.isDead() || !enemy.isAlive()) {
      return;
    }

    const distance = Phaser.Math.Distance.Between(enemy.x, enemy.y, player.x, player.y);
    if (distance > enemy.attackRange) {
      return;
    }

    enemy.registerAttack(now);
    player.takeDamage(enemy.attackDamage);

    this.spawnFloatingText(
      player.x,
      player.y - 30,
      `-${enemy.attackDamage}`,
      "#ff6b6b"
    );
  }

  private getAttackHitBox(player: Player): Phaser.Geom.Rectangle {
    const size = 34;

    switch (player.facing) {
      case "up":
        return new Phaser.Geom.Rectangle(player.x - size / 2, player.y - 46, size, 28);
      case "down":
        return new Phaser.Geom.Rectangle(player.x - size / 2, player.y + 10, size, 28);
      case "left":
        return new Phaser.Geom.Rectangle(player.x - 46, player.y - size / 2, 28, size);
      case "right":
      default:
        return new Phaser.Geom.Rectangle(player.x + 10, player.y - size / 2, 28, size);
    }
  }

  private drawSlashEffect(hitBox: Phaser.Geom.Rectangle, facing: string): void {
    const effect = this.scene.add.rectangle(
      hitBox.centerX,
      hitBox.centerY,
      hitBox.width,
      hitBox.height,
      0x7ee0ff,
      0.28
    );

    effect.setDepth(25);

    if (facing === "left" || facing === "right") {
      effect.setAngle(18);
    } else {
      effect.setAngle(0);
    }

    this.scene.tweens.add({
      targets: effect,
      alpha: 0,
      duration: 120,
      onComplete: () => effect.destroy()
    });
  }

  private spawnFloatingText(
    x: number,
    y: number,
    text: string,
    color: string
  ): void {
    const label = this.scene.add.text(x, y, text, {
      fontFamily: "Arial",
      fontSize: "14px",
      color,
      fontStyle: "bold"
    });

    label.setOrigin(0.5);
    label.setDepth(30);

    this.scene.tweens.add({
      targets: label,
      y: y - 22,
      alpha: 0,
      duration: 700,
      ease: "Power2",
      onComplete: () => label.destroy()
    });
  }
}
