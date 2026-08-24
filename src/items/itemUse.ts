// @ts-nocheck
export function useHealing(player,inv){if(!inv.remove('healing_potion',1))return false;player.heal(35);return true}
export function useMana(player,inv){if(!inv.remove('mana_potion',1))return false;player.restoreMana(30);return true}
