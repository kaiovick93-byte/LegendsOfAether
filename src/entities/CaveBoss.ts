import Phaser from "phaser";
import { BossEnemy } from "./BossEnemy";
import { Player } from "./Player";

export class CaveBoss extends BossEnemy {
  constructor(scene: Phaser.Scene, x: number, y: number) {
    super(scene, x, y);
    this.setTexture("enemy-placeholder");
    this.setScale(1.55);
    this.setTint(0x8cc0ff);

    this.maxHp = 260;
    this.hp = this.maxHp;
    this.speed = 48;
    this.attackDamage = 18;
    this.attackRange = 38;
    this.aggroRange = 360;
  }

  public updateAI(player: Player): void {
    super.updateAI(player);

    if (!this.defeated && this.hp <= this.maxHp * 0.3) {
      this.speed = 68;
      this.attackDamage = 24;
      this.setTint(0xc084fc);
    }
  }
}
