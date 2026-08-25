
// @ts-nocheck
/**
 * AmbientCityLife
 * Ambient NPCs/fauna for Cidade de Aether. These entities deliberately have
 * no interaction prompt, dialogue, quest hook or physics collider.
 */
export class AmbientCityLife{
  constructor(scene,layout={}){
    this.scene=scene;
    this.layout=layout;
    this.animals=[];
    this.birds=[];
    this.perchedBirds=[];
    this.installAnimations();
    this.createDog();
    this.createCat();
    this.createOldManAndBirds();
    this.createUrbanPerchedBirds();
    this.createChickens();
    this.createChicks();
    this.createRats();
  }

  depth(y,offset=0){return this.scene.cityDepth?.(y,offset)??(5+y/1000+offset)}

  installAnimations(){
    const a=this.scene.anims;
    if(!a.exists('city-dog-walk')) a.create({key:'city-dog-walk',frames:a.generateFrameNumbers('city_dog',{start:0,end:3}),frameRate:6,repeat:-1});
    if(!a.exists('city-cat-walk')) a.create({key:'city-cat-walk',frames:a.generateFrameNumbers('city_cat',{start:0,end:3}),frameRate:7,repeat:-1});
    if(!a.exists('elder-feed-birds')) a.create({key:'elder-feed-birds',frames:a.generateFrameNumbers('elder_feeder',{start:0,end:3}),frameRate:2.4,repeat:-1});
    // Novo pássaro no mesmo padrão visual de ratos/galinhas: 0=idle, 1=step, 2=wing-lift, 3=peck.
    if(!a.exists('city-bird-peck')) a.create({key:'city-bird-peck',frames:a.generateFrameNumbers('city_bird',{frames:[0,1,0,3,0]}),frameRate:4,repeat:-1});
    if(!a.exists('city-bird-flap')) a.create({key:'city-bird-flap',frames:a.generateFrameNumbers('city_bird',{frames:[1,2,1,0]}),frameRate:7,repeat:-1});
    if(!a.exists('city-rat-gray-run')) a.create({key:'city-rat-gray-run',frames:a.generateFrameNumbers('city_rat_gray',{start:0,end:1}),frameRate:10,repeat:-1});
    if(!a.exists('city-rat-brown-run')) a.create({key:'city-rat-brown-run',frames:a.generateFrameNumbers('city_rat_brown',{start:0,end:1}),frameRate:11,repeat:-1});
    if(!a.exists('city-rat-dark-run')) a.create({key:'city-rat-dark-run',frames:a.generateFrameNumbers('city_rat_dark',{start:0,end:1}),frameRate:12,repeat:-1});
    if(!a.exists('city-chicken-white-walk')) a.create({key:'city-chicken-white-walk',frames:a.generateFrameNumbers('city_chicken_white',{frames:[0,1,2,1]}),frameRate:6,repeat:-1});
    if(!a.exists('city-chicken-brown-walk')) a.create({key:'city-chicken-brown-walk',frames:a.generateFrameNumbers('city_chicken_brown',{frames:[0,1,2,1]}),frameRate:6,repeat:-1});
    if(!a.exists('city-chicken-cream-walk')) a.create({key:'city-chicken-cream-walk',frames:a.generateFrameNumbers('city_chicken_cream',{frames:[0,1,2,1]}),frameRate:6,repeat:-1});
  }

  createDog(){
    const route=[
      {x:520,y:690,pause:1000},{x:548,y:742,pause:650},{x:620,y:790,pause:900},
      {x:690,y:808,pause:750},{x:650,y:764,pause:850},{x:570,y:718,pause:760}
    ];
    this.dog=this.createRouteAnimal('city_dog','city-dog-walk',520,690,route,{speed:29,scale:.78,startDelay:450});
  }

  createCat(){
    // O sprite do gato possui leitura lateral; por isso ele percorre agora
    // somente um eixo horizontal, longe do muro oeste.
    const route=[
      {x:180,y:470,pause:1200},{x:230,y:470,pause:650},{x:290,y:470,pause:850},
      {x:360,y:470,pause:1100},{x:300,y:470,pause:720},{x:235,y:470,pause:800}
    ];
    this.cat=this.createRouteAnimal('city_cat','city-cat-walk',180,470,route,{speed:24,scale:.76,startDelay:1300});
  }

