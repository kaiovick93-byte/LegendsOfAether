import Phaser from "phaser";
import { GAME_WIDTH, GAME_HEIGHT, TILE_SIZE, WORLD, PLAYER } from "../config";

type Direction = "idle" | "up" | "down" | "left" | "right";

export class WorldScene extends Phaser.Scene {
  private player!: Phaser.Physics.Arcade.Sprite;
  private cursors!: Phaser.Types.Input.Keyboard.CursorKeys;
  private wasd!: Record<string, Phaser.Input.Keyboard.Key>;
  private direction: Direction = "idle";

  private hp = PLAYER.maxHp;
  private xp = 0;

  private hpText!: Phaser.GameObjects.Text;
  private xpText!: Phaser.GameObjects.Text;
  private helpText!: Phaser.GameObjects.Text;

  constructor() {
    super("WorldScene");
  }

  create(): void {
    this.cameras.main.setBackgroundColor("#24354f");

    this.createWorld();
    this.createPlayer();
    this.createHUD();

    this.cursors = this.input.keyboard!.createCursorKeys();
    this.wasd = this.input.keyboard!.addKeys("W,A,S,D") as Record<string, Phaser.Input.Keyboard.Key>;

    this.cameras.main.startFollow(this.player, true, 0.1, 0.1);
    this.cameras.main.setBounds(0, 0, WORLD.widthTiles * TILE_SIZE, WORLD.heightTiles * TILE_SIZE);
  }

  update(_: number, delta: number): void {
    this.handleMovement(delta);
    this.updateHUD();
  }

  private createWorld(): void {
    const mapWidth = WORLD.widthTiles * TILE_SIZE;
    const mapHeight = WORLD.heightTiles * TILE_SIZE;

    this.physics.world.setBounds(0, 0, mapWidth, mapHeight);
    this.cameras.main.setBounds(0, 0, mapWidth, mapHeight);

    const grass = this.add.tileSprite(0, 0, mapWidth, mapHeight, "grass-placeholder")
      .setOrigin(0)
      .setScrollFactor(1);

    // Trilhas simples
    for (let x = 8; x < 18; x++) {
      for (let y = 14; y < 18; y++) {
        this.add.image(x * TILE_SIZE, y * TILE_SIZE, "path-placeholder")
          .setOrigin(0)
          .setDepth(0.1);
      }
    }

    // Lago
    for (let x = 28; x < 36; x++) {
      for (let y = 8; y < 14; y++) {
        this.add.image(x * TILE_SIZE, y * TILE_SIZE, "water-placeholder")
          .setOrigin(0)
          .setDepth(0.05);
      }
    }

    // Árvores e blocos de colisão invisíveis
    this.createTree(6, 7);
    this.createTree(7, 7);
    this.createTree(8, 7);
    this.createTree(9, 7);
    this.createTree(10, 7);
    this.createTree(11, 7);
    this.createTree(12, 7);

    this.createTree(40, 20);
    this.createTree(41, 20);
    this.createTree(42, 20);
    this.createTree(43, 20);

    this.createTree(18, 28);
    this.createTree(19, 28);
    this.createTree(20, 28);
    this.createTree(21, 28);
    this.createTree(22, 28);

    // Pequena cidade inicial
    this.createHouse(14, 22);
    this.createHouse(17, 22);
    this.createHouse(20, 22);

    // borda do mundo
    const border = this.add.rectangle(mapWidth / 2, mapHeight / 2, mapWidth, mapHeight, 0x000000, 0);
    border.setStrokeStyle(4, 0x1e2a3f, 0.9);
  }

  private createTree(tileX: number, tileY: number): void {
    this.add.image(tileX * TILE_SIZE, tileY * TILE_SIZE, "tree-placeholder")
      .setOrigin(0)
      .setDepth(1);
  }

  private createHouse(tileX: number, tileY: number): void {
    const x = tileX * TILE_SIZE;
    const y = tileY * TILE_SIZE;

    const house = this.add.rectangle(x, y, 64, 48, 0x8f6a4a, 1)
      .setOrigin(0)
      .setDepth(1);

    house.setStrokeStyle(2, 0x5e442f, 1);

    this.add.rectangle(x + 8, y + 8, 20, 18, 0xc7d8ff, 1).setOrigin(0).setDepth(1.1);
    this.add.triangle(x + 20, y - 6, 0, 40, 20, 0, 40, 40, 0x7b4a2f, 1)
      .setOrigin(0)
      .setDepth(1.2);
  }

  private createPlayer(): void {
    this.player = this.physics.add.sprite(220, 260, "player-placeholder");
    this.player.setCollideWorldBounds(true);
    this.player.setSize(18, 18, true);
    this.player.setOffset(3, 3);
    this.player.setDepth(2);
  }

  private createHUD(): void {
    const panel = this.add.rectangle(120, 42, 220, 58, 0x182033, 0.9)
      .setScrollFactor(0)
      .setStrokeStyle(2, 0x32405f, 1)
      .setDepth(10);

    this.hpText = this.add.text(22, 20, `HP: ${this.hp}/${PLAYER.maxHp}`, {
      fontFamily: "Arial",
      fontSize: "16px",
      color: "#ffdddd"
    }).setScrollFactor(0).setDepth(11);

    this.xpText = this.add.text(22, 40, `XP: ${this.xp}`, {
      fontFamily: "Arial",
      fontSize: "16px",
      color: "#cfe6ff"
    }).setScrollFactor(0).setDepth(11);

    this.helpText = this.add.text(GAME_WIDTH - 18, GAME_HEIGHT - 18, "WASD / Setas | Espaço: ação (futuro)", {
      fontFamily: "Arial",
      fontSize: "14px",
      color: "#c8d1ea"
    }).setOrigin(1, 1).setScrollFactor(0).setDepth(11);
  }

  private updateHUD(): void {
    this.hpText.setText(`HP: ${this.hp}/${PLAYER.maxHp}`);
    this.xpText.setText(`XP: ${this.xp}`);
  }

  private handleMovement(delta: number): void {
    const speed = PLAYER.speed;
    const body = this.player.body as Phaser.Physics.Arcade.Body;

    body.setVelocity(0);

    const left = this.cursors.left?.isDown || this.wasd.A?.isDown;
    const right = this.cursors.right?.isDown || this.wasd.D?.isDown;
    const up = this.cursors.up?.isDown || this.wasd.W?.isDown;
    const down = this.cursors.down?.isDown || this.wasd.S?.isDown;

    if (left) body.setVelocityX(-speed);
    if (right) body.setVelocityX(speed);
    if (up) body.setVelocityY(-speed);
    if (down) body.setVelocityY(speed);

    body.velocity.normalize().scale(speed);

    if (body.velocity.lengthSq() === 0) {
      this.direction = "idle";
      this.player.anims.stop();
      this.player.setFrame(0);
      return;
    }

    if (Math.abs(body.velocity.x) > Math.abs(body.velocity.y)) {
      this.direction = body.velocity.x > 0 ? "right" : "left";
    } else {
      this.direction = body.velocity.y > 0 ? "down" : "up";
    }

    const walkOffset = Math.sin(this.time.now / 120) * 0.5;
    this.player.setAngle(0);
    this.player.setScale(1 + walkOffset * 0.01);
  }
}
