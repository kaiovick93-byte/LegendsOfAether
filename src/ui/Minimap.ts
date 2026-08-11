// @ts-nocheck
export class Minimap{constructor(scene,w=1920,h=1152){this.w=w;this.h=h;this.bg=scene.add.rectangle(800,18,145,112,0x182033,.92).setScrollFactor(0).setDepth(400);this.dot=scene.add.circle(800,72,4,0x73e6a8).setScrollFactor(0).setDepth(401)}update(x,y){this.dot.setPosition(735+(x/this.w)*120,42+(y/this.h)*80)}}
