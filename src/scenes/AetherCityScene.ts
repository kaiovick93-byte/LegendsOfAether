// @ts-nocheck
import {Player,playerScreenVelocity,screenVelocityToIsoDelta} from '../entities/Player';
import {Inventory} from '../inventory/Inventory';
import {EquipmentManager} from '../equipment/EquipmentManager';
import {AbilitySystem} from '../abilities/AbilitySystem';
import {CombatSystem} from '../combat/CombatSystem';
import {LootManager} from '../loot/LootManager';
import {SaveManager} from '../save/SaveManager';
import {ClassManager} from '../character/ClassManager';
import {SkillManager} from '../skills/SkillManager';
import {QuestManager} from '../quests/QuestManager';
import {MapHud} from '../ui/MapHud';
import {DeathOverlay} from '../ui/DeathOverlay';
import {ChoiceDialogueBox} from '../ui/ChoiceDialogueBox';
import {NpcDialoguePanel} from '../ui/NpcDialoguePanel';
import {ShopPanel} from '../shop/ShopPanel';
import {Npc} from '../npc/Npc';
import {WanderingNpc} from '../npc/WanderingNpc';
import {SfxManager} from '../audio/SfxManager';
import {Waystone} from '../world/Waystone';
import {LowerWallSiege} from '../world/LowerWallSiege';
import {CityPavementKit} from '../world/CityPavementKit';
import {FountainWaterEffect} from '../world/FountainWaterEffect';
import {AetherTerritory} from '../world/AetherTerritory';
import {AETHER_LOGICAL_BOUNDS,AETHER_NEW_GAME_SPAWN,AETHER_WORLD_BOUNDS,legacyWorldPositionToIso} from '../world/AetherTerritoryLayout';
import {IsoSprite,IsoOcclusionManager} from '../isometric/IsoOcclusion';
import {OldAetherPrologue} from '../prologue/OldAetherPrologue';

/**
 * Round 67 — acabamento urbano, contato corporal e portões isométricos.
 *
 * Cidade e Arredores formam um único território isométrico. O deslocamento
 * continua em (u,v), e a mesma fundação lógica alimenta câmera, colisão,
 * profundidade, oclusão, save, minimapa e ativação por setor.
 */
export class AetherCityScene extends Phaser.Scene {
  static readonly TILE_WIDTH = 96;
  static readonly TILE_HEIGHT = 48;
  static readonly MAP_SIZE = 28;
  static readonly CITY_MIN = 2;
  static readonly CITY_MAX = 26;
  static readonly ORIGIN_X = 1600;
  static readonly ORIGIN_Y = 250;
  static readonly WORLD_LEFT = AETHER_WORLD_BOUNDS.left;
  static readonly WORLD_TOP = AETHER_WORLD_BOUNDS.top;
  static readonly WORLD_WIDTH = AETHER_WORLD_BOUNDS.width;
  static readonly WORLD_HEIGHT = AETHER_WORLD_BOUNDS.height;
  static readonly GATE_MIN = 13.42;
  static readonly GATE_MAX = 14.58;
  static readonly ISO_DEPTH_BASE = -20000;

  constructor() {
    super('AetherCityScene');
  }

  create() {
    this.switching = false;
    this.dialogueOpen = false;
    this.usesLogicalAlphaCollision = true;
    this.solidMasks = [];
    this.textureAlphaMaskCache = new Map();
    this.textureRgbaCache = new Map();
    this.foundationSpanCache = new Map();
    this.occluders = [];
    this.occluderFrontState = new WeakMap();
    this.playerOcclusionActive = false;
    this.playerOcclusionSignature = '';
    this.playerOcclusionDepth = -Infinity;
    this.occlusionManager = new IsoOcclusionManager(this);
    this.cityActors = [];
    this.ambientActors = [];
    this.ambientRouteStates=[];
    this.tavernRatTweens=[];
    // Primeiro quadro já dentro da avenida: nenhuma torre encobre o herói.
    this.playerIsoStart = {x: 14, y: 25.02};
    this.playerIsoRadius = .27;

    this.initializeSystems();
    this.loadGame();
    this.configurePlayerVisual();

    this.physics.world.setBounds(AetherCityScene.WORLD_LEFT,AetherCityScene.WORLD_TOP,AetherCityScene.WORLD_WIDTH,AetherCityScene.WORLD_HEIGHT);
    this.cameras.main.setBackgroundColor('#0c1717');
    // O canvas acompanha o tamanho real do navegador. O mapa fica maior por
    // área visível, nunca por esticar as texturas ou a interface.
    const cityZoom = 1;
    this.cityZoom=cityZoom;
    this.cameras.main.setZoom(cityZoom);
    // A câmera pode ultrapassar a caixa técnica do mapa. Assim, ao caminhar
    // até a muralha norte, a cidade continua descendo e o herói permanece na
    // zona central de leitura em vez de ficar preso ao topo da tela.
    this.configureCityCameraBounds();
    this.cityResizeHandler=()=>this.configureCityCameraBounds();
    this.scale.on(Phaser.Scale.Events.RESIZE,this.cityResizeHandler);
    this.cameras.main.setDeadzone(180, 80);
    this.cameras.main.startFollow(this.player, true, .12, .12, 0, 54);
    this.cameras.main.setRoundPixels(false);

    this.aetherTerritory=new AetherTerritory(this,{
      tileWidth:AetherCityScene.TILE_WIDTH,tileHeight:AetherCityScene.TILE_HEIGHT,
      originX:AetherCityScene.ORIGIN_X,originY:AetherCityScene.ORIGIN_Y,
      depthBase:AetherCityScene.ISO_DEPTH_BASE,worldFlags:this.worldFlags,
      project:(u,v)=>this.project(u,v),
      registerOccluder:(...args)=>this.registerOccluder(...args),
      registerSolidMask:(...args)=>this.registerSolidMask(...args)
    });
    this.aetherTerritory.forceUpdate(0,this.player.isoX,this.player.isoY);
    this.createWorld();
    this.createNpcs();
    this.createAmbientLife();
    this.createLowerWallSiege();
    this.setCityRegionActive(this.player.isoX<=44&&this.player.isoY<=44);
    this.setupInput();
    this.setupHud();
    this.prologue = new OldAetherPrologue(this,{freshNewGame:this.isFreshNewGame});
    this.createCityBanner();
    this.updatePlayerProjection();
    this.installUnload();
    this.cameras.main.fadeIn(260, 7, 13, 16);
    this.saveGame();
  }

  configureCityCameraBounds(){
    const cameraPadX=Math.ceil(this.scale.width/this.cityZoom/2);
    const cameraPadY=Math.ceil(this.scale.height/this.cityZoom/2)+80;
    this.cameras.main.setBounds(
      AetherCityScene.WORLD_LEFT-cameraPadX,AetherCityScene.WORLD_TOP-cameraPadY,
      AetherCityScene.WORLD_WIDTH+cameraPadX*2,
      AetherCityScene.WORLD_HEIGHT+cameraPadY*2
    );
  }

  initializeSystems() {
    const spawn = this.project(this.playerIsoStart.x, this.playerIsoStart.y);
    this.sm = new SaveManager();
    this.inv = new Inventory();
    this.player = new Player(this, spawn.x, spawn.y);
    this.player.enableIsoMovement({
      tileWidth:AetherCityScene.TILE_WIDTH,
      tileHeight:AetherCityScene.TILE_HEIGHT,
      screenOriginX:AetherCityScene.ORIGIN_X,
      screenOriginY:AetherCityScene.ORIGIN_Y,
      depthBase:AetherCityScene.ISO_DEPTH_BASE,
      depthOffset:.015
    },this.playerIsoStart.x,this.playerIsoStart.y,-6);
    this.classManager = new ClassManager();
    this.skillManager = new SkillManager(this.player);
    this.player.scene.skillManager = this.skillManager;
    this.equip = new EquipmentManager(this.player);
    this.sfx = new SfxManager(this);
    this.player.scene.sfx = this.sfx;
    this.loot = new LootManager(this, this.inv);
    this.combat = new CombatSystem(this, this.loot);
    this.abilities = new AbilitySystem(this, this.player);
    this.questManager = new QuestManager();
  }

  loadGame() {
    const save = this.sm.load();
    this.isFreshNewGame = !save;
    const savedPos = save?.scenePositions?.AetherCityScene;
    const entrance = this.registry.get('aetherCityEntrance');
    const continuousSpawn=this.registry.get('aetherContinuousSpawn');
    const legacyPosition=save?.lastScene==='WorldScene'
      ?legacyWorldPositionToIso(save?.scenePositions?.WorldScene)
      :null;

    // O estado visual de Elara já fica pronto para a futura missão:
    // false/ausente = fé perdida; true = botica e curandeira restauradas.
    this.worldFlags = {...(save?.worldFlags || this.registry.get('worldFlags') || {})};
    this.registry.set('worldFlags', this.worldFlags);

    if (save) {
      this.player.loadState(save.player);
      this.inv.load(save.inventory);
      this.equip.load(save.equipment, this.inv);
      this.skillManager.load(save.skills);
      this.questManager.load(save.quests);
      this.classManager.load(this.player, save.characterClass || this.player.characterClass);
    } else {
      const selectedClass=this.registry.get('selectedClass') || 'warrior';
      this.player.applyClass(selectedClass);
      this.player.setAppearance(this.registry.get('selectedAppearance') || `${selectedClass}_m`);
      this.registry.remove('selectedClass');
      this.registry.remove('selectedAppearance');
      this.inv.add('healing_potion', 2);
      this.inv.add('mana_potion', 2);
      this.player.gold = 25;
    }

    this.entryFacing = 'down';
    if(Number.isFinite(continuousSpawn?.u)&&Number.isFinite(continuousSpawn?.v)){
      this.player.setIsoPosition(
        Phaser.Math.Clamp(continuousSpawn.u,AETHER_LOGICAL_BOUNDS.minU+.4,AETHER_LOGICAL_BOUNDS.maxU-.4),
        Phaser.Math.Clamp(continuousSpawn.v,AETHER_LOGICAL_BOUNDS.minV+.4,AETHER_LOGICAL_BOUNDS.maxV-.4),-6
      );
      this.entryFacing=continuousSpawn.facing||'down';
    }else if(legacyPosition){
      this.player.setIsoPosition(legacyPosition.u,legacyPosition.v,-6);
      this.entryFacing='up';
    }else if (entrance === 'east') {
      // Limite interno do arco leste, exatamente na direção usada na entrada.
      this.player.setIsoPosition(25.02,14,-6);
      this.entryFacing = 'left';
    } else if (entrance === 'south') {
      // Limite interno do arco sul, olhando para o centro da cidade.
      this.player.setIsoPosition(14,25.02,-6);
      this.entryFacing = 'up';
    } else if (Number.isFinite(savedPos?.u) && Number.isFinite(savedPos?.v)) {
      // Saves da expansão mantêm toda a coordenada lógica. Saves urbanos mais
      // antigos continuam migrados para o envelope interno seguro.
      const continuous=!!save?.worldFlags?.continuousAetherTerritoryV1;
      const safeMin=continuous?AETHER_LOGICAL_BOUNDS.minU+.4:3.18;
      const safeMax=continuous?AETHER_LOGICAL_BOUNDS.maxU-.4:25.08;
      this.player.setIsoPosition(
        Phaser.Math.Clamp(savedPos.u,safeMin,safeMax),
        Phaser.Math.Clamp(savedPos.v,safeMin,safeMax),
        -6
      );
    } else if (!save) {
      // Novo Jogo nunca começa na praça: a Estrada Velha já faz parte da
      // própria AetherCityScene contínua, sem portal nem troca de mapa.
      this.player.setIsoPosition(AETHER_NEW_GAME_SPAWN.u,AETHER_NEW_GAME_SPAWN.v,-6);
      this.entryFacing=AETHER_NEW_GAME_SPAWN.facing;
    }
    this.registry.remove('aetherCityEntrance');
    this.registry.remove('aetherContinuousSpawn');
    this.equip.sync();
  }

  configurePlayerVisual() {
    // O protótipo podia deixar o herói atrás de uma camada longa de muralha.
    // A cena oficial usa a classe Player, força uma textura conhecida e mantém
    // o depth pela linha dos pés em cada quadro.
    this.player.refreshAppearanceTexture();
    const texture = this.textures.exists(this.player.getTextureKey()) ? this.player.getTextureKey() : 'player-fallback';
    const frame = texture === 'player-fallback' ? 0 : this.player.getIdleFrame();
    this.registry.set('playerTextureKey', texture);
    // As folhas de 96 px têm cerca de 80 px realmente opacos. Em 1,28x o
    // corpo visível fica entre 98 e 107 px, a mesma faixa dos NPCs urbanos.
    this.player.getVisualSprite()?.setTexture(texture,frame).setOrigin(.5,1);
    this.player.setVisualScale(1.28).setVisualVisible(true).setVisualAlpha(1).clearVisualTint();
    this.player.setActive(true);
    this.player.setCollideWorldBounds(false);
    this.player.configureLogicalBody();
    this.player.body?.setVelocity(0,0);
    this.player.updateIsoPosition();
    this.player.facing = this.entryFacing || 'down';
    this.player.playMove(false);
    // A arte dos protagonistas já encosta na linha dos pés. A antiga elipse
    // criada pelo Phaser fazia todos parecerem flutuar e não é mais usada.
    this.playerShadow?.destroy?.();
    this.playerShadow=null;
    this.createPlayerOcclusionOutline();
  }

