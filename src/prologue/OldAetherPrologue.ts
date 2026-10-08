// @ts-nocheck
import {Enemy} from '../entities/Enemy';
import {Npc} from '../npc/Npc';
import {AETHER_PROLOGUE_ANCHORS} from '../world/AetherTerritoryLayout';
import {worldClock,GAME_DAY_MS} from '../world/WorldClock';

const ISO_CONFIG={tileWidth:96,tileHeight:48,screenOriginX:1600,screenOriginY:250,depthBase:-20000};

// A arte é uma volta corporal real, não uma imagem lateral reaproveitada. A
// coluna física do atlas foi mapeada pela pose que ela mostra na tela: o
// primeiro quadro é frente (sul), o quinto é costas (norte).
const ENEMY_DIRECTIONS=Object.freeze(['n','ne','e','se','s','sw','w','nw']);
const ENEMY_DIRECTION_COLUMNS=Object.freeze({n:4,ne:3,e:2,se:1,s:0,sw:7,w:6,nw:5});
const ENEMY_SCREEN_OCTANTS=Object.freeze(['e','se','s','sw','w','nw','n','ne']);

// Round 79.12 — calibração visual do Lobo Jovem contra a Maga feminina.
// A Maga mede ~88 px úteis no mundo (94 px úteis x escala 0.94). O lobo
// direcional ocupa ~165–173 px úteis dentro do frame 256, então 102/256
// deixa o animal com ~66–69 px visuais: claramente jovem, mas com presença.
const YOUNG_WOLF_FRAME_TARGET_HEIGHT=102;
const YOUNG_WOLF_DIRECTIONAL_USEFUL_BOTTOM=244;
const YOUNG_WOLF_DIRECTIONAL_PROFILE_WIDTH=192;
const PROLOGUE_LEGACY_REACTION_FRAME_HEIGHT=724;
const YOUNG_WOLF_DEATH_USEFUL_WIDTH=352;
const YOUNG_WOLF_DEATH_USEFUL_BOTTOM=529;

// Round 79.25 — calibração visual dos dois Goblins Batedores.
// O atlas 8-dir tem frames 256x256, porém a arte útil ocupa ~193–202 px
// de altura no idle e termina sempre em y=244. Usar 96/256 como escala
// deixa o goblin com ~72–76 px visíveis no idle (e ~68–84 px ao andar/
// atacar), menor que a Maga sem parecer miniaturizado. O cadáver da folha
// antiga é alinhado pela base útil e dimensionado pela largura corporal,
// evitando o encolhimento que ocorria ao usar os 724 px transparentes.
const GOBLIN_FRAME_TARGET_HEIGHT=96;
const GOBLIN_DIRECTIONAL_USEFUL_BOTTOM=244;
const GOBLIN_DIRECTIONAL_PROFILE_WIDTH=170;
const GOBLIN_DEATH_USEFUL_WIDTH=349;
const GOBLIN_DEATH_USEFUL_BOTTOM=660;
const GOBLIN_CORPSE_LENGTH_FACTOR=1.16;

// Round 79.26 — UI dedicada dos dois Goblins Batedores. Mesma linguagem
// visual refinada do Lobo Jovem, porém um pouco mais compacta por serem
// inimigos comuns. O lift acompanha a nova escala 79.25 e mantém respiro
// claro entre a cabeça e a barra.
const GOBLIN_UI=Object.freeze({
  lift:92,
  nameOffset:18,
  frameWidth:62,
  frameHeight:10
});

// Round 79.21 — UI dedicada do Lobo Jovem. O topo útil da arte viva fica
// próximo de 66–69 px acima dos pés. A barra sobe para deixar um respiro
// real sobre a cabeça e recebe uma moldura curta em bronze escurecido,
// mantendo a leitura do HUD sem parecer um placeholder genérico.
const YOUNG_WOLF_UI=Object.freeze({
  lift:74,
  nameOffset:18,
  frameWidth:64,
  frameHeight:10
});


// Round 79.19 — pós-morte persistente do Lobo Jovem.
// O relógio do mundo corre 20x mais rápido que o tempo real: 20 minutos do
// jogo = ~60 s reais. O cadáver não some por temporizador curto; ele envelhece
// no chão e só é limpo depois de muito mais tempo e quando o jogador se afasta.
const YOUNG_WOLF_AFTER_MATH=Object.freeze({
  freshGameMs:20*60*1000,       // ~60 s reais
  agedGameMs:45*60*1000,        // ~2m15s reais
  corpseCleanupGameMs:70*60*1000, // ~3m30s reais
  bloodCleanupGameMs:90*60*1000,  // ~4m30s reais
  cleanupDistance:5.2
});

// Round 79.27 — pós-morte persistente dos dois Goblins Batedores.
// Como são humanoides ligados à emboscada da estrada, o aftermath permanece
// um pouco mais que o do Lobo Jovem. Não reutilizamos os esqueletos humanos
// da caravana: o corpo recém-derrotado envelhece no próprio sprite e some
// somente depois, quando o jogador já se afastou.
const GOBLIN_AFTER_MATH=Object.freeze({
  freshGameMs:30*60*1000,          // ~1m30s reais
  agedGameMs:60*60*1000,           // ~3 min reais
  corpseCleanupGameMs:100*60*1000, // ~5 min reais
  bloodCleanupGameMs:120*60*1000,  // ~6 min reais
  cleanupDistance:5.5
});

const clamp01=(value)=>Math.max(0,Math.min(1,value));
function mixHexColor(from,to,t){
  const k=clamp01(t);
  const fr=(from>>16)&255,fg=(from>>8)&255,fb=from&255;
  const tr=(to>>16)&255,tg=(to>>8)&255,tb=to&255;
  const r=Math.round(fr+(tr-fr)*k),g=Math.round(fg+(tg-fg)*k),b=Math.round(fb+(tb-fb)*k);
  return (r<<16)|(g<<8)|b;
}

function enemyDirectionFromScreenDelta(dx,dy,fallback='s'){
  if(!dx&&!dy)return fallback;
  const octant=((Math.round(Math.atan2(dy,dx)/(Math.PI/4))%8)+8)%8;
  return ENEMY_SCREEN_OCTANTS[octant]||fallback;
}

/**
 * Estados lineares e persistentes do prólogo. Coordenadas podem revelar uma
 * cena, mas nunca pulam uma transição: cada avanço precisa do estado anterior
 * e da ação/combate que o concluiu.
 */
export const OLD_AETHER_PROLOGUE_STAGES=Object.freeze({
  ARRIVAL_ON_OLD_ROAD:'ARRIVAL_ON_OLD_ROAD',
  EXAMINE_ROAD_SIGN:'EXAMINE_ROAD_SIGN',
  FOLLOW_OLD_ROAD:'FOLLOW_OLD_ROAD',
  WOLF_ENTRANCE:'WOLF_ENTRANCE',
  DEFEAT_YOUNG_WOLF:'DEFEAT_YOUNG_WOLF',
  EXAMINE_RUINED_WAYSTONE:'EXAMINE_RUINED_WAYSTONE',
  FOLLOW_ROAD_AFTER_WAYSTONE:'FOLLOW_ROAD_AFTER_WAYSTONE',
  COLLECT_TRAVEL_SUPPLIES:'COLLECT_TRAVEL_SUPPLIES',
  POTION_HINT_PENDING:'POTION_HINT_PENDING',
  INVESTIGATE_ROAD_BLOOD:'INVESTIGATE_ROAD_BLOOD',
  BLOOD_SCENE_WAIT_MOVEMENT:'BLOOD_SCENE_WAIT_MOVEMENT',
  RETURN_TO_ROAD_FACE_GOBLINS:'RETURN_TO_ROAD_FACE_GOBLINS',
  DEFEAT_GOBLIN_SCOUTS:'DEFEAT_GOBLIN_SCOUTS',
  EXAMINE_ATTACKED_WAGON:'EXAMINE_ATTACKED_WAGON',
  SPEAK_TO_PATROL:'SPEAK_TO_PATROL',
  VIEW_AETHER:'VIEW_AETHER',
  ENTER_AETHER:'ENTER_AETHER',
  FIND_SHELTER_IN_AETHER:'FIND_SHELTER_IN_AETHER',
  WAYSTONE_RESPONSE:'WAYSTONE_RESPONSE',
  COMPLETED:'COMPLETED'
});

const STAGES=new Set(Object.values(OLD_AETHER_PROLOGUE_STAGES));

/** Rastreio provisório, ancorado abaixo do minimapa, e não na tela-mundo. */
class PrologueHud{
  constructor(scene){
    this.scene=scene;
    this.root=scene.add.container(0,0).setScrollFactor(0).setDepth(1750);
    this.back=scene.add.graphics().setScrollFactor(0);
    this.label=scene.add.text(13,9,'OBJETIVO',{fontFamily:'Arial',fontSize:10,color:'#e7c982',fontStyle:'bold',letterSpacing:1}).setScrollFactor(0);
    this.objective=scene.add.text(13,26,'',{fontFamily:'Georgia, serif',fontSize:15,color:'#f7f8f9',fontStyle:'bold',wordWrap:{width:292}}).setScrollFactor(0);
    this.root.add([this.back,this.label,this.objective]);
    this.hintText=scene.add.text(scene.scale.width/2,116,'',{fontFamily:'Georgia, serif',fontSize:15,color:'#fffdf6',fontStyle:'bold',stroke:'#101820',strokeThickness:4,align:'center',wordWrap:{width:460}}).setOrigin(.5).setScrollFactor(0).setDepth(1760).setAlpha(0);
    this.resizeHandler=()=>this.layout();
    scene.scale.on(Phaser.Scale.Events.RESIZE,this.resizeHandler);
    this.layout();
  }
  layout(){
    const width=Math.min(326,Math.max(226,this.scene.scale.width-44));
    const pad=Phaser.Math.Clamp(Math.round(this.scene.scale.width*.012),10,16);
    // O minimapa ocupa ~208 px na HUD; mantém uma folga visual estável abaixo.
    const top=Math.min(this.scene.scale.height-74,pad+216);
    this.root.setPosition(this.scene.scale.width-pad-width,top);
    this.back.clear().fillStyle(0x101821,.88).fillRoundedRect(0,0,width,58,9).lineStyle(1,0xc4a45a,.74).strokeRoundedRect(0,0,width,58,9);
    this.objective.setWordWrapWidth(width-25,true);
    this.hintText.setPosition(this.scene.scale.width/2,Math.max(104,top-26)).setWordWrapWidth(Math.min(520,this.scene.scale.width-56),true);
  }
  setObjective(text){
    this.objective.setText(text);
    // O tracker permanece oculto enquanto nao ha objetivo narrativo.
    this.root.setVisible(Boolean(text));
  }
  hint(text,{persistent=false}={}){
    this.scene.tweens.killTweensOf(this.hintText);
    this.hintText.setText(text).setAlpha(0);
    if(persistent){
      // Mesma apresentação visual; sem o temporizador que apagava a dica.
      this.scene.tweens.add({targets:this.hintText,alpha:1,duration:160,ease:'Sine.Out'});
      return;
    }
    this.scene.tweens.add({targets:this.hintText,alpha:1,duration:160,ease:'Sine.Out',yoyo:true,hold:2100,onComplete:()=>this.hintText.setText('')});
  }
  hideHint(){
    this.scene.tweens.killTweensOf(this.hintText);
    this.hintText.setText('').setAlpha(0);
  }
  destroy(){this.scene.scale.off(Phaser.Scale.Events.RESIZE,this.resizeHandler);this.root.destroy(true);this.hintText.destroy();}
}

