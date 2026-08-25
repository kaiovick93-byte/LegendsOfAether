// @ts-nocheck

/**
 * Round 59 — laboratório isométrico separado da campanha.
 *
 * O mapa continua sendo 2D, porém toda posição jogável existe primeiro em uma
 * grade lógica (u/v) e só então é projetada na tela. Colisão, interação e
 * profundidade usam a mesma coordenada lógica; a arte nunca define o collider.
 */
export class IsometricPrototypeScene extends Phaser.Scene {
  static readonly TILE_WIDTH = 96;
  static readonly TILE_HEIGHT = 48;
  static readonly MAP_SIZE = 22;
  static readonly CITY_MIN = 2;
  static readonly CITY_MAX = 20;
  static readonly ORIGIN_X = 1300;
  static readonly ORIGIN_Y = 280;
  static readonly WORLD_WIDTH = 2600;
  static readonly WORLD_HEIGHT = 1700;

  constructor() {
    super('IsometricPrototypeScene');
  }

  create() {
    // O spawn mostra praça, portão e personagem no mesmo enquadramento, sem
    // colocar o herói atrás das torres no primeiro quadro.
    this.logicalPlayer = { u: 15.0, v: 12.0, radius: .28 };
    this.blockedRects = [];
    this.blockedCircles = [];
    this.dialogueOpen = false;

    this.cameras.main.setBackgroundColor('#0d1717');
    this.cameras.main.setBounds(0, 0, IsometricPrototypeScene.WORLD_WIDTH, IsometricPrototypeScene.WORLD_HEIGHT);
    this.cameras.main.setRoundPixels(true);

    this.createGround();
    this.createCollisionPlan();
    this.createWallsAndGate();
    this.createDistrictSample();
    this.createCharacters();
    this.createInterface();
    this.createInput();

    this.cameras.main.startFollow(this.playerSprite, true, .12, .12, 0, -32);
    this.cameras.main.setDeadzone(150, 80);
    this.cameras.main.fadeIn(280, 9, 15, 19);
  }

  project(u, v) {
    return {
      x: IsometricPrototypeScene.ORIGIN_X + (u - v) * IsometricPrototypeScene.TILE_WIDTH / 2,
      y: IsometricPrototypeScene.ORIGIN_Y + (u + v) * IsometricPrototypeScene.TILE_HEIGHT / 2
    };
  }

  depthAt(u, v, offset = 0) {
    return 1000 + this.project(u, v).y + offset;
  }

  createGround() {
    const C = IsometricPrototypeScene;
    const centerY = C.ORIGIN_Y + C.MAP_SIZE * C.TILE_HEIGHT / 2;

    this.add.image(C.ORIGIN_X, centerY + 30, 'iso_grass_ground')
      .setDisplaySize(2180, 1110)
      .setTint(0x000000)
      .setAlpha(.32)
      .setDepth(1);

    this.add.image(C.ORIGIN_X, centerY, 'iso_grass_ground')
      .setOrigin(.5)
      .setDepth(2);

    this.add.image(C.ORIGIN_X, centerY, 'iso_pavement_ground')
      .setOrigin(.5)
      .setDepth(3);

    // Jardins pontuais interrompem a pedra sem reiniciar a textura da rua.
    [[5.8, 5.7, 2.7], [6.8, 14.0, 3.2], [15.2, 6.5, 2.2]].forEach(([u, v, scale]) => {
      const p = this.project(u, v);
      this.add.image(p.x, p.y, 'iso_grass_patch')
        .setDisplaySize(192 * scale, 96 * scale)
        .setDepth(4 + p.y / 10000);
    });
  }

