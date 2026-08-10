import Phaser from "phaser";
import { Enemy } from "./Enemy";
import { Player } from "./Player";

export class BossEnemy extends Enemy {
  public readonly bossName: string;
  public readonly rewardGold: number;
  public readonly rewardXp: number;
  public enraged = false;

  constructor(scene: Phaser.Scene, x: number, y: number) {
    super(scene, x, y, "enemy-placeholder", "Goblin King", {
      hp: 180,
      speed: 54,
      attackDamage: 14,
      attackRange: 34,
      aggroRange: 320,
      xpReward: 120,
      attackCooldownMs: 720
    });

    this.bossName = "Goblin King";
    this.rewardGold = 120;
    this.rewardXp = 160;

    this.setScale(1.35);
    this.setTint(0xffd166);
    this.setDepth(8);
  }

  public updateAI(player: Player): void {
    if (this.defeated) {
      return;
    }

    if (!this.enraged && this.hp <= this.maxHp * 0.45) {
      this.enraged = true;
      this.speed += 20;
      this.attackDamage += 5;
      this.setTint(0xff9f1c);
      this.scene.tweens.add({
        targets: this,
        scale: 1.45,
        duration: 180,
        yoyo: true,
        repeat: 2
      });
    }

    super.updateAI(player);
  }

  public takeDamage(amount: number): boolean {
    const result = super.takeDamage(amount);

    if (result && !this.defeated) {
      this.scene.cameras.main.shake(45, 0.0025);
    }

    return result;
  }
}
