import fs from 'node:fs';
import path from 'node:path';

const root=process.cwd();
const read=file=>fs.readFileSync(path.join(root,file),'utf8');
const assert=(condition,message)=>{if(!condition)throw new Error(message)};
const pngInfo=file=>{
  const bytes=fs.readFileSync(path.join(root,file));
  assert(bytes.subarray(1,4).toString('ascii')==='PNG',`PNG inválido: ${file}`);
  return {width:bytes.readUInt32BE(16),height:bytes.readUInt32BE(20),colorType:bytes[25],size:bytes.byteLength};
};
const assertPng=(file,width,height)=>{
  assert(fs.existsSync(path.join(root,file)),`Asset ausente: ${file}`);
  const info=pngInfo(file);
  assert(info.width===width&&info.height===height,`Canvas inesperado em ${file}: ${info.width}×${info.height}`);
  assert(info.colorType===6,`Alpha RGBA ausente em ${file}`);
  assert(info.size>10000,`Asset vazio ou excessivamente simples: ${file}`);
};

const scene=read('src/scenes/AetherCityScene.ts');
const prologue=read('src/prologue/OldAetherPrologue.ts');
const layout=read('src/world/AetherTerritoryLayout.ts');
const territory=read('src/world/AetherTerritory.ts');
const combat=read('src/combat/CombatSystem.ts');
const preload=read('src/scenes/PreloadScene.ts');
const menu=read('src/scenes/MenuScene.ts');

// Novo jogo e cena contínua.
assert(menu.includes('this.sm.clear();')&&menu.includes("['worldFlags','aetherCityEntrance','aetherContinuousSpawn','transitionSpawn','aetherActiveSector']"),'NOVO JOGO não limpa o estado transitório que poderia pular atores do prólogo.');
assert(layout.includes("id:'old-aether-road-new-game',u:7.7,v:73.2"),'Novo Jogo não aponta para a Estrada Velha.');
assert(scene.includes('this.prologue = new OldAetherPrologue'),'AetherCityScene não instala o prólogo na cena contínua.');
assert(scene.includes('AETHER_NEW_GAME_SPAWN.u,AETHER_NEW_GAME_SPAWN.v'),'Novo Jogo não usa o spawn oficial da Estrada Velha.');
assert(!prologue.includes("scene.start('")&&!prologue.includes("super('WorldScene'"),'O prólogo criou transição de mapa paralela.');

