// @ts-nocheck
export class ControlsPanel {
  private background: Phaser.GameObjects.Rectangle;
  private title: Phaser.GameObjects.Text;
  private subtitle: Phaser.GameObjects.Text;
  private rows: Phaser.GameObjects.Text[] = [];
  private visible = false;

  constructor(private scene: Phaser.Scene) {
    const cx = scene.scale.width / 2;
    const cy = scene.scale.height / 2;

    this.background = scene.add.rectangle(cx, cy, 720, 460, 0x101827, 0.97)
      .setScrollFactor(0)
      .setDepth(500)
      .setStrokeStyle(2, 0x4b5f87, 1)
      .setVisible(false);

    this.title = scene.add.text(cx, cy - 190, 'CONTROLES', {
      fontFamily: 'Arial', fontSize: 30, color: '#ecf0ff', fontStyle: 'bold'
    }).setOrigin(0.5).setScrollFactor(0).setDepth(501).setVisible(false);

    this.subtitle = scene.add.text(cx, cy - 152, 'Pressione C para fechar', {
      fontFamily: 'Arial', fontSize: 14, color: '#9aa8c7'
    }).setOrigin(0.5).setScrollFactor(0).setDepth(501).setVisible(false);

    const controls = [
      ['W A S D / Setas', 'Mover o personagem'],
      ['Espaço', 'Ataque básico'],
      ['Q', 'Habilidade principal da classe'],
      ['1', 'Habilidade secundária da classe'],
      ['2', 'Mobilidade da classe'],
      ['H', 'Usar poção de vida'],
      ['M', 'Usar poção de mana'],
      ['E', 'Interagir / coletar'],
      ['F', 'Conversar com NPC'],
      ['I', 'Inventário'],
      ['K', 'Árvore de habilidades'],
      ['R', 'Equipar melhor item'],
      ['T', 'Abrir loja'],
      ['C', 'Abrir/fechar controles']
    ];

    controls.forEach(([key, description], index) => {
      const column = index < 7 ? 0 : 1;
      const row = index % 7;
      const x = cx - 315 + column * 320;
      const y = cy - 112 + row * 42;

      const text = scene.add.text(x, y, `${key}\n${description}`, {
        fontFamily: 'Arial',
        fontSize: 14,
        color: '#c8d1ea',
        backgroundColor: '#1b263b',
        padding: { left: 9, right: 9, top: 5, bottom: 5 },
        wordWrap: { width: 290 }
      }).setOrigin(0, 0).setScrollFactor(0).setDepth(501).setVisible(false);

      this.rows.push(text);
    });
  }

  toggle(): void {
    this.setVisible(!this.visible);
  }

  isVisible(): boolean {
    return this.visible;
  }

  setVisible(value: boolean): void {
    this.visible = value;
    this.background.setVisible(value);
    this.title.setVisible(value);
    this.subtitle.setVisible(value);
    for (const row of this.rows) row.setVisible(value);
  }
}
