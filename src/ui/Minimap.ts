// @ts-nocheck
export class Minimap{
 constructor(scene,w=1920,h=1152,localName='LOCAL'){
  this.scene=scene;this.w=w;this.h=h;this.localName=localName;
  const pad=14,mw=170,mh=125,x=scene.scale.width-pad,y=pad;
  this.bg=scene.add.rectangle(x,y,mw,mh,0x182033,.92).setOrigin(1,0).setScrollFactor(0).setDepth(680).setStrokeStyle(2,0x32405f,1);
  this.title=scene.add.text(x-10,y+7,'MAPA',{fontFamily:'Arial',fontSize:12,color:'#ecf0ff',fontStyle:'bold'}).setOrigin(1,0).setScrollFactor(0).setDepth(681);
  this.local=scene.add.text(x-10,y+26,`LOCAL: ${localName}`,{fontFamily:'Arial',fontSize:10,color:'#73e6a8',fontStyle:'bold'}).setOrigin(1,0).setScrollFactor(0).setDepth(681);
  this.dot=scene.add.circle(x-mw/2,y+78,4,0x73e6a8,1).setScrollFactor(0).setDepth(682);this.markers=[];this.visible=true;
 }
 addMarker(m){const pad=14,mw=170,mh=125,x=this.scene.scale.width-pad-mw+8+(m.x/this.w)*(mw-16),y=pad+46+(m.y/this.h)*(mh-54);const dot=this.scene.add.circle(x,y,3,m.color??0xffd166,1).setScrollFactor(0).setDepth(682);const label=m.label?this.scene.add.text(x+6,y-5,m.label,{fontFamily:'Arial',fontSize:9,color:'#c8d1ea'}).setScrollFactor(0).setDepth(682):null;this.markers.push({dot,label})}
 update(x,y){if(!this.visible)return;const pad=14,mw=170,mh=125;this.dot.setPosition(this.scene.scale.width-pad-mw+8+(x/this.w)*(mw-16),pad+46+(y/this.h)*(mh-54))}
 setVisible(v){this.visible=v;[this.bg,this.title,this.local,this.dot].forEach(o=>o.setVisible(v));this.markers.forEach(m=>{m.dot.setVisible(v);m.label?.setVisible(v)})}
 destroy(){[this.bg,this.title,this.local,this.dot].forEach(o=>o.destroy());this.markers.forEach(m=>{m.dot.destroy();m.label?.destroy()})}
}