  createRouteAnimal(texture,anim,x,y,route,opts={}){
    const s=this.scene.add.sprite(x,y,texture,0).setOrigin(.5,.82).setScale(opts.scale??1).setDepth(this.depth(y,.01));
    s.play(anim);
    const state={sprite:s,route,index:1,speed:opts.speed??28,anim,paused:false};
    this.animals.push(state);
    this.scene.time.delayedCall(opts.startDelay??500,()=>this.walkNext(state));
    return s;
  }

  walkNext(state){
    if(!state?.sprite?.active||!state.route?.length)return;
    const target=state.route[state.index%state.route.length];
    const s=state.sprite;
    const dx=target.x-s.x,dy=target.y-s.y;
    const dist=Math.max(1,Math.hypot(dx,dy));
    s.setFlipX(dx<0);
    s.play(state.anim,true);
    this.scene.tweens.add({
      targets:s,x:target.x,y:target.y,duration:(dist/state.speed)*1000,ease:'Linear',
      onUpdate:()=>s.setDepth(this.depth(s.y,.01)),
      onComplete:()=>{
        s.stop();s.setFrame((state.index+1)%4);
        state.index=(state.index+1)%state.route.length;
        this.scene.time.delayedCall(target.pause??700,()=>this.walkNext(state));
      }
    });
  }

  createChimneySmoke(){
    // Fumaça animada discreta. As casas já têm arte própria; estes puffs apenas
    // dão movimento às chaminés sem criar uma camada pesada de partículas.
    this.smokeTimers=[];
    this.createSmokeEmitter(310,590,{interval:720,scale:.72,drift:7,delay:250}); // taverna
    this.createSmokeEmitter(1314,582,{interval:880,scale:.62,drift:5,delay:900}); // erudita
  }

  createSmokeEmitter(x,y,opts={}){
    const interval=opts.interval??800;
    const spawn=()=>{
      const puff=this.scene.add.circle(x,y,4.5,0xd8d4cf,.22)
        .setScale(opts.scale??.75).setDepth(this.depth(y,-.02));
      const drift=Phaser.Math.Between(-(opts.drift??6),opts.drift??6);
      this.scene.tweens.add({
        targets:puff,
        x:x+drift,
        y:y-Phaser.Math.Between(24,36),
        alpha:0,
        scale:(opts.scale??.75)*Phaser.Math.FloatBetween(1.65,2.15),
        duration:Phaser.Math.Between(1900,2500),
        ease:'Sine.easeOut',
        onComplete:()=>puff.destroy()
      });
    };
    this.scene.time.delayedCall(opts.delay??0,()=>{
      spawn();
      const timer=this.scene.time.addEvent({delay:interval,loop:true,callback:spawn});
      this.smokeTimers.push(timer);
    });
  }

  createFacadeCloths(){
    // Dois pequenos pontos de tecido urbano. São puramente decorativos e ficam
    // fora dos eixos de circulação do jogador.
    this.clothDecor=[];
    this.createClothesline(920,960,1005,960,[0x8e5538,0xd5b35a,0x566f8b]);
    this.createClothesline(130,855,205,855,[0x6c7f55,0xb26d4b,0xc6a76a],.86);
  }

  createClothesline(x1,y1,x2,y2,colors,scale=1){
    const cx=(x1+x2)/2,cy=(y1+y2)/2;
    const line=this.scene.add.line(cx,cy,x1-cx,y1-cy,x2-cx,y2-cy,0x5b4736,.78).setOrigin(.5).setDepth(this.depth(cy));
    this.clothDecor.push(line);
    const count=colors.length;
    for(let i=0;i<count;i++){
      const t=(i+1)/(count+1);
      const x=Phaser.Math.Linear(x1,x2,t);
      const y=Phaser.Math.Linear(y1,y2,t)+2;
      const cloth=this.scene.add.rectangle(x,y,12*scale,14*scale,colors[i],.92)
        .setOrigin(.5,0).setDepth(this.depth(y,.01));
      const pin=this.scene.add.circle(x,y,1.4*scale,0xcbb58f,.9).setDepth(this.depth(y,.02));
      this.clothDecor.push(cloth,pin);
      this.scene.tweens.add({
        targets:cloth,
        angle:{from:-2-i,to:2+i},
        scaleX:{from:1,to:.93},
        duration:1350+i*170,
        yoyo:true,
        repeat:-1,
        ease:'Sine.easeInOut'
      });
    }
  }

