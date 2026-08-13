// @ts-nocheck
import {ScreenFade} from '../ui/ScreenFade';

export class PrologueScene extends Phaser.Scene {
  constructor(){super('PrologueScene')}

  create(){
    this.fade=new ScreenFade(this);
    this.page=0;
    this.pages=[
      {title:'ANTES DA QUEDA',body:'Antes da queda, Aether era um reino unido pela energia do Cristal.'},
      {title:'A LUZ DO CRISTAL',body:'Durante séculos, o Cristal manteve as fronteiras do mundo protegidas e alimentou cidades, florestas e antigas fortalezas.'},
      {title:'A CORRUPÇÃO',body:'Mas uma noite, algo mudou. O Cristal foi corrompido e uma energia sombria começou a se espalhar pelo reino.'},
      {title:'O REINO EM PERIGO',body:'Monstros surgiram nas florestas. As antigas cavernas despertaram. E o castelo caiu nas mãos de um rei consumido pelas sombras.'},
      {title:'A ÚLTIMA ESPERANÇA',body:'Os poucos sobreviventes buscaram refúgio na pequena cidade de Aether. Agora, uma nova ameaça cresce além dos seus muros.'},
      {title:'A JORNADA',body:'Dizem que o Selo Real de Aether ainda pode purificar a corrupção. Mas ninguém conseguiu chegar até o salão do trono.'},
      {title:'VOCÊ FOI CHAMADO',body:'Agora cabe a você atravessar a floresta, enfrentar as profundezas da caverna e desafiar o poder que tomou o castelo.'},
      {title:'A LENDA COMEÇA',body:'Escolha seu caminho. Descubra a verdade. E decida o destino de Aether.'}
    ];

    this.createBackground();
    this.createTexts();
    this.createControls();
    this.showPage();
    this.fade.in();

    this.keyEnter=this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.ENTER);
    this.keySpace=this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);
    this.keyEscape=this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.ESC);
    this.keyP=this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.P);
  }

  update(){
    if(Phaser.Input.Keyboard.JustDown(this.keyEnter) || Phaser.Input.Keyboard.JustDown(this.keySpace)) this.nextPage();
    if(Phaser.Input.Keyboard.JustDown(this.keyEscape) || Phaser.Input.Keyboard.JustDown(this.keyP)) this.skip();
  }

  createBackground(){
    this.add.rectangle(480,270,960,540,0x080d18,1);
    this.glow=this.add.circle(480,230,220,0x7ee0ff,0.07);
    this.tweens.add({targets:this.glow,scale:{from:0.92,to:1.08},alpha:{from:0.035,to:0.09},duration:2400,yoyo:true,repeat:-1,ease:'Sine.easeInOut'});

    for(let i=0;i<20;i++){
      const star=this.add.circle(Phaser.Math.Between(30,930),Phaser.Math.Between(20,520),Phaser.Math.Between(1,2),0xecf0ff,Phaser.Math.FloatBetween(0.08,0.22));
      this.tweens.add({targets:star,alpha:0,y:star.y-Phaser.Math.Between(8,28),duration:Phaser.Math.Between(1600,3000),repeat:-1,yoyo:true,ease:'Sine.easeInOut'});
    }
  }

  createTexts(){
    this.title=this.add.text(480,92,'',{fontFamily:'Arial',fontSize:33,color:'#ffd166',fontStyle:'bold',align:'center'}).setOrigin(.5);
    this.body=this.add.text(480,245,'',{fontFamily:'Arial',fontSize:21,color:'#ecf0ff',align:'center',wordWrap:{width:720},lineSpacing:10}).setOrigin(.5);
    this.counter=this.add.text(480,400,'',{fontFamily:'Arial',fontSize:13,color:'#7280a8'}).setOrigin(.5);
  }

  createControls(){
    this.next=this.add.text(480,455,'ENTER / ESPAÇO  •  CONTINUAR',{fontFamily:'Arial',fontSize:16,color:'#73e6a8',backgroundColor:'#182033',padding:{left:16,right:16,top:9,bottom:9}}).setOrigin(.5).setInteractive({useHandCursor:true});
    this.skipBtn=this.add.text(918,506,'Pular  [Esc]',{fontFamily:'Arial',fontSize:13,color:'#9aa8c7'}).setOrigin(1,.5).setInteractive({useHandCursor:true});
    this.next.on('pointerdown',()=>this.nextPage());
    this.skipBtn.on('pointerdown',()=>this.skip());
  }

  showPage(){
    const page=this.pages[this.page];
    this.title.setText(page.title);
    this.body.setText(page.body);
    this.counter.setText(`${this.page+1} / ${this.pages.length}`);
    this.next.setText(this.page===this.pages.length-1?'ENTER / ESPAÇO  •  ESCOLHER CLASSE':'ENTER / ESPAÇO  •  CONTINUAR');
  }

  nextPage(){
    if(this.page>=this.pages.length-1){this.toClassSelect();return;}
    this.page+=1;
    this.flashPage();
  }

  flashPage(){
    this.pageTransition=this.add.rectangle(480,270,960,540,0x000000,0).setDepth(20);
    this.tweens.add({targets:this.pageTransition,alpha:.25,duration:80,yoyo:true,onComplete:()=>{this.pageTransition.destroy();this.showPage();}});
  }

  skip(){this.toClassSelect();}

  toClassSelect(){
    this.fade.out(()=>this.scene.start('CharacterSelectScene'));
  }
}
