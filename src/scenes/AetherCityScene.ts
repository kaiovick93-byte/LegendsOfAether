// @ts-nocheck
import {Player} from '../entities/Player';
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
import {IsoSprite,IsoOcclusionManager} from '../isometric/IsoOcclusion';

/**
 * Round 67 — acabamento urbano, contato corporal e portões isométricos.
 *
 * A cidade virou uma cena própria. Isso permite uma grade lógica real sem
 * alterar a física cartesiana dos Arredores, Fazenda, Floresta, Caverna e
 * Castelo. O deslocamento continua em (u,v), mas o contato urbano consulta os
 * pixels opacos das imagens e ignora todo o padding transparente.
 */
export class AetherCityScene extends Phaser.Scene {
  static readonly TILE_WIDTH = 96;
  static readonly TILE_HEIGHT = 48;
  static readonly MAP_SIZE = 28;
  static readonly CITY_MIN = 2;
  static readonly CITY_MAX = 26;
  static readonly ORIGIN_X = 1600;
  static readonly ORIGIN_Y = 250;
  static readonly WORLD_WIDTH = 3200;
  static readonly WORLD_HEIGHT = 1900;
  static readonly GATE_MIN = 13.42;
  static readonly GATE_MAX = 14.58;
  static readonly ISO_DEPTH_BASE = -5000;

  constructor() {
    super('AetherCityScene');
  }

  create() {
    this.switching = false;
    this.dialogueOpen = false;
    this.usesLogicalAlphaCollision = true;
    this.solidMasks = [];
    this.playerCollisionMaskCache = new Map();
    this.textureAlphaMaskCache = new Map();
    this.occluders = [];
    this.occlusionManager = new IsoOcclusionManager(this);
    this.cityActors = [];
    this.ambientActors = [];
    // Primeiro quadro já dentro da avenida: nenhuma torre encobre o herói.
    this.playerIsoStart = {x: 14, y: 25.02};
    this.playerIsoRadius = .27;

    this.initializeSystems();
    this.loadGame();
    this.configurePlayerVisual();

    this.physics.world.setBounds(0, 0, AetherCityScene.WORLD_WIDTH, AetherCityScene.WORLD_HEIGHT);
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

    this.createWorld();
    this.createNpcs();
    this.createAmbientLife();
    this.createLowerWallSiege();
    this.setupInput();
    this.setupHud();
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
      -cameraPadX,-cameraPadY,
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
    const savedPos = save?.scenePositions?.AetherCityScene;
    const entrance = this.registry.get('aetherCityEntrance');

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
    if (entrance === 'east') {
      // Limite interno do arco leste, exatamente na direção usada na entrada.
      this.player.setIsoPosition(25.02,14,-6);
      this.entryFacing = 'left';
    } else if (entrance === 'south') {
      // Limite interno do arco sul, olhando para o centro da cidade.
      this.player.setIsoPosition(14,25.02,-6);
      this.entryFacing = 'up';
    } else if ((save?.worldFlags?.cityRound64Migrated || save?.worldFlags?.cityRound63Migrated) && Number.isFinite(savedPos?.u) && Number.isFinite(savedPos?.v)) {
      // O Round 67 sela toda a largura visual dos muros do fundo. Saves feitos
      // dentro dessa faixa são migrados para o primeiro ponto caminhável.
      const safeMin = save?.worldFlags?.cityRound67Migrated ? 3.18 : 3.22;
      const safeMax = 25.08;
      this.player.setIsoPosition(
        Phaser.Math.Clamp(savedPos.u,safeMin,safeMax),
        Phaser.Math.Clamp(savedPos.v,safeMin,safeMax),
        -6
      );
    }
    this.registry.remove('aetherCityEntrance');
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
    this.player.setTexture(texture, frame);
    // As folhas de 96 px têm cerca de 80 px realmente opacos. Em 1,28x o
    // corpo visível fica entre 98 e 107 px, a mesma faixa dos NPCs urbanos.
    this.player.setOrigin(.5,1).setScale(1.28);
    this.player.setVisible(true).setActive(true).setAlpha(1).clearTint();
    this.player.setCollideWorldBounds(false);
    this.player.body.setSize(32,16,false).setOffset((this.player.width-32)/2,this.player.height-16).setVelocity(0,0);
    this.player.updateIsoPosition();
    this.player.facing = this.entryFacing || 'down';
    this.player.playMove(false);
    // A arte dos protagonistas já encosta na linha dos pés. A antiga elipse
    // criada pelo Phaser fazia todos parecerem flutuar e não é mais usada.
    this.playerShadow?.destroy?.();
    this.playerShadow=null;
    this.createPlayerOcclusionOutline(texture, frame);
  }