/** Prompt de interação com asset próprio, ligado ao prop real. */
class PrologueCue{
  constructor(scene){
    this.scene=scene;
    this.root=scene.add.container(0,0).setDepth(1800).setScrollFactor(1).setVisible(false);
    this.panel=scene.add.image(0,0,'prologue_interact_panel').setOrigin(.5).setScale(1);
    this.keycap=scene.add.image(-58,0,'prologue_interact_keycap').setOrigin(.5).setScale(1);
    this.key=scene.add.text(-58,0,'F',{
      fontFamily:'Georgia, serif',fontSize:11,color:'#f7eed0',fontStyle:'bold',
      stroke:'#1a1410',strokeThickness:2
    }).setOrigin(.5);
    this.text=scene.add.text(-36,0,'Investigar',{
      fontFamily:'Georgia, serif',fontSize:11,color:'#ead9ac',fontStyle:'bold',
      stroke:'#0f0c08',strokeThickness:2,shadow:{offsetX:0,offsetY:1,color:'#000000',blur:0,fill:true}
    }).setOrigin(0,.5);
    this.root.add([this.panel,this.keycap,this.key,this.text]);
    this.root.setAlpha(1);
    this.redraw('F','Investigar');
  }
  redraw(key,label){
    const keyText=(key||'F').trim().slice(0,1).toUpperCase()||'F';
    const labelText=(label||'Investigar').trim()||'Investigar';
    this.key.setText(keyText);
    this.text.setText(labelText);
    this.text.setFontSize(labelText.length>14?10:11);
    this.key.setPosition(-58,0);
    this.keycap.setPosition(-58,0);
    this.text.setPosition(-36,0);
  }
  show(x,y,_depth,label){
    const match=/^([A-Z])\s*[-—•]\s*(.*)$/.exec(label||'');
    const key=match?.[1]||'F';
    const text=match?.[2]||label||'Investigar';
    this.redraw(key,text);
    this.root.setPosition(x,y).setVisible(true).setAlpha(1).setDepth(1800);
  }
  hide(){this.root.setVisible(false);}
  destroy(){this.root.destroy(true);}
}

/**
 * Sequência persistente do prólogo sobre a AetherCityScene contínua. Não cria
 * uma Scene, save, spawn manager ou sistema de colisão paralelo.
 */
export class OldAetherPrologue{
  constructor(scene,{freshNewGame=false}={}){
    this.scene=scene;
    const persisted=scene.worldFlags?.prologue;
    this.enabled=!!freshNewGame||!!persisted?.started;
    if(!this.enabled)return;

    this.state=this.normalizeState(persisted?.started?persisted:null);
    scene.worldFlags.prologue=this.state;
    scene.worldFlags.tavernState='LIMITED';
    scene.aetherTerritory?.oldRoadProps?.setRuinedWaystoneActivated?.(!!this.state.waystone.ruinedExamined,{animate:false});
    this.anchors=AETHER_PROLOGUE_ANCHORS;
    this.enemies=[];
    this.ensureAnimations();
    this.hud=new PrologueHud(scene);
    this.cue=new PrologueCue(scene);
    this.createRoadSetDressing();
    this.createBloodTrailDressing();
    this.createCollectible();
    this.refreshOldRoadAftermath();
    this.wolfAftermathVisual=null;
    this.goblinAftermathVisuals=[null,null];
    this.restoreYoungWolfAftermath();
    this.restoreGoblinScoutAftermaths();
    this.syncObjective();
    // A mensagem exibida após derrotar o lobo só sai no próximo deslocamento real.
    this.wolfDefeatHintPendingMovement=false;
    this.potionHintPendingMovement=this.isAt(OLD_AETHER_PROLOGUE_STAGES.POTION_HINT_PENDING);
    if(this.potionHintPendingMovement)this.showPotionHint();
    // Um save feito no meio da investigação retoma o aviso e os cinco segundos.
    this.bloodSceneLockedUntil=0;
    if(this.isAt(OLD_AETHER_PROLOGUE_STAGES.BLOOD_SCENE_WAIT_MOVEMENT))this.startBloodSceneMessage();
    this.movementHintPending=!this.state.tutorials.movementComplete;
    if(this.movementHintPending){
      scene.time.delayedCall(420,()=>{
        // Se o jogador já andou antes dos 420 ms, não mostrar a dica depois.
        if(this.movementHintPending)this.hud?.hint('Use WASD ou as setas para se mover. As diagonais também funcionam.',{persistent:true});
      });
    }
  }

  createState(){
    return {
      version:5,started:true,stage:OLD_AETHER_PROLOGUE_STAGES.ARRIVAL_ON_OLD_ROAD,
      aftermath:{
        youngWolf:{active:false,u:null,v:null,deathGameMs:null,corpseGone:false,bloodGone:false},
        goblinScouts:[
          {active:false,u:null,v:null,deathGameMs:null,corpseGone:false,bloodGone:false},
          {active:false,u:null,v:null,deathGameMs:null,corpseGone:false,bloodGone:false}
        ]
      },
      tutorials:{movementShown:true,movementComplete:false,interactionComplete:false,collectionComplete:false,
        suppliesApproachReached:false,potionHintDismissed:false,
        bloodSceneTriggered:false,bloodSceneMessageDismissed:false,goblinRoadEncounterStarted:false},
      encounters:{youngWolf:'pending',youngWolfIntroSeen:false,youngWolfIntroComplete:false,goblinScouts:['pending','pending'],goblinScoutsCompleted:false,rewardGranted:false},
      discoveries:{cart:false,patrol:false,aetherVista:false,cityEntry:false},
      gates:{southEntryHinted:false},
      tavern:{introCompleted:false},waystone:{examined:false,ruinedExamined:false,reacted:false},completed:false
    };
  }

  /**
   * A posição salva pode ser preservada, mas o estágio narrativo sempre é
   * reconstruído a partir dos marcos que realmente foram concluídos. Isso
   * impede que um save parcial da versão interrompida deixe o jogador pular
   * lobo, batedores, carroça ou patrulheiro apenas por conter uma string de
   * estágio adiantada.
   */
  stageFromMilestones(state){
    if(state.completed||state.waystone.reacted)return OLD_AETHER_PROLOGUE_STAGES.COMPLETED;
    if(state.tavern.introCompleted)return OLD_AETHER_PROLOGUE_STAGES.WAYSTONE_RESPONSE;
    if(state.discoveries.cityEntry)return OLD_AETHER_PROLOGUE_STAGES.FIND_SHELTER_IN_AETHER;
    if(state.discoveries.aetherVista)return OLD_AETHER_PROLOGUE_STAGES.ENTER_AETHER;
    if(state.discoveries.patrol)return OLD_AETHER_PROLOGUE_STAGES.VIEW_AETHER;
    if(state.discoveries.cart)return OLD_AETHER_PROLOGUE_STAGES.SPEAK_TO_PATROL;
    if(state.encounters.goblinScoutsCompleted)return OLD_AETHER_PROLOGUE_STAGES.EXAMINE_ATTACKED_WAGON;
    if(state.encounters.youngWolf==='defeated'){
      if(state.tutorials.collectionComplete){
        if(!state.tutorials.potionHintDismissed)return OLD_AETHER_PROLOGUE_STAGES.POTION_HINT_PENDING;
        if(state.tutorials.bloodSceneMessageDismissed)return state.tutorials.goblinRoadEncounterStarted
          ?OLD_AETHER_PROLOGUE_STAGES.DEFEAT_GOBLIN_SCOUTS
          :OLD_AETHER_PROLOGUE_STAGES.RETURN_TO_ROAD_FACE_GOBLINS;
        if(state.tutorials.bloodSceneTriggered)return OLD_AETHER_PROLOGUE_STAGES.BLOOD_SCENE_WAIT_MOVEMENT;
        return OLD_AETHER_PROLOGUE_STAGES.INVESTIGATE_ROAD_BLOOD;
      }
      if(state.waystone.ruinedExamined)return state.tutorials.suppliesApproachReached
        ?OLD_AETHER_PROLOGUE_STAGES.COLLECT_TRAVEL_SUPPLIES
        :OLD_AETHER_PROLOGUE_STAGES.FOLLOW_ROAD_AFTER_WAYSTONE;
      return OLD_AETHER_PROLOGUE_STAGES.EXAMINE_RUINED_WAYSTONE;
    }
    // Um save antigo pode ter coletado os suprimentos antes do lobo.
    if(state.tutorials.collectionComplete||state.encounters.youngWolfIntroComplete)return OLD_AETHER_PROLOGUE_STAGES.DEFEAT_YOUNG_WOLF;
    if(state.encounters.youngWolfIntroSeen)return OLD_AETHER_PROLOGUE_STAGES.WOLF_ENTRANCE;
    if(state.tutorials.interactionComplete)return OLD_AETHER_PROLOGUE_STAGES.FOLLOW_OLD_ROAD;
    if(state.tutorials.movementComplete)return OLD_AETHER_PROLOGUE_STAGES.EXAMINE_ROAD_SIGN;
    return OLD_AETHER_PROLOGUE_STAGES.ARRIVAL_ON_OLD_ROAD;
  }

  /** Migra saves 9B sem teleportar nem invalidar posição/equipamento. */
  normalizeState(persisted){
    const next=this.createState();
    if(!persisted)return next;
    next.started=true;
    next.tutorials={...next.tutorials,...persisted.tutorials};
    next.encounters={...next.encounters,...persisted.encounters};
    next.encounters.goblinScouts=Array.isArray(persisted.encounters?.goblinScouts)
      ?[persisted.encounters.goblinScouts[0]||'pending',persisted.encounters.goblinScouts[1]||'pending']
      :next.encounters.goblinScouts;
    next.discoveries={...next.discoveries,...persisted.discoveries};
    next.gates={...next.gates,...persisted.gates};
    next.tavern={...next.tavern,...persisted.tavern};
    next.waystone={...next.waystone,...persisted.waystone};
    next.aftermath={...next.aftermath,...persisted.aftermath,
      youngWolf:{...next.aftermath.youngWolf,...persisted.aftermath?.youngWolf},
      goblinScouts:[0,1].map(index=>({
        ...next.aftermath.goblinScouts[index],
        ...(Array.isArray(persisted.aftermath?.goblinScouts)?persisted.aftermath.goblinScouts[index]:null)
      }))
    };
    // Saves do Round 21 já no objetivo dos suprimentos permanecem nessa etapa.
    if(persisted.stage==='COLLECT_TRAVEL_SUPPLIES'&&next.waystone.ruinedExamined)
      next.tutorials.suppliesApproachReached=true;
    if(next.encounters.goblinScouts.every(value=>value==='defeated'))next.encounters.goblinScoutsCompleted=true;
    // Saves de builds anteriores que já iniciaram o combate não retrocedem.
    if(persisted.stage==='DEFEAT_GOBLIN_SCOUTS'&&!next.encounters.goblinScoutsCompleted){
      next.tutorials.bloodSceneMessageDismissed=true;
      next.tutorials.goblinRoadEncounterStarted=true;
    }
    next.completed=!!persisted.completed||!!next.waystone.reacted;
    // A v1 permitia carroça → goblins. A mesma normalização também protege
    // saves v2 que tenham sido gravados no meio de uma execução interrompida.
    if(!next.encounters.goblinScoutsCompleted)next.discoveries.cart=false;
    next.stage=this.stageFromMilestones(next);
    next.version=5;
    return next;
  }

  isAt(...stages){return stages.includes(this.state.stage);}
  advance(expected,next,mutate){
    const expectedStages=Array.isArray(expected)?expected:[expected];
    if(!expectedStages.includes(this.state.stage))return false;
    mutate?.();
    this.state.stage=next;
    this.syncObjective();
    this.scene.saveGame();
    return true;
  }

  save(){this.scene.worldFlags.prologue=this.state;this.scene.saveGame();}

  ensureAnimations(){
    const create=(key,texture,frames,frameRate=7,repeat=0)=>{
      if(!this.scene.textures.exists(texture)||this.scene.anims.exists(key))return;
      this.scene.anims.create({key,frames:this.scene.anims.generateFrameNumbers(texture,{frames}),frameRate,repeat});
    };
    const directional=(prefix,texture,walkRate)=>{
      for(const direction of ENEMY_DIRECTIONS){
        const column=ENEMY_DIRECTION_COLUMNS[direction];
        create(`${prefix}-idle-${direction}`,texture,[column],2,-1);
        create(`${prefix}-walk-${direction}`,texture,[8+column,16+column],walkRate,-1);
        create(`${prefix}-attack-${direction}`,texture,[24+column,32+column],10,0);
      }
    };
    directional('prologue-wolf','prologue_young_wolf_8dir',7);
    directional('prologue-goblin','prologue_goblin_scout_8dir',8);
    // O hit do lobo usa o próprio atlas 8-dir (flash branco do Enemy.takeDamage),
    // evitando a troca visual para a folha antiga. A morte usa apenas o quadro
    // limpo do cadáver; os quadros 0–4 da folha v2 têm sangramento nas bordas.
    create('prologue-wolf-death','prologue_young_wolf', [5],1,0);
    // O hit dos goblins permanece no atlas 8-dir e usa o flash branco do
    // Enemy.takeDamage, evitando troca de escala/arte durante o impacto.
    // A morte usa apenas o quadro final de cadáver: o frame 4 ainda está
    // ereto e, por ter envelope útil muito maior, causaria um salto de escala.
    create('prologue-goblin-death','prologue_goblin_scout', [5],1,0);
    create('prologue-patrol-idle','aether_patrolman',[0],2,-1);
    create('prologue-patrol-walk','aether_patrolman',[1,2],7,-1);
    create('prologue-patrol-gesture','aether_patrolman',[3,0],6,0);
  }

