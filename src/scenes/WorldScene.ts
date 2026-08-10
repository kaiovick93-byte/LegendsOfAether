import Phaser from "phaser";
import { CombatSystem } from "../combat/CombatSystem";
import { Enemy } from "../entities/Enemy";
import { Player } from "../entities/Player";
import { Inventory } from "../inventory/Inventory";
import { InventoryPanel } from "../ui/InventoryPanel";
import { EquipmentManager } from "../equipment/EquipmentManager";
import { getRandomDropDefinition, type ItemDefinition } from "../items/itemCatalog";
import { GAME_HEIGHT, GAME_WIDTH, TILE_SIZE, WORLD } from "../config";

interface LootDrop {
  item: ItemDefinition;
  sprite: Phaser.GameObjects.Container;
  collected: boolean;
}

export class WorldScene extends Phaser.Scene {
  private player!: Player;
  private combat!: CombatSystem;
  private inventory!: Inventory;
  private inventoryPanel!: InventoryPanel;
  private equipment!: EquipmentManager;

  private enemies: Enemy[] = [];
  private lootDrops: LootDrop[] = [];
  private obstacles: Phaser.GameObjects.Rectangle[] = [];

  private cursors!: Phaser.Types.Input.Keyboard.CursorKeys;
  private wasd!: {
    W: Phaser.Input.Keyboard.Key;
    A: Phaser.Input.Keyboard.Key;
    S: Phaser.Input.Keyboard.Key;
    D: Phaser.Input.Keyboard.Key;
  };

  private attackKey!: Phaser.Input.Keyboard.Key;
  private interactKey!: Phaser.Input.Keyboard.Key;
  private inventoryKey!: Phaser.Input.Keyboard.Key;
  private equipKey!: Phaser.Input.Keyboard.Key;

  private hpBarFill!: Phaser.GameObjects.Rectangle;
  private xpBarFill!: Phaser.GameObjects.Rectangle;
  private hudText!: Phaser.GameObjects.Text;
  private hintText!: Phaser.GameObjects.Text;

  constructor() {
    super("WorldScene");
  }

