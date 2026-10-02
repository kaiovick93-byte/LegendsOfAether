// @ts-nocheck

/**
 * Round 80 — Floresta Antiga integrada à lateral da Estrada Velha.
 *
 * Escopo fechado:
 * - usa apenas assets já carregados pelo projeto;
 * - não altera estrada, prólogo, âncoras, luz, NPCs, HUD ou câmera;
 * - cria uma barreira visual + física somente no lado esquerdo/norte da estrada;
 * - abre o contorno perto dos corpos e da carroça para preservar toda a cena do prólogo.
 */

const FOREST_START=.055;
const FOREST_END=.645;

// O contorno acompanha a marcação vermelha: perto da placa ele começa atrás
// da lanterna; no trecho do monumento recua; na clareira de sangue/carroça
// abre bastante para não bloquear nenhum objetivo narrativo.
const FRONT_PROFILE=[
  [.055,132],
  [.080,124],
  [.120,112],
  [.180,106],
  [.250,114],
  [.330,142],
  [.400,158],
  [.480,180],
  [.540,224],
  [.570,266],
  [.610,346],
  [.645,304]
];

const STATIONS=[
  .060,.085,.112,.140,.170,.200,.230,.260,.290,.318,
  .345,.372,.400,.428,.456,.484,.512,.540,.566,.590,.612,.634
];

const FRONT_ASSETS=[
  ['riverbank_fern_clearing_01',.104,.90],
  ['old_road_escarpment_bush_01',.38,.88],
  ['riverbank_mossy_clearing_01',.094,.90],
  ['old_road_escarpment_bush_02',.42,.88],
  ['old_road_escarpment_roots_01',.34,.91],
  ['riverbank_rock_outcrop_01',.088,.91]
];

const MID_ASSETS=[
  ['city_tree',.56,.95],
  ['ancient_riverbank_tree_01',.115,.975],
  ['city_tree',.64,.95],
  ['ancient_riverbank_tree_01',.132,.975],
  ['city_tree',.59,.95]
];

const BACK_ASSETS=[
  ['ancient_riverbank_tree_01',.145,.975],
  ['city_tree',.72,.95],
  ['ancient_riverbank_tree_01',.158,.975],
  ['city_tree',.80,.95],
  ['ancient_riverbank_tree_01',.138,.975]
];

const ACCENTS=[
  [.075,'riverbank_mossy_clearing_01',.090,.90,20],
  [.120,'riverbank_fallen_ancient_log_01',.112,.80,25],
  [.185,'old_road_log_fallen_moss_01',.42,.88,18],
  [.245,'riverbank_rock_outcrop_01',.088,.91,24],
  [.305,'riverbank_fallen_ancient_log_01',.108,.80,31],
  [.350,'old_road_stump_moss_01',.50,.91,21],
  [.405,'riverbank_mossy_clearing_01',.090,.90,22],
  [.455,'old_road_escarpment_roots_01',.40,.91,22],
  [.520,'riverbank_fallen_ancient_log_01',.105,.80,30],
  [.565,'riverbank_rock_outcrop_01',.090,.91,26],
  [.610,'old_road_escarpment_roots_01',.38,.91,24],
  [.635,'riverbank_fern_clearing_01',.100,.90,18]
];

const clamp=(value,min,max)=>Math.max(min,Math.min(max,value));

export class OldRoadAncientForest{
  constructor(territory){
    this.territory=territory;
    this.scene=territory.scene;
    this.pieces=[];
    this.segments=[];
    this.length=0;

    // Reutiliza exatamente a rota já aprovada da Estrada Velha. Nenhuma peça
    // da estrada é reposicionada e nenhum novo caminho técnico é criado.
    const guide=territory.oldRoadEscarpment?.route??[];
    for(let i=1;i<guide.length;i++){
      const a=guide[i-1],b=guide[i];
      const dx=b.x-a.x,dy=b.y-a.y,length=Math.hypot(dx,dy);
      if(length<=0)continue;
      this.segments.push({a,b,dx:dx/length,dy:dy/length,length,start:this.length});
      this.length+=length;
    }

    if(!this.segments.length)return;

    this.buildForest();
    this.scene.registry.set('oldRoadAncientForest',{
      version:'round80-v1',
      side:'left-towards-city',
      startFraction:FOREST_START,endFraction:FOREST_END,
      collision:'continuous-visible-front-profile',
      preserves:['old-road','start-sign','start-lantern','ruined-waystone','blood-scene','attacked-wagon','prologue-triggers'],
      pieces:this.pieces.map(({sprite,...item})=>item)
    });
  }