  createCollisionPlan() {
    const C = IsometricPrototypeScene;
    const wall = .46;

    // Bordas traseiras e lateral sudoeste são sólidas por inteiro.
    this.addBlockedRect(C.CITY_MIN - wall / 2, C.CITY_MIN - wall / 2, wall, C.CITY_MAX - C.CITY_MIN + wall, 'muralha noroeste');
    this.addBlockedRect(C.CITY_MIN - wall / 2, C.CITY_MIN - wall / 2, C.CITY_MAX - C.CITY_MIN + wall, wall, 'muralha nordeste');
    this.addBlockedRect(C.CITY_MIN - wall / 2, C.CITY_MAX - wall / 2, C.CITY_MAX - C.CITY_MIN + wall, wall, 'muralha sudoeste');

    // A lateral sudeste é dividida para que somente o vão do portão seja livre.
    this.addBlockedRect(C.CITY_MAX - wall / 2, C.CITY_MIN - wall / 2, wall, 7.9, 'muralha sudeste norte');
    this.addBlockedRect(C.CITY_MAX - wall / 2, 13.35, wall, C.CITY_MAX - 13.35 + wall / 2, 'muralha sudeste sul');
    this.addBlockedRect(19.45, 9.40, 1.15, 1.12, 'torre norte do portão');
    this.addBlockedRect(19.45, 12.28, 1.15, 1.12, 'torre sul do portão');

    // Footprints de construção: somente a base apoiada no chão bloqueia.
    this.addBlockedRect(4.45, 4.55, 3.25, 2.65, 'residência verde');
    this.addBlockedRect(5.25, 12.30, 3.35, 3.20, 'loja de Aldren');
    this.addBlockedCircle(11.0, 11.0, .78, 'Marco de Senda');
    this.addBlockedCircle(13.8, 9.2, .82, 'fonte');
    this.addBlockedCircle(4.0, 10.0, .36, 'árvore');
    this.addBlockedCircle(15.8, 14.8, .36, 'árvore');
  }

  addBlockedRect(u, v, width, height, label) {
    this.blockedRects.push({ u1: u, v1: v, u2: u + width, v2: v + height, label });
  }

  addBlockedCircle(u, v, radius, label) {
    this.blockedCircles.push({ u, v, radius, label });
  }

  createWallsAndGate() {
    const C = IsometricPrototypeScene;
    this.wallSprites = [];
    this.addWallRun('u', C.CITY_MIN, C.CITY_MIN, C.CITY_MAX, true);
    this.addWallRun('v', C.CITY_MIN, C.CITY_MIN, C.CITY_MAX, false);
    this.addWallRun('v', C.CITY_MAX, C.CITY_MIN, C.CITY_MAX, false);
    this.addWallRun('u', C.CITY_MAX, C.CITY_MIN, 9.55, true);
    this.addWallRun('u', C.CITY_MAX, 13.25, C.CITY_MAX, true);

    const gp = this.project(C.CITY_MAX + .02, 11.4);
    this.gateSprite = this.add.image(gp.x, gp.y + 68, 'iso_city_gate')
      .setOrigin(.5, 1)
      .setDisplaySize(360, 251)
      .setDepth(this.depthAt(C.CITY_MAX, 11.4, 54));

    // A sombra acompanha apenas as torres; o vão central permanece visualmente aberto.
    this.add.ellipse(gp.x - 113, gp.y + 41, 78, 30, 0x000000, .18).setDepth(this.gateSprite.depth - 1);
    this.add.ellipse(gp.x + 113, gp.y + 41, 78, 30, 0x000000, .18).setDepth(this.gateSprite.depth - 1);
  }

  addWallRun(fixedAxis, fixed, start, end, flip) {
    const span = 3.35;
    for (let cursor = start; cursor < end - .05; cursor += span) {
      const next = Math.min(cursor + span + .10, end);
      const middle = (cursor + next) / 2;
      const u = fixedAxis === 'u' ? fixed : middle;
      const v = fixedAxis === 'v' ? fixed : middle;
      const p = this.project(u, v);
      const logicalLength = next - cursor;
      const image = this.add.image(p.x, p.y + 52, 'iso_city_wall')
        .setOrigin(.5, .79)
        .setFlipX(flip)
        .setDisplaySize(logicalLength * 56 + 42, logicalLength * 30 + 126)
        .setDepth(this.depthAt(u, v, 34));
      this.wallSprites.push(image);
    }
  }

