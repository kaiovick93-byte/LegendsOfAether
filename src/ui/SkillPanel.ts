// @ts-nocheck
export class SkillPanel{constructor(scene,skills){this.skills=skills;this.text=scene.add.text(650,80,'',{fontFamily:'Arial',fontSize:'13px',color:'#ecf0ff',backgroundColor:'#182033',padding:10,wordWrap:{width:290}}).setScrollFactor(0).setDepth(450).setVisible(false)}toggle(){this.text.setVisible(!this.text.visible);this.refresh()}refresh(){const r=this.skills.ranks;this.text.setText(`SKILLS (K)
Pontos: ${this.skills.points}
1 Poder: ${r.power_strike}
2 Vitalidade: ${r.vitality}
3 Mana: ${r.mana_well}
4 Velocidade: ${r.swift_step}
5 Crítico: ${r.critical_eye}`)}}