  createPlayerOcclusionOutline() {
    const overlayKey='aether-city-player-partial-occlusion';
    let overlayTexture=this.textures.exists(overlayKey)?this.textures.get(overlayKey):null;
    if(!overlayTexture?.getContext){
      if(overlayTexture)this.textures.remove(overlayKey);
      overlayTexture=this.textures.createCanvas(overlayKey,96,96);
    }
    const context=overlayTexture?.getContext?.();
    if(context){
      context.clearRect(0,0,96,96);
      overlayTexture.refresh();
      this.playerOcclusionTexture=overlayTexture;
      this.playerOcclusionImageData=context.createImageData(96,96);
    }
    if (!this.playerOutline?.active) {
      this.playerOutline = new IsoSprite({
        scene:this,isoX:this.player.isoX,isoY:this.player.isoY,isoZ:this.player.isoZ,
        texture:overlayKey,tileWidth:AetherCityScene.TILE_WIDTH,tileHeight:AetherCityScene.TILE_HEIGHT,
        screenOriginX:AetherCityScene.ORIGIN_X,screenOriginY:AetherCityScene.ORIGIN_Y,
        depthBase:AetherCityScene.ISO_DEPTH_BASE,depthOffset:.32
      }).setScale(this.player.getVisualMetrics().scaleX,this.player.getVisualMetrics().scaleY)
        .setVisible(false).setAlpha(1);
    }
    this.playerOcclusionActive=false;
    this.playerOcclusionSignature='';
    this.playerOcclusionDepth=-Infinity;
  }

  project(u, v) {
    return {
      x: AetherCityScene.ORIGIN_X + (u - v) * AetherCityScene.TILE_WIDTH / 2,
      y: AetherCityScene.ORIGIN_Y + (u + v) * AetherCityScene.TILE_HEIGHT / 2
    };
  }

  unproject(screenX, screenY, isoZ = 0) {
    const localX=screenX-AetherCityScene.ORIGIN_X;
    const localY=screenY-AetherCityScene.ORIGIN_Y+isoZ;
    return{
      x:localX/AetherCityScene.TILE_WIDTH+localY/AetherCityScene.TILE_HEIGHT,
      y:localY/AetherCityScene.TILE_HEIGHT-localX/AetherCityScene.TILE_WIDTH
    };
  }

  cityDepth(y, offset = 0) {
    const isoSum=(y-AetherCityScene.ORIGIN_Y)/(AetherCityScene.TILE_HEIGHT/2);
    return AetherCityScene.ISO_DEPTH_BASE+isoSum*100+offset;
  }

  depthAt(u, v, offset = 0) {
    return AetherCityScene.ISO_DEPTH_BASE+(u+v)*100+offset;
  }

  getBuildingPlan() {
    const healerRestored = this.isHealerFaithRestored();
    // Uma única planta alimenta arte, gramado, colisão e posição dos NPCs.
    // Cada NPC usa a soleira visível de sua fachada, não o antigo retângulo
    // técnico do lote. Assim o personagem fica a poucos pixels do edifício.
    return [
      // O pavilhão é espelhado para abrir o balcão em direção à praça.
      {id:'merchant', key:'merchant_shop', label:'Mercado de Aldren', u:6.60, v:13.35, height:238, rect:[4.95,11.85,3.25,2.90], npc:[7.55,13.68], collisionBand:.62, flipX:true},
      {id:'scholar', key:'scholar_house', label:'Arquivo de Lysandra', u:6.40, v:8.35, height:188, rect:[5.05,7.10,2.70,2.35], npc:[7.42,9.02], collisionBand:.60, smoke:{x:650,y:64,size:41,alpha:.78}},
      {id:'blacksmith', key:'blacksmith_shop', label:'Ferraria de Borin', u:10.00, v:6.30, height:225, rect:[8.30,4.80,3.40,2.90], npc:[10.71,6.09], collisionBand:.62, smoke:{x:352,y:57,size:46,alpha:.88}},
      {id:'healer', key:healerRestored?'healer_house':'healer_house_abandoned', label:healerRestored?'Botica e Estufa de Elara':'Botica Abandonada de Elara', u:14.85, v:6.30, height:225, rect:[13.10,4.80,3.50,2.90], npc:[14.52,7.13], collisionBand:.60, smoke:healerRestored?{x:115,y:54,size:40,tint:0x7fe2d2,alpha:.72}:{x:90,y:145,size:41,tint:0xb9b6ad,alpha:.48}},
      {id:'tavern', key:'tavern_house', label:'Grande Taverna de Garrick', u:19.55, v:6.65, height:238, rect:[17.70,5.10,3.70,3.00], npc:[19.80,6.90], collisionBand:.62, smoke:{x:367,y:51,size:44,alpha:.82}},
      // O ateliê continua entre a taverna e o Portão Leste, mas usa a mesma
      // linha de implantação dos demais estabelecimentos da muralha norte.
      {id:'artisan', key:'artisan_house', label:'Ateliê de Maelis', u:23.50, v:6.65, height:224, rect:[22.00,5.20,3.00,2.75], npc:[23.80,7.48], collisionBand:.64, smoke:{x:392,y:66,size:40,alpha:.76}},
      // O bairro usa quatro tipologias reais: sobrado de ardósia, casa de
      // enxaimel, chalé térreo e residência com varanda. A diferença está na
      // arquitetura, não em simples trocas de cor.
      {id:'house_blue', key:'residential_house_blue_v2', label:'Casa da Ardósia', u:4.18, v:18.72, height:184, rect:[2.95,17.62,2.45,2.12], collisionBand:.58},
      {id:'house_green', key:'residential_house_green_v2', label:'Sobrado do Musgo', u:9.05, v:18.66, height:198, rect:[7.84,17.48,2.56,2.38], collisionBand:.58, smoke:{x:405,y:61,size:42,alpha:.72}},
      {id:'house_ochre', key:'residential_house_ochre_v2', label:'Chalé da Lenha', u:4.55, v:23.12, height:182, rect:[3.20,22.02,2.55,2.12], collisionBand:.58, smoke:{x:410,y:58,size:39,alpha:.70}},
      {id:'house_burgundy', key:'residential_house_burgundy_v2', label:'Casa da Varanda', u:9.32, v:23.18, height:202, rect:[7.86,21.98,2.70,2.48], collisionBand:.58, smoke:{x:404,y:62,size:42,alpha:.74}}
    ];
  }

  isHealerFaithRestored() {
    return !!this.worldFlags?.healerFaithRestored;
  }

  createWorld() {
    this.createGround();
    this.createCollisionPlan();
    this.createWallsAndGates();
    this.createBuildings();
    this.createPlazaAndStreets();
  }

  createGround() {
    const C = AetherCityScene;
    const centerY = C.ORIGIN_Y + C.MAP_SIZE * C.TILE_HEIGHT / 2;
    this.add.image(C.ORIGIN_X, centerY + 38, 'iso_city_grass')
      .setOrigin(.5).setTint(0x000000).setAlpha(.32).setDepth(C.ISO_DEPTH_BASE-60);
    this.add.image(C.ORIGIN_X, centerY, 'iso_city_grass').setOrigin(.5).setDepth(C.ISO_DEPTH_BASE-59);

    // A malha é composta por peças de rua, calçada, esquina, cruzamento,
    // entrada e praça. Não há mais uma imagem gigante de pavimento nem a
    // antiga borda marrom recortando a cidade inteira.
    this.cityPavement?.destroy?.();
    this.cityPavement = new CityPavementKit(this, {
      project: (u,v) => this.project(u,v),
      depth: C.ISO_DEPTH_BASE-57.5
    });
    this.cityPavement.build();

    // Um único parque amplo reproduz no jogo o espaço aprovado no mapa. O
    // círculo de pedras recebe o Marco e a clareira superior recebe a árvore.
    const garden = this.project(17.95, 16.10);
    this.add.image(garden.x, garden.y, 'iso_waystone_garden')
      .setOrigin(.5).setDepth(C.ISO_DEPTH_BASE-56);
    this.createAnimatedGrassDetails();
  }

  createAnimatedGrassDetails() {
    if (!this.textures.exists('iso_grass_tufts')) return;
    if (!this.anims.exists('city-grass-sway')) {
      this.anims.create({
        key: 'city-grass-sway',
        frames: this.anims.generateFrameNumbers('iso_grass_tufts', {frames:[0,1,2,3]}),
        frameRate: 3,
        repeat: -1
      });
    }
    const positions = [
      [1.18,5.8],[1.20,11.8],[1.22,19.5],
      [5.8,1.18],[12.2,1.20],[20.0,1.18],
      [26.82,6.2],[26.80,9.7],[26.82,19.1],
      [6.0,26.82],[18.7,26.80],[22.8,26.82],
      [3.35,18.15],[9.85,18.20],[3.35,24.25],[9.80,24.20]
    ];
    this.animatedGrass = positions.map(([u,v], index) => {
      const p = this.project(u, v);
      const tuft = this.add.sprite(p.x, p.y + 5, 'iso_grass_tufts', index % 4)
        .setOrigin(.5, 1).setScale(.58 + (index % 3) * .03)
        .setDepth(this.cityDepth(p.y,-.2));
      tuft.play('city-grass-sway');
      tuft.anims.setProgress((index % 4) / 4);
      return tuft;
    });
  }

  createCollisionPlan() {
    // A planta continua disponível para auditoria e rotas. Os volumes de
    // colisão, porém, são registrados somente depois que cada sprite existe e
    // usam seus pixels opacos; nenhum retângulo transparente participa.
    this.cityBuildingRects = this.getBuildingPlan().map(({label, rect:[u,v,w,h]}) => ({label, u1:u, v1:v, u2:u+w, v2:v+h}));
  }

  createWallsAndGates() {
    const C = AetherCityScene;
    this.wallSprites = [];
    this.addWallRun('u', C.CITY_MIN, C.CITY_MIN, C.CITY_MAX, true);
    this.addWallRun('v', C.CITY_MIN, C.CITY_MIN, C.CITY_MAX, false);
    // As extensões redundantes foram removidas dos PNGs dos portões. Os
    // módulos comuns chegam diretamente às torres, sem face terminal exposta.
    this.addWallRun('u', C.CITY_MAX, C.CITY_MIN, 12, true);
    this.addWallRun('u', C.CITY_MAX, 16, C.CITY_MAX, true);
    this.addWallRun('v', C.CITY_MAX, C.CITY_MIN, 12, false);
    this.addWallRun('v', C.CITY_MAX, 16, C.CITY_MAX, false);
    // Nos vértices superior e inferior os módulos terminam na mesma soma
    // isométrica e já formam um encaixe natural. Nos vértices laterais, as
    // linhas chegam com uma passada de profundidade de diferença; um pilar
    // próprio cobre ambas as pontas e elimina a emenda visível.
    this.addSideCornerPillar(2,26);
    this.addSideCornerPillar(26,2);

    const gateTargetWidth = 384;
    const east = this.project(26.03, 14.0);
    const eastGateSource = this.textures.get('iso_city_gate_east').getSourceImage();
    const eastGateScale=gateTargetWidth/eastGateSource.width;
    this.eastGateSprite = new IsoSprite({
      scene:this,isoX:26.03,isoY:14,isoZ:3-eastGateSource.height*eastGateScale/2,
      texture:'iso_city_gate_east',tileWidth:AetherCityScene.TILE_WIDTH,tileHeight:AetherCityScene.TILE_HEIGHT,
      screenOriginX:AetherCityScene.ORIGIN_X,screenOriginY:AetherCityScene.ORIGIN_Y,
      depthBase:AetherCityScene.ISO_DEPTH_BASE,depthOffset:.15
    }).setScale(eastGateScale);
    this.registerOccluder(this.eastGateSprite, 'iso_city_gate_east', east.y + 8);
    this.registerSolidMask(this.eastGateSprite, 'iso_city_gate_east', {
      label: 'Portão Leste', sourceMinY: .56, minHits: 2
    });

    const south = this.project(14.0, 26.03);
    const southGateSource = this.textures.get('iso_city_gate').getSourceImage();
    const southGateScale=gateTargetWidth/southGateSource.width;
    this.southGateSprite = new IsoSprite({
      scene:this,isoX:14,isoY:26.03,isoZ:3-southGateSource.height*southGateScale/2,
      texture:'iso_city_gate',tileWidth:AetherCityScene.TILE_WIDTH,tileHeight:AetherCityScene.TILE_HEIGHT,
      screenOriginX:AetherCityScene.ORIGIN_X,screenOriginY:AetherCityScene.ORIGIN_Y,
      depthBase:AetherCityScene.ISO_DEPTH_BASE,depthOffset:.15
    }).setScale(southGateScale);
    this.registerOccluder(this.southGateSprite, 'iso_city_gate', south.y + 8);
    this.registerSolidMask(this.southGateSprite, 'iso_city_gate', {
      label: 'Portão Sul', sourceMinY: .56, minHits: 2
    });
  }

  addWallRun(fixedAxis, fixed, start, end, flip) {
    // O módulo possui conectores separados por 250 px e desnível interno de
    // 125 px. Escalado para dois tiles lógicos, isso coincide exatamente com
    // o vetor da malha (96, 48), sem esticar a arte ou criar degraus na emenda.
    const tileSpan = 2;
    const tileSourceWidth = 250;
    const tileScale = (tileSpan * AetherCityScene.TILE_WIDTH / 2) / tileSourceWidth;
    const count = Math.round((end - start) / tileSpan);
    for (let index = 0; index < count; index++) {
      const middle = start + tileSpan * (index + .5);
      const u = fixedAxis === 'u' ? fixed : middle;
      const v = fixedAxis === 'v' ? fixed : middle;
      const p = this.project(u, v);
      const wallSource=this.textures.get('iso_city_wall').getSourceImage();
      const image = new IsoSprite({
        scene:this,isoX:u,isoY:v,isoZ:14-wallSource.height*tileScale/2,
        texture:'iso_city_wall',tileWidth:AetherCityScene.TILE_WIDTH,tileHeight:AetherCityScene.TILE_HEIGHT,
        screenOriginX:AetherCityScene.ORIGIN_X,screenOriginY:AetherCityScene.ORIGIN_Y,
        depthBase:AetherCityScene.ISO_DEPTH_BASE,depthOffset:.08
      }).setFlipX(flip).setScale(tileScale);
      this.wallSprites.push(image);
      this.registerOccluder(image, 'iso_city_wall', p.y + 7, {behindMargin: 8});
      this.registerSolidMask(image, 'iso_city_wall', {label: 'muralha', minHits: 2});
    }
  }