  createDistrictSample() {
    // Uma residência, um estabelecimento e seus jardins usam os assets já
    // aprovados, agora ancorados em células isométricas e ordenados pela base.
    this.residence = this.addIsoImage('residential_house_green', 6.15, 6.55, 230, 0);
    this.shop = this.addIsoImage('merchant_shop', 6.95, 15.15, 224, 0);

    this.waystone = this.addIsoImage('waystone_dormant', 11.0, 11.0, 154, 4);
    this.fountain = this.addIsoImage('city_fountain', 13.8, 9.2, 168, 4);

    this.addIsoImage('city_tree', 4.0, 10.0, 176, 1);
    this.addIsoImage('city_tree', 15.8, 14.8, 172, 1).setFlipX(true);
    this.addIsoImage('street_flower_fence', 5.1, 8.4, 70, 1);
    this.addIsoImage('street_crates', 8.15, 15.25, 66, 1);
    this.addIsoImage('street_barrels', 5.55, 15.55, 62, 1);

    [[8.2, 9.0], [12.2, 14.0], [15.0, 6.5], [16.7, 11.2]].forEach(([u, v]) => this.addLamp(u, v));

    // Marcação discreta da praça: quatro quinas iluminadas, sem texto no chão.
    [[9.2, 9.2], [12.8, 9.2], [9.2, 12.8], [12.8, 12.8]].forEach(([u, v]) => {
      const p = this.project(u, v);
      this.add.circle(p.x, p.y, 5, 0x69d6ff, .55).setDepth(7 + p.y / 10000);
      this.add.circle(p.x, p.y, 18, 0x4cc9ff, .07).setBlendMode(Phaser.BlendModes.ADD).setDepth(6 + p.y / 10000);
    });
  }

  addIsoImage(key, u, v, targetHeight, depthOffset = 0) {
    const p = this.project(u, v);
    const source = this.textures.get(key).getSourceImage();
    const scale = targetHeight / source.height;
    return this.add.image(p.x, p.y, key)
      .setOrigin(.5, 1)
      .setScale(scale)
      .setDepth(this.depthAt(u, v, depthOffset));
  }

  addLamp(u, v) {
    const p = this.project(u, v);
    this.add.circle(p.x, p.y - 54, 46, 0xffbd63, .08)
      .setBlendMode(Phaser.BlendModes.ADD)
      .setDepth(this.depthAt(u, v, -2));
    return this.addIsoImage('street_lamppost', u, v, 96, 1);
  }

  createCharacters() {
    const texture = this.registry.get('playerTextureKey') || 'player';
    const p = this.project(this.logicalPlayer.u, this.logicalPlayer.v);
    this.playerSprite = this.add.sprite(p.x, p.y, texture, 1)
      .setOrigin(.5, .86)
      .setScale(.74)
      .setDepth(this.depthAt(this.logicalPlayer.u, this.logicalPlayer.v, 8));
    this.playerFacing = 'down';

    this.merchantLogical = { u: 9.25, v: 14.25 };
    const mp = this.project(this.merchantLogical.u, this.merchantLogical.v);
    this.merchantSprite = this.add.sprite(mp.x, mp.y, 'merchant', 0)
      .setOrigin(.5, .90)
      .setScale(.46)
      .setDepth(this.depthAt(this.merchantLogical.u, this.merchantLogical.v, 7));

    // Respiração pela escala, mantendo o ponto dos pés rigorosamente fixo.
    this.tweens.add({
      targets: this.merchantSprite,
      scaleY: .452,
      duration: 1120,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut'
    });

    this.npcPrompt = this.add.text(mp.x, mp.y - 89, 'F  CONVERSAR', {
      fontFamily: 'Georgia, serif', fontSize: 12, color: '#f2d394', fontStyle: 'bold',
      backgroundColor: '#111923dd', padding: { left: 9, right: 9, top: 5, bottom: 5 },
      stroke: '#090d12', strokeThickness: 2
    }).setOrigin(.5).setDepth(5000).setVisible(false);
  }

