import type {Scene, GameObjects, Cameras} from 'phaser';

export type ContextualInteractionTarget = {
  sprite?: GameObjects.Image | GameObjects.Container;
  name: string; key: 'F' | 'E'; action: string; iconTexture: string;
  activated?: boolean; nameColor?: string; actionColor?: string;
  iconMaxWidth?: number; iconMaxHeight?: number;
};
export type ContextualInteractionScene = Scene & {
  player?: any; hud?: any; prologue?: any; aetherTerritory?: any;
  dialogueOpen?: boolean; shop?: {visible: boolean}; switching?: boolean; cityBanner?: GameObjects.Text;
};
type Rect = {x: number; y: number; width: number; height: number};
const WIDTH = 320;
const HEIGHT = WIDTH * 285 / 960;
const overlap = (a: Rect, b: Rect) => Math.max(0, Math.min(a.x + a.width, b.x + b.width) - Math.max(a.x, b.x))
  * Math.max(0, Math.min(a.y + a.height, b.y + b.height) - Math.max(a.y, b.y));

/** Shared read-only presentation. Target owners retain proximity, input and rewards. */
export class ContextualInteractionPanel {
  readonly root: GameObjects.Container;
  private readonly frame: GameObjects.Image;
  private readonly name: GameObjects.Text;
  private readonly icon: GameObjects.Image;
  private readonly key: GameObjects.Text;
  private readonly action: GameObjects.Text;
  private destroyed = false;

  constructor(protected readonly scene: ContextualInteractionScene,
    private readonly readTarget: () => ContextualInteractionTarget | null,
    private readonly options: {prefix: string; initialIcon: string; iconName?: string; compactWhenCrowded?: boolean}) {
    const prefix = options.prefix;
    this.root = scene.add.container(0, 0).setName(prefix + 'InteractionPanel')
      .setDepth(1800).setSize(WIDTH, HEIGHT).setVisible(false);
    this.frame = scene.add.image(0, 0, 'interacao_moldura_dourada').setOrigin(0)
      .setName(prefix + 'Frame').setScale(WIDTH / 960);
    this.icon = scene.add.image(60, 47, options.initialIcon)
      .setName(options.iconName || prefix + 'Icon');
    const keycap = scene.add.image(120, 36, 'interacao_tecla_vazia')
      .setName(prefix + 'Keycap').setScale(27 / 148);
    const shadow = {offsetX: 1, offsetY: 1, color: '#000000', blur: 2, fill: true};
    this.key = scene.add.text(120, 36, '', {
      fontFamily: 'Georgia, serif', fontSize: 18, fontStyle: 'bold', color: '#fff0c9', shadow
    }).setOrigin(.5).setName(prefix + 'Key');
    this.action = scene.add.text(141, 36, '', {
      fontFamily: 'Georgia, serif', fontSize: 21, fontStyle: 'bold', color: '#f7e6b6', shadow
    }).setOrigin(0, .5).setName(prefix + 'Action');
    this.name = scene.add.text(106, 63, '', {
      fontFamily: 'Georgia, serif', fontSize: 13, color: '#f0e6d1', shadow
    }).setOrigin(0, .5).setName(prefix + 'ObjectName');
    this.root.add([this.frame, this.icon, keycap, this.key, this.action, this.name]);
    // PRE_RENDER also runs when scene.update returns early for a modal.
    scene.events.on(Phaser.Scenes.Events.PRE_RENDER, this.render, this);
    // Follow is resolved during camera.preRender, after the scene event.
    scene.cameras.main.on(Phaser.Cameras.Scene2D.Events.FOLLOW_UPDATE, this.render, this);
  }

  private screenBounds(bounds: Rect, scrollFactorX = 1, scrollFactorY = scrollFactorX): Rect {
    const camera = this.scene.cameras.main as Cameras.Scene2D.Camera & {matrix: GameObjects.Components.TransformMatrix};
    const a = camera.matrix.transformPoint(bounds.x - camera.scrollX * scrollFactorX, bounds.y - camera.scrollY * scrollFactorY);
    const b = camera.matrix.transformPoint(bounds.x + bounds.width - camera.scrollX * scrollFactorX,
      bounds.y + bounds.height - camera.scrollY * scrollFactorY);
    return {x: Math.min(a.x, b.x), y: Math.min(a.y, b.y), width: Math.abs(b.x - a.x), height: Math.abs(b.y - a.y)};
  }

  private hudBounds(): Rect[] {
    const scene = this.scene;
    const result: Rect[] = [];
    const add = (view: any, bounds?: Rect) => {
      if (view?.visible && view.alpha > .01) result.push(this.screenBounds(bounds || view.getBounds(), 0));
    };
    const mini = scene.hud?.minimap;
    if (mini?.root) add(mini.root, {x: mini.root.x, y: mini.root.y,
      width: mini.baseWidth * mini.root.scaleX, height: mini.baseHeight * mini.root.scaleY});
    const tracker = scene.prologue?.hud?.tracker?.root;
    if (tracker) add(tracker, {x: tracker.x, y: tracker.y, width: tracker.width, height: tracker.height});
    const bottom = scene.hud?.bottom;
    if (bottom?.root) add(bottom.root, {x: bottom.root.x - bottom.frameWidth * bottom.root.scaleX / 2,
      y: bottom.root.y - bottom.frameHeight * bottom.root.scaleY,
      width: bottom.frameWidth * bottom.root.scaleX, height: bottom.frameHeight * bottom.root.scaleY});
    add(scene.children.getByName('worldClockHud'));
    add(scene.prologue?.hud?.hintText);
    add(scene.cityBanner);
    return result;
  }

