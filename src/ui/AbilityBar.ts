// @ts-nocheck
export class AbilityBar{constructor(scene,abilities){this.abilities=abilities;this.text=scene.add.text(250,490,'',{fontFamily:'Arial',fontSize:'12px',color:'#ecf0ff',backgroundColor:'#182033',padding:8}).setScrollFactor(0).setDepth(400)}update(){const l=this.abilities.loadout();this.text.setText(`Q ${l.primary[0]} | 1 ${l.secondary[0]} | 2 ${l.mobility[0]}`)}}
