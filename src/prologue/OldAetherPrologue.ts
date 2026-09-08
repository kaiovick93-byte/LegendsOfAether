// @ts-nocheck
import {Enemy} from '../entities/Enemy';
import {Npc} from '../npc/Npc';
import {AETHER_PROLOGUE_ANCHORS} from '../world/AetherTerritoryLayout';

const ISO_CONFIG={tileWidth:96,tileHeight:48,screenOriginX:1600,screenOriginY:250,depthBase:-20000};

/** Pequeno rastreador, sem recriar a HUD ou sobrepor a barra inferior. */
class PrologueHud{
  constructor(scene){
    this.scene=scene;
    this.root=scene.add.container(22,66).setScrollFactor(0).setDepth(1750);
    this.back=scene.add.graphics();
    this.label=scene.add.text(13,9,'OBJETIVO',{fontFamily:'Arial',fontSize:10,color:'#e7c982',fontStyle:'bold',letterSpacing:1});
    this.objective=scene.add.text(13,26,'',{fontFamily:'Georgia, serif',fontSize:16,color:'#f7f8f9',fontStyle:'bold',wordWrap:{width:292}});
    this.root.add([this.back,this.label,this.objective]);
    this.hintText=scene.add.text(scene.scale.width/2,116,'',{fontFamily:'Georgia, serif',fontSize:15,color:'#fffdf6',fontStyle:'bold',stroke:'#101820',strokeThickness:4,align:'center',wordWrap:{width:460}}).setOrigin(.5).setScrollFactor(0).setDepth(1760).setAlpha(0);
    this.resizeHandler=()=>this.layout();
    scene.scale.on(Phaser.Scale.Events.RESIZE,this.resizeHandler);
    this.layout();
  }
  layout(){
    const width=Math.min(326,Math.max(236,this.scene.scale.width-44));
    this.back.clear().fillStyle(0x101821,.88).fillRoundedRect(0,0,width,58,9).lineStyle(1,0xc4a45a,.74).strokeRoundedRect(0,0,width,58,9);
    this.objective.setWordWrapWidth(width-25,true);
    this.hintText.setPosition(this.scene.scale.width/2,116).setWordWrapWidth(Math.min(520,this.scene.scale.width-56),true);
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
 * Sequência persistente do prólogo, propositalmente sobre a AetherCityScene
 * contínua. Não possui cena, spawn manager ou sistema de save paralelo.
 */
export class OldAetherPrologue{
  constructor(scene,{freshNewGame=false}={}){
    this.scene=scene;
    const persisted=scene.worldFlags?.prologue;
    this.enabled=!!freshNewGame||!!persisted?.started;
    if(!this.enabled)return;

    this.state=persisted?.started?persisted:this.createState();
    scene.worldFlags.prologue=this.state;
    scene.worldFlags.tavernState='LIMITED';
    this.anchors=AETHER_PROLOGUE_ANCHORS;
    this.enemies=[];
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
      version:1,started:true,stage:'ARRIVAL_ON_OLD_ROAD',
      tutorials:{movementShown:true,movementComplete:false,interactionComplete:false,collectionComplete:false},
      encounters:{youngWolf:'pending',goblinScouts:['pending','pending'],goblinScoutsCompleted:false,rewardGranted:false},
      discoveries:{cart:false,patrol:false,aetherVista:false,cityEntry:false},
      tavern:{introCompleted:false},waystone:{examined:false,reacted:false},completed:false
    };
  }

  createRoadSetDressing(){
    const add=(key,u,v,height,offset=.02,flipX=false)=>{
      if(!this.scene.textures.exists(key))return null;
      const p=this.scene.project(u,v),source=this.scene.textures.get(key).getSourceImage();
      return this.scene.add.image(p.x,p.y,key).setOrigin(.5,1).setScale(height/source.height).setFlipX(flipX).setDepth(this.scene.depthAt(u,v,offset));
    };
    // A carroça física já pertence ao território do Prompt 9. Estes detalhes
    // apenas contam o ataque recente, sem criar uma segunda estrutura.
    this.cartDecor=[
      add('street_crates',9.02,52.02,46,.06),
      add('street_logs',9.88,52.74,42,.055,true),
      add('outskirts_fence_segment',8.72,53.16,52,-.02,true)
    ].filter(Boolean);
  }

  createCollectible(){
    if(this.state.tutorials.collectionComplete||!this.scene.textures.exists('street_crates'))return;
    const a=this.anchors.travelSupplies,p=this.scene.project(a.u,a.v),source=this.scene.textures.get('street_crates').getSourceImage();
    this.collectible=this.scene.add.image(p.x,p.y,'street_crates').setOrigin(.5,1).setScale(33/source.height).setDepth(this.scene.depthAt(a.u,a.v,.08));
    this.collectible.setVisible(!!this.state.tutorials.interactionComplete);
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
    this.resolveEnemyDeaths();
    this.updateProgressTriggers();
    this.updateCue();
  }

  updateTutorials(){
    if(!this.state.tutorials.movementComplete&&this.distanceTo(this.anchors.spawn)>.62){
      this.state.tutorials.movementComplete=true;
      this.hud?.hint('A estrada segue para o norte. Uma placa antiga parece legível.');
    }
  }

  updateCollectible(){
    if(this.collectible?.active)this.collectible.setVisible(!!this.state.tutorials.interactionComplete&&!this.state.tutorials.collectionComplete);
  }

  ensureScriptedActors(){
    if(this.state.tutorials.collectionComplete&&this.state.encounters.youngWolf==='pending'&&!this.wolf)this.spawnWolf();
    if(this.state.discoveries.cart&&!this.state.encounters.goblinScoutsCompleted)this.spawnGoblinScouts();
    if(this.state.encounters.goblinScoutsCompleted&&!this.patrol)this.spawnPatrol();
  }

  spawnWolf(){
    const a=this.anchors.youngWolf;
    this.wolf=this.spawnEnemy({id:'youngWolf',name:'Lobo Jovem',texture:'prologue_young_wolf_v1',u:a.u,v:a.v,height:78,hp:38,speed:.67,attack:6,xp:18,aggro:3.5,footprint:21,patrol:.22});
    this.hud?.hint('Um Lobo Jovem bloqueia a estrada. Use o ataque básico para se defender.');
  }

  spawnGoblinScouts(){
    this.anchors.goblinScouts.forEach((a,index)=>{
      if(this.state.encounters.goblinScouts[index]!=='pending'||this.goblinScouts?.[index])return;
      const enemy=this.spawnEnemy({id:`goblinScout${index}`,name:'Goblin Batedor',texture:'siege_goblin',u:a.u,v:a.v,height:68,hp:34,speed:.58,attack:5,xp:15,aggro:4.2,footprint:19,patrol:.44,phase:index*Math.PI});
      this.goblinScouts??=[];this.goblinScouts[index]=enemy;
    });
    if(this.goblinScouts?.some(Boolean))this.hud?.hint('Dois goblins vasculham o que restou da carga.');
  }

  spawnEnemy(config){
    if(!this.scene.textures.exists(config.texture))return null;
    const p=this.scene.project(config.u,config.v);
    const enemy=new Enemy(this.scene,p.x,p.y,config.name,{hp:config.hp,speed:58,attackDamage:config.attack,aggroRange:190,xpReward:config.xp,attackCooldown:1050,scale:1,tint:0xffffff});
    enemy.setTexture(config.texture,0).setOrigin(.5,1).clearTint();
    const source=this.scene.textures.get(config.texture).getSourceImage();
    enemy.setScale(config.height/source.height).setDepth(this.scene.depthAt(config.u,config.v,.16));
    enemy.originalTint=0xffffff;enemy.suppressLoot=true;enemy.prologue=config;enemy.iso={u:config.u,v:config.v,originU:config.u,originV:config.v};
    enemy.body?.setAllowGravity(false).setVelocity(0,0);
    enemy.hpBg?.setVisible(true);enemy.hpFill?.setVisible(true);enemy.nameText?.setVisible(true);
    this.enemies.push(enemy);
    return enemy;
  }

  updateEnemies(time,delta){
    const seconds=Math.min(.05,Math.max(0,delta||0)/1000);
    for(const enemy of this.enemies){
      if(!enemy?.active||!enemy.isAlive())continue;
      const data=enemy.prologue,iso=enemy.iso;
      const player=this.scene.player;
      const du=player.isoX-iso.u,dv=player.isoY-iso.v,logicalDistance=Math.hypot(du,dv);
      let targetU=iso.u,targetV=iso.v;
      if(logicalDistance<=data.aggro&&logicalDistance>.72){
        targetU+=du/logicalDistance*data.speed*seconds;
        targetV+=dv/logicalDistance*data.speed*seconds;
      }else if(logicalDistance>data.aggro){
        const phase=time*.00115+(data.phase||0);
        targetU=iso.originU+Math.cos(phase)*data.patrol;
        targetV=iso.originV+Math.sin(phase*.82)*data.patrol;
      }else this.scene.combat.enemyAttack(enemy,player);
      if(!this.scene.isBlocked(targetU,targetV,.18)){
        iso.u=targetU;iso.v=targetV;
      }
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

  resolveEnemyDeaths(){
    for(const enemy of this.enemies){
      if(!enemy?.active||enemy.isAlive()||enemy.prologueResolved)continue;
      enemy.prologueResolved=true;
      const id=enemy.prologue.id;
      if(id==='youngWolf'){
        this.state.encounters.youngWolf='defeated';
        this.state.stage='ATTACKED_WAGON';
        this.hud?.hint('O caminho adiante leva a uma carroça abandonada.');
        this.scene.saveGame();
      }else if(id.startsWith('goblinScout')){
        const index=Number(id.replace('goblinScout',''));
        this.state.encounters.goblinScouts[index]='defeated';
        if(this.state.encounters.goblinScouts.every(value=>value==='defeated')){
          this.state.encounters.goblinScoutsCompleted=true;
          this.state.stage='PATROL_AHEAD';
          if(!this.state.encounters.rewardGranted){
            this.state.encounters.rewardGranted=true;
            this.scene.player.gold+=12;this.scene.inv.add('mana_potion',1);
          }
          this.hud?.hint('A estrada está silenciosa. Há um patrulheiro adiante.');
          this.scene.saveGame();
        }
      }
      enemy.setTint(0x746558).setAlpha(.46);
      this.scene.tweens.add({targets:enemy,scaleY:Math.max(.08,enemy.scaleY*.3),alpha:.18,duration:560,delay:700,ease:'Quad.In',onComplete:()=>{
        enemy.hpBg?.destroy();enemy.hpFill?.destroy();enemy.nameText?.destroy();enemy.destroy();
      }});
    }
  }

  updateProgressTriggers(){
    if(this.state.discoveries.patrol&& !this.state.discoveries.aetherVista&&this.isNear(this.anchors.cityVista,2.25))this.showCityVista();
    const u=this.scene.player.isoX,v=this.scene.player.isoY;
    const entered=u>=11.7&&u<=16.3&&v<=25.2;
    if(entered&&!this.state.discoveries.cityEntry){
      this.state.discoveries.cityEntry=true;
      this.state.stage='FIND_SHELTER_IN_AETHER';
      this.hud?.hint('Você atravessou o Portão Sul de Aether.');
      this.syncObjective();
      this.scene.saveGame();
    }
  }

  showCityVista(){
    this.state.discoveries.aetherVista=true;
    this.state.stage='ENTER_AETHER';
    this.hud?.hint('Aether surge adiante, além das muralhas.');
    this.scene.saveGame();
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
    if(!this.state.tutorials.interactionComplete&&this.isNear(this.anchors.roadSign,1.2))return{anchor:this.anchors.roadSign,label:'F — Examinar',lift:126};
    if(this.state.tutorials.interactionComplete&&!this.state.tutorials.collectionComplete&&this.isNear(this.anchors.travelSupplies,1.0))return{anchor:this.anchors.travelSupplies,label:'E — Coletar',lift:64};
    if(this.state.encounters.youngWolf==='defeated'&&!this.state.discoveries.cart&&this.isNear(this.anchors.attackedWagon,1.3))return{anchor:this.anchors.attackedWagon,label:'F — Examinar',lift:110};
    if(this.state.encounters.goblinScoutsCompleted&&this.patrol&&this.nearNpc(this.patrol,100))return{anchor:this.anchors.patrol,label:'F — Conversar',lift:138};
    return null;
  }

  tryCollect(){
    if(!this.enabled||!this.state.tutorials.interactionComplete||this.state.tutorials.collectionComplete||!this.isNear(this.anchors.travelSupplies,1.0))return false;
    this.state.tutorials.collectionComplete=true;
    this.scene.inv.add('healing_potion',1);
    this.collectibleTween?.stop();this.collectible?.destroy();this.collectible=null;
    this.state.stage='FIRST_WOLF';
    this.hud?.hint('Você encontrou uma poção simples. Ela pode ser usada com H.');
    this.scene.saveGame();
    return true;
  }

  tryInteract(){
    if(!this.enabled)return false;
    if(this.nearNpc(this.scene.tavernKeeper,102)&&!this.state.tavern.introCompleted){
      if(this.state.discoveries.patrol&&this.state.discoveries.cityEntry)this.openTavernDialogue();
      else this.openEarlyTavernMessage();
      return true;
    }
    if(this.scene.isNearWaystone?.()){
      if(this.state.tavern.introCompleted&&!this.state.waystone.reacted)this.openWaystoneReaction();
      else this.openNeutralWaystone();
      return true;
    }
    if(!this.state.tutorials.interactionComplete&&this.isNear(this.anchors.roadSign,1.2)){
      this.state.tutorials.interactionComplete=true;
      this.state.stage='COLLECT_TRAVEL_SUPPLIES';
      this.collectible?.setVisible(true);
      this.scene.openScriptedDialogue({name:'Placa da Estrada',role:'Estrada Velha de Aether',pages:['AETHER — siga a estrada ao norte.\nAs letras foram gastas pelo tempo, mas a direção ainda é clara.'],spriteKey:'outskirts_aether_sign_v2'},()=>{
        this.hud?.hint('Há uma pequena caixa de viagem logo adiante.');this.scene.saveGame();
      });
      return true;
    }
    if(this.state.encounters.youngWolf==='defeated'&&!this.state.discoveries.cart&&this.isNear(this.anchors.attackedWagon,1.35)){
      this.state.discoveries.cart=true;
      this.state.stage='GOBLIN_SCOUTS';
      this.scene.openScriptedDialogue({name:'Carroça atacada',role:'Estrada Velha de Aether',pages:['Caixas abertas, marcas no chão e parte da carga desaparecida.\nAs pegadas pequenas seguem pela estrada, mas logo se perdem entre as pedras.'],spriteKey:'farm_empty_wagon',flipX:true},()=>{
        this.hud?.hint('Movimento adiante. Algo ainda revira a carga.');this.scene.saveGame();
      });
      return true;
    }
    if(this.state.encounters.goblinScoutsCompleted&&this.patrol&&this.nearNpc(this.patrol,100)){
      if(this.state.discoveries.patrol)this.openPatrolReminder();else this.openPatrolDialogue();
      return true;
    }
    return false;
  }

  openPatrolDialogue(){
    this.scene.openScriptedDialogue({npc:this.patrol,name:'Aedan Vale',role:'Patrulheiro de Aether',pages:[
      'Se está procurando um lugar seguro, continue pela estrada.',
      'Os ataques aumentaram, e as estradas estão perigosas.',
      'Os muros de Aether ainda seguram o que há lá fora.',
      'Só não fique na estrada depois de escurecer.'
    ],spriteKey:this.patrol.isoBaseTexture},()=>{
      this.state.discoveries.patrol=true;this.state.stage='AETHER_VISTA';
      this.hud?.hint('A estrada conduz diretamente ao Portão Sul.');this.scene.saveGame();
    });
  }

  openPatrolReminder(){
    this.scene.openScriptedDialogue({npc:this.patrol,name:'Aedan Vale',role:'Patrulheiro de Aether',pages:['Aether fica adiante. Siga pela estrada e mantenha-se atento.'],spriteKey:this.patrol.isoBaseTexture});
  }

  openTavernDialogue(){
    const npc=this.scene.tavernKeeper;
    this.scene.openScriptedDialogue({npc,name:'Garrick Brenn',role:'Taverneiro • Taverna limitada',pages:[
      'Se veio atrás de comida quente ou de uma cama, chegou numa péssima hora.',
      'Minhas entregas simplesmente pararam de chegar. Sem farinha, sem carne, sem barris... não tenho muito que oferecer a ninguém.',
      'Não sei o que aconteceu. As estradas estão piores a cada dia.',
      'Se procura informações, tente a praça. Os soldados andam fazendo perguntas por lá.'
    ],spriteKey:npc.isoBaseTexture},()=>{
      this.state.tavern.introCompleted=true;this.state.stage='WAYSTONE_RESPONSE';
      this.scene.worldFlags.tavernState='LIMITED';this.syncObjective();this.hud?.hint('Talvez a praça tenha respostas.');this.scene.saveGame();
    });
  }

  openEarlyTavernMessage(){
    const npc=this.scene.tavernKeeper;
    this.scene.openScriptedDialogue({npc,name:'Garrick Brenn',role:'Taverneiro • Taverna limitada',pages:['Perdão, viajante. A taverna está limitada enquanto as estradas não voltam a ser seguras.'],spriteKey:npc.isoBaseTexture});
  }

  openNeutralWaystone(){
    this.state.waystone.examined=true;
    this.scene.openScriptedDialogue({name:'Marco de Senda',role:'Estrutura antiga',pages:['Uma antiga estrutura de pedra coberta por inscrições desgastadas.'],spriteKey:this.scene.waystone?.textureKey});
    this.scene.saveGame();
  }

  openWaystoneReaction(){
    // O estado é gravado antes do efeito: não há repetição ao salvar/carregar
    // no meio da pequena reação visual.
    this.state.waystone.examined=true;this.state.waystone.reacted=true;this.state.completed=true;this.state.stage='COMPLETED';this.syncObjective();
    const waystone=this.scene.waystone,p={x:waystone.x,y:waystone.y-42};
    const ring=this.scene.add.circle(p.x,p.y,11,0x8edfff,.16).setStrokeStyle(2,0xeaf7ff,.9).setDepth(this.scene.depthAt(17.5,17.8,.75));
    const sparks=[-18,-6,8,20].map((offset,index)=>this.scene.add.circle(p.x+offset,p.y+8,2.3,0xdaf5ff,.9).setDepth(ring.depth+.02));
    this.scene.tweens.add({targets:ring,scale:2.7,alpha:0,duration:470,ease:'Sine.Out',onComplete:()=>ring.destroy()});
    sparks.forEach((spark,index)=>this.scene.tweens.add({targets:spark,y:spark.y-18-index*3,alpha:0,duration:390+index*35,ease:'Sine.Out',onComplete:()=>spark.destroy()}));
    this.scene.cameras.main.shake(110,.0016);
    this.scene.saveGame();
    this.scene.openScriptedDialogue({name:'Marco de Senda',role:'Relíquia antiga',pages:['Uma runa se acende por um instante e volta a silenciar. Algo respondeu à sua presença.'],spriteKey:waystone?.textureKey},()=>this.scene.saveGame());
  }

  spawnPatrol(){
    if(!this.scene.textures.exists('guard_iso'))return;
    const a=this.anchors.patrol,p=this.scene.project(a.u,a.v);
    const patrol=new Npc(this.scene,p.x,p.y,'Aedan Vale',['Aether fica adiante. Siga pela estrada e mantenha-se atento.'],{role:'Patrulheiro de Aether',portrait:'portrait_kael',idleProfile:'east_guard',idleFacing:'northWest'});
    patrol.setIsometricSprite('guard_iso',{height:116,facing:'northWest',actionTexture:'guard_iso_action',actionFrameRate:4.3,actionRepeat:1,idleMinDelay:1600,idleMaxDelay:3100,actionPause:420});
    patrol.enableIsoPosition({...ISO_CONFIG,depthOffset:.07},a.u,a.v,0);
    patrol.isoLogical={u:a.u,v:a.v};
    this.scene.cityActors.push(patrol);
    this.scene.registerSolidMask(patrol.sprite,patrol.isoBaseTexture,{
      label:'Aedan Vale',mode:'footprint',footprintWidth:24,footprintHeight:12,footprintYOffset:-10,frame:'__BASE',
      worldX:()=>patrol.x+(patrol.sprite?.x??0),worldY:()=>patrol.y+(patrol.sprite?.y??0),
      scaleX:()=>patrol.isoDisplayScale||Math.abs(patrol.sprite?.scaleX)||1,scaleY:()=>patrol.isoDisplayScale||Math.abs(patrol.sprite?.scaleY)||1,
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
    if(this.state.encounters.goblinScoutsCompleted)return{u:10.3,v:49.8};
    if(this.state.encounters.youngWolf==='defeated')return{u:8.5,v:61.2};
    return{u:this.anchors.spawn.u,v:this.anchors.spawn.v};
  }

  destroy(){
    this.collectibleTween?.stop();this.collectible?.destroy();this.cue?.destroy();this.hud?.destroy();
    for(const enemy of this.enemies)if(enemy?.active)enemy.destroy();
  }
}
