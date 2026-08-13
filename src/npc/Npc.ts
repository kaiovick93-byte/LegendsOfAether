// @ts-nocheck
export class Npc extends Phaser.GameObjects.Container {
  constructor(scene, x, y, name, text, interaction = {}) {
    super(scene, x, y);
    this.npcName = name;
    this.text = text || ['Olá, viajante.'];
    this.interaction = interaction;

    this.add(scene.add.circle(0, -14, 10, interaction.color ?? 0xffe6c7));
    this.add(scene.add.rectangle(0, 8, 20, 28, interaction.bodyColor ?? 0xffd166));
    this.add(scene.add.text(0, -38, name, {
      fontFamily: 'Arial', fontSize: '11px', color: '#ecf0ff',
      backgroundColor: '#182033', padding: 3
    }).setOrigin(.5));

    this.promptBg = scene.add.rectangle(0, -66, 116, 24, 0x182033, 0.96)
      .setStrokeStyle(1, 0x4b5f87, 1)
      .setVisible(false);

    this.promptText = scene.add.text(0, -67, '', {
      fontFamily: 'Arial', fontSize: '11px', color: '#ffd166', fontStyle: 'bold'
    }).setOrigin(.5).setVisible(false);

    this.add([this.promptBg, this.promptText]);
    scene.add.existing(this);
    this.setDepth(25);
  }

  showPrompt(keys) {
    if (!keys?.length) {
      this.hidePrompt();
      return;
    }
    this.promptText.setText(keys.join('   '));
    this.promptBg.setVisible(true);
    this.promptText.setVisible(true);
  }

  hidePrompt() {
    this.promptBg?.setVisible(false);
    this.promptText?.setVisible(false);
  }
}