  createRoadSetDressing(){
    // A carroça abandonada volta ao mapa como cena fixa da emboscada, agora
    // na clareira acima da estrada. Os itens caídos usam o mesmo padrão de
    // arte do prólogo e ficam ligados à mesma âncora narrativa.
    this.wagon=null;
    this.cartDecor=[];
    const anchor=this.anchors.attackedWagon;
    const point=this.scene.project(anchor.u,anchor.v);
    if(this.scene.textures.exists('abandoned_wagon_v3')){
      const source=this.scene.textures.get('abandoned_wagon_v3').getSourceImage();
      this.wagon=this.scene.add.image(point.x,point.y,'abandoned_wagon_v3')
        .setOrigin(.5,.76)
        .setScale(238/source.width)
        .setDepth(this.scene.depthAt(anchor.u,anchor.v,.09))
        .setFlipX(true);
    }
    const placeScatter=(key,du,dv,height,angle=0,depthOffset=.06,originX=.5,originY=1)=>{
      if(!this.scene.textures.exists(key))return;
      const source=this.scene.textures.get(key).getSourceImage();
      const p=this.scene.project(anchor.u+du,anchor.v+dv);
      const prop=this.scene.add.image(p.x,p.y,key)
        .setOrigin(originX,originY)
        .setScale(height/source.height)
        .setAngle(angle)
        .setDepth(this.scene.depthAt(anchor.u+du,anchor.v+dv,depthOffset));
      this.cartDecor.push(prop);
    };
    // Round 75: regras definitivas para a carga caída da carroça.
    // 1) Nenhum item pode ficar "solto" longe da carroça.
    // 2) Todo item deve permanecer visualmente ligado à frente / lateral imediata
    //    do veículo, formando um pequeno agrupamento saqueado no chão.
    // 3) A distribuição continua tendo leitura esquerda / centro / direita, mas
    //    agora compacta e ancorada ao footprint da carroça.
    placeScatter('road_wagon_scatter_barrel_01',-.20,.62,44,6,.04,.5,.82);
    placeScatter('road_wagon_scatter_crate_01',.34,.80,48,-8,.04,.5,.86);
    placeScatter('road_wagon_scatter_supplies_01',.82,.46,42,10,.04,.5,.86);
  }

  // Cena ambiental da emboscada na Estrada Velha. Cada PNG e posicionado
  // isoladamente em coordenadas do territorio: nao cola um fundo sobre o mapa,
  // nao altera a geometria e nao interfere na quest ainda pendente do sangue.
  createBloodTrailDressing(){
    this.bloodTrailDecor=[];
    this.skeletalRemainsDecor=[];
    // Round 58: sangue e corpos são elementos de chão. Eles não participam do
    // Y-sorting isométrico dos atores, pois isso fazia um corpo/poça ganhar
    // profundidade maior que o jogador e cobrir a personagem. A ordem fixa é:
    // terreno/estrada -> sangue -> corpos/restos -> atores.
    const groundDepth=(layer)=>this.scene.aetherTerritory?.groundDepth?.(layer)??(this.scene.depthAt(0,0,layer));
    const BLOOD_GROUND_LAYER=-69.70;
    const BODY_GROUND_LAYER=-69.35;
    const SKELETON_GROUND_LAYER=-69.30;
    const place=(collection,key,u,v,width,groundLayer,originX=.5,originY=.5)=>{
      if(!this.scene.textures.exists(key))return;
      const point=this.scene.project(u,v);
      const source=this.scene.textures.get(key).getSourceImage();
      const sprite=this.scene.add.image(point.x,point.y,key)
        .setOrigin(originX,originY)
        .setScale(width/source.width)
        .setDepth(groundDepth(groundLayer));
      sprite.setData?.('aetherRenderClass','ground-decal');
      collection.push(sprite);
      return sprite;
    };
    // Pequena poça inicial junto à estrada e um começo de rastro mais delicado,
    // evitando que o sangue pareça “flutuar” e melhorando a leitura visual.
    place(this.bloodTrailDecor,'road_blood_pool_02',10.02,63.00,48,BLOOD_GROUND_LAYER,.5,.5);
    place(this.bloodTrailDecor,'road_blood_pool_01',9.88,62.84,24,BLOOD_GROUND_LAYER,.5,.5);
    const trail=[
      [9.58,62.42,39],[9.22,61.70,35],[8.88,60.96,34],
      [8.48,60.18,38],[8.00,59.54,37],[7.46,58.78,43],
      [7.08,58.02,35],[6.72,57.30,42],[6.34,56.66,39],
      [6.00,56.06,44],[5.70,55.42,47],[5.48,54.84,38],
      [5.30,54.28,42]
    ];
    trail.forEach(([u,v,width],index)=>place(this.bloodTrailDecor,`road_blood_trail_0${index%3+1}`,u,v,width,BLOOD_GROUND_LAYER,.5,.5));

    // As poças principais ficam claramente abaixo dos viajantes abatidos.
    place(this.bloodTrailDecor,'road_blood_pool_03',4.84,53.10,94,BLOOD_GROUND_LAYER,.5,.5);
    place(this.bloodTrailDecor,'road_blood_pool_02',6.14,53.76,98,BLOOD_GROUND_LAYER,.5,.5);
    place(this.bloodTrailDecor,'road_blood_pool_01',5.58,54.02,58,BLOOD_GROUND_LAYER,.5,.5);

    // Corpos ligeiramente reposicionados para parecerem deitados sobre o sangue,
    // mantendo a passagem do jogador por cima deles.
    place(this.bloodTrailDecor,'road_fallen_traveler_01',4.76,52.96,122,BODY_GROUND_LAYER,.5,.75);
    place(this.bloodTrailDecor,'road_fallen_traveler_02',6.14,53.50,116,BODY_GROUND_LAYER,.5,.77);

    // Restos esqueléticos futuros seguem a mesma lógica de alinhamento.
    place(this.skeletalRemainsDecor,'road_skeletal_remains_01',4.80,53.00,109,SKELETON_GROUND_LAYER,.5,.73);
    place(this.skeletalRemainsDecor,'road_skeletal_remains_02',6.12,53.60,103,SKELETON_GROUND_LAYER,.5,.75);
  }

  shouldUseSkeletalAftermath(){
    return !!(this.state?.tavern?.introCompleted&&!this.state?.waystone?.reacted&&!this.state?.completed);
  }

  refreshOldRoadAftermath(){
    const showBones=this.shouldUseSkeletalAftermath();
    for(const item of this.bloodTrailDecor||[])item?.setVisible(!showBones);
    for(const item of this.skeletalRemainsDecor||[])item?.setVisible(showBones);
  }

  worldGameMs(){
    return Math.max(0,(worldClock.day-1)*GAME_DAY_MS+worldClock.timeOfDayMs);
  }

  youngWolfCorpseScale(){
    const directionalScale=YOUNG_WOLF_FRAME_TARGET_HEIGHT/256;
    const liveProfileWidth=YOUNG_WOLF_DIRECTIONAL_PROFILE_WIDTH*directionalScale;
    return liveProfileWidth/YOUNG_WOLF_DEATH_USEFUL_WIDTH;
  }

  createYoungWolfBlood(u,v){
    const blood=[];
    const groundDepth=this.scene.aetherTerritory?.groundDepth?.(-69.63)??this.scene.depthAt(u,v,-69.63);
    const place=(key,du,dv,width,alpha)=>{
      if(!this.scene.textures.exists(key))return null;
      const p=this.scene.project(u+du,v+dv);
      const source=this.scene.textures.get(key).getSourceImage();
      const sprite=this.scene.add.image(p.x,p.y,key)
        .setOrigin(.5,.5).setScale(width/source.width).setAlpha(alpha).setDepth(groundDepth);
      sprite.setData?.('aetherRenderClass','ground-decal');
      sprite.setData?.('youngWolfAftermathBlood',true);
      blood.push(sprite);
      return sprite;
    };
    // Pequena quantidade: a poça principal fica sob o tronco e uma segunda
    // mancha rompe a simetria sem transformar o primeiro combate em gore.
    place('road_blood_pool_01',0,0,54,.72);
    place('road_blood_pool_02',.08,-.04,29,.56);
    return blood;
  }

  beginYoungWolfAftermath(enemy){
    const record=this.state.aftermath.youngWolf;
    record.active=true;
    record.u=enemy.iso.u;
    record.v=enemy.iso.v;
    record.deathGameMs=this.worldGameMs();
    record.corpseGone=false;
    record.bloodGone=false;
    enemy.body?.setVelocity?.(0,0);
    if(enemy.body)enemy.body.enable=false;
    enemy.setUiVisible(false);
    enemy.setAlpha(1).setTint(0xffffff);
    enemy.setData?.('youngWolfAftermathCorpse',true);
    this.wolfAftermathVisual={corpse:enemy,blood:this.createYoungWolfBlood(record.u,record.v),corpseFading:false,bloodFading:false};
  }

  restoreYoungWolfAftermath(){
    const record=this.state?.aftermath?.youngWolf;
    if(!record?.active||!Number.isFinite(record.u)||!Number.isFinite(record.v))return;
    const visual={corpse:null,blood:[],corpseFading:false,bloodFading:false};
    if(!record.corpseGone&&this.scene.textures.exists('prologue_young_wolf')){
      const p=this.scene.project(record.u,record.v);
      visual.corpse=this.scene.add.sprite(p.x,p.y,'prologue_young_wolf',5)
        .setOrigin(.5,YOUNG_WOLF_DEATH_USEFUL_BOTTOM/PROLOGUE_LEGACY_REACTION_FRAME_HEIGHT)
        .setScale(this.youngWolfCorpseScale())
        .setDepth(this.scene.depthAt(record.u,record.v,.16));
      visual.corpse.setData?.('youngWolfAftermathCorpse',true);
    }
    if(!record.bloodGone)visual.blood=this.createYoungWolfBlood(record.u,record.v);
    this.wolfAftermathVisual=visual;
    this.updateYoungWolfAftermath();
  }

  updateYoungWolfAftermath(){
    const record=this.state?.aftermath?.youngWolf;
    const visual=this.wolfAftermathVisual;
    if(!record?.active||!visual||!Number.isFinite(record.deathGameMs))return;
    const elapsed=Math.max(0,this.worldGameMs()-record.deathGameMs);
    const corpse=visual.corpse;
    const blood=visual.blood||[];

    // Envelhecimento contínuo, sem saltos visuais de uma etapa para outra.
    // Não usamos os esqueletos humanos já existentes no prólogo para representar
    // um lobo: a decomposição é sugerida por perda gradual de cor/contraste.
    let corpseTint=0xffffff,corpseAlpha=1,bloodTint=0xffffff;
    let bloodAlphaMain=.72,bloodAlphaSecondary=.56;
    if(elapsed>=YOUNG_WOLF_AFTER_MATH.freshGameMs&&elapsed<YOUNG_WOLF_AFTER_MATH.agedGameMs){
      const t=(elapsed-YOUNG_WOLF_AFTER_MATH.freshGameMs)/(YOUNG_WOLF_AFTER_MATH.agedGameMs-YOUNG_WOLF_AFTER_MATH.freshGameMs);
      corpseTint=mixHexColor(0xffffff,0xb49b84,t);corpseAlpha=1-(.08*t);
      bloodTint=mixHexColor(0xffffff,0x8a4540,t);bloodAlphaMain=.72-(.18*t);bloodAlphaSecondary=.56-(.16*t);
    }else if(elapsed>=YOUNG_WOLF_AFTER_MATH.agedGameMs){
      const t=clamp01((elapsed-YOUNG_WOLF_AFTER_MATH.agedGameMs)/(YOUNG_WOLF_AFTER_MATH.corpseCleanupGameMs-YOUNG_WOLF_AFTER_MATH.agedGameMs));
      corpseTint=mixHexColor(0xb49b84,0x75695d,t);corpseAlpha=.92-(.20*t);
      bloodTint=mixHexColor(0x8a4540,0x633632,t);bloodAlphaMain=.54-(.20*t);bloodAlphaSecondary=.40-(.16*t);
    }
    corpse?.setTint?.(corpseTint).setAlpha?.(corpseAlpha);
    blood.forEach((sprite,index)=>sprite?.setTint?.(bloodTint).setAlpha?.(index===0?bloodAlphaMain:bloodAlphaSecondary));

    const playerDistance=Math.hypot(this.scene.player.isoX-record.u,this.scene.player.isoY-record.v);
    if(!record.corpseGone&&corpse&&!visual.corpseFading
      &&elapsed>=YOUNG_WOLF_AFTER_MATH.corpseCleanupGameMs
      &&playerDistance>=YOUNG_WOLF_AFTER_MATH.cleanupDistance){
      visual.corpseFading=true;
      this.scene.tweens.add({targets:corpse,alpha:0,duration:7000,ease:'Sine.InOut',onComplete:()=>{
        corpse?.destroy?.();visual.corpse=null;record.corpseGone=true;visual.corpseFading=false;this.save();
      }});
    }

    if(!record.bloodGone&&blood.length&&!visual.bloodFading
      &&elapsed>=YOUNG_WOLF_AFTER_MATH.bloodCleanupGameMs
      &&playerDistance>=YOUNG_WOLF_AFTER_MATH.cleanupDistance){
      visual.bloodFading=true;
      this.scene.tweens.add({targets:blood,alpha:0,duration:9000,ease:'Sine.InOut',onComplete:()=>{
        blood.forEach(sprite=>sprite?.destroy?.());visual.blood=[];record.bloodGone=true;visual.bloodFading=false;
        if(record.corpseGone)record.active=false;this.save();
      }});
    }
  }


