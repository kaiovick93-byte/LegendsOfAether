export interface SavedInventoryEntry {
  itemId: string;
  quantity: number;
}

export interface SavedEquipmentState {
  weapon: string | null;
  armor: string | null;
  trinket: string | null;
}

export interface SavedPlayerState {
  x: number;
  y: number;
  hp: number;
  mana: number;
  level: number;
  xp: number;
  gold: number;
}

export interface SavedQuestState {
  id: string;
  accepted: boolean;
  completed: boolean;
}

export interface SavedGameState {
  version: 1;
  savedAt: number;
  player: SavedPlayerState;
  inventory: SavedInventoryEntry[];
  equipment: SavedEquipmentState;
  quest: SavedQuestState | null;
}

export class SaveManager {
  constructor(private readonly storageKey = "legends-of-aether-save") {}

  public save(state: SavedGameState): void {
    localStorage.setItem(this.storageKey, JSON.stringify(state));
  }

  public load(): SavedGameState | null {
    const raw = localStorage.getItem(this.storageKey);

    if (!raw) {
      return null;
    }

    try {
      const parsed = JSON.parse(raw) as SavedGameState;

      if (parsed?.version !== 1) {
        return null;
      }

      return parsed;
    } catch {
      return null;
    }
  }

  public clear(): void {
    localStorage.removeItem(this.storageKey);
  }

  public hasSave(): boolean {
    return localStorage.getItem(this.storageKey) !== null;
  }
}
