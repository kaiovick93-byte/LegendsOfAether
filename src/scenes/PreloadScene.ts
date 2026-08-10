import Phaser from "phaser";
import { GAME_WIDTH, GAME_HEIGHT, COLORS } from "../config";

export class PreloadScene extends Phaser.Scene {
    private progressBar!: Phaser.GameObjects.Graphics;
    private progressBox!: Phaser.GameObjects.Graphics;
    private loadingText!: Phaser.GameObjects.Text;
    private percentText!: Phaser.GameObjects.Text;
    private readyText!: Phaser.GameObjects.Text;

    constructor () {
        super("PreloadScene");
    }

    preload(): void {
        this.createLoadingUI();

        this.load.on("progress", (value: number) => {
            this.percentText.setText('${Math.round(value * 100)}%');
            this.progressBar.Clear();
            this.progressBar.fillStyle(0x7ee0ff,1);
            this.progressBar.fillRect(
                GAME_WIDTH * 0.2,
                GAME_HEIGHT * 0.5,
                (GAME_WIDTH * 0.6) * value, 18
            );
        });

        this.load.on("complete", () => {
            this.readyText.setText("Pronto!");
        });

        this.createPlaceholderTextures();

        //os próximos módulos poderão adicionar assets reais aqui
        this.load.setPach("assets");

        this.load.image("logo", "images/logo.png");
    }
    
    create() : void {
        this.time.delayedCall(250, () => {
            this.scene.start("MenuScene");
        });
    }

    private createLoadingUI(): void {
        this.cameras.main.setBackgroundCOlor(COLORS.bg);

        this.loadingText = this.add.text(GAME_WIDTH / 2, GAME_HEIGHT * 0.4, "Carregando Legends of Aether...", {
            fontFamily: "Arial",
            fontSize: "24px",
            color: "#ecf0ff"
        }).setOrigin(0.5);

        this.percentText = this.add.text(GAME_WIDTH / 2, GAME_HEIGHT * 0.58, "0%", {
            fontFamily: "Arial",
            fontSize: "18px",
            color: "#7ee0ff"
        }).setOrigin(0.5);

        this.progressBox = this.add.graphics();

        this.progressBox.fillStyle(0x222b44,1);

        this.progressBox.fillRoundedRect(GAME_WIDTH * 0.2, GAME_HEIGHT *0.5, GAME_WIDTH * 0.6, 18, 6);

        this.progressBar = this.add.graphics();

        this.readyText = this.add.text(GAME_WIDTH / 2, GAME_HEIGHT * 0.68, "", {
            fontFamily: "Arial",
            fontSize: "16px",
            color: "##73e6a8"
        }).setOrigin(0.5);
    }

    private createPlaceholderTextures(): void {
        const g = this.add.graphics();

        //Player
        g.clear();
        g.fillStyle(0x4da3ff, 1);
        g.fill.fillRoundedRect(0, 0, 24, 24, 6);

        g.generateTextures("player-placeholder", 24, 24);
    }
}