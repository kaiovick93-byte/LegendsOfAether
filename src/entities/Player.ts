import Phaser from "phaser";
import { PLAYER } from "../config";

export type FacingDirection = "up" | "down" | "left" | "right";

export class Player extends Phaser.Physics.Arcade.Sprite {
  public hp = PLAYER.maxHp;
  public maxHp = PLAYER.maxHp;
  public mana = PLAYER.maxMana;
  public maxMana = PLAYER.maxMana;
  public level = 1;
  public xp = 0;

  public speed = PLAYER.speed;
  public attackDamage = 12;
  public attackRange = 44;
  public attackCooldownMs = 320;

  public facing: FacingDirection = "down";

  private nextAttackAt = 0;
  private dead = false;

  constructor(scene: Phaser.Scene, x: number, y: number) {
    super(scene, x, y, "player-placeholder");

    scene.add.existing(this);
    scene.physics.add.existing(this);

    this.setDepth(5);
    this.setCollideWorldBounds(true);
    this.setOrigin(0.5);

    const body = this.body as Phaser.Physics.Arcade.Body;
    body.setSize(18, 18, true);
    body.setOffset(3, 3);
  }

  public move(inputX: number, inputY: number): void {
    if (this.dead) {
      return;
    }

    const body = this.body as Phaser.Physics.Arcade.Body;
    body.setVelocity(0);

    if (inputX === 0 && inputY === 0) {
      return;
    }

    body.setVelocity(inputX * this.speed, inputY * this.speed);
    body.velocity.normalize().scale(this.speed);

    if (Math.abs(inputX) > Math.abs(inputY)) {
      this.facing = inputX > 0 ? "right" : "left";
    } else if (inputY !== 0) {
      this.facing = inputY > 0 ? "down" : "up";
    }
  }

  public canAttack(now: number): boolean {
    return !this.dead && now >= this.nextAttackAt;
  }

  public registerAttack(now: number): void {
    this.nextAttackAt = now + this.attackCooldownMs;
  }

  public takeDamage(amount: number): void {
    if (this.dead) {
      return;
    }

    this.hp = Math.max(0, this.hp - amount);
    this.setTint(0xffa2a2);

    this.scene.time.delayedCall(90, () => {
      if (!this.dead) {
        this.clearTint();
      }
    });

    if (this.hp <= 0) {
      this.dead = true;
      const body = this.body as Phaser.Physics.Arcade.Body;
      body.setVelocity(0);
      this.setTint(0x666666);
      this.setAlpha(0.75);
    }
  }

  public heal(amount: number): void {
    if (this.dead) {
      return;
    }

    this.hp = Math.min(this.maxHp, this.hp + amount);
  }

  public gainXp(amount: number): void {
    this.xp += amount;

    const needed = this.level * 100;
    if (this.xp >= needed) {
      this.xp -= needed;
      this.level += 1;
      this.maxHp += 12;
      this.hp = this.maxHp;
      this.maxMana += 4;
      this.mana = this.maxMana;
      this.attackDamage += 2;
      this.speed += 3;
    }
  }

  public isDead(): boolean {
    return this.dead;
  }
}
