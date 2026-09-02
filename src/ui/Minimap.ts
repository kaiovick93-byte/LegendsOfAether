// @ts-nocheck
/** Compact map with a native 4:3 painted plate. Its root only scales
 * uniformly on very small viewports; neither the frame nor the map art is
 * stretched independently. */
export class Minimap{
 constructor(scene,w=1920,h=1152,localName='LOCAL',options={}){
  this.scene=scene;this.w=w;this.h=h;this.localName=localName;
  this.artKey=options.artKey||null;this.projection=options.projection||'world';
  this.baseWidth=236;this.baseHeight=208;this.visible=true;this.markerViews=[];
  this.root=scene.add.container(0,0).setScrollFactor(0).setDepth(680);
  this.bg=scene.add.rectangle(-this.baseWidth,0,this.baseWidth,this.baseHeight,0x101824,.965).setOrigin(0).setStrokeStyle(2,0x9f7b3e,1);
  this.inner=scene.add.graphics();
  this.art=this.artKey&&scene.textures.exists(this.artKey)
   ?scene.add.image(-this.baseWidth/2,117,this.artKey).setDisplaySize(216,162)
   :scene.add.rectangle(-this.baseWidth/2,117,216,162,0x0d2630,1);
  this.artBorder=scene.add.rectangle(-this.baseWidth/2,117,216,162,0x000000,0).setStrokeStyle(1.25,0x556477,1);
  this.title=scene.add.text(-this.baseWidth+12,8,'MAPA  •  M',{fontFamily:'Georgia, serif',fontSize:12,color:'#f3ead4',fontStyle:'bold'}).setOrigin(0,0);
  this.local=scene.add.text(-12,10,this.shortName(localName),{fontFamily:'Georgia, serif',fontSize:9,color:'#d6b56f',fontStyle:'italic'}).setOrigin(1,0);
  this.playerHalo=scene.add.circle(0,0,6.5,0x73e6a8,.18).setStrokeStyle(1.4,0xc5ffeb,1);
  this.dot=scene.add.circle(0,0,3.2,0x73e6a8,1).setStrokeStyle(1,0xffffff,1);
  scene.tweens.add({targets:this.playerHalo,scale:{from:.8,to:1.3},alpha:{from:.8,to:.14},duration:850,yoyo:true,repeat:-1,ease:'Sine.InOut'});
  this.root.add([this.bg,this.inner,this.art,this.artBorder,this.title,this.local,this.playerHalo,this.dot]);
  this.resizeHandler=gameSize=>this.layout(gameSize.width,gameSize.height);
  scene.scale.on(Phaser.Scale.Events.RESIZE,this.resizeHandler);
  scene.events.once(Phaser.Scenes.Events.SHUTDOWN,()=>scene.scale.off(Phaser.Scale.Events.RESIZE,this.resizeHandler));
  this.layout(scene.scale.width,scene.scale.height);
 }

 shortName(name){return String(name||'LOCAL').replace(' • ISOMÉTRICA','').slice(0,28)}
 normalized(point={}){
  if(this.projection==='aether-city-exact'){
   const u=Number.isFinite(point.u)?point.u:point.isoX;
   const v=Number.isFinite(point.v)?point.v:point.isoY;
   const x=Number.isFinite(point.x)?point.x:Number.isFinite(u)&&Number.isFinite(v)?1600+(u-v)*48:0;
   const y=Number.isFinite(point.y)?point.y:Number.isFinite(u)&&Number.isFinite(v)?250+(u+v)*24:0;
   // A arte contém o mundo 3200×1900 reduzido uniformemente para 1024×608
   // e centralizado verticalmente dentro da placa 1024×768.
   const mapScale=Math.min(1024/this.w,768/this.h);
   const offsetX=(1024-this.w*mapScale)/2;
   const offsetY=(768-this.h*mapScale)/2;
   return{x:(offsetX+x*mapScale)/1024,y:(offsetY+y*mapScale)/768};
  }
  return{x:(point.x||0)/this.w,y:(point.y||0)/this.h};
 }
 pointOnMap(point){
  const n=this.normalized(point),left=-this.baseWidth+10,top=36,width=216,height=162;
  return{x:left+Phaser.Math.Clamp(n.x,.035,.965)*width,y:top+Phaser.Math.Clamp(n.y,.035,.965)*height};
 }
 layout(width,height){
  const pad=Phaser.Math.Clamp(Math.round(width*.012),10,16);
  const scale=Math.min(1,(width-pad*2)/this.baseWidth,(height-pad*2)/this.baseHeight);
  this.root.setPosition(width-pad,pad).setScale(scale,scale);
 }
 setLocalName(name){this.localName=name;this.local.setText(this.shortName(name))}
 addMarker(marker){
  const p=this.pointOnMap(marker);
  const halo=this.scene.add.circle(p.x,p.y,4.2,0x04080d,.78).setStrokeStyle(1.2,marker.color??0xffd166,1);
  const dot=this.scene.add.circle(p.x,p.y,1.8,marker.color??0xffd166,1);
  const label=this.scene.add.text(p.x,p.y-8,marker.label||'',{fontFamily:'Arial',fontSize:7,color:'#f1eadb',fontStyle:'bold',stroke:'#05080b',strokeThickness:3}).setOrigin(.5,1);
  this.root.add([halo,dot,label]);this.markerViews.push({marker,halo,dot,label});
 }
 update(x,y,player){
  if(!this.visible)return;
  const p=this.pointOnMap(player||{x,y});this.playerHalo.setPosition(p.x,p.y);this.dot.setPosition(p.x,p.y);
 }
 setVisible(value){this.visible=value;this.root.setVisible(value)}
 destroy(){this.scene.scale.off(Phaser.Scale.Events.RESIZE,this.resizeHandler);this.root.destroy(true)}
}
