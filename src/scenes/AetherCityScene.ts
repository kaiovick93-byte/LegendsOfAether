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
 * Round 60 — Cidade de Aether oficial em 2.5D isométrico.
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

    if (entrance === 'east') this.logicalPlayer = {u: 21.40, v: 14, radius: .27};
    else if (entrance === 'south') this.logicalPlayer = {u: 14, v: 21.40, radius: .27};
    else if (Number.isFinite(savedPos?.u) && Number.isFinite(savedPos?.v)) {
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
    this.player.facing = 'down';
    if (!this.playerShadow?.active) {
      this.playerShadow = this.add.ellipse(this.player.x, this.player.y + 4, 38, 16, 0x000000, .28);
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

  createWorld() {
    this.createGround();
    this.createCollisionPlan();
    this.createWallsAndGates();
    this.createBuildings();
    this.createPlazaAndStreets();
    this.createChickenYard();
  }

  createGround() {
    const C = AetherCityScene;
    const centerY = C.ORIGIN_Y + C.MAP_SIZE * C.TILE_HEIGHT / 2;
    this.add.image(C.ORIGIN_X, centerY + 38, 'iso_city_grass')
      .setOrigin(.5).setTint(0x000000).setAlpha(.32).setDepth(1);
    this.add.image(C.ORIGIN_X, centerY, 'iso_city_grass').setOrigin(.5).setDepth(2);
    this.add.image(C.ORIGIN_X, centerY, 'iso_city_pavement').setOrigin(.5).setDepth(3);

    // Jardins têm textura contínua e acompanham a mesma projeção 2:1.
    [
      [5.0, 15.2, 3.2], [9.1, 11.3, 2.8], [14.0, 7.2, 2.8], [19.2, 4.9, 3.0],
      [4.8, 18.8, 2.8], [22.1, 10.6, 2.8], [8.0, 23.0, 2.5], [18.0, 22.4, 2.7],
      [22.0, 18.9, 2.8], [17.1, 14.3, 2.0]
    ].forEach(([u, v, scale]) => {
      const p = this.project(u, v);
      this.add.image(p.x, p.y, 'iso_grass_patch')
        .setDisplaySize(192 * scale, 96 * scale)
        .setDepth(4 + p.y / 100000);
    });
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

    // Footprints urbanos. Somente o piso sob cada fachada bloqueia.
    const buildingRects = [
      ['Loja de Aldren', 3.40, 13.65, 3.25, 2.80],
      ['Ferraria de Borin', 7.65, 9.70, 3.30, 2.85],
      ['Botica de Elara', 12.20, 5.75, 3.55, 2.90],
      ['Taverna de Garrick', 17.55, 3.35, 3.70, 2.90],
      ['Casa de Lysandra', 3.15, 16.95, 3.35, 2.95],
      ['Oficina de Maelis', 20.35, 9.20, 3.55, 3.00],
      ['Casa vermelha', 6.55, 21.55, 2.85, 2.85],
      ['Casa verde', 9.75, 21.55, 2.85, 2.85],
      ['Casa azul', 16.45, 20.75, 3.05, 2.95],
      ['Casa laranja', 20.25, 17.25, 3.55, 3.05]
    ];
    for (const [label, u, v, w, h] of buildingRects) this.addBlockedRect(u, v, w, h, label);

    this.addBlockedCircle(14, 14, .88, 'Marco de Senda');
    this.addBlockedCircle(17.15, 14.35, .90, 'fonte');
    [[3.7, 9.5], [8.0, 18.7], [19.7, 15.6], [23.8, 7.2], [23.1, 22.9]].forEach(([u, v]) => this.addBlockedCircle(u, v, .34, 'árvore'));

    this.cityBuildingRects = buildingRects.map(([label, u, v, w, h]) => ({label, u1: u, v1: v, u2: u + w, v2: v + h}));
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

    const south = this.project(14.0, 26.03);
    this.southGateSprite = this.add.image(south.x, south.y + 70, 'iso_city_gate')
      .setOrigin(.5, 1).setDisplaySize(366, 255).setFlipX(true)
      .setDepth(this.depthAt(14, 26, .15));
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
    }
  }

  createBuildings() {
    this.cityBuildings = [];
    const specs = [
      ['merchant_shop', 5.0, 15.4, 238, 'Loja de Aldren'],
      ['blacksmith_shop', 9.3, 11.5, 225, 'Ferraria de Borin'],
      ['healer_house', 14.0, 7.4, 232, 'Botica de Elara'],
      ['tavern_house', 19.4, 4.9, 238, 'Taverna de Garrick'],
      ['scholar_house', 4.8, 18.8, 232, 'Casa de Lysandra'],
      ['artisan_house', 22.1, 10.7, 230, 'Oficina de Maelis'],
      ['residential_house_red', 8.0, 23.2, 218, 'Casa vermelha'],
      ['residential_house_green', 11.2, 23.2, 218, 'Casa verde'],
      ['residential_house_blue', 18.0, 22.5, 218, 'Casa azul'],
      ['residential_house_orange', 22.0, 19.0, 218, 'Casa laranja']
    ];
    for (const [key, u, v, height, label] of specs) {
      const image = this.addIsoImage(key, u, v, height);
      this.cityBuildings.push({key, u, v, height, label, image});
    }
  }

  createPlazaAndStreets() {
    this.fountain = this.addIsoImage('city_fountain', 17.15, 14.35, 176, .03);

    [[9.3, 12.4], [11.4, 17.7], [15.0, 10.0], [18.7, 12.0], [15.6, 18.6], [20.0, 16.0], [7.1, 19.6], [22.6, 14.1]].forEach(([u, v]) => this.addLamp(u, v));
    [[11.1, 12.0], [12.0, 18.1], [17.8, 11.8], [18.6, 17.2]].forEach(([u, v]) => this.addIsoImage('street_flower_fence', u, v, 68, .01));

    this.addIsoImage('street_crates', 6.8, 16.5, 66, .02);
    this.addIsoImage('street_logs', 11.2, 12.8, 65, .02);
    this.addIsoImage('street_flower_fence', 15.6, 8.8, 62, .02);
    this.addIsoImage('street_barrels', 21.3, 6.7, 62, .02);
    this.addIsoImage('street_crates', 7.0, 20.1, 60, .02);
    this.addIsoImage('street_logs', 22.1, 13.0, 62, .02);

    [[3.7, 9.5, false], [8.0, 18.7, true], [19.7, 15.6, false], [23.8, 7.2, true], [23.1, 22.9, false]].forEach(([u, v, flip]) => {
      this.addIsoImage('city_tree', u, v, 184, .02).setFlipX(flip);
    });

    // Quinas mágicas discretas delimitam a praça sem escrever no chão.
    [[11.2, 11.2], [16.8, 11.2], [11.2, 16.8], [16.8, 16.8]].forEach(([u, v]) => {
      const p = this.project(u, v);
      this.add.circle(p.x, p.y, 5, 0x69d6ff, .58).setDepth(5);
      this.add.circle(p.x, p.y, 20, 0x4cc9ff, .07).setBlendMode(Phaser.BlendModes.ADD).setDepth(4.9);
    });
  }

  createChickenYard() {
    this.chickenYard = {u1: 3.0, v1: 22.1, u2: 6.25, v2: 25.2};
    const center = this.project(4.55, 23.65);
    this.add.image(center.x, center.y, 'iso_grass_patch').setDisplaySize(420, 210).setDepth(4.2);
    this.addIsoImage('chicken_coop', 4.35, 23.25, 132, .03);

    const lines = [
      [[3.0, 22.1], [6.25, 22.1]], [[3.0, 22.1], [3.0, 25.2]],
      [[6.25, 22.1], [6.25, 25.2]], [[3.0, 25.2], [4.15, 25.2]], [[5.05, 25.2], [6.25, 25.2]]
    ];
    for (const [[u1, v1], [u2, v2]] of lines) this.addIsoFence(u1, v1, u2, v2);

    // A arte da cerca e do galinheiro compartilha exatamente os mesmos
    // limites lógicos usados pela movimentação. O vão inferior permanece livre.
    this.addBlockedRect(3.0, 22.03, 3.25, .16, 'cerca norte do galinheiro');
    this.addBlockedRect(2.93, 22.1, .16, 3.10, 'cerca oeste do galinheiro');
    this.addBlockedRect(6.17, 22.1, .16, 3.10, 'cerca leste do galinheiro');
    this.addBlockedRect(3.0, 25.12, 1.15, .16, 'cerca sul esquerda do galinheiro');
    this.addBlockedRect(5.05, 25.12, 1.20, .16, 'cerca sul direita do galinheiro');
    this.addBlockedRect(3.70, 22.62, 1.30, .86, 'base do galinheiro');
  }

  addIsoFence(u1, v1, u2, v2) {
    const a = this.project(u1, v1), b = this.project(u2, v2);
    const x = (a.x + b.x) / 2, y = (a.y + b.y) / 2;
    const length = Phaser.Math.Distance.Between(a.x, a.y, b.x, b.y);
    return this.add.image(x, y + 4, 'city_chicken_fence')
      .setOrigin(.5, .72).setDisplaySize(length + 8, 36)
      .setRotation(Phaser.Math.Angle.Between(a.x, a.y, b.x, b.y))
      .setDepth(this.cityDepth(Math.max(a.y, b.y), .03));
  }

  addIsoImage(key, u, v, targetHeight, depthOffset = 0) {
    const p = this.project(u, v);
    const source = this.textures.get(key).getSourceImage();
    const scale = targetHeight / source.height;
    return this.add.image(p.x, p.y, key).setOrigin(.5, 1).setScale(scale).setDepth(this.depthAt(u, v, depthOffset));
  }

  addLamp(u, v) {
    const p = this.project(u, v);
    this.add.circle(p.x, p.y - 53, 48, 0xffbd63, .09)
      .setBlendMode(Phaser.BlendModes.ADD).setDepth(this.depthAt(u, v, -.03));
    return this.addIsoImage('street_lamppost', u, v, 98, .02);
  }

  createNpcs() {
    const specs = [
      ['merchant', 'Aldren Voss', 'Mercador', 7.35, 16.95, ['Tenho suprimentos para quem pretende atravessar os arredores.'], {shop: true, portrait: 'portrait_aldren', idleProfile: 'merchant'}],
      ['blacksmith', 'Borin Ferramão', 'Ferreiro', 11.55, 13.15, ['Minha ferraria ainda está sendo reconstruída. Minhas ferramentas desapareceram durante a invasão.', 'Quando eu recuperar minhas ferramentas, poderei trabalhar novamente.'], {portrait: 'portrait_borin', idleProfile: 'blacksmith'}],
      ['healer', 'Elara Veyn', 'Curandeira', 16.45, 9.25, ['Perdi minha fé depois dos acontecimentos sombrios. Não consigo invocar minha bênção agora.', 'Talvez, quando minha fé retornar, eu possa ajudar os feridos novamente.'], {portrait: 'portrait_elara', idleProfile: 'healer'}],
      ['tavernkeeper', 'Garrick Brenn', 'Taverneiro', 21.75, 7.0, ['A taverna ainda não abriu. Faltam alimentos e insumos para as bebidas.', 'Quando conseguirmos os suprimentos, espero abrir as portas novamente.'], {portrait: 'portrait_garrick', idleProfile: 'tavernkeeper'}],
      ['scholar', 'Lysandra Vael', 'Erudita', 7.15, 20.65, ['O mundo perdeu o sentido depois dos acontecimentos sombrios...', 'Talvez um dia eu volte a estudar os antigos encantamentos.'], {portrait: 'portrait_lysandra', idleProfile: 'scholar'}],
      ['artisan', 'Maelis Tessara', 'Artesã', 22.15, 13.0, ['Minha oficina ainda é simples, mas já consigo consertar panos e costuras.', 'Quando os caminhos estiverem seguros, vou transformá-la em uma verdadeira oficina encantada.'], {portrait: 'portrait_maelis', idleProfile: 'artisan'}],
      ['elder_mira', 'Mira Edevane', 'Anciã de Aether', 12.0, 17.05, ['A floresta ficou perigosa. Se trouxer provas dos monstros, conversaremos sobre o assunto.'], {portrait: 'portrait_mira', idleProfile: 'elder'}],
      ['guard', 'Kael Dorn', 'Guarda do Portão Leste', 24.45, 11.20, ['Estamos protegendo a saída leste. Tenha cuidado ao deixar os muros.'], {portrait: 'portrait_kael', idleProfile: 'east_guard', scale: .65}],
      ['south_guard', 'Bren Harrow', 'Guarda do Sul', 11.10, 24.90, ['Mantemos esta passagem protegida. Lá fora, os monstros não respeitam ninguém.'], {portrait: 'portrait_bren', idleProfile: 'south_guard', scale: .66}]
    ];

    for (const [texture, name, role, u, v, pages, options] of specs) {
      const p = this.project(u, v);
      const npc = new Npc(this, p.x, p.y, name, pages, {
        shop: !!options.shop, role, portrait: options.portrait, idleProfile: options.idleProfile,
        idleFacing: 'down', visualScale: options.scale ?? .60
      });
      npc.setRealSprite?.(texture);
      npc.isoLogical = {u, v};
      npc.setDepth(this.depthAt(u, v, .06));
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

    // Circuito amostrado ponto a ponto contra edifícios, árvores, fonte,
    // Marco de Senda e NPCs fixos. Morador e viajante percorrem sentidos
    // opostos, com velocidade e pausas próprias, sem cortar construções.
    const safeStreetLoop = [
      [10,15.5], [10,18.3], [13,18.5], [15.5,18.5], [18.5,17.5],
      [20,17], [21,16.5], [21.5,15], [21,13.5], [18.5,11.5],
      [16.5,10.5], [13.5,10.5], [12.5,12], [12.5,15.5]
    ];
    const residentRoute = safeStreetLoop;
    const travelerRoute = [...safeStreetLoop].reverse();
    this.walkers = [
      this.createWalker('resident', 'Tomas Belmon', 'Morador de Aether', ['A praça ainda é o lugar mais seguro de Aether.'], residentRoute, .60, 44, 700, 'portrait_tomas'),
      this.createWalker('traveler', 'Darian Kestrel', 'Viajante', ['Ouvi rumores sobre o castelo.'], travelerRoute, .61, 50, 1100, 'portrait_darian')
    ];
    this.cityActors.push(...this.walkers);
  }

  createWalker(texture, name, role, pages, logicalRoute, scale, speed, delay, portrait) {
    const route = logicalRoute.map(([u, v], index) => {
      const p = this.project(u, v);
      return {x: p.x, y: p.y, pause: 650 + (index % 3) * 130};
    });
    const first = route[0];
    const npc = new WanderingNpc(this, first.x, first.y, name, pages, route, {
      speed, startDelay: delay, role, portrait, idleProfile: texture, visualScale: scale
    });
    npc.setRealSprite?.(texture);
    return npc;
  }

  createAmbientLife() {
    this.installAmbientAnimations();

    this.routeAmbient('city_dog', 'city-dog-walk', [[10.0, 15.0], [11.5, 17.0], [14.0, 18.2], [16.5, 16.8], [18.0, 14.8], [15.0, 12.3], [12.0, 12.5]], .82, 34, 450);
    // Soma u+v constante: o gato se move horizontalmente na tela.
    this.routeAmbient('city_cat', 'city-cat-walk', [[8.0, 20.0], [10.0, 18.0], [12.0, 16.0], [14.0, 14.0], [12.0, 16.0], [10.0, 18.0]], .82, 31, 1200);

    this.routeAmbient('city_rat_gray', 'city-rat-gray-run', [[20.8, 7.9], [21.5, 8.4], [22.1, 8.8], [21.4, 8.5]], .58, 86, 900);
    this.routeAmbient('city_rat_brown', 'city-rat-brown-run', [[19.5, 8.0], [20.3, 8.6], [21.0, 8.9], [20.0, 8.3]], .56, 92, 1700);

    this.routeAmbient('city_chicken_white', 'city-chicken-white-walk', [[4.0, 23.6], [4.8, 23.5], [5.4, 24.0], [5.0, 24.7], [4.1, 24.6]], .37, 20, 600);
    this.routeAmbient('city_chicken_brown', 'city-chicken-brown-walk', [[5.3, 23.4], [5.7, 24.0], [5.2, 24.7], [4.5, 24.5], [4.6, 23.8]], .36, 19, 1100);
    this.routeAmbient('city_chicken_cream', 'city-chicken-cream-walk', [[3.6, 24.1], [4.1, 24.7], [4.8, 24.4], [4.5, 23.7]], .35, 18, 1650);

    this.createOldManAndBirdsIso();
  }

  installAmbientAnimations() {
    const a = this.anims;
    const ensure = (key, texture, frames, rate) => {
      if (!a.exists(key)) a.create({key, frames: a.generateFrameNumbers(texture, {frames}), frameRate: rate, repeat: -1});
    };
    ensure('city-dog-walk', 'city_dog', [0,1,2,3], 6);
    ensure('city-cat-walk', 'city_cat', [0,1,2,3], 7);
    ensure('elder-feed-birds', 'elder_feeder', [0,1,2,3], 2.4);
    ensure('city-bird-peck', 'city_bird', [0,1,0,3,0], 4);
    ensure('city-rat-gray-run', 'city_rat_gray', [0,1], 10);
    ensure('city-rat-brown-run', 'city_rat_brown', [0,1], 11);
    ensure('city-chicken-white-walk', 'city_chicken_white', [0,1,2,1], 6);
    ensure('city-chicken-brown-walk', 'city_chicken_brown', [0,1,2,1], 6);
    ensure('city-chicken-cream-walk', 'city_chicken_cream', [0,1,2,1], 6);
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
    const homeLogical = {u: 18.4, v: 16.7};
    const home = this.project(homeLogical.u, homeLogical.v);
    const elderScale = .70, frameBottom = [109,109,107,109], baseBottom = 109;
    this.oldMan = this.add.sprite(home.x, home.y, 'elder_feeder', 0).setOrigin(.5, 1).setScale(elderScale).setDepth(this.cityDepth(home.y, .05));
    this.oldMan.on('animationupdate', (_anim, frame) => {
      const i = Number(frame?.textureFrame ?? 0);
      this.oldMan?.setScale(elderScale).setY(home.y + (baseBottom - (frameBottom[i] ?? baseBottom)) * elderScale);
    });
    this.oldMan.play('elder-feed-birds');
    this.ambientActors.push(this.oldMan);

    [[18.8,16.9,.75], [19.2,17.2,.70], [18.6,17.5,.66], [19.5,16.8,.63]].forEach(([u,v,scale], i) => {
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

    const center = this.project(14, 14);
    this.waystone = new Waystone(this, center.x, center.y, 'CIDADE DE AETHER');
    this.waystone.setDepth(this.cityDepth(center.y, .07));
    this.waystone.sprite?.setDisplaySize(150, 150);
  }

  createCityBanner() {
    this.cityBanner = this.add.text(22, 18, 'CIDADE DE AETHER  •  CONVERSÃO ISOMÉTRICA', {
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
    for (const npc of this.fixedNpcLogical) if (Math.hypot(u - npc.u, v - npc.v) < radius + npc.radius) return true;
    return false;
  }

  updatePlayerProjection() {
    const p = this.project(this.logicalPlayer.u, this.logicalPlayer.v);
    this.player.setPosition(Math.round(p.x), Math.round(p.y));
    this.player.body?.setVelocity(0, 0);
    this.player.setDepth(this.cityDepth(p.y, .10));
    this.player.setVisible(true).setAlpha(1);
    this.playerShadow?.setPosition(Math.round(p.x), Math.round(p.y + 4)).setDepth(this.cityDepth(p.y, .07));
  }

  updateActorDepths() {
    for (const actor of this.cityActors) actor?.setDepth(this.cityDepth(actor.y, .06));
    for (const actor of this.ambientActors) actor?.setDepth(this.cityDepth(actor.y, .03));
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
      worldFlags: {...(old?.worldFlags || {}), cityRound60Migrated: true},
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
