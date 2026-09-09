// @ts-nocheck
import {Enemy} from '../entities/Enemy';
import {Npc} from '../npc/Npc';
import {AETHER_PROLOGUE_ANCHORS} from '../world/AetherTerritoryLayout';

const ISO_CONFIG={tileWidth:96,tileHeight:48,screenOriginX:1600,screenOriginY:250,depthBase:-20000};

// A arte é uma volta corporal real, não uma imagem lateral reaproveitada. A
// coluna física do atlas foi mapeada pela pose que ela mostra na tela: o
// primeiro quadro é frente (sul), o quinto é costas (norte).
const ENEMY_DIRECTIONS=Object.freeze(['n','ne','e','se','s','sw','w','nw']);
const ENEMY_DIRECTION_COLUMNS=Object.freeze({n:4,ne:3,e:2,se:1,s:0,sw:7,w:6,nw:5});
const ENEMY_SCREEN_OCTANTS=Object.freeze(['e','se','s','sw','w','nw','n','ne']);

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
  COLLECT_TRAVEL_SUPPLIES:'COLLECT_TRAVEL_SUPPLIES',
  DEFEAT_YOUNG_WOLF:'DEFEAT_YOUNG_WOLF',
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
  setObjective(text){this.objective.setText(text);}
  hint(text){
    this.scene.tweens.killTweensOf(this.hintText);
    this.hintText.setText(text).setAlpha(0);
    this.scene.tweens.add({targets:this.hintText,alpha:1,duration:160,ease:'Sine.Out',yoyo:true,hold:2100,onComplete:()=>this.hintText.setText('')});
  }
  destroy(){this.scene.scale.off(Phaser.Scale.Events.RESIZE,this.resizeHandler);this.root.destroy(true);this.hintText.destroy();}
}

