// @ts-nocheck
export class AreaPortal{constructor(scene,x,y,color=0x7ee0ff){this.scene=scene;this.c=scene.add.circle(x,y,20,color,.18).setStrokeStyle(3,color,.75).setDepth(8);scene.tweens.add({targets:this.c,scale:1.3,alpha:.5,duration:700,yoyo:true,repeat:-1})}flash(){this.c.setAlpha(1);this.scene.tweens.add({targets:this.c,alpha:.2,duration:180,yoyo:true})}destroy(){this.c.destroy()}}
