// @ts-nocheck
export const PLAYER_APPEARANCES={
 warrior_m:{id:'warrior_m',classId:'warrior',gender:'male',genderLabel:'Masculino',label:'Guerreiro'},
 warrior_f:{id:'warrior_f',classId:'warrior',gender:'female',genderLabel:'Feminino',label:'Guerreira'},
 mage_m:{id:'mage_m',classId:'mage',gender:'male',genderLabel:'Masculino',label:'Mago'},
 mage_f:{id:'mage_f',classId:'mage',gender:'female',genderLabel:'Feminino',label:'Maga'},
 ranger_m:{id:'ranger_m',classId:'ranger',gender:'male',genderLabel:'Masculino',label:'Caçador'},
 ranger_f:{id:'ranger_f',classId:'ranger',gender:'female',genderLabel:'Feminino',label:'Caçadora'}
};

export const PLAYER_APPEARANCE_ORDER=['warrior_m','warrior_f','mage_m','mage_f','ranger_m','ranger_f'];
export const PLAYER_VISUAL_STATES=['base','weapon','armor','weapon_armor'];
export const PLAYER_DIRECTION_ROWS={down:0,downLeft:1,left:2,upLeft:3,up:4,upRight:5,right:6,downRight:7};

export function defaultAppearanceForClass(classId){return `${classId||'warrior'}_m` in PLAYER_APPEARANCES?`${classId||'warrior'}_m`:'warrior_m'}
export function appearanceFor(id){return PLAYER_APPEARANCES[id]||PLAYER_APPEARANCES.warrior_m}
export function playerTextureKey(appearanceId,state='base'){return `player-${appearanceFor(appearanceId).id}-${PLAYER_VISUAL_STATES.includes(state)?state:'base'}`}
export function playerOutlineTextureKey(appearanceId,state='base'){return `${playerTextureKey(appearanceId,state)}-outline`}
export function idleFrameForFacing(facing='down'){return (PLAYER_DIRECTION_ROWS[facing]??0)*4+1}
export function facingFromVector(dx,dy,current='down'){
 if(!(dx||dy))return current;
 const angle=(Math.atan2(dy,dx)*180/Math.PI+360)%360;
 const directions=['right','downRight','down','downLeft','left','upLeft','up','upRight'];
 return directions[Math.round(angle/45)%8];
}