  private render() {
    const scene = this.scene;
    if (scene.dialogueOpen || scene.hud?.isModal?.() || scene.shop?.visible || scene.switching || scene.player?.isDead?.()) {
      this.hide(); return;
    }
    const target = this.readTarget();
    if (!target?.name || !target.sprite?.active || !target.sprite.visible) { this.hide(); return; }
    const texture = target.activated ? 'interacao_moldura_azul_ativada' : 'interacao_moldura_dourada';
    if (this.frame.texture.key !== texture) this.frame.setTexture(texture);
    if (this.icon.texture.key !== target.iconTexture) this.icon.setTexture(target.iconTexture);
    this.icon.setScale(Math.min((target.iconMaxWidth ?? 43) / this.icon.width,
      (target.iconMaxHeight ?? Infinity) / this.icon.height));
    if (this.key.text !== target.key) this.key.setText(target.key);
    if (this.action.text !== target.action) this.action.setText(target.action);
    if (this.name.text !== target.name) this.name.setText(target.name);
    const nameColor = target.nameColor || '#f0e6d1';
    const actionColor = target.actionColor || '#f7e6b6';
    if (this.name.style.color !== nameColor) this.name.setColor(nameColor);
    if (this.action.style.color !== actionColor) this.action.setColor(actionColor);

    const camera = scene.cameras.main;
    const margin = 8, gap = 12;
    let scale = Math.min(1, (camera.width - margin * 2) / WIDTH, (camera.height - margin * 2) / HEIGHT);
    const viewport = {x: camera.x, y: camera.y, width: camera.width, height: camera.height};
    const object = this.screenBounds(target.sprite.getBounds());
    const player = this.screenBounds(scene.player.getVisualSprite().getBounds());
    const hud = this.hudBounds();
    const props: Rect[] = (scene.aetherTerritory?.oldRoadProps?.props || [])
      .filter(prop => prop.sprite?.active && prop.sprite.visible && prop.sprite !== target.sprite)
      .map(prop => this.screenBounds(prop.sprite.getBounds()))
      .filter(rect => overlap(rect, viewport) > 0);
    const findPlacement = (candidateScale: number) => {
      const width = WIDTH * candidateScale, height = HEIGHT * candidateScale;
      const center = object.x + object.width / 2;
      const top = Math.min(object.y, player.y) - height - gap;
      const xs = [center - width / 2, camera.x + margin, camera.x + camera.width - width - margin];
      const ys = [top, object.y + (object.height - height) / 2, camera.y + margin, camera.y + camera.height - height - margin];
      // Consider free edges around every visible obstacle. Only this view moves.
      for (const rect of [object, player, ...hud, ...props]) {
        xs.push(rect.x - width - gap, rect.x + rect.width + gap);
        ys.push(rect.y - height - gap, rect.y + rect.height + gap);
      }
      let best: Rect | undefined, bestScore = Infinity;
      for (const x of xs) for (const y of ys) {
        const candidate = {x: Phaser.Math.Clamp(x, camera.x + margin, camera.x + camera.width - width - margin),
          y: Phaser.Math.Clamp(y, camera.y + margin, camera.y + camera.height - height - margin), width, height};
        const obstruction = (overlap(candidate, object) + overlap(candidate, player)) * 10
          + hud.reduce((sum, rect) => sum + overlap(candidate, rect) * 10, 0)
          + props.reduce((sum, rect) => sum + overlap(candidate, rect), 0);
        const distance = Math.hypot(candidate.x + width / 2 - center, candidate.y - top);
        const score = (obstruction > 0 ? 1e9 + obstruction * 1000 : 0) + distance;
        if (score < bestScore) { bestScore = score; best = candidate; }
      }
      return {rect: best, score: bestScore};
    };
    let placement = findPlacement(scale);
    // Collection may compact uniformly when the full-size card has no free slot.
    // F keeps exactly its approved size and placement policy.
    if (this.options.compactWhenCrowded && placement.score >= 1e9) {
      const preferredScale = scale;
      for (const factor of [.95, .9, .85, .8]) {
        const candidateScale = preferredScale * factor;
        const candidate = findPlacement(candidateScale);
        if (candidate.score < placement.score) { scale = candidateScale; placement = candidate; }
        if (placement.score < 1e9) break;
      }
    }
    const position = camera.getWorldPoint(placement.rect.x, placement.rect.y);
    this.root.setPosition(position.x, position.y).setScale(scale / camera.zoom).setVisible(true);
  }

  hide() { this.root.setVisible(false); }

  destroy() {
    if (this.destroyed) return;
    this.destroyed = true;
    this.scene.events.off(Phaser.Scenes.Events.PRE_RENDER, this.render, this);
    this.scene.cameras.main?.off(Phaser.Cameras.Scene2D.Events.FOLLOW_UPDATE, this.render, this);
    this.root.destroy(true);
  }
}