  addSideCornerPillar(u,v) {
    const key='iso_city_wall_side_corner';
    const source=this.textures.get(key).getSourceImage();
    // Só os dois vértices laterais recebem esta peça de acabamento. A leve
    // sobreposição cobre o encontro das duas faixas sem alterar os cantos
    // superior/inferior, que já possuem encaixe aprovado.
    const targetHeight=166;
    const scale=targetHeight/source.height;
    const p=this.project(u,v);
    const pillar=new IsoSprite({
      scene:this,isoX:u,isoY:v,isoZ:18-targetHeight/2,
      texture:key,tileWidth:AetherCityScene.TILE_WIDTH,tileHeight:AetherCityScene.TILE_HEIGHT,
      screenOriginX:AetherCityScene.ORIGIN_X,screenOriginY:AetherCityScene.ORIGIN_Y,
      depthBase:AetherCityScene.ISO_DEPTH_BASE,
      // O pilar precisa cobrir inclusive o módulo lateral de maior soma.
      depthOffset:108
    }).setScale(scale).setFlipX(u>v);
    this.wallSprites.push(pillar);
    this.registerOccluder(pillar,key,p.y+10,{behindMargin:8});
    this.registerSolidMask(pillar,key,{label:'pilar de canto da muralha',minHits:2});
    return pillar;
  }

  createBuildings() {
    this.cityBuildings = [];
    for (const building of this.getBuildingPlan()) {
      const image = this.addIsoImage(building.key, building.u, building.v, building.height);
      if (building.flipX) image.setFlipX(true);
      const entry = {...building, image};
      this.cityBuildings.push(entry);
      this.registerOccluder(image, building.key, image.y - 2, {behindMargin: 10});
      this.registerSolidMask(image, building.key, {
        label: building.label, mode: 'foundation', baseY: image.y - 2,
        behindMargin: 10, sourceMinY: building.collisionBand, minHits: 2
      });
      if (building.smoke) this.createChimneySmoke(entry);
    }
  }

  createChimneySmoke(building) {
    if (!building?.image || !building?.smoke || !this.textures.exists('chimney_smoke_wisp')) return;
    const image = building.image;
    const profile = building.smoke;
    const source = this.textures.get(building.key).getSourceImage();
    const sourceX = image.flipX ? source.width - profile.x : profile.x;
    const mouthX = image.x + (sourceX - source.width / 2) * Math.abs(image.scaleX);
    const mouthY = image.y - (source.height - profile.y) * Math.abs(image.scaleY);
    this.chimneySmokes ??= [];
    const assetWidth=this.textures.get('chimney_smoke_wisp').getSourceImage().width||256;
    const chimneyIndex=this.chimneySmokes.length;

    // Three independently drifting wisps avoid the repetitive four-frame
    // stamp. Their scale, opacity and lateral curl create painterly 2.5D
    // volume while the mouth of every configured chimney remains anchored.
    for(let layer=0;layer<3;layer++){
      const baseWidth=(profile.size??40)*(.74+layer*.10);
      const baseScale=baseWidth/assetWidth;
      const smoke=this.add.image(mouthX,mouthY+3,'chimney_smoke_wisp')
        .setOrigin(.5,1).setScale(baseScale*.72).setAlpha(0)
        .setDepth(image.depth+.004+layer*.0004);
      if(profile.tint)smoke.setTint(profile.tint);
      this.chimneySmokes.push(smoke);
      let emission=0;
      const emit=()=>{
        if(!smoke.active)return;
        if(this.cityRegionActive===false){smoke.setAlpha(0);this.time.delayedCall(1200+layer*90,emit);return}
        const direction=((chimneyIndex+layer+emission)%3===0?-1:1);
        const gust=.88+((chimneyIndex*17+layer*11+emission*7)%31)/100;
        const duration=(2500+layer*310+((chimneyIndex*137)%330))*gust;
        const peakAlpha=(profile.alpha??.78)*(.34+layer*.055);
        smoke.setPosition(mouthX+direction*(layer-1)*2,mouthY+3)
          .setScale(baseScale*(.66+layer*.04)).setAngle(direction*(2+layer)).setAlpha(0);
        this.tweens.add({
          targets:smoke,
          x:mouthX+direction*(18+layer*7+(emission%3)*2),
          y:mouthY-(72+layer*13+(emission%4)*3),
          scaleX:baseScale*(1.22+layer*.10+(emission%2)*.035),
          scaleY:baseScale*(1.34+layer*.11+(emission%3)*.025),
          angle:direction*(10+layer*3+(emission%3)*2),
          duration,ease:'Sine.Out',
          onUpdate:tween=>{
            const p=tween.progress;
            const fadeIn=Phaser.Math.Clamp(p/.16,0,1);
            const fadeOut=Phaser.Math.Clamp((1-p)/.34,0,1);
            smoke.setAlpha(peakAlpha*Math.min(fadeIn,fadeOut));
          },
          onComplete:()=>{
            emission++;
            this.time.delayedCall(90+layer*80+((chimneyIndex+emission)%4)*55,emit);
          }
        });
      };
      this.time.delayedCall(layer*620+(chimneyIndex%3)*170,emit);
    }
  }

  createPlazaAndStreets() {
    // A fonte ocupa o centro exato da praça. O pavimento base já forma uma
    // malha contínua até todas as fachadas, sem postes, cercas ou caixotes.
    this.fountain = this.addIsoImage('city_fountain', 14, 14, 176, .03);
    this.registerOccluder(this.fountain, 'city_fountain', this.fountain.y - 3);
    this.registerSolidMask(this.fountain, 'city_fountain', {
      label: 'fonte', mode:'foundation', sourceMinY:.45, minHits:2
    });
    this.createFountainWaterEffect();

    // A árvore ocupa a clareira superior direita do novo parque, exatamente
    // como na composição aprovada, sem bloquear o círculo do Marco.
    const u = 18.95, v = 14.75;
    // Compensa o padding inferior do PNG para o tronco pousar no jardim.
    const tree = this.addIsoImage('city_tree', u, v, 184, .02, 13);
    this.cityTree = tree;
    this.registerOccluder(tree, 'city_tree', tree.y - 4);
    this.registerSolidMask(tree, 'city_tree', {
      label: 'tronco da árvore do Marco', sourceMinY: .55, minHits: 2
    });
    this.createEnvironmentalAccents();
  }

  createFountainWaterEffect() {
    this.fountainWater?.destroy?.();
    if (this.fountain?.active) this.fountainWater = new FountainWaterEffect(this, this.fountain);
  }

  getEnvironmentalAccentPlan() {
    // Árvores ficam inteiramente nos gramados laterais; bancos usam apenas
    // bordas largas de praça e de calçada. Nenhuma âncora atravessa rua,
    // entrada de loja, rota do Morador ou NPC relevante.
    return {
      trees: [
        {id:'arvore-jardim-oeste', label:'tronco da árvore do jardim oeste', u:3.05, v:15.85, height:156},
        {id:'arvore-gramado-leste', label:'tronco da árvore do gramado leste', u:21.55, v:18.65, height:152}
      ],
      benches: [
        {id:'banco-praca', label:'banco da praça', u:10.25, v:15.78, height:62, flipX:true},
        {id:'banco-passeio-leste', label:'banco do passeio leste', u:21.08, v:16.72, height:58},
        {id:'banco-residencial', label:'banco do jardim residencial', u:2.75, v:25.12, height:60, flipX:true}
      ]
    };
  }

  createEnvironmentalAccents() {
    this.cityEnvironmentalProps = [];
    const plan = this.getEnvironmentalAccentPlan();
    for (const treeSpec of plan.trees) {
      const tree = this.addIsoImage('city_tree', treeSpec.u, treeSpec.v, treeSpec.height, .018, 9);
      tree.setData('environmentalAccent', treeSpec.id);
      this.cityEnvironmentalProps.push(tree);
      this.registerOccluder(tree, 'city_tree', tree.y - 4);
      // A copa continua puramente visual: só a base opaca do tronco ocupa o
      // chão e, portanto, jamais fecha a passagem inteira.
      this.registerSolidMask(tree, 'city_tree', {
        label: treeSpec.label, sourceMinY:.58, minHits:2
      });
    }
    for (const benchSpec of plan.benches) {
      const bench = this.addIsoImage('city_bench', benchSpec.u, benchSpec.v, benchSpec.height, .024, 2);
      if (benchSpec.flipX) bench.setFlipX(true);
      bench.setData('environmentalAccent', benchSpec.id);
      this.cityEnvironmentalProps.push(bench);
      this.registerOccluder(bench, 'city_bench', bench.y - 1, {behindMargin:4});
      this.registerSolidMask(bench, 'city_bench', {
        label: benchSpec.label, mode:'foundation', sourceMinY:.56, minHits:1
      });
    }
  }

  addIsoImage(key, u, v, targetHeight, depthOffset = 0, screenYOffset = 0) {
    const source = this.textures.get(key).getSourceImage();
    const scale = targetHeight / source.height;
    return new IsoSprite({
      scene:this,isoX:u,isoY:v,isoZ:-screenYOffset,texture:key,
      tileWidth:AetherCityScene.TILE_WIDTH,tileHeight:AetherCityScene.TILE_HEIGHT,
      screenOriginX:AetherCityScene.ORIGIN_X,screenOriginY:AetherCityScene.ORIGIN_Y,
      depthBase:AetherCityScene.ISO_DEPTH_BASE,depthOffset
    }).setScale(scale);
  }

  registerOccluder(image, key, baseY, options = {}) {
    if (!image || !key) return null;
    const entry = {
      image, key, baseY,
      worldX: options.worldX,
      worldY: options.worldY,
      originX: options.originX,
      originY: options.originY,
      alphaThreshold: options.alphaThreshold ?? 24,
      behindMargin: options.behindMargin ?? 7
    };
    this.occluders.push(entry);
    if (image instanceof IsoSprite) this.occlusionManager?.registerWall(image);
    return entry;
  }

  registerSolidMask(image, key, options = {}) {
    if (!image || !key || !this.textures.exists(key)) return null;
    const entry = {
      image, key,
      label: options.label ?? key,
      frame: options.frame,
      mode: options.mode ?? 'silhouette',
      baseY: options.baseY,
      behindMargin: options.behindMargin ?? 7,
      sourceMinY: options.sourceMinY ?? 0,
      sourceMaxY: options.sourceMaxY ?? 1,
      alphaThreshold: options.alphaThreshold ?? 36,
      minHits: options.minHits ?? 2,
      worldX: options.worldX,
      worldY: options.worldY,
      scaleX: options.scaleX,
      scaleY: options.scaleY,
      originX: options.originX,
      originY: options.originY,
      flipX: options.flipX,
      active: options.active,
      owner: options.owner,
      dynamic: !!options.dynamic,
      footprintWidth: options.footprintWidth,
      footprintHeight: options.footprintHeight,
      footprintYOffset: options.footprintYOffset
    };
    this.solidMasks.push(entry);
    return entry;
  }

  resolveSolidValue(value, fallback) {
    if (typeof value === 'function') return value();
    return value ?? fallback;
  }

  getTextureAlphaMask(key, frameName = '__BASE') {
    const texture = this.textures.get(key);
    const frame = texture?.get(frameName);
    if (!frame) return null;
    const cacheKey = `${key}:${String(frame.name)}`;
    if (this.textureAlphaMaskCache.has(cacheKey)) return this.textureAlphaMaskCache.get(cacheKey);
    const width = frame.width, height = frame.height;
    const source = frame.source?.image ?? texture.getSourceImage();
    const cut = frame.data?.cut ?? {x:0, y:0, w:width, h:height};
    const canvas = document.createElement('canvas');
    canvas.width = width; canvas.height = height;
    const context = canvas.getContext('2d', {willReadFrequently: true});
    context.clearRect(0, 0, width, height);
    context.drawImage(source, cut.x, cut.y, cut.w, cut.h, 0, 0, width, height);
    const rgba = context.getImageData(0, 0, width, height).data;
    const alpha = new Uint8Array(width * height);
    for (let index = 0, pixel = 3; index < alpha.length; index++, pixel += 4) alpha[index] = rgba[pixel];
    const mask = {width, height, alpha};
    this.textureAlphaMaskCache.set(cacheKey, mask);
    return mask;
  }

  getTextureRgbaData(key, frameName = '__BASE') {
    const texture=this.textures.get(key);
    const frame=texture?.get(frameName);
    if(!frame)return null;
    const cacheKey=`${key}:${String(frame.name)}`;
    if(this.textureRgbaCache.has(cacheKey))return this.textureRgbaCache.get(cacheKey);
    const width=frame.width,height=frame.height;
    const source=frame.source?.image??texture.getSourceImage();
    const cutX=frame.cutX??frame.data?.cut?.x??0;
    const cutY=frame.cutY??frame.data?.cut?.y??0;
    const cutWidth=frame.cutWidth??frame.data?.cut?.w??width;
    const cutHeight=frame.cutHeight??frame.data?.cut?.h??height;
    const canvas=document.createElement('canvas');
    canvas.width=width;canvas.height=height;
    const context=canvas.getContext('2d',{willReadFrequently:true});
    context.clearRect(0,0,width,height);
    context.drawImage(source,cutX,cutY,cutWidth,cutHeight,0,0,width,height);
    const rgba=new Uint8ClampedArray(context.getImageData(0,0,width,height).data);
    const data={width,height,rgba};
    this.textureRgbaCache.set(cacheKey,data);
    return data;
  }

