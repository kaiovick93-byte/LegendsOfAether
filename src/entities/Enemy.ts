import Phaser from "phaser";
import { FacingDirection, Player } from "./Player";

export class Enemy extends Phaser.Physics.Arcade.Sprite {
  public readonly name: string;
  public maxHp: number;
  public hp: number;
  public speed: number;
  public attackDamage: number;
  public attackRange: number;
  public aggroRange: number;
  public xpReward: number;

  public facing: FacingDirection = "down";
  public defeated = false;
  public rewardGranted = false;

  private nextAttackAt = 0;
  private readonly attackCooldownMs: number;

  constructor(
    scene: Phaser.Scene,
    x: number,
    y: number,
    texture = "enemy-placeholder",
    name = "Goblin",
    stats?: {
      hp?: number;
      speed?: number;
      attackDamage?: number;
      attackRange?: number;
      aggroRange?: number;
      xpReward?: number;
      attackCooldownMs?: number;
    }
  ) {
    super(scene, x, y, texture);

    this.name = name;
    this.maxHp = stats?.hp ?? 30;
    this.hp = this.maxHp;
    this.speed = stats?.speed ?? 70;
    this.attackDamage = stats?.attackDamage ?? 8;
    this.attackRange = stats?.attackRange ?? 26;
    this.aggroRange = stats?.aggroRange ?? 220;
    this.xpReward = stats?.xpReward ?? 12;
    this.attackCooldownMs = stats?.attackCooldownMs ?? 850;

    scene.add.existing(this);
    scene.physics.add.existing(this);

    this.setDepth(5);
    this.setCollideWorldBounds(true);

    const body = this.body as Phaser.Physics.Arcade.Body;
    body.setSize(18, 18, true);
    body.setOffset(3, 3);
  }

  public updateAI(player: Player): void {
    if (this.defeated) {
      return;
    }

    const distance = Phaser.Math.Distance.Between(this.x, this.y, player.x, player.y);

    if (distance > this.aggroRange) {
      const body = this.body as Phaser.Physics.Arcade.Body;
      body.setVelocity(0);
      return;
    }

    const dx = player.x - this.x;
    const dy = player.y - this.y;
    const length = Math.max(1, Math.hypot(dx, dy));

    const vx = (dx / length) * this.speed;
    const vy = (dy / length) * this.speed;

    const body = this.body as Phaser.Physics.Arcade.Body;
    body.setVelocity(vx, vy);

    if (Math.abs(vx) > Math.abs(vy)) {
      this.facing = vx > 0 ? "right" : "left";
    } else if (vy !== 0) {
      this.facing = vy > 0 ? "down" : "up";
    }
  }

  public canAttack(now: number): boolean {
    return !this.defeated && now >= this.nextAttackAt;
  }

  public registerAttack(now: number): void {
    this.nextAttackAt = now + this.attackCooldownMs;
  }

  public takeDamage(amount: number): boolean {
    if (this.defeated) {
      return false;
    }

    this.hp = Math.max(0, this.hp - amount);
    this.setTint(0xffb3b3);

    this.scene.time.delayedCall(80, () => {
      if (!this.defeated) {
        this.clearTint();
      }
    });

    if (this.hp <= 0) {
      this.defeated = true;
      const body = this.body as Phaser.Physics.Arcade.Body;
      body.setVelocity(0);
      this.disableBody(true, true);
    }

    return true;
  }

  public isAlive(): boolean {
    return !this.defeated;
  }
}
