import Phaser from "phaser";
import { Inventory } from "../inventory/Inventory";
import { Player } from "../entities/Player";
import { getItemDefinition, ITEM_CATALOG, type ItemDefinition, rarityColor } from "../items/itemCatalog";

type ShopOffer = {
  item: ItemDefinition;
  price: number;
  label: string;
};

export class ShopPanel {
  private visible = false;

  private background: Phaser.GameObjects.Rectangle;
  private title: Phaser.GameObjects.Text;
  private goldText: Phaser.GameObjects.Text;
  private hintText: Phaser.GameObjects.Text;
  private infoText: Phaser.GameObjects.Text;
  private entries: Phaser.GameObjects.Text[] = [];

  private offers: ShopOffer[];

  constructor(
    private readonly scene: Phaser.Scene,
    private readonly player: Player,
    private readonly inventory: Inventory,
    private readonly onUpdated?: () => void
  ) {
    this.offers = [
      {
        item: getItemDefinition("healing_potion") ?? ITEM_CATALOG[5],
        price: 10,
        label: "1"
      },
      {
        item: getItemDefinition("mana_potion") ?? ITEM_CATALOG[7],
        price: 10,
        label: "2"
      },
      {
        item: getItemDefinition("rusty_sword") ?? ITEM_CATALOG[0],
        price: 25,
        label: "3"
      },
      {
        item: getItemDefinition("leather_armor") ?? ITEM_CATALOG[3],
        price: 30,
        label: "4"
      }
    ];

    const x = 22;
    const y = 120;

    this.background = scene.add.rectangle(x, y, 360, 300, 0x182033, 0.96)
      .setOrigin(0, 0)
      .setScrollFactor(0)
      .setStrokeStyle(2, 0x32405f, 1)
      .setDepth(90)
      .setVisible(false);

    this.title = scene.add.text(x + 14, y + 12, "LOJA DO MERCADOR", {
      fontFamily: "Arial",
      fontSize: "20px",
      color: "#ecf0ff",
      fontStyle: "bold"
    }).setScrollFactor(0).setDepth(91).setVisible(false);

    this.goldText = scene.add.text(x + 14, y + 42, "", {
      fontFamily: "Arial",
      fontSize: "14px",
      color: "#ffd166"
    }).setScrollFactor(0).setDepth(91).setVisible(false);

    this.hintText = scene.add.text(x + 14, y + 262, "1-4 para comprar | T para fechar", {
      fontFamily: "Arial",
      fontSize: "13px",
      color: "#9aa8c7"
    }).setScrollFactor(0).setDepth(91).setVisible(false);

    this.infoText = scene.add.text(x + 14, y + 282, "", {
      fontFamily: "Arial",
      fontSize: "13px",
      color: "#73e6a8"
    }).setScrollFactor(0).setDepth(91).setVisible(false);

    this.createOfferButtons();
  }

  public toggle(): void {
    this.setVisible(!this.visible);
  }

  public setVisible(visible: boolean): void {
    this.visible = visible;

    this.background.setVisible(visible);
    this.title.setVisible(visible);
    this.goldText.setVisible(visible);
    this.hintText.setVisible(visible);
    this.infoText.setVisible(visible);

    for (const entry of this.entries) {
      entry.setVisible(visible);
    }

    if (visible) {
      this.refresh();
    }
  }

  public isVisible(): boolean {
    return this.visible;
  }

  public refresh(): void {
    this.goldText.setText(`Ouro: ${this.player.gold}`);

    for (const entry of this.entries) {
      entry.destroy();
    }

    this.entries = [];

    const startX = 36;
    let currentY = 90;

    for (const offer of this.offers) {
      const color = rarityColor(offer.item.rarity);
      const canAfford = this.player.gold >= offer.price;

      const line = this.scene.add.text(startX, currentY, `${offer.label}. ${offer.item.name} - ${offer.price} ouro`, {
        fontFamily: "Arial",
        fontSize: "15px",
        color: canAfford ? `#${color.toString(16).padStart(6, "0")}` : "#8c96ad",
        fontStyle: "bold"
      }).setScrollFactor(0).setDepth(91);

      const desc = this.scene.add.text(startX, currentY + 18, offer.item.description, {
        fontFamily: "Arial",
        fontSize: "12px",
        color: "#c8d1ea",
        wordWrap: { width: 330 }
      }).setScrollFactor(0).setDepth(91);

      const action = this.scene.add.text(startX + 260, currentY, canAfford ? "COMPRAR" : "SEM OURO", {
        fontFamily: "Arial",
        fontSize: "13px",
        color: canAfford ? "#73e6a8" : "#ff6b6b",
        backgroundColor: "#24314d",
        padding: { left: 8, right: 8, top: 4, bottom: 4 }
      }).setScrollFactor(0).setDepth(91).setInteractive({ useHandCursor: true });

      action.on("pointerdown", () => {
        this.buy(offer);
      });

      this.entries.push(line, desc, action);
      currentY += 52;
    }
  }

  public buyByShortcut(index: number): void {
    const offer = this.offers[index];
    if (!offer) {
      return;
    }

    this.buy(offer);
  }

  private buy(offer: ShopOffer): void {
    if (this.player.gold < offer.price) {
      this.infoText.setText("Você não tem ouro suficiente.");
      return;
    }

    if (!this.inventory.canAdd(offer.item)) {
      this.infoText.setText("Inventário cheio.");
      return;
    }

    const spent = this.player.spendGold(offer.price);
    if (!spent) {
      this.infoText.setText("Não foi possível concluir a compra.");
      return;
    }

    this.inventory.addItem(offer.item, 1);
    this.infoText.setText(`Comprado: ${offer.item.name}`);
    this.refresh();

    if (this.onUpdated) {
      this.onUpdated();
    }
  }

  private createOfferButtons(): void {
    // Os botões visuais são reconstruídos em refresh().
  }
}
