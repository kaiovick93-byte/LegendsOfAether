export interface MinimapMarker {
  x: number;
  y: number;
  color?: number;
  label?: string;
}

export class Minimap {
  private readonly width = 180;
  private readonly height = 132;
  private readonly padding = 10;
  private readonly mapW: number;
  private readonly mapH: number;
  private readonly x: number;
  private readonly y: number;
  private readonly bg: Phaser.GameObjects.Rectangle;
  private readonly border: Phaser.GameObjects.Rectangle;
  private readonly title: Phaser.GameObjects.Text;
  private readonly playerDot: Phaser.GameObjects.Arc;
  private readonly markers: Phaser.GameObjects.GameObject[] = [];

  constructor(scene: Phaser.Scene, mapW = 1920, mapH = 1152) {
    this.mapW = mapW;
    this.mapH = mapH;

    this.x = scene.scale.width - this.width - 16;
    this.y = 16;

    this.bg = scene.add.rectangle(this.x, this.y, this.width, this.height, 0x182033, 0.94)
      .setOrigin(0, 0)
      .setScrollFactor(0)
      .setDepth(500);

    this.border = scene.add.rectangle(this.x, this.y, this.width, this.height, 0x000000, 0)
      .setOrigin(0, 0)
      .setScrollFactor(0)
      .setDepth(501)
      .setStrokeStyle(2, 0x7ee0ff, 0.75);

    this.title = scene.add.text(this.x + 10, this.y + 8, 'MAPA', {
      fontFamily: 'Arial',
      fontSize: '13px',
      color: '#ecf0ff',
      fontStyle: 'bold'
    })
      .setScrollFactor(0)
      .setDepth(502);

    this.playerDot = scene.add.circle(this.x + this.width / 2, this.y + 74, 5, 0x73e6a8, 1)
      .setScrollFactor(0)
      .setDepth(503);

    scene.tweens.add({
      targets: this.playerDot,
      scale: { from: 0.85, to: 1.25 },
      alpha: { from: 0.75, to: 1 },
      duration: 700,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut'
    });
  }

  public update(x: number, y: number): void {
    const usableW = this.width - this.padding * 2;
    const usableH = this.height - 48;

    const px = this.x + this.padding + Phaser.Math.Clamp(x / this.mapW, 0, 1) * usableW;
    const py = this.y + 38 + Phaser.Math.Clamp(y / this.mapH, 0, 1) * usableH;

    this.playerDot.setPosition(px, py);
  }

  public addMarker(marker: MinimapMarker): void {
    const usableW = this.width - this.padding * 2;
    const usableH = this.height - 48;

    const px = this.x + this.padding + Phaser.Math.Clamp(marker.x / this.mapW, 0, 1) * usableW;
    const py = this.y + 38 + Phaser.Math.Clamp(marker.y / this.mapH, 0, 1) * usableH;

    const dot = this.sceneAddCircle(px, py, marker.color ?? 0xffd166);
    this.markers.push(dot);

    if (marker.label) {
      const label = this.sceneAddText(px + 7, py - 7, marker.label);
      this.markers.push(label);
    }
  }

  public clearMarkers(): void {
    for (const marker of this.markers) {
      marker.destroy();
    }
    this.markers.length = 0;
  }

  public destroy(): void {
    this.clearMarkers();
    this.playerDot.destroy();
    this.title.destroy();
    this.border.destroy();
    this.bg.destroy();
  }

  private sceneAddCircle(x: number, y: number, color: number): Phaser.GameObjects.Arc {
    const scene = this.playerDot.scene as Phaser.Scene;
    return scene.add.circle(x, y, 3, color, 1)
      .setScrollFactor(0)
      .setDepth(503);
  }

  private sceneAddText(x: number, y: number, text: string): Phaser.GameObjects.Text {
    const scene = this.playerDot.scene as Phaser.Scene;
    return scene.add.text(x, y, text, {
      fontFamily: 'Arial',
      fontSize: '10px',
      color: '#c8d1ea',
      backgroundColor: '#182033',
      padding: { left: 3, right: 3, top: 2, bottom: 2 }
    })
      .setScrollFactor(0)
      .setDepth(504);
  }
}
