// @ts-nocheck
import { getItemDefinition, rarityColor } from '../items/itemCatalog';

export class ShopPanel {
  constructor(scene, player, inventory, equipment = null, onChange = null) {
    this.scene = scene;
    this.player = player;
    this.inventory = inventory;
    this.equipment = equipment;
    this.onChange = onChange;
    this.visible = false;

    this.stock = [
      { id: 'healing_potion', price: 20 },
      { id: 'mana_potion', price: 25 },
      { id: 'iron_sword', price: 70 },
      { id: 'forest_cloak', price: 150 },
      { id: 'elder_talisman', price: 90 },
    ];

    this.bg = scene.add.rectangle(
      scene.scale.width / 2,
      scene.scale.height / 2,
      Math.min(920, scene.scale.width - 40),
      Math.min(560, scene.scale.height - 70),
      0x0d1422,
      0.98
    )
      .setScrollFactor(0)
      .setDepth(1400)
      .setStrokeStyle(2, 0x4b5e80, 1)
      .setVisible(false);

    this.title = scene.add.text(
      scene.scale.width / 2,
      62,
      'LOJA DO MERCADOR',
      {
        fontFamily: 'Arial',
        fontSize: 24,
        color: '#ffd166',
        fontStyle: 'bold'
      }
    ).setOrigin(0.5).setScrollFactor(0).setDepth(1401).setVisible(false);

    this.goldText = scene.add.text(
      scene.scale.width / 2,
      96,
      '',
      {
        fontFamily: 'Arial',
        fontSize: 14,
        color: '#ffd166',
        fontStyle: 'bold'
      }
    ).setOrigin(0.5).setScrollFactor(0).setDepth(1401).setVisible(false);

    this.closeText = scene.add.text(
      scene.scale.width - 72,
      42,
      'T  FECHAR',
      {
        fontFamily: 'Arial',
        fontSize: 12,
        color: '#ecf0ff',
        backgroundColor: '#24314d',
        padding: { left: 7, right: 7, top: 5, bottom: 5 }
      }
    ).setOrigin(0.5).setScrollFactor(0).setDepth(1402).setInteractive({ useHandCursor: true }).setVisible(false);

    this.closeText.on('pointerdown', () => this.close());

    const panelW = Math.min(420, (scene.scale.width - 80) / 2);
    const leftX = scene.scale.width / 2 - panelW / 2 - 14;
    const rightX = scene.scale.width / 2 + panelW / 2 + 14;
    const panelY = scene.scale.height / 2 + 8;

    this.buyBg = scene.add.rectangle(leftX, panelY, panelW, 360, 0x182033, 0.98)
      .setScrollFactor(0).setDepth(1401).setStrokeStyle(1, 0x32405f, 1).setVisible(false);

    this.sellBg = scene.add.rectangle(rightX, panelY, panelW, 360, 0x182033, 0.98)
      .setScrollFactor(0).setDepth(1401).setStrokeStyle(1, 0x32405f, 1).setVisible(false);

    this.buyTitle = scene.add.text(leftX, panelY - 158, 'COMPRAR', {
      fontFamily: 'Arial',
      fontSize: 17,
      color: '#73e6a8',
      fontStyle: 'bold'
    }).setOrigin(0.5).setScrollFactor(0).setDepth(1402).setVisible(false);

    this.sellTitle = scene.add.text(rightX, panelY - 158, 'VENDER', {
      fontFamily: 'Arial',
      fontSize: 17,
      color: '#ffd166',
      fontStyle: 'bold'
    }).setOrigin(0.5).setScrollFactor(0).setDepth(1402).setVisible(false);

    this.buyRows = [];
    this.sellRows = [];

    this.emptySell = scene.add.text(
      rightX,
      panelY + 5,
      'Seu inventário não possui\\nitens vendáveis.',
      {
        fontFamily: 'Arial',
        fontSize: 13,
        color: '#9aa8c7',
        align: 'center'
      }
    ).setOrigin(0.5).setScrollFactor(0).setDepth(1402).setVisible(false);

    this.hint = scene.add.text(
      scene.scale.width / 2,
      scene.scale.height - 32,
      'Clique em um item para comprar/vender   •   T / Esc — fechar',
      {
        fontFamily: 'Arial',
        fontSize: 12,
        color: '#9aa8c7'
      }
    ).setOrigin(0.5).setScrollFactor(0).setDepth(1402).setVisible(false);
  }

  open() {
    this.visible = true;
    this.setVisible(true);
    this.refresh();
  }

  close() {
    this.visible = false;
    this.setVisible(false);
  }

  toggle() {
    if (this.visible) this.close();
    else this.open();
  }

  setVisible(v) {
    this.visible = v;
    [
      this.bg, this.title, this.goldText, this.closeText,
      this.buyBg, this.sellBg, this.buyTitle, this.sellTitle,
      this.emptySell, this.hint
    ].forEach(o => o.setVisible(v));

    this.buyRows.forEach(r => r.setVisible(v));
    this.sellRows.forEach(r => r.setVisible(v));
  }

