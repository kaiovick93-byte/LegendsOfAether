import { Player } from "../entities/Player";
import { Inventory } from "../inventory/Inventory";
import { getItemDefinition } from "./itemCatalog";

export interface ItemUseResult {
  used: boolean;
  message: string;
}

export function useHealingConsumable(player: Player, inventory: Inventory): ItemUseResult {
  const potion =
    getItemDefinition("greater_healing_potion") ??
    getItemDefinition("healing_potion");

  if (!potion) {
    return { used: false, message: "Poção não encontrada." };
  }

  if (!inventory.hasItem(potion.id, 1)) {
    return { used: false, message: "Você não tem poções de cura." };
  }

  if (potion.id === "greater_healing_potion") {
    player.heal(50);
  } else {
    player.heal(20);
  }

  inventory.removeItem(potion.id, 1);

  return {
    used: true,
    message: potion.id === "greater_healing_potion" ? "Poção de Cura Maior usada!" : "Poção de Cura usada!"
  };
}

export function useManaConsumable(player: Player, inventory: Inventory): ItemUseResult {
  const potion = getItemDefinition("mana_potion");

  if (!potion) {
    return { used: false, message: "Poção não encontrada." };
  }

  if (!inventory.hasItem(potion.id, 1)) {
    return { used: false, message: "Você não tem poções de mana." };
  }

  player.mana = Math.min(player.maxMana, player.mana + 18);
  inventory.removeItem(potion.id, 1);

  return {
    used: true,
    message: "Poção de Mana usada!"
  };
}
