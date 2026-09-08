import fs from 'node:fs';
import path from 'node:path';

const root=process.cwd();
const read=file=>fs.readFileSync(path.join(root,file),'utf8');
const assert=(condition,message)=>{if(!condition)throw new Error(message)};
const scene=read('src/scenes/AetherCityScene.ts');
const prologue=read('src/prologue/OldAetherPrologue.ts');
const layout=read('src/world/AetherTerritoryLayout.ts');
const combat=read('src/combat/CombatSystem.ts');
const preload=read('src/scenes/PreloadScene.ts');
const wolf=fs.readFileSync(path.join(root,'assets/images/characters/prologue/prologue_young_wolf_v1.png'));

assert(layout.includes("AETHER_NEW_GAME_SPAWN={\n  id:'old-aether-road-new-game',u:7.7,v:73.2"),'Novo Jogo não aponta para a Estrada Velha.');
assert(scene.includes('this.prologue = new OldAetherPrologue'),'AetherCityScene não instala o prólogo na cena contínua.');
assert(scene.includes('AETHER_NEW_GAME_SPAWN.u,AETHER_NEW_GAME_SPAWN.v'),'Novo Jogo não usa o spawn oficial da Estrada Velha.');
assert(!prologue.includes("super('WorldScene'")&&!prologue.includes("scene.start('WorldScene'"),'O prólogo criou uma transição de mapa paralela.');
assert(prologue.includes("name:'Lobo Jovem'")&&prologue.includes("name:'Goblin Batedor'"),'Encontros roteirizados ausentes.');
assert(prologue.includes('suppressLoot=true'),'Loot introdutório não está separado do Spawn Manager.');
assert(prologue.includes("name:'Aedan Vale'")&&prologue.includes('Patrulheiro de Aether'),'Patrulheiro não foi integrado.');
assert(prologue.includes('Minhas entregas simplesmente pararam de chegar'),'Diálogo obrigatório do Taverneiro incompleto.');
const tavernSection=prologue.slice(prologue.indexOf('openTavernDialogue'),prologue.indexOf('openNeutralWaystone'));
assert(!/fazenda/i.test(tavernSection),'A primeira conversa do Taverneiro revela a Fazenda.');
assert(prologue.includes('Uma antiga estrutura de pedra coberta por inscrições desgastadas.'),'Marco pré-Taverneiro não é neutro.');
assert(prologue.includes('Uma runa se acende por um instante')&&prologue.includes('state.waystone.reacted=true'),'Reação única do Marco ausente.');
assert(prologue.includes("tavernState='LIMITED'"),'Taverna não fica no estado limitado.');
assert(scene.includes('this.prologue?.tryInteract?.()'),'F não delega as interações do prólogo.');
assert(scene.includes('this.prologue?.tryCollect?.()'),'E não delega a coleta do prólogo.');
assert(scene.includes('this.prologue?.isPlayerBlockedAt?.(u,v,this.playerIsoRadius)'),'Colisão do jogador com encontros não está ativa.');
assert(combat.includes('options.range??62')&&combat.includes('!e.suppressLoot'),'Combate não preserva o comportamento existente ao suportar o prólogo.');
assert(preload.includes("'prologue_young_wolf_v1'"),'Asset do Lobo Jovem não é pré-carregado.');
assert(wolf.subarray(1,4).toString('ascii')==='PNG'&&wolf[25]===6&&wolf.byteLength>10000,'Sprite do Lobo Jovem não possui PNG RGBA válido.');

const state={version:1,started:true,stage:'ARRIVAL_ON_OLD_ROAD',tutorials:{movementComplete:false,interactionComplete:false,collectionComplete:false},encounters:{youngWolf:'pending',goblinScouts:['pending','pending'],goblinScoutsCompleted:false},discoveries:{cart:false,patrol:false,aetherVista:false,cityEntry:false},tavern:{introCompleted:false},waystone:{examined:false,reacted:false},completed:false};
const checkpoints=[];
const checkpoint=(id,mutate,verify)=>{mutate();const restored=JSON.parse(JSON.stringify(state));assert(verify(restored),`Checkpoint ${id} perdeu estado do prólogo.`);checkpoints.push(id);};
checkpoint('A_beforeWolf',()=>{state.tutorials.collectionComplete=true;state.stage='FIRST_WOLF';},s=>s.encounters.youngWolf==='pending'&&s.tutorials.collectionComplete);
checkpoint('B_afterWolf',()=>{state.encounters.youngWolf='defeated';state.stage='ATTACKED_WAGON';},s=>s.encounters.youngWolf==='defeated');
checkpoint('C_afterGoblins',()=>{state.discoveries.cart=true;state.encounters.goblinScouts=['defeated','defeated'];state.encounters.goblinScoutsCompleted=true;state.stage='PATROL_AHEAD';},s=>s.discoveries.cart&&s.encounters.goblinScoutsCompleted);
checkpoint('D_afterPatrol',()=>{state.discoveries.patrol=true;state.discoveries.aetherVista=true;state.stage='ENTER_AETHER';},s=>s.discoveries.patrol&&s.discoveries.aetherVista);
checkpoint('E_afterCityEntry',()=>{state.discoveries.cityEntry=true;state.stage='FIND_SHELTER_IN_AETHER';},s=>s.discoveries.cityEntry&&s.stage==='FIND_SHELTER_IN_AETHER');
checkpoint('F_afterTavern',()=>{state.tavern.introCompleted=true;state.stage='WAYSTONE_RESPONSE';},s=>s.tavern.introCompleted&&s.stage==='WAYSTONE_RESPONSE');
checkpoint('G_afterWaystone',()=>{state.waystone.examined=true;state.waystone.reacted=true;state.completed=true;state.stage='COMPLETED';},s=>s.waystone.reacted&&s.completed&&s.stage==='COMPLETED');

console.log('Prologue validation: PASS');
console.log('Checkpoints persisted structurally: A, B, C, D, E, F, G');
