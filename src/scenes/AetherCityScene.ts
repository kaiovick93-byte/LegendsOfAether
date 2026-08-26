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
 * Round 65 — ferraria de Borin reconstruída com arquitetura isométrica 2.5D.
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
    this.blockedBuildingMasks = [];
    this.occluders = [];
    this.fixedNpcLogical = [];
    this.cityActors = [];
    this.ambientActors = [];
    // Primeiro quadro já dentro da avenida: nenhuma torre encobre o herói.
    this.logicalPlayer = {u: 14, v: 21.40, radius: .27};

    this.initializeSystems();
    this.loadGame();
    this.configurePlayerVisual();

    this.physics.world.setBounds(0, 0, AetherCityScene.WORLD_WIDTH, AetherCityScene.WORLD_HEIGHT);
    this.cameras.main.setBackgroundColor('#0c1717');
    this.cameras.main.setBounds(0, 0, AetherCityScene.WORLD_WIDTH, AetherCityScene.WORLD_HEIGHT);
    this.cameras.main.setDeadzone(220, 100);
    this.cameras.main.startFollow(this.player, true, .12, .12, 0, -90);
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

    if (save) {
      this.player.loadState(save.player);
      this.inv.load(save.inventory);
      this.equip.load(save.equipment, this.inv);
      this.skillManager.load(save.skills);
      this.questManager.load(save.quests);
      this.classManager.load(this.player, save.characterClass || this.player.characterClass);
    } else {
      this.player.applyClass(this.registry.get('selectedClass') || 'warrior');
      this.registry.remove('selectedClass');
      this.inv.add('healing_potion', 2);
      this.inv.add('mana_potion', 2);
      this.player.gold = 25;
    }

    this.entryFacing = 'down';
    if (entrance === 'east') {
      this.logicalPlayer = {u: 21.40, v: 14, radius: .27};
      this.entryFacing = 'left';
    } else if (entrance === 'south') {
      this.logicalPlayer = {u: 14, v: 21.40, radius: .27};
      this.entryFacing = 'up';
    } else if ((save?.worldFlags?.cityRound64Migrated || save?.worldFlags?.cityRound63Migrated) && Number.isFinite(savedPos?.u) && Number.isFinite(savedPos?.v)) {
      this.logicalPlayer.u = Phaser.Math.Clamp(savedPos.u, 2.7, 25.3);
      this.logicalPlayer.v = Phaser.Math.Clamp(savedPos.v, 2.7, 25.3);
    }
    this.registry.remove('aetherCityEntrance');
    this.equip.sync();
  }

  configurePlayerVisual() {
    // O protótipo podia deixar o herói atrás de uma camada longa de muralha.
    // A cena oficial usa a classe Player, força uma textura conhecida e mantém
    // o depth pela linha dos pés em cada quadro.
    const texture = this.textures.exists('player') ? 'player' : 'player-fallback';
    const frame = texture === 'player' ? 1 : 0;
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
      const outlineTexture = this.textures.exists('player_outline_gold') ? 'player_outline_gold' : texture;
      this.playerOutline = this.add.sprite(this.player.x, this.player.y, outlineTexture, frame)
        .setOrigin(this.player.originX, this.player.originY).setScale(this.player.scaleX, this.player.scaleY)
        .setVisible(false).setAlpha(0);
    } else {
      this.playerOutline.setTexture(this.textures.exists('player_outline_gold') ? 'player_outline_gold' : texture, frame);
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
    // Uma única planta alimenta arte, gramado, colisão e posição dos NPCs.
    // O ponto do NPC fica sempre além da borda frontal do próprio footprint.
    return [
      {id:'merchant', key:'merchant_shop', label:'Mercado de Aldren', u:6.60, v:13.35, height:238, rect:[4.95,11.85,3.25,2.90], npc:[8.45,15.02], collisionBand:.62},
      {id:'scholar', key:'scholar_house', label:'Arquivo de Lysandra', u:6.40, v:8.35, height:232, rect:[4.75,6.85,3.25,2.90], npc:[8.25,10.02], collisionBand:.64},
      {id:'blacksmith', key:'blacksmith_shop', label:'Ferraria de Borin', u:10.00, v:6.30, height:225, rect:[8.30,4.80,3.40,2.90], npc:[11.95,7.98], collisionBand:.62},
      {id:'healer', key:'healer_house', label:'Botica e Estufa de Elara', u:14.85, v:6.30, height:232, rect:[13.10,4.80,3.50,2.90], npc:[16.85,7.98], collisionBand:.64},
      {id:'tavern', key:'tavern_house', label:'Grande Taverna de Garrick', u:19.55, v:6.65, height:238, rect:[17.70,5.10,3.70,3.00], npc:[21.65,8.38], collisionBand:.62},
      {id:'artisan', key:'artisan_house', label:'Ateliê de Maelis', u:17.80, v:11.20, height:230, rect:[16.10,9.65,3.40,3.00], npc:[19.75,12.93], collisionBand:.64},
      // Distrito residencial único, em dois alinhamentos contíguos.
      {id:'house_red', key:'residential_house_red', label:'Casa vermelha', u:4.60, v:19.00, height:218, rect:[3.20,17.45,2.80,2.70], collisionBand:.60},
      {id:'house_green', key:'residential_house_green', label:'Casa verde', u:7.80, v:19.00, height:218, rect:[6.40,17.45,2.80,2.70], collisionBand:.60},
      {id:'house_blue', key:'residential_house_blue', label:'Casa azul', u:4.60, v:22.20, height:218, rect:[3.20,20.65,2.80,2.70], collisionBand:.60},
      {id:'house_orange', key:'residential_house_orange', label:'Casa laranja', u:7.80, v:22.20, height:218, rect:[6.40,20.65,2.80,2.70], collisionBand:.60}
    ];
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

    // Somente o distrito residencial conserva pequenos quintais. Os seis
    // estabelecimentos nascem diretamente do pavimento diante de seus NPCs.
    for (const building of this.getBuildingPlan().filter(item => item.id.startsWith('house_'))) {
      const [u, v, width, height] = building.rect;
      this.addGrassLot(u + width / 2, v + height / 2, Math.max(width, height) + .42);
    }

    // O Marco de Senda fica em um pequeno jardim próprio junto à praça.
    this.addGrassLot(17.50, 17.80, 2.55);
    this.addGrassLot(20.60, 19.40, 1.82);
  }

  addGrassLot(u, v, logicalSize) {
    const p = this.project(u, v);
    return this.add.image(p.x, p.y, 'iso_grass_patch')
      .setDisplaySize(logicalSize * AetherCityScene.TILE_WIDTH, logicalSize * AetherCityScene.TILE_HEIGHT)
      .setDepth(4 + p.y / 100000);
  }

  createCollisionPlan() {
    const C = AetherCityScene;
    const wall = .48;

    // Muralhas traseiras inteiras.
    this.addBlockedRect(C.CITY_MIN - wall / 2, C.CITY_MIN - wall / 2, wall, 24 + wall, 'muralha noroeste');
    this.addBlockedRect(C.CITY_MIN - wall / 2, C.CITY_MIN - wall / 2, 24 + wall, wall, 'muralha nordeste');

    // Lateral leste (u=26) com vão central.
    this.addBlockedRect(25.76, 1.76, wall, 10.15, 'muralha leste norte');
    this.addBlockedRect(25.76, 16.10, wall, 10.14, 'muralha leste sul');
    this.addBlockedRect(25.30, 11.72, 1.25, 1.20, 'torre norte do Portão Leste');
    this.addBlockedRect(25.30, 15.08, 1.25, 1.20, 'torre sul do Portão Leste');

    // Lateral sul (v=26) com vão central.
    this.addBlockedRect(1.76, 25.76, 10.15, wall, 'muralha sul oeste');
    this.addBlockedRect(16.10, 25.76, 10.14, wall, 'muralha sul leste');
    this.addBlockedRect(11.72, 25.30, 1.20, 1.25, 'torre oeste do Portão Sul');
    this.addBlockedRect(15.08, 25.30, 1.20, 1.25, 'torre leste do Portão Sul');

    // Os edifícios não recebem retângulos genéricos. A colisão é lida da
    // opacidade real da faixa inferior de cada imagem em isBlocked().
    const buildingPlan = this.getBuildingPlan();

    this.addBlockedCircle(14, 14, .95, 'fonte da praça');
    this.addBlockedCircle(17.50, 17.80, .78, 'Marco de Senda');
    // Somente o tronco bloqueia; copa e galhos funcionam por profundidade.
    this.addBlockedCircle(20.60, 19.40, .30, 'tronco da árvore do Marco');

    this.cityBuildingRects = buildingPlan.map(({label, rect:[u,v,w,h]}) => ({label, u1:u, v1:v, u2:u+w, v2:v+h}));
  }

  addBlockedRect(u, v, width, height, label) {
    this.blockedRects.push({u1: u, v1: v, u2: u + width, v2: v + height, label});
  }

  addBlockedCircle(u, v, radius, label) {
    this.blockedCircles.push({u, v, radius, label});
  }

  createWallsAndGates() {
    const C = AetherCityScene;
    this.wallSprites = [];
    this.addWallRun('u', C.CITY_MIN, C.CITY_MIN, C.CITY_MAX, true);
    this.addWallRun('v', C.CITY_MIN, C.CITY_MIN, C.CITY_MAX, false);
    this.addWallRun('u', C.CITY_MAX, C.CITY_MIN, 11.85, true);
    this.addWallRun('u', C.CITY_MAX, 16.05, C.CITY_MAX, true);
    this.addWallRun('v', C.CITY_MAX, C.CITY_MIN, 11.85, false);
    this.addWallRun('v', C.CITY_MAX, 16.05, C.CITY_MAX, false);

    const east = this.project(26.03, 14.0);
    this.eastGateSprite = this.add.image(east.x + 12, east.y + 86, 'iso_city_gate_east')
      .setOrigin(.5, 1).setDisplaySize(400, 362)
      .setDepth(this.depthAt(26, 14, .15));
    this.registerOccluder(this.eastGateSprite, 'iso_city_gate_east', east.y + 8);

    const south = this.project(14.0, 26.03);
    this.southGateSprite = this.add.image(south.x, south.y + 70, 'iso_city_gate')
      .setOrigin(.5, 1).setDisplaySize(366, 255).setFlipX(true)
      .setDepth(this.depthAt(14, 26, .15));
    this.registerOccluder(this.southGateSprite, 'iso_city_gate', south.y + 8);
  }

  addWallRun(fixedAxis, fixed, start, end, flip) {
    const span = 3.30;
    for (let cursor = start; cursor < end - .04; cursor += span) {
      const next = Math.min(cursor + span + .12, end);
      const middle = (cursor + next) / 2;
      const u = fixedAxis === 'u' ? fixed : middle;
      const v = fixedAxis === 'v' ? fixed : middle;
      const p = this.project(u, v);
      const logicalLength = next - cursor;
      const image = this.add.image(p.x, p.y + 52, 'iso_city_wall')
        .setOrigin(.5, .79).setFlipX(flip)
        .setDisplaySize(logicalLength * 56 + 42, logicalLength * 30 + 126)
        .setDepth(this.depthAt(u, v, .08));
      this.wallSprites.push(image);
      this.registerOccluder(image, 'iso_city_wall', p.y + 5);
    }
  }

  createBuildings() {
    this.cityBuildings = [];
    this.blockedBuildingMasks = [];
    for (const building of this.getBuildingPlan()) {
      const image = this.addIsoImage(building.key, building.u, building.v, building.height);
      const entry = {...building, image};
      this.cityBuildings.push(entry);
      this.blockedBuildingMasks.push(entry);
      this.registerOccluder(image, building.key, image.y - 2);
    }
  }

  createPlazaAndStreets() {
    // A fonte ocupa o centro exato da praça. O pavimento base já forma uma
    // malha contínua até todas as fachadas, sem postes, cercas ou caixotes.
    this.fountain = this.addIsoImage('city_fountain', 14, 14, 176, .03);
    this.registerOccluder(this.fountain, 'city_fountain', this.fountain.y - 3);

    const u = 20.60, v = 19.40;
    const tree = this.addIsoImage('city_tree', u, v, 184, .02);
    this.cityTree = tree;
    this.registerOccluder(tree, 'city_tree', tree.y - 4);
  }

  addIsoImage(key, u, v, targetHeight, depthOffset = 0) {
    const p = this.project(u, v);
    const source = this.textures.get(key).getSourceImage();
    const scale = targetHeight / source.height;
    return this.add.image(p.x, p.y, key).setOrigin(.5, 1).setScale(scale).setDepth(this.depthAt(u, v, depthOffset));
  }

  registerOccluder(image, key, baseY, options = {}) {
    if (!image || !key) return null;
    const entry = {
      image, key, baseY,
      worldX: options.worldX,
      worldY: options.worldY,
      originX: options.originX,
      originY: options.originY,
      alphaThreshold: options.alphaThreshold ?? 24
    };
    this.occluders.push(entry);
    return entry;
  }

  createNpcs() {
    const fronts = Object.fromEntries(this.getBuildingPlan().filter(b => b.npc).map(b => [b.id, b.npc]));
    const specs = [
      ['merchant', 'Aldren Voss', 'Mercador', ...fronts.merchant, ['Tenho suprimentos para quem pretende atravessar os arredores.'], {shop: true, portrait: 'portrait_aldren', idleProfile: 'merchant', iso: 'merchant_iso', action: 'merchant_iso_action', height: 112}],
      ['blacksmith', 'Borin Ferramão', 'Ferreiro', ...fronts.blacksmith, ['Minha ferraria ainda está sendo reconstruída. Minhas ferramentas desapareceram durante a invasão.', 'Quando eu recuperar minhas ferramentas, poderei trabalhar novamente.'], {portrait: 'portrait_borin', idleProfile: 'blacksmith', iso: 'blacksmith_iso', action: 'blacksmith_iso_action', height: 114}],
      ['healer', 'Elara Veyn', 'Curandeira', ...fronts.healer, ['Perdi minha fé depois dos acontecimentos sombrios. Não consigo invocar minha bênção agora.', 'Talvez, quando minha fé retornar, eu possa ajudar os feridos novamente.'], {portrait: 'portrait_elara', idleProfile: 'healer', iso: 'healer_iso', action: 'healer_iso_action', height: 112}],
      ['tavernkeeper', 'Garrick Brenn', 'Taverneiro', ...fronts.tavern, ['A taverna ainda não abriu. Faltam alimentos e insumos para as bebidas.', 'Quando conseguirmos os suprimentos, espero abrir as portas novamente.'], {portrait: 'portrait_garrick', idleProfile: 'tavernkeeper', iso: 'tavernkeeper_iso', action: 'tavernkeeper_iso_action', height: 114}],
      ['scholar', 'Lysandra Vael', 'Erudita', ...fronts.scholar, ['O mundo perdeu o sentido depois dos acontecimentos sombrios...', 'Talvez um dia eu volte a estudar os antigos encantamentos.'], {portrait: 'portrait_lysandra', idleProfile: 'scholar', iso: 'scholar_iso', action: 'scholar_iso_action', height: 110}],
      ['artisan', 'Maelis Tessara', 'Artesã', ...fronts.artisan, ['Minha oficina ainda é simples, mas já consigo consertar panos e costuras.', 'Quando os caminhos estiverem seguros, vou transformá-la em uma verdadeira oficina encantada.'], {portrait: 'portrait_maelis', idleProfile: 'artisan', iso: 'artisan_iso', action: 'artisan_iso_action', height: 112}],
      ['elder_mira', 'Mira Edevane', 'Anciã de Aether', 12.0, 17.05, ['A floresta ficou perigosa. Se trouxer provas dos monstros, conversaremos sobre o assunto.'], {portrait: 'portrait_mira', idleProfile: 'elder', iso: 'elder_mira_iso', height: 112}],
      ['guard', 'Kael Dorn', 'Guarda do Portão Leste', 22.80, 17.10, ['Estamos protegendo a saída leste. Tenha cuidado ao deixar os muros.'], {portrait: 'portrait_kael', idleProfile: 'east_guard', iso: 'guard_iso', height: 116, gateGuard: true}],
      ['south_guard', 'Bren Harrow', 'Guarda do Sul', 17.80, 23.40, ['Mantemos esta passagem protegida. Lá fora, os monstros não respeitam ninguém.'], {portrait: 'portrait_bren', idleProfile: 'south_guard', iso: 'south_guard_iso', height: 116, gateGuard: true}]
    ];

    for (const [texture, name, role, u, v, pages, options] of specs) {
      const p = this.project(u, v);
      const npc = new Npc(this, p.x, p.y, name, pages, {
        shop: !!options.shop, role, portrait: options.portrait, idleProfile: options.idleProfile,
        idleFacing: 'down', visualScale: options.scale ?? .60
      });
      const converted = options.iso && npc.setIsometricSprite?.(options.iso, {
        height: options.height, facing: 'down', actionTexture: options.action
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
      if (texture === 'guard') this.rightGuard = npc;
      if (texture === 'south_guard') this.bottomGuard = npc;
    }

    // Circuitos próprios e livres de footprints: nenhum andarilho depende de
    // colisor móvel, portanto não fica travado ao cruzar outra pessoa.
    const residentRoute = [[9.8,15.8],[10.2,17.2],[11.2,18.6],[13.2,19.6],[15.2,20.2],[16.2,19.2],[16.0,17.2],[15.0,16.2],[13.4,16.4],[11.3,15.8]];
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
    const converted = npc.setIsometricWalkSprite?.(isoTexture, {height: targetHeight, facing: 'right'});
    if (!converted) npc.setRealSprite?.(texture);
    return npc;
  }

  createAmbientLife() {
    this.installAmbientAnimations();

    this.routeAmbient('city_dog', 'city-dog-walk', [[10.2,13.8],[10.7,12.2],[12.2,10.8],[14.0,10.6],[15.3,11.0],[15.3,11.8],[15.4,13.4],[16.5,14.4],[17.8,15.7],[16.5,16.4],[15.2,17.0],[13.5,16.8],[11.8,16.0]], .82, 34, 450);
    // Soma u+v constante: o gato se move horizontalmente na tela.
    this.routeAmbient('city_cat', 'city-cat-walk', [[10,22],[12,20],[14,18],[16,16],[14,18],[12,20]], .82, 31, 1200);

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
    ensure('city-rat-gray-run', 'city_rat_gray', [0,1,2,3], 10);
    ensure('city-rat-brown-run', 'city_rat_brown', [0,1,2,3], 11);
    ensure('city-rat-dark-run', 'city_rat_dark', [0,1,2,3], 11);
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
      .setOrigin(.5, .86).setScale(.58).setVisible(false).setAlpha(1);
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
      targets: rat, x: route[1].x, y: route[1].y, duration: 280, ease: 'Linear',
      onComplete: () => {
        rat.ambientDepthOverride = this.cityDepth(rat.y, .035);
        this.tweens.add({
          targets: rat, x: route[2].x, y: route[2].y, duration: Phaser.Math.Between(860, 1080), ease: 'Linear',
          onUpdate: () => { rat.ambientDepthOverride = this.cityDepth(rat.y, .035); },
          onComplete: () => {
            rat.ambientDepthOverride = tavernDepth - .025;
            this.tweens.add({
              targets: rat, x: route[3].x, y: route[3].y, duration: 280, ease: 'Linear',
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
    this.waystone = new Waystone(this, center.x, center.y, 'CIDADE DE AETHER');
    this.waystone.setDepth(this.cityDepth(center.y, .07));
    this.waystone.sprite?.setDisplaySize(150, 150);
    if (this.waystone.sprite) {
      this.registerOccluder(this.waystone.sprite, 'waystone_dormant', center.y - 2, {
        worldX: center.x, worldY: center.y,
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
    this.player.facing = Math.abs(nx) > Math.abs(ny) ? (nx > 0 ? 'right' : 'left') : (ny > 0 ? 'down' : 'up');
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

  isBlocked(u, v, radius) {
    const C = AetherCityScene;
    if (u < .68 + radius || v < .68 + radius || u > C.MAP_SIZE - .68 - radius || v > C.MAP_SIZE - .68 - radius) return true;
    for (const rect of this.blockedRects) {
      const nearestU = Phaser.Math.Clamp(u, rect.u1, rect.u2);
      const nearestV = Phaser.Math.Clamp(v, rect.v1, rect.v2);
      if (Math.hypot(u - nearestU, v - nearestV) < radius) return true;
    }
    for (const circle of this.blockedCircles) if (Math.hypot(u - circle.u, v - circle.v) < radius + circle.radius) return true;
    if (this.isBlockedByBuildingMask(u, v, radius)) return true;
    for (const npc of this.fixedNpcLogical) if (Math.hypot(u - npc.u, v - npc.v) < radius + npc.radius) return true;
    return false;
  }

  isBlockedByBuildingMask(u, v, radius) {
    if (!this.blockedBuildingMasks?.length) return false;
    const foot = this.project(u, v);
    const spreadX = Math.max(8, radius * 42);
    const spreadY = Math.max(4, radius * 18);
    const samples = [[0,0],[-spreadX,0],[spreadX,0],[0,-spreadY],[0,spreadY]];

    for (const building of this.blockedBuildingMasks) {
      const image = building.image;
      if (!image?.active) continue;
      const source = this.textures.get(building.key).getSourceImage();
      const scaleX = Math.abs(image.scaleX) || 1;
      const scaleY = Math.abs(image.scaleY) || 1;
      const left = image.x - source.width * scaleX * image.originX;
      const top = image.y - source.height * scaleY * image.originY;
      const bandStart = source.height * (building.collisionBand ?? .64);

      for (const [offsetX, offsetY] of samples) {
        const sourceX = Math.floor((foot.x + offsetX - left) / scaleX);
        const sourceY = Math.floor((foot.y + offsetY - top) / scaleY);
        if (sourceX < 0 || sourceX >= source.width || sourceY < bandStart || sourceY >= source.height) continue;
        const alpha = this.textures.getPixelAlpha(sourceX, sourceY, building.key);
        if (alpha !== null && alpha >= 24) return true;
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
    const outlineKey = this.textures.exists('player_outline_gold') ? 'player_outline_gold' : null;
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
    if (!outline?.active || !this.occluders?.length || !this.textures.exists('player_outline_gold')) return;
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
      if (!image?.active || this.player.y > occluder.baseY + 8) continue;
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
    if (u > 26.58 && v > 12.92 && v < 15.08) this.exitCity('east');
    else if (v > 26.58 && u > 12.92 && u < 15.08) this.exitCity('south');
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
      this.logicalPlayer.v = 21.40;
      const p = this.project(14, 21.40);
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
      worldFlags: {...(old?.worldFlags || {}), cityRound60Migrated: true, cityRound61Migrated: true, cityRound62Migrated: true, cityRound63Migrated: true, cityRound64Migrated: true},
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
