// @ts-nocheck
import { getItemDefinition } from '../items/itemCatalog';

export class CharacterInventoryPanel {
  constructor(scene, inventory, equipment, player) {
    this.scene = scene;
    this.inventory = inventory;
    this.equipment = equipment;
    this.player = player;
    this.visible = false;
    this.selected = null;

    const W = scene.scale.width;
    const H = scene.scale.height;

    this.bg = scene.add.rectangle(W / 2, H / 2, 820, 450, 0x0e1422, 0.98)
      .setScrollFactor(0).setDepth(700).setStrokeStyle(2, 0x485a7d, 1).setVisible(false);

    this.title = scene.add.text(W / 2, 60, 'PERSONAGEM E INVENTÁRIO', {
      fontFamily: 'Arial', fontSize: 24, color: '#ecf0ff', fontStyle: 'bold'
    }).setOrigin(0.5).setScrollFactor(0).setDepth(701).setVisible(false);

    this.closeText = scene.add.text(W - 92, 50, 'I  FECHAR', {
      fontFamily: 'Arial', fontSize: 13, color: '#9aa8c7', backgroundColor: '#182033',
      padding: { left: 8, right: 8, top: 5, bottom: 5 }
    }).setScrollFactor(0).setDepth(701).setInteractive({ useHandCursor: true }).setVisible(false);
    this.closeText.on('pointerdown', () => this.toggle());

    this.equipmentBg = scene.add.rectangle(250, 270, 290, 315, 0x182033, 0.98)
      .setScrollFactor(0).setDepth(701).setStrokeStyle(1, 0x32405f, 1).setVisible(false);

    this.inventoryBg = scene.add.rectangle(665, 270, 330, 315, 0x182033, 0.98)
      .setScrollFactor(0).setDepth(701).setStrokeStyle(1, 0x32405f, 1).setVisible(false);

    this.statsText = scene.add.text(105, 120, '', {
      fontFamily: 'Arial', fontSize: 14, color: '#c8d1ea', lineSpacing: 5
    }).setScrollFactor(0).setDepth(702).setVisible(false);

    this.classText = scene.add.text(395, 120, '', {
      fontFamily: 'Arial', fontSize: 15, color: '#ffd166', fontStyle: 'bold', align: 'right'
    }).setOrigin(1, 0).setScrollFactor(0).setDepth(702).setVisible(false);

    this.slotTexts = {};
    this.slotLabels = [];
    const slots = [
      ['weapon', 'ARMA', 145, 190],
      ['armor', 'ARMADURA', 145, 275],
      ['trinket', 'TRINKET', 145, 360]
    ];
    for (const [slot, label, x, y] of slots) {
      const box = scene.add.rectangle(x, y, 190, 68, 0x24314d, 1)
        .setScrollFactor(0).setDepth(702).setStrokeStyle(1, 0x4a5e82, 1).setVisible(false);
      const slotLabel = scene.add.text(x - 82, y - 22, label, { fontFamily: 'Arial', fontSize: 11, color: '#9aa8c7' })
        .setScrollFactor(0).setDepth(703).setVisible(false);
      this.slotLabels.push(slotLabel);
      const value = scene.add.text(x - 82, y - 2, 'Vazio', { fontFamily: 'Arial', fontSize: 14, color: '#ecf0ff' })
        .setScrollFactor(0).setDepth(703).setVisible(false);
      this.slotTexts[slot] = { box, value };
    }

    this.hint = scene.add.text(105, 465, 'Clique em um item equipável para usar. Poções permanecem no inventário.', {
      fontFamily: 'Arial', fontSize: 12, color: '#9aa8c7', wordWrap: { width: 300 }
    }).setScrollFactor(0).setDepth(703).setVisible(false);

    this.inventoryTexts = [];
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

  isVisible() { return this.visible; }

  refresh() {
    this.statsText.setText([
      `HP        ${this.player.hp}/${this.player.maxHp}`,
      `MANA      ${this.player.mana}/${this.player.maxMana}`,
      `ATAQUE    ${this.player.attackDamage}`,
      `DEFESA    ${this.player.defense}`,
      `VELOCIDADE ${this.player.speed}`,
      `NÍVEL     ${this.player.level}`,
      `OURO      ${this.player.gold}`
    ].join('\n'));

    const classNames = { warrior: 'Guerreiro', mage: 'Mago', ranger: 'Caçador' };
    this.classText.setText(classNames[this.player.characterClass] || this.player.characterClass);

    for (const slot of ['weapon', 'armor', 'trinket']) {
      const id = this.equipment.slots?.[slot] || null;
      const def = getItemDefinition(id);
      this.slotTexts[slot].value.setText(def ? `${def.name}\n${formatStats(def.stats)}` : 'Vazio');
      this.slotTexts[slot].value.setColor(def ? rarityTextColor(def.rarity) : '#9aa8c7');
    }

    for (const text of this.inventoryTexts) text.destroy();
    this.inventoryTexts = [];

    const items = this.inventory.items || [];
    if (!items.length) {
      const empty = this.scene.add.text(505, 240, 'Inventário vazio', { fontFamily: 'Arial', fontSize: 16, color: '#9aa8c7' })
        .setScrollFactor(0).setDepth(703).setVisible(true);
      this.inventoryTexts.push(empty);
      return;
    }

    items.forEach((entry, index) => {
      const def = getItemDefinition(entry.id);
      const row = this.scene.add.text(505, 165 + index * 42,
        `${index + 1}. ${def?.name || entry.id}  x${entry.qty}\n${def?.description || ''}`,
        {
          fontFamily: 'Arial', fontSize: 12, color: '#ecf0ff',
          backgroundColor: '#24314d', padding: { left: 8, right: 8, top: 5, bottom: 5 },
          wordWrap: { width: 285 }
        }
      ).setScrollFactor(0).setDepth(703).setInteractive({ useHandCursor: true });

      row.setColor(def ? rarityTextColor(def.rarity) : '#ecf0ff');
      row.on('pointerdown', () => this.tryEquip(entry.id));
      this.inventoryTexts.push(row);
    });
  }

  tryEquip(itemId) {
    const def = getItemDefinition(itemId);
    if (!def || !['weapon', 'armor', 'trinket'].includes(def.type)) {
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
      this.bg, this.title, this.closeText, this.equipmentBg, this.inventoryBg,
      this.statsText, this.classText, this.hint
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
  if (!stats) return '';
  const labels = { attack: 'ATK', defense: 'DEF', hp: 'HP', mana: 'MP', speed: 'SPD' };
  return Object.entries(stats).filter(([, v]) => v).map(([k, v]) => `+${v} ${labels[k] || k}`).join(' • ');
}

function rarityTextColor(rarity) {
  return rarity === 'legendary' ? '#ffd166' : rarity === 'epic' ? '#c084fc' : rarity === 'rare' ? '#7ee0ff' : rarity === 'uncommon' ? '#73e6a8' : '#ecf0ff';
}
