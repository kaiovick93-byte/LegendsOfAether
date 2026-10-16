import type {Scene, GameObjects, Textures} from 'phaser';
import type {TrackedObjective} from '../quests/PrologueTrackerState';

export const QUEST_TRACKER_ASSETS = [
  {key: 'quest_tracker_panel', path: 'assets/images/ui/hud/quest-tracker/moldura_ornamental_de_rpg_fantasia.png'},
  {key: 'quest_tracker_icon', path: 'assets/images/ui/hud/quest-tracker/ícone_dourado_de_missão_fantástica.png'},
  {key: 'quest_tracker_minimize', path: 'assets/images/ui/hud/quest-tracker/botão_ornado_de_minimizar.png'},
  {key: 'quest_tracker_expand', path: 'assets/images/ui/hud/quest-tracker/botão_dourado_ornamental_com_símbolo_de_expansão.png'}
] as const;

// Crop transparent export margins only; all original PNG bytes are retained.
const ART_FRAMES = [
  ['quest_tracker_icon', 263, 45, 729, 1083],
  ['quest_tracker_minimize', 320, 335, 614, 575],
  ['quest_tracker_expand', 406, 412, 441, 430]
] as const;
const ORNAMENT_SCALE = .15;
const HEADER_HEIGHT = (350 - 26) * ORNAMENT_SCALE;
let nextPanelId = 0;

/** A read-only view. Its only mutable interaction state is collapsed/expanded. */
export class QuestTracker {
  readonly root: GameObjects.Container;
  private readonly panel: GameObjects.Image;
  private readonly panelTexture: Textures.CanvasTexture;
  private readonly panelKey: string;
  private readonly title: GameObjects.Text;
  private readonly icon: GameObjects.Image;
  private readonly questName: GameObjects.Text;
  private readonly objective: GameObjects.Text;
  private readonly checkbox: GameObjects.Graphics;
  private readonly button: GameObjects.Image;
  private readonly buttonHit: GameObjects.Zone;
  private entry: TrackedObjective | null = null;
  collapsed = false;

  constructor(private readonly scene: Scene) {
    for (const [key, x, y, width, height] of ART_FRAMES) {
      const texture = scene.textures.get(key);
      if (!texture.has('art')) texture.add('art', 0, x, y, width, height);
    }
    this.panelKey = `quest-tracker-surface-${nextPanelId++}`;
    this.panelTexture = scene.textures.createCanvas(this.panelKey, 2, 2);
    this.root = scene.add.container(0, 0).setName('questTracker')
      .setScrollFactor(0).setDepth(1750).setVisible(false);
    this.panel = scene.add.image(0, 0, this.panelKey).setOrigin(0).setScrollFactor(0);
    const shadow = {offsetX: 1, offsetY: 1, color: '#000000', blur: 2, fill: true};
    this.title = scene.add.text(43, 24, 'Missões', {
      fontFamily: 'Georgia, serif', fontSize: '18px', fontStyle: 'bold', color: '#f4dfac', shadow
    }).setName('questTrackerHeading').setOrigin(0, .5).setScrollFactor(0);
    this.icon = scene.add.image(36, 69, 'quest_tracker_icon', 'art')
      .setName('questTrackerIcon').setScrollFactor(0);
    this.icon.setScale(28 / this.icon.height);
    this.questName = scene.add.text(56, 57, '', {
      fontFamily: 'Georgia, serif', fontSize: '16px', fontStyle: 'bold', color: '#e8c46e',
      shadow, lineSpacing: 3, wordWrap: {width: 240, useAdvancedWrap: true}
    }).setName('questTrackerName').setScrollFactor(0);
    this.objective = scene.add.text(56, 88, '', {
      fontFamily: 'Georgia, serif', fontSize: '15px', color: '#f5eedc',
      shadow, lineSpacing: 4, wordWrap: {width: 240, useAdvancedWrap: true}
    }).setName('questTrackerObjective').setScrollFactor(0);
    this.checkbox = scene.add.graphics().setName('questTrackerCheckbox').setScrollFactor(0);
    this.button = scene.add.image(0, 24, 'quest_tracker_minimize', 'art')
      .setName('questTrackerToggleIcon').setScrollFactor(0);
    this.buttonHit = scene.add.zone(0, 24, 34, 34).setName('questTrackerToggle')
      .setScrollFactor(0).setInteractive({useHandCursor: true});
    this.buttonHit.on('pointerdown', (_pointer, _x, _y, event) => {
      event.stopPropagation();
      this.setCollapsed(!this.collapsed);
    });
    this.root.add([this.panel, this.title, this.icon, this.questName, this.checkbox,
      this.objective, this.button, this.buttonHit]);
    this.layout();
  }

