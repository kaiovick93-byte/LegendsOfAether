// @ts-nocheck
/** Mini mapa local: recorta a pintura 2,5D em volta do jogador, sem reduzir a cidade inteira. */
export class Minimap{
 constructor(scene,w=1920,h=1152,localName='LOCAL',options={}){
  this.scene=scene;this.w=w;this.h=h;this.localName=localName;this.artKey=options.artKey||null;this.projection=options.projection||'world';this.logicalBounds=options.logicalBounds||{minU:0,minV:0,maxU:82,maxV:82};
  this.baseWidth=236;this.baseHeight=208;this.localZoom=3.25;this.visible=true;this.markerViews=[];
  this.root=scene.add.container(0,0).setScrollFactor(0).setDepth(680);
  this.bg=scene.add.rectangle(-this.baseWidth,0,this.baseWidth,this.baseHeight,0x101824,.965).setOrigin(0).setStrokeStyle(2,0x9f7b3e,1);
  this.art=this.artKey&&scene.textures.exists(this.artKey)?scene.add.image(-this.baseWidth/2,117,this.artKey).setDisplaySize(216,162):scene.add.rectangle(-this.baseWidth/2,117,216,162,0x0d2630,1);
  this.artBorder=scene.add.rectangle(-this.baseWidth/2,117,216,162,0x000000,0).setStrokeStyle(1.25,0x556477,1);
  this.title=scene.add.text(-this.baseWidth+12,8,'MINIMAPA',{fontFamily:'Georgia, serif',fontSize:12,color:'#f3ead4',fontStyle:'bold'});
  this.local=scene.add.text(-12,10,this.shortName(localName),{fontFamily:'Georgia, serif',fontSize:9,color:'#d6b56f',fontStyle:'italic'}).setOrigin(1,0);
  this.playerHalo=scene.add.circle(0,0,6.5,0x73e6a8,.18).setStrokeStyle(1.4,0xc5ffeb,1);
  this.dot=scene.add.circle(0,0,3.2,0x73e6a8,1).setStrokeStyle(1,0xffffff,1);
  scene.tweens.add({targets:this.playerHalo,scale:{from:.8,to:1.3},alpha:{from:.8,to:.14},duration:850,yoyo:true,repeat:-1,ease:'Sine.InOut'});
  this.root.add([this.bg,this.art,this.artBorder,this.title,this.local,this.playerHalo,this.dot]);
  this.resizeHandler=gameSize=>this.layout(gameSize.width,gameSize.height);scene.scale.on(Phaser.Scale.Events.RESIZE,this.resizeHandler);scene.events.once(Phaser.Scenes.Events.SHUTDOWN,()=>scene.scale.off(Phaser.Scale.Events.RESIZE,this.resizeHandler));this.layout(scene.scale.width,scene.scale.height);
 }
 shortName(name){return String(name||'LOCAL').replace(' • ISOMÉTRICA','').slice(0,28)}
 normalized(point={}){if(this.projection==='aether-territory'){const u=Number.isFinite(point.u)?point.u:point.isoX,v=Number.isFinite(point.v)?point.v:point.isoY,span=this.logicalBounds.maxU-this.logicalBounds.minU;return{x:.5+(u-v)/span*.41,y:.22+(u+v)/(span*2)*.56}}if(this.projection==='aether-city-exact'){const u=Number.isFinite(point.u)?point.u:point.isoX,v=Number.isFinite(point.v)?point.v:point.isoY,x=Number.isFinite(point.x)?point.x:Number.isFinite(u)&&Number.isFinite(v)?1600+(u-v)*48:0,y=Number.isFinite(point.y)?point.y:Number.isFinite(u)&&Number.isFinite(v)?250+(u+v)*24:0,scale=Math.min(1024/this.w,768/this.h);return{x:((1024-this.w*scale)/2+x*scale)/1024,y:((768-this.h*scale)/2+y*scale)/768}}return{x:(point.x||0)/this.w,y:(point.y||0)/this.h}}
 pointOnMap(point,center){const n=this.normalized(point),c=center||n,left=-this.baseWidth+10,top=36,width=216,height=162,z=this.localZoom;return{x:left+width*.5+(n.x-c.x)*width*z,y:top+height*.5+(n.y-c.y)*height*z}}
 layout(width,height){const pad=Phaser.Math.Clamp(Math.round(width*.012),10,16),scale=Math.min(1,(width-pad*2)/this.baseWidth,(height-pad*2)/this.baseHeight);this.root.setPosition(width-pad,pad).setScale(scale,scale)}
 setLocalName(name){this.localName=name;this.local.setText(this.shortName(name))}
 addMarker(marker){const halo=this.scene.add.circle(0,0,4.2,0x04080d,.78).setStrokeStyle(1.2,marker.color??0xffd166,1),dot=this.scene.add.circle(0,0,1.8,marker.color??0xffd166,1);this.root.add([halo,dot]);this.markerViews.push({marker,halo,dot});this.refreshMarkerVisibility()}
 markerAllowed(marker){return typeof marker.isVisible==='function'?!!marker.isVisible():marker.isVisible!==false}
 refreshMarkerVisibility(){for(const view of this.markerViews){const allowed=this.markerAllowed(view.marker);view.halo.setVisible(allowed);view.dot.setVisible(allowed)}}
 update(x,y,player){if(!this.visible)return;const c=this.normalized(player||{x,y});let mapCenter=c;if(this.art?.setCrop){const source=this.art.texture.getSourceImage(),cropW=source.width/this.localZoom,cropH=source.height/this.localZoom,cropX=Phaser.Math.Clamp(c.x*source.width-cropW/2,0,source.width-cropW),cropY=Phaser.Math.Clamp(c.y*source.height-cropH/2,0,source.height-cropH);this.art.setCrop(cropX,cropY,cropW,cropH).setScale(216/cropW,162/cropH);mapCenter={x:(cropX+cropW/2)/source.width,y:(cropY+cropH/2)/source.height}}const p=this.pointOnMap(player||{x,y},mapCenter);this.playerHalo.setPosition(p.x,p.y);this.dot.setPosition(p.x,p.y);for(const view of this.markerViews){const q=this.pointOnMap(view.marker,mapCenter),inside=q.x>-this.baseWidth+10&&q.x<-10&&q.y>36&&q.y<198,visible=inside&&this.markerAllowed(view.marker);view.halo.setVisible(visible).setPosition(q.x,q.y);view.dot.setVisible(visible).setPosition(q.x,q.y)}}
 setVisible(value){this.visible=value;this.root.setVisible(value)}
 destroy(){this.scene.scale.off(Phaser.Scale.Events.RESIZE,this.resizeHandler);this.root.destroy(true)}
}