  goblinCorpseScale(){
    const directionalScale=GOBLIN_FRAME_TARGET_HEIGHT/256;
    const liveProfileWidth=GOBLIN_DIRECTIONAL_PROFILE_WIDTH*directionalScale;
    return (liveProfileWidth*GOBLIN_CORPSE_LENGTH_FACTOR)/GOBLIN_DEATH_USEFUL_WIDTH;
  }

  createGoblinScoutBlood(u,v,index=0){
    const blood=[];
    const groundDepth=this.scene.aetherTerritory?.groundDepth?.(-69.62)??this.scene.depthAt(u,v,-69.62);
    const place=(key,du,dv,width,alpha,angle=0)=>{
      if(!this.scene.textures.exists(key))return null;
      const p=this.scene.project(u+du,v+dv);
      const source=this.scene.textures.get(key).getSourceImage();
      const sprite=this.scene.add.image(p.x,p.y,key)
        .setOrigin(.5,.5).setScale(width/source.width).setAngle(angle).setAlpha(alpha).setDepth(groundDepth);
      sprite.setData?.('aetherRenderClass','ground-decal');
      sprite.setData?.('goblinScoutAftermathBlood',index);
      blood.push(sprite);
      return sprite;
    };
    // Um pouco mais evidente que o sangue do Lobo Jovem, mas ainda contido.
    // Pequenas assimetrias por índice impedem que os dois aftermaths pareçam clones.
    const side=index===0?1:-1;
    place('road_blood_pool_03',0,0,66,.76,index===0?-7:6);
    place('road_blood_pool_01',.10*side,-.05,34,.52,index===0?11:-10);
    return blood;
  }

  beginGoblinScoutAftermath(enemy,index){
    const record=this.state.aftermath.goblinScouts[index];
    if(!record)return;
    record.active=true;
    record.u=enemy.iso.u;
    record.v=enemy.iso.v;
    record.deathGameMs=this.worldGameMs();
    record.corpseGone=false;
    record.bloodGone=false;
    enemy.body?.setVelocity?.(0,0);
    if(enemy.body)enemy.body.enable=false;
    enemy.setUiVisible(false);
    enemy.setAlpha(1).setTint(0xffffff);
    enemy.setData?.('goblinScoutAftermathCorpse',index);
    this.goblinAftermathVisuals[index]={
      corpse:enemy,
      blood:this.createGoblinScoutBlood(record.u,record.v,index),
      corpseFading:false,
      bloodFading:false
    };
  }

  restoreGoblinScoutAftermaths(){
    const records=this.state?.aftermath?.goblinScouts;
    if(!Array.isArray(records))return;
    for(let index=0;index<2;index++){
      const record=records[index];
      if(!record?.active||!Number.isFinite(record.u)||!Number.isFinite(record.v))continue;
      const visual={corpse:null,blood:[],corpseFading:false,bloodFading:false};
      if(!record.corpseGone&&this.scene.textures.exists('prologue_goblin_scout')){
        const p=this.scene.project(record.u,record.v);
        visual.corpse=this.scene.add.sprite(p.x,p.y,'prologue_goblin_scout',5)
          .setOrigin(.5,GOBLIN_DEATH_USEFUL_BOTTOM/PROLOGUE_LEGACY_REACTION_FRAME_HEIGHT)
          .setScale(this.goblinCorpseScale())
          .setDepth(this.scene.depthAt(record.u,record.v,.16));
        visual.corpse.setData?.('goblinScoutAftermathCorpse',index);
      }
      if(!record.bloodGone)visual.blood=this.createGoblinScoutBlood(record.u,record.v,index);
      this.goblinAftermathVisuals[index]=visual;
    }
    this.updateGoblinScoutAftermaths();
  }

  updateGoblinScoutAftermaths(){
    const records=this.state?.aftermath?.goblinScouts;
    if(!Array.isArray(records))return;
    for(let index=0;index<2;index++){
      const record=records[index],visual=this.goblinAftermathVisuals?.[index];
      if(!record?.active||!visual||!Number.isFinite(record.deathGameMs))continue;
      const elapsed=Math.max(0,this.worldGameMs()-record.deathGameMs);
      const corpse=visual.corpse,blood=visual.blood||[];

      let corpseTint=0xffffff,corpseAlpha=1,bloodTint=0xffffff;
      let bloodAlphaMain=.76,bloodAlphaSecondary=.52;
      if(elapsed>=GOBLIN_AFTER_MATH.freshGameMs&&elapsed<GOBLIN_AFTER_MATH.agedGameMs){
        const t=(elapsed-GOBLIN_AFTER_MATH.freshGameMs)/(GOBLIN_AFTER_MATH.agedGameMs-GOBLIN_AFTER_MATH.freshGameMs);
        corpseTint=mixHexColor(0xffffff,0xa8927b,t);corpseAlpha=1-(.08*t);
        bloodTint=mixHexColor(0xffffff,0x82403a,t);bloodAlphaMain=.76-(.20*t);bloodAlphaSecondary=.52-(.14*t);
      }else if(elapsed>=GOBLIN_AFTER_MATH.agedGameMs){
        const t=clamp01((elapsed-GOBLIN_AFTER_MATH.agedGameMs)/(GOBLIN_AFTER_MATH.corpseCleanupGameMs-GOBLIN_AFTER_MATH.agedGameMs));
        corpseTint=mixHexColor(0xa8927b,0x6f6559,t);corpseAlpha=.92-(.20*t);
        bloodTint=mixHexColor(0x82403a,0x58322f,t);bloodAlphaMain=.56-(.22*t);bloodAlphaSecondary=.38-(.16*t);
      }
      corpse?.setTint?.(corpseTint).setAlpha?.(corpseAlpha);
      blood.forEach((sprite,bloodIndex)=>sprite?.setTint?.(bloodTint).setAlpha?.(bloodIndex===0?bloodAlphaMain:bloodAlphaSecondary));

      const playerDistance=Math.hypot(this.scene.player.isoX-record.u,this.scene.player.isoY-record.v);
      if(!record.corpseGone&&corpse&&!visual.corpseFading
        &&elapsed>=GOBLIN_AFTER_MATH.corpseCleanupGameMs
        &&playerDistance>=GOBLIN_AFTER_MATH.cleanupDistance){
        visual.corpseFading=true;
        this.scene.tweens.add({targets:corpse,alpha:0,duration:7000,ease:'Sine.InOut',onComplete:()=>{
          corpse?.destroy?.();visual.corpse=null;record.corpseGone=true;visual.corpseFading=false;this.save();
        }});
      }

      if(!record.bloodGone&&blood.length&&!visual.bloodFading
        &&elapsed>=GOBLIN_AFTER_MATH.bloodCleanupGameMs
        &&playerDistance>=GOBLIN_AFTER_MATH.cleanupDistance){
        visual.bloodFading=true;
        this.scene.tweens.add({targets:blood,alpha:0,duration:9000,ease:'Sine.InOut',onComplete:()=>{
          blood.forEach(sprite=>sprite?.destroy?.());visual.blood=[];record.bloodGone=true;visual.bloodFading=false;
          if(record.corpseGone)record.active=false;this.save();
        }});
      }
    }
  }

  createCollectible(){
    if(this.state.tutorials.collectionComplete||!this.scene.textures.exists('street_crates'))return;
    const a=this.anchors.travelSupplies,p=this.scene.project(a.u,a.v),source=this.scene.textures.get('street_crates').getSourceImage();
    this.collectible=this.scene.add.image(p.x,p.y,'street_crates').setOrigin(.5,1).setScale(72/source.height).setDepth(this.scene.depthAt(a.u,a.v,.08));
    // O mesmo caixote permanece no local atual, mas só aparece depois da linha rosa.
    this.collectible.setVisible(this.isAt(OLD_AETHER_PROLOGUE_STAGES.COLLECT_TRAVEL_SUPPLIES));
    // O caixote permanece fixo na âncora do mapa, sem animação de flutuação.
  }

  syncObjective(){
    if(this.isAt(OLD_AETHER_PROLOGUE_STAGES.ARRIVAL_ON_OLD_ROAD))this.hud?.setObjective('');
    else if(this.isAt(OLD_AETHER_PROLOGUE_STAGES.EXAMINE_ROAD_SIGN))this.hud?.setObjective('Investigue a Placa');
    else if(this.isAt(OLD_AETHER_PROLOGUE_STAGES.FOLLOW_OLD_ROAD))this.hud?.setObjective('Siga a Estrada');
    else if(this.isAt(OLD_AETHER_PROLOGUE_STAGES.WOLF_ENTRANCE))this.hud?.setObjective('Siga a Estrada');
    else if(this.isAt(OLD_AETHER_PROLOGUE_STAGES.DEFEAT_YOUNG_WOLF))this.hud?.setObjective('Enfrente o Jovem Lobo');
    else if(this.isAt(OLD_AETHER_PROLOGUE_STAGES.EXAMINE_RUINED_WAYSTONE))this.hud?.setObjective('Investigue o monumento destruído');
    else if(this.isAt(OLD_AETHER_PROLOGUE_STAGES.FOLLOW_ROAD_AFTER_WAYSTONE))this.hud?.setObjective('Siga a Estrada');
    else if(this.isAt(OLD_AETHER_PROLOGUE_STAGES.COLLECT_TRAVEL_SUPPLIES,OLD_AETHER_PROLOGUE_STAGES.POTION_HINT_PENDING))this.hud?.setObjective('Colete os Suprimentos');
    else if(this.isAt(OLD_AETHER_PROLOGUE_STAGES.INVESTIGATE_ROAD_BLOOD,OLD_AETHER_PROLOGUE_STAGES.BLOOD_SCENE_WAIT_MOVEMENT))this.hud?.setObjective('Investigue o sangue na estrada');
    else if(this.isAt(OLD_AETHER_PROLOGUE_STAGES.RETURN_TO_ROAD_FACE_GOBLINS))this.hud?.setObjective('Volte para a Estrada e enfrente os Goblins');
    else if(this.isAt(OLD_AETHER_PROLOGUE_STAGES.DEFEAT_GOBLIN_SCOUTS))this.hud?.setObjective('Enfrente os Goblins Batedores');
    else if(this.isAt(OLD_AETHER_PROLOGUE_STAGES.EXAMINE_ATTACKED_WAGON))this.hud?.setObjective('Investigue a Carroça Abandonada');
    else if(this.state.completed)this.hud?.setObjective('Fale com o General.');
    else if(this.state.tavern.introCompleted)this.hud?.setObjective('Procure informações na praça.');
    else this.hud?.setObjective('Encontre abrigo em Aether.');
  }

