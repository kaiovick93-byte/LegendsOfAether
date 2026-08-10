import Phaser from "phaser";
import { CombatSystem } from "../combat/CombatSystem";
import { Enemy } from "../entities/Enemy";
import { Player } from "../entities/Player";
import { Inventory } from "../inventory/Inventory";
import { InventoryPanel } from "../ui/InventoryPanel";
import { EquipmentManager } from "../equipment/EquipmentManager";
import { SaveManager } from "../save/SaveManager";
import { ShopPanel } from "../shop/ShopPanel";
import { QuestManager } from "../quests/QuestManager";
import { QuestPanel } from "../ui/QuestPanel";
import { BossBar } from "../ui/BossBar";
import { DeathOverlay } from "../ui/DeathOverlay";
import { Npc } from "../npc/Npc";
import { getItemDefinition, getRandomDropDefinition, type ItemDefinition } from "../items/itemCatalog";
import { useHealingConsumable, useManaConsumable } from "../items/itemUse";
import { GAME_HEIGHT, GAME_WIDTH, TILE_SIZE, WORLD } from "../config";

interface LootDrop {
  item: ItemDefinition;
  sprite: Phaser.GameObjects.Container;
  collected: boolean;
}

export class GreenWoodsScene extends Phaser.Scene {
  private player!: Player;
  private combat!: CombatSystem;
  private inventory!: Inventory;
  private inventoryPanel!: InventoryPanel;
  private equipment!: EquipmentManager;
  private saveManager!: SaveManager;
  private shopPanel!: ShopPanel;
  private questManager!: QuestManager;
  private questPanel!: QuestPanel;
  private bossBar!: BossBar;
  private deathOverlay!: DeathOverlay;

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
  private exitKey!: Phaser.Input.Keyboard.Key;
  private healKey!: Phaser.Input.Keyboard.Key;
  private manaKey!: Phaser.Input.Keyboard.Key;
  private oneKey!: Phaser.Input.Keyboard.Key;
  private twoKey!: Phaser.Input.Keyboard.Key;
  private threeKey!: Phaser.Input.Keyboard.Key;
  private fourKey!: Phaser.Input.Keyboard.Key;

  private hpBarFill!: Phaser.GameObjects.Rectangle;
  private xpBarFill!: Phaser.GameObjects.Rectangle;
  private hudText!: Phaser.GameObjects.Text;
  private hintText!: Phaser.GameObjects.Text;
  private messageText!: Phaser.GameObjects.Text;

  private saveTimer?: Phaser.Time.TimerEvent;
  private isRespawning = false;
  private respawnPoint = { x: 130, y: 520 };

  private cityReturnZone!: Phaser.GameObjects.Zone;
  private caveEntranceZone!: Phaser.GameObjects.Zone;

  constructor() {
    super("GreenWoodsScene");
  }

