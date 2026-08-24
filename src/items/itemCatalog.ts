// @ts-nocheck
export const ITEMS={
 healing_potion:{id:'healing_potion',name:'Poção de Cura',type:'consumable',rarity:'common',value:20,description:'Recupera vida.'},
 mana_potion:{id:'mana_potion',name:'Poção de Mana',type:'consumable',rarity:'common',value:25,description:'Recupera mana.'},
 iron_sword:{id:'iron_sword',name:'Espada de Ferro',type:'weapon',rarity:'common',value:70,description:'+4 ataque',stats:{attack:4}},
 forest_cloak:{id:'forest_cloak',name:'Manto da Floresta',type:'armor',rarity:'rare',value:120,description:'+4 DEF, +10 HP',stats:{defense:4,hp:10}},
 brute_armor:{id:'brute_armor',name:'Couraça do Brutamontes',type:'armor',rarity:'rare',value:180,description:'+7 DEF, +18 HP',stats:{defense:7,hp:18}},
 wraith_blade:{id:'wraith_blade',name:'Lâmina Espectral',type:'weapon',rarity:'epic',value:280,description:'+9 ATK, +2 velocidade',stats:{attack:9,speed:2}},
 royal_mage_staff:{id:'royal_mage_staff',name:'Cajado da Coroa',type:'weapon',rarity:'epic',value:320,description:'+11 ATK, +20 mana',stats:{attack:11,mana:20}},
 royal_signet:{id:'royal_signet',name:'Selo Real de Aether',type:'trinket',rarity:'legendary',value:500,description:'+10 ATK, +10 DEF, +30 HP, +20 mana',stats:{attack:10,defense:10,hp:30,mana:20}},
 elder_talisman:{id:'elder_talisman',name:'Talismã do Ancião',type:'trinket',rarity:'uncommon',value:65,description:'+8 HP, +4 mana, +1 DEF',stats:{hp:8,mana:4,defense:1}},
 shadow_amulet:{id:'shadow_amulet',name:'Amuleto Sombrio',type:'trinket',rarity:'epic',value:250,description:'+4 ATK, +10 mana, +2 DEF',stats:{attack:4,mana:10,defense:2}},
};
export function getItemDefinition(id){return ITEMS[id]||null}
export function getRandomDropDefinition(){const pool=['healing_potion','mana_potion','iron_sword','elder_talisman'];return getItemDefinition(pool[Math.floor(Math.random()*pool.length)])}
export function rarityColor(r){return r==='legendary'?0xffd166:r==='epic'?0xc084fc:r==='rare'?0x7ee0ff:r==='uncommon'?0x73e6a8:0xecf0ff}
