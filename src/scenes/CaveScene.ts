import Phaser from "phaser";
import { CombatSystem } from "../combat/CombatSystem";
import { CaveBoss } from "../entities/CaveBoss";
import { Enemy } from "../entities/Enemy";
import { Player } from "../entities/Player";
import { Inventory } from "../inventory/Inventory";
import { InventoryPanel } from "../ui/InventoryPanel";
import { EquipmentManager } from "../equipment/EquipmentManager";
import { SaveManager } from "../save/SaveManager";
import { BossBar } from "../ui/BossBar";
import { DeathOverlay } from "../ui/DeathOverlay";
import { getItemDefinition, getRandomDropDefinition, type ItemDefinition } from "../items/itemCatalog";
import { useHealingConsumable, useManaConsumable } from "../items/itemUse";
import { GAME_HEIGHT, GAME_WIDTH, TILE_SIZE, WORLD } from "../config";
import { Minimap } from "../ui/Minimap";

interface LootDrop {
  item: ItemDefinition;
  sprite: Phaser.GameObjects.Container;
  collected: boolean;
}

export class CaveScene extends Phaser.Scene {
  private player!: Player;
  private combat!: CombatSystem;
  private inventory!: Inventory;
  private inventoryPanel!: InventoryPanel;
  private equipment!: EquipmentManager;
  private saveManager!: SaveManager;
  private bossBar!: BossBar;
  private deathOverlay!: DeathOverlay;

  private enemies: Enemy[] = [];
  private lootDrops: LootDrop[] = [];
  private obstacles: Phaser.GameObjects.Rectangle[] = [];
  private boss!: CaveBoss;

  private cursors!: Phaser.Types.Input.Keyboard.CursorKeys;
  private wasd!: {
    W: Phaser.Input.Keyboard.Key;
    A: Phaser.Input.Keyboard.Key;
    S: Phaser.Input.Keyboard.Key;
    D: Phaser.Input.Keyboard.Key;
  };

  private attackKey!: Phaser.Input.Keyboard.Key;
  private exitKey!: Phaser.Input.Keyboard.Key;
  private inventoryKey!: Phaser.Input.Keyboard.Key;
  private equipKey!: Phaser.Input.Keyboard.Key;
  private healKey!: Phaser.Input.Keyboard.Key;
  private manaKey!: Phaser.Input.Keyboard.Key;
  private interactKey!: Phaser.Input.Keyboard.Key;

  private hpBarFill!: Phaser.GameObjects.Rectangle;
  private xpBarFill!: Phaser.GameObjects.Rectangle;
  private hudText!: Phaser.GameObjects.Text;
  private hintText!: Phaser.GameObjects.Text;
  private messageText!: Phaser.GameObjects.Text;

  private saveTimer?: Phaser.Time.TimerEvent;
  private isRespawning = false;
  private respawnPoint = { x: 72, y: 420 };
  private caveExitZone!: Phaser.GameObjects.Zone;
  private bossArenaZone!: Phaser.GameObjects.Zone;

  private minimap!: Minimap;

  constructor() {
    super("CaveScene");
  }