  frontOffset(fraction){
    if(fraction<=FRONT_PROFILE[0][0])return FRONT_PROFILE[0][1];
    for(let i=1;i<FRONT_PROFILE.length;i++){
      const [f1,o1]=FRONT_PROFILE[i];
      const [f0,o0]=FRONT_PROFILE[i-1];
      if(fraction<=f1){
        const t=clamp((fraction-f0)/(f1-f0||1),0,1);
        return Phaser.Math.Linear(o0,o1,t);
      }
    }
    return FRONT_PROFILE.at(-1)[1];
  }

  roadPoint(fraction){
    const distance=clamp(fraction,0,1)*this.length;
    const segment=this.segments.find(s=>distance<=s.start+s.length)??this.segments.at(-1);
    const local=distance-segment.start;
    return {
      x:segment.a.x+segment.dx*local,
      y:segment.a.y+segment.dy*local,
      dx:segment.dx,dy:segment.dy
    };
  }

  shoulderPoint(fraction,offset){
    const p=this.roadPoint(fraction);
    // Mesma normal esquerda usada pelos props já aprovados da Estrada Velha.
    return {x:p.x+p.dy*offset,y:p.y-p.dx*offset};
  }

  deterministicJitter(index,salt,amplitude){
    return Math.sin((index+1)*12.9898+salt*78.233)*amplitude;
  }

  buildForest(){
    STATIONS.forEach((fraction,index)=>{
      const front=this.frontOffset(fraction);

      // Faixa frontal: vegetação/rochas/raízes baixas. Ela comunica a colisão
      // sem criar uma parede reta de troncos e sem esconder a estrada.
      const frontSpec=FRONT_ASSETS[index%FRONT_ASSETS.length];
      this.placeAt(
        fraction+this.deterministicJitter(index,1,.004),
        front+20+this.deterministicJitter(index,2,12),
        frontSpec[0],frontSpec[1]*(1+this.deterministicJitter(index,3,.08)),frontSpec[2],
        {role:'forest-front',flipX:index%2===1,rotation:this.deterministicJitter(index,4,.035)}
      );

      // Segunda camada: árvores médias, sempre atrás do limite físico.
      const midSpec=MID_ASSETS[index%MID_ASSETS.length];
      this.placeAt(
        fraction+this.deterministicJitter(index,5,.006),
        front+122+this.deterministicJitter(index,6,22),
        midSpec[0],midSpec[1]*(1+this.deterministicJitter(index,7,.07)),midSpec[2],
        {role:'forest-mid',flipX:index%3===1,rotation:this.deterministicJitter(index,8,.02)}
      );

      // Fundo: copas grandes e antigas. O recuo extra evita que a copa roube
      // leitura da placa, monumento, corpos ou carroça.
      const backSpec=BACK_ASSETS[index%BACK_ASSETS.length];
      this.placeAt(
        fraction+this.deterministicJitter(index,9,.007),
        front+208+this.deterministicJitter(index,10,28),
        backSpec[0],backSpec[1]*(1+this.deterministicJitter(index,11,.08)),backSpec[2],
        {role:'forest-back',flipX:index%2===0,rotation:this.deterministicJitter(index,12,.018)}
      );

      // Uma quarta camada alternada preenche a faixa até o limite do mapa sem
      // criar uma grade regular. Se cair fora do território, placeAt descarta.
      if(index%2===0){
        const farSpec=BACK_ASSETS[(index+2)%BACK_ASSETS.length];
        this.placeAt(
          fraction+this.deterministicJitter(index,13,.008),
          front+296+this.deterministicJitter(index,14,34),
          farSpec[0],farSpec[1]*.92*(1+this.deterministicJitter(index,15,.08)),farSpec[2],
          {role:'forest-deep',flipX:index%4===0,rotation:this.deterministicJitter(index,16,.018)}
        );
      }
    });

    // Troncos, raízes e rochas quebram a leitura repetitiva das árvores e
    // tornam o bloqueio visualmente plausível em pontos específicos.
    ACCENTS.forEach(([fraction,key,scale,originY,extra],index)=>{
      const front=this.frontOffset(fraction);
      this.placeAt(fraction,front+extra,key,scale,originY,{
        role:'forest-accent',flipX:index%2===0,
        rotation:this.deterministicJitter(index,21,.07)
      });
    });
  }

