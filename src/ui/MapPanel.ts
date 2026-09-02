// @ts-nocheck
/** Expanded map opened by M. The city uses a dedicated 2.5D painted map; the
 * other legacy regions keep a clean coordinate surface until they receive
 * their own illustrated plates. */
export class MapPanel{
 constructor(scene,options={}){
  this.scene=scene;
  this.worldWidth=options.worldWidth||1920;
  this.worldHeight=options.worldHeight||1152;
  this.localName=options.localName||'LOCAL';
  this.artKey=options.artKey||null;
  this.projection=options.projection||'world';
  this.markerData=options.markers||[];
  this.onClose=options.onClose||(()=>{});
  this.visible=false;
  this.build();
  this.resizeHandler=()=>this.layout();
  scene.scale.on(Phaser.Scale.Events.RESIZE,this.resizeHandler);
  scene.events.once(Phaser.Scenes.Events.SHUTDOWN,()=>scene.scale.off(Phaser.Scale.Events.RESIZE,this.resizeHandler));
 }

 build(){
  const s=this.scene;
  this.root=s.add.container(0,0).setScrollFactor(0).setDepth(1550).setVisible(false).setAlpha(0);
  this.backdrop=s.add.rectangle(0,0,1,1,0x03070b,.82).setOrigin(0);
  this.panel=s.add.graphics();
  this.mapFrame=s.add.graphics();
  this.grid=s.add.graphics();
  this.art=this.artKey&&s.textures.exists(this.artKey)?s.add.image(0,0,this.artKey):null;
  this.title=s.add.text(0,0,'MAPA — CIDADE DE AETHER',{fontFamily:'Georgia, serif',fontSize:27,color:'#f3ead4',fontStyle:'bold'}).setOrigin(.5);
  this.local=s.add.text(0,0,this.localName,{fontFamily:'Georgia, serif',fontSize:12,color:'#d6b56f',fontStyle:'italic'}).setOrigin(.5);
  this.hint=s.add.text(0,0,'M / ESC  •  FECHAR',{fontFamily:'Arial',fontSize:11,color:'#b9c2cf',fontStyle:'bold',backgroundColor:'#182231',padding:{left:12,right:12,top:7,bottom:7}}).setOrigin(.5).setInteractive({useHandCursor:true});
  this.hint.on('pointerdown',()=>this.onClose());

  this.markerViews=this.markerData.map(marker=>{
   const halo=s.add.circle(0,0,8,0x02050a,.76).setStrokeStyle(1.5,marker.color??0xffd166,1);
   const dot=s.add.circle(0,0,3.5,marker.color??0xffd166,1);
   const label=s.add.text(0,0,marker.label||'',{fontFamily:'Georgia, serif',fontSize:11,color:'#f3ead4',fontStyle:'bold',stroke:'#05080c',strokeThickness:4}).setOrigin(0,.5);
   return{marker,halo,dot,label};
  });
  this.playerHalo=s.add.circle(0,0,10,0x75e7c1,.15).setStrokeStyle(2,0xa8ffe3,.95);
  this.playerDot=s.add.circle(0,0,4.5,0x73e6a8,1).setStrokeStyle(1.5,0xffffff,1);
  s.tweens.add({targets:this.playerHalo,scale:{from:.82,to:1.28},alpha:{from:.8,to:.16},duration:920,yoyo:true,repeat:-1,ease:'Sine.InOut'});

  this.root.add([this.backdrop,this.panel,this.mapFrame,this.grid]);
  if(this.art)this.root.add(this.art);
  for(const marker of this.markerViews)this.root.add([marker.halo,marker.dot,marker.label]);
  this.root.add([this.playerHalo,this.playerDot,this.title,this.local,this.hint]);
  this.layout();
 }

 normalized(point={}){
  if(this.projection==='aether-city-exact'){
   const u=Number.isFinite(point.u)?point.u:point.isoX;
   const v=Number.isFinite(point.v)?point.v:point.isoY;
   const x=Number.isFinite(point.x)?point.x:Number.isFinite(u)&&Number.isFinite(v)?1600+(u-v)*48:0;
   const y=Number.isFinite(point.y)?point.y:Number.isFinite(u)&&Number.isFinite(v)?250+(u+v)*24:0;
   const mapScale=Math.min(1024/this.worldWidth,768/this.worldHeight);
   const offsetX=(1024-this.worldWidth*mapScale)/2;
   const offsetY=(768-this.worldHeight*mapScale)/2;
   return{x:(offsetX+x*mapScale)/1024,y:(offsetY+y*mapScale)/768};
  }
  return{x:(point.x||0)/this.worldWidth,y:(point.y||0)/this.worldHeight};
 }

