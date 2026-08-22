// @ts-nocheck
export class PreloadScene extends Phaser.Scene{
  constructor(){super('PreloadScene')}
  preload(){
    this.load.spritesheet('merchant','assets/images/characters/npcs/merchant.png',{frameWidth:128,frameHeight:160});
    this.load.spritesheet('blacksmith','assets/images/characters/npcs/blacksmith.png',{frameWidth:128,frameHeight:160});this.load.spritesheet('healer','assets/images/characters/npcs/healer.png',{frameWidth:128,frameHeight:160});this.load.spritesheet('scholar','assets/images/characters/npcs/scholar.png',{frameWidth:128,frameHeight:160});
    this.load.spritesheet('player','assets/images/characters/player.png',{frameWidth:96,frameHeight:96});
    const g=this.add.graphics();
    g.fillStyle(0xff6b6b).fillRect(0,0,32,32);g.generateTexture('enemy',32,32);
    g.clear();g.fillStyle(0x4b9b5a).fillRect(0,0,32,32);g.generateTexture('grass',32,32);
    g.clear();g.fillStyle(0xb59b71).fillRect(0,0,32,32);g.generateTexture('path',32,32);
    g.clear();g.fillStyle(0x3c8a50).fillCircle(16,11,12);g.fillStyle(0x6b4934).fillRect(12,12,8,20);g.generateTexture('tree-placeholder',32,32);
    g.clear();g.fillStyle(0x4a6572).fillRect(0,0,96,96);g.fillStyle(0x7ee0ff).fillRect(42,16,12,64);g.generateTexture('player-fallback',96,96);
    g.destroy();
    this.load.once('complete',()=>{
      if(!this.textures.exists('player')) this.registry.set('playerTextureKey','player-fallback');
      else this.registry.set('playerTextureKey','player');
    });
  }
  create(){
    const dirs={down:[0,3],up:[4,7],left:[8,11],right:[12,15]};
    for(const d of Object.keys(dirs)){
      const [start,end]=dirs[d];
      const key=this.registry.get('playerTextureKey')||'player';
      this.anims.create({key:`player-walk-${d}`,frames:this.anims.generateFrameNumbers(key,{start,end}),frameRate:8,repeat:-1});
    }
    this.scene.start('MenuScene');
  }
}