  create(): void {
    this.saveManager = new SaveManager();
    this.inventory = new Inventory(24);
    this.questManager = new QuestManager();

    this.createWorld();
    this.createPlayer();
    this.equipment = new EquipmentManager(this.player);
    this.loadSavedGame();

    this.inventoryPanel = new InventoryPanel(this, this.inventory);
    this.inventoryPanel.setVisible(false);

    this.questPanel = new QuestPanel(this);
    this.questPanel.hide();

    this.bossBar = new BossBar(this);
    this.bossBar.hide();

    this.deathOverlay = new DeathOverlay(this);
    this.deathOverlay.hide();

    this.createHUD();
    this.spawnEnemies();
    this.spawnForestGuide();

    this.combat = new CombatSystem(this, (enemy, player) => {
      this.spawnLoot(enemy.x, enemy.y);
      player.addGold(10 + enemy.xpReward);
      this.requestSave();
    });

    this.shopPanel = new ShopPanel(this, this.player, this.inventory, () => {
      this.inventoryPanel.refresh();
      this.requestSave();
    });
    this.shopPanel.setVisible(false);

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
    this.exitKey = this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.X);
    this.healKey = this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.H);
    this.manaKey = this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.M);
    this.oneKey = this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.ONE);
    this.twoKey = this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.TWO);
    this.threeKey = this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.THREE);
    this.fourKey = this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.FOUR);

    this.cameras.main.setBounds(0, 0, WORLD.widthTiles * TILE_SIZE, WORLD.heightTiles * TILE_SIZE);
    this.physics.world.setBounds(0, 0, WORLD.widthTiles * TILE_SIZE, WORLD.heightTiles * TILE_SIZE);
    this.cameras.main.startFollow(this.player, true, 0.1, 0.1);

    for (const obstacle of this.obstacles) {
      this.physics.add.collider(this.player, obstacle);
    }

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
      if (!enemy.active) {
        continue;
      }

      enemy.updateAI(this.player);
      this.combat.enemyAttack(enemy, this.player);
    }

    if (Phaser.Input.Keyboard.JustDown(this.attackKey)) {
      this.combat.playerAttack(this.player, this.enemies);
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

    if (Phaser.Input.Keyboard.JustDown(this.exitKey)) {
      const nearCity = Phaser.Math.Distance.Between(
        this.player.x,
        this.player.y,
        this.cityReturnZone.x,
        this.cityReturnZone.y
      ) < 36;

      const nearCave = Phaser.Math.Distance.Between(
        this.player.x,
        this.player.y,
        this.caveEntranceZone.x,
        this.caveEntranceZone.y
      ) < 36;

      if (nearCity) {
        this.requestSave();
        this.scene.start("WorldScene");
        return;
      }

      if (nearCave) {
        this.requestSave();
        this.scene.start("CaveScene");
        return;
      }
    }

    if (Phaser.Input.Keyboard.JustDown(this.interactKey)) {
      if (this.shopPanel.isVisible()) {
        return;
      }
      this.collectNearbyLoot();
    }

    if (Phaser.Input.Keyboard.JustDown(this.oneKey)) this.shopPanel.buyByShortcut(0);
    if (Phaser.Input.Keyboard.JustDown(this.twoKey)) this.shopPanel.buyByShortcut(1);
    if (Phaser.Input.Keyboard.JustDown(this.threeKey)) this.shopPanel.buyByShortcut(2);
    if (Phaser.Input.Keyboard.JustDown(this.fourKey)) this.shopPanel.buyByShortcut(3);

    this.updateLootIndicators();
    this.updateHUD();

    const nearCity = Phaser.Math.Distance.Between(
      this.player.x,
      this.player.y,
      this.cityReturnZone.x,
      this.cityReturnZone.y
    ) < 42;

    const nearCave = Phaser.Math.Distance.Between(
      this.player.x,
      this.player.y,
      this.caveEntranceZone.x,
      this.caveEntranceZone.y
    ) < 42;

    if (nearCity) {
      this.hintText.setText("X: voltar à cidade | E: coletar | I: inventário");
    } else if (nearCave) {
      this.hintText.setText("X: entrar na caverna | E: coletar | I: inventário");
    } else {
      this.hintText.setText("Espaço: atacar | E: coletar | I: inventário | R: equipar | H: cura | M: mana");
    }
  }

  private createWorld(): void {
    const mapWidth = WORLD.widthTiles * TILE_SIZE;
    const mapHeight = WORLD.heightTiles * TILE_SIZE;

    this.cameras.main.setBackgroundColor("#1f3a2b");

    this.add.tileSprite(0, 0, mapWidth, mapHeight, "grass-placeholder")
      .setOrigin(0)
      .setDepth(0);

    // trilha central
    for (let y = 4; y < 37; y++) {
      for (let x = 12; x < 16; x++) {
        this.add.image(x * TILE_SIZE, y * TILE_SIZE, "path-placeholder")
          .setOrigin(0)
          .setDepth(0.2);
      }
    }

    // bosque
    for (let x = 5; x < 55; x += 3) {
      for (let y = 6; y < 34; y += 4) {
        if ((x + y) % 2 === 0) {
          this.createTree(x, y);
        }
      }
    }

    // clareira
    for (let x = 24; x < 34; x++) {
      for (let y = 16; y < 24; y++) {
        this.add.rectangle(x * TILE_SIZE, y * TILE_SIZE, 32, 32, 0x4b9b5a, 0.25)
          .setOrigin(0)
          .setDepth(0.05);
      }
    }

    // cidade de retorno
    this.add.rectangle(12 * TILE_SIZE, 36 * TILE_SIZE, 64, 18, 0x4a2f24, 1)
      .setOrigin(0)
      .setDepth(1.5);

    // caverna
    this.add.rectangle(50 * TILE_SIZE, 10 * TILE_SIZE, 64, 40, 0x3a3f57, 1)
      .setOrigin(0)
      .setDepth(1.5);

    this.cityReturnZone = this.add.zone(12 * TILE_SIZE + 24, 36 * TILE_SIZE + 10, 48, 24);
    this.physics.add.existing(this.cityReturnZone, true);

    this.caveEntranceZone = this.add.zone(50 * TILE_SIZE + 24, 10 * TILE_SIZE + 20, 48, 28);
    this.physics.add.existing(this.caveEntranceZone, true);
  }

  private createTree(tileX: number, tileY: number): void {
    const x = tileX * TILE_SIZE;
    const y = tileY * TILE_SIZE;

    this.add.image(x, y, "tree-placeholder").setOrigin(0).setDepth(1);

    const collider = this.add.rectangle(x + 8, y + 18, 18, 12, 0x000000, 0);
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

      if (this.anims.exists(key)) {
        continue;
      }

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
      this.player.addGold(25);
      this.player.loadState({
        x: this.respawnPoint.x,
        y: this.respawnPoint.y,
        hp: this.player.maxHp,
        mana: this.player.maxMana,
        level: 1,
        xp: 0,
        gold: 25
      });
      this.equipment.syncPlayer();
      return;
    }

    this.inventory.loadFromData(save.inventory, getItemDefinition);
    this.player.loadState(save.player);
    this.equipment.loadFromData(save.equipment, this.inventory, getItemDefinition);
    this.questManager.loadFromData(save.quest);
  }

  private spawnEnemies(): void {
    this.enemies.push(
      new Enemy(this, 280, 260, "enemy-placeholder", "Wolf", {
        hp: 34,
        speed: 88,
        attackDamage: 10,
        aggroRange: 210,
        xpReward: 16
      })
    );

    this.enemies.push(
      new Enemy(this, 420, 180, "enemy-placeholder", "Bat", {
        hp: 18,
        speed: 102,
        attackDamage: 7,
        aggroRange: 240,
        xpReward: 12
      })
    );

    this.enemies.push(
      new Enemy(this, 660, 300, "enemy-placeholder", "Goblin Scout", {
        hp: 40,
        speed: 78,
        attackDamage: 11,
        aggroRange: 220,
        xpReward: 18
      })
    );
  }

  private spawnForestGuide(): void {
    // NPC visual no bosque, apenas para dar vida ao mapa.
    new Npc(this, 170, 500, "Ranger");
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
      "Espaço: atacar | X: sair/entrar | E: coletar | I: inventário | R: equipar | H: cura | M: mana",
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

  private handlePlayerDeath(): void {
    if (this.isRespawning || !this.player.isDead()) {
      return;
    }

    this.isRespawning = true;
    this.deathOverlay.show("Você perdeu 10 ouro e vai reaparecer.");

    const lostGold = Math.min(10, this.player.gold);
    this.player.gold -= lostGold;

    this.time.delayedCall(2400, () => {
      this.player.respawn(this.respawnPoint.x, this.respawnPoint.y);
      this.deathOverlay.hide();
      this.isRespawning = false;
      this.requestSave();
    });
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

  private requestSave(): void {
    this.saveManager.save({
      version: 1,
      savedAt: Date.now(),
      player: this.player.serialize(),
      inventory: this.inventory.serialize(),
      equipment: this.equipment.serialize(),
      quest: this.questManager.serialize()
    });

    this.registry.set("playerState", {
      gold: this.player.gold,
      hp: this.player.hp,
      mana: this.player.mana
    });
  }

  private handleBeforeUnload = (): void => {
    this.requestSave();
  };
}
