import Phaser from "phaser";
import { PLAYER } from "../config";

export type FacingDirection = "up" | "down" | "left" | "right";

type EquipmentBonuses = {
  attack?: number;
  defense?: number;
  hp?: number;
  mana?: number;
  speed?: number;
};

export interface SerializedPlayerState {
  x: number;
  y: number;
  hp: number;
  mana: number;
  level: number;
  xp: number;
  gold: number;
}

export class Player extends Phaser.Physics.Arcade.Sprite {
  public hp = PLAYER.maxHp;
  public maxHp = PLAYER.maxHp;
  public mana = PLAYER.maxMana;
  public maxMana = PLAYER.maxMana;
  public level = 1;
  public xp = 0;
  public gold = 0;

  public speed = PLAYER.speed;
  public attackDamage = 12;
  public defense = 0;
  public attackRange = 44;
  public attackCooldownMs = 320;

  public facing: FacingDirection = "down";

  private nextAttackAt = 0;
  private dead = false;

  private baseMaxHp = PLAYER.maxHp;
  private baseMaxMana = PLAYER.maxMana;
  private baseSpeed = PLAYER.speed;
  private baseAttackDamage = 12;

  private equipmentBonuses: Required<EquipmentBonuses> = {
    attack: 0,
    defense: 0,
    hp: 0,
    mana: 0,
    speed: 0
  };

  constructor(scene: Phaser.Scene, x: number, y: number) {
    super(scene, x, y, "player-down-1");

    scene.add.existing(this);
    scene.physics.add.existing(this);

    this.setDepth(5);
    this.setCollideWorldBounds(true);
    this.setOrigin(0.5);

    const body = this.body as Phaser.Physics.Arcade.Body;
    body.setSize(18, 18, true);
    body.setOffset(3, 3);
  }

  public move(inputX: number, inputY: number): boolean {
    if (this.dead) {
      return false;
    }

    const body = this.body as Phaser.Physics.Arcade.Body;
    body.setVelocity(0);

    if (inputX === 0 && inputY === 0) {
      return false;
    }

    body.setVelocity(inputX * this.speed, inputY * this.speed);
    body.velocity.normalize().scale(this.speed);

    if (Math.abs(inputX) > Math.abs(inputY)) {
      this.facing = inputX > 0 ? "right" : "left";
    } else if (inputY !== 0) {
      this.facing = inputY > 0 ? "down" : "up";
    }

    return true;
  }

  public updateAnimation(isMoving: boolean): void {
    if (this.dead) {
      this.anims.stop();
      return;
    }

    const walkKey = `player-walk-${this.facing}`;
    const idleTexture = `player-${this.facing}-1`;

    if (isMoving) {
      if (this.anims.currentAnim?.key !== walkKey) {
        this.anims.play(walkKey, true);
      }
      return;
    }

    this.anims.stop();
    this.setTexture(idleTexture);
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
      this.anims.stop();
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

    while (this.xp >= this.level * 100) {
      this.xp -= this.level * 100;
      this.level += 1;
      this.recalculateLevelBaseStats();
      this.recalculateDerivedStats();
      this.hp = this.maxHp;
      this.mana = this.maxMana;
    }
  }

  public addGold(amount: number): void {
    this.gold += Math.max(0, amount);
  }

  public spendGold(amount: number): boolean {
    if (amount < 0 || this.gold < amount) {
      return false;
    }

    this.gold -= amount;
    return true;
  }

  public applyEquipmentBonuses(bonuses: EquipmentBonuses): void {
    this.equipmentBonuses = {
      attack: bonuses.attack ?? 0,
      defense: bonuses.defense ?? 0,
      hp: bonuses.hp ?? 0,
      mana: bonuses.mana ?? 0,
      speed: bonuses.speed ?? 0
    };

    this.recalculateDerivedStats();
  }

  public serialize(): SerializedPlayerState {
    return {
      x: this.x,
      y: this.y,
      hp: this.hp,
      mana: this.mana,
      level: this.level,
      xp: this.xp,
      gold: this.gold
    };
  }

  public loadState(state: SerializedPlayerState): void {
    this.setPosition(state.x, state.y);
    this.level = Math.max(1, state.level);
    this.xp = Math.max(0, state.xp);
    this.gold = Math.max(0, state.gold);
    this.recalculateLevelBaseStats();
    this.recalculateDerivedStats();
    this.hp = Phaser.Math.Clamp(state.hp, 1, this.maxHp);
    this.mana = Phaser.Math.Clamp(state.mana, 0, this.maxMana);
    this.dead = false;
    this.clearTint();
    this.setAlpha(1);
  }

  public respawn(x: number, y: number): void {
    this.setPosition(x, y);
    this.hp = this.maxHp;
    this.mana = this.maxMana;
    this.dead = false;
    this.clearTint();
    this.setAlpha(1);
  }

  public isDead(): boolean {
    return this.dead;
  }

  private recalculateLevelBaseStats(): void {
    this.baseMaxHp = PLAYER.maxHp + (this.level - 1) * 12;
    this.baseMaxMana = PLAYER.maxMana + (this.level - 1) * 4;
    this.baseAttackDamage = 12 + (this.level - 1) * 2;
    this.baseSpeed = PLAYER.speed + (this.level - 1) * 3;
  }

  private recalculateDerivedStats(): void {
    this.maxHp = this.baseMaxHp + this.equipmentBonuses.hp;
    this.maxMana = this.baseMaxMana + this.equipmentBonuses.mana;
    this.speed = this.baseSpeed + this.equipmentBonuses.speed;
    this.attackDamage = this.baseAttackDamage + this.equipmentBonuses.attack;
    this.defense = this.equipmentBonuses.defense;

    this.hp = Math.min(this.hp, this.maxHp);
    this.mana = Math.min(this.mana, this.maxMana);
  }
}