  refresh() {
    if (!this.visible) return;

    this.goldText.setText(`Ouro: ${this.player.gold}`);

    this.buyRows.forEach(r => r.destroy());
    this.sellRows.forEach(r => r.destroy());
    this.buyRows = [];
    this.sellRows = [];

    const panelW = this.buyBg.width;
    const leftX = this.buyBg.x;
    const rightX = this.sellBg.x;
    const startY = this.buyBg.y - 125;

    this.stock.forEach((entry, index) => {
      const item = getItemDefinition(entry.id);
      if (!item) return;

      const row = this.createRow(
        leftX,
        startY + index * 48,
        panelW - 32,
        `${index + 1}. ${item.name}`,
        `${entry.price} ouro`,
        rarityColor(item.rarity),
        () => this.buy(index)
      );

      this.buyRows.push(row);
    });

    const sellable = this.getSellableItems();
    this.emptySell.setVisible(this.visible && sellable.length === 0);

    sellable.slice(0, 7).forEach((entry, index) => {
      const item = getItemDefinition(entry.id);
      if (!item) return;

      const sellPrice = Math.max(1, Math.floor(item.value * 0.5));

      const row = this.createRow(
        rightX,
        startY + index * 48,
        panelW - 32,
        `${item.name}  x${entry.qty}`,
        `+${sellPrice} ouro`,
        rarityColor(item.rarity),
        () => this.sell(entry.id)
      );

      this.sellRows.push(row);
    });
  }

  createRow(x, y, width, name, priceText, textColor, callback) {
    const bg = this.scene.add.rectangle(x, y, width, 40, 0x24314d, 1)
      .setScrollFactor(0)
      .setDepth(1403)
      .setStrokeStyle(1, 0x3b4e70, 1)
      .setInteractive({ useHandCursor: true });

    const nameText = this.scene.add.text(
      x - width / 2 + 10,
      y,
      name,
      {
        fontFamily: 'Arial',
        fontSize: 12,
        color: textColor
      }
    ).setOrigin(0, 0.5).setScrollFactor(0).setDepth(1404);

    const price = this.scene.add.text(
      x + width / 2 - 10,
      y,
      priceText,
      {
        fontFamily: 'Arial',
        fontSize: 11,
        color: '#ffd166',
        fontStyle: 'bold'
      }
    ).setOrigin(1, 0.5).setScrollFactor(0).setDepth(1404);

    bg.on('pointerover', () => bg.setFillStyle(0x36507c, 1));
    bg.on('pointerout', () => bg.setFillStyle(0x24314d, 1));
    bg.on('pointerdown', callback);

    return {
      bg,
      nameText,
      price,
      setVisible: (v) => {
        bg.setVisible(v);
        nameText.setVisible(v);
        price.setVisible(v);
      },
      destroy: () => {
        bg.destroy();
        nameText.destroy();
        price.destroy();
      }
    };
  }

  buy(index) {
    const entry = this.stock[index];
    const item = entry ? getItemDefinition(entry.id) : null;
    if (!entry || !item) return false;

    if (this.player.gold < entry.price) {
      this.showMessage('Ouro insuficiente.');
      return false;
    }

    if (!this.inventory.add(entry.id, 1)) {
      this.showMessage('Inventário cheio.');
      return false;
    }

    this.player.gold -= entry.price;
    this.onChange?.();
    this.showMessage(`${item.name} comprado.`);
    this.refresh();
    return true;
  }

  sell(itemId) {
    const item = getItemDefinition(itemId);
    if (!item || !this.inventory.has(itemId)) return false;

    if (this.isQuestItem(itemId)) {
      this.showMessage('Este item é importante para uma missão e não pode ser vendido.');
      return false;
    }

    const sellPrice = Math.max(1, Math.floor(item.value * 0.5));

    this.inventory.remove(itemId, 1);
    this.player.gold += sellPrice;

    this.onChange?.();
    this.showMessage(`${item.name} vendido por ${sellPrice} ouro.`);
    this.refresh();
    return true;
  }

  getSellableItems() {
    return this.inventory.items.filter(entry => {
      const item = getItemDefinition(entry.id);
      return !!item && !this.isQuestItem(entry.id);
    });
  }

  isQuestItem(itemId) {
    return itemId === 'royal_signet';
  }

  showMessage(message) {
    if (this.scene.showActionMessage) {
      this.scene.showActionMessage(message);
      return;
    }

    const text = this.scene.add.text(
      this.scene.scale.width / 2,
      this.scene.scale.height - 70,
      message,
      {
        fontFamily: 'Arial',
        fontSize: 12,
        color: '#ecf0ff',
        backgroundColor: '#182033',
        padding: 7
      }
    ).setOrigin(0.5).setScrollFactor(0).setDepth(1500);

    this.scene.tweens.add({
      targets: text,
      alpha: 0,
      delay: 900,
      duration: 450,
      onComplete: () => text.destroy()
    });
  }
}
