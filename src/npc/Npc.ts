// @ts-nocheck
export class Npc extends Phaser.GameObjects.Container{
 constructor(scene,x,y,name,text,actions={}){
  super(scene,x,y);
  this.npcName=name;
  this.text=text||['Olá, viajante.'];
  this.actions=actions;
  this.placeholderParts=[
    scene.add.circle(0,-14,10,0xffe6c7),
    scene.add.rectangle(0,8,20,28,0xffd166)
  ];
  this.add(this.placeholderParts);
  this.nameText=scene.add.text(0,-54,name,{fontFamily:'Arial',fontSize:12,color:'#ecf0ff',backgroundColor:'#182033',padding:{left:6,right:6,top:3,bottom:3}}).setOrigin(.5).setVisible(false);
  this.add(this.nameText);
  this.prompt=scene.add.text(0,-78,'F • Conversar',{fontFamily:'Arial',fontSize:11,color:'#73e6a8',backgroundColor:'#182033',padding:{left:6,right:6,top:3,bottom:3}}).setOrigin(.5).setVisible(false);
  this.add(this.prompt);
  this.sprite=null;
  this.textureKey=null;
  this.currentFacing='down';
  this.nearby=false;
  this.nextIdleTurn=0;
  this.idleBobTween=null;
  scene.add.existing(this);
  this.setDepth(25);
  scene.events.on('update', this.handleNpcUpdate, this);
  scene.events.once('shutdown', ()=>this.cleanupNpc());
  scene.events.once('destroy', ()=>this.cleanupNpc());
 }
 setPrompt(text){this.prompt?.setText(text)}
 setNearby(v){
  this.nearby=!!v;
  this.prompt?.setVisible(!!v);
  this.nameText?.setVisible(!!v);
  if(this.sprite){
   if(this.nearby) this.facePlayer();
   else this.ensureIdleFacing();
  }
 }
 setNpcVisible(v){
  this.setVisible(v);
  if(!v){
   this.prompt?.setVisible(false);
   this.nameText?.setVisible(false);
  }else if(this.nearby){
   this.prompt?.setVisible(true);
   this.nameText?.setVisible(true);
  }
 }
 setRealSprite(textureKey:string){
  if(!this.scene.textures.exists(textureKey)) return false;
  this.textureKey=textureKey;
  if(this.placeholderParts){for(const part of this.placeholderParts){part.destroy()}this.placeholderParts=[]}
  if(this.sprite){this.sprite.destroy()}
  this.sprite=this.scene.add.sprite(0,8,textureKey,0);
  this.sprite.setOrigin(.5,1).setScale(.40);
  this.addAt(this.sprite,0);
  this.createMoveAnimations(textureKey);
  this.setFacing('down');
  this.startIdleBob();
  return true;
 }
 createMoveAnimations(textureKey:string){
  const rows={down:0,up:5,left:10,right:15};
  for(const [dir,start] of Object.entries(rows)){
   const key=`npc-${textureKey}-${dir}`;
   if(!this.scene.anims.exists(key)){
    this.scene.anims.create({
     key,
     frames:this.scene.anims.generateFrameNumbers(textureKey,{start,end:start+4}),
     frameRate:6,
     repeat:-1
    });
   }
  }
 }
 setFacing(dir){
  if(!this.sprite) return;
  const frameMap={down:0,up:5,left:10,right:15};
  const frame=frameMap[dir] ?? 0;
  this.currentFacing=dir;
  this.sprite.stop();
  this.sprite.setFrame(frame);
 }
 ensureIdleFacing(){
  if(!this.sprite) return;
  this.setFacing(this.currentFacing || 'down');
 }
 facePlayer(){
  if(!this.sprite) return;
  const player=this.scene?.player;
  if(!player) return;
  const dx=player.x-this.x;
  const dy=player.y-this.y;
  let dir='down';
  if(Math.abs(dx)>Math.abs(dy)) dir=dx<0?'left':'right';
  else dir=dy<0?'up':'down';
  this.setFacing(dir);
 }
 startIdleBob(){
  if(!this.sprite || this.idleBobTween) return;
  this.idleBobTween=this.scene.tweens.add({
   targets:this.sprite,
   y:{from:8,to:6},
   duration:900,
   yoyo:true,
   repeat:-1,
   ease:'Sine.easeInOut'
  });
 }
 handleNpcUpdate(time){
  if(!this.active || !this.visible || !this.sprite) return;
  if(this.nearby){
   this.facePlayer();
   return;
  }
  if(time < this.nextIdleTurn) return;
  this.nextIdleTurn=time + Phaser.Math.Between(1800, 4200);
  const roll=Phaser.Math.Between(0,99);
  let dir='down';
  if(roll < 20) dir='left';
  else if(roll < 40) dir='right';
  else if(roll < 50) dir='up';
  else dir='down';
  this.setFacing(dir);
 }
 cleanupNpc(){
  try{ this.scene?.events?.off('update', this.handleNpcUpdate, this); }catch(e){}
  try{ this.idleBobTween?.stop(); }catch(e){}
  this.idleBobTween=null;
 }
}
