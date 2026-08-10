import type { ItemDefinition } from "../items/itemCatalog";

export interface InventoryEntry {
  item: ItemDefinition;
  quantity: number;
}

export interface SerializedInventoryEntry {
  itemId: string;
  quantity: number;
}

export class Inventory {
  private entries: InventoryEntry[] = [];
  public readonly maxSlots: number;

  constructor(maxSlots = 24) {
    this.maxSlots = maxSlots;
  }

  public getEntries(): InventoryEntry[] {
    return [...this.entries];
  }

  public getUsedSlots(): number {
    return this.entries.length;
  }

  public countItem(itemId: string): number {
    const entry = this.entries.find((item) => item.item.id === itemId);
    return entry?.quantity ?? 0;
  }

  public canAdd(item: ItemDefinition): boolean {
    const existing = this.entries.find((entry) => entry.item.id === item.id);
    if (existing) {
      return true;
    }

    return this.entries.length < this.maxSlots;
  }

  public addItem(item: ItemDefinition, quantity = 1): boolean {
    if (!this.canAdd(item)) {
      return false;
    }

    const existing = this.entries.find((entry) => entry.item.id === item.id);
    if (existing) {
      existing.quantity += quantity;
      return true;
    }

    this.entries.push({ item, quantity });
    return true;
  }

  public removeItem(itemId: string, quantity = 1): boolean {
    const entry = this.entries.find((item) => item.item.id === itemId);
    if (!entry) {
      return false;
    }

    entry.quantity -= quantity;

    if (entry.quantity <= 0) {
      this.entries = this.entries.filter((item) => item.item.id !== itemId);
    }

    return true;
  }

  public hasItem(itemId: string, quantity = 1): boolean {
    const entry = this.entries.find((item) => item.item.id === itemId);
    return !!entry && entry.quantity >= quantity;
  }

  public clear(): void {
    this.entries = [];
  }

  public serialize(): SerializedInventoryEntry[] {
    return this.entries.map((entry) => ({
      itemId: entry.item.id,
      quantity: entry.quantity
    }));
  }

  public loadFromData(
    data: SerializedInventoryEntry[],
    resolver: (itemId: string) => ItemDefinition | undefined
  ): void {
    this.entries = [];

    for (const entry of data) {
      const item = resolver(entry.itemId);
      if (!item || entry.quantity <= 0) {
        continue;
      }

      this.entries.push({
        item,
        quantity: entry.quantity
      });
    }
  }
}