  createSweeper(){
    // Morador ambiental sem nome/interação. Reaproveita a linguagem do sprite
    // de morador, mas vive fora do sistema Npc/WanderingNpc.
    const x=1120,y=820;
    this.sweeper=this.scene.add.sprite(x,y,'resident',0)
      .setOrigin(.5,.86).setScale(.40).setTint(0xd9cfb6).setDepth(this.depth(y,.03));

    const broom=this.scene.add.container(x+11,y-11).setDepth(this.depth(y,.04));
    const handle=this.scene.add.rectangle(0,-13,3,34,0x70503a,.98).setOrigin(.5,.8);
    const brush=this.scene.add.rectangle(0,4,15,5,0x9b7b4e,.96).setOrigin(.5,.5);
    const bristle1=this.scene.add.rectangle(-5,7,2,5,0x6e573c,.92);
    const bristle2=this.scene.add.rectangle(0,7,2,5,0x6e573c,.92);
    const bristle3=this.scene.add.rectangle(5,7,2,5,0x6e573c,.92);
    broom.add([handle,brush,bristle1,bristle2,bristle3]);
    this.sweeperBroom=broom;

    this.scene.tweens.add({
      targets:broom,
      angle:{from:-19,to:19},
      x:{from:x+8,to:x+15},
      duration:620,
      yoyo:true,
      repeat:-1,
      ease:'Sine.easeInOut'
    });
    this.scene.tweens.add({
      targets:this.sweeper,
      y:{from:y,to:y-1.5},
      duration:620,
      yoyo:true,
      repeat:-1,
      ease:'Sine.easeInOut'
    });

    // Poeira muito leve, criada apenas durante algumas varridas.
    this.sweepDustTimer=this.scene.time.addEvent({
      delay:1450,
      loop:true,
      callback:()=>{
        if(!this.sweeper?.active)return;
        for(let i=0;i<3;i++){
          const dust=this.scene.add.circle(x+Phaser.Math.Between(9,18),y+Phaser.Math.Between(-2,4),1.5+i*.35,0xb99a72,.24)
            .setDepth(this.depth(y,.02));
          this.scene.tweens.add({
            targets:dust,
            x:dust.x+Phaser.Math.Between(4,11),
            y:dust.y-Phaser.Math.Between(3,8),
            alpha:0,
            scale:1.7,
            duration:650+120*i,
            ease:'Sine.easeOut',
            onComplete:()=>dust.destroy()
          });
        }
      }
    });
  }

  createChickens(){
    // Terreiro dedicado no canto sudoeste, completamente fora das ruas.
    this.chickens=[];

    // Galinha branca: núcleo frontal do galinheiro.
    this.createChicken('city_chicken_white','city-chicken-white-walk',225,915,[
      {x:245,y:910,pause:940},{x:285,y:920,pause:760},{x:280,y:955,pause:1040},
      {x:230,y:970,pause:900},{x:205,y:945,pause:860}
    ],{speed:14,scale:.31,startDelay:700});

    // Galinha marrom: circula pelo lado direito, próxima à entrada do cercado.
    this.createChicken('city_chicken_brown','city-chicken-brown-walk',290,955,[
      {x:305,y:940,pause:780},{x:310,y:980,pause:860},{x:280,y:1000,pause:720},
      {x:245,y:990,pause:980},{x:250,y:960,pause:820}
    ],{speed:15,scale:.30,startDelay:1500});

    // Galinha creme: fundo do terreiro, próxima ao abrigo.
    this.createChicken('city_chicken_cream','city-chicken-cream-walk',270,860,[
      {x:285,y:870,pause:860},{x:305,y:890,pause:760},{x:290,y:910,pause:900},
      {x:260,y:900,pause:1040},{x:255,y:875,pause:860}
    ],{speed:13,scale:.29,startDelay:2350,flip:true});

    // Galinha menor: varia a silhueta e fecha a leitura do pequeno terreiro.
    this.createChicken('city_chicken_brown','city-chicken-brown-walk',300,885,[
      {x:315,y:890,pause:740},{x:315,y:915,pause:820},{x:295,y:930,pause:960},
      {x:270,y:920,pause:760},{x:275,y:895,pause:900}
    ],{speed:15,scale:.27,startDelay:3200,flip:true});
  }

