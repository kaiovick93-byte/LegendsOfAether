import type {Scene, GameObjects} from 'phaser';
import {worldClock} from '../world/WorldClock';
import {duskToDawnLightIntensity} from '../render/WorldLightingSystem';

export const WORLD_CLOCK_HUD_ASSETS = [
  {key: 'relogio_moldura', path: 'assets/images/ui/hud/clock/relogio_moldura.png'},
  {key: 'relogio_sol', path: 'assets/images/ui/hud/clock/relogio_sol.png'},
  {key: 'relogio_lua', path: 'assets/images/ui/hud/clock/relogio_lua.png'}
] as const;

/** Hide disconnected export fragments only; retain the original PNGs and scale. */
function displayTexture(scene: Scene, key: string, cutouts: number[][]) {
  const displayKey = `${key}_hud`;
  if (!scene.textures.exists(displayKey)) {
    const source = scene.textures.get(key).getSourceImage() as HTMLImageElement;
    const texture = scene.textures.createCanvas(displayKey, source.width, source.height);
    const context = texture.getContext();
    context.drawImage(source, 0, 0);
    for (const [x, y, width, height] of cutouts) context.clearRect(x, y, width, height);
    texture.refresh();
  }
  return displayKey;
}

/** Presentation only: no timers, clock mutations or lighting changes. */
export class WorldClockHud {
  readonly root: GameObjects.Container;
  private readonly icon: GameObjects.Image;
  private readonly text: GameObjects.Text;
  private readonly sunTexture: string;

  constructor(scene: Scene) {
    const frameTexture = displayTexture(scene, 'relogio_moldura', [
      [0, 327, 214, 68], [0, 384, 2026, 11]
    ]);
    this.sunTexture = displayTexture(scene, 'relogio_sol', [[260, 0, 137, 64]]);
    this.root = scene.add.container(22, 52)
      .setName('worldClockHud').setScrollFactor(0).setDepth(681);
    const frame = scene.add.image(0, 0, frameTexture)
      .setName('worldClockFrame').setOrigin(0).setScrollFactor(0);
    frame.setScale(380 / frame.width);
    const centerY = frame.displayHeight / 2;
    this.icon = scene.add.image(88, centerY, this.sunTexture)
      .setName('worldClockIcon').setScrollFactor(0);
    this.text = scene.add.text(128, centerY, '', {
      fontFamily: 'Georgia, serif', fontSize: '22px', color: '#fff6e4',
      shadow: {offsetX: 1, offsetY: 2, color: '#000000', blur: 3, fill: true}
    }).setName('worldClockText').setOrigin(0, .5).setScrollFactor(0);
    this.root.add([frame, this.icon, this.text]);
    this.update();
  }

  update() {
    // Reuse the existing formatter, including its padded hour/minute fields.
    const label = worldClock.format().replace(' • ', ' ◆ ');
    if (this.text.text !== label) {
      this.text.setText(label);
      this.text.setScale(Math.min(1, 200 / this.text.width));
    }

    // Same shared dusk/dawn curve AND visual threshold as OldRoadProps'
    // existing day/night lantern sprite. No parallel schedule or hour checks.
    const night = duskToDawnLightIntensity() > .18;
    const key = night ? 'relogio_lua' : this.sunTexture;
    if (this.icon.texture.key !== key) this.icon.setTexture(key);
    this.icon.setScale(52 / Math.max(this.icon.width, this.icon.height));
  }

  destroy() {
    this.root.destroy(true);
  }
}