  createInterface() {
    this.add.rectangle(18, 17, 414, 74, 0x101821, .91)
      .setOrigin(0)
      .setStrokeStyle(1, 0xa77d45, .85)
      .setScrollFactor(0)
      .setDepth(10000);
    this.add.text(34, 28, 'ROUND 59  •  CIDADE ISOMÉTRICA', {
      fontFamily: 'Georgia, serif', fontSize: 17, color: '#f2d394', fontStyle: 'bold',
      stroke: '#0a0f14', strokeThickness: 2
    }).setScrollFactor(0).setDepth(10001);
    this.add.text(34, 55, 'WASD / setas: mover   •   F: conversar   •   ESC: menu', {
      fontFamily: 'Arial', fontSize: 12, color: '#d9e4e8'
    }).setScrollFactor(0).setDepth(10001);
    this.add.text(34, 74, 'Colisão lógica + profundidade pela base dos sprites', {
      fontFamily: 'Arial', fontSize: 10, color: '#80c9db'
    }).setScrollFactor(0).setDepth(10001);

    this.dialogue = this.add.container(480, 462).setScrollFactor(0).setDepth(11000).setVisible(false);
    const panel = this.add.rectangle(0, 0, 760, 126, 0x101821, .97).setStrokeStyle(2, 0xb68a49, 1);
    const name = this.add.text(-350, -45, 'ALDREN  •  MERCADOR', {
      fontFamily: 'Georgia, serif', fontSize: 16, color: '#f0d392', fontStyle: 'bold'
    }).setOrigin(0, .5);
    const body = this.add.text(-350, -14,
      'A nova praça está sendo construída sobre uma grade isométrica.\nAs muralhas, as torres e a passagem do portão já usam a mesma planta de colisão.', {
        fontFamily: 'Georgia, serif', fontSize: 15, color: '#e4e9e7', lineSpacing: 7
      }).setOrigin(0, 0);
    const close = this.add.text(350, 45, 'F / ESC  Fechar', {
      fontFamily: 'Arial', fontSize: 11, color: '#8fd8e8'
    }).setOrigin(1, .5);
    this.dialogue.add([panel, name, body, close]);

    this.transitionLabel = this.add.text(480, 126, 'Portão aberto: atravesse somente pelo vão entre as torres.', {
      fontFamily: 'Georgia, serif', fontSize: 13, color: '#f0d392',
      backgroundColor: '#101821dd', padding: { left: 12, right: 12, top: 6, bottom: 6 }
    }).setOrigin(.5).setScrollFactor(0).setDepth(10001).setAlpha(0);
  }

  createInput() {
    this.cursors = this.input.keyboard.createCursorKeys();
    this.keys = this.input.keyboard.addKeys({
      up: Phaser.Input.Keyboard.KeyCodes.W,
      down: Phaser.Input.Keyboard.KeyCodes.S,
      left: Phaser.Input.Keyboard.KeyCodes.A,
      right: Phaser.Input.Keyboard.KeyCodes.D,
      interact: Phaser.Input.Keyboard.KeyCodes.F
    });

    this.input.keyboard.on('keydown-ESC', () => {
      if (this.dialogueOpen) this.setDialogue(false);
      else this.cameras.main.fadeOut(160, 9, 15, 19, (_camera, progress) => {
        if (progress === 1) this.scene.start('MenuScene');
      });
    });
  }