// Assets realmente usados pelos encontros, não os placeholders v1.
for(const [file,w,h] of [
  ['assets/images/characters/prologue/prologue_young_wolf_sheet_v2.png',2172,724],
  ['assets/images/characters/prologue/prologue_goblin_scout_sheet_v2.png',2172,724],
  ['assets/images/characters/prologue/prologue_young_wolf_8dir_v3.png',2048,1280],
  ['assets/images/characters/prologue/prologue_goblin_scout_8dir_v3.png',2048,1280],
  ['assets/images/characters/prologue/aether_patrolman_sheet_v2.png',2080,756],
  ['assets/images/environment/outskirts/prologue/abandoned_wagon_v3.png',1536,1024]
])assertPng(file,w,h);
assert(preload.includes("this.load.spritesheet('prologue_young_wolf'")&&preload.includes("frameWidth:362,frameHeight:724"),'Folha animada do Lobo Jovem não é pré-carregada.');
assert(preload.includes("this.load.spritesheet('prologue_goblin_scout'")&&preload.includes("this.load.spritesheet('aether_patrolman'")&&preload.includes("this.load.image('abandoned_wagon_v3'"),'Assets do Goblin, Patrulheiro ou Carroça não são pré-carregados.');
assert(preload.includes("this.load.spritesheet('prologue_young_wolf_8dir'")&&preload.includes("this.load.spritesheet('prologue_goblin_scout_8dir'")&&preload.includes('frameWidth:256,frameHeight:256'),'Folhas direcionais 8D não são pré-carregadas.');
assert(prologue.includes("texture:'prologue_young_wolf_8dir'")&&prologue.includes("texture:'prologue_goblin_scout_8dir'"),'Encontros roteirizados ainda usam arte decorativa, estática ou sem direção.');
assert(prologue.includes("directional('prologue-wolf','prologue_young_wolf_8dir',7)")&&prologue.includes("directional('prologue-goblin','prologue_goblin_scout_8dir',8)"),'Registros de caminhada/ataque 8D estão ausentes.');
for(const direction of ['n','ne','e','se','s','sw','w','nw']){
  assert(prologue.includes(`${direction}:`),`Direção 8D ausente: ${direction}`);
}
for(const key of ['prologue-wolf-hit','prologue-wolf-death','prologue-goblin-hit','prologue-goblin-death'])assert(prologue.includes(`'${key}'`),`Animação de reação do prólogo ausente: ${key}`);
assert(prologue.includes('enemy.setFlipX(false)')&&!prologue.includes('setFlipX(next.x<prior.x)'),'Animação 8D ainda usa flip horizontal universal.');
assert(prologue.includes('enemy.attackPendingAt=time+')&&prologue.includes('distanceAtImpact<=.88'),'Dano do inimigo não está sincronizado a um instante de ataque.');
assert(prologue.includes('enemy.deathAnimationEndsAt')&&prologue.includes('enemy.corpseExpiresAt=time+3400'),'Morte não preserva feedback visual/cadáver temporário.');
assert(prologue.includes("'Aedan Vale'")&&prologue.includes("role:'Patrulheiro de Aether'")&&prologue.includes("setIsometricSprite?.('aether_patrolman'"),'Patrulheiro não foi integrado com arte própria.');
assert(prologue.includes("this.wagon=add('abandoned_wagon_v3'")&&prologue.includes("label:'Carroça abandonada'")&&prologue.includes("spriteKey:'abandoned_wagon_v3'"),'Carroça Abandonada não tem footprint e interação próprios.');
assert(prologue.includes("freshNewGame?null:scene.worldFlags?.prologue"),'Novo Jogo ainda pode reutilizar flags de prólogo antigas.');
assert(scene.includes("save ? this.registry.get('worldFlags') : {}"),'AetherCityScene ainda herda worldFlags transitórias em Novo Jogo.');
assert(prologue.includes("'prologue-abandoned-wagon'")&&prologue.includes("'prologue-patrolman'")&&prologue.includes('setActive(true).setVisible(true).setAlpha(1)'),'Atores roteirizados não explicitam estado ativo/visível no runtime.');

// Máquina de estados: cada troca exige o estágio anterior — coordenadas só
// revelam a vista/entrada depois da cadeia efetivamente concluída.
const stages=[
  'ARRIVAL_ON_OLD_ROAD','EXAMINE_ROAD_SIGN','COLLECT_TRAVEL_SUPPLIES',
  'DEFEAT_YOUNG_WOLF','DEFEAT_GOBLIN_SCOUTS','EXAMINE_ATTACKED_WAGON',
  'SPEAK_TO_PATROL','VIEW_AETHER','ENTER_AETHER','FIND_SHELTER_IN_AETHER',
  'WAYSTONE_RESPONSE','COMPLETED'
];
for(const stage of stages)assert(prologue.includes(`${stage}:'${stage}'`),`Estado ausente: ${stage}`);
for(let index=1;index<stages.length;index++){
  const prior=`OLD_AETHER_PROLOGUE_STAGES.${stages[index-1]}`;
  const next=`OLD_AETHER_PROLOGUE_STAGES.${stages[index]}`;
  assert(prologue.includes(`advance(${prior},${next}`),`Transição estrita ausente: ${stages[index-1]} → ${stages[index]}`);
}
assert(prologue.includes('if(!expectedStages.includes(this.state.stage))return false;'),'advance aceita pular estágio obrigatório.');
assert(prologue.includes('stageFromMilestones(state)')&&prologue.includes('next.stage=this.stageFromMilestones(next)')&&prologue.includes('if(!next.encounters.goblinScoutsCompleted)next.discoveries.cart=false'),'Save parcial ainda consegue conservar uma etapa narrativa adiantada.');
assert(prologue.includes('isInsideSouthGate')&&prologue.includes('this.isAt(OLD_AETHER_PROLOGUE_STAGES.ENTER_AETHER)'),'Portão Sul ainda avança o prólogo apenas por coordenada.');
assert(
  prologue.includes('this.isAt(OLD_AETHER_PROLOGUE_STAGES.DEFEAT_GOBLIN_SCOUTS)&&!this.state.encounters.goblinScoutsCompleted)this.spawnGoblinScouts()')&&
  prologue.includes('advance(OLD_AETHER_PROLOGUE_STAGES.DEFEAT_GOBLIN_SCOUTS,OLD_AETHER_PROLOGUE_STAGES.EXAMINE_ATTACKED_WAGON'),
  'Goblins não precedem a inspeção da carroça.'
);
assert(prologue.includes('this.state.tavern.introCompleted=true')&&prologue.includes('this.state.waystone.reacted=true')&&prologue.includes('this.state.completed=true'),'Estado de Taverneiro/Marco não persiste.');
assert(prologue.includes('scene.worldFlags.prologue=this.state')&&scene.includes('...(this.worldFlags || {})'),'Save não recebe o estado do prólogo.');

