// @ts-nocheck
export class AbilitySystem{
 constructor(scene,player){this.scene=scene;this.player=player;this.cool={primary:0,secondary:0,mobility:0};this.pausedAt=null}
 loadout(){if(this.player.characterClass==='mage')return{primary:['Nova de Gelo',14,1100],secondary:['Lança Arcana',10,650],mobility:['Teleporte',12,1200]};if(this.player.characterClass==='ranger')return{primary:['Chuva de Flechas',12,1000],secondary:['Flecha Perfurante',9,600],mobility:['Rolamento',8,1050]};return{primary:['Golpe Giratório',12,900],secondary:['Golpe de Escudo',8,750],mobility:['Investida',8,1200]}}
 use(type,targets){
  const [name,baseMana,cd]=this.loadout()[type],rank=this.player.scene.skillManager?.getRank(type)||0;
  if(type!=='mobility'&&this.scene.isSafeZone){this.scene.showActionMessage?.('Habilidade ofensiva indisponível em zona segura.');return false}
  if(rank<=0){this.scene.showActionMessage?.(`Aprenda ${name} na árvore de Skills (K).`);return false}
  const mana=baseMana+(rank-1)*3;if(this.pausedAt!==null||this.scene.time.now<this.cool[type]||this.player.mana<mana||this.player.isDead())return false;
  this.player.mana-=mana;this.cool[type]=this.scene.time.now+cd;
  const radius=this.player.characterClass==='mage'?105:this.player.characterClass==='ranger'?190:85;
  for(const e of targets){if(!e?.active||!e.isAlive())continue;const d=Phaser.Math.Distance.Between(this.player.x,this.player.y,e.x,e.y);if(d<=radius){const base=type==='secondary'?(this.player.characterClass==='mage'?2.0:2.1):(this.player.characterClass==='mage'?1.7:this.player.characterClass==='ranger'?1.35:1.55);e.takeDamage(Math.round(this.player.attackDamage*(base+(rank-1)*.22)))}}
  if(type==='mobility'){const d=Math.SQRT1_2,v={up:[0,-1],upRight:[d,-d],right:[1,0],downRight:[d,d],down:[0,1],downLeft:[-d,d],left:[-1,0],upLeft:[-d,-d]}[this.player.facing]||[0,1],dist=this.player.characterClass==='mage'?150:this.player.characterClass==='ranger'?125:135;this.scene.tweens.add({targets:this.player,x:Phaser.Math.Clamp(this.player.x+v[0]*dist,32,this.scene.physics.world.bounds.width-32),y:Phaser.Math.Clamp(this.player.y+v[1]*dist,32,this.scene.physics.world.bounds.height-120),duration:160,ease:'Cubic.Out'})}
  return true
 }
 cooldown(k){return Math.max(0,this.cool[k]-this.scene.time.now)}
 pause(){if(this.pausedAt===null)this.pausedAt=this.scene.time.now}
 resume(){if(this.pausedAt===null)return;const d=this.scene.time.now-this.pausedAt;for(const k of Object.keys(this.cool))this.cool[k]+=d;this.pausedAt=null}
}