  create(): void {
    this.inventory = new Inventory(24);

    this.createWorld();
    this.createPlayer();

    this.equipment = new EquipmentManager(this.player);
    this.inventoryPanel = new InventoryPanel(this, this.inventory);
    this.inventoryPanel.setVisible(false);

    this.createHUD();
    this.spawnEnemies();

    this.combat = new CombatSystem(this, (enemy, player) => {
      this.spawnLoot(enemy.x, enemy.y);
      player.gainXp(0);
    });

    this.cursors = this.input.keyboard!.createCursorKeys();
    this.wasd = this.input.keyboard!.addKeys("W,A,S,D") as {
      W: Phaser.Input.Keyboard.Key;
      A: Phaser.Input.Keyboard.Key;
      S: Phaser.Input.Keyboard.Key;
      D: Phaser.Input.Keyboard.Key;
    };
    this.attackKey = this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);
    this.interactKey = this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.E);
    this.inventoryKey = this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.I);
    this.equipKey = this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.R);

    this.cameras.main.setBounds(0, 0, WORLD.widthTiles * TILE_SIZE, WORLD.heightTiles * TILE_SIZE);
    this.physics.world.setBounds(0, 0, WORLD.widthTiles * TILE_SIZE, WORLD.heightTiles * TILE_SIZE);
    this.cameras.main.startFollow(this.player, true, 0.1, 0.1);

    for (const obstacle of this.obstacles) {
      this.physics.add.collider(this.player, obstacle);
    }
  }

  update(): void {
    this.handleInput();

    for (const enemy of this.enemies) {
      if (!enemy.active) {
        continue;
      }

      enemy.updateAI(this.player);
      this.combat.enemyAttack(enemy, this.player);
    }

    if (Phaser.Input.Keyboard.JustDown(this.attackKey)) {
      this.combat.playerAttack(this.player, this.enemies);
    }

    if (Phaser.Input.Keyboard.JustDown(this.inventoryKey)) {
      this.inventoryPanel.toggle();
      this.inventoryPanel.refresh();
    }

    if (Phaser.Input.Keyboard.JustDown(this.equipKey)) {
      const equipped = this.equipment.autoEquipBestAvailable(this.inventory);
      if (equipped > 0) {
        this.showPickupText(`Equipado: ${equipped} item(ns)`);
      } else {
        this.showPickupText("Nada para equipar");
      }
      this.inventoryPanel.refresh();
    }

    if (Phaser.Input.Keyboard.JustDown(this.interactKey)) {
      this.collectNearbyLoot();
    }

    this.updateLootIndicators();
    this.updateHUD();
  }

  private createWorld(): void {
    const mapWidth = WORLD.widthTiles * TILE_SIZE;
    const mapHeight = WORLD.heightTiles * TILE_SIZE;

    this.cameras.main.setBackgroundColor("#24354f");

    this.add.tileSprite(0, 0, mapWidth, mapHeight, "grass-placeholder")
      .setOrigin(0)
      .setDepth(0);

    for (let x = 28; x < 36; x++) {
      for (let y = 8; y < 14; y++) {
        this.add.image(x * TILE_SIZE, y * TILE_SIZE, "water-placeholder")
          .setOrigin(0)
          .setDepth(0.2);
      }
    }

    for (let x = 8; x < 18; x++) {
      for (let y = 14; y < 18; y++) {
        this.add.image(x * TILE_SIZE, y * TILE_SIZE, "path-placeholder")
          .setOrigin(0)
          .setDepth(0.15);
      }
    }

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

    this.createHouse(14, 22);
    this.createHouse(17, 22);
    this.createHouse(20, 22);

    this.add.rectangle(mapWidth / 2, mapHeight / 2, mapWidth, mapHeight, 0x000000, 0)
      .setStrokeStyle(4, 0x1e2a3f, 0.9);
  }

  private createTree(tileX: number, tileY: number): void {
    const x = tileX * TILE_SIZE;
    const y = tileY * TILE_SIZE;

    this.add.image(x, y, "tree-placeholder").setOrigin(0).setDepth(1);

    const collider = this.add.rectangle(x + 8, y + 18, 18, 12, 0x000000, 0);
    this.physics.add.existing(collider, true);
    this.obstacles.push(collider);
  }

  private createHouse(tileX: number, tileY: number): void {
    const x = tileX * TILE_SIZE;
    const y = tileY * TILE_SIZE;

    this.add.rectangle(x, y + 10, 64, 38, 0x8f6a4a, 1).setOrigin(0).setDepth(1);
    this.add.rectangle(x + 8, y + 16, 18, 16, 0xc7d8ff, 1).setOrigin(0).setDepth(1.1);
    this.add.triangle(x, y, 0, 46, 32, 0, 64, 46, 0x7b4a2f, 1).setOrigin(0).setDepth(1.2);

    const collider = this.add.rectangle(x + 2, y + 12, 60, 34, 0x000000, 0);
    this.physics.add.existing(collider, true);
    this.obstacles.push(collider);
  }

  private createPlayer(): void {
    this.player = new Player(this, 220, 260);
    this.player.setDepth(10);
  }

  private spawnEnemies(): void {
    this.enemies.push(
      new Enemy(this, 350, 220, "enemy-placeholder", "Goblin", {
        hp: 30,
        speed: 72,
        attackDamage: 8,
        aggroRange: 200,
        xpReward: 12
      })
    );

    this.enemies.push(
      new Enemy(this, 520, 340, "enemy-placeholder", "Slime", {
        hp: 22,
        speed: 58,
        attackDamage: 6,
        aggroRange: 180,
        xpReward: 10
      })
    );

    this.enemies.push(
      new Enemy(this, 640, 180, "enemy-placeholder", "Bat", {
        hp: 18,
        speed: 90,
        attackDamage: 5,
        aggroRange: 230,
        xpReward: 14
      })
    );
  }

  private createHUD(): void {
    this.add.rectangle(110, 42, 228, 86, 0x182033, 0.92)
      .setScrollFactor(0)
      .setStrokeStyle(2, 0x32405f, 1)
      .setDepth(50);

    this.hpBarFill = this.add.rectangle(24, 18, 180, 12, 0x73e6a8, 1)
      .setOrigin(0)
      .setScrollFactor(0)
      .setDepth(52);

    this.add.rectangle(24, 18, 180, 12, 0x3a465f, 1)
      .setOrigin(0)
      .setScrollFactor(0)
      .setDepth(51)
      .setStrokeStyle(1, 0x1d2433, 1);

    this.xpBarFill = this.add.rectangle(24, 36, 0, 10, 0x7ee0ff, 1)
      .setOrigin(0)
      .setScrollFactor(0)
      .setDepth(52);

    this.add.rectangle(24, 36, 180, 10, 0x3a465f, 1)
      .setOrigin(0)
      .setScrollFactor(0)
      .setDepth(51)
      .setStrokeStyle(1, 0x1d2433, 1);

    this.hudText = this.add.text(24, 52, "", {
      fontFamily: "Arial",
      fontSize: "14px",
      color: "#ecf0ff"
    }).setScrollFactor(0).setDepth(52);

    this.hintText = this.add.text(
      GAME_WIDTH - 18,
      GAME_HEIGHT - 18,
      "Espaço: atacar | E: coletar | I: inventário | R: equipar",
      {
        fontFamily: "Arial",
        fontSize: "14px",
        color: "#c8d1ea"
      }
    ).setOrigin(1, 1).setScrollFactor(0).setDepth(52);
  }

  private updateHUD(): void {
    const hpRatio = Phaser.Math.Clamp(this.player.hp / this.player.maxHp, 0, 1);
    const xpNeed = this.player.level * 100;
    const xpRatio = Phaser.Math.Clamp(this.player.xp / xpNeed, 0, 1);

    this.hpBarFill.width = 180 * hpRatio;
    this.xpBarFill.width = 180 * xpRatio;

    this.hudText.setText(
      `HP ${this.player.hp}/${this.player.maxHp} | ATK ${this.player.attackDamage} | DEF ${this.player.defense} | Lv ${this.player.level} | XP ${this.player.xp}/${xpNeed}`
    );
  }

  private handleInput(): void {
    const left = this.cursors.left.isDown || this.wasd.A.isDown;
    const right = this.cursors.right.isDown || this.wasd.D.isDown;
    const up = this.cursors.up.isDown || this.wasd.W.isDown;
    const down = this.cursors.down.isDown || this.wasd.S.isDown;

    const moveX = (right ? 1 : 0) - (left ? 1 : 0);
    const moveY = (down ? 1 : 0) - (up ? 1 : 0);

    this.player.move(moveX, moveY);
  }

  private updateLootIndicators(): void {
    for (const drop of this.lootDrops) {
      if (drop.collected) {
        continue;
      }

      const dist = Phaser.Math.Distance.Between(
        this.player.x,
        this.player.y,
        drop.sprite.x,
        drop.sprite.y
      );

      const label = drop.sprite.list[1] as Phaser.GameObjects.Text | undefined;

      if (label) {
        label.setAlpha(dist < 42 ? 1 : 0.7);
      }
    }
  }

  private collectNearbyLoot(): void {
    const nearest = this.lootDrops.find((drop) => {
      if (drop.collected) {
        return false;
      }

      const dist = Phaser.Math.Distance.Between(
        this.player.x,
        this.player.y,
        drop.sprite.x,
        drop.sprite.y
      );

      return dist <= 34;
    });

    if (!nearest) {
      return;
    }

    const added = this.inventory.addItem(nearest.item, 1);

    if (!added) {
      this.showPickupText("Inventário cheio");
      return;
    }

    nearest.collected = true;
    nearest.sprite.destroy();

    this.showPickupText(nearest.item.name);
    this.inventoryPanel.refresh();
  }

  private spawnLoot(x: number, y: number): void {
    const item = getRandomDropDefinition();

    const container = this.add.container(x, y - 8);
    const rarityColor = this.getRarityColor(item.rarity);

    const orb = this.add.circle(0, 0, 8, rarityColor, 1);
    orb.setStrokeStyle(2, 0xffffff, 0.45);

    const label = this.add.text(16, -10, item.name, {
      fontFamily: "Arial",
      fontSize: "12px",
      color: "#ecf0ff",
      backgroundColor: "#182033",
      padding: { left: 6, right: 6, top: 3, bottom: 3 }
    });

    container.add([orb, label]);
    container.setDepth(20);

    this.tweens.add({
      targets: container,
      y: y - 20,
      duration: 900,
      yoyo: true,
      repeat: -1,
      ease: "Sine.easeInOut"
    });

    this.lootDrops.push({
      item,
      sprite: container,
      collected: false
    });
  }

  private getRarityColor(rarity: ItemDefinition["rarity"]): number {
    switch (rarity) {
      case "uncommon":
        return 0x73e6a8;
      case "rare":
        return 0x7ee0ff;
      case "epic":
        return 0xc084fc;
      case "legendary":
        return 0xffd166;
      case "common":
      default:
        return 0xecf0ff;
    }
  }

  private showPickupText(text: string): void {
    const pickup = this.add.text(this.player.x, this.player.y - 28, `+ ${text}`, {
      fontFamily: "Arial",
      fontSize: "14px",
      color: "#73e6a8",
      fontStyle: "bold"
    });

    pickup.setOrigin(0.5);
    pickup.setDepth(60);

    this.tweens.add({
      targets: pickup,
      y: pickup.y - 18,
      alpha: 0,
      duration: 800,
      onComplete: () => pickup.destroy()
    });
  }
}