  // Round 79.22 — prompts narrativos são medidos no plano do CHÃO. O ponto
  // autoritativo vem do perfil físico do prop e o jogador usa o centro de sua
  // pegada lógica, nunca o centro visual do sprite. Isso evita o F aparecer ao
  // simplesmente passar ao lado de placas/monumentos altos.
  narrativeProp(role){
    return this.scene.aetherTerritory?.oldRoadProps?.props?.find(prop=>prop.role===role)??null;
  }
  roadSignSprite(){return this.narrativeProp('start-sign')?.sprite??null;}
  isNearNarrativeProp(role){
    const prop=this.narrativeProp(role),sprite=prop?.sprite,physical=prop?.physical;
    if(!sprite?.active||!physical?.interaction)return false;
    const player=this.scene.player;
    const foot=player.getLogicalFootprintAt?.(player.x,player.y)??{x:player.x,y:player.y-8};
    const parts=Array.isArray(physical.interaction.parts)&&physical.interaction.parts.length
      ?physical.interaction.parts
      :[{offsetX:0,offsetY:0,radiusX:physical.interaction.radiusX,radiusY:physical.interaction.radiusY}];
    return parts.some(part=>{
      const rx=Math.max(1,part.radiusX??physical.interaction.radiusX??1);
      const ry=Math.max(1,part.radiusY??physical.interaction.radiusY??1);
      const cx=physical.groundX+(part.offsetX??0),cy=physical.groundY+(part.offsetY??0);
      const dx=(foot.x-cx)/rx,dy=(foot.y-cy)/ry;
      return dx*dx+dy*dy<=1;
    });
  }
  nearRoadSign(){return this.isNearNarrativeProp('start-sign');}
  distanceTo(anchor){return Math.hypot(this.scene.player.isoX-anchor.u,this.scene.player.isoY-anchor.v);}
  isNear(anchor,radius=1.12){return this.distanceTo(anchor)<=radius;}
  nearNpc(npc,range=96){return !!npc&&Phaser.Math.Distance.Between(this.scene.player.x,this.scene.player.y,npc.x,npc.y)<=range;}

  update(time,delta){
    if(!this.enabled)return;
    if(this.scene.dialogueOpen){this.cue?.hide();return;}
    this.updateTutorials();
    this.refreshOldRoadAftermath();
    this.updateCollectible();
    this.ensureScriptedActors();
    this.updateWolfEntrance(delta);
    this.updateEnemies(time,delta);
    this.resolveEnemyDeaths(time);
    this.updateYoungWolfAftermath();
    this.updateGoblinScoutAftermaths();
    this.updateProgressTriggers();
    this.updateCue();
  }

  onPlayerMoved(){
    // Somente o primeiro deslocamento real revela mensagem e objetivo juntos;
    // uma tecla pressionada contra colisao nao dispara a transicao.
    if(!this.enabled)return;
    if(this.wolfDefeatHintPendingMovement){
      this.wolfDefeatHintPendingMovement=false;
      this.hud?.hideHint();
    }
    if(this.potionHintPendingMovement){
      this.dismissPotionHint();
    }
    // A mensagem dura NO MÍNIMO cinco segundos; após liberar o movimento,
    // somente um deslocamento efetivo a encerra e atualiza o Quest Tracker.
    if(this.isAt(OLD_AETHER_PROLOGUE_STAGES.BLOOD_SCENE_WAIT_MOVEMENT)&&!this.isBloodSceneMovementLocked()){
      this.hud?.hideHint();
      this.advance(OLD_AETHER_PROLOGUE_STAGES.BLOOD_SCENE_WAIT_MOVEMENT,
        OLD_AETHER_PROLOGUE_STAGES.RETURN_TO_ROAD_FACE_GOBLINS,()=>{
          this.state.tutorials.bloodSceneMessageDismissed=true;
        });
    }
    if(this.movementHintPending){
      this.movementHintPending=false;
      this.hud?.hideHint();
    }
    if(this.isAt(OLD_AETHER_PROLOGUE_STAGES.ARRIVAL_ON_OLD_ROAD)){
      if(this.advance(OLD_AETHER_PROLOGUE_STAGES.ARRIVAL_ON_OLD_ROAD,OLD_AETHER_PROLOGUE_STAGES.EXAMINE_ROAD_SIGN,()=>{this.state.tutorials.movementComplete=true;})){
        this.hud?.hint('A estrada segue para o norte. Uma placa antiga parece legível.');
      }
    }
  }

  startBloodSceneMessage(){
    this.bloodSceneLockedUntil=this.scene.time.now+5000;
    this.hud?.hint('Uma caravana foi atacada aqui. Os viajantes não sobreviveram. Pelas marcas deixadas no local, isso parece ter sido obra de goblins.',{persistent:true});
  }

  isBloodSceneMovementLocked(){
    return this.enabled&&this.isAt(OLD_AETHER_PROLOGUE_STAGES.BLOOD_SCENE_WAIT_MOVEMENT)
      &&this.scene.time.now<this.bloodSceneLockedUntil;
  }

  showPotionHint(){
    this.hud?.hint('Você encontrou uma Poção de HP! Aperte H para usar a poção e recuperar vida.',{persistent:true});
  }

  dismissPotionHint(){
    if(!this.isAt(OLD_AETHER_PROLOGUE_STAGES.POTION_HINT_PENDING))return false;
    this.potionHintPendingMovement=false;
    this.hud?.hideHint();
    return this.advance(OLD_AETHER_PROLOGUE_STAGES.POTION_HINT_PENDING,
      OLD_AETHER_PROLOGUE_STAGES.INVESTIGATE_ROAD_BLOOD,()=>{
        this.state.tutorials.potionHintDismissed=true;
      });
  }

  onHealingPotionUsed(){
    // O H precisa CONSUMIR uma poção; teclas sem item não dispensam a mensagem.
    if(this.potionHintPendingMovement)this.dismissPotionHint();
  }

  updateTutorials(){
    // A transicao de chegada ocorre em onPlayerMoved, nao por distancia do spawn.
  }

  updateCollectible(){
    if(this.collectible?.active)this.collectible.setVisible(this.isAt(OLD_AETHER_PROLOGUE_STAGES.COLLECT_TRAVEL_SUPPLIES)&&!this.state.tutorials.collectionComplete);
  }

  ensureScriptedActors(){
    if(this.isAt(OLD_AETHER_PROLOGUE_STAGES.WOLF_ENTRANCE)&&this.state.encounters.youngWolf==='pending'&&!this.wolf)this.spawnWolfEntrance();
    // Compatibilidade com partidas antigas, que já chegaram ao combate após a coleta.
    if(this.isAt(OLD_AETHER_PROLOGUE_STAGES.DEFEAT_YOUNG_WOLF)&&this.state.encounters.youngWolf==='pending'&&!this.wolf)this.spawnWolf();
    if(this.isAt(OLD_AETHER_PROLOGUE_STAGES.DEFEAT_GOBLIN_SCOUTS)&&!this.state.encounters.goblinScoutsCompleted)this.spawnGoblinScouts();
    if(this.isAt(OLD_AETHER_PROLOGUE_STAGES.SPEAK_TO_PATROL)&&!this.patrol)this.spawnPatrol();
  }

  ruinedRoadWaystone(){return this.narrativeProp('ruined-waystone')?.sprite??null;}

  roadPoint(fraction){
    return this.scene.aetherTerritory?.oldRoadProps?.roadPoint(fraction)??null;
  }

  isWolfEntranceActive(){return this.enabled&&this.isAt(OLD_AETHER_PROLOGUE_STAGES.WOLF_ENTRANCE);}

  // O lobo começa atrás da pedra, contorna a extremidade ESQUERDA e só então
  // desce até a estrada. A largura visível do sprite define a folga lateral:
  // não usar um ponto intermediário dentro da base do monumento.
  wolfEntrancePath(){
    const monument=this.ruinedRoadWaystone();
    if(!monument?.active)return null;
    const destination=this.roadPoint(.292);
    if(!destination)return null;
    const source=this.scene.textures.get(monument.texture.key).getSourceImage();
    const leftClearance=Math.max(145,source.width*monument.scaleX/2+48);
    const aroundX=monument.x-leftClearance;
    return [
      // Primeiro trecho: ainda oculto pela pedra, saindo por trás dela.
      {x:monument.x-29,y:monument.y-113},
      // O segundo trecho só começa quando já saiu completamente pela lateral.
      {x:aroundX,y:monument.y-113},
      {x:aroundX,y:monument.y-18},
      // Atravessa a faixa de grama junto à estrada, longe da base do marco.
      {x:aroundX,y:monument.y+48},
      {x:destination.x,y:destination.y}
    ];
  }

  spawnWolfEntrance(){
    const path=this.wolfEntrancePath();
    if(!path)return;
    const a=this.scene.aetherTerritory.screenToLogical(path[0].x,path[0].y);
    this.wolf=this.spawnEnemy({id:'youngWolf',kind:'wolf',name:'Lobo Jovem',texture:'prologue_young_wolf_8dir',u:a.u,v:a.v,height:YOUNG_WOLF_FRAME_TARGET_HEIGHT,hp:38,speed:.67,attack:6,xp:18,aggro:3.5,footprint:21,patrol:.22,attackDelay:250,uiLift:YOUNG_WOLF_UI.lift,uiNameOffset:YOUNG_WOLF_UI.nameOffset});
    if(!this.wolf)return;
    this.wolfEntrance={path,segment:0};
    this.wolf.setUiVisible(false);
    this.hud?.hint('Um Lobo Jovem surge atrás do monumento destruído! Prepare-se para atacar!',{persistent:true});
  }

  updateWolfEntrance(delta){
    if(!this.isWolfEntranceActive()||!this.wolf?.active||!this.wolfEntrance)return;
    const intro=this.wolfEntrance,wolf=this.wolf,segment=intro.segment;
    const target=intro.path[segment+1];
    if(!target){this.finishWolfEntrance();return;}
    const from=this.scene.project(wolf.iso.u,wolf.iso.v);
    const distance=Phaser.Math.Distance.Between(from.x,from.y,target.x,target.y);
    const step=120*Math.min(.05,Math.max(0,delta||0)/1000);
    const ratio=distance>0?Math.min(1,step/distance):1;
    const x=from.x+(target.x-from.x)*ratio,y=from.y+(target.y-from.y)*ratio;
    const logical=this.scene.aetherTerritory.screenToLogical(x,y);
    this.updateEnemyFacing(wolf,logical.u-wolf.iso.u,logical.v-wolf.iso.v);
    wolf.iso.u=logical.u;wolf.iso.v=logical.v;
    this.playEnemyAnimation(wolf,'walk');
    this.syncEnemyVisual(wolf);
    // Durante a saída por trás do marco, o lobo passa ATRÁS da pedra.
    // A partir da lateral livre, volta à profundidade normal do mundo.
    const monument=this.ruinedRoadWaystone();
    if(segment===0&&monument?.active)wolf.setDepth(monument.depth-.01);
    if(ratio===1){
      intro.segment++;
      if(intro.segment>=intro.path.length-1)this.finishWolfEntrance();
    }
  }

  finishWolfEntrance(){
    const wolf=this.wolf;
    if(!wolf?.active)return;
    this.wolfEntrance=null;
    wolf.iso.originU=wolf.iso.u;wolf.iso.originV=wolf.iso.v;
    this.syncEnemyVisual(wolf);
    this.playEnemyAnimation(wolf,'idle');
    wolf.setUiVisible(true);
    this.hud?.hideHint();
    this.advance(OLD_AETHER_PROLOGUE_STAGES.WOLF_ENTRANCE,OLD_AETHER_PROLOGUE_STAGES.DEFEAT_YOUNG_WOLF,()=>{
      this.state.encounters.youngWolfIntroComplete=true;
    });
  }

  spawnWolf(){
    const a=this.anchors.youngWolf;
    this.wolf=this.spawnEnemy({id:'youngWolf',kind:'wolf',name:'Lobo Jovem',texture:'prologue_young_wolf_8dir',u:a.u,v:a.v,height:YOUNG_WOLF_FRAME_TARGET_HEIGHT,hp:38,speed:.67,attack:6,xp:18,aggro:3.5,footprint:21,patrol:.22,attackDelay:250,uiLift:YOUNG_WOLF_UI.lift,uiNameOffset:YOUNG_WOLF_UI.nameOffset});
    // Entradas já concluídas (incluindo saves) voltam diretamente ao combate.
    this.hud?.hint('Enfrente o Lobo Jovem. Use o ataque básico para se defender.');
  }

