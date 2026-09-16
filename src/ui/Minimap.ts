// @ts-nocheck
/**
 * Minimap local. Todas as peças pertencem ao mesmo container HUD e recebem
 * scrollFactor=0 individualmente: o mapa muda dentro da moldura, a moldura
 * jamais acompanha a câmera do mundo.
 */
export class Minimap{
 constructor(scene,w=1920,h=1152,localName='LOCAL',options={}){
  this.scene=scene;this.w=w;this.h=h;this.localName=localName;this.artKey=options.artKey||null;
  this.projection=options.projection||'world';this.logicalBounds=options.logicalBounds||{minU:0,minV:0,maxU:82,maxV:82};
  this.baseWidth=236;this.baseHeight=208;this.artLeft=10;this.artTop=36;this.artWidth=216;this.artHeight=162;
  this.localZoom=3.25;this.visible=true;this.markerViews=[];
  this.root=scene.add.container(0,0).setScrollFactor(0).setDepth(680);
  this.bg=this.fixed(scene.add.rectangle(0,0,this.baseWidth,this.baseHeight,0x101824,.965).setOrigin(0).setStrokeStyle(2,0x9f7b3e,1));
  this.art=this.artKey&&scene.textures.exists(this.artKey)
    ?this.fixed(scene.add.image(this.artLeft+this.artWidth/2,this.artTop+this.artHeight/2,this.artKey).setDisplaySize(this.artWidth,this.artHeight))
    :this.fixed(scene.add.rectangle(this.artLeft+this.artWidth/2,this.artTop+this.artHeight/2,this.artWidth,this.artHeight,0x0d2630,1));
  this.artBorder=this.fixed(scene.add.rectangle(this.artLeft+this.artWidth/2,this.artTop+this.artHeight/2,this.artWidth,this.artHeight,0x000000,0).setStrokeStyle(1.25,0x556477,1));
  this.title=this.fixed(scene.add.text(12,8,'MINIMAPA',{fontFamily:'Georgia, serif',fontSize:12,color:'#f3ead4',fontStyle:'bold'}));
  this.local=this.fixed(scene.add.text(this.baseWidth-12,10,this.shortName(localName),{fontFamily:'Georgia, serif',fontSize:9,color:'#d6b56f',fontStyle:'italic'}).setOrigin(1,0));
  this.playerHalo=this.fixed(scene.add.circle(0,0,7,0x73e6a8,.18).setStrokeStyle(1.5,0xc5ffeb,1));
  this.playerArrow=this.fixed(scene.add.triangle(0,0,0,-6,4.8,5,-4.8,5,0x73e6a8,1).setStrokeStyle(1,0xffffff,.96));
  this.playerDot=this.fixed(scene.add.circle(0,1.8,1.55,0xffffff,1));
  scene.tweens.add({targets:this.playerHalo,scale:{from:.8,to:1.3},alpha:{from:.8,to:.14},duration:850,yoyo:true,repeat:-1,ease:'Sine.InOut'});
  this.root.add([this.bg,this.art,this.artBorder,this.title,this.local,this.playerHalo,this.playerArrow,this.playerDot]);
  this.resizeHandler=gameSize=>this.layout(gameSize.width,gameSize.height);
  scene.scale.on(Phaser.Scale.Events.RESIZE,this.resizeHandler);
  scene.events.once(Phaser.Scenes.Events.SHUTDOWN,()=>scene.scale.off(Phaser.Scale.Events.RESIZE,this.resizeHandler));
  this.layout(scene.scale.width,scene.scale.height);
 }
 fixed(go){go.setScrollFactor?.(0);return go}
 shortName(name){return String(name||'LOCAL').replace(' • ISOMÉTRICA','').slice(0,28)}
 normalized(point={}){
  if(this.projection==='aether-territory'){
   const u=Number.isFinite(point.u)?point.u:point.isoX,v=Number.isFinite(point.v)?point.v:point.isoY;
   const span=this.logicalBounds.maxU-this.logicalBounds.minU;
   return{x:.5+(u-v)/span*.41,y:.22+(u+v)/(span*2)*.56};
  }
  if(this.projection==='aether-city-exact'){
   const u=Number.isFinite(point.u)?point.u:point.isoX,v=Number.isFinite(point.v)?point.v:point.isoY;
   const x=Number.isFinite(point.x)?point.x:Number.isFinite(u)&&Number.isFinite(v)?1600+(u-v)*48:0;
   const y=Number.isFinite(point.y)?point.y:Number.isFinite(u)&&Number.isFinite(v)?250+(u+v)*24:0;
   const scale=Math.min(1024/this.w,768/this.h);
   return{x:((1024-this.w*scale)/2+x*scale)/1024,y:((768-this.h*scale)/2+y*scale)/768};
  }
  return{x:(point.x||0)/this.w,y:(point.y||0)/this.h};
 }
 pointOnMap(point,center){
  const n=this.normalized(point),c=center||n,z=this.localZoom;
  return{x:this.artLeft+this.artWidth*.5+(n.x-c.x)*this.artWidth*z,y:this.artTop+this.artHeight*.5+(n.y-c.y)*this.artHeight*z};
 }
 layout(width,height){
  const pad=Phaser.Math.Clamp(Math.round(width*.012),10,16);
  const scale=Math.min(1,(width-pad*2)/this.baseWidth,(height-pad*2)/this.baseHeight);
  this.root.setPosition(width-pad-this.baseWidth*scale,pad).setScale(scale,scale);
 }
 setLocalName(name){this.localName=name;this.local.setText(this.shortName(name))}
 addMarker(marker){
  const color=marker.color??0xffd166;
  const halo=this.fixed(this.scene.add.circle(0,0,4.5,0x04080d,.78).setStrokeStyle(1.2,color,1));
  const dot=this.fixed(this.scene.add.circle(0,0,1.9,color,1));
  this.root.add([halo,dot]);this.markerViews.push({marker,halo,dot});this.refreshMarkerVisibility();
 }
 markerAllowed(marker){return typeof marker.isVisible==='function'?!!marker.isVisible():marker.isVisible!==false}
 refreshMarkerVisibility(){for(const view of this.markerViews){const allowed=this.markerAllowed(view.marker);view.halo.setVisible(allowed);view.dot.setVisible(allowed)}}
 update(x,y,player){
  if(!this.visible)return;
  const playerPoint=player||{x,y},center=this.normalized(playerPoint);
  let mapCenter=center;
  if(this.art?.setCrop&&this.art.texture?.key!=='__MISSING'){
   const source=this.art.texture.getSourceImage();
   const cropW=source.width/this.localZoom,cropH=source.height/this.localZoom;
   const cropX=Phaser.Math.Clamp(center.x*source.width-cropW/2,0,source.width-cropW);
   const cropY=Phaser.Math.Clamp(center.y*source.height-cropH/2,0,source.height-cropH);
   this.art.setCrop(cropX,cropY,cropW,cropH).setPosition(this.artLeft+this.artWidth/2,this.artTop+this.artHeight/2).setDisplaySize(this.artWidth,this.artHeight);
   mapCenter={x:(cropX+cropW/2)/source.width,y:(cropY+cropH/2)/source.height};
  }
  const p=this.pointOnMap(playerPoint,mapCenter);
  this.playerHalo.setPosition(p.x,p.y);this.playerArrow.setPosition(p.x,p.y-1);this.playerDot.setPosition(p.x,p.y+1.8);
  const facing=player?.facing||'down';
  const angles={right:90,downRight:135,down:180,downLeft:225,left:270,upLeft:315,up:0,upRight:45};
  this.playerArrow.setAngle(angles[facing]??180);
  for(const view of this.markerViews){
   const q=this.pointOnMap(view.marker,mapCenter);
   const inside=q.x>this.artLeft&&q.x<this.artLeft+this.artWidth&&q.y>this.artTop&&q.y<this.artTop+this.artHeight;
   const visible=inside&&this.markerAllowed(view.marker);
   view.halo.setVisible(visible).setPosition(q.x,q.y);view.dot.setVisible(visible).setPosition(q.x,q.y);
  }
 }
 setVisible(value){this.visible=!!value;this.root.setVisible(this.visible)}
 destroy(){this.scene.scale.off(Phaser.Scale.Events.RESIZE,this.resizeHandler);this.root.destroy(true)}
}
