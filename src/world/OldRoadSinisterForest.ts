// @ts-nocheck
import {SINISTER_LOW_ROADSIDE_ASSETS} from './OldRoadSinisterRoadside';
import {OldRoadSinisterForestComposition} from './OldRoadSinisterForestComposition';

/** v0.3.2-round01: arte ancestral; composição do Round 34 retida SÓ como dados dos emissores do Round 39. */
const ROOT='assets/images/environment/outskirts/old-road-ancient-forest/';
const LEGACY_FOG_FOOTPRINTS=Object.freeze({
  wall:{key:'sinister_forest_wall',path:ROOT+'sinister-forest/muralha_de_floresta_assombrada.png',crop:[0,0,1122,1402]},
  hero:{key:'sinister_forest_hero',path:ROOT+'sinister-forest/árvore_ancestral_na_floresta_assombrada.png',crop:[0,0,1122,1402]},
  mistWeb:{key:'sinister_forest_mist_web',path:ROOT+'sinister-forest/teia_nebulosa_em_galhos_retorcidos.png',crop:[0,0,1254,1254]},
  decay:{key:'sinister_forest_decay',path:ROOT+'sinister-forest/mata_decomposta_com_raízes_e_cogumelos.png',crop:[0,0,1254,1254]}
});
// Apenas dimensões históricas: nenhuma destas imagens antigas é desenhada.
const ART={...SINISTER_LOW_ROADSIDE_ASSETS,...LEGACY_FOG_FOOTPRINTS,
  debris:{key:'sinister_ground_debris_01',path:ROOT+'generated-ground/sinister_ground_debris_01.png',crop:[0,0,1254,1254]}};
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
const random=seed=>()=>{seed|=0;seed=seed+0x6D2B79F5|0;let t=Math.imul(seed^seed>>>15,1|seed);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296};

export class OldRoadSinisterForest{
  constructor(extension){
    this.extension=extension;this.territory=extension.territory;this.scene=extension.scene;
    this.entries=[];this.images=[];this.textureKeys=[];this.segments=[];this.length=0;
    const path=extension.visualRoadPath;
    for(let i=1;i<path.length;i++){
      const a=path[i-1],b=path[i],dx=b.x-a.x,dy=b.y-a.y,len=Math.hypot(dx,dy);
      this.segments.push({a,b,dx,dy,len,start:this.length});this.length+=len;
    }
    if(!this.length)return;
    // Manter a sequência e a ordenação históricas conserva os 52 emissores.
    this.compose();this.bake();
  }

  frameAt(distance){
    const s=clamp(distance,0,this.length),seg=this.segments.find(p=>s<=p.start+p.len)||this.segments.at(-1);
    const t=(s-seg.start)/seg.len;
    return{x:seg.a.x+seg.dx*t,y:seg.a.y+seg.dy*t,nx:-seg.dy/seg.len,ny:seg.dx/seg.len,
      angle:Math.atan2(seg.dy,seg.dx)+Math.PI};
  }

  nearest(x,y){
    let best=Infinity,side=1;
    for(const seg of this.segments){
      const t=clamp(((x-seg.a.x)*seg.dx+(y-seg.a.y)*seg.dy)/(seg.len*seg.len),0,1);
      const dx=x-seg.a.x-seg.dx*t,dy=y-seg.a.y-seg.dy*t,d=dx*dx+dy*dy;
      if(d<best){best=d;side=Math.sign(seg.dx*dy-seg.dy*dx)||1;}
    }
    return{distance:Math.sqrt(best),side};
  }

  add(kind,x,y,width,{rotation=0,flipX=false,alpha=1,originY=.5,layer=1}={}){
    const p=this.territory.screenToLogical(x,y);
    if(!this.extension.isInsideApprovedCoverage(p.u,p.v))return;
    const art=ART[kind],height=width*art.crop[3]/art.crop[2];
    this.entries.push({kind,x,y,width,height,rotation,flipX,alpha,originY,layer,
      radius:Math.hypot(width,height)});
  }

  atRoad(kind,s,side,offset,width,options={}){
    const f=this.frameAt(s);
    this.add(kind,f.x+f.nx*side*offset,f.y+f.ny*side*offset,width,options);
  }

