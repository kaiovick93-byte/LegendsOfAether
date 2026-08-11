export const CLASSES={
 warrior:{id:'warrior',name:'Guerreiro',description:'Resistente e explosivo no corpo a corpo.',stats:{hp:40,mana:0,attack:6,defense:4,speed:0}},
 mage:{id:'mage',name:'Mago',description:'Alto dano mágico e controle de espaço.',stats:{hp:0,mana:45,attack:3,defense:0,speed:0}},
 ranger:{id:'ranger',name:'Caçador',description:'Velocidade, precisão e ataques à distância.',stats:{hp:12,mana:12,attack:4,defense:1,speed:18}}
};
export function className(id){return CLASSES[id]?.name??'Guerreiro'}