  update(_time, delta) {
    if (!this.playerSprite) return;
    const dt = Math.min(delta / 1000, .034);
    const ix = (this.cursors.right.isDown || this.keys.right.isDown ? 1 : 0) - (this.cursors.left.isDown || this.keys.left.isDown ? 1 : 0);
    const iy = (this.cursors.down.isDown || this.keys.down.isDown ? 1 : 0) - (this.cursors.up.isDown || this.keys.up.isDown ? 1 : 0);
    const length = Math.hypot(ix, iy) || 1;
    const nx = ix / length;
    const ny = iy / length;
    const moving = !!(ix || iy) && !this.dialogueOpen;

    if (moving) {
      const screenSpeed = 168;
      const sx = nx * screenSpeed;
      const sy = ny * screenSpeed;
      const du = (sx / IsometricPrototypeScene.TILE_WIDTH + sy / IsometricPrototypeScene.TILE_HEIGHT) * dt;
      const dv = (-sx / IsometricPrototypeScene.TILE_WIDTH + sy / IsometricPrototypeScene.TILE_HEIGHT) * dt;
      this.tryMove(du, 0);
      this.tryMove(0, dv);
      this.updateFacing(nx, ny);
      this.playerSprite.anims.play(`player-walk-${this.playerFacing}`, true);
    } else {
      this.playerSprite.anims.stop();
      this.playerSprite.setFrame({ down: 1, up: 5, left: 9, right: 13 }[this.playerFacing]);
    }

    const p = this.project(this.logicalPlayer.u, this.logicalPlayer.v);
    this.playerSprite.setPosition(Math.round(p.x), Math.round(p.y));
    this.playerSprite.setDepth(this.depthAt(this.logicalPlayer.u, this.logicalPlayer.v, 8));

    const near = Math.hypot(this.logicalPlayer.u - this.merchantLogical.u, this.logicalPlayer.v - this.merchantLogical.v) < 1.65;
    this.npcPrompt.setVisible(near && !this.dialogueOpen);
    if (near && Phaser.Input.Keyboard.JustDown(this.keys.interact)) this.setDialogue(!this.dialogueOpen);
    else if (this.dialogueOpen && Phaser.Input.Keyboard.JustDown(this.keys.interact)) this.setDialogue(false);

    const atGate = this.logicalPlayer.u > 19.15 && this.logicalPlayer.v > 10.45 && this.logicalPlayer.v < 12.25;
    this.transitionLabel.setAlpha(Phaser.Math.Linear(this.transitionLabel.alpha, atGate ? 1 : 0, .15));
  }

  updateFacing(nx, ny) {
    if (Math.abs(nx) > Math.abs(ny)) this.playerFacing = nx > 0 ? 'right' : 'left';
    else this.playerFacing = ny > 0 ? 'down' : 'up';
  }

  tryMove(du, dv) {
    const nextU = this.logicalPlayer.u + du;
    const nextV = this.logicalPlayer.v + dv;
    if (!this.isBlocked(nextU, nextV, this.logicalPlayer.radius)) {
      this.logicalPlayer.u = nextU;
      this.logicalPlayer.v = nextV;
    }
  }

  isBlocked(u, v, radius) {
    const C = IsometricPrototypeScene;
    if (u < .70 + radius || v < .70 + radius || u > C.MAP_SIZE - .70 - radius || v > C.MAP_SIZE - .70 - radius) return true;

    for (const rect of this.blockedRects) {
      const nearestU = Phaser.Math.Clamp(u, rect.u1, rect.u2);
      const nearestV = Phaser.Math.Clamp(v, rect.v1, rect.v2);
      if (Math.hypot(u - nearestU, v - nearestV) < radius) return true;
    }
    for (const circle of this.blockedCircles) {
      if (Math.hypot(u - circle.u, v - circle.v) < radius + circle.radius) return true;
    }
    return false;
  }

  setDialogue(open) {
    this.dialogueOpen = !!open;
    this.dialogue.setVisible(this.dialogueOpen).setAlpha(this.dialogueOpen ? 1 : 0);
    this.npcPrompt.setVisible(false);
  }
}