  getOccluderGeometry(entry) {
    const image=entry.image;
    if(!image?.active||!image.visible)return null;
    const texture=this.textures.get(entry.key);
    const frameName=image.frame?.name??'__BASE';
    const frame=texture?.get(frameName);
    if(!frame)return null;
    const width=frame.width,height=frame.height;
    const scaleX=Math.abs(image.scaleX??1)||1;
    const scaleY=Math.abs(image.scaleY??1)||1;
    const parent=image.parentContainer;
    const fallbackWorldX=parent?parent.x+image.x*(parent.scaleX??1):image.x;
    const fallbackWorldY=parent?parent.y+image.y*(parent.scaleY??1):image.y;
    const worldX=this.resolveSolidValue(entry.worldX,fallbackWorldX);
    const worldY=this.resolveSolidValue(entry.worldY,fallbackWorldY);
    const originX=this.resolveSolidValue(entry.originX,image.originX??.5);
    const originY=this.resolveSolidValue(entry.originY,image.originY??.5);
    const displayWidth=width*scaleX,displayHeight=height*scaleY;
    return{
      frameName,width,height,scaleX,scaleY,worldX,worldY,originX,originY,
      left:worldX-displayWidth*originX,
      top:worldY-displayHeight*originY,
      right:worldX+displayWidth*(1-originX),
      bottom:worldY+displayHeight*(1-originY),
      flipX:!!image.flipX,flipY:!!image.flipY,
      baseY:this.resolveSolidValue(entry.baseY,worldY),
      depth:parent?.depth??image.depth??0
    };
  }

  isOccluderInFrontOfPlayer(entry,geometry) {
    const naturalDepth=this.playerNaturalDepth??this.player.depth;
    const depthGap=geometry.depth-naturalDepth;
    const baseGap=geometry.baseY-this.player.y;
    const wasInFront=this.occluderFrontState.get(entry)===true;
    // Uma faixa de saída um pouco maior que a de entrada impede alternância
    // por arredondamento quando os pés cruzam exatamente o plano frontal.
    const inFront=wasInFront
      ?depthGap>-.08&&baseGap>-.75
      :depthGap>.08&&baseGap>.75;
    this.occluderFrontState.set(entry,inFront);
    return inFront;
  }

  occluderContainsWorldPoint(candidate,worldX,worldY) {
    const {geometry,mask,entry}=candidate;
    if(worldX<geometry.left||worldX>=geometry.right||
       worldY<geometry.top||worldY>=geometry.bottom)return false;
    let sourceX=Math.floor((worldX-geometry.left)/geometry.scaleX);
    let sourceY=Math.floor((worldY-geometry.top)/geometry.scaleY);
    if(geometry.flipX)sourceX=geometry.width-1-sourceX;
    if(geometry.flipY)sourceY=geometry.height-1-sourceY;
    if(sourceX<0||sourceX>=mask.width||sourceY<0||sourceY>=mask.height)return false;
    return(mask.alpha[sourceY*mask.width+sourceX]??0)>=entry.alphaThreshold;
  }

  getPlayerCollisionSamples() {
    // Uma única elipse de contato, ancorada nos pés, atende todas as classes,
    // sexos, direções, quadros e estados de equipamento.
    return this.player.getLogicalCollisionSamples();
  }

  getFoundationRowSpans(entry,targetMask) {
    const cacheKey=`${entry.key}:${String(entry.frameName??'__BASE')}:${entry.alphaThreshold}`;
    if(this.foundationSpanCache.has(cacheKey))return this.foundationSpanCache.get(cacheKey);
    const minX=new Int32Array(targetMask.height).fill(targetMask.width);
    const maxX=new Int32Array(targetMask.height).fill(-1);
    for(let y=0;y<targetMask.height;y++){
      for(let x=0;x<targetMask.width;x++){
        if((targetMask.alpha[y*targetMask.width+x]??0)<entry.alphaThreshold)continue;
        if(x<minX[y])minX[y]=x;
        if(x>maxX[y])maxX[y]=x;
      }
    }
    // Une pequenas quebras verticais da pintura sem incluir padding externo.
    const smoothMin=new Int32Array(targetMask.height).fill(targetMask.width);
    const smoothMax=new Int32Array(targetMask.height).fill(-1);
    for(let y=0;y<targetMask.height;y++)for(let nearby=Math.max(0,y-2);nearby<=Math.min(targetMask.height-1,y+2);nearby++){
      if(maxX[nearby]<0)continue;
      smoothMin[y]=Math.min(smoothMin[y],minX[nearby]);
      smoothMax[y]=Math.max(smoothMax[y],maxX[nearby]);
    }
    const spans={minX:smoothMin,maxX:smoothMax};
    this.foundationSpanCache.set(cacheKey,spans);
    return spans;
  }

  isSolidSourcePoint(entry,targetMask,sourceX,sourceY) {
    if(sourceX<0||sourceX>=targetMask.width||sourceY<0||sourceY>=targetMask.height)return false;
    if((targetMask.alpha[sourceY*targetMask.width+sourceX]??0)>=entry.alphaThreshold)return true;
    if(entry.mode!=='foundation')return false;
    const spans=this.getFoundationRowSpans(entry,targetMask);
    return spans.maxX[sourceY]>=0&&sourceX>=spans.minX[sourceY]&&sourceX<=spans.maxX[sourceY];
  }

  getSolidGeometry(entry) {
    const image = entry.image;
    if (!image?.active || this.resolveSolidValue(entry.active, true) === false) return null;
    const texture = this.textures.get(entry.key);
    const frameName = this.resolveSolidValue(entry.frame, image.frame?.name ?? '__BASE');
    const frame = texture?.get(frameName);
    if (!frame) return null;
    const width = frame.width;
    const height = frame.height;
    const scaleX = Math.abs(this.resolveSolidValue(entry.scaleX, image.scaleX ?? 1)) || 1;
    const scaleY = Math.abs(this.resolveSolidValue(entry.scaleY, image.scaleY ?? 1)) || 1;
    const worldX = this.resolveSolidValue(entry.worldX, image.x);
    const worldY = this.resolveSolidValue(entry.worldY, image.y);
    const originX = this.resolveSolidValue(entry.originX, image.originX ?? .5);
    const originY = this.resolveSolidValue(entry.originY, image.originY ?? .5);
    const displayWidth = width * scaleX;
    const displayHeight = height * scaleY;
    return {
      frameName, width, height, scaleX, scaleY, worldX, worldY,
      left: worldX - displayWidth * originX,
      top: worldY - displayHeight * originY,
      right: worldX + displayWidth * (1 - originX),
      bottom: worldY + displayHeight * (1 - originY),
      flipX: !!this.resolveSolidValue(entry.flipX, image.flipX)
    };
  }

  getSolidMaskCollisionScore(u, v) {
    if (!this.solidMasks?.length) return 0;
    const foot = this.project(u, v);
    foot.y-=this.player.isoZ;
    const playerSamples = this.getPlayerCollisionSamples();
    if (!playerSamples.length) return 0;
    const worldSamples = playerSamples.map(sample => ({
      x: foot.x + sample.x,
      y: foot.y + sample.y,
      bodyY: sample.y
    }));
    const playerLeft = Math.min(...worldSamples.map(point => point.x));
    const playerRight = Math.max(...worldSamples.map(point => point.x));
    const playerTop = Math.min(...worldSamples.map(point => point.y));
    const playerBottom = Math.max(...worldSamples.map(point => point.y));

    let totalHits=0;
    for (const entry of this.solidMasks) {
      const geometry = this.getSolidGeometry(entry);
      if (!geometry) continue;
      if(entry.mode==='footprint'){
        const playerFootprint=this.player.getLogicalFootprintAt(foot.x,foot.y);
        const width=this.resolveSolidValue(entry.footprintWidth,24);
        const height=this.resolveSolidValue(entry.footprintHeight,12);
        const centerY=geometry.worldY+this.resolveSolidValue(entry.footprintYOffset,-height/2);
        const combinedX=playerFootprint.radiusX+width/2;
        const combinedY=playerFootprint.radiusY+height/2;
        const dx=(playerFootprint.x-geometry.worldX)/combinedX;
        const dy=(playerFootprint.y-centerY)/combinedY;
        const distanceSquared=dx*dx+dy*dy;
        if(distanceSquared<1)totalHits+=Math.max(1,Math.round((1-distanceSquared)*100));
        continue;
      }
      const targetMask = this.getTextureAlphaMask(entry.key, geometry.frameName);
      if (!targetMask) continue;
      if (playerRight < geometry.left || playerLeft >= geometry.right ||
          playerBottom < geometry.top || playerTop >= geometry.bottom) continue;
      const behindFacade = entry.mode === 'facade' && foot.y < entry.baseY - entry.behindMargin;
      const sourceEntry=entry.frameName===geometry.frameName
        ?entry:{...entry,frameName:geometry.frameName};
      let hits = 0;
      for (const point of worldSamples) {
        // Atrás de uma fachada, somente a faixa dos pés encontra a base. A
        // parte superior continua responsável pela oclusão, não por bloqueio.
        if (behindFacade && point.bodyY < -20) continue;
        if (point.x < geometry.left || point.x >= geometry.right ||
            point.y < geometry.top || point.y >= geometry.bottom) continue;
        let sourceX = Math.floor((point.x - geometry.left) / geometry.scaleX);
        const sourceY = Math.floor((point.y - geometry.top) / geometry.scaleY);
        if (geometry.flipX) sourceX = geometry.width - 1 - sourceX;
        if (sourceY < geometry.height * entry.sourceMinY ||
            sourceY >= geometry.height * entry.sourceMaxY) continue;
        if(this.isSolidSourcePoint(sourceEntry,targetMask,sourceX,sourceY))hits++;
      }
      if(hits>=entry.minHits)totalHits+=hits;
    }
    return totalHits;
  }

  isBlockedBySolidMasks(u, v) {
    return this.getSolidMaskCollisionScore(u,v)>0;
  }

  isWorldPointBlockedBySolidMasks(x,y,ignoreOwner=null) {
    for(const entry of this.solidMasks||[]){
      if(ignoreOwner&&entry.owner===ignoreOwner)continue;
      const geometry=this.getSolidGeometry(entry);
      if(!geometry||x<geometry.left||x>=geometry.right||y<geometry.top||y>=geometry.bottom)continue;
      if(entry.mode==='footprint'){
        const width=this.resolveSolidValue(entry.footprintWidth,24);
        const height=this.resolveSolidValue(entry.footprintHeight,12);
        const centerY=geometry.worldY+this.resolveSolidValue(entry.footprintYOffset,-height/2);
        const dx=(x-geometry.worldX)/(width/2);
        const dy=(y-centerY)/(height/2);
        if(dx*dx+dy*dy<1)return true;
        continue;
      }
      let sourceX=Math.floor((x-geometry.left)/geometry.scaleX);
      const sourceY=Math.floor((y-geometry.top)/geometry.scaleY);
      if(geometry.flipX)sourceX=geometry.width-1-sourceX;
      if(sourceX<0||sourceX>=geometry.width||sourceY<0||sourceY>=geometry.height)continue;
      if(sourceY<geometry.height*entry.sourceMinY||sourceY>=geometry.height*entry.sourceMaxY)continue;
      const mask=this.getTextureAlphaMask(entry.key,geometry.frameName);
      const sourceEntry=entry.frameName===geometry.frameName
        ?entry:{...entry,frameName:geometry.frameName};
      if(mask&&this.isSolidSourcePoint(sourceEntry,mask,sourceX,sourceY))return true;
    }
    return false;
  }

  isAmbientPositionBlocked(state,isoX,isoY){
    const radius=state.collisionRadius??8;
    if(this.isBlockedByCityBounds(isoX,isoY,state.logicalRadius??.12))return true;
    const foot=this.project(isoX,isoY);
    const samples=[
      [0,-3],[-radius,-3],[radius,-3],[-radius*.55,-7],[radius*.55,-7],[0,-9]
    ];
    return samples.some(([dx,dy])=>this.isWorldPointBlockedBySolidMasks(foot.x+dx,foot.y+dy,state.sprite));
  }

  isAmbientSegmentClear(state,target){
    return this.isAmbientRouteSegmentClear(state,{
      isoX:state.sprite.isoX,isoY:state.sprite.isoY
    },target);
  }

  isAmbientRouteSegmentClear(state,from,target){
    const du=target.isoX-from.isoX;
    const dv=target.isoY-from.isoY;
    const fromScreen=this.project(from.isoX,from.isoY);
    const targetScreen=this.project(target.isoX,target.isoY);
    const distance=Phaser.Math.Distance.Between(fromScreen.x,fromScreen.y,targetScreen.x,targetScreen.y);
    const steps=Math.max(2,Math.ceil(distance/10));
    for(let step=1;step<=steps;step++){
      const p=step/steps;
      if(this.isAmbientPositionBlocked(state,from.isoX+du*p,from.isoY+dv*p))return false;
    }
    return true;
  }

  isAmbientRouteClear(state){
    return state.route.every((target,index)=>{
      const from=state.route[(index-1+state.route.length)%state.route.length];
      return this.isAmbientRouteSegmentClear(state,from,target);
    });
  }