  spawnGoblinScouts(){
    this.anchors.goblinScouts.forEach((a,index)=>{
      if(this.state.encounters.goblinScouts[index]!=='pending'||this.goblinScouts?.[index])return;
      const enemy=this.spawnEnemy({id:`goblinScout${index}`,kind:'goblin',name:'Goblin Batedor',texture:'prologue_goblin_scout_8dir',u:a.u,v:a.v,height:GOBLIN_FRAME_TARGET_HEIGHT,hp:34,speed:.58,attack:5,xp:15,aggro:4.2,footprint:19,patrol:.44,phase:index*Math.PI,attackDelay:280,uiLift:GOBLIN_UI.lift,uiNameOffset:GOBLIN_UI.nameOffset});
      this.goblinScouts??=[];this.goblinScouts[index]=enemy;
    });
    if(this.goblinScouts?.some(Boolean)&&!this.state.goblinCueShown){this.state.goblinCueShown=true;this.hud?.hint('Dois goblins batedores revistam a estrada.');}
  }

  spawnEnemy(config){
    if(!this.scene.textures.exists(config.texture))return null;
    const p=this.scene.project(config.u,config.v);
    const enemy=new Enemy(this.scene,p.x,p.y,config.name,{hp:config.hp,speed:58,attackDamage:config.attack,aggroRange:190,xpReward:config.xp,attackCooldown:1050,scale:1,tint:0xffffff});
    const frame=this.scene.textures.get(config.texture).get(0);
    enemy.setTexture(config.texture,0).setOrigin(.5,1).clearTint();
    enemy.setScale(config.height/(frame?.height||1)).setDepth(this.scene.depthAt(config.u,config.v,.16));
    enemy.directionalScale=config.height/(frame?.height||1);
    enemy.directionalOriginY=1;
    enemy.hitScale=config.height/PROLOGUE_LEGACY_REACTION_FRAME_HEIGHT;
    enemy.deathScale=config.height/PROLOGUE_LEGACY_REACTION_FRAME_HEIGHT;
    enemy.hitOriginY=1;
    enemy.deathOriginY=1;

    if(config.kind==='wolf'){
      // A arte 8-dir e a folha antiga de reação têm envelopes transparentes
      // muito diferentes. Igualar pelo tamanho total do frame fazia o cadáver
      // encolher. Aqui a referência é a largura CORPORAL útil do perfil vivo.
      const liveProfileWidth=YOUNG_WOLF_DIRECTIONAL_PROFILE_WIDTH*enemy.directionalScale;
      enemy.deathScale=liveProfileWidth/YOUNG_WOLF_DEATH_USEFUL_WIDTH;
      enemy.directionalOriginY=YOUNG_WOLF_DIRECTIONAL_USEFUL_BOTTOM/(frame?.height||256);
      enemy.deathOriginY=YOUNG_WOLF_DEATH_USEFUL_BOTTOM/PROLOGUE_LEGACY_REACTION_FRAME_HEIGHT;
      enemy.setOrigin(.5,enemy.directionalOriginY);
    }
    if(config.kind==='goblin'){
      // Ancoragem pelos pés reais do atlas 8-dir. O corpse usa a largura útil
      // do corpo vivo como referência para não encolher ao trocar de sheet.
      enemy.directionalOriginY=GOBLIN_DIRECTIONAL_USEFUL_BOTTOM/(frame?.height||256);
      const liveProfileWidth=GOBLIN_DIRECTIONAL_PROFILE_WIDTH*enemy.directionalScale;
      enemy.deathScale=(liveProfileWidth*GOBLIN_CORPSE_LENGTH_FACTOR)/GOBLIN_DEATH_USEFUL_WIDTH;
      enemy.deathOriginY=GOBLIN_DEATH_USEFUL_BOTTOM/PROLOGUE_LEGACY_REACTION_FRAME_HEIGHT;
      enemy.hitScale=enemy.directionalScale;
      enemy.hitOriginY=enemy.directionalOriginY;
      enemy.setOrigin(.5,enemy.directionalOriginY);
    }
    enemy.originalTint=0xffffff;enemy.suppressLoot=true;enemy.prologue=config;
    enemy.iso={u:config.u,v:config.v,originU:config.u,originV:config.v};
    enemy.animState='idle';enemy.activeAnimationKey='';enemy.facingDirection='s';enemy.attackPendingAt=0;enemy.attackEndsAt=0;enemy.deathAnimationEndsAt=0;
    enemy.body?.setAllowGravity(false).setVelocity(0,0);
    enemy.hpBg?.setVisible(true);enemy.hpFill?.setVisible(true);enemy.nameText?.setVisible(true);
    if(config.kind==='wolf')this.applyYoungWolfUiStyle(enemy);
    if(config.kind==='goblin')this.applyGoblinScoutUiStyle(enemy);
    const baseTakeDamage=enemy.takeDamage.bind(enemy);
    enemy.takeDamage=(amount)=>{
      if(enemy===this.wolf&&this.isWolfEntranceActive())return;
      if(!enemy.isAlive())return;
      baseTakeDamage(amount);
      enemy.attackPendingAt=0;
      if(enemy.isAlive())this.playEnemyAnimation(enemy,'hit');
      else{
        enemy.setAlpha(1).setUiVisible(false);
        this.playEnemyAnimation(enemy,'death');
        enemy.deathAnimationEndsAt=this.scene.time.now+650;
      }
    };
    this.playEnemyAnimation(enemy,'idle');
    this.enemies.push(enemy);
    return enemy;
  }

  applyYoungWolfUiStyle(enemy){
    // UI dedicada ao primeiro lobo, refinada no Round 79.21.
    const frame=this.scene.add.rectangle(
      enemy.x,enemy.y-YOUNG_WOLF_UI.lift,
      YOUNG_WOLF_UI.frameWidth,YOUNG_WOLF_UI.frameHeight,
      0x0b0908,.94
    ).setOrigin(.5).setStrokeStyle(1,0xb08a50,.98).setDepth(enemy.depth+.415);

    enemy.prologueUiFrame=frame;
    enemy.hpBg?.setFillStyle(0x241713,.98);
    enemy.hpFill?.setFillStyle(0xb43a32,1).setScale(1,.72);
    enemy.nameText?.setStyle({
      fontFamily:'Georgia, Times New Roman, serif',
      fontSize:'12px',
      color:'#ead7a7',
      backgroundColor:'rgba(0,0,0,0)',
      stroke:'#17110d',
      strokeThickness:3,
      padding:{left:2,right:2,top:1,bottom:1},
      shadow:{offsetX:0,offsetY:2,color:'#000000',blur:1,stroke:true,fill:true}
    });

    const baseSetUiVisible=enemy.setUiVisible.bind(enemy);
    enemy.setUiVisible=(visible)=>{
      baseSetUiVisible(visible);
      frame.setVisible(visible);
    };

    const baseDestroy=enemy.destroy.bind(enemy);
    enemy.destroy=(fromScene)=>{
      if(frame.active)frame.destroy();
      enemy.prologueUiFrame=null;
      baseDestroy(fromScene);
    };
  }


  applyGoblinScoutUiStyle(enemy){
    // Mesma família visual da UI do Lobo Jovem: bronze escurecido, vermelho
    // sóbrio e tipografia serifada. Mantém escala ligeiramente mais compacta
    // para diferenciar inimigo comum de encontro principal do prólogo.
    const frame=this.scene.add.rectangle(
      enemy.x,enemy.y-GOBLIN_UI.lift,
      GOBLIN_UI.frameWidth,GOBLIN_UI.frameHeight,
      0x0b0908,.94
    ).setOrigin(.5).setStrokeStyle(1,0xa98249,.96).setDepth(enemy.depth+.415);

    enemy.prologueUiFrame=frame;
    enemy.hpBg?.setFillStyle(0x241713,.98);
    enemy.hpFill?.setFillStyle(0xaa3932,1).setScale(1,.68);
    enemy.nameText?.setStyle({
      fontFamily:'Georgia, Times New Roman, serif',
      fontSize:'11px',
      color:'#e5d2a1',
      backgroundColor:'rgba(0,0,0,0)',
      stroke:'#17110d',
      strokeThickness:3,
      padding:{left:2,right:2,top:1,bottom:1},
      shadow:{offsetX:0,offsetY:2,color:'#000000',blur:1,stroke:true,fill:true}
    });

    const baseSetUiVisible=enemy.setUiVisible.bind(enemy);
    enemy.setUiVisible=(visible)=>{
      baseSetUiVisible(visible);
      frame.setVisible(visible);
    };

    const baseDestroy=enemy.destroy.bind(enemy);
    enemy.destroy=(fromScene)=>{
      if(frame.active)frame.destroy();
      enemy.prologueUiFrame=null;
      baseDestroy(fromScene);
    };
  }

  updateEnemyFacing(enemy,du,dv){
    const screenDx=(du-dv)*ISO_CONFIG.tileWidth/2;
    const screenDy=(du+dv)*ISO_CONFIG.tileHeight/2;
    enemy.facingDirection=enemyDirectionFromScreenDelta(screenDx,screenDy,enemy.facingDirection||'s');
    return enemy.facingDirection;
  }

  playEnemyAnimation(enemy,state){
    if(!enemy?.active)return;
    const prefix=enemy.prologue.kind==='wolf'?'prologue-wolf':'prologue-goblin';
    const directionalHit=state==='hit'&&(enemy.prologue.kind==='wolf'||enemy.prologue.kind==='goblin');
    const directional=state==='idle'||state==='walk'||state==='attack'||directionalHit;
    const key=directionalHit
      ?`${prefix}-idle-${enemy.facingDirection||'s'}`
      :directional
        ?`${prefix}-${state}-${enemy.facingDirection||'s'}`
        :`${prefix}-${state}`;
    if(!this.scene.anims.exists(key))return;
    if(enemy.animState===state&&enemy.activeAnimationKey===key)return;
    enemy.animState=state;
    enemy.activeAnimationKey=key;
    if(directional){
      enemy.setScale(enemy.directionalScale).setOrigin(.5,enemy.directionalOriginY??1);
    }else if(state==='death'){
      enemy.setScale(enemy.deathScale).setOrigin(.5,enemy.deathOriginY??1);
    }else{
      enemy.setScale(enemy.hitScale).setOrigin(.5,enemy.hitOriginY??1);
    }
    enemy.setFlipX(false);
    enemy.play(key,true);
  }

  startEnemyAttack(enemy,time){
    if(enemy.attackPendingAt||time<enemy.nextAttack)return;
    enemy.nextAttack=time+enemy.attackCooldown;
    enemy.attackPendingAt=time+(enemy.prologue.attackDelay??250);
    enemy.attackEndsAt=time+520;
    this.playEnemyAnimation(enemy,'attack');
  }

  updateEnemies(time,delta){
    const seconds=Math.min(.05,Math.max(0,delta||0)/1000);
    for(const enemy of this.enemies){
      if(!enemy?.active||!enemy.isAlive())continue;
      // Não executar IA, patrulha ou ataques durante a entrada cinematográfica.
      if(enemy===this.wolf&&this.isWolfEntranceActive())continue;
      const data=enemy.prologue,iso=enemy.iso,player=this.scene.player;
      const du=player.isoX-iso.u,dv=player.isoY-iso.v,logicalDistance=Math.hypot(du,dv);
      const prior=this.scene.project(iso.u,iso.v);
      let targetU=iso.u,targetV=iso.v;
      if(enemy.attackPendingAt&&time>=enemy.attackPendingAt){
        enemy.attackPendingAt=0;
        const distanceAtImpact=Math.hypot(player.isoX-iso.u,player.isoY-iso.v);
        if(distanceAtImpact<=.88&&!player.isDead())player.takeDamage(data.attack);
      }
      if(enemy.attackEndsAt&&time>=enemy.attackEndsAt){enemy.attackEndsAt=0;if(enemy.isAlive())this.playEnemyAnimation(enemy,'idle');}
      if(!enemy.attackPendingAt&&!enemy.attackEndsAt){
        if(logicalDistance<=data.aggro&&logicalDistance>.74){
          targetU+=du/logicalDistance*data.speed*seconds;
          targetV+=dv/logicalDistance*data.speed*seconds;
          if(!this.scene.isBlocked(targetU,targetV,.18)){
            this.updateEnemyFacing(enemy,targetU-iso.u,targetV-iso.v);
            iso.u=targetU;iso.v=targetV;this.playEnemyAnimation(enemy,'walk');
          }
          else this.playEnemyAnimation(enemy,'idle');
        }else if(logicalDistance>data.aggro){
          const phase=time*.00115+(data.phase||0);
          targetU=iso.originU+Math.cos(phase)*data.patrol;
          targetV=iso.originV+Math.sin(phase*.82)*data.patrol;
          if(!this.scene.isBlocked(targetU,targetV,.18)){
            this.updateEnemyFacing(enemy,targetU-iso.u,targetV-iso.v);
            iso.u=targetU;iso.v=targetV;this.playEnemyAnimation(enemy,'walk');
          }
          else this.playEnemyAnimation(enemy,'idle');
        }else{
          this.updateEnemyFacing(enemy,du,dv);
          this.startEnemyAttack(enemy,time);
        }
      }
      const next=this.scene.project(iso.u,iso.v);
      this.syncEnemyVisual(enemy);
    }
  }

