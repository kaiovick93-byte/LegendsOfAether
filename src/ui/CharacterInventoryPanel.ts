// @ts-nocheck
import { getItemDefinition } from "../items/itemCatalog";

export class CharacterInventoryPanel {
  constructor(scene, inventory, equipment, player) {
    this.scene = scene;
    this.inventory = inventory;
    this.equipment = equipment;
    this.player = player;
    this.visible = false;
    this.selected = null;
    this.inventoryTexts = [];
    this.slotTexts = {};
    this.slotLabels = [];

    const W = scene.scale.width;
    const H = scene.scale.height;

    // Main window
    this.bg = scene.add.rectangle(W / 2, H / 2, 860, 500, 0x0e1422, 0.98)
      .setScrollFactor(0)
      .setDepth(700)
      .setStrokeStyle(2, 0x485a7d, 1)
      .setVisible(false);

    this.title = scene.add.text(W / 2, 42, "PERSONAGEM E INVENTÁRIO", {
      fontFamily: "Arial",
      fontSize: 23,
      color: "#ecf0ff",
      fontStyle: "bold"
    }).setOrigin(0.5).setScrollFactor(0).setDepth(701).setVisible(false);

    this.closeText = scene.add.text(W - 88, 31, "I  FECHAR", {
      fontFamily: "Arial",
      fontSize: 13,
      color: "#9aa8c7",
      backgroundColor: "#182033",
      padding: { left: 8, right: 8, top: 5, bottom: 5 }
    }).setScrollFactor(0).setDepth(701).setInteractive({ useHandCursor: true }).setVisible(false);

    this.closeText.on("pointerdown", () => this.close());

    // Top status section
    this.statusBg = scene.add.rectangle(W / 2, 112, 800, 105, 0x182033, 0.98)
      .setScrollFactor(0).setDepth(701)
      .setStrokeStyle(1, 0x32405f, 1).setVisible(false);

    this.classText = scene.add.text(150, 72, "", {
      fontFamily: "Arial",
      fontSize: 18,
      color: "#ffd166",
      fontStyle: "bold"
    }).setScrollFactor(0).setDepth(702).setVisible(false);

    this.levelText = scene.add.text(150, 103, "", {
      fontFamily: "Arial",
      fontSize: 14,
      color: "#c8d1ea"
    }).setScrollFactor(0).setDepth(702).setVisible(false);

    this.statsText = scene.add.text(390, 72, "", {
      fontFamily: "Arial",
      fontSize: 13,
      color: "#c8d1ea",
      lineSpacing: 4
    }).setScrollFactor(0).setDepth(702).setVisible(false);

    // Equipment section
    this.equipmentBg = scene.add.rectangle(250, 337, 340, 330, 0x182033, 0.98)
      .setScrollFactor(0).setDepth(701)
      .setStrokeStyle(1, 0x32405f, 1).setVisible(false);

    this.equipmentTitle = scene.add.text(250, 230, "EQUIPAMENTOS", {
      fontFamily: "Arial",
      fontSize: 16,
      color: "#ecf0ff",
      fontStyle: "bold"
    }).setOrigin(0.5).setScrollFactor(0).setDepth(702).setVisible(false);

    const slots = [
      ["weapon", "ARMA", 250, 285],
      ["armor", "ARMADURA", 250, 375],
      ["trinket", "TRINKET", 250, 465]
    ];

    for (const [slot, label, x, y] of slots) {
      const box = scene.add.rectangle(x, y, 285, 70, 0x24314d, 1)
        .setScrollFactor(0).setDepth(702)
        .setStrokeStyle(1, 0x4a5e82, 1).setVisible(false);

      const slotLabel = scene.add.text(x - 125, y - 24, label, {
        fontFamily: "Arial",
        fontSize: 11,
        color: "#9aa8c7"
      }).setScrollFactor(0).setDepth(703).setVisible(false);

      const value = scene.add.text(x - 125, y - 2, "Vazio", {
        fontFamily: "Arial",
        fontSize: 13,
        color: "#ecf0ff",
        wordWrap: { width: 250 }
      }).setScrollFactor(0).setDepth(703).setVisible(false);

      this.slotLabels.push(slotLabel);
      this.slotTexts[slot] = { box, value };
    }

    // Inventory section
    this.inventoryBg = scene.add.rectangle(675, 337, 340, 330, 0x182033, 0.98)
      .setScrollFactor(0).setDepth(701)
      .setStrokeStyle(1, 0x32405f, 1).setVisible(false);

    this.inventoryTitle = scene.add.text(675, 230, "INVENTÁRIO", {
      fontFamily: "Arial",
      fontSize: 16,
      color: "#ecf0ff",
      fontStyle: "bold"
    }).setOrigin(0.5).setScrollFactor(0).setDepth(702).setVisible(false);

    this.hint = scene.add.text(675, 492, "Clique em arma, armadura ou trinket para equipar.", {
      fontFamily: "Arial",
      fontSize: 11,
      color: "#9aa8c7",
      align: "center",
      wordWrap: { width: 285 }
    }).setOrigin(0.5).setScrollFactor(0).setDepth(703).setVisible(false);
  }

