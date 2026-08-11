import Phaser from 'phaser';
import type { Player } from '../entities/Player';
import type { AbilitySystem } from '../abilities/AbilitySystem';

export class BottomActionBar {
  private readonly root: Phaser.GameObjects.Container;
  private readonly hpOrb: Phaser.GameObjects.Arc;
  private readonly hpText: Phaser.GameObjects.Text;
  private readonly manaOrb: Phaser.GameObjects.Arc;
  private readonly manaText: Phaser.GameObjects.Text;
  private readonly classText: Phaser.GameObjects.Text;
  private readonly potionText: Phaser.GameObjects.Text;
  private readonly slots: Phaser.GameObjects.Text[] = [];
  private readonly backs: Phaser.GameObjects.Rectangle[] = [];

  constructor(
    private readonly scene: Phaser.Scene,
    private readonly player: Player,
    private readonly abilities: AbilitySystem,
    private readonly getItemCount: (id: string) => number
  ) {
    const width = scene.scale.width;
    const height = scene.scale.height;
    const scale = Math.min(1, width / 980);

    this.root = scene.add.container(width / 2, height - 10)
      .setScrollFactor(0)
      .setDepth(700);
    this.root.setScale(scale);

    const panel = scene.add.rectangle(0, -60, 940, 116, 0x0f1724, 0.97);
    panel.setStrokeStyle(2, 0x35445f, 1);
    this.root.add(panel);

    // HP orb
    const hpOuter = scene.add.circle(-405, -61, 44, 0x1b2330, 1);
    hpOuter.setStrokeStyle(3, 0x6f293b, 1);
    this.hpOrb = scene.add.circle(-405, -61, 35, 0xb83a4d, 1);
    this.hpText = scene.add.text(-405, -61, '', {
      fontFamily: 'Arial', fontSize: 13, color: '#ffffff', fontStyle: 'bold', align: 'center'
    }).setOrigin(0.5);
    this.root.add([hpOuter, this.hpOrb, this.hpText]);

    // Mana orb
    const manaOuter = scene.add.circle(405, -61, 44, 0x1b2330, 1);
    manaOuter.setStrokeStyle(3, 0x31547e, 1);
    this.manaOrb = scene.add.circle(405, -61, 35, 0x3f8dcc, 1);
    this.manaText = scene.add.text(405, -61, '', {
      fontFamily: 'Arial', fontSize: 13, color: '#ffffff', fontStyle: 'bold', align: 'center'
    }).setOrigin(0.5);
    this.root.add([manaOuter, this.manaOrb, this.manaText]);

    this.classText = scene.add.text(0, -105, '', {
      fontFamily: 'Arial', fontSize: 12, color: '#ffd166', fontStyle: 'bold'
    }).setOrigin(0.5);
    this.root.add(this.classText);

    const slotDefs = [
      { key: 'Q', x: -142 },
      { key: '1', x: -47 },
      { key: '2', x: 48 },
      { key: 'ESPAÇO', x: 143 }
    ];

    slotDefs.forEach(({ key, x }) => {
      const back = scene.add.rectangle(x, -61, 82, 72, 0x24314d, 1);
      back.setStrokeStyle(2, 0x586b8c, 1);
      const text = scene.add.text(x, -61, key, {
        fontFamily: 'Arial', fontSize: 11, color: '#ffffff', fontStyle: 'bold', align: 'center', wordWrap: { width: 72 }
      }).setOrigin(0.5);
      this.root.add([back, text]);
      this.backs.push(back);
      this.slots.push(text);
    });

    this.potionText = scene.add.text(290, -24, '', {
      fontFamily: 'Arial', fontSize: 12, color: '#ecf0ff', align: 'left'
    }).setOrigin(0.5);
    this.root.add(this.potionText);

    scene.add.text(0, 1, 'C  •  CONTROLES', {
      fontFamily: 'Arial', fontSize: 12, color: '#7ee0ff', fontStyle: 'bold', backgroundColor: '#182033', padding: { left: 8, right: 8, top: 4, bottom: 4 }
    }).setOrigin(0.5).setScrollFactor(0).setDepth(701);
    // Move the controls text into the action bar coordinate system.
    const controls = scene.children.list[scene.children.list.length - 1] as Phaser.GameObjects.Text;
    controls.x = 0;
    controls.y = -2;
    this.root.add(controls);

    this.update();
  }

  update(): void {
    const hpRatio = Phaser.Math.Clamp(this.player.hp / Math.max(1, this.player.maxHp), 0, 1);
    const manaRatio = Phaser.Math.Clamp(this.player.mana / Math.max(1, this.player.maxMana), 0, 1);

    this.hpOrb.setScale(Math.max(0.25, 0.45 + hpRatio * 0.55));
    this.manaOrb.setScale(Math.max(0.25, 0.45 + manaRatio * 0.55));
    this.hpOrb.setAlpha(0.45 + hpRatio * 0.55);
    this.manaOrb.setAlpha(0.45 + manaRatio * 0.55);
    this.hpText.setText(`HP\n${this.player.hp}/${this.player.maxHp}`);
    this.manaText.setText(`MP\n${this.player.mana}/${this.player.maxMana}`);

    const classes: Record<string, string> = { warrior: 'GUERREIRO', mage: 'MAGO', ranger: 'CAÇADOR' };
    this.classText.setText(classes[this.player.characterClass] ?? 'AVENTUREIRO');

    const names = this.getAbilityNames();
    const mana = this.getAbilityMana();
    const cooldown = this.getCooldowns();
    const keys = ['Q', '1', '2', 'ESPAÇO'];

    for (let i = 0; i < 3; i += 1) {
      const cd = cooldown[i];
      this.slots[i].setText(`${keys[i]}\n${names[i]}\n${mana[i]} MP${cd > 0 ? `\n${(cd / 1000).toFixed(1)}s` : ''}`);
      this.slots[i].setColor(cd > 0 ? '#7b87a5' : '#ecf0ff');
      this.backs[i].setFillStyle(cd > 0 ? 0x1b2435 : 0x24314d, 1);
    }

    this.slots[3].setText('ESPAÇO\nATAQUE');
    this.backs[3].setFillStyle(0x2d3446, 1);

    this.potionText.setText(`H  Poção HP: ${this.getItemCount('healing_potion')}\nM  Poção MP: ${this.getItemCount('mana_potion')}`);
  }

  destroy(): void {
    this.root.destroy(true);
  }

  private getAbilityNames(): string[] {
    switch (this.player.characterClass) {
      case 'mage': return ['Nova de Gelo', 'Lança Arcana', 'Teleporte'];
      case 'ranger': return ['Chuva de Flechas', 'Flecha Perfurante', 'Rolamento'];
      default: return ['Golpe Giratório', 'Golpe de Escudo', 'Investida'];
    }
  }

  private getAbilityMana(): number[] {
    switch (this.player.characterClass) {
      case 'mage': return [14, 10, 12];
      case 'ranger': return [12, 9, 8];
      default: return [12, 8, 8];
    }
  }

  private getCooldowns(): number[] {
    const a = this.abilities as any;
    if (typeof a.cooldown === 'function') {
      return [a.cooldown('primary'), a.cooldown('secondary'), a.cooldown('mobility')];
    }
    if (typeof a.getCooldownRemaining === 'function') {
      return [a.getCooldownRemaining('primary'), a.getCooldownRemaining('secondary'), a.getCooldownRemaining('mobility')];
    }
    return [0, 0, 0];
  }
}