  create(): void {
    this.saveManager = new SaveManager();
    this.inventory = new Inventory(24);

    this.createWorld();
    this.createPlayer();
    this.equipment = new EquipmentManager(this.player);
    this.loadSavedGame();

    this.inventoryPanel = new InventoryPanel(this, this.inventory);
    this.inventoryPanel.setVisible(false);

    this.bossBar = new BossBar(this);
    this.bossBar.hide();

    this.deathOverlay = new DeathOverlay(this);
    this.deathOverlay.hide();

    this.createHUD();

        this.minimap = new Minimap(this, {
      worldWidth: WORLD.widthTiles * TILE_SIZE,
      worldHeight: WORLD.heightTiles * TILE_SIZE,
      x: 800,
      y: 16,
      width: 144,
      height: 112,
      title: "CAVERNA"
    });

    this.minimap.addMarker({ id: "exit", x: 3 * TILE_SIZE, y: 29 * TILE_SIZE, color: 0xffd166, label: "Saída" });
    this.minimap.addMarker({ id: "boss", x: 790, y: 170, color: 0xff6b6b, label: "Chefe" });


    this.spawnEnemies();
    this.spawnBoss();

    this.combat = new CombatSystem(this, (enemy, player) => {
      this.spawnLoot(enemy.x, enemy.y);
      player.addGold(12 + enemy.xpReward);
      this.requestSave();
    });

    this.cursors = this.input.keyboard!.createCursorKeys();
    this.wasd = this.input.keyboard!.addKeys("W,A,S,D") as {
      W: Phaser.Input.Keyboard.Key;
      A: Phaser.Input.Keyboard.Key;
      S: Phaser.Input.Keyboard.Key;
      D: Phaser.Input.Keyboard.Key;
    };

    this.attackKey = this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);
    this.exitKey = this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.X);
    this.inventoryKey = this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.I);
    this.equipKey = this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.R);
    this.healKey = this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.H);
    this.manaKey = this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.M);
    this.interactKey = this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.E);

    this.cameras.main.setBounds(0, 0, WORLD.widthTiles * TILE_SIZE, WORLD.heightTiles * TILE_SIZE);
    this.physics.world.setBounds(0, 0, WORLD.widthTiles * TILE_SIZE, WORLD.heightTiles * TILE_SIZE);
    this.cameras.main.startFollow(this.player, true, 0.1, 0.1);

    this.saveTimer = this.time.addEvent({
      delay: 15000,
      loop: true,
      callback: () => this.requestSave()
    });

    this.events.once(Phaser.Scenes.Events.SHUTDOWN, this.shutdown, this);
    window.addEventListener("beforeunload", this.handleBeforeUnload);
  }

  shutdown(): void {
    this.requestSave();

    if (this.saveTimer) {
      this.saveTimer.remove(false);
    }

    window.removeEventListener("beforeunload", this.handleBeforeUnload);
  }

  update(): void {
    if (this.player.isDead()) {
      this.player.move(0, 0);
      this.player.updateAnimation(false);
      this.handlePlayerDeath();
      this.updateHUD();
      return;
    }

    this.handleInput();

    for (const enemy of this.enemies) {
      if (!enemy.active) continue;
      enemy.updateAI(this.player);
      this.combat.enemyAttack(enemy, this.player);
    }

    if (this.boss && this.boss.active) {
      this.boss.updateAI(this.player);
      this.combat.enemyAttack(this.boss, this.player);
      this.bossBar.update(this.boss);

      const distToBoss = Phaser.Math.Distance.Between(this.player.x, this.player.y, this.boss.x, this.boss.y);
      if (distToBoss < 280) {
        this.bossBar.show(this.boss);
      } else if (!this.boss.isAlive()) {
        this.bossBar.hide();
      }
    }

    if (Phaser.Input.Keyboard.JustDown(this.attackKey)) {
      const attackList = [this.boss, ...this.enemies];
      this.combat.playerAttack(this.player, attackList);
      this.requestSave();
    }

    if (Phaser.Input.Keyboard.JustDown(this.healKey)) {
      const result = useHealingConsumable(this.player, this.inventory);
      this.showMessage(result.message, result.used ? "#73e6a8" : "#ff6b6b");
      this.inventoryPanel.refresh();
      if (result.used) this.requestSave();
    }

    if (Phaser.Input.Keyboard.JustDown(this.manaKey)) {
      const result = useManaConsumable(this.player, this.inventory);
      this.showMessage(result.message, result.used ? "#7ee0ff" : "#ff6b6b");
      this.inventoryPanel.refresh();
      if (result.used) this.requestSave();
    }

    if (Phaser.Input.Keyboard.JustDown(this.inventoryKey)) {
      this.inventoryPanel.toggle();
      this.inventoryPanel.refresh();
    }

    if (Phaser.Input.Keyboard.JustDown(this.equipKey)) {
      const equipped = this.equipment.autoEquipBestAvailable(this.inventory);
      if (equipped > 0) {
        this.showPickupText(`Equipado: ${equipped} item(ns)`);
        this.inventoryPanel.refresh();
        this.requestSave();
      } else {
        this.showPickupText("Nada para equipar");
      }
    }

    const nearExit = Phaser.Math.Distance.Between(
      this.player.x,
      this.player.y,
      this.caveExitZone.x,
      this.caveExitZone.y
    ) < 42;

    if (nearExit) {
      this.hintText.setText("X: voltar à floresta | E: coletar | I: inventário");
    } else {
      this.hintText.setText("Espaço: atacar | X: sair | E: coletar | I: inventário | R: equipar | H: cura | M: mana");
    }

    if (Phaser.Input.Keyboard.JustDown(this.exitKey) && nearExit) {
      this.requestSave();
      this.scene.start("GreenWoodsScene");
      return;
    }

    if (Phaser.Input.Keyboard.JustDown(this.interactKey)) {
      this.collectNearbyLoot();
    }

    this.updateLootIndicators();
    this.updateHUD();

    this.minimap.update(this.player.x, this.player.y);
  }

  private createWorld(): void {
    const mapWidth = WORLD.widthTiles * TILE_SIZE;
    const mapHeight = WORLD.heightTiles * TILE_SIZE;

    this.cameras.main.setBackgroundColor("#141018");

    this.add.tileSprite(0, 0, mapWidth, mapHeight, "path-placeholder")
      .setOrigin(0)
      .setDepth(0);

    for (let x = 0; x < WORLD.widthTiles; x++) {
      this.add.rectangle(x * TILE_SIZE, 0, 32, 32, 0x2a2430, 1).setOrigin(0).setDepth(0.2);
      this.add.rectangle(x * TILE_SIZE, mapHeight - 32, 32, 32, 0x2a2430, 1).setOrigin(0).setDepth(0.2);
    }

    for (let y = 0; y < WORLD.heightTiles; y++) {
      this.add.rectangle(0, y * TILE_SIZE, 32, 32, 0x2a2430, 1).setOrigin(0).setDepth(0.2);
      this.add.rectangle(mapWidth - 32, y * TILE_SIZE, 32, 32, 0x2a2430, 1).setOrigin(0).setDepth(0.2);
    }

    for (let x = 8; x < 52; x += 6) {
      for (let y = 6; y < 30; y += 7) {
        if ((x + y) % 3 === 0) {
          this.createRock(x, y);
        }
      }
    }

    this.add.rectangle(3 * TILE_SIZE, 29 * TILE_SIZE, 60, 18, 0x62495a, 1)
      .setOrigin(0)
      .setDepth(1.5);

    this.caveExitZone = this.add.zone(3 * TILE_SIZE + 24, 29 * TILE_SIZE + 10, 48, 24);
    this.physics.add.existing(this.caveExitZone, true);

    this.bossArenaZone = this.add.zone(52 * TILE_SIZE + 20, 12 * TILE_SIZE + 20, 110, 80);
    this.physics.add.existing(this.bossArenaZone, true);

    this.add.rectangle(52 * TILE_SIZE, 12 * TILE_SIZE, 140, 96, 0x8cc0ff, 0.12)
      .setOrigin(0)
      .setDepth(0.1);
  }

  private createRock(tileX: number, tileY: number): void {
    const x = tileX * TILE_SIZE;
    const y = tileY * TILE_SIZE;

    this.add.rectangle(x, y, 32, 32, 0x5a556b, 1).setOrigin(0).setDepth(1);

    const collider = this.add.rectangle(x + 2, y + 2, 28, 28, 0x000000, 0);
    this.physics.add.existing(collider, true);
    this.obstacles.push(collider);
  }

  private createPlayer(): void {
    this.player = new Player(this, this.respawnPoint.x, this.respawnPoint.y);
    this.player.setDepth(10);
    this.createPlayerAnimations();
  }

  private createPlayerAnimations(): void {
    const directions = ["down", "up", "left", "right"] as const;

    for (const dir of directions) {
      const key = `player-walk-${dir}`;
      if (this.anims.exists(key)) continue;

      this.anims.create({
        key,
        frames: [
          { key: `player-${dir}-0` },
          { key: `player-${dir}-1` },
          { key: `player-${dir}-2` }
        ],
        frameRate: 8,
        repeat: -1
      });
    }

    this.player.setTexture("player-down-1");
  }

  private loadSavedGame(): void {
    const save = this.saveManager.load();

    if (!save) {
      this.player.loadState({
        x: this.respawnPoint.x,
        y: this.respawnPoint.y,
        hp: this.player.maxHp,
        mana: this.player.maxMana,
        level: 2,
        xp: 0,
        gold: 18
      });
      this.equipment.syncPlayer();
      return;
    }

    this.inventory.loadFromData(save.inventory, getItemDefinition);
    this.player.loadState(save.player);
    this.equipment.loadFromData(save.equipment, this.inventory, getItemDefinition);
  }

  private spawnEnemies(): void {
    this.enemies.push(
      new Enemy(this, 280, 220, "enemy-placeholder", "Morcego Sombrio", {
        hp: 26,
        speed: 112,
        attackDamage: 10,
        aggroRange: 250,
        xpReward: 18
      })
    );

    this.enemies.push(
      new Enemy(this, 540, 260, "enemy-placeholder", "Esqueleto", {
        hp: 48,
        speed: 66,
        attackDamage: 13,
        aggroRange: 240,
        xpReward: 25
      })
    );

    this.enemies.push(
      new Enemy(this, 700, 120, "enemy-placeholder", "Cultista", {
        hp: 54,
        speed: 72,
        attackDamage: 15,
        aggroRange: 260,
        xpReward: 32
      })
    );
  }

  private spawnBoss(): void {
    this.boss = new CaveBoss(this, 790, 170);
    this.boss.setDepth(11);
  }

  private createHUD(): void {
    this.add.rectangle(126, 48, 252, 92, 0x182033, 0.92)
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
      "Espaço: atacar | X: sair | E: coletar | I: inventário | R: equipar | H: cura | M: mana",
      {
        fontFamily: "Arial",
        fontSize: "14px",
        color: "#c8d1ea"
      }
    ).setOrigin(1, 1).setScrollFactor(0).setDepth(52);

    this.messageText = this.add.text(GAME_WIDTH / 2, GAME_HEIGHT - 42, "", {
      fontFamily: "Arial",
      fontSize: "16px",
      color: "#73e6a8",
      backgroundColor: "#182033",
      padding: { left: 10, right: 10, top: 6, bottom: 6 }
    })
      .setOrigin(0.5, 1)
      .setScrollFactor(0)
      .setDepth(80);
  }

  private handleInput(): void {
    const left = this.cursors.left.isDown || this.wasd.A.isDown;
    const right = this.cursors.right.isDown || this.wasd.D.isDown;
    const up = this.cursors.up.isDown || this.wasd.W.isDown;
    const down = this.cursors.down.isDown || this.wasd.S.isDown;

    const moveX = (right ? 1 : 0) - (left ? 1 : 0);
    const moveY = (down ? 1 : 0) - (up ? 1 : 0);

    const moving = this.player.move(moveX, moveY);
    this.player.updateAnimation(moving);
  }

  private updateLootIndicators(): void {
    for (const drop of this.lootDrops) {
      if (drop.collected) continue;

      const dist = Phaser.Math.Distance.Between(this.player.x, this.player.y, drop.sprite.x, drop.sprite.y);
      const label = drop.sprite.list[1] as Phaser.GameObjects.Text | undefined;

      if (label) {
        label.setAlpha(dist < 42 ? 1 : 0.7);
      }
    }
  }

  private collectNearbyLoot(): void {
    const nearest = this.lootDrops.find((drop) => {
      if (drop.collected) return false;

      const dist = Phaser.Math.Distance.Between(this.player.x, this.player.y, drop.sprite.x, drop.sprite.y);
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
    this.requestSave();
  }

  private spawnLoot(x: number, y: number): void {
    const item = getRandomDropDefinition();

    const container = this.add.container(x, y - 8);
    const rarity = this.getRarityColor(item.rarity);

    const orb = this.add.circle(0, 0, 8, rarity, 1);
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

  private showMessage(text: string, color = "#73e6a8"): void {
    this.messageText.setText(text);
    this.messageText.setColor(color);

    this.tweens.killTweensOf(this.messageText);
    this.messageText.setAlpha(1);

    this.tweens.add({
      targets: this.messageText,
      alpha: 0,
      delay: 1200,
      duration: 700
    });
  }

  private handlePlayerDeath(): void {
    if (this.isRespawning || !this.player.isDead()) {
      return;
    }

    this.isRespawning = true;
    this.deathOverlay.show("Você perdeu 12 ouro e vai reaparecer.");

    const lostGold = Math.min(12, this.player.gold);
    this.player.gold -= lostGold;

    this.time.delayedCall(2400, () => {
      this.player.respawn(this.respawnPoint.x, this.respawnPoint.y);
      this.deathOverlay.hide();
      this.isRespawning = false;
      this.requestSave();
    });
  }

  private updateHUD(): void {
    const hpRatio = Phaser.Math.Clamp(this.player.hp / this.player.maxHp, 0, 1);
    const xpNeed = this.player.level * 100;
    const xpRatio = Phaser.Math.Clamp(this.player.xp / xpNeed, 0, 1);

    this.hpBarFill.width = 180 * hpRatio;
    this.xpBarFill.width = 180 * xpRatio;

    this.hudText.setText(
      `HP ${this.player.hp}/${this.player.maxHp} | ATK ${this.player.attackDamage} | DEF ${this.player.defense} | Lv ${this.player.level} | XP ${this.player.xp}/${xpNeed} | Ouro ${this.player.gold}`
    );
  }

  private requestSave(): void {
    this.saveManager.save({
      version: 1,
      savedAt: Date.now(),
      player: this.player.serialize(),
      inventory: this.inventory.serialize(),
      equipment: this.equipment.serialize(),
      quest: null
    });
  }

  private handleBeforeUnload = (): void => {
    this.requestSave();
  };
}