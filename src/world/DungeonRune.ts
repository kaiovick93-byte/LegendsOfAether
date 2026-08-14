// @ts-nocheck
export class DungeonRune extends Phaser.GameObjects.Container {
  constructor(scene,x,y,dungeonName,regionName){
    super(scene,x,y);
    this.dungeonName=dungeonName;
    this.regionName=regionName;
    this.glyph=scene.add.circle(0,0,24,0x2f2443,.75).setStrokeStyle(3,0xc084fc,.8);
    this.rune=scene.add.text(0,-1,'ᚱ',{fontFamily:'Arial',fontSize:27,color:'#d8b8ff',fontStyle:'bold'}).setOrigin(.5);
    this.label=scene.add.text(0,38,dungeonName,{fontFamily:'Arial',fontSize:11,color:'#c8d1ea',backgroundColor:'#182033',padding:4,align:'center'}).setOrigin(.5);
    this.prompt=scene.add.text(0,-55,'E • Ler Runa',{fontFamily:'Arial',fontSize:11,color:'#ffd166',backgroundColor:'#182033',padding:{left:5,right:5,top:3,bottom:3}}).setOrigin(.5).setVisible(false);
    this.add([this.glyph,this.rune,this.label,this.prompt]);
    scene.add.existing(this); this.setDepth(20);
    scene.tweens.add({targets:this.rune,alpha:{from:.55,to:1},scale:{from:.95,to:1.08},duration:900,yoyo:true,repeat:-1,ease:'Sine.easeInOut'});
  }
  updatePrompt(px,py){this.prompt.setVisible(Phaser.Math.Distance.Between(px,py,this.x,this.y)<=85)}
  getBounds(){return new Phaser.Geom.Rectangle(this.x-34,this.y-34,68,68)}
}