  createNpcs() {
    const fronts = Object.fromEntries(this.getBuildingPlan().filter(b => b.npc).map(b => [b.id, b.npc]));
    const healerRestored = this.isHealerFaithRestored();
    const specs = [
      ['merchant', 'Aldren Voss', 'Mercador', ...fronts.merchant, ['Tenho suprimentos para quem pretende atravessar os arredores.'], {shop: true, portrait: 'portrait_aldren', idleProfile: 'merchant', iso: 'merchant_iso', action: 'merchant_iso_action', height: 112, flipX: true}],
      ['blacksmith', 'Borin Ferramão', 'Ferreiro', ...fronts.blacksmith, ['Minha ferraria ainda está sendo reconstruída. Minhas ferramentas desapareceram durante a invasão.', 'Quando eu recuperar minhas ferramentas, poderei trabalhar novamente.'], {portrait: 'portrait_borin', idleProfile: 'blacksmith', iso: 'blacksmith_iso', action: 'blacksmith_iso_action', height: 114}],
      ['healer', 'Elara Veyn', 'Curandeira', ...fronts.healer, ['Perdi minha fé depois dos acontecimentos sombrios. Não consigo invocar minha bênção agora.', 'Talvez, quando minha fé retornar, eu possa ajudar os feridos novamente.'], {portrait: healerRestored?'portrait_elara':'portrait_elara_devastated', idleProfile: 'healer', iso: healerRestored?'healer_iso':'healer_iso_devastated', action: healerRestored?'healer_iso_action':'healer_iso_devastated_action', height: 112, actionFrameRate:healerRestored?4.5:2.8, actionRepeat:healerRestored?0:1, idleMinDelay:1100, idleMaxDelay:2300, actionPause:420}],
      ['tavernkeeper', 'Garrick Brenn', 'Taverneiro', ...fronts.tavern, ['A taverna ainda não abriu. Faltam alimentos e insumos para as bebidas.', 'Quando conseguirmos os suprimentos, espero abrir as portas novamente.'], {portrait: 'portrait_garrick', idleProfile: 'tavernkeeper', iso: 'tavernkeeper_iso', action: 'tavernkeeper_iso_action', height: 114}],
      ['scholar', 'Lysandra Vael', 'Erudita', ...fronts.scholar, ['O mundo perdeu o sentido depois dos acontecimentos sombrios...', 'Talvez um dia eu volte a estudar os antigos encantamentos.'], {portrait: 'portrait_lysandra', idleProfile: 'scholar', iso: 'scholar_iso', action: 'scholar_iso_action', height: 110}],
      ['artisan', 'Maelis Tessara', 'Artesã', ...fronts.artisan, ['Minha oficina ainda é simples, mas já consigo consertar panos e costuras.', 'Quando os caminhos estiverem seguros, vou transformá-la em uma verdadeira oficina encantada.'], {portrait: 'portrait_maelis', idleProfile: 'artisan', iso: 'artisan_iso', action: 'artisan_iso_action', height: 112}],
      // Mira fica na faixa norte da praça: fora do volume frontal da árvore do
      // Marco de Senda. As alturas usam o corpo opaco, não o canvas 208×224.
      ['elder_mira', 'Mira Edevane', 'Anciã de Aether', 14.25, 11.75, ['A floresta ficou perigosa. Se trouxer provas dos monstros, conversaremos sobre o assunto.'], {portrait: 'portrait_mira', idleProfile: 'elder', iso: 'elder_mira_iso', action: 'elder_mira_iso_action', height: 120, actionFrameRate:4.2, idleMinDelay:1800, idleMaxDelay:3400}],
      ['general', 'Cassian Vhal', 'General de Aether', 12.35, 15.15, ['Defender Aether está se tornando mais difícil a cada dia. Há monstros demais rondando os arredores, e meus soldados não podem vigiar todos os caminhos.', 'Mas escute bem: enquanto eu comandar estas muralhas, nenhum deles tomará esta cidade.'], {portrait: 'portrait_general', idleProfile: 'general', iso: 'general_iso', action: 'general_iso_action', height: 120, actionFrameRate:4.2, idleMinDelay:1800, idleMaxDelay:3400}],
      ['guard', 'Kael Dorn', 'Guarda do Portão Leste', 24.65, 11.75, ['Estamos protegendo a saída leste. Tenha cuidado ao deixar os muros.'], {portrait: 'portrait_kael', idleProfile: 'east_guard', iso: 'guard_iso', action: 'guard_iso_action', height: 124, gateGuard: true, facing:'northWest', actionFrameRate:5, actionRepeat:1, idleMinDelay:650, idleMaxDelay:1350, actionPause:260, initialIdleMin:300, initialIdleMax:650}],
      ['south_guard', 'Bren Harrow', 'Guarda do Sul', 11.75, 24.65, ['Mantemos esta passagem protegida. Lá fora, os monstros não respeitam ninguém.'], {portrait: 'portrait_bren', idleProfile: 'south_guard', iso: 'south_guard_iso', action: 'south_guard_iso_action', height: 124, gateGuard: true, facing:'northEast', flipX:true, actionFrameRate:5, actionRepeat:1, idleMinDelay:650, idleMaxDelay:1350, actionPause:260, initialIdleMin:300, initialIdleMax:650}]
    ];

    for (const [texture, name, role, u, v, pages, options] of specs) {
      const p = this.project(u, v);
      const npc = new Npc(this, p.x, p.y, name, pages, {
        shop: !!options.shop, role, portrait: options.portrait, idleProfile: options.idleProfile,
        idleFacing: options.facing ?? 'down', visualScale: options.scale ?? .60
      });
      const converted = options.iso && npc.setIsometricSprite?.(options.iso, {
        height: options.height, facing: options.facing ?? 'down', actionTexture: options.action, flipX: !!options.flipX,
        actionFrameRate:options.actionFrameRate,actionRepeat:options.actionRepeat,actionPause:options.actionPause,
        idleMinDelay:options.idleMinDelay,idleMaxDelay:options.idleMaxDelay,
        initialIdleMin:options.initialIdleMin,initialIdleMax:options.initialIdleMax
      });
      if (!converted) npc.setRealSprite?.(texture);
      npc.isoLogical = {u, v};
      npc.isGateGuard = !!options.gateGuard;
      npc.enableIsoPosition({
        tileWidth:AetherCityScene.TILE_WIDTH,
        tileHeight:AetherCityScene.TILE_HEIGHT,
        screenOriginX:AetherCityScene.ORIGIN_X,
        screenOriginY:AetherCityScene.ORIGIN_Y,
        depthBase:AetherCityScene.ISO_DEPTH_BASE,
        depthOffset:npc.isGateGuard ? .34 : .06
      },u,v,0);
      this.cityActors.push(npc);
      if (npc.sprite && npc.textureKey) {
        this.registerSolidMask(npc.sprite, npc.isoBaseTexture ?? npc.textureKey, {
          label: name,
          mode:'footprint',footprintWidth:24,footprintHeight:12,footprintYOffset:-10,
          frame: '__BASE',
          worldX: () => npc.x + (npc.sprite?.x ?? 0),
          worldY: () => npc.y + (npc.sprite?.y ?? 0),
          scaleX: () => npc.isoDisplayScale || Math.abs(npc.sprite?.scaleX) || 1,
          scaleY: () => npc.isoDisplayScale || Math.abs(npc.sprite?.scaleY) || 1,
          originX: .5, originY: 1,
          flipX: () => !!npc.sprite?.flipX,
          active:()=>npc.active&&npc.visible,
          minHits: 2
        });
      }
      if (texture === 'merchant') this.merchant = npc;
      if (texture === 'blacksmith') this.blacksmith = npc;
      if (texture === 'healer') this.healer = npc;
      if (texture === 'tavernkeeper') this.tavernKeeper = npc;
      if (texture === 'scholar') this.scholar = npc;
      if (texture === 'artisan') this.artisan = npc;
      if (texture === 'elder_mira') this.questNpc = npc;
      if (texture === 'general') this.general = npc;
      if (texture === 'guard') this.rightGuard = npc;
      if (texture === 'south_guard') this.bottomGuard = npc;
    }

    // Circuitos próprios e livres de footprints: nenhum andarilho depende de
    // colisor móvel, portanto não fica travado ao cruzar outra pessoa.
    // O circuito acompanha a cruz das ruas residenciais e contorna os quatro
    // novos lotes. Nenhum ponto atravessa a base de uma residência.
    const residentRoute = [[10.70,20.80],[9.80,21.20],[8.40,21.20],[6.60,21.20],[6.60,23.70],[6.60,24.70],[6.60,23.70],[6.60,21.20],[4.70,21.20],[3.00,21.20],[4.70,21.20],[6.60,21.20],[6.60,19.00],[6.60,17.10],[8.70,17.10],[10.70,17.10],[10.70,18.80]];
    const travelerRoute = [[9.8,11.5],[10.0,10.0],[11.8,9.0],[13.5,9.2],[15.0,9.0],[15.4,10.2],[15.0,11.4],[14.0,12.0],[12.4,11.8],[11.0,11.4]];
    this.walkers = [
      this.createWalker('resident', 'resident_iso_walk', 'Tomas Belmon', 'Morador de Aether', ['A praça ainda é o lugar mais seguro de Aether.'], residentRoute, 106, 44, 700, 'portrait_tomas'),
      this.createWalker('traveler', 'traveler_iso_walk', 'Darian Kestrel', 'Viajante', ['Ouvi rumores sobre o castelo.'], travelerRoute, 106, 50, 1100, 'portrait_darian')
    ];
    this.cityActors.push(...this.walkers);
  }

  createWalker(texture, isoTexture, name, role, pages, logicalRoute, targetHeight, speed, delay, portrait) {
    const route = logicalRoute.map(([u, v], index) => {
      const p = this.project(u, v);
      return {x: p.x, y: p.y, pause: 650 + (index % 3) * 130};
    });
    const first = route[0];
    const npc = new WanderingNpc(this, first.x, first.y, name, pages, route, {
      speed, startDelay: delay, role, portrait, idleProfile: texture, visualScale: .60
    });
    const converted = npc.setIsometricWalkSprite?.(isoTexture, {height: targetHeight, facing: 'south'});
    if (!converted) npc.setRealSprite?.(texture);
    npc.enableIsoPosition({
      tileWidth:AetherCityScene.TILE_WIDTH,
      tileHeight:AetherCityScene.TILE_HEIGHT,
      screenOriginX:AetherCityScene.ORIGIN_X,
      screenOriginY:AetherCityScene.ORIGIN_Y,
      depthBase:AetherCityScene.ISO_DEPTH_BASE,
      depthOffset:.04
    },logicalRoute[0][0],logicalRoute[0][1],0);
    npc.setIsoRoute(logicalRoute.map(([u,v],index)=>({
      isoX:u,isoY:v,isoZ:0,pause:650+(index%3)*130
    })));
    return npc;
  }

  createAmbientLife() {
    this.installAmbientAnimations();

    this.routeAmbient('city_dog', 'city-dog-walk', [[10.2,13.8],[10.7,12.2],[12.2,10.8],[14.0,10.6],[15.3,11.0],[15.3,11.8],[15.4,13.4],[16.5,14.4],[17.8,15.7],[16.7,15.6],[15.2,15.5],[13.5,15.5],[11.8,16.0]], .82, 34, 450);
    // Circuito curto ao sul da Taverna: cada trecho altera os dois eixos da
    // projeção e é pré-verificado contra as máscaras reais da cidade. Assim o
    // gato percorre terreno de verdade, em vez de parecer animado no mesmo
    // ponto ou atravessar a fachada/objetos da faixa norte.
    this.routeAmbient('city_cat', 'city-cat-walk', [
      [18.15,10.60],[19.42,10.72],[20.22,11.42],[19.86,12.36],
      [18.52,12.50],[17.74,11.70],[17.86,10.92]
    ], .82, 29, 1200, {routeLabel:'circuito seguro do gato'});

    this.createTavernRatCycle();

    this.createOldManAndBirdsIso();
  }

  createLowerWallSiege(){
    this.lowerWallSiege=new LowerWallSiege(this,{
      tileWidth:AetherCityScene.TILE_WIDTH,
      tileHeight:AetherCityScene.TILE_HEIGHT,
      originX:AetherCityScene.ORIGIN_X,
      originY:AetherCityScene.ORIGIN_Y,
      depthBase:AetherCityScene.ISO_DEPTH_BASE,
      project:(u,v)=>this.project(u,v)
    });
  }

  installAmbientAnimations() {
    const a = this.anims;
    const ensure = (key, texture, frames, rate) => {
      if (!this.textures.exists(texture)) {
        console.warn(`[AetherCity] recurso ambiente ausente: ${texture}`);
        return false;
      }
      if (!a.exists(key)) a.create({key, frames: a.generateFrameNumbers(texture, {frames}), frameRate: rate, repeat: -1});
      return a.exists(key);
    };
    ensure('city-dog-walk', 'city_dog', [0,1,2,3], 6);
    ensure('city-cat-walk', 'city_cat', [0,1,2,3], 7);
    ensure('elder-feed-birds', 'elder_feeder_iso', [0,1,2,3], 2.4);
    ensure('city-bird-peck', 'city_bird', [0,1,2,3], 4);
    ensure('city-rat-gray-run', 'city_rat_gray', [0,1,2,3], 7);
    ensure('city-rat-brown-run', 'city_rat_brown', [0,1,2,3], 7);
    ensure('city-rat-dark-run', 'city_rat_dark', [0,1,2,3], 7);
  }

