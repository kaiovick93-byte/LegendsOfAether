import Phaser from "phaser";
import { CombatSystem } from "../combat/CombatSystem";
import { BossEnemy } from "../entities/BossEnemy";
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
import { Npc } from "../npc/Npc";
import { getItemDefinition, getRandomDropDefinition, type ItemDefinition } from "../items/itemCatalog";
import { useHealingConsumable, useManaConsumable } from "../items/itemUse";
import { GAME_HEIGHT, GAME_WIDTH, TILE_SIZE, WORLD } from "../config";
import { DeathOverlay } from "../ui/DeathOverlay";

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
  private saveManager!: SaveManager;
  private shopPanel!: ShopPanel;
  private questManager!: QuestManager;
  private questPanel!: QuestPanel;
  private bossBar!: BossBar;

  private questNpc!: Npc;
  private boss!: BossEnemy;

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
  private shopKey!: Phaser.Input.Keyboard.Key;
  private questKey!: Phaser.Input.Keyboard.Key;
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

  private deathOverlay!: DeathOverlay;
  private isRespawning = false;
  private respawnPoint = { x: 220, y: 260 };

  constructor() {
    super("WorldScene");
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

    this.deathOverlay = new DeathOverlay(this);
    this.deathOverlay.hide();

    this.bossBar = new BossBar(this);
    this.bossBar.hide();

    this.createHUD();
    this.spawnEnemies();
    this.spawnQuestNpc();
    this.spawnBoss();

    this.combat = new CombatSystem(this, (enemy, player) => {
      this.spawnLoot(enemy.x, enemy.y);
      player.addGold(8 + enemy.xpReward);
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
    this.shopKey = this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.T);
    this.questKey = this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.Q);
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

  private handlePlayerDeath(): void {
    if (this.isRespawning || !this.player.isDead()){
      return;
    }

    this.isRespawning = true;
    this.deathOverlay.show("Você perdeu 10 ouro e vai reaparecer.");

    const lostGold = Math.min(10, this.player.gold);
    this.player.gold -= lostGold;

    this.time.delayedCall(2400, () => {
      this.player.respawn(this.respawnPoint.x, this.respawnPoint.y);
      this.player.gold = Math.max(0, this.player.gold);
      this.deathOverlay.hide();
      this.isRespawning = false;
      this.requestSave();
    });
  }
  shutdown(): void {
    this.requestSave();

    if (this.saveTimer) {
      this.saveTimer.remove(false);
    }

    window.removeEventListener("beforeunload", this.handleBeforeUnload);
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

    if (this.player.isDead()) {
      this.player.move(0, 0);
      this.handlePlayerDeath();
      this.updateHUD();
      return;
    }

    if (this.boss && this.boss.active) {
      this.boss.updateAI(this.player);
      this.combat.enemyAttack(this.boss, this.player);
      this.bossBar.update(this.boss);

      const distToBoss = Phaser.Math.Distance.Between(this.player.x, this.player.y, this.boss.x, this.boss.y);
      if (distToBoss < 260) {
        this.bossBar.show(this.boss);
      } else if (!this.boss.isAlive()) {
        this.bossBar.hide();
      }
    }

    if (Phaser.Input.Keyboard.JustDown(this.attackKey)) {
      const nearBoss =
        this.boss &&
        this.boss.active &&
        Phaser.Math.Distance.Between(this.player.x, this.player.y, this.boss.x, this.boss.y) < 80;

      if (nearBoss) {
        this.combat.playerAttack(this.player, [this.boss, ...this.enemies]);
      } else {
        this.combat.playerAttack(this.player, this.enemies);
      }

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

    if (Phaser.Input.Keyboard.JustDown(this.shopKey)) {
      this.shopPanel.toggle();
      this.shopPanel.refresh();
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

    if (Phaser.Input.Keyboard.JustDown(this.interactKey)) {
      if (this.shopPanel.isVisible()) {
        return;
      }
      this.collectNearbyLoot();
    }

    if (Phaser.Input.Keyboard.JustDown(this.questKey)) {
      this.handleQuestInteraction();
    }

    if (this.shopPanel.isVisible()) {
      if (Phaser.Input.Keyboard.JustDown(this.oneKey)) this.shopPanel.buyByShortcut(0);
      if (Phaser.Input.Keyboard.JustDown(this.twoKey)) this.shopPanel.buyByShortcut(1);
      if (Phaser.Input.Keyboard.JustDown(this.threeKey)) this.shopPanel.buyByShortcut(2);
      if (Phaser.Input.Keyboard.JustDown(this.fourKey)) this.shopPanel.buyByShortcut(3);
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

  private spawnQuestNpc(): void {
    this.questNpc = new Npc(this, 470, 334, this.questManager.quest.giverName);
  }

  private spawnBoss(): void {
    this.boss = new BossEnemy(this, 760, 250);
    this.boss.setDepth(11);
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
    this.player = new Player(this, this.respawnPoint.x, this.respawnPoint.y);
    this.player.setDepth(10);
  }

  private loadSavedGame(): void {
    const save = this.saveManager.load();

    if (!save) {
      this.player.addGold(25);
      this.player.loadState({
        x: 220,
        y: 260,
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
      "Espaço: atacar | E: coletar | I: inventário | R: equipar | T: loja | Q: missão | H: cura | M: mana",
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

    this.player.move(moveX, moveY);
  }

  private handleQuestInteraction(): void {
    const dist = Phaser.Math.Distance.Between(this.player.x, this.player.y, this.questNpc.x, this.questNpc.y);

    if (dist > 48) {
      this.showQuestMessage("Aproxime-se da NPC para falar.");
      return;
    }

    if (!this.questManager.isAccepted()) {
      this.questManager.accept();
      this.showQuestMessage(
        this.questManager.quest.title,
        this.questManager.quest.introText,
        "Missão aceita. Traga 3 Orelhas de Goblin."
      );
      this.requestSave();
      return;
    }

    if (this.questManager.isReadyToTurnIn(this.inventory)) {
      this.questManager.turnIn(this.player, this.inventory);
      this.inventoryPanel.refresh();
      this.showQuestMessage(
        this.questManager.quest.title,
        this.questManager.quest.turnInText,
        `Recompensa: ${this.questManager.quest.rewardGold} ouro e ${this.questManager.quest.rewardXp} XP`
      );
      this.requestSave();
      return;
    }

    this.showQuestMessage(
      this.questManager.quest.title,
      this.questManager.getQuestStateText(this.inventory),
      this.questManager.getActionText(this.inventory)
    );
  }

  private showQuestMessage(title: string, body: string, hint: string): void {
    this.questPanel.show(title, body, hint);
    this.time.delayedCall(2600, () => {
      this.questPanel.hide();
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
  
