import Phaser from "phaser";

export interface MinimapMarker {
  id: string;
  x: number;
  y: number;
  color: number;
  label?: string;
}

export class Minimap {
  private readonly background: Phaser.GameObjects.Rectangle;
  private readonly border: Phaser.GameObjects.Rectangle;
  private readonly title: Phaser.GameObjects.Text;
  private readonly playerDot: Phaser.GameObjects.Arc;
  private readonly markerDots = new Map<string, Phaser.GameObjects.Arc>();
  private readonly markerLabels = new Map<string, Phaser.GameObjects.Text>();

  constructor(
    private readonly scene: Phaser.Scene,
    private readonly opts: {
      worldWidth: number;
      worldHeight: number;
      x?: number;
      y?: number;
      width?: number;
      height?: number;
      title?: string;
    }
  ) {
    const x = opts.x ?? 800;
    const y = opts.y ?? 16;
    const width = opts.width ?? 144;
    const height = opts.height ?? 112;

    this.background = scene.add.rectangle(x, y, width, height, 0x182033, 0.92)
      .setOrigin(0, 0)
      .setScrollFactor(0)
      .setDepth(150);

    this.border = scene.add.rectangle(x, y, width, height, 0x000000, 0)
      .setOrigin(0, 0)
      .setScrollFactor(0)
      .setDepth(151)
      .setStrokeStyle(2, 0x32405f, 1);

    this.title = scene.add.text(x + 10, y + 8, opts.title ?? "MAPA", {
      fontFamily: "Arial",
      fontSize: "14px",
      color: "#ecf0ff",
      fontStyle: "bold"
    }).setScrollFactor(0).setDepth(152);

    this.playerDot = scene.add.circle(x + 72, y + 62, 4, 0x73e6a8, 1)
      .setScrollFactor(0)
      .setDepth(153);
  }

  public addMarker(marker: MinimapMarker): void {
    if (this.markerDots.has(marker.id)) {
      this.removeMarker(marker.id);
    }

    const [px, py] = this.worldToMini(marker.x, marker.y);

    const dot = this.scene.add.circle(px, py, 3, marker.color, 1)
      .setScrollFactor(0)
      .setDepth(153);

    this.markerDots.set(marker.id, dot);

    if (marker.label) {
      const label = this.scene.add.text(px + 6, py - 6, marker.label, {
        fontFamily: "Arial",
        fontSize: "11px",
        color: "#c8d1ea"
      }).setScrollFactor(0).setDepth(153);

      this.markerLabels.set(marker.id, label);
    }
  }

  public setMarker(marker: MinimapMarker): void {
    this.addMarker(marker);
  }

  public removeMarker(id: string): void {
    const dot = this.markerDots.get(id);
    const label = this.markerLabels.get(id);

    if (dot) {
      dot.destroy();
      this.markerDots.delete(id);
    }

    if (label) {
      label.destroy();
      this.markerLabels.delete(id);
    }
  }

  public clearMarkers(): void {
    for (const dot of this.markerDots.values()) {
      dot.destroy();
    }
    for (const label of this.markerLabels.values()) {
      label.destroy();
    }

    this.markerDots.clear();
    this.markerLabels.clear();
  }

  public update(playerX: number, playerY: number): void {
    const [px, py] = this.worldToMini(playerX, playerY);
    this.playerDot.setPosition(px, py);
  }

  public destroy(): void {
    this.clearMarkers();
    this.playerDot.destroy();
    this.title.destroy();
    this.border.destroy();
    this.background.destroy();
  }

  private worldToMini(x: number, y: number): [number, number] {
    const bx = this.background.x;
    const by = this.background.y;
    const width = this.background.width;
    const height = this.background.height;

    const miniX = bx + 8 + (x / this.opts.worldWidth) * (width - 16);
    const miniY = by + 28 + (y / this.opts.worldHeight) * (height - 36);

    return [miniX, miniY];
  }
}