  syncEnemyVisual(enemy){
    const p=this.scene.project(enemy.iso.u,enemy.iso.v),depth=this.scene.depthAt(enemy.iso.u,enemy.iso.v,.16);
    enemy.setPosition(p.x,p.y).setDepth(depth);
    const uiLift=enemy.prologue?.uiLift??46;
    const uiNameOffset=enemy.prologue?.uiNameOffset??14;
    enemy.prologueUiFrame?.setPosition(p.x,p.y-uiLift).setDepth(depth+.415);
    enemy.hpBg?.setPosition(p.x,p.y-uiLift).setDepth(depth+.42);
    enemy.hpFill?.setPosition(p.x-27,p.y-uiLift).setDepth(depth+.43);
    enemy.nameText?.setPosition(p.x,p.y-uiLift-uiNameOffset).setDepth(depth+.44);
  }

  resolveEnemyDeaths(time){
    for(const enemy of this.enemies){
      if(!enemy?.active||enemy.isAlive())continue;
      if(!enemy.prologueResolved&&time<(enemy.deathAnimationEndsAt||0))continue;
      if(!enemy.prologueResolved){
        enemy.prologueResolved=true;
        const id=enemy.prologue.id;
        if(id==='youngWolf'){
          this.beginYoungWolfAftermath(enemy);
          this.advance(OLD_AETHER_PROLOGUE_STAGES.DEFEAT_YOUNG_WOLF,
            this.state.tutorials.collectionComplete?OLD_AETHER_PROLOGUE_STAGES.DEFEAT_GOBLIN_SCOUTS:OLD_AETHER_PROLOGUE_STAGES.EXAMINE_RUINED_WAYSTONE,
            ()=>{this.state.encounters.youngWolf='defeated';});
          this.wolfDefeatHintPendingMovement=true;
          this.hud?.hint(this.state.tutorials.collectionComplete?'Siga pela estrada.':'O lobo veio de trás do monumento. Investigue a pedra destruída.',{persistent:true});
        }else if(id.startsWith('goblinScout')){
          const index=Number(id.replace('goblinScout',''));
          this.beginGoblinScoutAftermath(enemy,index);
          this.state.encounters.goblinScouts[index]='defeated';
          if(this.state.encounters.goblinScouts.every(value=>value==='defeated')){
            this.advance(OLD_AETHER_PROLOGUE_STAGES.DEFEAT_GOBLIN_SCOUTS,OLD_AETHER_PROLOGUE_STAGES.EXAMINE_ATTACKED_WAGON,()=>{
              this.state.encounters.goblinScoutsCompleted=true;
              if(!this.state.encounters.rewardGranted){
                this.state.encounters.rewardGranted=true;this.scene.player.gold+=12;this.scene.inv.add('mana_potion',1);
              }
            });
            this.hud?.hint('A estrada silenciou. A carroça abandonada merece atenção.');
          }else this.save();
        }
      }
      // Lobo Jovem e Goblins Batedores são administrados pelos sistemas de
      // aftermath persistente; nenhum deles evapora após poucos segundos.
    }
  }

  updateProgressTriggers(){
    if(this.isAt(OLD_AETHER_PROLOGUE_STAGES.INVESTIGATE_ROAD_BLOOD)){
      // Linha amarela da referência: borda da área de emboscada, diante dos
      // viajantes caídos (5.65/54.65). Medição em pixels do mundo, independente
      // da câmera e do tamanho da tela; não é acionada pela poça na estrada.
      const target=this.scene.project(5.65,54.65);
      if(Phaser.Math.Distance.Between(this.scene.player.x,this.scene.player.y,target.x,target.y)<=86){
        if(this.advance(OLD_AETHER_PROLOGUE_STAGES.INVESTIGATE_ROAD_BLOOD,
          OLD_AETHER_PROLOGUE_STAGES.BLOOD_SCENE_WAIT_MOVEMENT,()=>{
            this.state.tutorials.bloodSceneTriggered=true;
          }))this.startBloodSceneMessage();
      }
    }
    if(this.isAt(OLD_AETHER_PROLOGUE_STAGES.RETURN_TO_ROAD_FACE_GOBLINS)){
      // Os batedores só entram em combate DEPOIS da mensagem ser dispensada
      // e de o jogador efetivamente retornar ao trecho caminhável da estrada.
      const road=this.scene.project(10,53.5);
      if(Phaser.Math.Distance.Between(this.scene.player.x,this.scene.player.y,road.x,road.y)<=80)
        this.advance(OLD_AETHER_PROLOGUE_STAGES.RETURN_TO_ROAD_FACE_GOBLINS,
          OLD_AETHER_PROLOGUE_STAGES.DEFEAT_GOBLIN_SCOUTS,()=>{
            this.state.tutorials.goblinRoadEncounterStarted=true;
          });
    }
    if(this.isAt(OLD_AETHER_PROLOGUE_STAGES.FOLLOW_ROAD_AFTER_WAYSTONE)){
      // Linha rosa da referência: passagem na estrada depois do marco, antes do caixote.
      // A distância longitudinal usa a própria rota e funciona mesmo com a câmera movendo.
      const road=this.scene.aetherTerritory?.oldRoadProps;
      const line=road?.roadPoint(.355);
      if(line){
        const player=this.scene.player;
        const forward=(player.x-line.x)*line.dx+(player.y-line.y)*line.dy;
        const lateral=Math.abs((player.x-line.x)*line.dy-(player.y-line.y)*line.dx);
        if(forward>=0&&lateral<=115){
          this.advance(OLD_AETHER_PROLOGUE_STAGES.FOLLOW_ROAD_AFTER_WAYSTONE,
            OLD_AETHER_PROLOGUE_STAGES.COLLECT_TRAVEL_SUPPLIES,()=>{
              this.state.tutorials.suppliesApproachReached=true;
            });
        }
      }
    }
    if(this.isAt(OLD_AETHER_PROLOGUE_STAGES.FOLLOW_OLD_ROAD)){
      // A marca amarela fica na estrada, antes do marco arruinado.
      const yellow=this.roadPoint(.202);
      if(yellow&&Phaser.Math.Distance.Between(this.scene.player.x,this.scene.player.y,yellow.x,yellow.y)<=88){
        this.advance(OLD_AETHER_PROLOGUE_STAGES.FOLLOW_OLD_ROAD,OLD_AETHER_PROLOGUE_STAGES.WOLF_ENTRANCE,()=>{
          this.state.encounters.youngWolfIntroSeen=true;
        });
        this.spawnWolfEntrance();
      }
    }
    if(this.isAt(OLD_AETHER_PROLOGUE_STAGES.VIEW_AETHER)&&this.isNear(this.anchors.cityVista,2.25))this.showCityVista();
    const u=this.scene.player.isoX,v=this.scene.player.isoY;
    const isInsideSouthGate=u>=11.72&&u<=16.28&&v<=25.02;
    if(this.isAt(OLD_AETHER_PROLOGUE_STAGES.ENTER_AETHER)&&!this.state.discoveries.cityEntry&&isInsideSouthGate){
      this.advance(OLD_AETHER_PROLOGUE_STAGES.ENTER_AETHER,OLD_AETHER_PROLOGUE_STAGES.FIND_SHELTER_IN_AETHER,()=>{this.state.discoveries.cityEntry=true;});
      this.hud?.hint('Você atravessou o Portão Sul de Aether.');
    }else if(isInsideSouthGate&&!this.state.discoveries.cityEntry&&!this.state.gates.southEntryHinted){
      this.state.gates.southEntryHinted=true;
      this.hud?.hint('A estrada ainda guarda acontecimentos que não podem ser ignorados.');
      this.save();
    }
  }

  showCityVista(){
    if(!this.advance(OLD_AETHER_PROLOGUE_STAGES.VIEW_AETHER,OLD_AETHER_PROLOGUE_STAGES.ENTER_AETHER,()=>{this.state.discoveries.aetherVista=true;}))return;
    this.hud?.hint('Aether surge adiante, além das muralhas.');
    const target=this.scene.project(14,23.6),camera=this.scene.cameras.main;
    camera.stopFollow();
    camera.pan(target.x,target.y,520,'Sine.easeInOut',false,()=>camera.startFollow(this.scene.player,true,.12,.12,0,54));
  }

  updateCue(){
    if(this.scene.dialogueOpen){this.cue?.hide();return;}
    const target=this.getInteractionTarget();
    if(!target){this.cue?.hide();return;}
    const sign=target.sprite;
    if(sign){
      // O sprite da placa tem depth isometrico negativo. Usar sign.depth+1
      // deixava o aviso atras das camadas do terreno, embora o F funcionasse.
      // Assim como a UI dos NPCs, exiba o cartao acima da cena, ancorado
      // acima do topo visual da placa sem alterar a hitbox da interacao.
      const aboveSign=sign.getBounds().top-42;
      this.cue.show(sign.x,aboveSign,1800,target.label);
      return;
    }
    const p=this.scene.project(target.anchor.u,target.anchor.v);
    this.cue.show(p.x,p.y-target.lift,this.scene.depthAt(target.anchor.u,target.anchor.v,.72),target.label);
  }

  getInteractionTarget(){
    if(this.state.tutorials.movementComplete&&this.nearRoadSign())return{sprite:this.roadSignSprite(),label:'F - Investigar'};
    if(this.canInvestigateRuinedRoadWaystone()&&this.nearRuinedRoadWaystone())return{sprite:this.ruinedRoadWaystone(),label:'F - Investigar'};
    if(this.isAt(OLD_AETHER_PROLOGUE_STAGES.COLLECT_TRAVEL_SUPPLIES)&&this.isNear(this.anchors.travelSupplies,1.0))return{anchor:this.anchors.travelSupplies,label:'E — Coletar',lift:64};
    if(this.isAt(OLD_AETHER_PROLOGUE_STAGES.EXAMINE_ATTACKED_WAGON)&&this.isNear(this.anchors.attackedWagon,1.45))return{anchor:this.anchors.attackedWagon,label:'F — Investigar',lift:138};
    if(this.isAt(OLD_AETHER_PROLOGUE_STAGES.SPEAK_TO_PATROL)&&this.patrol&&this.nearNpc(this.patrol,100))return{anchor:this.anchors.patrol,label:'F — Conversar',lift:138};
    return null;
  }

  tryCollect(){
    if(!this.enabled||!this.isAt(OLD_AETHER_PROLOGUE_STAGES.COLLECT_TRAVEL_SUPPLIES)||!this.isNear(this.anchors.travelSupplies,1.0))return false;
    this.collectibleTween?.stop();this.collectible?.destroy();this.collectible=null;
    this.advance(OLD_AETHER_PROLOGUE_STAGES.COLLECT_TRAVEL_SUPPLIES,OLD_AETHER_PROLOGUE_STAGES.POTION_HINT_PENDING,()=>{
      this.state.tutorials.collectionComplete=true;this.scene.inv.add('healing_potion',1);
    });
    this.potionHintPendingMovement=true;
    this.showPotionHint();
    return true;
  }

  canInvestigateRuinedRoadWaystone(){
    // A primeira leitura é um objetivo; as seguintes apenas reabrem o texto.
    return this.isAt(OLD_AETHER_PROLOGUE_STAGES.EXAMINE_RUINED_WAYSTONE)||
      (this.state.encounters.youngWolf==='defeated'&&this.state.waystone.ruinedExamined);
  }

  nearRuinedRoadWaystone(){return this.isNearNarrativeProp('ruined-waystone');}