 pointOnMap(point){
  const n=this.normalized(point),b=this.artBounds;
  return{
   x:b.x+Phaser.Math.Clamp(n.x,.035,.965)*b.width,
   y:b.y+Phaser.Math.Clamp(n.y,.035,.965)*b.height
  };
 }

 layout(){
  const W=this.scene.scale.width,H=this.scene.scale.height;
  const margin=Phaser.Math.Clamp(Math.round(Math.min(W,H)*.035),12,28);
  const panelW=Math.max(300,Math.min(980,W-margin*2));
  const panelH=Math.max(300,Math.min(720,H-margin*2));
  const panelX=(W-panelW)/2,panelY=(H-panelH)/2;
  this.backdrop.setSize(W,H);

  this.panel.clear();
  this.panel.fillStyle(0x000000,.34).fillRoundedRect(panelX+7,panelY+9,panelW,panelH,16);
  this.panel.fillStyle(0x111a26,.99).fillRoundedRect(panelX,panelY,panelW,panelH,16);
  this.panel.lineStyle(2,0x9f7b3e,1).strokeRoundedRect(panelX,panelY,panelW,panelH,16);
  this.panel.lineStyle(1,0x334157,1).strokeRoundedRect(panelX+5,panelY+5,panelW-10,panelH-10,12);

  const availableW=Math.max(220,panelW-48),availableH=Math.max(150,panelH-132);
  const artW=Math.min(availableW,availableH*4/3),artH=artW*3/4;
  const artX=W/2-artW/2,artY=panelY+70+(availableH-artH)/2;
  this.artBounds={x:artX,y:artY,width:artW,height:artH};
  this.mapFrame.clear();
  this.mapFrame.fillStyle(0x061018,1).fillRoundedRect(artX-7,artY-7,artW+14,artH+14,9);
  this.mapFrame.lineStyle(1.5,0xb28a45,1).strokeRoundedRect(artX-7,artY-7,artW+14,artH+14,9);
  this.mapFrame.lineStyle(1,0x31445a,1).strokeRect(artX-2,artY-2,artW+4,artH+4);
  if(this.art)this.art.setPosition(W/2,artY+artH/2).setDisplaySize(artW,artH);
  else this.drawFallbackGrid();

  this.title.setPosition(W/2,panelY+27).setFontSize(W<620?20:27).setText(this.projection==='aether-city-exact'?'MAPA — CIDADE DE AETHER':'MAPA DA REGIÃO');
  this.local.setPosition(W/2,panelY+52).setText(this.localName);
  this.hint.setPosition(W/2,panelY+panelH-24);
  for(const view of this.markerViews){
   const p=this.pointOnMap(view.marker);
   view.halo.setPosition(p.x,p.y);view.dot.setPosition(p.x,p.y);
   const rightSide=p.x>W/2;
   view.label.setOrigin(rightSide?1:0,.5).setPosition(p.x+(rightSide?-11:11),p.y);
  }
  if(this.lastPlayer)this.updatePlayer(this.lastPlayer);
 }

 drawFallbackGrid(){
  const b=this.artBounds;
  this.grid.clear();
  this.grid.fillStyle(0x0d2630,1).fillRect(b.x,b.y,b.width,b.height);
  this.grid.lineStyle(1,0x355362,.38);
  for(let i=1;i<8;i++)this.grid.lineBetween(b.x+b.width*i/8,b.y,b.x+b.width*i/8,b.y+b.height);
  for(let i=1;i<6;i++)this.grid.lineBetween(b.x,b.y+b.height*i/6,b.x+b.width,b.y+b.height*i/6);
 }

 updatePlayer(player){
  this.lastPlayer=player;
  if(!this.artBounds)return;
  const p=this.pointOnMap(player);
  this.playerHalo.setPosition(p.x,p.y);
  this.playerDot.setPosition(p.x,p.y);
 }

 setLocalName(name){this.localName=name;this.local.setText(name)}
 open(player){
  this.visible=true;this.layout();this.updatePlayer(player);
  this.root.setVisible(true).setAlpha(0);
  this.scene.tweens.add({targets:this.root,alpha:1,duration:150,ease:'Sine.Out'});
 }
 close(immediate=false){
  if(!this.visible&&!this.root.visible)return;
  this.visible=false;this.scene.tweens.killTweensOf(this.root);
  if(immediate){this.root.setVisible(false).setAlpha(0);return}
  this.scene.tweens.add({targets:this.root,alpha:0,duration:110,ease:'Sine.In',onComplete:()=>this.root.setVisible(false)});
 }
 isVisible(){return !!this.visible}
 destroy(){this.scene.scale.off(Phaser.Scale.Events.RESIZE,this.resizeHandler);this.root.destroy(true)}
}