  compose(){
    const rng=random(340033),t=this.territory;
    // Muralhas largas e interpenetradas: a cobertura é contínua, sem uma
    // grade de árvores individuais. Os espaçamentos são menores que a arte.
    let row=0;
    for(let v=49.5;v<101;v+=4.1+(row%3)*.41,row++){
      let col=0;
      for(let u=-55.5+(row%2)*1.7;u<9;u+=3.8+(col%4)*.48,col++){
        const p=t.project(u+.55*Math.sin(row*2.7+col),v+.48*Math.sin(col*1.7+row));
        if(this.nearest(p.x,p.y).distance<165)continue;
        this.add('wall',p.x,p.y,430+rng()*150,{originY:.95,rotation:(rng()-.5)*.075,flipX:rng()>.5,layer:1});
      }
    }

    // Árvores principais em profundidades diferentes, sempre ligadas à
    // muralha. As bases pertencem ao mesmo polígono aprovado do terreno.
    const heroes=[
      [-8.0,73.0,495,false],[-17.2,69.8,555,true],[-28.1,65.9,510,false],
      [-39.5,61.7,575,true],[-49.8,58.2,505,false],[-12.3,57.4,520,true],
      [-26.8,54.0,490,false],[-42.0,51.0,540,true],[-28.6,81.2,520,true],
      [-40.4,86.1,570,false],[-49.1,93.2,505,true],[-19.8,94.1,485,false],
      [-8.3,96.5,450,true],[3.4,94.4,355,false]
    ];
    for(const [u,v,width,flipX] of heroes){const p=t.project(u,v);this.add('hero',p.x,p.y,width,{originY:.95,flipX,rotation:(rng()-.5)*.06,layer:1});}
    for(const [s,offset,width,flip] of [[130,175,420,false],[440,170,450,true],[770,185,475,false],[1010,190,440,true]])
      this.atRoad('hero',s,1,offset,width,{originY:.95,flipX:flip,rotation:(rng()-.5)*.05,layer:2});
    for(const [s,offset,width,flip] of [[200,480,260,true],[520,510,330,false],[850,540,370,true]])
      this.atRoad('hero',s,-1,offset,width,{originY:.95,flipX:flip,rotation:(rng()-.5)*.05,layer:2});

    // Costura entre a massa alta e a margem: raízes e espinhos se misturam
    // por sobreposição; folhas menores fecham as bases e os espaços internos.
    for(const side of [-1,1]){
      for(let s=0;s<=this.length+40;s+=37+rng()*18){
        const f=this.frameAt(s),wave=12*Math.sin(s/111+side)+7*Math.sin(s/43);
        this.atRoad('leaves',s,side,96+wave,69+rng()*31,{rotation:f.angle+(rng()-.5)*.3,flipX:rng()>.5,layer:3});
        this.atRoad('debris',s+13,side,146+wave,85+rng()*40,{rotation:f.angle+(rng()-.5)*.25,flipX:rng()>.5,layer:3});
        this.atRoad('tangle',s,side,182+wave,174+rng()*67,{rotation:f.angle+(rng()-.5)*.16,flipX:rng()>.5,layer:3});
        this.atRoad('shrub',s+8,side,105+wave,92+rng()*39,{rotation:(rng()-.5)*.14,flipX:rng()>.5,originY:.62,layer:5});
        const front=rng()>.5?'tangle':'shrub';
        this.atRoad(front,s+22,side,144+wave+(rng()-.5)*28,front==='tangle'?120+rng()*48:105+rng()*40,{rotation:(rng()-.5)*.2,flipX:rng()>.5,layer:5});
      }
      for(let s=side>0?54:123;s<this.length;s+=153+rng()*87){
        const f=this.frameAt(s);
        this.atRoad('roots',s,side,170+27*Math.sin(s/137+side),195+rng()*95,{rotation:f.angle+(rng()-.5)*.16,flipX:rng()>.5,layer:4});
      }
    }
    // Teias presas à massa, em grupos assimétricos. Sem névoa ou luz nova.
    for(const [s,side,offset,width] of [[160,1,257,150],[512,1,246,186],[875,1,268,165],[225,-1,235,135],[670,-1,274,164],[1010,-1,225,145]])
      this.atRoad('web',s,side,offset,width,{rotation:(rng()-.5)*.12,flipX:rng()>.5,layer:6});
    for(const [s,side,offset,width] of [[320,1,325,208],[940,1,360,223],[490,-1,345,195]])
      this.atRoad('mistWeb',s,side,offset,width,{rotation:(rng()-.5)*.1,flipX:rng()>.5,layer:6});
    for(const [s,side,offset,width] of [[285,1,209,120],[800,-1,255,110]])
      this.atRoad('decay',s,side,offset,width,{flipX:side<0,layer:4});
    this.entries.sort((a,b)=>a.layer-b.layer||a.y-b.y);
  }

  bake(){
    this.composition=new OldRoadSinisterForestComposition(this);
    this.images=this.composition.images;
    this.textureKeys=this.composition.textureKeys;
    this.renderEntries=this.composition.entries;
    this.summary={...this.composition.summary,fogAnchorsPreserved:true};
    this.scene.registry.set('sinisterForestMass',this.summary);
  }

  destroy(){
    this.composition?.destroy();
    this.scene.registry.remove('sinisterForestMass');
    this.entries=[];this.renderEntries=[];this.images=[];this.textureKeys=[];
  }
}