  tryInteract(){
    if(!this.enabled)return false;
    // A placa continua legível depois de concluída sua etapa. A leitura
    // inicial atualiza o objetivo apenas ao fechar o diálogo, por F ou ESC;
    // as próximas leituras não modificam o estado da missão.
    if(this.state.tutorials.movementComplete&&this.nearRoadSign()){
      this.scene.openScriptedDialogue({
        name:'Placa da Estrada',role:'Estrada Velha de Aether',
        pages:['CIDADE DE AETHER — siga a Estrada Velha para o norte até o Portão Sul.\nContinue pela estrada principal para alcançar as muralhas da cidade.'],
        spriteKey:'outskirts_aether_sign_v2',completeOnClose:true
      },()=>{
        this.advance(OLD_AETHER_PROLOGUE_STAGES.EXAMINE_ROAD_SIGN,OLD_AETHER_PROLOGUE_STAGES.FOLLOW_OLD_ROAD,()=>{this.state.tutorials.interactionComplete=true;});
      });
      return true;
    }
    if(this.canInvestigateRuinedRoadWaystone()&&this.nearRuinedRoadWaystone()){
      this.scene.openScriptedDialogue({name:'Marco de Senda destruído',role:'Estrada Velha de Aether',
        pages:['Esse é um dos Marco de Senda de Aether, no passado eles eram usados com magia para viagens rápidas entre eles. Esse está destruído. Será que ainda tem algum em funcionamento?'],
        spriteKey:'old_road_waystone_ruined_01',completeOnClose:true
      },()=>{
        this.advance(OLD_AETHER_PROLOGUE_STAGES.EXAMINE_RUINED_WAYSTONE,OLD_AETHER_PROLOGUE_STAGES.FOLLOW_ROAD_AFTER_WAYSTONE,()=>{
          this.state.waystone.ruinedExamined=true;
          this.scene.aetherTerritory?.oldRoadProps?.setRuinedWaystoneActivated?.(true,{animate:true});
        });
      });
      return true;
    }
    if(this.isAt(OLD_AETHER_PROLOGUE_STAGES.EXAMINE_ATTACKED_WAGON)&&this.isNear(this.anchors.attackedWagon,1.45)){
      this.scene.openScriptedDialogue({name:'Carroça atacada',role:'Estrada Velha de Aether',pages:['Caixas abertas, marcas no chão e parte da carga desaparecida.\nAs pegadas pequenas seguem pela estrada, mas logo se perdem entre as pedras.'],spriteKey:'abandoned_wagon_v3',flipX:true},()=>{
        this.advance(OLD_AETHER_PROLOGUE_STAGES.EXAMINE_ATTACKED_WAGON,OLD_AETHER_PROLOGUE_STAGES.SPEAK_TO_PATROL,()=>{this.state.discoveries.cart=true;});
        this.hud?.hint('Há alguém adiante na estrada.');
      });
      return true;
    }
    if(this.isAt(OLD_AETHER_PROLOGUE_STAGES.SPEAK_TO_PATROL)&&this.patrol&&this.nearNpc(this.patrol,100)){
      this.openPatrolDialogue();return true;
    }
    if(this.nearNpc(this.scene.tavernKeeper,102)&&!this.state.tavern.introCompleted){
      if(this.isAt(OLD_AETHER_PROLOGUE_STAGES.FIND_SHELTER_IN_AETHER)&&this.state.discoveries.cityEntry)this.openTavernDialogue();
      else this.openEarlyTavernMessage();
      return true;
    }
    if(this.scene.isNearWaystone?.()){
      if(this.isAt(OLD_AETHER_PROLOGUE_STAGES.WAYSTONE_RESPONSE)&&!this.state.waystone.reacted)this.openWaystoneReaction();
      else this.openNeutralWaystone();
      return true;
    }
    return false;
  }

  openPatrolDialogue(){
    this.patrol?.sprite?.play?.('prologue-patrol-gesture',true);
    this.scene.openScriptedDialogue({npc:this.patrol,name:'Aedan Vale',role:'Patrulheiro de Aether',pages:[
      'Se está procurando um lugar seguro, continue pela estrada.',
      'Os ataques aumentaram, e as estradas estão perigosas.',
      'Os muros de Aether ainda seguram o que há lá fora.',
      'Só não fique na estrada depois de escurecer.'
    ],spriteKey:'aether_patrolman'},()=>{
      this.advance(OLD_AETHER_PROLOGUE_STAGES.SPEAK_TO_PATROL,OLD_AETHER_PROLOGUE_STAGES.VIEW_AETHER,()=>{this.state.discoveries.patrol=true;});
      this.patrol?.sprite?.play?.('prologue-patrol-idle',true);
      this.hud?.hint('A estrada conduz diretamente ao Portão Sul.');
    });
  }

  openTavernDialogue(){
    const npc=this.scene.tavernKeeper;
    this.scene.openScriptedDialogue({npc,name:'Garrick Brenn',role:'Taverneiro • Taverna limitada',pages:[
      'Se veio atrás de comida quente ou de uma cama, chegou numa péssima hora.',
      'Minhas entregas simplesmente pararam de chegar. Sem farinha, sem carne, sem barris... não tenho muito que oferecer a ninguém.',
      'Não sei o que aconteceu. As estradas estão piores a cada dia.',
      'Se procura informações, tente a praça. Os soldados andam fazendo perguntas por lá.'
    ],spriteKey:npc.isoBaseTexture},()=>{
      this.advance(OLD_AETHER_PROLOGUE_STAGES.FIND_SHELTER_IN_AETHER,OLD_AETHER_PROLOGUE_STAGES.WAYSTONE_RESPONSE,()=>{
        this.state.tavern.introCompleted=true;this.scene.worldFlags.tavernState='LIMITED';
      });
      this.hud?.hint('Talvez a praça tenha respostas.');
    });
  }

  openEarlyTavernMessage(){
    const npc=this.scene.tavernKeeper;
    this.scene.openScriptedDialogue({npc,name:'Garrick Brenn',role:'Taverneiro • Taverna limitada',pages:['Perdão, viajante. A taverna está limitada enquanto as estradas não voltam a ser seguras.'],spriteKey:npc.isoBaseTexture});
  }

  openNeutralWaystone(){
    this.state.waystone.examined=true;
    this.scene.openScriptedDialogue({name:'Marco de Senda',role:'Estrutura antiga',pages:['Uma antiga estrutura de pedra coberta por inscrições desgastadas.'],spriteKey:this.scene.waystone?.textureKey});
    this.save();
  }

  openWaystoneReaction(){
    if(!this.advance(OLD_AETHER_PROLOGUE_STAGES.WAYSTONE_RESPONSE,OLD_AETHER_PROLOGUE_STAGES.COMPLETED,()=>{
      this.state.waystone.examined=true;this.state.waystone.reacted=true;this.state.completed=true;
    }))return;
    const waystone=this.scene.waystone,p={x:waystone.x,y:waystone.y-42};
    const ring=this.scene.add.circle(p.x,p.y,11,0x8edfff,.16).setStrokeStyle(2,0xeaf7ff,.9).setDepth(this.scene.depthAt(17.5,17.8,.75));
    const sparks=[-18,-6,8,20].map((offset,index)=>this.scene.add.circle(p.x+offset,p.y+8,2.3,0xdaf5ff,.9).setDepth(ring.depth+.02));
    this.scene.tweens.add({targets:ring,scale:2.7,alpha:0,duration:470,ease:'Sine.Out',onComplete:()=>ring.destroy()});
    sparks.forEach((spark,index)=>this.scene.tweens.add({targets:spark,y:spark.y-18-index*3,alpha:0,duration:390+index*35,ease:'Sine.Out',onComplete:()=>spark.destroy()}));
    this.scene.cameras.main.shake(110,.0016);
    this.scene.openScriptedDialogue({name:'Marco de Senda',role:'Relíquia antiga',pages:['Uma runa se acende por um instante e volta a silenciar. Algo respondeu à sua presença.'],spriteKey:waystone?.textureKey},()=>this.save());
  }

  spawnPatrol(){
    if(!this.scene.textures.exists('aether_patrolman'))return;
    const a=this.anchors.patrol,p=this.scene.project(a.u,a.v);
    const patrol=new Npc(this.scene,p.x,p.y,'Aedan Vale',['Aether fica adiante. Siga pela estrada e mantenha-se atento.'],{role:'Patrulheiro de Aether',portrait:'portrait_kael',idleProfile:'breath',idleFacing:'down',visualScale:.15});
    // A folha do Patrulheiro tem quatro poses próprias, não as vinte células
    // do antigo NPC genérico. Usar o caminho isométrico evita criar animações
    // de linhas inexistentes e mantém a base dos pés estável.
    const converted=patrol.setIsometricSprite?.('aether_patrolman',{
      height:112,facing:'down',safeIdleBreathing:true,
      idleMinDelay:3600,idleMaxDelay:5600,initialIdleMin:1800,initialIdleMax:2600
    });
    if(!converted){patrol.destroy();return;}
    patrol.sprite.setFrame(0).play('prologue-patrol-idle',true);
    patrol.setInteractionAnchor(112);
    patrol.canPlayIdleAction=()=>false;
    patrol.isoBaseTexture='aether_patrolman';
    patrol.enableIsoPosition({...ISO_CONFIG,depthOffset:.07},a.u,a.v,0);
    patrol.isoLogical={u:a.u,v:a.v};
    this.scene.cityActors.push(patrol);
    this.scene.registerSolidMask(patrol.sprite,'aether_patrolman',{
      label:'Aedan Vale',mode:'footprint',footprintWidth:24,footprintHeight:12,footprintYOffset:-10,frame:()=>patrol.sprite?.frame?.name??0,
      worldX:()=>patrol.x+(patrol.sprite?.x??0),worldY:()=>patrol.y+(patrol.sprite?.y??0),
      scaleX:()=>patrol.isoDisplayScale,scaleY:()=>patrol.isoDisplayScale,
      originX:.5,originY:1,active:()=>patrol.active&&patrol.visible,minHits:2
    });
    this.patrol=patrol;
  }

  isPlayerBlockedAt(u,v,radius=.27){
    const p=this.scene.project(u,v);
    return this.enemies.some(enemy=>{
      if(!enemy?.active||!enemy.isAlive())return false;
      const footprint=enemy.prologue?.footprint??18;
      const dx=(p.x-enemy.x)/(footprint+14),dy=(p.y-(enemy.y-7))/(footprint*.58+8);
      return dx*dx+dy*dy<1;
    });
  }

  getCombatTargets(){return this.enemies.filter(enemy=>enemy?.active&&enemy.isAlive?.());}
  hideCue(){this.cue?.hide();}

  getRespawnPoint(){
    if(!this.enabled)return null;
    // Antes de concluir a PRIMEIRA leitura do marco destruído, derrotar o
    // lobo não altera o checkpoint: o jogador renasce no início da estrada.
    // O flag de investigação já faz parte do save e só é gravado quando o
    // primeiro diálogo é fechado; reler o texto não altera o checkpoint.
    if(!this.state.waystone.ruinedExamined)
      return{u:this.anchors.spawn.u,v:this.anchors.spawn.v};
    // Depois da entrada na Cidade, mantém o ponto de retorno da Cidade.
    if(this.state.discoveries.cityEntry)return{u:14,v:25.02};
    // Renascer na faixa caminhável da estrada, ao lado do marco real, não
    // dentro da sua arte / pedras. A localização acompanha o mapa atual.
    const territory=this.scene.aetherTerritory;
    const roadPoint=territory?.oldRoadProps?.roadPoint?.(1/3);
    if(roadPoint){
      const safe=territory.screenToLogical(roadPoint.x,roadPoint.y);
      if(Number.isFinite(safe.u)&&Number.isFinite(safe.v))return safe;
    }
    // Fallback para saves/mapas legados onde as peças da estrada faltarem.
    return{u:8.5,v:61.2};
  }

  destroy(){
    this.collectibleTween?.stop();this.collectible?.destroy();this.cue?.destroy();this.hud?.destroy();
    this.wagon?.destroy();for(const item of this.cartDecor||[])item?.destroy();
    for(const item of this.bloodTrailDecor||[])item?.destroy();
    for(const item of this.skeletalRemainsDecor||[])item?.destroy();
    for(const sprite of this.wolfAftermathVisual?.blood||[])sprite?.destroy?.();
    const aftermathCorpse=this.wolfAftermathVisual?.corpse;
    if(aftermathCorpse&&!this.enemies.includes(aftermathCorpse))aftermathCorpse?.destroy?.();
    for(const visual of this.goblinAftermathVisuals||[]){
      for(const sprite of visual?.blood||[])sprite?.destroy?.();
      if(visual?.corpse&&!this.enemies.includes(visual.corpse))visual.corpse?.destroy?.();
    }
    for(const enemy of this.enemies)if(enemy?.active)enemy.destroy();
  }
}