  createTavernRatCycle() {
    const tavern = this.cityBuildings.find(item => item.id === 'tavern');
    if (!tavern?.image) return;
    const image = tavern.image;
    const screenRoute = {
      leftHidden: {x:image.x - image.displayWidth * .33, y:image.y - image.displayHeight * .17},
      leftReveal: {x:image.x - image.displayWidth * .48, y:image.y - 4},
      rightReveal: {x:image.x + image.displayWidth * .48, y:image.y - 4},
      rightHidden: {x:image.x + image.displayWidth * .33, y:image.y - image.displayHeight * .17}
    };
    this.tavernRatRoute=Object.fromEntries(Object.entries(screenRoute).map(([key,point])=>[
      key,{...this.unproject(point.x,point.y,0)}
    ]));
    this.tavernRatRoute.tavern=tavern;
    const start = this.tavernRatRoute.leftHidden;
    this.tavernRat = new IsoSprite({
      scene:this,isoX:start.x,isoY:start.y,isoZ:0,texture:'city_rat_gray',frame:0,
      tileWidth:AetherCityScene.TILE_WIDTH,tileHeight:AetherCityScene.TILE_HEIGHT,
      screenOriginX:AetherCityScene.ORIGIN_X,screenOriginY:AetherCityScene.ORIGIN_Y,
      depthBase:AetherCityScene.ISO_DEPTH_BASE,depthOffset:.035
    }).setScale(.76).setVisible(false).setAlpha(1);
    this.ambientActors.push(this.tavernRat);
    this.scheduleTavernRat(1100);
  }

  scheduleTavernRat(delay = Phaser.Math.Between(1700, 3600)) {
    this.tavernRatTimer?.remove(false);
    if(this.cityRegionActive===false){this.tavernRatTimer=null;return}
    this.tavernRatTimer = this.time.delayedCall(delay, () => this.runTavernRat());
  }

  runTavernRat() {
    const rat = this.tavernRat;
    if (!rat?.active || !this.tavernRatRoute) return;
    const variants = [
      ['city_rat_gray', 'city-rat-gray-run'],
      ['city_rat_brown', 'city-rat-brown-run'],
      ['city_rat_dark', 'city-rat-dark-run']
    ];
    const [texture, animation] = variants[Phaser.Math.Between(0, variants.length - 1)];
    const reverse = Phaser.Math.Between(0, 1) === 1;
    const route = reverse
      ? [this.tavernRatRoute.rightHidden, this.tavernRatRoute.rightReveal, this.tavernRatRoute.leftReveal, this.tavernRatRoute.leftHidden]
      : [this.tavernRatRoute.leftHidden, this.tavernRatRoute.leftReveal, this.tavernRatRoute.rightReveal, this.tavernRatRoute.rightHidden];
    rat.setTexture(texture, 0).setIsoPosition(route[0].x,route[0].y,0).setFlipX(route[3].x < route[0].x)
      .setVisible(true).setAlpha(1).play(animation, true);

    const moveIso=(target,duration,onComplete)=>{
      const motion={isoX:rat.isoX,isoY:rat.isoY};
      const tween=this.tweens.add({
        targets:motion,isoX:target.x,isoY:target.y,duration,ease:'Linear',
        onUpdate:()=>rat.setIsoPosition(motion.isoX,motion.isoY,0),
        onComplete:()=>{this.tavernRatTweens=this.tavernRatTweens.filter(item=>item!==tween);rat.setIsoPosition(target.x,target.y,0);onComplete?.()}
      });
      this.tavernRatTweens.push(tween);
      if(this.cityRegionActive===false)tween.pause();
    };
    moveIso(route[1],420,()=>{
      moveIso(route[2],Phaser.Math.Between(1500,1850),()=>{
        moveIso(route[3],420,()=>{
          rat.stop().setVisible(false).setAlpha(1);
          this.scheduleTavernRat();
        });
      });
    });
  }

  routeAmbient(texture, animation, logicalRoute, scale, speed, startDelay, options = {}) {
    const route = logicalRoute.map(([isoX, isoY]) => ({isoX,isoY,isoZ:0,pause:520+Phaser.Math.Between(0,500)}));
    const first = route[0];
    const sprite = new IsoSprite({
      scene:this,isoX:first.isoX,isoY:first.isoY,isoZ:0,texture,frame:0,
      tileWidth:AetherCityScene.TILE_WIDTH,tileHeight:AetherCityScene.TILE_HEIGHT,
      screenOriginX:AetherCityScene.ORIGIN_X,screenOriginY:AetherCityScene.ORIGIN_Y,
      depthBase:AetherCityScene.ISO_DEPTH_BASE,depthOffset:.03
    }).setScale(scale);
    sprite.play(animation);
    const collisionRadius=texture==='city_dog'?11:8;
    const state = {
      sprite,route,index:1,lastWaypointIndex:0,direction:1,speed,animation,
      collisionRadius,logicalRadius:texture==='city_dog'?.16:.12,
      motion:{isoX:first.isoX,isoY:first.isoY},lastSafe:{isoX:first.isoX,isoY:first.isoY},
      tween:null,repathPending:false,routeLabel:options.routeLabel??texture
    };
    this.registerSolidMask(sprite,texture,{
      label:texture==='city_dog'?'cachorro da cidade':'gato da cidade',
      mode:'footprint',
      footprintWidth:texture==='city_dog'?24:18,
      footprintHeight:texture==='city_dog'?12:10,
      footprintYOffset:texture==='city_dog'?-22:-15,
      frame:()=>sprite.frame?.name??0,
      sourceMinY:.48,sourceMaxY:1,alphaThreshold:32,minHits:1,
      owner:sprite,dynamic:true
    });
    this.ambientActors.push(sprite);
    this.ambientRouteStates.push(state);
    state.routeClear=this.isAmbientRouteClear(state);
    if (!state.routeClear) console.warn(`[AetherCity] rota ambiente bloqueada: ${state.routeLabel}`);
    this.time.delayedCall(startDelay, () => this.walkAmbientRoute(state));
    return sprite;
  }

  walkAmbientRoute(state) {
    if (!state?.sprite?.active||state.repathPending) return;
    const sprite = state.sprite;
    const target = state.route[state.index % state.route.length];
    if(!this.isAmbientSegmentClear(state,target)){
      state.direction*=-1;
      state.index=(state.lastWaypointIndex+state.direction+state.route.length)%state.route.length;
      this.time.delayedCall(260,()=>this.walkAmbientRoute(state));
      return;
    }
    const targetScreen=sprite.isoToScreen(target.isoX,target.isoY,target.isoZ);
    const distance = Phaser.Math.Distance.Between(sprite.x,sprite.y,targetScreen.x,targetScreen.y);
    if(distance<2){
      state.lastWaypointIndex=state.index;
      state.index=(state.index+state.direction+state.route.length)%state.route.length;
      this.time.delayedCall(target.pause,()=>this.walkAmbientRoute(state));
      return;
    }
    sprite.setFlipX(targetScreen.x < sprite.x).play(state.animation, true);
    state.motion={isoX:sprite.isoX,isoY:sprite.isoY};
    state.lastSafe={isoX:sprite.isoX,isoY:sprite.isoY};
    const abortAndReverse=()=>{
      if(state.repathPending)return;
      state.repathPending=true;
      state.tween?.stop();
      state.tween=null;
      sprite.setIsoPosition(state.lastSafe.isoX,state.lastSafe.isoY,target.isoZ);
      state.direction*=-1;
      state.index=state.lastWaypointIndex;
      this.time.delayedCall(280,()=>{state.repathPending=false;this.walkAmbientRoute(state)});
    };
    state.tween=this.tweens.add({
      targets:state.motion,isoX:target.isoX,isoY:target.isoY,
      duration:Math.max(420,distance/state.speed*1000),ease:'Linear',
      onUpdate:()=>{
        if(this.isAmbientPositionBlocked(state,state.motion.isoX,state.motion.isoY)){abortAndReverse();return}
        state.lastSafe={isoX:state.motion.isoX,isoY:state.motion.isoY};
        sprite.setIsoPosition(state.motion.isoX,state.motion.isoY,target.isoZ);
      },
      onComplete: () => {
        if(state.repathPending)return;
        state.tween=null;
        sprite.setIsoPosition(target.isoX,target.isoY,target.isoZ);
        state.lastWaypointIndex=state.index;
        state.index=(state.index+state.direction+state.route.length)%state.route.length;
        this.time.delayedCall(target.pause, () => this.walkAmbientRoute(state));
      }
    });
  }

  createOldManAndBirdsIso() {
    // O velhinho fica acima e à direita da fonte, com separação suficiente
    // para não se sobrepor ao volume frontal dela; os pombos mantêm a mesma
    // relação espacial com ele durante a alimentação.
    const homeLogical = {u: 12.75, v: 10.25};
    const home = this.project(homeLogical.u, homeLogical.v);
    // Um recurso ambiente opcional nunca pode impedir a criação da cidade.
    // Os quatro quadros usam célula, escala corporal e linha dos pés idênticas.
    if (this.textures.exists('elder_feeder_iso')) {
      const elderScale = 110 / 224;
      this.oldMan = new IsoSprite({
        scene:this,isoX:homeLogical.u,isoY:homeLogical.v,isoZ:0,texture:'elder_feeder_iso',frame:0,
        tileWidth:AetherCityScene.TILE_WIDTH,tileHeight:AetherCityScene.TILE_HEIGHT,
        screenOriginX:AetherCityScene.ORIGIN_X,screenOriginY:AetherCityScene.ORIGIN_Y,
        depthBase:AetherCityScene.ISO_DEPTH_BASE,depthOffset:.05
      }).setScale(elderScale);
      if (this.anims.exists('elder-feed-birds')) this.oldMan.play('elder-feed-birds');
      this.ambientActors.push(this.oldMan);
      this.registerSolidMask(this.oldMan,'elder_feeder_iso',{
        label:'velhinho da praça',frame:()=>this.oldMan?.frame?.name??0,
        mode:'footprint',footprintWidth:24,footprintHeight:12,footprintYOffset:-8,
        sourceMinY:.48,sourceMaxY:1,alphaThreshold:34,minHits:2,
        owner:this.oldMan,dynamic:true
      });
    } else {
      console.warn('[AetherCity] elder_feeder_iso indisponível; cena mantida sem o velhinho.');
      this.oldMan = null;
    }

    if (!this.textures.exists('city_bird')) return;
    [[13.10,10.40,.75], [13.45,10.67,.70], [12.85,10.85,.66], [13.63,10.31,.63]].forEach(([u,v,scale], i) => {
      const bird = new IsoSprite({
        scene:this,isoX:u,isoY:v,isoZ:0,texture:'city_bird',frame:i%2,
        tileWidth:AetherCityScene.TILE_WIDTH,tileHeight:AetherCityScene.TILE_HEIGHT,
        screenOriginX:AetherCityScene.ORIGIN_X,screenOriginY:AetherCityScene.ORIGIN_Y,
        depthBase:AetherCityScene.ISO_DEPTH_BASE,depthOffset:.03
      }).setScale(scale);
      this.time.delayedCall(i * 260, () => {
        if (bird.active && this.anims.exists('city-bird-peck')) bird.play('city-bird-peck');
      });
      this.ambientActors.push(bird);
    });
  }

