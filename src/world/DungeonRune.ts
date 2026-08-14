// @ts-nocheck
export class DungeonRune extends Phaser.GameObjects.Container{
 constructor(scene,x,y,dungeonName,region){super(scene,x,y);this.dungeonName=dungeonName;
  const stone=scene.add.rectangle(0,0,54,42,0x263044,1).setStrokeStyle(2,0x596b91,1);
  const rune=scene.add.text(0,-1,'✦',{fontFamily:'Arial',fontSize:30,color:'#8cc0ff',fontStyle:'bold'}).setOrigin(.5);
  this.prompt=scene.add.text(0,-48,'E • Ler Runa',{fontFamily:'Arial',fontSize:12,color:'#7ee0ff',backgroundColor:'#182033',padding:{left:6,right:6,top:3,bottom:3}}).setOrigin(.5).setVisible(false);
  this.label=scene.add.text(0,32,`ENTRADA • ${region}`,{fontFamily:'Arial',fontSize:10,color:'#9aa8c7',align:'center'}).setOrigin(.5).setVisible(false);
  this.add([stone,rune,this.prompt,this.label]);this.setDepth(21);scene.add.existing(this);
  scene.tweens.add({targets:rune,alpha:{from:.55,to:1},scale:{from:.95,to:1.08},duration:900,yoyo:true,repeat:-1,ease:'Sine.InOut'});
 }
 updatePrompt(px,py){const d=Phaser.Math.Distance.Between(px,py,this.x,this.y);const near=d<=90;this.prompt.setVisible(near);this.label.setVisible(near)}
}