  createChicks(){
    // Dois pintinhos discretos perto do galinheiro. Usam o mesmo sprite-base
    // das galinhas, porém com escala e rotas reduzidas para manter o padrão
    // visual sem introduzir um asset destoante.
    this.createChicken('city_chicken_cream','city-chicken-cream-walk',220,970,[
      {x:230,y:966,pause:620},{x:242,y:976,pause:740},{x:236,y:990,pause:780},
      {x:218,y:988,pause:700},{x:210,y:978,pause:660}
    ],{speed:11,scale:.17,startDelay:1200});

    this.createChicken('city_chicken_white','city-chicken-white-walk',275,955,[
      {x:283,y:952,pause:600},{x:295,y:962,pause:700},{x:290,y:975,pause:820},
      {x:274,y:975,pause:720},{x:266,y:964,pause:660}
    ],{speed:12,scale:.15,startDelay:2050,flip:true});
  }

  createChicken(texture,anim,x,y,route,opts={}){
    const chicken=this.scene.add.sprite(x,y,texture,0).setOrigin(.5,.92).setScale(opts.scale??.33).setDepth(this.depth(y,.01));
    chicken.setFlipX(!!opts.flip);
    const state={sprite:chicken,route,index:0,speed:opts.speed??15,baseScale:opts.scale??.33,anim};
    chicken.setFrame(0);
    this.chickens.push(state);
    this.scene.time.delayedCall(opts.startDelay??500,()=>this.walkChicken(state));
    return chicken;
  }

  walkChicken(state){
    const chicken=state?.sprite;if(!chicken?.active||!state.route?.length)return;
    const target=state.route[state.index%state.route.length];
    const dx=target.x-chicken.x,dy=target.y-chicken.y;
    const dist=Math.max(1,Math.hypot(dx,dy));
    chicken.setFlipX(dx<0).play(state.anim,true);
    this.scene.tweens.add({
      targets:chicken,
      x:target.x,y:target.y,
      duration:(dist/state.speed)*1000,
      ease:'Linear',
      onUpdate:()=>{
        chicken.setDepth(this.depth(chicken.y,.01));
      },
      onComplete:()=>{
        chicken.stop();
        chicken.setFrame(3);
        state.index=(state.index+1)%state.route.length;
        this.peckChicken(state,target.pause??700);
      }
    });
  }

  peckChicken(state,pause){
    const chicken=state?.sprite;if(!chicken?.active)return;
    const baseY=chicken.y;
    const baseScale=state.baseScale??.33;
    this.scene.tweens.add({
      targets:chicken,
      y:baseY+2,
      scaleY:baseScale*.96,
      angle:4,
      duration:155,
      yoyo:true,
      repeat:2,
      ease:'Sine.easeInOut',
      onComplete:()=>{
        chicken.setAngle(0).setY(baseY).setScale(baseScale).setFrame(0);
        this.scene.time.delayedCall(Math.max(220,pause-820),()=>this.walkChicken(state));
      }
    });
  }

  createRats(){
    // Três ratos percorrem ciclos fechados junto à taverna. Eles nunca somem
    // no meio da corrida; cada rota retorna naturalmente ao ponto inicial.
    this.rats=[];
    this.createDartingRat('city_rat_gray','city-rat-gray-run',
      {x:1235,y:410},[
        {x:1275,y:418,pause:90},{x:1330,y:426,pause:70},{x:1392,y:416,pause:120},
        {x:1350,y:404,pause:80},{x:1288,y:402,pause:90},{x:1235,y:410,pause:140}
      ],{speed:82,scale:.56,startDelay:700});

    this.createDartingRat('city_rat_brown','city-rat-brown-run',
      {x:1400,y:436},[
        {x:1362,y:442,pause:70},{x:1310,y:438,pause:60},{x:1252,y:430,pause:100},
        {x:1298,y:448,pause:70},{x:1354,y:452,pause:80},{x:1400,y:436,pause:130}
      ],{speed:88,scale:.54,startDelay:1800});

    this.createDartingRat('city_rat_dark','city-rat-dark-run',
      {x:1245,y:390},[
        {x:1295,y:388,pause:55},{x:1345,y:394,pause:60},{x:1395,y:388,pause:90},
        {x:1350,y:382,pause:60},{x:1290,y:382,pause:70},{x:1245,y:390,pause:130}
      ],{speed:94,scale:.52,startDelay:3000});
  }

