// @ts-nocheck
export class Npc extends Phaser.GameObjects.Container{constructor(scene,x,y,name,text,actions={}){super(scene,x,y);this.npcName=name;this.text=text||['Olá, viajante.'];this.actions=actions;this.add(scene.add.circle(0,-14,10,0xffe6c7));this.add(scene.add.rectangle(0,8,20,28,0xffd166));this.nameText=scene.add.text(0,-38,name,{fontFamily:'Arial',fontSize:11,color:'#ecf0ff',backgroundColor:'#182033',padding:3}).setOrigin(.5);this.add(this.nameText);this.prompt=scene.add.text(0,-62,'F • Conversar',{fontFamily:'Arial',fontSize:11,color:'#73e6a8',backgroundColor:'#182033',padding:{left:5,right:5,top:2,bottom:2}}).setOrigin(.5).setVisible(false);this.add(this.prompt);scene.add.existing(this);this.setDepth(25)}setPrompt(text){this.prompt.setText(text)}setNearby(v){this.prompt.setVisible(v)}setNpcVisible(v){this.setVisible(v);this.nameText?.setVisible(v);this.prompt?.setVisible(v)}
  setRealSprite(textureKey:string){
    if(!this.scene.textures.exists(textureKey)) return false;
    if(this.sprite) this.sprite.destroy();
    this.sprite=this.scene.add.sprite(0,8,textureKey,0);
    this.sprite.setOrigin(0.5,1).setScale(0.40);
    this.add(this.sprite);
    const rows={down:0,up:5,left:10,right:15};
    for(const [dir,start] of Object.entries(rows)){
      const key=`npc-${textureKey}-${dir}`;
      if(!this.scene.anims.exists(key)) this.scene.anims.create({key,frames:this.scene.anims.generateFrameNumbers(textureKey,{start,end:start+4}),frameRate:6,repeat:-1});
    }
    this.sprite.play('npc-'+textureKey+'-down');
    return true;
  }
}