assert(prologue.includes('Minhas entregas simplesmente pararam de chegar'),'Diálogo obrigatório do Taverneiro está incompleto.');
const tavernSection=prologue.slice(prologue.indexOf('openTavernDialogue'),prologue.indexOf('openNeutralWaystone'));
assert(!/fazenda/i.test(tavernSection),'Primeira conversa do Taverneiro revela a Fazenda.');
assert(prologue.includes('Uma antiga estrutura de pedra coberta por inscrições desgastadas.'),'Marco pré-Taverneiro não é neutro.');
assert(prologue.includes('Uma runa se acende por um instante')&&prologue.includes('WAYSTONE_RESPONSE,OLD_AETHER_PROLOGUE_STAGES.COMPLETED'),'Reação única do Marco está ausente.');
assert(prologue.includes("tavernState='LIMITED'"),'Taverna não fica no estado limitado.');
assert(scene.includes('this.prologue?.tryInteract?.()')&&scene.includes('this.prologue?.tryCollect?.()'),'Entrada F/E não delega as interações do prólogo.');
assert(scene.includes('this.prologue?.isPlayerBlockedAt?.(u,v,this.playerIsoRadius)'),'Colisão com encontros roteirizados não está ativa.');
assert(combat.includes('options.range??62')&&combat.includes('!e.suppressLoot'),'Combate não preserva compatibilidade do prólogo com loot futuro.');

// Continuidade: as torres têm footprint, não a imagem inteira do arco.
assert(scene.includes('registerGateTowerFootprints()')&&!scene.includes("registerSolidMask(this.eastGateSprite, 'iso_city_gate_east'"),'O arco inteiro dos portões ainda fecha a passagem.');
assert(scene.includes('static readonly GATE_MIN = 12.70')&&scene.includes('static readonly GATE_MAX = 15.30'),'Vão real dos portões não foi ampliado/centralizado.');
assert(scene.includes('insideEastGate')&&scene.includes('insideSouthGate')&&!scene.includes('checkGateTransitions()'),'Portões não usam passagem física bidirecional.');
assert(territory.includes('isAetherWaterBlocked(u,v,radius)')&&layout.includes('axisU:.81,axisV:-.59')&&territory.includes("bridge.setData?.('walkway',crossing.id)"),'Ponte e corredor caminhável não compartilham a mesma geometria.');

console.log('Prologue validation: PASS');
console.log('State sequence verified:',stages.join(' → '));
console.log('Checkpoints covered estruturalmente: A antes do Lobo; B após Lobo; C após Goblins; D após Patrulheiro; E entrada; F Taverneiro; G Marco.');