  placeAt(fraction,offset,key,scale,originY,options={}){
    if(!this.scene.textures.exists(key))return null;
    const point=this.shoulderPoint(fraction,offset);
    const logical=this.territory.screenToLogical(point.x,point.y);
    const bounds={minU:0,minV:-14,maxU:82,maxV:82};
    // Centro/base sempre dentro do terreno; a máscara compartilhada corta
    // eventuais copas que ultrapassem a borda visual do losango.
    if(logical.u<bounds.minU-.15||logical.v<bounds.minV-.15||logical.u>bounds.maxU+.15||logical.v>bounds.maxV+.15)return null;

    const sprite=this.scene.add.image(point.x,point.y,key)
      .setOrigin(.5,originY)
      .setScale(scale)
      .setFlipX(!!options.flipX)
      .setRotation(options.rotation??0)
      .setDepth(this.territory.depthAt(logical.u,logical.v,.065));

    const terrainMask=this.territory.groundSurface?.mask;
    if(terrainMask)sprite.setMask(terrainMask);

    sprite.setData('oldRoadAncientForest',{
      fraction,offset,role:options.role??'forest',permanent:true,functional:false
    });
    this.territory.track(sprite,logical.u,logical.v,{visibleRadius:35,activeRadius:39});

    const stored={key,fraction,offset,x:point.x,y:point.y,u:logical.u,v:logical.v,
      scale,originY,flipX:!!options.flipX,rotation:options.rotation??0,role:options.role??'forest',sprite};
    this.pieces.push(stored);
    return stored;
  }

  nearestRoadState(x,y){
    let best=null;
    for(const segment of this.segments){
      const vx=x-segment.a.x,vy=y-segment.a.y;
      const along=clamp(vx*segment.dx+vy*segment.dy,0,segment.length);
      const px=segment.a.x+segment.dx*along;
      const py=segment.a.y+segment.dy*along;
      const ex=x-px,ey=y-py;
      const distanceSquared=ex*ex+ey*ey;
      if(best&&distanceSquared>=best.distanceSquared)continue;
      // left normal = (dy,-dx), idêntica à usada no posicionamento visual.
      const lateral=ex*segment.dy-ey*segment.dx;
      best={
        distanceSquared,lateral,
        fraction:(segment.start+along)/this.length
      };
    }
    return best;
  }

  isBlocked(u,v,radius=.27){
    const p=this.territory.project(u,v);
    const state=this.nearestRoadState(p.x,p.y);
    if(!state||state.fraction<FOREST_START||state.fraction>FOREST_END)return false;

    const front=this.frontOffset(state.fraction);
    // Pequena margem equivalente aos pés do personagem. A barreira só começa
    // onde já existe vegetação/rocha visível; estrada e clareiras ficam livres.
    const playerMargin=Math.max(5,radius*28);
    return state.lateral+playerMargin>=front;
  }

  destroy(){
    for(const piece of this.pieces)piece.sprite?.destroy?.();
    this.pieces.length=0;
  }
}