  toggle() {
    this.visible = !this.visible;
    this.setVisible(this.visible);
    if (this.visible) this.refresh();
  }

  close() {
    this.visible = false;
    this.setVisible(false);
  }

  isVisible() {
    return this.visible;
  }

  refresh() {
    const classNames = {
      warrior: "Guerreiro",
      mage: "Mago",
      ranger: "Caçador"
    };

    this.classText.setText(`Classe: ${classNames[this.player.characterClass] || this.player.characterClass}`);
    this.levelText.setText(`Nível ${this.player.level}   •   Ouro ${this.player.gold}`);

    this.statsText.setText([
      `HP ${this.player.hp}/${this.player.maxHp}     MANA ${this.player.mana}/${this.player.maxMana}`,
      `ATQ ${this.player.attackDamage}     DEF ${this.player.defense}     SPD ${this.player.speed}`
    ].join("\n"));

    for (const slot of ["weapon", "armor", "trinket"]) {
      const id = this.equipment.slots?.[slot] || null;
      const def = getItemDefinition(id);
      this.slotTexts[slot].value.setText(
        def ? `${def.name}\n${formatStats(def.stats)}` : "Vazio"
      );
      this.slotTexts[slot].value.setColor(
        def ? rarityTextColor(def.rarity) : "#9aa8c7"
      );
    }

    for (const text of this.inventoryTexts) text.destroy();
    this.inventoryTexts = [];

    const items = this.inventory.items || [];

    if (!items.length) {
      const empty = this.scene.add.text(675, 325, "Inventário vazio", {
        fontFamily: "Arial",
        fontSize: 15,
        color: "#9aa8c7"
      }).setOrigin(0.5).setScrollFactor(0).setDepth(703).setVisible(true);

      this.inventoryTexts.push(empty);
      return;
    }

    const visibleItems = items.slice(0, 7);

    visibleItems.forEach((entry, index) => {
      const def = getItemDefinition(entry.id);
      const y = 270 + index * 39;

      const row = this.scene.add.text(
        530,
        y,
        `${def?.name || entry.id}  x${entry.qty}`,
        {
          fontFamily: "Arial",
          fontSize: 12,
          color: def ? rarityTextColor(def.rarity) : "#ecf0ff",
          backgroundColor: "#24314d",
          padding: { left: 8, right: 8, top: 5, bottom: 5 },
          fixedWidth: 285
        }
      ).setScrollFactor(0).setDepth(703).setInteractive({ useHandCursor: true });

      row.on("pointerdown", () => this.tryEquip(entry.id));
      this.inventoryTexts.push(row);
    });
  }

  tryEquip(itemId) {
    const def = getItemDefinition(itemId);

    if (!def || !["weapon", "armor", "trinket"].includes(def.type)) {
      this.scene.sfx?.confirm?.();
      return;
    }

    if (this.equipment.equip(itemId, this.inventory)) {
      this.scene.sfx?.confirm?.();
      this.refresh();
      this.scene.save?.();
    }
  }

  setVisible(visible) {
    const objects = [
      this.bg,
      this.title,
      this.closeText,
      this.statusBg,
      this.classText,
      this.levelText,
      this.statsText,
      this.equipmentBg,
      this.equipmentTitle,
      this.inventoryBg,
      this.inventoryTitle,
      this.hint
    ];

    for (const obj of objects) obj.setVisible(visible);

    for (const label of this.slotLabels) label.setVisible(visible);

    for (const slot of Object.values(this.slotTexts)) {
      slot.box.setVisible(visible);
      slot.value.setVisible(visible);
    }

    for (const text of this.inventoryTexts) text.setVisible(visible);
  }
}

function formatStats(stats) {
  if (!stats) return "";

  const labels = {
    attack: "ATQ",
    defense: "DEF",
    hp: "HP",
    mana: "MP",
    speed: "SPD"
  };

  return Object.entries(stats)
    .filter(([, value]) => value)
    .map(([key, value]) => `+${value} ${labels[key] || key}`)
    .join(" • ");
}

function rarityTextColor(rarity) {
  return rarity === "legendary"
    ? "#ffd166"
    : rarity === "epic"
      ? "#c084fc"
      : rarity === "rare"
        ? "#7ee0ff"
        : rarity === "uncommon"
          ? "#73e6a8"
          : "#ecf0ff";
}
