import Phaser from "phaser";

export class Npc extends Phaser.GameObjects.Container {
  public readonly npcName: string;
  public readonly dialogue: string[];

  constructor(
    scene: Phaser.Scene,
    x: number,
    y: number,
    npcName: string,
    dialogue: string[] = []
  ) {
    super(scene, x, y);

    this.npcName = npcName;
    this.dialogue = dialogue.length > 0
      ? dialogue
      : [
          "Olá, viajante.",
          "O mundo de Aether está em perigo.",
          "Fale comigo novamente se quiser ouvir mais."
        ];

    const body = scene.add.rectangle(0, 0, 24, 30, 0xf4d35e, 1);
    body.setStrokeStyle(2, 0x8a6d2f, 1);

    const head = scene.add.circle(0, -18, 10, 0xffe6c7, 1);
    head.setStrokeStyle(2, 0x8a6d2f, 1);

    const label = scene.add.text(0, -40, npcName, {
      fontFamily: "Arial",
      fontSize: "12px",
      color: "#ecf0ff",
      backgroundColor: "#182033",
      padding: { left: 5, right: 5, top: 2, bottom: 2 }
    }).setOrigin(0.5);

    const marker = scene.add.text(0, -56, "!", {
      fontFamily: "Arial",
      fontSize: "18px",
      color: "#ffd166",
      fontStyle: "bold"
    }).setOrigin(0.5);

    this.add([body, head, label, marker]);

    scene.add.existing(this);
    this.setDepth(12);

    scene.tweens.add({
      targets: this,
      y: y - 3,
      duration: 800,
      yoyo: true,
      repeat: -1,
      ease: "Sine.easeInOut"
    });
  }
}
