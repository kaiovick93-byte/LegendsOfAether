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

/**
 * Round 67 — acabamento urbano, contato corporal e portões isométricos.
 *
 * A cidade virou uma cena própria. Isso permite uma grade lógica real sem
 * alterar a física cartesiana dos Arredores, Fazenda, Floresta, Caverna e
 * Castelo. Toda colisão urbana é calculada em (u,v); arte e telhados não
 * participam do bloqueio.
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

  constructor() {
    super('AetherCityScene');
  }

  create() {
    this.switching = false;
    this.dialogueOpen = false;
    this.blockedRects = [];
    this.blockedCircles = [];
    this.blockedScreenEllipses = [];
    this.blockedBuildingMasks = [];
    this.occluders = [];
    this.fixedNpcLogical = [];
    this.cityActors = [];
    this.ambientActors = [];
    // Primeiro quadro já dentro da avenida: nenhuma torre encobre o herói.
    this.logicalPlayer = {u: 14, v: 25.02, radius: .27};

    this.initializeSystems();
    this.loadGame();
    this.configurePlayerVisual();

    this.physics.world.setBounds(0, 0, AetherCityScene.WORLD_WIDTH, AetherCityScene.WORLD_HEIGHT);
    this.cameras.main.setBackgroundColor('#0c1717');
    this.cameras.main.setBounds(0, 0, AetherCityScene.WORLD_WIDTH, AetherCityScene.WORLD_HEIGHT);
    this.cameras.main.setDeadzone(220, 100);
    this.cameras.main.startFollow(this.player, true, .12, .12, 0, -90);
    // Leve afastamento: mostra mais ruas sem tornar personagens ilegíveis.
    this.cameras.main.setZoom(.92);
    this.cameras.main.setRoundPixels(true);

    this.createWorld();
    this.createNpcs();
    this.createAmbientLife();
    this.setupInput();
    this.setupHud();
    this.createCityBanner();
    this.updatePlayerProjection();
    this.installUnload();
    this.cameras.main.fadeIn(260, 7, 13, 16);
    this.saveGame();
  }

  initializeSystems() {
    const spawn = this.project(this.logicalPlayer.u, this.logicalPlayer.v);
    this.sm = new SaveManager();
    this.inv = new Inventory();
    this.player = new Player(this, spawn.x, spawn.y);
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
      this.logicalPlayer = {u: 25.02, v: 14, radius: .27};
      this.entryFacing = 'left';
    } else if (entrance === 'south') {
      // Limite interno do arco sul, olhando para o centro da cidade.
      this.logicalPlayer = {u: 14, v: 25.02, radius: .27};
      this.entryFacing = 'up';
    } else if ((save?.worldFlags?.cityRound64Migrated || save?.worldFlags?.cityRound63Migrated) && Number.isFinite(savedPos?.u) && Number.isFinite(savedPos?.v)) {
      // O Round 67 sela toda a largura visual dos muros do fundo. Saves feitos
      // dentro dessa faixa são migrados para o primeiro ponto caminhável.
      const safeMin = save?.worldFlags?.cityRound67Migrated ? 3.18 : 3.22;
      const safeMax = 25.08;
      this.logicalPlayer.u = Phaser.Math.Clamp(savedPos.u, safeMin, safeMax);
      this.logicalPlayer.v = Phaser.Math.Clamp(savedPos.v, safeMin, safeMax);
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
    this.player.setOrigin(.5, .86).setScale(.78);
    this.player.setVisible(true).setActive(true).setAlpha(1).clearTint();
    this.player.setCollideWorldBounds(false);
    this.player.body.setVelocity(0, 0);
    this.player.facing = this.entryFacing || 'down';
    this.player.playMove(false);
    if (!this.playerShadow?.active) {
      this.playerShadow = this.add.ellipse(this.player.x, this.player.y + 4, 38, 16, 0x000000, .28);
    }
    this.createPlayerOcclusionOutline(texture, frame);
  }

  createPlayerOcclusionOutline(texture, frame) {
    if (!this.playerOutline?.active) {
      const outlineTexture = this.textures.exists(this.player.getOutlineTextureKey()) ? this.player.getOutlineTextureKey() : texture;
      this.playerOutline = this.add.sprite(this.player.x, this.player.y, outlineTexture, frame)
        .setOrigin(this.player.originX, this.player.originY).setScale(this.player.scaleX, this.player.scaleY)
        .setVisible(false).setAlpha(0);
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

  cityDepth(y, offset = 0) {
    // Mantém todo o mundo abaixo das interfaces, que começam em depth 680.
    return 10 + y / 1000 + offset;
  }

  depthAt(u, v, offset = 0) {
    return this.cityDepth(this.project(u, v).y, offset);
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
      // O ateliê ocupa o trecho entre a taverna e o Portão Leste, com a
      // muralha atrás da oficina e a fachada livre para Maelis.
      {id:'artisan', key:'artisan_house', label:'Ateliê de Maelis', u:24.55, v:8.45, height:224, rect:[23.00,7.05,3.00,2.75], npc:[24.86,9.28], collisionBand:.64, smoke:{x:392,y:66,size:40,alpha:.76}},
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
      .setOrigin(.5).setTint(0x000000).setAlpha(.32).setDepth(1);
    this.add.image(C.ORIGIN_X, centerY, 'iso_city_grass').setOrigin(.5).setDepth(2);
    this.add.image(C.ORIGIN_X, centerY, 'iso_city_pavement').setOrigin(.5).setDepth(3);

    // Um único piso distrital mantém quatro quintais e duas ruas internas
    // perfeitamente contínuas, sem sobreposição de losangos independentes.
    const residential = this.project(6.60, 21.20);
    this.add.image(residential.x, residential.y, 'iso_residential_ground')
      .setOrigin(.5).setDisplaySize(768, 384).setDepth(4 + residential.y / 100000);

    // O Marco de Senda fica em um pequeno jardim próprio junto à praça.
    this.addGrassLot(17.50, 17.80, 2.55);
    this.addGrassLot(20.60, 19.40, 1.82);
    this.createAnimatedGrassDetails();
  }

  addGrassLot(u, v, logicalSize) {
    const p = this.project(u, v);
    return this.add.image(p.x, p.y, 'iso_grass_patch')
      .setDisplaySize(logicalSize * AetherCityScene.TILE_WIDTH, logicalSize * AetherCityScene.TILE_HEIGHT)
      .setDepth(4 + p.y / 100000);
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
        .setDepth(4.35 + p.y / 100000);
      tuft.play('city-grass-sway');
      tuft.anims.setProgress((index % 4) / 4);
      return tuft;
    });
  }

  createCollisionPlan() {
    const C = AetherCityScene;
    const wall = 1.10;
    const wallStart = C.CITY_MIN - wall / 2;
    const wallEnd = C.CITY_MAX + wall / 2;

    // A faixa coincide com toda a base visível da muralha. A versão anterior
    // bloqueava só o eixo central (.48), deixando uma faixa caminhável dentro
    // da própria pedra.
    this.addBlockedRect(wallStart, wallStart, wall, wallEnd - wallStart, 'muralha noroeste');
    this.addBlockedRect(wallStart, wallStart, wallEnd - wallStart, wall, 'muralha nordeste');

    // Lateral leste (u=26) com vão central.
    this.addBlockedRect(C.CITY_MAX - wall / 2, wallStart, wall, 12.02 - wallStart, 'muralha leste norte');
    this.addBlockedRect(C.CITY_MAX - wall / 2, 15.98, wall, wallEnd - 15.98, 'muralha leste sul');
    this.addBlockedRect(25.05, 11.50, 1.80, 1.72, 'torre norte do Portão Leste');
    this.addBlockedRect(25.05, 14.78, 1.80, 1.72, 'torre sul do Portão Leste');

    // Lateral sul (v=26) com vão central.
    this.addBlockedRect(wallStart, C.CITY_MAX - wall / 2, 12.02 - wallStart, wall, 'muralha sul oeste');
    this.addBlockedRect(15.98, C.CITY_MAX - wall / 2, wallEnd - 15.98, wall, 'muralha sul leste');
    this.addBlockedRect(11.50, 25.05, 1.72, 1.80, 'torre oeste do Portão Sul');
    this.addBlockedRect(14.78, 25.05, 1.72, 1.80, 'torre leste do Portão Sul');

    // Os edifícios não recebem retângulos genéricos. A colisão é lida da
    // opacidade real da faixa inferior de cada imagem em isBlocked().
    const buildingPlan = this.getBuildingPlan();

    // Obstáculos ilustrados usam a base visível em tela, não o quadrado
    // transparente do PNG. Isso é especialmente importante para a fonte.
    const fountain = this.project(14, 14);
    this.addBlockedScreenEllipse(fountain.x + 9, fountain.y - 39, 69, 19, 'base desenhada da fonte');
    const waystone = this.project(17.50, 17.80);
    this.addBlockedScreenEllipse(waystone.x, waystone.y - 5, 42, 14, 'base do Marco de Senda');
    // Só o tronco bloqueia, por todos os lados; a copa continua oclusora.
    const tree = this.project(20.60, 19.40);
    this.addBlockedScreenEllipse(tree.x, tree.y - 14, 14, 10, 'tronco da árvore do Marco');

    this.cityBuildingRects = buildingPlan.map(({label, rect:[u,v,w,h]}) => ({label, u1:u, v1:v, u2:u+w, v2:v+h}));
  }

  addBlockedRect(u, v, width, height, label) {
    this.blockedRects.push({u1: u, v1: v, u2: u + width, v2: v + height, label});
  }

  addBlockedCircle(u, v, radius, label) {
    this.blockedCircles.push({u, v, radius, label});
  }

  addBlockedScreenEllipse(x, y, radiusX, radiusY, label) {
    this.blockedScreenEllipses.push({x, y, radiusX, radiusY, label});
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
    // Nos cantos laterais, uma única pedra tridimensional cobre a face de fim
    // dos dois módulos. Topo e base continuam usando seu encontro natural.
    this.addWallCorner(C.CITY_MIN,C.CITY_MAX);
    this.addWallCorner(C.CITY_MAX,C.CITY_MIN);

    const gateTargetWidth = 384;
    const east = this.project(26.03, 14.0);
    const eastGateSource = this.textures.get('iso_city_gate_east').getSourceImage();
    this.eastGateSprite = this.add.image(east.x, east.y - 3, 'iso_city_gate_east')
      .setOrigin(.5, .5).setScale(gateTargetWidth / eastGateSource.width)
      .setDepth(this.depthAt(26, 14, .15));
    this.registerOccluder(this.eastGateSprite, 'iso_city_gate_east', east.y + 8);

    const south = this.project(14.0, 26.03);
    const southGateSource = this.textures.get('iso_city_gate').getSourceImage();
    this.southGateSprite = this.add.image(south.x, south.y - 3, 'iso_city_gate')
      .setOrigin(.5, .5).setScale(gateTargetWidth / southGateSource.width)
      .setDepth(this.depthAt(14, 26, .15));
    this.registerOccluder(this.southGateSprite, 'iso_city_gate', south.y + 8);
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
      const image = this.add.image(Math.round(p.x), Math.round(p.y - 14), 'iso_city_wall')
        .setOrigin(.5, .5).setFlipX(flip)
        .setScale(tileScale)
        .setDepth(this.depthAt(u, v, .08));
      this.wallSprites.push(image);
      this.registerOccluder(image, 'iso_city_wall', p.y + 7, {behindMargin: 8});
    }
  }

  addWallCorner(u,v){
    const p=this.project(u,v),source=this.textures.get('iso_city_wall_corner').getSourceImage();
    const scale=136/source.height;
    const image=this.add.image(Math.round(p.x),Math.round(p.y-14),'iso_city_wall_corner')
      .setOrigin(.5,.5).setScale(scale).setDepth(this.depthAt(u,v,.13));
    this.wallSprites.push(image);
    this.registerOccluder(image,'iso_city_wall_corner',p.y+7,{behindMargin:8});
    return image;
  }

  createBuildings() {
    this.cityBuildings = [];
    this.blockedBuildingMasks = [];
    for (const building of this.getBuildingPlan()) {
      const image = this.addIsoImage(building.key, building.u, building.v, building.height);
      if (building.flipX) image.setFlipX(true);
      const entry = {...building, image};
      this.cityBuildings.push(entry);
      this.blockedBuildingMasks.push(entry);
      this.registerOccluder(image, building.key, image.y - 2, {behindMargin: 10});
      if (building.smoke) this.createChimneySmoke(entry);
    }
  }

  createChimneySmoke(building) {
    if (!building?.image || !building?.smoke || !this.textures.exists('chimney_smoke')) return;
    if (!this.anims.exists('city-chimney-smoke')) {
      this.anims.create({
        key: 'city-chimney-smoke',
        frames: this.anims.generateFrameNumbers('chimney_smoke', {frames:[0,1,2,3]}),
        frameRate: 4,
        repeat: -1
      });
    }
    const image = building.image;
    const profile = building.smoke;
    const source = this.textures.get(building.key).getSourceImage();
    const sourceX = image.flipX ? source.width - profile.x : profile.x;
    const mouthX = image.x + (sourceX - source.width / 2) * Math.abs(image.scaleX);
    const mouthY = image.y - (source.height - profile.y) * Math.abs(image.scaleY);
    const smokeScale = (profile.size ?? 40) / 96;
    const smoke = this.add.sprite(mouthX, mouthY + 38 * smokeScale, 'chimney_smoke', 0)
      .setOrigin(.5, 1).setScale(smokeScale).setAlpha(profile.alpha ?? .78)
      .setTint(profile.tint ?? 0xd8d4ca).setDepth(image.depth + .004);
    smoke.play('city-chimney-smoke');
    smoke.anims.setProgress((this.chimneySmokes?.length ?? 0) % 4 / 4);
    this.chimneySmokes ??= [];
    this.chimneySmokes.push(smoke);
  }

  createPlazaAndStreets() {
    // A fonte ocupa o centro exato da praça. O pavimento base já forma uma
    // malha contínua até todas as fachadas, sem postes, cercas ou caixotes.
    this.fountain = this.addIsoImage('city_fountain', 14, 14, 176, .03);
    this.registerOccluder(this.fountain, 'city_fountain', this.fountain.y - 3);

    const u = 20.60, v = 19.40;
    // Compensa o padding inferior do PNG para o tronco pousar no centro exato
    // do losango de grama.
    const tree = this.addIsoImage('city_tree', u, v, 184, .02, 13);
    this.cityTree = tree;
    this.registerOccluder(tree, 'city_tree', tree.y - 4);
  }

  addIsoImage(key, u, v, targetHeight, depthOffset = 0, screenYOffset = 0) {
    const p = this.project(u, v);
    const source = this.textures.get(key).getSourceImage();
    const scale = targetHeight / source.height;
    return this.add.image(p.x, p.y + screenYOffset, key).setOrigin(.5, 1).setScale(scale).setDepth(this.depthAt(u, v, depthOffset));
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
    return entry;
  }

  createNpcs() {
    const fronts = Object.fromEntries(this.getBuildingPlan().filter(b => b.npc).map(b => [b.id, b.npc]));
    const healerRestored = this.isHealerFaithRestored();
    const specs = [
      ['merchant', 'Aldren Voss', 'Mercador', ...fronts.merchant, ['Tenho suprimentos para quem pretende atravessar os arredores.'], {shop: true, portrait: 'portrait_aldren', idleProfile: 'merchant', iso: 'merchant_iso', action: 'merchant_iso_action', height: 112, flipX: true}],
      ['blacksmith', 'Borin Ferramão', 'Ferreiro', ...fronts.blacksmith, ['Minha ferraria ainda está sendo reconstruída. Minhas ferramentas desapareceram durante a invasão.', 'Quando eu recuperar minhas ferramentas, poderei trabalhar novamente.'], {portrait: 'portrait_borin', idleProfile: 'blacksmith', iso: 'blacksmith_iso', action: 'blacksmith_iso_action', height: 114}],
      ['healer', 'Elara Veyn', 'Curandeira', ...fronts.healer, ['Perdi minha fé depois dos acontecimentos sombrios. Não consigo invocar minha bênção agora.', 'Talvez, quando minha fé retornar, eu possa ajudar os feridos novamente.'], {portrait: healerRestored?'portrait_elara':'portrait_elara_devastated', idleProfile: 'healer', iso: healerRestored?'healer_iso':'healer_iso_devastated', action: healerRestored?'healer_iso_action':null, height: 112}],
      ['tavernkeeper', 'Garrick Brenn', 'Taverneiro', ...fronts.tavern, ['A taverna ainda não abriu. Faltam alimentos e insumos para as bebidas.', 'Quando conseguirmos os suprimentos, espero abrir as portas novamente.'], {portrait: 'portrait_garrick', idleProfile: 'tavernkeeper', iso: 'tavernkeeper_iso', action: 'tavernkeeper_iso_action', height: 114}],
      ['scholar', 'Lysandra Vael', 'Erudita', ...fronts.scholar, ['O mundo perdeu o sentido depois dos acontecimentos sombrios...', 'Talvez um dia eu volte a estudar os antigos encantamentos.'], {portrait: 'portrait_lysandra', idleProfile: 'scholar', iso: 'scholar_iso', action: 'scholar_iso_action', height: 110}],
      ['artisan', 'Maelis Tessara', 'Artesã', ...fronts.artisan, ['Minha oficina ainda é simples, mas já consigo consertar panos e costuras.', 'Quando os caminhos estiverem seguros, vou transformá-la em uma verdadeira oficina encantada.'], {portrait: 'portrait_maelis', idleProfile: 'artisan', iso: 'artisan_iso', action: 'artisan_iso_action', height: 112}],
      ['elder_mira', 'Mira Edevane', 'Anciã de Aether', 16.90, 13.05, ['A floresta ficou perigosa. Se trouxer provas dos monstros, conversaremos sobre o assunto.'], {portrait: 'portrait_mira', idleProfile: 'elder', iso: 'elder_mira_iso', action: 'elder_mira_iso_action', height: 118}],
      ['general', 'Cassian Vhal', 'General de Aether', 12.35, 15.15, ['Defender Aether está se tornando mais difícil a cada dia. Há monstros demais rondando os arredores, e meus soldados não podem vigiar todos os caminhos.', 'Mas escute bem: enquanto eu comandar estas muralhas, nenhum deles tomará esta cidade.'], {portrait: 'portrait_general', idleProfile: 'general', iso: 'general_iso', action: 'general_iso_action', height: 118}],
      ['guard', 'Kael Dorn', 'Guarda do Portão Leste', 24.20, 13.05, ['Estamos protegendo a saída leste. Tenha cuidado ao deixar os muros.'], {portrait: 'portrait_kael', idleProfile: 'east_guard', iso: 'guard_iso', action: 'guard_iso_action', height: 116, gateGuard: true, facing:'northWest'}],
      ['south_guard', 'Bren Harrow', 'Guarda do Sul', 13.05, 24.20, ['Mantemos esta passagem protegida. Lá fora, os monstros não respeitam ninguém.'], {portrait: 'portrait_bren', idleProfile: 'south_guard', iso: 'south_guard_iso', action: 'south_guard_iso_action', height: 116, gateGuard: true, facing:'northEast', flipX:true}]
    ];

    for (const [texture, name, role, u, v, pages, options] of specs) {
      const p = this.project(u, v);
      const npc = new Npc(this, p.x, p.y, name, pages, {
        shop: !!options.shop, role, portrait: options.portrait, idleProfile: options.idleProfile,
        idleFacing: options.facing ?? 'down', visualScale: options.scale ?? .60
      });
      const converted = options.iso && npc.setIsometricSprite?.(options.iso, {
        height: options.height, facing: options.facing ?? 'down', actionTexture: options.action, flipX: !!options.flipX
      });
      if (!converted) npc.setRealSprite?.(texture);
      npc.isoLogical = {u, v};
      npc.isGateGuard = !!options.gateGuard;
      npc.setDepth(this.depthAt(u, v, npc.isGateGuard ? .34 : .06));
      this.cityActors.push(npc);
      this.fixedNpcLogical.push({u, v, radius: .28, name});
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
      this.createWalker('resident', 'resident_iso_walk', 'Tomas Belmon', 'Morador de Aether', ['A praça ainda é o lugar mais seguro de Aether.'], residentRoute, 110, 44, 700, 'portrait_tomas'),
      this.createWalker('traveler', 'traveler_iso_walk', 'Darian Kestrel', 'Viajante', ['Ouvi rumores sobre o castelo.'], travelerRoute, 112, 50, 1100, 'portrait_darian')
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

  installAmbientAnimations() {
    const a = this.anims;
    const ensure = (key, texture, frames, rate) => {
      if (!a.exists(key)) a.create({key, frames: a.generateFrameNumbers(texture, {frames}), frameRate: rate, repeat: -1});
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
    this.tavernRatRoute = {
      leftHidden: {x:image.x - image.displayWidth * .33, y:image.y - image.displayHeight * .17},
      leftReveal: {x:image.x - image.displayWidth * .48, y:image.y - 4},
      rightReveal: {x:image.x + image.displayWidth * .48, y:image.y - 4},
      rightHidden: {x:image.x + image.displayWidth * .33, y:image.y - image.displayHeight * .17},
      tavern
    };
    const start = this.tavernRatRoute.leftHidden;
    this.tavernRat = this.add.sprite(start.x, start.y, 'city_rat_gray', 0)
      .setOrigin(.5, .86).setScale(.76).setVisible(false).setAlpha(1);
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
    const tavernDepth = this.tavernRatRoute.tavern.image.depth;
    rat.setTexture(texture, 0).setPosition(route[0].x, route[0].y).setFlipX(route[3].x < route[0].x)
      .setVisible(true).setAlpha(1).play(animation, true);
    rat.ambientDepthOverride = tavernDepth - .025;

    this.tweens.add({
      targets: rat, x: route[1].x, y: route[1].y, duration: 420, ease: 'Linear',
      onComplete: () => {
        rat.ambientDepthOverride = this.cityDepth(rat.y, .035);
        this.tweens.add({
          targets: rat, x: route[2].x, y: route[2].y, duration: Phaser.Math.Between(1500, 1850), ease: 'Linear',
          onUpdate: () => { rat.ambientDepthOverride = this.cityDepth(rat.y, .035); },
          onComplete: () => {
            rat.ambientDepthOverride = tavernDepth - .025;
            this.tweens.add({
              targets: rat, x: route[3].x, y: route[3].y, duration: 420, ease: 'Linear',
              onComplete: () => {
                rat.stop().setVisible(false).setAlpha(1);
                rat.ambientDepthOverride = null;
                this.scheduleTavernRat();
              }
            });
          }
        });
      }
    });
  }

  routeAmbient(texture, animation, logicalRoute, scale, speed, startDelay) {
    const route = logicalRoute.map(([u, v]) => ({...this.project(u, v), pause: 520 + Phaser.Math.Between(0, 500)}));
    const first = route[0];
    const sprite = this.add.sprite(first.x, first.y, texture, 0).setOrigin(.5, .86).setScale(scale).setDepth(this.cityDepth(first.y, .03));
    sprite.play(animation);
    const state = {sprite, route, index: 1, speed, animation};
    this.ambientActors.push(sprite);
    this.time.delayedCall(startDelay, () => this.walkAmbientRoute(state));
    return sprite;
  }

  walkAmbientRoute(state) {
    if (!state?.sprite?.active) return;
    const sprite = state.sprite;
    const target = state.route[state.index % state.route.length];
    const distance = Phaser.Math.Distance.Between(sprite.x, sprite.y, target.x, target.y);
    sprite.setFlipX(target.x < sprite.x).play(state.animation, true);
    this.tweens.add({
      targets: sprite, x: target.x, y: target.y, duration: Math.max(420, distance / state.speed * 1000), ease: 'Linear',
      onUpdate: () => sprite.setDepth(this.cityDepth(sprite.y, .03)),
      onComplete: () => {
        state.index = (state.index + 1) % state.route.length;
        this.time.delayedCall(target.pause, () => this.walkAmbientRoute(state));
      }
    });
  }

  createOldManAndBirdsIso() {
    // O velhinho agora participa da praça e permanece próximo à fonte.
    const homeLogical = {u: 15.50, v: 15.30};
    const home = this.project(homeLogical.u, homeLogical.v);
    // Os quatro quadros usam célula, escala corporal e linha dos pés idênticas.
    const elderScale = 116 / 224;
    this.oldMan = this.add.sprite(home.x, home.y, 'elder_feeder_iso', 0)
      .setOrigin(.5, 1).setScale(elderScale).setDepth(this.cityDepth(home.y, .05));
    this.oldMan.play('elder-feed-birds');
    this.ambientActors.push(this.oldMan);

    [[15.85,15.45,.75], [16.20,15.72,.70], [15.60,15.90,.66], [16.38,15.36,.63]].forEach(([u,v,scale], i) => {
      const p = this.project(u, v);
      const bird = this.add.sprite(p.x, p.y, 'city_bird', i % 2).setOrigin(.5, 1).setScale(scale).setDepth(this.cityDepth(p.y, .03));
      this.time.delayedCall(i * 260, () => bird.play('city-bird-peck'));
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
      localName: 'CIDADE DE AETHER • ISOMÉTRICA', markers: [
        {...this.project(14,14), color: 0x7ee0ff, label: 'Praça'},
        {...this.project(26,14), color: 0xffd166, label: 'Leste'},
        {...this.project(14,26), color: 0x73e6a8, label: 'Sul'}
      ]
    });
    this.shop = new ShopPanel(this, this.player, this.inv, this.equip, () => this.saveGame());
    this.dialogue = new ChoiceDialogueBox(this);
    this.npcDialogue = new NpcDialoguePanel(this);
    this.shop.visible = false;
    this.death = new DeathOverlay(this);

    const center = this.project(17.50, 17.80);
    // O PNG ultrapassa a própria origem em 11 px; a compensação centraliza a
    // base desenhada no jardim sem alterar a posição lógica do Marco.
    const waystoneY = center.y - 11;
    this.waystone = new Waystone(this, center.x, waystoneY, 'CIDADE DE AETHER');
    this.waystone.setDepth(this.cityDepth(center.y, .07));
    this.waystone.sprite?.setDisplaySize(150, 150);
    if (this.waystone.sprite) {
      this.registerOccluder(this.waystone.sprite, 'waystone_dormant', center.y - 2, {
        worldX: center.x, worldY: waystoneY,
        originX: this.waystone.sprite.originX, originY: this.waystone.sprite.originY
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
    const nx = ix / length, ny = iy / length;
    const dt = Math.min(delta / 1000, .034);
    const screenSpeed = 176;
    const sx = nx * screenSpeed, sy = ny * screenSpeed;
    const du = (sx / AetherCityScene.TILE_WIDTH + sy / AetherCityScene.TILE_HEIGHT) * dt;
    const dv = (-sx / AetherCityScene.TILE_WIDTH + sy / AetherCityScene.TILE_HEIGHT) * dt;

    this.tryMove(du, 0);
    this.tryMove(0, dv);
    this.player.updateFacing(nx,ny);
    this.player.playMove(true);
    this.updatePlayerProjection();
  }

  stopPlayer() {
    this.player.body?.setVelocity(0, 0);
    this.player.playMove(false);
    this.updatePlayerProjection();
  }

  tryMove(du, dv) {
    const u = this.logicalPlayer.u + du, v = this.logicalPlayer.v + dv;
    if (!this.isBlocked(u, v, this.logicalPlayer.radius)) {
      this.logicalPlayer.u = u;
      this.logicalPlayer.v = v;
    }
  }

  isOutsideCityWallEnvelope(u, v, radius) {
    const C = AetherCityScene;
    // A parede traseira tem volume visual maior que sua linha de apoio; a
    // margem 3.12 impede entrar na pedra atrás da ferraria e do mercado.
    const innerMin = 3.12;
    const innerMax = 25.35;
    const gateMin = 13.22;
    const gateMax = 14.78;
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

  isBlocked(u, v, radius) {
    const C = AetherCityScene;
    if (u < .68 + radius || v < .68 + radius || u > C.MAP_SIZE - .68 - radius || v > C.MAP_SIZE - .68 - radius) return true;
    if (this.isOutsideCityWallEnvelope(u, v, radius)) return true;
    for (const rect of this.blockedRects) {
      const nearestU = Phaser.Math.Clamp(u, rect.u1, rect.u2);
      const nearestV = Phaser.Math.Clamp(v, rect.v1, rect.v2);
      if (Math.hypot(u - nearestU, v - nearestV) < radius) return true;
    }
    for (const circle of this.blockedCircles) if (Math.hypot(u - circle.u, v - circle.v) < radius + circle.radius) return true;
    const foot = this.project(u, v);
    const playerPadX = radius * AetherCityScene.TILE_WIDTH / Math.SQRT2;
    const playerPadY = radius * AetherCityScene.TILE_HEIGHT / Math.SQRT2;
    for (const ellipse of this.blockedScreenEllipses) {
      const dx = (foot.x - ellipse.x) / (ellipse.radiusX + playerPadX);
      const dy = (foot.y - ellipse.y) / (ellipse.radiusY + playerPadY);
      if (dx * dx + dy * dy < 1) return true;
    }
    if (this.isBlockedByBuildingMask(u, v, radius)) return true;
    for (const npc of this.fixedNpcLogical) if (Math.hypot(u - npc.u, v - npc.v) < radius + npc.radius) return true;
    return false;
  }

  isBlockedByBuildingMask(u, v, radius) {
    if (!this.blockedBuildingMasks?.length) return false;
    const foot = this.project(u, v);
    const spreadX = Math.max(8, radius * 42);
    const spreadY = Math.max(4, radius * 18);
    const footSamples = [[0,0],[-spreadX,0],[spreadX,0],[0,-spreadY],[0,spreadY]];
    // Em aproximação frontal, cabeça e tronco contam para o contato visual.
    // Atrás do prédio, somente os pés bloqueiam e a silhueta dourada assume.
    const bodySamples = [[0,-62],[-10,-51],[10,-51],[-11,-37],[11,-37],[0,-23]];

    for (const building of this.blockedBuildingMasks) {
      const image = building.image;
      if (!image?.active) continue;
      const source = this.textures.get(building.key).getSourceImage();
      const scaleX = Math.abs(image.scaleX) || 1;
      const scaleY = Math.abs(image.scaleY) || 1;
      const left = image.x - source.width * scaleX * image.originX;
      const top = image.y - source.height * scaleY * image.originY;
      const bandStart = source.height * (building.collisionBand ?? .64);

      for (const [offsetX, offsetY] of footSamples) {
        let sourceX = Math.floor((foot.x + offsetX - left) / scaleX);
        const sourceY = Math.floor((foot.y + offsetY - top) / scaleY);
        if (image.flipX) sourceX = source.width - 1 - sourceX;
        if (sourceX < 0 || sourceX >= source.width || sourceY < bandStart || sourceY >= source.height) continue;
        const alpha = this.textures.getPixelAlpha(sourceX, sourceY, building.key);
        if (alpha !== null && alpha >= 24) return true;
      }

      if (foot.y < image.y - 8) continue;
      for (const [offsetX, offsetY] of bodySamples) {
        let sourceX = Math.floor((foot.x + offsetX - left) / scaleX);
        const sourceY = Math.floor((foot.y + offsetY - top) / scaleY);
        if (image.flipX) sourceX = source.width - 1 - sourceX;
        if (sourceX < 0 || sourceX >= source.width || sourceY < 0 || sourceY >= source.height) continue;
        const alpha = this.textures.getPixelAlpha(sourceX, sourceY, building.key);
        if (alpha !== null && alpha >= 36) return true;
      }
    }
    return false;
  }

  updatePlayerProjection() {
    const p = this.project(this.logicalPlayer.u, this.logicalPlayer.v);
    this.player.setPosition(Math.round(p.x), Math.round(p.y));
    this.player.body?.setVelocity(0, 0);
    this.playerNaturalDepth = this.cityDepth(p.y, .015);
    this.player.setDepth(this.playerNaturalDepth);
    this.player.setVisible(true).setAlpha(1);
    this.playerShadow?.setPosition(Math.round(p.x), Math.round(p.y + 4)).setDepth(this.cityDepth(p.y, .005)).setAlpha(.28);
    this.syncPlayerOcclusionOutline();
    this.updateUniversalOcclusion();
  }

  syncPlayerOcclusionOutline() {
    const outline = this.playerOutline;
    if (!outline?.active || !this.player?.frame) return;
    const frameName = this.player.frame?.name;
    const outlineKey = this.player.getOutlineTextureKey();
    if (outlineKey && (outline.texture?.key !== outlineKey || outline.frame?.name !== frameName)) {
      outline.setTexture(outlineKey, frameName);
    }
    outline.setPosition(this.player.x, this.player.y)
      .setOrigin(this.player.originX, this.player.originY)
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
      if (!image?.active || this.player.y >= occluder.baseY - occluder.behindMargin) continue;
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
      highestOccluderDepth = Math.max(highestOccluderDepth, image.parentContainer?.depth ?? image.depth ?? 0);
      lowestOccluderDepth = Math.min(lowestOccluderDepth, image.parentContainer?.depth ?? image.depth ?? 0);
    }

    if (totalHits >= 2) {
      // O sprite real permanece abaixo do objeto e é recortado pela própria
      // transparência dele; acima aparece somente a silhueta vazada dourada.
      this.player.setDepth(Math.min(this.playerNaturalDepth, lowestOccluderDepth - .02));
      this.playerShadow?.setDepth(this.player.depth - .01);
      outline.setVisible(true)
        .setAlpha(Phaser.Math.Clamp(.58 + totalHits / 18, .58, 1))
        .setDepth(highestOccluderDepth + .32);
    } else {
      this.player.setDepth(this.playerNaturalDepth);
      this.playerShadow?.setDepth(this.cityDepth(this.player.y, .005));
      outline.setVisible(false).setAlpha(0);
    }
  }

  updateActorDepths() {
    for (const actor of this.cityActors) actor?.setDepth(this.cityDepth(actor.y, actor.isGateGuard ? .34 : .06));
    for (const actor of this.ambientActors) actor?.setDepth(actor.ambientDepthOverride ?? this.cityDepth(actor.y, .03));
    if (this.oldMan) this.oldMan.setDepth(this.cityDepth(this.oldMan.y, .05));
  }

  checkGateTransitions() {
    const {u, v} = this.logicalPlayer;
    if (u > 26.58 && v > 13.22 && v < 14.78) this.exitCity('east');
    else if (v > 26.58 && u > 13.22 && u < 14.78) this.exitCity('south');
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
      name: near.npcName, role: near.npcRole || '', pages: near.text, portraitKey: near.npcPortrait, spriteKey: near.textureKey,
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
    this.dialogueF = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.F);
    this.dialogue.open('Marco de Senda', this.waystone.readMessage(), [{label: 'Fechar', onSelect: () => this.closeDialogue()}]);
  }

  handleDeath() {
    if (this.respawnTimer) return;
    this.hud.openExternalModal();
    this.death.show('Respawn em 2 segundos');
    this.respawnTimer = this.time.delayedCall(2000, () => {
      this.logicalPlayer.u = 14;
      this.logicalPlayer.v = 25.02;
      const p = this.project(14, 25.02);
      this.player.respawn(p.x, p.y);
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
      scenePositions: {...(old?.scenePositions || {}), [this.scene.key]: {x: this.player.x, y: this.player.y, u: this.logicalPlayer.u, v: this.logicalPlayer.v}}
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
      window.removeEventListener('beforeunload', this._unload);
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
