import { Inventory } from "../inventory/Inventory";
import type { ItemDefinition, ItemType } from "../items/itemCatalog";
import { Player } from "../entities/Player";

type EquipmentSlot = "weapon" | "armor" | "trinket";

interface EquipmentStats {
  attack?: number;
  defense?: number;
  hp?: number;
  mana?: number;
  speed?: number;
}

export class EquipmentManager {
  private slots: Record<EquipmentSlot, ItemDefinition | null> = {
    weapon: null,
    armor: null,
    trinket: null
  };

  constructor(private readonly player: Player) {}

  public getEquippedItem(slot: EquipmentSlot): ItemDefinition | null {
    return this.slots[slot];
  }

  public getEquippedSummary(): string {
    const weapon = this.slots.weapon?.name ?? "Vazio";
    const armor = this.slots.armor?.name ?? "Vazio";
    const trinket = this.slots.trinket?.name ?? "Vazio";
    return `Arma: ${weapon} | Armadura: ${armor} | Relíquia: ${trinket}`;
  }

  public getBonuses(): EquipmentStats {
    const total: Required<EquipmentStats> = {
      attack: 0,
      defense: 0,
      hp: 0,
      mana: 0,
      speed: 0
    };

    for (const item of Object.values(this.slots)) {
      if (!item?.statBonuses) {
        continue;
      }

      total.attack += item.statBonuses.attack ?? 0;
      total.defense += item.statBonuses.defense ?? 0;
      total.hp += item.statBonuses.hp ?? 0;
      total.mana += item.statBonuses.mana ?? 0;
      total.speed += item.statBonuses.speed ?? 0;
    }

    return total;
  }

  public syncPlayer(): void {
    this.player.applyEquipmentBonuses(this.getBonuses());
  }

  public equipItem(item: ItemDefinition, inventory: Inventory): boolean {
    if (!this.isEquipableType(item.type)) {
      return false;
    }

    if (!inventory.hasItem(item.id, 1)) {
      return false;
    }

    const slot = this.typeToSlot(item.type);
    const previous = this.slots[slot];

    if (!inventory.removeItem(item.id, 1)) {
      return false;
    }

    if (previous) {
      const returned = inventory.addItem(previous, 1);
      if (!returned) {
        inventory.addItem(item, 1);
        return false;
      }
    }

    this.slots[slot] = item;
    this.syncPlayer();
    return true;
  }

  public unequip(slot: EquipmentSlot, inventory: Inventory): boolean {
    const current = this.slots[slot];
    if (!current) {
      return false;
    }

    if (!inventory.addItem(current, 1)) {
      return false;
    }

    this.slots[slot] = null;
    this.syncPlayer();
    return true;
  }

  public autoEquipBestAvailable(inventory: Inventory): number {
    const entries = inventory.getEntries();
    let equippedCount = 0;

    const weapon = this.findBest(entries, "weapon");
    if (weapon && this.equipItem(weapon, inventory)) {
      equippedCount++;
    }

    const armor = this.findBest(entries, "armor");
    if (armor && this.equipItem(armor, inventory)) {
      equippedCount++;
    }

    const trinket = this.findBest(entries, "trinket");
    if (trinket && this.equipItem(trinket, inventory)) {
      equippedCount++;
    }

    this.syncPlayer();
    return equippedCount;
  }

  private findBest(entries: Array<{ item: ItemDefinition; quantity: number }>, type: ItemType): ItemDefinition | null {
    const candidates = entries
      .filter((entry) => entry.item.type === type)
      .map((entry) => entry.item);

    if (candidates.length === 0) {
      return null;
    }

    const rarityRank: Record<ItemDefinition["rarity"], number> = {
      common: 1,
      uncommon: 2,
      rare: 3,
      epic: 4,
      legendary: 5
    };

    candidates.sort((a, b) => {
      const rarityDiff = rarityRank[b.rarity] - rarityRank[a.rarity];
      if (rarityDiff !== 0) {
        return rarityDiff;
      }

      return b.value - a.value;
    });

    return candidates[0];
  }

  private typeToSlot(type: ItemType): EquipmentSlot {
    switch (type) {
      case "weapon":
        return "weapon";
      case "armor":
        return "armor";
      case "trinket":
      default:
        return "trinket";
    }
  }

  private isEquipableType(type: ItemType): boolean {
    return type === "weapon" || type === "armor" || type === "trinket";
  }
}
