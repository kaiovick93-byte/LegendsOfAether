// @ts-nocheck

/**
 * Camada visual discreta que devolve movimento à água sem transformar a
 * fonte em um objeto de gameplay. A arte da fonte continua sendo a silhueta
 * física, de oclusão e de colisão; estes traços não possuem máscara, corpo
 * ou registro de oclusor.
 */
export class FountainWaterEffect {
  constructor(scene, fountain) {
    this.scene = scene;
    this.fountain = fountain;
    this.lastDraw = -Infinity;
    this.destroyed = false;
    this.regionActive = true;
    this.surface = scene.add.graphics().setData('decorativeOnly', true);
    this.flow = scene.add.graphics().setData('decorativeOnly', true);
    this.update = this.update.bind(this);
    this.syncDepth();
    scene.events.on(Phaser.Scenes.Events.UPDATE, this.update);
    this.update(0);
  }

  syncDepth() {
    if (!this.fountain?.active) return;
    // Os anéis ficam atrás da borda de pedra; só brilhos mínimos passam à
    // frente do jato já pintado, mantendo a leitura 2,5D do asset original.
    this.surface.setDepth(this.fountain.depth - .006);
    this.flow.setDepth(this.fountain.depth + .006);
  }

  update(time) {
    if (this.destroyed || !this.regionActive || !this.fountain?.active) return;
    if (time - this.lastDraw < 32) return;
    this.lastDraw = time;
    this.syncDepth();

    const t = time * .001;
    const x = this.fountain.x;
    const width = this.fountain.displayWidth;
    const height = this.fountain.displayHeight;
    const basinY = this.fountain.y - height * .345;
    const jetY = this.fountain.y - height * .705;

    this.surface.clear();
    this.surface.fillStyle(0x187bb0, .095)
      .fillEllipse(x, basinY, width * .46, height * .105);
    for (let ring = 0; ring < 3; ring++) {
      const phase = (t * (.31 + ring * .035) + ring * .29) % 1;
      const rippleWidth = width * (.17 + phase * .24);
      const rippleHeight = height * (.020 + phase * .026);
      const drift = Math.sin(t * .82 + ring * 2.1) * width * .012;
      this.surface.lineStyle(1.05, ring === 1 ? 0xd5f8ff : 0x73cef2, .30 * (1 - phase))
        .strokeEllipse(x + drift, basinY + ring * 1.8, rippleWidth, rippleHeight);
    }

    this.flow.clear();
    // Pequenas fitas verticais percorrem o jato. A oscilação sutil e as
    // fases desencontradas evitam um loop mecânico ou aparência cartunesca.
    [-.07, .018, .085].forEach((offset, index) => {
      const travel = (t * (.52 + index * .055) + index * .31) % 1;
      const startY = jetY + height * (.075 + travel * .17);
      const endY = startY + height * (.028 + index * .006);
      const sway = Math.sin(t * 1.7 + index * 1.9) * width * .008;
      this.flow.lineStyle(1.05, index === 1 ? 0xe6fbff : 0x9ce8ff, .20 + (1 - travel) * .18)
        .lineBetween(x + width * offset + sway, startY, x + width * (offset + .01) + sway, endY);
    });
    for (let sparkle = 0; sparkle < 3; sparkle++) {
      const phase = (t * (.44 + sparkle * .04) + sparkle * .37) % 1;
      const sx = x + Math.sin(t * 1.45 + sparkle * 2.4) * width * (.035 + sparkle * .012);
      const sy = jetY + height * (.08 + phase * .15);
      this.flow.fillStyle(0xe9fbff, .18 * (1 - phase))
        .fillCircle(sx, sy, .85 + (sparkle % 2) * .25);
    }
  }

  setActive(value) {
    this.regionActive=!!value;
    this.surface?.setVisible(this.regionActive);
    this.flow?.setVisible(this.regionActive);
  }

  destroy() {
    if (this.destroyed) return;
    this.destroyed = true;
    this.scene.events.off(Phaser.Scenes.Events.UPDATE, this.update);
    this.surface?.destroy();
    this.flow?.destroy();
    this.surface = null;
    this.flow = null;
  }
}
