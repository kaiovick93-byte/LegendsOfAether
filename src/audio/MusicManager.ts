// @ts-nocheck
export class MusicManager{constructor(scene){this.scene=scene;this.sound=null}play(track){this.stop()}stop(){if(this.sound){this.sound.stop();this.sound.destroy();this.sound=null}}}