  setupInput() {
    this.cursors = this.input.keyboard.createCursorKeys();
    this.keys = this.input.keyboard.addKeys('W,A,S,D');
    this.fKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.F);
    this.tKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.T);
    this.escKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.ESC);
    this.shopClose = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.T);
    this.basicAttackKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);
    this.primaryAbilityKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.Q);
    this.secondaryAbilityKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.ONE);
    this.mobilityAbilityKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.TWO);
  }

  setupHud() {
    const C = AetherCityScene;
    const cityMarkers=[
      {...this.project(10.0,6.3),u:10.0,v:6.3,color:0xffa35a,label:'⚒ Ferraria'},
      {...this.project(6.6,13.35),u:6.6,v:13.35,color:0xf0c66b,label:'◈ Mercado'},
      {...this.project(19.55,6.65),u:19.55,v:6.65,color:0xe0a05c,label:'♜ Taverna'},
      {...this.project(14.85,6.3),u:14.85,v:6.3,color:0x83dfc7,label:'✚ Curandeira'},
      {...this.project(6.4,8.35),u:6.4,v:8.35,color:0xa9a4f5,label:'⌘ Erudita'},
      {...this.project(17.5,17.8),u:17.5,v:17.8,color:0x7ee0ff,label:'✦ Marco'},
      {...this.project(26,14),u:26,v:14,color:0xffd166,label:'Portão Leste'},
      {...this.project(14,26),u:14,v:26,color:0x73e6a8,label:'Portão Sul'}
    ];
    this.isSafeZone=this.isPlayerInsideCity();
    const localName=this.aetherTerritory.getLocalName(this.player.isoX,this.player.isoY);
    this.hud = new MapHud(this, {
      player: this.player, inventory: this.inv, equipment: this.equip, abilities: this.abilities, skills: this.skillManager,
      save: () => this.saveGame(), onMenu: () => this.goMenu(), worldWidth: C.WORLD_WIDTH, worldHeight: C.WORLD_HEIGHT,
      logicalBounds:AETHER_LOGICAL_BOUNDS,
      mapTexture:this.aetherTerritory.mapKey,mapProjection:'aether-territory',localName,
      markers:[...cityMarkers,...this.aetherTerritory.getMapMarkers()],
      minimapMarkers:this.aetherTerritory.getMinimapMarkers()
    });
    this.shop = new ShopPanel(this, this.player, this.inv, this.equip, () => this.saveGame());
    this.dialogue = new ChoiceDialogueBox(this);
    this.npcDialogue = new NpcDialoguePanel(this);
    this.shop.visible = false;
    this.death = new DeathOverlay(this);

    const center = this.project(17.50, 17.80);
    // A nova plataforma larga ocupa o losango verde completo. A origem fica
    // próxima à borda frontal, portanto 24 px compensam seu centro visual.
    const waystoneY = center.y + 24;
    this.waystone = new Waystone(this, center.x, waystoneY, 'CIDADE DE AETHER','waystone_city_dormant');
    this.waystone.setDepth(this.cityDepth(center.y, .07));
    this.waystone.sprite?.setDisplaySize(246, 205);
    if (this.waystone.sprite) {
      this.registerOccluder(this.waystone.sprite, 'waystone_city_dormant', center.y + 18, {
        worldX: center.x, worldY: waystoneY,
        originX: this.waystone.sprite.originX, originY: this.waystone.sprite.originY
      });
      this.registerSolidMask(this.waystone.sprite, 'waystone_city_dormant', {
        label: 'Marco de Senda',
        worldX: () => this.waystone.x + (this.waystone.sprite?.x ?? 0),
        worldY: () => this.waystone.y + (this.waystone.sprite?.y ?? 0),
        originX: () => this.waystone.sprite?.originX ?? .5,
        originY: () => this.waystone.sprite?.originY ?? .88,
        scaleX: () => Math.abs(this.waystone.sprite?.scaleX) || 1,
        scaleY: () => Math.abs(this.waystone.sprite?.scaleY) || 1,
        minHits: 2
      });
    }
  }

  createCityBanner() {
    this.cityBanner = this.add.text(22, 18, 'AETHER  •  TERRITÓRIO CONTÍNUO', {
      fontFamily: 'Georgia, serif', fontSize: 14, color: '#f0d392', fontStyle: 'bold',
      backgroundColor: '#101821dd', padding: {left: 11, right: 11, top: 7, bottom: 7},
      stroke: '#090d12', strokeThickness: 2
    }).setScrollFactor(0).setDepth(1700);
    this.tweens.add({targets: this.cityBanner, alpha: 0, delay: 2600, duration: 700});
  }

  update(_time, delta) {
    const activeSector=this.aetherTerritory.update(_time,this.player.isoX,this.player.isoY);
    this.isSafeZone=this.isPlayerInsideCity();
    this.setCityRegionActive(this.player.isoX<=44&&this.player.isoY<=44);
    this.lowerWallSiege?.setRegionActive?.(this.player.isoX<=42&&this.player.isoY<=42);
    this.hud.setLocalName(this.aetherTerritory.getLocalName(this.player.isoX,this.player.isoY));
    this.registry.set('aetherActiveSector',activeSector);
    this.updateNpcPrompts();
    this.updateActorDepths();

    if (this.dialogueOpen) {
      this.stopPlayer();
      if (this.npcDialogue?.isOpen?.()) {
        if (Phaser.Input.Keyboard.JustDown(this.escKey)) { this.closeDialogue(false); return; }
        if (Phaser.Input.Keyboard.JustDown(this.tKey) && this.npcDialogue.hasSecondaryAction?.()) { this.npcDialogue.triggerSecondary(); return; }
        if (Phaser.Input.Keyboard.JustDown(this.fKey)) { if (!this.npcDialogue.advance()) this.closeDialogue(!!this.scriptedDialogueCompletion); return; }
      } else if (Phaser.Input.Keyboard.JustDown(this.fKey) || Phaser.Input.Keyboard.JustDown(this.escKey)) {
        this.closeDialogue(false); return;
      }
      return;
    }
    if (this.shop.visible) { this.stopPlayer(); this.handleShop(); return; }
    if (this.hud.handle({collect: () => this.tryCollect(), talk: () => this.tryTalkOrWaystone(), shop: () => this.tryShop(), afterAction: () => this.saveGame()})) {
      this.stopPlayer(); this.hud.update(); return;
    }
    if (this.player.isDead()) { this.handleDeath(); return; }

    this.moveIsometric(delta);
    this.handlePrologueCombat();
    this.prologue?.update?.(_time,delta);
    this.waystone.updatePrompt(this.player.x, this.player.y);
    this.hud.update();
  }

  isPlayerInsideCity(u=this.player.isoX,v=this.player.isoY){
    return u>=AetherCityScene.CITY_MIN&&u<=AetherCityScene.CITY_MAX&&v>=AetherCityScene.CITY_MIN&&v<=AetherCityScene.CITY_MAX;
  }

  setCityRegionActive(value){
    value=!!value;
    const previous=this.cityRegionActive;
    if(previous===value)return;
    this.cityRegionActive=value;
    for(const npc of this.cityActors.filter(Boolean)){
      npc.setActive?.(value);npc.setNpcVisible?.(value);
      if(!value)npc.pauseRoute?.();
      else if(previous===false)npc.resumeRoute?.();
    }
    for(const actor of this.ambientActors.filter(Boolean)){
      actor.setActive?.(value);
      actor.setVisible?.(actor===this.tavernRat?value&&this.tavernRatTweens.length>0:value);
      if(value)actor.anims?.resume?.();else actor.anims?.pause?.();
    }
    for(const state of this.ambientRouteStates){
      if(value){
        state.tween?.resume?.();
        if(previous===false&&!state.tween&&!state.repathPending)this.time.delayedCall(80,()=>this.walkAmbientRoute(state));
      }else state.tween?.pause?.();
    }
    for(const tween of this.tavernRatTweens){if(value)tween?.resume?.();else tween?.pause?.()}
    for(const smoke of this.chimneySmokes||[])smoke.setVisible(value);
    this.fountainWater?.setActive?.(value);
    if(!value&&this.tavernRatTimer)this.tavernRatTimer.paused=true;
    if(value&&previous===false){
      this.tavernRatTimer?.remove?.(false);this.tavernRatTimer=null;
      if(!this.tavernRatTweens.length)this.scheduleTavernRat(480);
    }
  }

  moveIsometric(delta = 16.667) {
    const ix = (this.cursors.right.isDown || this.keys.D.isDown ? 1 : 0) - (this.cursors.left.isDown || this.keys.A.isDown ? 1 : 0);
    const iy = (this.cursors.down.isDown || this.keys.S.isDown ? 1 : 0) - (this.cursors.up.isDown || this.keys.W.isDown ? 1 : 0);
    if (!(ix || iy)) { this.stopPlayer(); return; }

    const dt = Math.min(delta / 1000, .034);
    const velocity=playerScreenVelocity(ix,iy,this.player.speed);
    // A entrada é cartesiana e inequívoca: W/S controlam o eixo vertical da
    // tela e A/D o horizontal. Só então aplicamos uma única inversa 2:1.
    const full=screenVelocityToIsoDelta(
      velocity.x,velocity.y,dt,AetherCityScene.TILE_WIDTH,AetherCityScene.TILE_HEIGHT
    );
    const horizontal=screenVelocityToIsoDelta(
      velocity.x,0,dt,AetherCityScene.TILE_WIDTH,AetherCityScene.TILE_HEIGHT
    );
    const vertical=screenVelocityToIsoDelta(
      0,velocity.y,dt,AetherCityScene.TILE_WIDTH,AetherCityScene.TILE_HEIGHT
    );
    const moved=this.tryMoveWithSliding(full,horizontal,vertical);
    this.player.updateFacing(velocity.inputX,velocity.inputY);
    this.player.playMove(moved);
    this.updatePlayerProjection();
  }

  stopPlayer() {
    this.player.body?.setVelocity(0, 0);
    this.player.playMove(false);
    this.updatePlayerProjection();
  }

  handlePrologueCombat(){
    const targets=this.prologue?.getCombatTargets?.()||[];
    if(!targets.length)return;
    if(Phaser.Input.Keyboard.JustDown(this.basicAttackKey)){
      const classId=this.player.characterClass;
      const option=classId==='mage'
        ? {name:'Rajada Arcana',range:132,damageMultiplier:.96}
        : classId==='ranger'
          ? {name:'Tiro Básico',range:164,damageMultiplier:.9}
          : {name:'Corte Básico',range:68,damageMultiplier:1};
      if(this.combat.playerAttack(this.player,targets,option))this.showActionMessage(option.name);
    }
    if(Phaser.Input.Keyboard.JustDown(this.primaryAbilityKey))this.abilities.use('primary',targets);
    if(Phaser.Input.Keyboard.JustDown(this.secondaryAbilityKey))this.abilities.use('secondary',targets);
    if(Phaser.Input.Keyboard.JustDown(this.mobilityAbilityKey))this.abilities.use('mobility',targets);
  }

  tryCollect(){
    if(this.prologue?.tryCollect?.())return;
    this.showActionMessage('Não há itens próximos.');
  }

  tryMoveStep(du,dv) {
    if(!(du||dv))return false;
    const u=this.player.isoX+du,v=this.player.isoY+dv;
    if(this.isBlockedByCityBounds(u,v,this.playerIsoRadius))return false;
    if(this.prologue?.isPlayerBlockedAt?.(u,v,this.playerIsoRadius))return false;
    const currentScore=this.getSolidMaskCollisionScore(this.player.isoX,this.player.isoY);
    const nextScore=this.getSolidMaskCollisionScore(u,v);
    // Um save antigo sobreposto ainda pode escapar, mas nunca aprofundar a
    // interseção. Esta regra vale para máscaras e footprints lógicos.
    const escapingExistingOverlap=currentScore>0&&nextScore<=currentScore;
    if(nextScore>0&&!escapingExistingOverlap)return false;
    this.player.setIsoPosition(u,v,this.player.isoZ);
    return true;
  }

  tryMoveWithSliding(full,horizontal,vertical) {
    // O vetor completo é testado primeiro. Em contato, os componentes
    // cartesianos da tela são tentados separadamente: uma diagonal bloqueada
    // ao norte ainda pode deslizar para oeste, inclusive em A+W.
    const steps=Math.max(1,Math.ceil(Math.max(Math.abs(full.u),Math.abs(full.v))/.035));
    const fullStep={u:full.u/steps,v:full.v/steps};
    const components=[
      {u:horizontal.u/steps,v:horizontal.v/steps},
      {u:vertical.u/steps,v:vertical.v/steps}
    ];
    let moved=false;
    for(let index=0;index<steps;index++){
      if(this.tryMoveStep(fullStep.u,fullStep.v)){moved=true;continue}
      let slid=false;
      for(const component of components){
        if(this.tryMoveStep(component.u,component.v)){moved=true;slid=true}
      }
      if(!slid)break;
    }
    return moved;
  }

  isOutsideCityWallEnvelope(u, v, radius) {
    const C = AetherCityScene;
    // Bloqueia somente a faixa física da muralha. Estar do lado de fora não é
    // mais inválido; o jogador atravessa a faixa pelos dois arcos e continua
    // caminhando no mesmo sistema lógico.
    const overlaps=(value,start,end)=>value+radius>=start&&value-radius<=end;
    const alongWall=(value)=>overlaps(value,1.15,26.85);
    const insideEastGate=v-radius>C.GATE_MIN&&v+radius<C.GATE_MAX;
    const insideSouthGate=u-radius>C.GATE_MIN&&u+radius<C.GATE_MAX;
    if(overlaps(u,1.18,3.12)&&alongWall(v))return true;
    if(overlaps(v,1.18,3.12)&&alongWall(u))return true;
    if(overlaps(u,25.22,27.35)&&alongWall(v)&&!insideEastGate)return true;
    if(overlaps(v,25.22,27.35)&&alongWall(u)&&!insideSouthGate)return true;
    return false;
  }

  isBlockedByCityBounds(u, v, radius) {
    if(this.aetherTerritory?.isLogicalBarrierBlocked(u,v,radius))return true;
    if (this.isBlockedByLowerWallSiegeZone(u,v,radius)) return true;
    if (this.isOutsideCityWallEnvelope(u, v, radius)) return true;
    return false;
  }

  isBlockedByLowerWallSiegeZone(u,v,radius){
    // O cerco é cenográfico, mas cada estação possui uma pequena zona física.
    // Isso impede alcançar/atacar os atores sem fechar todo o território.
    const stations=[
      {u:6.35,v:26.82},{u:10.15,v:26.82},{u:18.10,v:26.82},{u:21.65,v:26.82},
      {u:26.82,v:11.05},{u:26.82,v:18.55}
    ];
    return stations.some(station=>{
      const du=(u-station.u)/(1.02+radius),dv=(v-station.v)/(1.08+radius);
      return du*du+dv*dv<=1;
    });
  }

  isBlocked(u, v, radius) {
    return this.isBlockedByCityBounds(u,v,radius)||this.isBlockedBySolidMasks(u,v);
  }

  updatePlayerProjection() {
    this.player.updateIsoPosition();
    this.player.body?.setVelocity(0, 0);
    this.playerNaturalDepth = this.player.depth;
    this.player.setVisualVisible(true).setVisualAlpha(1).setVisualDepth(this.playerNaturalDepth);
    this.syncPlayerOcclusionOutline();
    this.updateUniversalOcclusion();
    this.occlusionManager?.checkPlayerOcclusion(this.player);
  }

  syncPlayerOcclusionOutline() {
    const outline = this.playerOutline;
    const visual=this.player.getVisualSprite();
    if (!outline?.active || !visual?.frame) return;
    outline.setIsoPosition(this.player.isoX,this.player.isoY,this.player.isoZ)
      .setScale(visual.scaleX,visual.scaleY)
      .setFlipX(visual.flipX).setFlipY(visual.flipY);
  }

  clearPlayerOcclusionOverlay() {
    if(!this.playerOcclusionActive){
      this.playerOcclusionSignature='';
      this.playerOcclusionDepth=-Infinity;
      this.playerOutline?.setVisible(false);
      return;
    }
    this.playerOcclusionImageData?.data?.fill(0);
    const context=this.playerOcclusionTexture?.getContext?.();
    if(context&&this.playerOcclusionImageData){
      context.putImageData(this.playerOcclusionImageData,0,0);
      this.playerOcclusionTexture.refresh();
    }
    this.playerOcclusionActive=false;
    this.playerOcclusionSignature='';
    this.playerOcclusionDepth=-Infinity;
    this.playerOutline?.setVisible(false);
  }

  updateUniversalOcclusion() {
    const outline = this.playerOutline;
    const visual=this.player.getVisualSprite();
    // O sprite normal permanece no depth lógico. O próprio renderer o recorta
    // naturalmente atrás dos pixels opacos do objeto; somente o fragmento
    // dourado calculado abaixo é desenhado acima da parte que o encobre.
    this.player.setVisualDepth(this.playerNaturalDepth+.001)
      .setVisualVisible(true).setVisualAlpha(1);
    const outlineKey=this.player.getOutlineTextureKey();
    if(!outline?.active||!visual?.active||!this.occluders?.length||
       !this.textures.exists(outlineKey)){
      this.clearPlayerOcclusionOverlay();
      return;
    }

    const frameName=visual.frame?.name??this.player.getIdleFrame();
    const outlinePixels=this.getTextureRgbaData(outlineKey,frameName);
    if(!outlinePixels||!this.playerOcclusionTexture){
      this.clearPlayerOcclusionOverlay();
      return;
    }
    const scaleX=Math.abs(visual.scaleX)||1,scaleY=Math.abs(visual.scaleY)||1;
    const playerLeft=this.player.x-outlinePixels.width*scaleX*visual.originX;
    const playerTop=this.player.y-outlinePixels.height*scaleY*visual.originY;
    const playerRight=playerLeft+outlinePixels.width*scaleX;
    const playerBottom=playerTop+outlinePixels.height*scaleY;
    const candidates=[];
    for (const occluder of this.occluders) {
      const geometry=this.getOccluderGeometry(occluder);
      if(!geometry||!this.isOccluderInFrontOfPlayer(occluder,geometry))continue;
      // A caixa serve somente como broad phase. A decisão final é tomada em
      // cada pixel contra o alpha real da parte frontal do objeto.
      if(playerRight<geometry.left||playerLeft>=geometry.right||
         playerBottom<geometry.top||playerTop>=geometry.bottom)continue;
      const mask=this.getTextureAlphaMask(occluder.key,geometry.frameName);
      if(mask)candidates.push({entry:occluder,geometry,mask});
    }
    if(!candidates.length){
      this.clearPlayerOcclusionOverlay();
      return;
    }

    const signature=[outlineKey,String(frameName),visual.flipX?1:0,visual.flipY?1:0,
      Math.round(this.player.x*16),Math.round(this.player.y*16),
      ...candidates.map(({entry,geometry})=>
        `${entry.key}:${String(geometry.frameName)}:${Math.round(geometry.worldX*8)}:${Math.round(geometry.worldY*8)}`
      )].join('|');
    if(signature===this.playerOcclusionSignature){
      outline.setVisible(this.playerOcclusionActive).setAlpha(1);
      if(this.playerOcclusionActive)outline.setDepth(this.playerOcclusionDepth);
      return;
    }

    const context=this.playerOcclusionTexture.getContext();
    if(!this.playerOcclusionImageData||
       this.playerOcclusionImageData.width!==outlinePixels.width||
       this.playerOcclusionImageData.height!==outlinePixels.height){
      this.playerOcclusionTexture.setSize(outlinePixels.width,outlinePixels.height);
      this.playerOcclusionImageData=context.createImageData(outlinePixels.width,outlinePixels.height);
    }
    const output=this.playerOcclusionImageData.data;
    output.fill(0);
    let occludedPixelCount=0;
    let highestOccluderDepth=-Infinity;
    for(let sourceY=0;sourceY<outlinePixels.height;sourceY++)for(let sourceX=0;sourceX<outlinePixels.width;sourceX++){
      const pixelIndex=(sourceY*outlinePixels.width+sourceX)*4;
      if(outlinePixels.rgba[pixelIndex+3]<24)continue;
      const displayX=visual.flipX?outlinePixels.width-1-sourceX:sourceX;
      const displayY=visual.flipY?outlinePixels.height-1-sourceY:sourceY;
      const worldX=this.player.x+(displayX+.5-outlinePixels.width*visual.originX)*scaleX;
      const worldY=this.player.y+(displayY+.5-outlinePixels.height*visual.originY)*scaleY;
      let occludingDepth=-Infinity;
      for(const candidate of candidates){
        if(this.occluderContainsWorldPoint(candidate,worldX,worldY))
          occludingDepth=Math.max(occludingDepth,candidate.geometry.depth);
      }
      if(occludingDepth===-Infinity)continue;
      output[pixelIndex]=outlinePixels.rgba[pixelIndex];
      output[pixelIndex+1]=outlinePixels.rgba[pixelIndex+1];
      output[pixelIndex+2]=outlinePixels.rgba[pixelIndex+2];
      output[pixelIndex+3]=outlinePixels.rgba[pixelIndex+3];
      highestOccluderDepth=Math.max(highestOccluderDepth,occludingDepth);
      occludedPixelCount++;
    }

    // Dois pixels para entrar e zero para sair formam uma histerese discreta
    // nas bordas, sem tween ou alpha intermediário que pudesse piscar.
    const showFragment=this.playerOcclusionActive?occludedPixelCount>0:occludedPixelCount>=2;
    context.putImageData(this.playerOcclusionImageData,0,0);
    this.playerOcclusionTexture.refresh();
    this.playerOcclusionSignature=signature;
    this.playerOcclusionActive=showFragment;
    this.playerOcclusionDepth=showFragment?highestOccluderDepth+.32:-Infinity;
    outline.setVisible(showFragment).setAlpha(1);
    if(showFragment)outline.setDepth(this.playerOcclusionDepth);
  }

  updateActorDepths() {
    for (const actor of this.cityActors) {
      if(!actor?.active)continue;
      if (actor?.updateIsoPosition) actor.updateIsoPosition();
      else actor?.setDepth(this.cityDepth(actor.y, actor.isGateGuard ? .34 : .06));
    }
    for (const actor of this.ambientActors) {
      if(!actor?.active)continue;
      if (actor?.updateIsoPosition) actor.updateIsoPosition();
      else actor?.setDepth(this.cityDepth(actor.y, .03));
    }
  }

  updateNpcPrompts() {
    for (const npc of this.cityActors.filter(Boolean)) {
      if(!npc.active){npc.setNearby(false);continue}
      const distance = Phaser.Math.Distance.Between(this.player.x, this.player.y, npc.x, npc.y);
      npc.setPrompt(npc === this.merchant && distance < 96 ? 'F • Conversar   T • Loja' : 'F • Conversar');
      npc.setNearby(distance < 96);
    }
  }

  tryTalkOrWaystone() {
    if(this.prologue?.tryInteract?.())return;
    if (this.isNearWaystone()) { this.readWaystone(); return; }
    this.tryTalk();
  }

  openScriptedDialogue(config={},onComplete){
    const npc=config.npc||null;
    this.dialogueOpen=true;
    this.hud.openExternalModal();
    this.activeDialogueNpc=npc;
    this.scriptedDialogueCompletion=typeof onComplete==='function'?onComplete:null;
    npc?.pauseRoute?.();npc?.showConversationIcon?.();
    this.prologue?.hideCue?.();
    this.npcDialogue.open({
      name:config.name||npc?.npcName||'Aether',role:config.role||npc?.npcRole||'',pages:config.pages||['...'],
      portraitKey:config.portraitKey||npc?.npcPortrait,spriteKey:config.spriteKey||npc?.isoBaseTexture||npc?.textureKey,
      spriteFrame:config.spriteFrame??0,flipX:config.flipX??!!npc?.sprite?.flipX,secondaryAction:null,
      onPrimary:()=>{if(!this.npcDialogue.advance())this.closeDialogue(true);},
      onClose:()=>this.closeDialogue(false)
    });
  }

  tryTalk() {
    let near = null, best = Infinity;
    for (const npc of this.cityActors.filter(Boolean)) {
      const distance = Phaser.Math.Distance.Between(this.player.x, this.player.y, npc.x, npc.y);
      if (distance < best) { best = distance; near = npc; }
    }
    if (!near || best > 96) { this.showActionMessage('Aproxime-se de um NPC para conversar.'); return; }

    this.scriptedDialogueCompletion=null;
    this.dialogueOpen = true;
    this.hud.openExternalModal();
    this.activeDialogueNpc = near;
    near.pauseRoute?.();
    near.showConversationIcon?.();
    const secondaryAction = near === this.merchant ? {key: 'T', label: 'Loja', type: 'shop'} : null;
    this.npcDialogue.open({
      name: near.npcName, role: near.npcRole || '', pages: near.text, portraitKey: near.npcPortrait,
      spriteKey: near.isoBaseTexture ?? near.textureKey, spriteFrame: 0, flipX: !!near.sprite?.flipX,
      secondaryAction,
      onSecondary: () => { if (near === this.merchant) { this.closeDialogue(false); this.shop.open(); this.hud.openExternalModal(); } },
      onPrimary: () => { if (!this.npcDialogue.advance()) this.closeDialogue(false); },
      onClose: () => this.closeDialogue(false)
    });
  }

  tryShop() {
    const distance = Phaser.Math.Distance.Between(this.player.x, this.player.y, this.merchant.x, this.merchant.y);
    if (distance > 96) { this.showActionMessage('Aproxime-se de Aldren Voss para abrir a loja.'); return; }
    this.shop.open();
    this.hud.openExternalModal();
  }

  handleShop() {
    if (Phaser.Input.Keyboard.JustDown(this.shopClose) || Phaser.Input.Keyboard.JustDown(this.escKey)) {
      this.shop.close(); this.hud.closeExternalModal(); return;
    }
    this.shop.refresh();
  }

  closeDialogue(completed=false) {
    const npc = this.activeDialogueNpc;
    const onComplete=completed?this.scriptedDialogueCompletion:null;
    this.scriptedDialogueCompletion=null;
    this.dialogue.close();
    this.npcDialogue?.close?.();
    this.dialogueOpen = false;
    this.activeDialogueNpc = null;
    this.hud.closeExternalModal();
    this.dialogueF?.destroy();
    this.dialogueF = null;
    npc?.hideConversationIcon?.();
    npc?.resumeRoute?.();
    onComplete?.();
  }

  isNearWaystone() {
    return this.waystone && Phaser.Math.Distance.Between(this.player.x, this.player.y, this.waystone.x, this.waystone.y) <= 96;
  }

  readWaystone() {
    this.scriptedDialogueCompletion=null;
    this.hud.openExternalModal();
    this.dialogueOpen = true;
    this.activeDialogueNpc = null;
    this.npcDialogue.open({
      name: 'Marco de Senda', role: 'Relíquia da antiga rede de Aether',
      pages: this.waystone.readMessage().split(/\n\s*\n/),
      spriteKey: this.waystone.textureKey, spriteFrame: 0, flipX: false,
      onPrimary: () => { if (!this.npcDialogue.advance()) this.closeDialogue(false); },
      onClose: () => this.closeDialogue(false)
    });
  }

  handleDeath() {
    if (this.respawnTimer) return;
    this.hud.openExternalModal();
    this.death.show('Respawn em 2 segundos');
    this.respawnTimer = this.time.delayedCall(2000, () => {
      const respawn=this.prologue?.getRespawnPoint?.()||{u:14,v:25.02};
      this.player.setIsoPosition(respawn.u,respawn.v,-6);
      this.player.respawn(this.player.x,this.player.y);
      this.configurePlayerVisual();
      this.updatePlayerProjection();
      this.hud.closeExternalModal();
      this.death.hide();
      this.respawnTimer = null;
      this.saveGame();
    });
  }

  saveGame() {
    const old = this.sm.load();
    this.sm.save({
      version: 1, savedAt: Date.now(), lastScene: this.scene.key,
      player: this.player.serialize(), characterClass: this.player.characterClass,
      skills: this.skillManager.serialize(), inventory: this.inv.serialize(), equipment: this.equip.serialize(),
      quests: this.questManager.serialize?.() || old?.quests || [],
      worldFlags: {...(old?.worldFlags || {}), ...(this.worldFlags || {}), continuousAetherTerritoryV1:true, activeAetherSector:this.registry.get('aetherActiveSector'), cityRound60Migrated: true, cityRound61Migrated: true, cityRound62Migrated: true, cityRound63Migrated: true, cityRound64Migrated: true, cityRound66Migrated: true, cityRound67Migrated: true},
      scenePositions: {...(old?.scenePositions || {}), [this.scene.key]: {x: this.player.x, y: this.player.y, u: this.player.isoX, v: this.player.isoY}}
    });
  }

  goMenu() {
    this.saveGame();
    this.scene.start('MenuScene');
  }

  installUnload() {
    this._unload = () => this.saveGame();
    window.addEventListener('beforeunload', this._unload);
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      this.saveGame();
      this.lowerWallSiege?.destroy?.();
      this.prologue?.destroy?.();
      this.aetherTerritory?.destroy?.();
      this.cityPavement?.destroy?.();
      this.fountainWater?.destroy?.();
      window.removeEventListener('beforeunload', this._unload);
      this.scale.off(Phaser.Scale.Events.RESIZE,this.cityResizeHandler);
    });
  }

  showActionMessage(message) {
    this.msg ??= this.add.text(this.scale.width / 2, this.scale.height - 145, '', {
      fontFamily: 'Arial', fontSize: 12, color: '#ecf0ff', backgroundColor: '#182033', padding: 7
    }).setOrigin(.5).setScrollFactor(0).setDepth(1800);
    this.msg.setText(message).setAlpha(1);
    this.tweens.killTweensOf(this.msg);
    this.tweens.add({targets: this.msg, alpha: 0, delay: 1100, duration: 500});
  }
}