  setTrackedObjective(entry: TrackedObjective | null) {
    this.entry = entry;
    this.questName.setText(entry?.questName || '');
    this.objective.setText(entry?.objectiveText || '');
    this.root.setVisible(!!entry?.objectiveText);
    this.layout();
  }

  setCollapsed(collapsed: boolean) {
    this.collapsed = collapsed;
    this.layout();
  }

  layout() {
    const width = Math.min(326, Math.max(226, this.scene.scale.width - 44));
    const pad = Math.max(10, Math.min(16, Math.round(this.scene.scale.width * .012)));
    // Same right edge and region as the original OBJETIVO panel.
    this.root.setPosition(this.scene.scale.width - pad - width, pad + 216);
    this.questName.setWordWrapWidth(width - 86, true);
    this.objective.setWordWrapWidth(width - 86, true);
    this.objective.setY(57 + Math.max(28, this.questName.height) + 9);
    const height = this.collapsed ? HEADER_HEIGHT
      : Math.max(126, this.objective.y + Math.max(16, this.objective.height) + 25);
    for (const view of [this.icon, this.questName, this.objective, this.checkbox]) view.setVisible(!this.collapsed);
    this.checkbox.clear().lineStyle(1.2, 0xd6c89f, 1)
      .strokeRect(29, this.objective.y + 3, 13, 13);
    if (this.entry?.completed === true) {
      this.checkbox.lineStyle(2, 0xe8c46e, 1).beginPath()
        .moveTo(31, this.objective.y + 9).lineTo(35, this.objective.y + 13)
        .lineTo(41, this.objective.y + 5).strokePath();
    }
    this.button.setTexture(this.collapsed ? 'quest_tracker_expand' : 'quest_tracker_minimize', 'art');
    this.button.setScale(27 / Math.max(this.button.width, this.button.height));
    this.button.setX(width - 52);
    this.buttonHit.setX(width - 52);
    this.paintPanel(width, height);
    this.root.setSize(width, height);
  }

  private paintPanel(width: number, height: number) {
    // Nine regions: corners retain one uniform scale; only plain edges/body
    // stretch. The top row includes the original header and gold divider.
    const source = this.scene.textures.get('quest_tracker_panel').getSourceImage() as HTMLImageElement;
    this.panelTexture.setSize(Math.ceil(width * 2), Math.ceil(height * 2));
    const context = this.panelTexture.getContext();
    context.clearRect(0, 0, this.panelTexture.width, this.panelTexture.height);
    const sx = [0, 240, 1534, 1774];
    const dx = [0, 240 * ORNAMENT_SCALE, width - 240 * ORNAMENT_SCALE, width];
    const sy = [26, 350, 720, 865];
    const dy = [0, HEADER_HEIGHT, height - 145 * ORNAMENT_SCALE, height];
    for (let row = 0; row < (this.collapsed ? 1 : 3); row++) {
      for (let column = 0; column < 3; column++) {
        context.drawImage(source, sx[column], sy[row], sx[column + 1] - sx[column], sy[row + 1] - sy[row],
          dx[column] * 2, dy[row] * 2, (dx[column + 1] - dx[column]) * 2, (dy[row + 1] - dy[row]) * 2);
      }
    }
    this.panelTexture.refresh();
    this.panel.setTexture(this.panelKey).setScale(.5);
  }

  destroy() {
    this.root.destroy(true);
    this.scene.textures.remove(this.panelKey);
  }
}
