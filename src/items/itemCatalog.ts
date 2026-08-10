export type ItemRarity = "common" | "uncommon" | "rare" | "epic" | "legendary";
export type ItemType = "weapon" | "armor" | "consumable" | "material" | "trinket";

export interface ItemDefinition {
  id: string;
  name: string;
  type: ItemType;
  rarity: ItemRarity;
  description: string;
  value: number;
  statBonuses?: {
    attack?: number;
    defense?: number;
    hp?: number;
    mana?: number;
    speed?: number;
  };
}

export const ITEM_CATALOG: ItemDefinition[] = [
  {
    id: "rusty_sword",
    name: "Espada Enferrujada",
    type: "weapon",
    rarity: "common",
    description: "Uma lâmina simples, mas confiável.",
    value: 8,
    statBonuses: { attack: 2 }
  },
  {
    id: "hunter_bow",
    name: "Arco do Caçador",
    type: "weapon",
    rarity: "uncommon",
    description: "Feito para caçadas rápidas.",
    value: 18,
    statBonuses: { attack: 4, speed: 1 }
  },
  {
    id: "apprentice_staff",
    name: "Cajado do Aprendiz",
    type: "weapon",
    rarity: "uncommon",
    description: "Carrega uma pequena energia arcana.",
    value: 20,
    statBonuses: { attack: 3, mana: 8 }
  },
  {
    id: "leather_armor",
    name: "Armadura de Couro",
    type: "armor",
    rarity: "common",
    description: "Proteção leve para aventureiros.",
    value: 12,
    statBonuses: { defense: 2, hp: 6 }
  },
  {
    id: "iron_armor",
    name: "Armadura de Ferro",
    type: "armor",
    rarity: "rare",
    description: "Pesada, mas muito resistente.",
    value: 45,
    statBonuses: { defense: 6, hp: 14 }
  },
  {
    id: "healing_potion",
    name: "Poção de Cura",
    type: "consumable",
    rarity: "common",
    description: "Recupera vida ao ser usada.",
    value: 10,
    statBonuses: { hp: 20 }
  },
  {
    id: "greater_healing_potion",
    name: "Poção de Cura Maior",
    type: "consumable",
    rarity: "rare",
    description: "Recupera bastante vida.",
    value: 28,
    statBonuses: { hp: 50 }
  },
  {
    id: "mana_potion",
    name: "Poção de Mana",
    type: "consumable",
    rarity: "common",
    description: "Restaura mana rapidamente.",
    value: 10,
    statBonuses: { mana: 18 }
  },
  {
    id: "wolf_fang",
    name: "Presa de Lobo",
    type: "material",
    rarity: "common",
    description: "Material usado em forjas e alquimia.",
    value: 4
  },
  {
    id: "goblin_ear",
    name: "Orelha de Goblin",
    type: "material",
    rarity: "common",
    description: "Troféu desagradável, mas útil para missões.",
    value: 3
  },
  {
    id: "ember_gem",
    name: "Gema de Brasa",
    type: "trinket",
    rarity: "epic",
    description: "Uma gema pulsando calor arcano.",
    value: 120,
    statBonuses: { attack: 5, mana: 12 }
  },
  {
    id: "aether_charm",
    name: "Amuleto de Aether",
    type: "trinket",
    rarity: "legendary",
    description: "Relíquia rara que reforça corpo e espírito.",
    value: 350,
    statBonuses: { attack: 8, defense: 8, hp: 24, mana: 24 }
  }
];

export function getItemDefinition(id: string): ItemDefinition | undefined {
  return ITEM_CATALOG.find((item) => item.id === id);
}

export function getRandomDropDefinition(): ItemDefinition {
  const roll = Math.random();

  if (roll < 0.18) {
    return ITEM_CATALOG.find((item) => item.id === "rusty_sword")!;
  }

  if (roll < 0.30) {
    return ITEM_CATALOG.find((item) => item.id === "leather_armor")!;
  }

  if (roll < 0.40) {
    return ITEM_CATALOG.find((item) => item.id === "hunter_bow")!;
  }

  if (roll < 0.52) {
    return ITEM_CATALOG.find((item) => item.id === "healing_potion")!;
  }

  if (roll < 0.64) {
    return ITEM_CATALOG.find((item) => item.id === "mana_potion")!;
  }

  if (roll < 0.76) {
    return ITEM_CATALOG.find((item) => item.id === "wolf_fang")!;
  }

  if (roll < 0.88) {
    return ITEM_CATALOG.find((item) => item.id === "goblin_ear")!;
  }

  if (roll < 0.96) {
    return ITEM_CATALOG.find((item) => item.id === "greater_healing_potion")!;
  }

  return Math.random() > 0.5
    ? ITEM_CATALOG.find((item) => item.id === "ember_gem")!
    : ITEM_CATALOG.find((item) => item.id === "aether_charm")!;
}

export function rarityColor(rarity: ItemRarity): number {
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
