// @ts-nocheck
export class ControlsPanel {
  private background: Phaser.GameObjects.Rectangle;
  private title: Phaser.GameObjects.Text;
  private subtitle: Phaser.GameObjects.Text;
  private rows: Phaser.GameObjects.Text[] = [];
  private visible = false;
  private scene: Phaser.Scene;

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
    const cx = scene.scale.width / 2;
    const cy = scene.scale.height / 2;

    this.background = scene.add.rectangle(cx, cy, 760, 430, 0x101827, 0.98)
      .setScrollFactor(0).setDepth(950).setStrokeStyle(2, 0x4b5f87, 1).setVisible(false);

    this.title = scene.add.text(cx, cy - 185, 'CONTROLES', {
      fontFamily: 'Arial', fontSize: 28, color: '#ecf0ff', fontStyle: 'bold'
    }).setOrigin(0.5).setScrollFactor(0).setDepth(951).setVisible(false);

    this.subtitle = scene.add.text(cx, cy - 150, 'Pressione C para fechar', {
      fontFamily: 'Arial', fontSize: 14, color: '#9aa8c7'
    }).setOrigin(0.5).setScrollFactor(0).setDepth(951).setVisible(false);

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
      ['C', 'Abrir/fechar controles'],['P','Pausar o jogo / menu de pausa'],['Esc','Fechar janela atual']
    ];

    controls.forEach(([key, description], index) => {
      const column = index < 7 ? 0 : 1;
      const row = index % 7;
      const x = cx - 325 + column * 330;
      const y = cy - 112 + row * 40;

      const text = scene.add.text(x, y, `${key}\n${description}`, {
        fontFamily: 'Arial', fontSize: 13, color: '#c8d1ea',
        backgroundColor: '#1b263b',
        padding: { left: 8, right: 8, top: 5, bottom: 5 },
        wordWrap: { width: 300 }
      }).setOrigin(0).setScrollFactor(0).setDepth(951).setVisible(false);

      this.rows.push(text);
    });
  }

  toggle(): void {
    this.setVisible(!this.visible);
  }

  setVisible(value: boolean): void {
    this.visible = value;
    this.background.setVisible(value);
    this.title.setVisible(value);
    this.subtitle.setVisible(value);
    this.rows.forEach((row) => row.setVisible(value));
  }

  isVisible(): boolean {
    return this.visible;
  }
}
