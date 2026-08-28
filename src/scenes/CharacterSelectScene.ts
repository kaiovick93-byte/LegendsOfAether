// @ts-nocheck
import {CLASSES} from '../character/CharacterClass';
import {PLAYER_APPEARANCE_ORDER,PLAYER_APPEARANCES,idleFrameForFacing,playerTextureKey} from '../character/PlayerAppearance';
import {ScreenFade} from '../ui/ScreenFade';

export class CharacterSelectScene extends Phaser.Scene{
 constructor(){super('CharacterSelectScene')}
 create(){
  this.fade=new ScreenFade(this);this.selectedAppearance='warrior_m';this.cards=[];
  this.add.rectangle(480,270,960,540,0x0d1422,1);
  this.add.text(480,30,'ESCOLHA SEU HERÓI',{fontFamily:'Arial',fontSize:'28px',color:'#ecf0ff',fontStyle:'bold'}).setOrigin(.5);
  this.add.text(480,58,'Três classes • duas aparências por classe • caminhada em oito direções',{fontFamily:'Arial',fontSize:'11px',color:'#9aa8c7'}).setOrigin(.5);
  const classX={warrior:180,mage:480,ranger:780};
  const colors={warrior:0xd0604e,mage:0x6475c7,ranger:0x6d9b62};
  for(const [classId,x] of Object.entries(classX)){
   this.add.text(x,88,CLASSES[classId].name.toUpperCase(),{fontFamily:'Arial',fontSize:'17px',color:'#ffd166',fontStyle:'bold'}).setOrigin(.5);
   const ids=PLAYER_APPEARANCE_ORDER.filter(id=>PLAYER_APPEARANCES[id].classId===classId);
   ids.forEach((id,index)=>{
    const appearance=PLAYER_APPEARANCES[id],cx=x+(index===0?-67:67);
    const panel=this.add.rectangle(cx,214,122,214,0x182033,.98).setStrokeStyle(2,0x32405f,1).setInteractive({useHandCursor:true});
    const portrait=this.add.sprite(cx,196,playerTextureKey(id,'base'),idleFrameForFacing('down')).setScale(1.42).setInteractive({useHandCursor:true});
    const gender=this.add.text(cx,300,appearance.genderLabel.toUpperCase(),{fontFamily:'Arial',fontSize:'11px',color:'#ecf0ff',fontStyle:'bold'}).setOrigin(.5);
    const choose=()=>this.choose(id);
    panel.on('pointerdown',choose);portrait.on('pointerdown',choose);gender.setInteractive({useHandCursor:true}).on('pointerdown',choose);
    this.cards.push({id,panel,portrait,color:colors[classId]});
   });
  }
  this.info=this.add.text(480,376,'',{fontFamily:'Arial',fontSize:'13px',color:'#c8d1ea',align:'center',wordWrap:{width:820}}).setOrigin(.5);
  this.add.text(480,430,'O herói começa com roupas simples, sem arma e sem armadura. O visual muda ao equipar itens compatíveis.',{fontFamily:'Arial',fontSize:'11px',color:'#9aa8c7',align:'center'}).setOrigin(.5);
  const go=this.add.text(480,486,'COMEÇAR NOVO JOGO',{fontFamily:'Arial',fontSize:'18px',color:'#73e6a8',backgroundColor:'#24314d',padding:{left:20,right:20,top:11,bottom:11}}).setOrigin(.5).setInteractive({useHandCursor:true});
  go.on('pointerover',()=>go.setBackgroundColor('#36507c')).on('pointerout',()=>go.setBackgroundColor('#24314d'));
  go.on('pointerdown',()=>this.fade.out(()=>{const appearance=PLAYER_APPEARANCES[this.selectedAppearance];this.registry.set('selectedClass',appearance.classId);this.registry.set('selectedAppearance',appearance.id);this.scene.start('AetherCityScene')}));
  this.choose('warrior_m');this.fade.in();
 }
 choose(id){
  this.selectedAppearance=id;const appearance=PLAYER_APPEARANCES[id],d=CLASSES[appearance.classId];
  for(const card of this.cards){const selected=card.id===id;card.panel.setFillStyle(selected?0x24314d:0x182033,1).setStrokeStyle(selected?4:2,selected?card.color:0x32405f,1);card.portrait.setAlpha(selected?1:.72)}
  this.info.setText(`${d.name} • ${appearance.genderLabel}\n${d.description}   HP +${d.stats.hp}   Mana +${d.stats.mana}   ATQ +${d.stats.attack}   DEF +${d.stats.defense}   SPD +${d.stats.speed}`);
 }
}