/** Prompt branco curto, na mesma linguagem dos cartões próximos aos NPCs. */
class PrologueCue{
  constructor(scene){
    this.scene=scene;
    this.root=scene.add.container(0,0).setVisible(false).setAlpha(0);
    this.back=scene.add.graphics();
    this.text=scene.add.text(0,0,'',{fontFamily:'Georgia, serif',fontSize:11,color:'#273342',fontStyle:'bold'}).setOrigin(.5);
    this.root.add([this.back,this.text]);
  }
  show(x,y,depth,label){
    const width=Math.max(118,Math.min(220,26+label.length*6.1));
    this.back.clear().fillStyle(0xffffff,.94).fillRoundedRect(-width/2,-17,width,34,8).lineStyle(1,0xc4ccd5,.96).strokeRoundedRect(-width/2,-17,width,34,8);
    this.text.setText(label);
    this.root.setPosition(x,y).setDepth(depth).setVisible(true);
    if(this.root.alpha<.98){this.scene.tweens.killTweensOf(this.root);this.scene.tweens.add({targets:this.root,alpha:1,duration:120,ease:'Sine.Out'});}
  }
  hide(){if(!this.root.visible)return;this.scene.tweens.killTweensOf(this.root);this.root.setVisible(false).setAlpha(0);}
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
    this.anchors=AETHER_PROLOGUE_ANCHORS;
    this.enemies=[];
    this.ensureAnimations();
    this.hud=new PrologueHud(scene);
    this.cue=new PrologueCue(scene);
    this.createRoadSetDressing();
    this.createCollectible();
    this.syncObjective();
    if(!this.state.tutorials.movementComplete){
      scene.time.delayedCall(420,()=>this.hud?.hint('Use WASD ou as setas para se mover. As diagonais também funcionam.'));
    }
  }

  createState(){
    return {
      version:2,started:true,stage:OLD_AETHER_PROLOGUE_STAGES.ARRIVAL_ON_OLD_ROAD,
      tutorials:{movementShown:true,movementComplete:false,interactionComplete:false,collectionComplete:false},
      encounters:{youngWolf:'pending',goblinScouts:['pending','pending'],goblinScoutsCompleted:false,rewardGranted:false},
      discoveries:{cart:false,patrol:false,aetherVista:false,cityEntry:false},
      gates:{southEntryHinted:false},
      tavern:{introCompleted:false},waystone:{examined:false,reacted:false},completed:false
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
    if(state.encounters.youngWolf==='defeated')return OLD_AETHER_PROLOGUE_STAGES.DEFEAT_GOBLIN_SCOUTS;
    if(state.tutorials.collectionComplete)return OLD_AETHER_PROLOGUE_STAGES.DEFEAT_YOUNG_WOLF;
    if(state.tutorials.interactionComplete)return OLD_AETHER_PROLOGUE_STAGES.COLLECT_TRAVEL_SUPPLIES;
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
    if(next.encounters.goblinScouts.every(value=>value==='defeated'))next.encounters.goblinScoutsCompleted=true;
    next.completed=!!persisted.completed||!!next.waystone.reacted;
    // A v1 permitia carroça → goblins. A mesma normalização também protege
    // saves v2 que tenham sido gravados no meio de uma execução interrompida.
    if(!next.encounters.goblinScoutsCompleted)next.discoveries.cart=false;
    next.stage=this.stageFromMilestones(next);
    next.version=2;
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
    create('prologue-wolf-hit','prologue_young_wolf', [4,0],10,0);
    create('prologue-wolf-death','prologue_young_wolf', [4,5],5,0);
    create('prologue-goblin-hit','prologue_goblin_scout', [4,0],10,0);
    create('prologue-goblin-death','prologue_goblin_scout', [4,5],5,0);
    create('prologue-patrol-idle','aether_patrolman',[0],2,-1);
    create('prologue-patrol-walk','aether_patrolman',[1,2],7,-1);
    create('prologue-patrol-gesture','aether_patrolman',[3,0],6,0);
  }

  createRoadSetDressing(){
    const add=(key,u,v,height,offset=.02,flipX=false)=>{
      if(!this.scene.textures.exists(key))return null;
      const p=this.scene.project(u,v),source=this.scene.textures.get(key).getSourceImage();
      return this.scene.add.image(p.x,p.y,key).setOrigin(.5,1).setScale(height/source.height).setFlipX(flipX).setDepth(this.scene.depthAt(u,v,offset));
    };
    const a=this.anchors.attackedWagon;
    this.wagon=add('abandoned_wagon_v3',a.u,a.v,142,.08,true);
    if(this.wagon){
      this.scene.registerOccluder?.(this.wagon,'abandoned_wagon_v3',this.wagon.y-7,{behindMargin:8});
      this.scene.registerSolidMask?.(this.wagon,'abandoned_wagon_v3',{
        label:'Carroça abandonada',mode:'footprint',footprintWidth:128,footprintHeight:27,footprintYOffset:-12,
        originX:.5,originY:1,active:()=>this.wagon?.active&&this.wagon.visible
      });
    }
    this.cartDecor=[
      add('street_crates',a.u-.62,a.v+.35,43,.11),
      add('street_logs',a.u+.82,a.v+.62,37,.105,true),
      add('outskirts_fence_segment',a.u-1.02,a.v+.98,45,-.02,true)
    ].filter(Boolean);
  }

  createCollectible(){
    if(this.state.tutorials.collectionComplete||!this.scene.textures.exists('street_crates'))return;
    const a=this.anchors.travelSupplies,p=this.scene.project(a.u,a.v),source=this.scene.textures.get('street_crates').getSourceImage();
    this.collectible=this.scene.add.image(p.x,p.y,'street_crates').setOrigin(.5,1).setScale(33/source.height).setDepth(this.scene.depthAt(a.u,a.v,.08));
    this.collectible.setVisible(this.isAt(OLD_AETHER_PROLOGUE_STAGES.COLLECT_TRAVEL_SUPPLIES));
    this.collectibleTween=this.scene.tweens.add({targets:this.collectible,y:{from:p.y,to:p.y-2},duration:800,yoyo:true,repeat:-1,ease:'Sine.easeInOut'});
  }

  syncObjective(){
    if(this.state.completed)this.hud?.setObjective('Fale com o General.');
    else if(this.state.tavern.introCompleted)this.hud?.setObjective('Procure informações na praça.');
    else this.hud?.setObjective('Encontre abrigo em Aether.');
  }

  distanceTo(anchor){return Math.hypot(this.scene.player.isoX-anchor.u,this.scene.player.isoY-anchor.v);}
  isNear(anchor,radius=1.12){return this.distanceTo(anchor)<=radius;}
  nearNpc(npc,range=96){return !!npc&&Phaser.Math.Distance.Between(this.scene.player.x,this.scene.player.y,npc.x,npc.y)<=range;}

  update(time,delta){
    if(!this.enabled)return;
    if(this.scene.dialogueOpen){this.cue?.hide();return;}
    this.updateTutorials();
    this.updateCollectible();
    this.ensureScriptedActors();
    this.updateEnemies(time,delta);
    this.resolveEnemyDeaths(time);
    this.updateProgressTriggers();
    this.updateCue();
  }

  updateTutorials(){
    if(this.isAt(OLD_AETHER_PROLOGUE_STAGES.ARRIVAL_ON_OLD_ROAD)&&this.distanceTo(this.anchors.spawn)>.62){
      this.advance(OLD_AETHER_PROLOGUE_STAGES.ARRIVAL_ON_OLD_ROAD,OLD_AETHER_PROLOGUE_STAGES.EXAMINE_ROAD_SIGN,()=>{this.state.tutorials.movementComplete=true;});
      this.hud?.hint('A estrada segue para o norte. Uma placa antiga parece legível.');
    }
  }

  updateCollectible(){
    if(this.collectible?.active)this.collectible.setVisible(this.isAt(OLD_AETHER_PROLOGUE_STAGES.COLLECT_TRAVEL_SUPPLIES)&&!this.state.tutorials.collectionComplete);
  }

  ensureScriptedActors(){
    if(this.isAt(OLD_AETHER_PROLOGUE_STAGES.DEFEAT_YOUNG_WOLF)&&this.state.encounters.youngWolf==='pending'&&!this.wolf)this.spawnWolf();
    if(this.isAt(OLD_AETHER_PROLOGUE_STAGES.DEFEAT_GOBLIN_SCOUTS)&&!this.state.encounters.goblinScoutsCompleted)this.spawnGoblinScouts();
    if(this.isAt(OLD_AETHER_PROLOGUE_STAGES.SPEAK_TO_PATROL)&&!this.patrol)this.spawnPatrol();
  }

  spawnWolf(){
    const a=this.anchors.youngWolf;
    this.wolf=this.spawnEnemy({id:'youngWolf',kind:'wolf',name:'Lobo Jovem',texture:'prologue_young_wolf_8dir',u:a.u,v:a.v,height:82,hp:38,speed:.67,attack:6,xp:18,aggro:3.5,footprint:21,patrol:.22,attackDelay:250});
    this.hud?.hint('Um Lobo Jovem bloqueia a estrada. Use o ataque básico para se defender.');
  }

  spawnGoblinScouts(){
    this.anchors.goblinScouts.forEach((a,index)=>{
      if(this.state.encounters.goblinScouts[index]!=='pending'||this.goblinScouts?.[index])return;
      const enemy=this.spawnEnemy({id:`goblinScout${index}`,kind:'goblin',name:'Goblin Batedor',texture:'prologue_goblin_scout_8dir',u:a.u,v:a.v,height:76,hp:34,speed:.58,attack:5,xp:15,aggro:4.2,footprint:19,patrol:.44,phase:index*Math.PI,attackDelay:280});
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
    // Walk/attack usam a folha 256 px do 9D-A. Os quadros de hit/morte v2
    // possuem 724 px e mantêm a mesma altura física ao alternar de textura.
    enemy.directionalScale=config.height/(frame?.height||1);
    enemy.legacyReactionScale=config.height/724;
    enemy.originalTint=0xffffff;enemy.suppressLoot=true;enemy.prologue=config;
    enemy.iso={u:config.u,v:config.v,originU:config.u,originV:config.v};
    enemy.animState='idle';enemy.activeAnimationKey='';enemy.facingDirection='s';enemy.attackPendingAt=0;enemy.attackEndsAt=0;enemy.deathAnimationEndsAt=0;
    enemy.body?.setAllowGravity(false).setVelocity(0,0);
    enemy.hpBg?.setVisible(true);enemy.hpFill?.setVisible(true);enemy.nameText?.setVisible(true);
    const baseTakeDamage=enemy.takeDamage.bind(enemy);
    enemy.takeDamage=(amount)=>{
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

  updateEnemyFacing(enemy,du,dv){
    const screenDx=(du-dv)*ISO_CONFIG.tileWidth/2;
    const screenDy=(du+dv)*ISO_CONFIG.tileHeight/2;
    enemy.facingDirection=enemyDirectionFromScreenDelta(screenDx,screenDy,enemy.facingDirection||'s');
    return enemy.facingDirection;
  }

  playEnemyAnimation(enemy,state){
    if(!enemy?.active)return;
    const prefix=enemy.prologue.kind==='wolf'?'prologue-wolf':'prologue-goblin';
    const directional=state==='idle'||state==='walk'||state==='attack';
    const key=directional
      ?`${prefix}-${state}-${enemy.facingDirection||'s'}`
      :`${prefix}-${state}`;
    if(!this.scene.anims.exists(key))return;
    if(enemy.animState===state&&enemy.activeAnimationKey===key)return;
    enemy.animState=state;
    enemy.activeAnimationKey=key;
    enemy.setScale(directional?enemy.directionalScale:enemy.legacyReactionScale);
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
    enemy.hpBg?.setPosition(p.x,p.y-46).setDepth(depth+.42);
    enemy.hpFill?.setPosition(p.x-27,p.y-46).setDepth(depth+.43);
    enemy.nameText?.setPosition(p.x,p.y-60).setDepth(depth+.44);
  }

  resolveEnemyDeaths(time){
    for(const enemy of this.enemies){
      if(!enemy?.active||enemy.isAlive())continue;
      if(!enemy.prologueResolved&&time<(enemy.deathAnimationEndsAt||0))continue;
      if(!enemy.prologueResolved){
        enemy.prologueResolved=true;
        const id=enemy.prologue.id;
        if(id==='youngWolf'){
          this.advance(OLD_AETHER_PROLOGUE_STAGES.DEFEAT_YOUNG_WOLF,OLD_AETHER_PROLOGUE_STAGES.DEFEAT_GOBLIN_SCOUTS,()=>{this.state.encounters.youngWolf='defeated';});
          this.hud?.hint('O caminho adiante foi remexido por batedores.');
        }else if(id.startsWith('goblinScout')){
          const index=Number(id.replace('goblinScout',''));
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
        enemy.corpseExpiresAt=time+3400;
      }
      if(time>=enemy.corpseExpiresAt){enemy.destroy();}
    }
  }

  updateProgressTriggers(){
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
    const p=this.scene.project(target.anchor.u,target.anchor.v);
    this.cue.show(p.x,p.y-target.lift,this.scene.depthAt(target.anchor.u,target.anchor.v,.72),target.label);
  }

  getInteractionTarget(){
    if(this.isAt(OLD_AETHER_PROLOGUE_STAGES.EXAMINE_ROAD_SIGN)&&this.isNear(this.anchors.roadSign,1.2))return{anchor:this.anchors.roadSign,label:'F — Examinar',lift:126};
    if(this.isAt(OLD_AETHER_PROLOGUE_STAGES.COLLECT_TRAVEL_SUPPLIES)&&this.isNear(this.anchors.travelSupplies,1.0))return{anchor:this.anchors.travelSupplies,label:'E — Coletar',lift:64};
    if(this.isAt(OLD_AETHER_PROLOGUE_STAGES.EXAMINE_ATTACKED_WAGON)&&this.isNear(this.anchors.attackedWagon,1.45))return{anchor:this.anchors.attackedWagon,label:'F — Examinar',lift:130};
    if(this.isAt(OLD_AETHER_PROLOGUE_STAGES.SPEAK_TO_PATROL)&&this.patrol&&this.nearNpc(this.patrol,100))return{anchor:this.anchors.patrol,label:'F — Conversar',lift:138};
    return null;
  }

  tryCollect(){
    if(!this.enabled||!this.isAt(OLD_AETHER_PROLOGUE_STAGES.COLLECT_TRAVEL_SUPPLIES)||!this.isNear(this.anchors.travelSupplies,1.0))return false;
    this.collectibleTween?.stop();this.collectible?.destroy();this.collectible=null;
    this.advance(OLD_AETHER_PROLOGUE_STAGES.COLLECT_TRAVEL_SUPPLIES,OLD_AETHER_PROLOGUE_STAGES.DEFEAT_YOUNG_WOLF,()=>{
      this.state.tutorials.collectionComplete=true;this.scene.inv.add('healing_potion',1);
    });
    this.hud?.hint('Você encontrou uma poção simples. Ela pode ser usada com H.');
    return true;
  }

  tryInteract(){
    if(!this.enabled)return false;
    if(this.isAt(OLD_AETHER_PROLOGUE_STAGES.EXAMINE_ROAD_SIGN)&&this.isNear(this.anchors.roadSign,1.2)){
      this.scene.openScriptedDialogue({name:'Placa da Estrada',role:'Estrada Velha de Aether',pages:['AETHER — siga a estrada ao norte.\nAs letras foram gastas pelo tempo, mas a direção ainda é clara.'],spriteKey:'outskirts_aether_sign_v2'},()=>{
        this.advance(OLD_AETHER_PROLOGUE_STAGES.EXAMINE_ROAD_SIGN,OLD_AETHER_PROLOGUE_STAGES.COLLECT_TRAVEL_SUPPLIES,()=>{this.state.tutorials.interactionComplete=true;});
        this.hud?.hint('Há uma pequena caixa de viagem logo adiante.');
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
    if(this.state.discoveries.cityEntry)return{u:14,v:25.02};
    if(this.state.discoveries.patrol)return{u:11.7,v:42.1};
    if(this.state.discoveries.cart)return{u:11,v:46};
    if(this.state.encounters.goblinScoutsCompleted)return{u:10.3,v:49.8};
    if(this.state.encounters.youngWolf==='defeated')return{u:8.5,v:61.2};
    return{u:this.anchors.spawn.u,v:this.anchors.spawn.v};
  }

  destroy(){
    this.collectibleTween?.stop();this.collectible?.destroy();this.cue?.destroy();this.hud?.destroy();
    this.wagon?.destroy();for(const item of this.cartDecor||[])item?.destroy();
    for(const enemy of this.enemies)if(enemy?.active)enemy.destroy();
  }
}