  createDartingRat(texture,anim,start,route,opts={}){
    const rat=this.scene.add.sprite(start.x,start.y,texture,0)
      .setOrigin(.5,.82).setScale(opts.scale??.7).setDepth(this.depth(start.y,.01));
    rat.setVisible(false);
    const state={
      sprite:rat,texture,anim,start,route,index:0,speed:opts.speed??86
    };
    this.rats.push(state);
    this.scene.time.delayedCall(opts.startDelay??800,()=>this.startRatBurst(state));
    return rat;
  }

  startRatBurst(state){
    const rat=state?.sprite;if(!rat?.active)return;
    rat.setPosition(state.start.x,state.start.y).setAlpha(1).setVisible(true).setFrame(0);
    state.index=0;
    this.runRatLeg(state);
  }

  runRatLeg(state){
    const rat=state?.sprite;if(!rat?.active||!state.route?.length)return;
    const target=state.route[state.index];
    const dx=target.x-rat.x,dy=target.y-rat.y;
    const dist=Math.max(1,Math.hypot(dx,dy));
    rat.setFlipX(dx<0).play(state.anim,true);
    this.scene.tweens.add({
      targets:rat,x:target.x,y:target.y,duration:(dist/state.speed)*1000,ease:'Linear',
      onUpdate:()=>rat.setDepth(this.depth(rat.y,.01)),
      onComplete:()=>{
        rat.stop().setFrame(0);
        state.index=(state.index+1)%state.route.length;
        this.scene.time.delayedCall(target.pause??60,()=>this.runRatLeg(state));
      }
    });
  }

  createOldManAndBirds(){
    // Recanto sudeste da praça. Todos os quadros preservam a mesma escala; a
    // correção ocorre apenas pela linha dos pés, permitindo que o agachamento
    // aconteça para baixo sem puxar o personagem para cima.
    this.oldManHome={x:965,y:755};this.shoulderPerch={x:976,y:711};this.shoulderGround={x:1025,y:780};
    const elderScale=.64,frameBottom=[109,109,107,109],baseBottom=109;
    this.oldMan=this.scene.add.sprite(this.oldManHome.x,this.oldManHome.y,'elder_feeder',0).setOrigin(.5,1).setScale(elderScale).setDepth(this.depth(this.oldManHome.y,.03));
    this.oldMan.on('animationupdate',(_anim,frame)=>{const i=Number(frame?.textureFrame??0);this.oldMan?.setScale(elderScale).setY(this.oldManHome.y+(baseBottom-(frameBottom[i]??baseBottom))*elderScale)});
    this.oldMan.play('elder-feed-birds');

    const spots=[
      {x:985,y:768,scale:.70,delay:0},{x:1003,y:780,scale:.66,delay:380},
      {x:1017,y:762,scale:.62,delay:700},{x:982,y:790,scale:.58,delay:1050}
    ];
    spots.forEach((p,i)=>{
      const b=this.scene.add.sprite(p.x,p.y,'city_bird',i%2).setOrigin(.5,1).setScale(p.scale).setDepth(this.depth(p.y,.01));
      this.scene.time.delayedCall(p.delay,()=>b.play('city-bird-peck'));
      this.birds.push(b);
      this.addBirdHop(b,i);
    });

    // Um pássaro alterna entre o chão e o ombro do senhor.
    this.shoulderBird=this.scene.add.sprite(this.shoulderGround.x,this.shoulderGround.y,'city_bird',0).setOrigin(.5,1).setScale(.60).setDepth(this.depth(this.shoulderGround.y,.02));
    this.birds.push(this.shoulderBird);
    this.scene.time.delayedCall(1800,()=>this.flyToShoulder());

    // Migalhas discretas reforçam a leitura da animação, sem criar interação.
    this.crumbs=[];
    for(let i=0;i<7;i++){
      const c=this.scene.add.circle(985+(i%4)*8,778+Math.floor(i/4)*7,1.25,0xd8ad61,.75).setDepth(this.depth(778,.005));
      this.crumbs.push(c);
    }
    this.scene.tweens.add({targets:this.crumbs,alpha:{from:.3,to:.85},duration:1100,yoyo:true,repeat:-1,ease:'Sine.easeInOut'});
  }

