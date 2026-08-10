import Phaser from "phaser";

export interface WanderingNpcOptions {
  name: string;
  homeX: number;
  homeY: number;
  color?: number;
  labelColor?: string;
  wanderRadius?: number;
  minPauseMs?: number;
  maxPauseMs?: number;
  moveSpeed?: number;
}

export class WanderingNpc extends Phaser.GameObjects.Container {
  public readonly npcName: string;

  private readonly homeX: number;
  private readonly homeY: number;
  private readonly wanderRadius: number;
  private readonly minPauseMs: number;
  private readonly maxPauseMs: number;
  private readonly moveSpeed: number;

  private currentTween?: Phaser.Tweens.Tween;
  private pauseTimer?: Phaser.Time.TimerEvent;
  private destroyed = false;

  constructor(private readonly scene: Phaser.Scene, options: WanderingNpcOptions) {
    super(scene, options.homeX, options.homeY);

    this.npcName = options.name;
    this.homeX = options.homeX;
    this.homeY = options.homeY;
    this.wanderRadius = options.wanderRadius ?? 36;
    this.minPauseMs = options.minPauseMs ?? 700;
    this.maxPauseMs = options.maxPauseMs ?? 1800;
    this.moveSpeed = options.moveSpeed ?? 1;

    const bodyColor = options.color ?? 0xf4d35e;
    const labelColor = options.labelColor ?? "#ecf0ff";

    const body = scene.add.rectangle(0, 0, 24, 30, bodyColor, 1);
    body.setStrokeStyle(2, 0x8a6d2f, 1);

    const head = scene.add.circle(0, -18, 10, 0xffe6c7, 1);
    head.setStrokeStyle(2, 0x8a6d2f, 1);

    const label = scene.add.text(0, -40, options.name, {
      fontFamily: "Arial",
      fontSize: "12px",
      color: labelColor,
      backgroundColor: "#182033",
      padding: { left: 5, right: 5, top: 2, bottom: 2 }
    }).setOrigin(0.5);

    const marker = scene.add.text(0, -56, "!", {
      fontFamily: "Arial",
      fontSize: "18px",
      color: "#ffd166",
      fontStyle: "bold"
    }).setOrigin(0.5);

    this.add([body, head, label, marker]);

    scene.add.existing(this);
    this.setDepth(12);

    this.startWandering();
  }

  public startWandering(): void {
    if (this.destroyed) {
      return;
    }

    this.scheduleNextMove();
  }

  public stopWandering(): void {
    this.currentTween?.stop();
    this.pauseTimer?.remove(false);
    this.pauseTimer = undefined;
  }

  public override destroy(fromScene?: boolean): void {
    this.destroyed = true;
    this.stopWandering();
    super.destroy(fromScene);
  }

  private scheduleNextMove(): void {
    if (this.destroyed) {
      return;
    }

    const pause = Phaser.Math.Between(this.minPauseMs, this.maxPauseMs);

    this.pauseTimer = this.scene.time.delayedCall(pause, () => {
      if (this.destroyed) {
        return;
      }
      this.walkToRandomPoint();
    });
  }

  private walkToRandomPoint(): void {
    if (this.destroyed) {
      return;
    }

    const targetX = this.homeX + Phaser.Math.Between(-this.wanderRadius, this.wanderRadius);
    const targetY = this.homeY + Phaser.Math.Between(-this.wanderRadius, this.wanderRadius);

    const distance = Phaser.Math.Distance.Between(this.x, this.y, targetX, targetY);
    const duration = Math.max(500, (distance / this.moveSpeed) * 18);

    this.currentTween = this.scene.tweens.add({
      targets: this,
      x: targetX,
      y: targetY,
      duration,
      ease: "Sine.easeInOut",
      onComplete: () => this.scheduleNextMove()
    });
  }
}