  createPlayerOcclusionOutline(texture, frame) {
    if (!this.playerOutline?.active) {
      const outlineTexture = this.textures.exists(this.player.getOutlineTextureKey()) ? this.player.getOutlineTextureKey() : texture;
      this.playerOutline = new IsoSprite({
        scene:this,isoX:this.player.isoX,isoY:this.player.isoY,isoZ:this.player.isoZ,
        texture:outlineTexture,frame,tileWidth:AetherCityScene.TILE_WIDTH,tileHeight:AetherCityScene.TILE_HEIGHT,
        screenOriginX:AetherCityScene.ORIGIN_X,screenOriginY:AetherCityScene.ORIGIN_Y,
        depthBase:AetherCityScene.ISO_DEPTH_BASE,depthOffset:.32
      }).setScale(this.player.scaleX,this.player.scaleY).setVisible(false).setAlpha(0);
    } else {
      this.playerOutline.setTexture(this.textures.exists(this.player.getOutlineTextureKey()) ? this.player.getOutlineTextureKey() : texture, frame);
    }
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
      // Quatro residências isométricas ocupam lotes separados pelas vias do bairro.
      {id:'house_red', key:'residential_house_red', label:'Casa vermelha', u:4.25, v:18.80, height:180, rect:[3.05,17.70,2.40,2.15], collisionBand:.58, smoke:{x:425,y:116,size:35,alpha:.68}},
      {id:'house_green', key:'residential_house_green', label:'Casa verde', u:8.95, v:18.80, height:180, rect:[7.75,17.70,2.40,2.15], collisionBand:.58, smoke:{x:425,y:95,size:35,alpha:.68}},
      {id:'house_blue', key:'residential_house_blue', label:'Casa azul', u:4.75, v:23.00, height:180, rect:[3.55,21.95,2.25,2.10], collisionBand:.58, smoke:{x:430,y:103,size:35,alpha:.68}},
      {id:'house_orange', key:'residential_house_orange', label:'Casa laranja', u:8.95, v:23.60, height:180, rect:[7.75,22.55,2.40,2.15], collisionBand:.58, smoke:{x:425,y:105,size:35,alpha:.68}}
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
    this.add.image(C.ORIGIN_X, centerY, 'iso_city_pavement_v2').setOrigin(.5).setDepth(C.ISO_DEPTH_BASE-58);

    // Ruas, calçadas e meios-fios seguem a malha lógica da cidade. A camada
    // tem exatamente o mesmo tamanho e origem do piso, portanto não sofre
    // qualquer redimensionamento ou desvio em relação aos estabelecimentos.
    this.add.image(C.ORIGIN_X, centerY, 'iso_city_streets')
      .setOrigin(.5).setDepth(C.ISO_DEPTH_BASE-57.5);

    // Um único piso distrital mantém quatro quintais e duas ruas internas
    // perfeitamente contínuas, sem sobreposição de losangos independentes.
    const residential = this.project(6.60, 21.20);
    this.add.image(residential.x, residential.y, 'iso_residential_ground')
      .setOrigin(.5).setDisplaySize(768, 384).setDepth(C.ISO_DEPTH_BASE-57);

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
    const targetHeight=154;
    const scale=targetHeight/source.height;
    const p=this.project(u,v);
    const pillar=new IsoSprite({
      scene:this,isoX:u,isoY:v,isoZ:14-targetHeight/2,
      texture:key,tileWidth:AetherCityScene.TILE_WIDTH,tileHeight:AetherCityScene.TILE_HEIGHT,
      screenOriginX:AetherCityScene.ORIGIN_X,screenOriginY:AetherCityScene.ORIGIN_Y,
      depthBase:AetherCityScene.ISO_DEPTH_BASE,
      // O pilar precisa cobrir inclusive o módulo lateral de maior soma.
      depthOffset:106
    }).setScale(scale);
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
        label: building.label, mode: 'facade', baseY: image.y - 2,
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
      const emit=()=>{
        if(!smoke.active)return;
        const direction=((chimneyIndex+layer)%2?1:-1);
        const duration=2500+layer*310+((chimneyIndex*137)%330);
        const peakAlpha=(profile.alpha??.78)*(.34+layer*.055);
        smoke.setPosition(mouthX+direction*(layer-1)*2,mouthY+3)
          .setScale(baseScale*(.66+layer*.04)).setAngle(direction*(2+layer)).setAlpha(0);
        this.tweens.add({
          targets:smoke,
          x:mouthX+direction*(18+layer*7),
          y:mouthY-(72+layer*13),
          scaleX:baseScale*(1.24+layer*.10),
          scaleY:baseScale*(1.36+layer*.11),
          angle:direction*(10+layer*3),
          duration,ease:'Sine.Out',
          onUpdate:tween=>{
            const p=tween.progress;
            const fadeIn=Phaser.Math.Clamp(p/.16,0,1);
            const fadeOut=Phaser.Math.Clamp((1-p)/.34,0,1);
            smoke.setAlpha(peakAlpha*Math.min(fadeIn,fadeOut));
          },
          onComplete:()=>this.time.delayedCall(90+layer*80,emit)
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
    this.registerSolidMask(this.fountain, 'city_fountain', {label: 'fonte', minHits: 2});

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
      dynamic: !!options.dynamic
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

  getPlayerCollisionSamples() {
    const frameNumber = Number.isFinite(Number(this.player?.frame?.name))
      ? Number(this.player.frame.name)
      : this.player.getIdleFrame();
    // Armas e cajados não alargam o corpo físico. A máscara corporal vem da
    // folha-base da mesma identidade e do mesmo quadro direcional.
    const key = `player-${this.player.appearanceId}-base`;
    if (!this.textures.exists(key)) return [];
    const cacheKey = `${key}:${frameNumber}`;
    if (this.playerCollisionMaskCache.has(cacheKey)) return this.playerCollisionMaskCache.get(cacheKey);
    const mask = this.getTextureAlphaMask(key, frameNumber);
    const width = mask?.width ?? 96;
    const height = mask?.height ?? 96;
    const samples = [];
    const step = 2;
    // Colisão corporal é contato no chão: somente pernas e pés opacos entram
    // no volume físico. Cabeça, cabelos e armas continuam participando da
    // oclusão visual, mas não prendem o herói quando duas silhuetas se cruzam
    // em profundidades isométricas diferentes.
    const contactBandStart = Math.max(0,height - 14);
    for (let y = contactBandStart; y < height; y += step) {
      for (let x = 1; x < width; x += step) {
        const alpha = mask?.alpha[y * width + x] ?? 0;
        if (alpha >= 96) {
          samples.push({
            x: x + step / 2 - width * this.player.originX,
            y: y + step / 2 - height * this.player.originY
          });
        }
      }
    }
    this.playerCollisionMaskCache.set(cacheKey, samples);
    return samples;
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
    const scaleX = Math.abs(this.player.scaleX) || 1;
    const scaleY = Math.abs(this.player.scaleY) || 1;
    const worldSamples = playerSamples.map(sample => ({
      x: foot.x + sample.x * scaleX,
      y: foot.y + sample.y * scaleY,
      bodyY: sample.y * scaleY
    }));
    const playerLeft = Math.min(...worldSamples.map(point => point.x));
    const playerRight = Math.max(...worldSamples.map(point => point.x));
    const playerTop = Math.min(...worldSamples.map(point => point.y));
    const playerBottom = Math.max(...worldSamples.map(point => point.y));

    let totalHits=0;
    for (const entry of this.solidMasks) {
      const geometry = this.getSolidGeometry(entry);
      if (!geometry) continue;
      const targetMask = this.getTextureAlphaMask(entry.key, geometry.frameName);
      if (!targetMask) continue;
      if (playerRight < geometry.left || playerLeft >= geometry.right ||
          playerBottom < geometry.top || playerTop >= geometry.bottom) continue;
      const behindFacade = entry.mode === 'facade' && foot.y < entry.baseY - entry.behindMargin;
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
        const alpha = targetMask.alpha[sourceY * targetMask.width + sourceX] ?? 0;
        if (alpha >= entry.alphaThreshold) hits++;
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
      let sourceX=Math.floor((x-geometry.left)/geometry.scaleX);
      const sourceY=Math.floor((y-geometry.top)/geometry.scaleY);
      if(geometry.flipX)sourceX=geometry.width-1-sourceX;
      if(sourceX<0||sourceX>=geometry.width||sourceY<0||sourceY>=geometry.height)continue;
      if(sourceY<geometry.height*entry.sourceMinY||sourceY>=geometry.height*entry.sourceMaxY)continue;
      const mask=this.getTextureAlphaMask(entry.key,geometry.frameName);
      const alpha=mask?.alpha[sourceY*(mask?.width??0)+sourceX]??0;
      if(alpha>=entry.alphaThreshold)return true;
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
    const du=target.isoX-state.sprite.isoX;
    const dv=target.isoY-state.sprite.isoY;
    const targetScreen=this.project(target.isoX,target.isoY);
    const distance=Phaser.Math.Distance.Between(state.sprite.x,state.sprite.y,targetScreen.x,targetScreen.y);
    const steps=Math.max(2,Math.ceil(distance/10));
    for(let step=1;step<=steps;step++){
      const p=step/steps;
      if(this.isAmbientPositionBlocked(state,state.sprite.isoX+du*p,state.sprite.isoY+dv*p))return false;
    }
    return true;
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
      ['elder_mira', 'Mira Edevane', 'Anciã de Aether', 16.90, 13.05, ['A floresta ficou perigosa. Se trouxer provas dos monstros, conversaremos sobre o assunto.'], {portrait: 'portrait_mira', idleProfile: 'elder', iso: 'elder_mira_iso', action: 'elder_mira_iso_action', height: 118, actionFrameRate:4.2, idleMinDelay:1800, idleMaxDelay:3400}],
      ['general', 'Cassian Vhal', 'General de Aether', 12.35, 15.15, ['Defender Aether está se tornando mais difícil a cada dia. Há monstros demais rondando os arredores, e meus soldados não podem vigiar todos os caminhos.', 'Mas escute bem: enquanto eu comandar estas muralhas, nenhum deles tomará esta cidade.'], {portrait: 'portrait_general', idleProfile: 'general', iso: 'general_iso', action: 'general_iso_action', height: 118, actionFrameRate:4.2, idleMinDelay:1800, idleMaxDelay:3400}],
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
          frame: '__BASE',
          worldX: () => npc.x + (npc.sprite?.x ?? 0),
          worldY: () => npc.y + (npc.sprite?.y ?? 0),
          scaleX: () => npc.isoDisplayScale || Math.abs(npc.sprite?.scaleX) || 1,
          scaleY: () => npc.isoDisplayScale || Math.abs(npc.sprite?.scaleY) || 1,
          originX: .5, originY: 1,
          flipX: () => !!npc.sprite?.flipX,
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
    const residentRoute = [[10.80,20.90],[9.80,21.20],[8.40,21.20],[6.60,21.20],[6.60,23.70],[6.60,24.70],[6.60,23.70],[6.60,21.20],[4.70,21.20],[3.00,21.20],[4.70,21.20],[6.60,21.20],[6.60,19.00],[6.60,17.30],[8.10,17.00],[10.00,17.20],[10.70,18.80]];
    const travelerRoute = [[9.8,11.5],[10.0,10.0],[11.8,9.0],[13.5,9.2],[15.0,9.0],[15.4,10.2],[15.0,11.4],[14.0,12.0],[12.4,11.8],[11.0,11.4]];
    this.walkers = [
      this.createWalker('resident', 'resident_iso_walk', 'Tomas Belmon', 'Morador de Aether', ['A praça ainda é o lugar mais seguro de Aether.'], residentRoute, 106, 44, 700, 'portrait_tomas'),
      this.createWalker('traveler', 'traveler_iso_walk', 'Darian Kestrel', 'Viajante', ['Ouvi rumores sobre o castelo.'], travelerRoute, 102, 50, 1100, 'portrait_darian')
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
    // Soma u+v constante: o gato se move horizontalmente na tela.
    this.routeAmbient('city_cat', 'city-cat-walk', [[16,14],[18,12],[20,10],[22,8],[20,10],[18,12]], .82, 31, 1200);

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
      this.tweens.add({
        targets:motion,isoX:target.x,isoY:target.y,duration,ease:'Linear',
        onUpdate:()=>rat.setIsoPosition(motion.isoX,motion.isoY,0),
        onComplete:()=>{rat.setIsoPosition(target.x,target.y,0);onComplete?.()}
      });
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

  routeAmbient(texture, animation, logicalRoute, scale, speed, startDelay) {
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
      tween:null,repathPending:false
    };
    this.registerSolidMask(sprite,texture,{
      label:texture==='city_dog'?'cachorro da cidade':'gato da cidade',
      frame:()=>sprite.frame?.name??0,
      sourceMinY:.48,sourceMaxY:1,alphaThreshold:32,minHits:1,
      owner:sprite,dynamic:true
    });
    this.ambientActors.push(sprite);
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
    // O velhinho agora participa da praça e permanece próximo à fonte.
    const homeLogical = {u: 15.50, v: 15.30};
    const home = this.project(homeLogical.u, homeLogical.v);
    // Um recurso ambiente opcional nunca pode impedir a criação da cidade.
    // Os quatro quadros usam célula, escala corporal e linha dos pés idênticas.
    if (this.textures.exists('elder_feeder_iso')) {
      const elderScale = 116 / 224;
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
        sourceMinY:.48,sourceMaxY:1,alphaThreshold:34,minHits:2,
        owner:this.oldMan,dynamic:true
      });
    } else {
      console.warn('[AetherCity] elder_feeder_iso indisponível; cena mantida sem o velhinho.');
      this.oldMan = null;
    }

    if (!this.textures.exists('city_bird')) return;
    [[15.85,15.45,.75], [16.20,15.72,.70], [15.60,15.90,.66], [16.38,15.36,.63]].forEach(([u,v,scale], i) => {
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
  }

  setupHud() {
    const C = AetherCityScene;
    this.hud = new MapHud(this, {
      player: this.player, inventory: this.inv, equipment: this.equip, abilities: this.abilities, skills: this.skillManager,
      save: () => this.saveGame(), onMenu: () => this.goMenu(), worldWidth: C.WORLD_WIDTH, worldHeight: C.WORLD_HEIGHT,
      mapTexture: 'city_map_exact_2_5d', mapProjection: 'aether-city-exact',
      localName: 'CIDADE DE AETHER • ISOMÉTRICA', markers: [
        {...this.project(14,14), u:14, v:14, color: 0x7ee0ff, label: 'Praça'},
        {...this.project(26,14), u:26, v:14, color: 0xffd166, label: 'Leste'},
        {...this.project(14,26), u:14, v:26, color: 0x73e6a8, label: 'Sul'}
      ]
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
    this.cityBanner = this.add.text(22, 18, 'CIDADE DE AETHER  •  OCLUSÃO ISOMÉTRICA', {
      fontFamily: 'Georgia, serif', fontSize: 14, color: '#f0d392', fontStyle: 'bold',
      backgroundColor: '#101821dd', padding: {left: 11, right: 11, top: 7, bottom: 7},
      stroke: '#090d12', strokeThickness: 2
    }).setScrollFactor(0).setDepth(1700);
    this.tweens.add({targets: this.cityBanner, alpha: 0, delay: 2600, duration: 700});
  }

  update(_time, delta) {
    this.updateNpcPrompts();
    this.updateActorDepths();

    if (this.dialogueOpen) {
      this.stopPlayer();
      if (this.npcDialogue?.isOpen?.()) {
        if (Phaser.Input.Keyboard.JustDown(this.escKey)) { this.closeDialogue(); return; }
        if (Phaser.Input.Keyboard.JustDown(this.tKey) && this.npcDialogue.hasSecondaryAction?.()) { this.npcDialogue.triggerSecondary(); return; }
        if (Phaser.Input.Keyboard.JustDown(this.fKey)) { if (!this.npcDialogue.advance()) this.closeDialogue(); return; }
      } else if (Phaser.Input.Keyboard.JustDown(this.fKey) || Phaser.Input.Keyboard.JustDown(this.escKey)) {
        this.closeDialogue(); return;
      }
      return;
    }
    if (this.shop.visible) { this.stopPlayer(); this.handleShop(); return; }
    if (this.hud.handle({collect: () => this.showActionMessage('Não há itens próximos.'), talk: () => this.tryTalkOrWaystone(), shop: () => this.tryShop(), afterAction: () => this.saveGame()})) {
      this.stopPlayer(); this.hud.update(); return;
    }
    if (this.player.isDead()) { this.handleDeath(); return; }

    this.moveIsometric(delta);
    this.waystone.updatePrompt(this.player.x, this.player.y);
    this.hud.setLocalName('CIDADE DE AETHER • ISOMÉTRICA');
    this.hud.update();
    this.checkGateTransitions();
  }

  moveIsometric(delta = 16.667) {
    const ix = (this.cursors.right.isDown || this.keys.D.isDown ? 1 : 0) - (this.cursors.left.isDown || this.keys.A.isDown ? 1 : 0);
    const iy = (this.cursors.down.isDown || this.keys.S.isDown ? 1 : 0) - (this.cursors.up.isDown || this.keys.W.isDown ? 1 : 0);
    if (!(ix || iy)) { this.stopPlayer(); return; }

    const length = Math.hypot(ix, iy) || 1;
    const inputX = ix / length, inputY = iy / length;
    const dt = Math.min(delta / 1000, .034);
    const screenSpeed = 176;
    // Transformação 2:1 do arquivo phaser_isometric_collision.ts: as teclas
    // percorrem os dois eixos diagonais do losango, com vetor normalizado.
    const sx = (inputX - inputY) * screenSpeed;
    const sy = (inputX + inputY) * (screenSpeed * .5);
    const du = (sx / AetherCityScene.TILE_WIDTH + sy / AetherCityScene.TILE_HEIGHT) * dt;
    const dv = (-sx / AetherCityScene.TILE_WIDTH + sy / AetherCityScene.TILE_HEIGHT) * dt;

    this.tryMove(du, 0);
    this.tryMove(0, dv);
    this.player.updateFacing(sx,sy);
    this.player.playMove(true);
    this.updatePlayerProjection();
  }

  stopPlayer() {
    this.player.body?.setVelocity(0, 0);
    this.player.playMove(false);
    this.updatePlayerProjection();
  }

  tryMove(du, dv) {
    // Subpassos menores que dois pixels de tela evitam atravessar uma faixa
    // opaca fina quando o navegador entrega um quadro mais longo.
    const steps = Math.max(1, Math.ceil(Math.max(Math.abs(du), Math.abs(dv)) / .035));
    const stepU = du / steps, stepV = dv / steps;
    for (let index = 0; index < steps; index++) {
      const u = this.player.isoX + stepU, v = this.player.isoY + stepV;
      if (this.isBlockedByCityBounds(u,v,this.playerIsoRadius)) break;
      const currentScore=this.getSolidMaskCollisionScore(this.player.isoX,this.player.isoY);
      const nextScore=this.getSolidMaskCollisionScore(u,v);
      // Caso um save ou uma aproximação extrema deixe os pés tocando alguns
      // pixels opacos, ainda é possível escapar ou deslizar tangencialmente.
      // Só bloqueamos um contato novo ou um movimento que aumente a invasão.
      const escapingExistingOverlap=currentScore>0&&nextScore<=currentScore;
      if(nextScore>0&&!escapingExistingOverlap)break;
      this.player.setIsoPosition(u,v,this.player.isoZ);
    }
  }

  isOutsideCityWallEnvelope(u, v, radius) {
    const C = AetherCityScene;
    // A parede traseira tem volume visual maior que sua linha de apoio; a
    // margem 3.12 impede entrar na pedra atrás da ferraria e do mercado.
    const innerMin = 3.12;
    const innerMax = 25.35;
    const gateMin = C.GATE_MIN;
    const gateMax = C.GATE_MAX;
    const insideEastGate = v - radius > gateMin && v + radius < gateMax;
    const insideSouthGate = u - radius > gateMin && u + radius < gateMax;

    // Os portões são as únicas exceções à face interna contínua do muro.
    // A checagem do envelope também elimina qualquer fresta matemática entre
    // dois retângulos de colisão adjacentes.
    if (u - radius < innerMin || v - radius < innerMin) return true;
    if (u + radius > innerMax && !insideEastGate) return true;
    if (v + radius > innerMax && !insideSouthGate) return true;
    return false;
  }

  isBlockedByCityBounds(u, v, radius) {
    const C = AetherCityScene;
    if (u < .68 + radius || v < .68 + radius || u > C.MAP_SIZE - .68 - radius || v > C.MAP_SIZE - .68 - radius) return true;
    if (this.isBlockedByLowerWallSiegeZone(u,v,radius)) return true;
    if (this.isOutsideCityWallEnvelope(u, v, radius)) return true;
    return false;
  }

  isBlockedByLowerWallSiegeZone(u,v,radius){
    // Faixa física contínua e independente dos pixels da pintura. Ela fecha
    // os dois muros onde ocorre o cerco e preserva somente os corredores dos
    // Portões Leste e Sul, que já transferem de cena antes da área externa.
    const limit=25.22;
    const insideEastGate=v-radius>AetherCityScene.GATE_MIN&&v+radius<AetherCityScene.GATE_MAX;
    const insideSouthGate=u-radius>AetherCityScene.GATE_MIN&&u+radius<AetherCityScene.GATE_MAX;
    if(u+radius>limit&&!insideEastGate)return true;
    if(v+radius>limit&&!insideSouthGate)return true;
    return false;
  }

  isBlocked(u, v, radius) {
    return this.isBlockedByCityBounds(u,v,radius)||this.isBlockedBySolidMasks(u,v);
  }

  updatePlayerProjection() {
    this.player.updateIsoPosition();
    this.player.body?.setVelocity(0, 0);
    this.playerNaturalDepth = this.player.depth;
    this.player.setVisible(true).setAlpha(1);
    this.syncPlayerOcclusionOutline();
    this.updateUniversalOcclusion();
    this.occlusionManager?.checkPlayerOcclusion(this.player);
  }

  syncPlayerOcclusionOutline() {
    const outline = this.playerOutline;
    if (!outline?.active || !this.player?.frame) return;
    const frameName = this.player.frame?.name;
    const outlineKey = this.player.getOutlineTextureKey();
    if (outlineKey && (outline.texture?.key !== outlineKey || outline.frame?.name !== frameName)) {
      outline.setTexture(outlineKey, frameName);
    }
    outline.setIsoPosition(this.player.isoX,this.player.isoY,this.player.isoZ)
      .setScale(this.player.scaleX, this.player.scaleY)
      .setFlipX(this.player.flipX).setFlipY(this.player.flipY);
  }

  updateUniversalOcclusion() {
    const outline = this.playerOutline;
    if (!outline?.active || !this.occluders?.length || !this.textures.exists(this.player.getOutlineTextureKey())) return;
    const playerWidth = this.player.displayWidth;
    const playerHeight = this.player.displayHeight;
    const samples = [];
    for (const yFactor of [-.72,-.56,-.40,-.24,-.09]) {
      for (const xFactor of [-.22,0,.22]) {
        samples.push({x:this.player.x + playerWidth * xFactor, y:this.player.y + playerHeight * yFactor});
      }
    }

    let totalHits = 0;
    let highestOccluderDepth = -Infinity;
    let lowestOccluderDepth = Infinity;
    for (const occluder of this.occluders) {
      const image = occluder.image;
      // Sobreposição de pixels não basta: o pé do jogador precisa estar
      // realmente atrás da linha de apoio do objeto. Isso impede o contorno
      // dourado ao tocar uma fachada pela frente.
      const objectDepth=image?.parentContainer?.depth ?? image?.depth ?? 0;
      if (!image?.active || this.player.y >= occluder.baseY - occluder.behindMargin ||
          this.playerNaturalDepth >= objectDepth - .005) continue;
      const texture = this.textures.get(occluder.key);
      const source = texture?.getSourceImage?.();
      if (!source) continue;
      const width = Math.abs(image.displayWidth || source.width);
      const height = Math.abs(image.displayHeight || source.height);
      const worldX = occluder.worldX ?? image.x;
      const worldY = occluder.worldY ?? image.y;
      const originX = occluder.originX ?? image.originX ?? .5;
      const originY = occluder.originY ?? image.originY ?? .5;
      const left = worldX - width * originX;
      const top = worldY - height * originY;
      const right = left + width;
      const bottom = top + height;
      if (this.player.x + playerWidth * .30 < left || this.player.x - playerWidth * .30 > right ||
          this.player.y < top || this.player.y - playerHeight * .78 > bottom) continue;

      let objectHits = 0;
      for (const point of samples) {
        if (point.x < left || point.x >= right || point.y < top || point.y >= bottom) continue;
        let sourceX = Math.floor((point.x - left) / width * source.width);
        const sourceY = Math.floor((point.y - top) / height * source.height);
        if (image.flipX) sourceX = source.width - 1 - sourceX;
        const alpha = this.textures.getPixelAlpha(sourceX, sourceY, occluder.key);
        if (alpha !== null && alpha >= occluder.alphaThreshold) objectHits++;
      }
      if (objectHits < 2) continue;
      totalHits += objectHits;
      highestOccluderDepth = Math.max(highestOccluderDepth, objectDepth);
      lowestOccluderDepth = Math.min(lowestOccluderDepth, objectDepth);
    }

    if (totalHits >= 2) {
      // Atrás do objeto, o corpo real some por completo. Acima permanece
      // apenas a folha vazada dourada correspondente ao quadro atual.
      this.player.setDepth(Math.min(this.playerNaturalDepth, lowestOccluderDepth - .02)).setVisible(false).setAlpha(0);
      outline.setVisible(true)
        .setAlpha(Phaser.Math.Clamp(.58 + totalHits / 18, .58, 1))
        .setDepth(highestOccluderDepth + .32);
    } else {
      this.player.setDepth(this.playerNaturalDepth).setVisible(true).setAlpha(1);
      outline.setVisible(false).setAlpha(0);
    }
  }

  updateActorDepths() {
    for (const actor of this.cityActors) {
      if (actor?.updateIsoPosition) actor.updateIsoPosition();
      else actor?.setDepth(this.cityDepth(actor.y, actor.isGateGuard ? .34 : .06));
    }
    for (const actor of this.ambientActors) {
      if (actor?.updateIsoPosition) actor.updateIsoPosition();
      else actor?.setDepth(this.cityDepth(actor.y, .03));
    }
  }

  checkGateTransitions() {
    const u=this.player.isoX,v=this.player.isoY;
    const min = AetherCityScene.GATE_MIN, max = AetherCityScene.GATE_MAX;
    if (u > 26.58 && v > min && v < max) this.exitCity('east');
    else if (v > 26.58 && u > min && u < max) this.exitCity('south');
  }

  exitCity(gate) {
    if (this.switching) return;
    this.switching = true;
    this.saveGame();
    const spawn = gate === 'east' ? {x: 1588, y: 500} : {x: 780, y: 1228};
    this.registry.set('transitionSpawn', {scene: 'WorldScene', ...spawn, fromAetherCity: gate});
    this.cameras.main.fadeOut(180, 7, 13, 16, (_camera, progress) => {
      if (progress === 1) this.scene.start('WorldScene');
    });
  }

  updateNpcPrompts() {
    for (const npc of this.cityActors.filter(Boolean)) {
      const distance = Phaser.Math.Distance.Between(this.player.x, this.player.y, npc.x, npc.y);
      npc.setPrompt(npc === this.merchant && distance < 96 ? 'F • Conversar   T • Loja' : 'F • Conversar');
      npc.setNearby(distance < 96);
    }
  }

  tryTalkOrWaystone() {
    if (this.isNearWaystone()) { this.readWaystone(); return; }
    this.tryTalk();
  }

  tryTalk() {
    let near = null, best = Infinity;
    for (const npc of this.cityActors.filter(Boolean)) {
      const distance = Phaser.Math.Distance.Between(this.player.x, this.player.y, npc.x, npc.y);
      if (distance < best) { best = distance; near = npc; }
    }
    if (!near || best > 96) { this.showActionMessage('Aproxime-se de um NPC para conversar.'); return; }

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
      onSecondary: () => { if (near === this.merchant) { this.closeDialogue(); this.shop.open(); this.hud.openExternalModal(); } },
      onPrimary: () => { if (!this.npcDialogue.advance()) this.closeDialogue(); },
      onClose: () => this.closeDialogue()
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

  closeDialogue() {
    const npc = this.activeDialogueNpc;
    this.dialogue.close();
    this.npcDialogue?.close?.();
    this.dialogueOpen = false;
    this.activeDialogueNpc = null;
    this.hud.closeExternalModal();
    this.dialogueF?.destroy();
    this.dialogueF = null;
    npc?.hideConversationIcon?.();
    npc?.resumeRoute?.();
  }

  isNearWaystone() {
    return this.waystone && Phaser.Math.Distance.Between(this.player.x, this.player.y, this.waystone.x, this.waystone.y) <= 96;
  }

  readWaystone() {
    this.hud.openExternalModal();
    this.dialogueOpen = true;
    this.activeDialogueNpc = null;
    this.npcDialogue.open({
      name: 'Marco de Senda', role: 'Relíquia da antiga rede de Aether',
      pages: this.waystone.readMessage().split(/\n\s*\n/),
      spriteKey: this.waystone.textureKey, spriteFrame: 0, flipX: false,
      onPrimary: () => { if (!this.npcDialogue.advance()) this.closeDialogue(); },
      onClose: () => this.closeDialogue()
    });
  }

  handleDeath() {
    if (this.respawnTimer) return;
    this.hud.openExternalModal();
    this.death.show('Respawn em 2 segundos');
    this.respawnTimer = this.time.delayedCall(2000, () => {
      this.player.setIsoPosition(14,25.02,-6);
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
      worldFlags: {...(old?.worldFlags || {}), ...(this.worldFlags || {}), cityRound60Migrated: true, cityRound61Migrated: true, cityRound62Migrated: true, cityRound63Migrated: true, cityRound64Migrated: true, cityRound66Migrated: true, cityRound67Migrated: true},
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