  createUrbanPerchedBirds(){
    // Um pássaro observa o movimento do telhado da taverna, e outro repousa
    // numa pequena cerca decorativa. Ambos são puramente visuais.
    this.createPerchedBird([
      {x:1298,y:210,scale:.62,flipX:false,depth:this.depth(210,.02),pause:[2200,3600]},
      {x:1350,y:208,scale:.62,flipX:true,depth:this.depth(208,.02),pause:[1800,3200]}
    ],{startIndex:0,startDelay:2600});

    this.createPerchedBird([
      {x:122,y:812,scale:.56,flipX:false,depth:this.depth(812,.02),pause:[2600,4200]},
      {x:312,y:812,scale:.56,flipX:true,depth:this.depth(812,.02),pause:[2300,3800]}
    ],{startIndex:1,startDelay:4300});
  }

  createPerchedBird(perches,opts={}){
    if(!perches?.length)return null;
    const first=perches[opts.startIndex??0]||perches[0];
    const bird=this.scene.add.sprite(first.x,first.y,'city_bird',0)
      .setOrigin(.5,1).setScale(first.scale??.7).setDepth(first.depth??this.depth(first.y,.01));
    bird.setFlipX(!!first.flipX);
    const state={sprite:bird,perches,index:opts.startIndex??0,hopOffset:opts.hopOffset??2};
    this.perchedBirds.push(state);
    this.birds.push(bird);
    this.beginPerchedBirdIdle(state,opts.startDelay??1200);
    return bird;
  }

  beginPerchedBirdIdle(state,delay=0){
    const bird=state?.sprite;if(!bird?.active)return;
    const perch=state.perches[state.index];
    bird.setPosition(perch.x,perch.y).setScale(perch.scale??bird.scaleX).setDepth(perch.depth??this.depth(perch.y,.01)).setFlipX(!!perch.flipX);
    bird.play('city-bird-peck',true);
    this.scene.tweens.add({
      targets:bird,y:perch.y-(perch.hopOffset??state.hopOffset??2),duration:340,yoyo:true,ease:'Sine.easeInOut',repeat:1
    });
    const [lo,hi]=perch.pause??[2200,3400];
    this.scene.time.delayedCall(delay+Phaser.Math.Between(lo,hi),()=>this.movePerchedBird(state));
  }

  movePerchedBird(state){
    const bird=state?.sprite;if(!bird?.active||!state.perches?.length)return;
    const nextIndex=(state.index+1)%state.perches.length;
    const next=state.perches[nextIndex];
    const dx=next.x-bird.x;
    bird.play('city-bird-flap',true).setFlipX(dx<0?true:!!next.flipX);
    this.scene.tweens.add({
      targets:bird,x:next.x,y:next.y-10,duration:480,ease:'Sine.easeInOut',
      onUpdate:()=>bird.setDepth((next.depth??this.depth(next.y,.01))+.18),
      onComplete:()=>{
        bird.setPosition(next.x,next.y).setScale(next.scale??bird.scaleX).setDepth(next.depth??this.depth(next.y,.01));
        state.index=nextIndex;
        this.beginPerchedBirdIdle(state,180);
      }
    });
  }

  addBirdHop(bird,index){
    const baseX=bird.x,baseY=bird.y;
    const dx=[5,-6,4,-5][index%4];
    this.scene.tweens.add({
      targets:bird,x:baseX+dx,y:baseY-2,duration:420+index*70,yoyo:true,repeat:-1,repeatDelay:1100+index*300,
      ease:'Sine.easeInOut',onUpdate:()=>bird.setDepth(this.depth(bird.y,.01))
    });
  }

  flyToShoulder(){
    const b=this.shoulderBird;if(!b?.active)return;
    b.play('city-bird-flap',true);b.setFlipX(true);
    this.scene.tweens.add({
      targets:b,x:this.shoulderPerch.x,y:this.shoulderPerch.y,duration:760,ease:'Sine.easeInOut',
      onUpdate:()=>b.setDepth(this.depth(b.y,.08)),
      onComplete:()=>{
        b.stop();b.setFrame(0);b.setDepth(this.depth(this.shoulderPerch.y,.09));
        this.scene.time.delayedCall(2400,()=>this.flyBackToGround());
      }
    });
  }

  flyBackToGround(){
    const b=this.shoulderBird;if(!b?.active)return;
    b.play('city-bird-flap',true);b.setFlipX(false);
    this.scene.tweens.add({
      targets:b,x:this.shoulderGround.x,y:this.shoulderGround.y,duration:820,ease:'Sine.easeInOut',
      onUpdate:()=>b.setDepth(this.depth(b.y,.04)),
      onComplete:()=>{
        b.play('city-bird-peck',true);
        this.scene.time.delayedCall(3100,()=>this.flyToShoulder());
      }
    });
  }
}
