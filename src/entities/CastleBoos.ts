import Phaser from "phaser";
import { BossEnemy } from "./BossEnemy";
import { Player } from "./Player";

export class CastleBoss extends BossEnemy {
  public phaseTwo = false;

  constructor(scene: Phaser.Scene, x: number, y: number) {
    super(scene, x, y);

    this.setTexture("enemy-placeholder");
    this.setScale(1.8);
    this.setTint(0x9b7bff);

    this.maxHp = 420;
    this.hp = this.maxHp;
    this.speed = 52;
    this.attackDamage = 22;
    this.attackRange = 40;
    this.aggroRange = 420;
  }

  public updateAI(player: Player): void {
    if (this.defeated) {
      return;
    }

    if (!this.phaseTwo && this.hp <= this.maxHp * 0.5) {
      this.phaseTwo = true;
      this.speed += 24;
      this.attackDamage += 10;
      this.setTint(0xff6b6b);

      this.scene.tweens.add({
        targets: this,
        scale: 1.95,
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
      this.scene.cameras.main.shake(65, 0.003);
    }

    return result;
  }
}
