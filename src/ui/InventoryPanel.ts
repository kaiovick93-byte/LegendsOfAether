import Phaser from "phaser";
import { Inventory } from "../inventory/Inventory";
import { rarityColor } from "../items/itemCatalog";

export class InventoryPanel {
  private visible = false;

  private background: Phaser.GameObjects.Rectangle;
  private title: Phaser.GameObjects.Text;
  private info: Phaser.GameObjects.Text;
  private itemTexts: Phaser.GameObjects.Text[] = [];

  constructor(
    private readonly scene: Phaser.Scene,
    private readonly inventory: Inventory
  ) {
    const x = 780;
    const y = 22;

    this.background = scene.add.rectangle(x, y, 340, 496, 0x182033, 0.95)
      .setOrigin(0, 0)
      .setScrollFactor(0)
      .setStrokeStyle(2, 0x32405f, 1)
      .setDepth(100)
      .setVisible(false);

    this.title = scene.add.text(x + 14, y + 12, "INVENTÁRIO", {
      fontFamily: "Arial",
      fontSize: "20px",
      color: "#ecf0ff",
      fontStyle: "bold"
    }).setScrollFactor(0).setDepth(101).setVisible(false);

    this.info = scene.add.text(x + 14, y + 42, "", {
      fontFamily: "Arial",
      fontSize: "13px",
      color: "#9aa8c7"
    }).setScrollFactor(0).setDepth(101).setVisible(false);
  }

  public toggle(): void {
    this.setVisible(!this.visible);
  }

  public setVisible(visible: boolean): void {
    this.visible = visible;

    this.background.setVisible(visible);
    this.title.setVisible(visible);
    this.info.setVisible(visible);

    for (const text of this.itemTexts) {
      text.setVisible(visible);
    }

    if (visible) {
      this.refresh();
    }
  }

  public refresh(): void {
    for (const text of this.itemTexts) {
      text.destroy();
    }

    this.itemTexts = [];

    const entries = this.inventory.getEntries();
    this.info.setText(`Slots: ${entries.length}/${this.inventory.maxSlots}`);

    const startX = 794;
    let currentY = 88;

    if (entries.length === 0) {
      const empty = this.scene.add.text(startX, currentY, "Nenhum item coletado ainda.", {
        fontFamily: "Arial",
        fontSize: "15px",
        color: "#c8d1ea"
      }).setScrollFactor(0).setDepth(101);

      empty.setVisible(this.visible);
      this.itemTexts.push(empty);
      return;
    }

    for (const entry of entries) {
      const color = rarityColor(entry.item.rarity);

      const label = this.scene.add.text(
        startX,
        currentY,
        `${entry.quantity}x ${entry.item.name}`,
        {
          fontFamily: "Arial",
          fontSize: "15px",
          color: `#${color.toString(16).padStart(6, "0")}`,
          fontStyle: "bold"
        }
      ).setScrollFactor(0).setDepth(101);

      const details = this.scene.add.text(
        startX,
        currentY + 18,
        `${entry.item.type} • ${entry.item.rarity} • Valor ${entry.item.value}`,
        {
          fontFamily: "Arial",
          fontSize: "12px",
          color: "#c8d1ea"
        }
      ).setScrollFactor(0).setDepth(101);

      const desc = this.scene.add.text(
        startX,
        currentY + 33,
        entry.item.description,
        {
          fontFamily: "Arial",
          fontSize: "12px",
          color: "#9aa8c7",
          wordWrap: { width: 300 }
        }
      ).setScrollFactor(0).setDepth(101);

      label.setVisible(this.visible);
      details.setVisible(this.visible);
      desc.setVisible(this.visible);

      this.itemTexts.push(label, details, desc);

      currentY += 62;
    }
  }
}
