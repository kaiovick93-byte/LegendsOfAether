// @ts-nocheck
export class Minimap {
  constructor(private scene:Phaser.Scene, private w=1920, private h=1152){
    const pad=14; const mw=156; const mh=118;
    this.bg=scene.add.rectangle(scene.scale.width-pad, pad,mw,mh,0x182033,.92).setOrigin(1,0).setScrollFactor(0).setDepth(680).setStrokeStyle(2,0x32405f,1);
    this.title=scene.add.text(scene.scale.width-pad-10,pad+8,'MAPA',{fontFamily:'Arial',fontSize:12,color:'#ecf0ff',fontStyle:'bold'}).setOrigin(1,0).setScrollFactor(0).setDepth(681);
    this.dot=scene.add.circle(scene.scale.width-pad-78,pad+70,4,0x73e6a8,1).setScrollFactor(0).setDepth(682);
    this.visible=true;
  }
  addMarker(marker:any){const pad=14,mw=156,mh=118;const x=this.scene.scale.width-pad-mw+8+(marker.x/this.w)*(mw-16);const y=pad+28+(marker.y/this.h)*(mh-36);const dot=this.scene.add.circle(x,y,3,marker.color??0xffd166,1).setScrollFactor(0).setDepth(682);let label=null;if(marker.label)label=this.scene.add.text(x+6,y-6,marker.label,{fontFamily:'Arial',fontSize:9,color:'#c8d1ea'}).setScrollFactor(0).setDepth(682);(this.markers??=[]).push({dot,label});}
  update(x:number,y:number){if(!this.visible)return;const pad=14,mw=156,mh=118;this.dot.setPosition(this.scene.scale.width-pad-mw+8+(x/this.w)*(mw-16),pad+28+(y/this.h)*(mh-36));}
  setVisible(value:boolean){this.visible=value;this.bg.setVisible(value);this.title.setVisible(value);this.dot.setVisible(value);(this.markers??[]).forEach((m:any)=>{m.dot.setVisible(value);m.label?.setVisible(value)});}
  destroy(){this.bg.destroy();this.title.destroy();this.dot.destroy();(this.markers??[]).forEach((m:any)=>{m.dot.destroy();m.label?.destroy()});}
  private visible=true; private bg:any; private title:any; private dot:any; private markers:any[]=[];
}
