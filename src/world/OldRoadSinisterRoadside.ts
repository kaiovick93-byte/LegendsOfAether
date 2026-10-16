// @ts-nocheck

/** Etapa 2 refeita sobre o Round 27: somente a borda baixa da estrada visual. */
const ROOT='assets/images/environment/outskirts/old-road-ancient-forest/low-roadside/';
export const SINISTER_LOW_ROADSIDE_ASSETS=Object.freeze({
  roots:{key:'sinister_low_twisted_roots',path:ROOT+'raízes_retorcidas_da_floresta_assombrada.png',crop:[4,418,1248,412]},
  leaves:{key:'sinister_ground_leaf_pile_01',path:'assets/images/environment/outskirts/old-road-ancient-forest/generated-ground/sinister_ground_leaf_pile_01.png',crop:[15,36,1207,1195]},
  web:{key:'sinister_low_old_web',path:ROOT+'teia_antiga_entre_galhos_mortos.png',crop:[67,169,1137,931]},
  shrub:{key:'sinister_low_dry_thorn_bush',path:ROOT+'arbusto_espinhoso_ressecadoaco.png',crop:[15,188,1224,895]},
  tangle:{key:'sinister_low_root_thorn_tangle',path:ROOT+'amontoado_de_raízes_e_espinhos_assombrados.png',crop:[9,262,1237,745]}
});

const TEXTURE_KEY='sinister_low_roadside_round31';
// A imagem de estrada mede 128 px de largura (512 × .25). O recuo de 66
// preserva até a margem transparente/gramada do módulo, além do piso de 96 px.
const ROAD_CLEARANCE=66;
const OUTER_LIMIT=184;
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
const smooth=(a,b,v)=>{const t=clamp((v-a)/(b-a),0,1);return t*t*(3-2*t)};
const random=seed=>()=>{
  seed|=0;seed=seed+0x6D2B79F5|0;
  let t=Math.imul(seed^seed>>>15,1|seed);
  t=t+Math.imul(t^t>>>7,61|t)^t;
  return ((t^t>>>14)>>>0)/4294967296;
};

export class OldRoadSinisterRoadside{
  constructor(extension){
    this.extension=extension;
    this.territory=extension.territory;
    this.scene=extension.scene;
    this.entries=[];
    this.segments=[];
    this.length=0;
    // O traçado é lido diretamente dos conectores já aprovados. Não há uma
    // nova estrada, spline substituta, alteração de módulos ou rota lógica.
    const points=extension.visualRoadPath;
    for(let i=1;i<points.length;i++){
      const a=points[i-1],b=points[i],dx=b.x-a.x,dy=b.y-a.y,len=Math.hypot(dx,dy);
      if(len<1)continue;
      this.segments.push({a,b,dx,dy,len,start:this.length});
      this.length+=len;
    }
    if(!this.segments.length)return;
    this.build();
  }

  pointAt(distance){
    const s=clamp(distance,0,this.length);
    const seg=this.segments.find(p=>s<=p.start+p.len)||this.segments.at(-1);
    const t=(s-seg.start)/seg.len;
    return {x:seg.a.x+seg.dx*t,y:seg.a.y+seg.dy*t};
  }

  frameAt(distance){
    const p=this.pointAt(distance),a=this.pointAt(distance-24),b=this.pointAt(distance+24);
    const len=Math.hypot(b.x-a.x,b.y-a.y)||1,tx=(b.x-a.x)/len,ty=(b.y-a.y)/len;
    // A tangente só orienta os recortes; o centro continua na polilinha original.
    let angle=Math.atan2(ty,tx);
    if(angle>Math.PI/2)angle-=Math.PI;
    if(angle<-Math.PI/2)angle+=Math.PI;
    return {...p,nx:-ty,ny:tx,angle};
  }

  add(kind,distance,side,offset,width,alpha,variation,rng){
    const f=this.frameAt(distance),asset=SINISTER_LOW_ROADSIDE_ASSETS[kind];
    const height=width*asset.crop[3]/asset.crop[2];
    this.entries.push({kind,x:f.x+f.nx*side*offset,y:f.y+f.ny*side*offset,
      distance,side,offset,width,height,alpha,rotation:f.angle+(rng()-.5)*variation,
      flipX:rng()>.5});
  }

  compose(){
    const rng=random(310027);
    for(const side of [-1,1]){
      // Camada de folhas ligando os vãos. Somente a faixa junto ao caminho:
      // nenhuma distribuição de props no interior da área escura.
      for(let s=4;s<this.length;s+=31){
        this.add('leaves',s,side,83+5*Math.sin(s/113+side),58+rng()*20,.52,.44,rng);
        this.add('leaves',s+12,side,126+9*Math.sin(s/151+side),73+rng()*25,.70,.48,rng);
      }

      // O corpo é misturado localmente. Não há uma fila de um mesmo sprite
      // cobrindo todas as demais: os encaixes mudam de peça, tamanho e ordem.
      const mix=['roots','tangle','shrub','tangle','roots','shrub','tangle'];
      let ordinal=side>0?3:0;
      for(let s=7;s<this.length;s+=32+rng()*15){
        const kind=mix[ordinal++%mix.length];
        const swelling=9*Math.sin(s/137+side*1.7)+5*Math.sin(s/61+side);
        const width=kind==='roots'?101+rng()*71:kind==='tangle'?91+rng()*42:73+rng()*31;
        this.add(kind,s,side,117+swelling+(rng()-.5)*13,width,.87+rng()*.08,.62,rng);
        const backKind=kind==='roots'||rng()>.5?'shrub':'roots';
        this.add(backKind,s+15,side,143+swelling+(rng()-.5)*11,
          backKind==='roots'?103+rng()*66:67+rng()*25,.78+rng()*.11,.54,rng);
      }

      // Trama fina que fecha os vãos sem repetir a silhueta do amontoado.
      for(let s=21;s<this.length;s+=42+rng()*13){
        const kind=rng()>.55?'roots':'tangle';
        this.add(kind,s,side,103+8*Math.sin(s/79+side),74+rng()*48,.78+rng()*.12,.64,rng);
      }

      // Teias pequenas embutidas no corpo; galhos e folhas recobrem suas bases.
      for(let s=side>0?205:340;s<this.length-90;s+=391)
        this.add('web',s,side,126,43+rng()*9,.64,.20,rng);

      // Borda leve voltada para a estrada, ainda ligada à massa principal.
      for(let s=18;s<this.length;s+=46+rng()*21){
        const kind=rng()>.72?'roots':'leaves';
        this.add(kind,s,side,84+6*Math.sin(s/97+side),kind==='roots'?73+rng()*27:48+rng()*23,
          .52+rng()*.13,.62,rng);
      }
    }
  }

  distanceToRoad(x,y){
    let best=Infinity,along=0;
    for(const seg of this.segments){
      const t=clamp(((x-seg.a.x)*seg.dx+(y-seg.a.y)*seg.dy)/(seg.len*seg.len),0,1);
      const d=(x-seg.a.x-seg.dx*t)**2+(y-seg.a.y-seg.dy*t)**2;
      if(d<best){best=d;along=seg.start+t*seg.len}
    }
    return {distance:Math.sqrt(best),along};
  }

  build(){
    for(const asset of Object.values(SINISTER_LOW_ROADSIDE_ASSETS)){
      if(!this.scene.textures.exists(asset.key))throw new Error('Asset obrigatório ausente: '+asset.path);
    }
    this.compose();
    const points=this.extension.visualRoadPath,pad=OUTER_LIMIT+90;
    const x=Math.floor(Math.min(...points.map(p=>p.x))-pad),y=Math.floor(Math.min(...points.map(p=>p.y))-pad);
    const width=Math.ceil(Math.max(...points.map(p=>p.x))-x+pad);
    const height=Math.ceil(Math.max(...points.map(p=>p.y))-y+pad);
    const texture=this.scene.textures.createCanvas(TEXTURE_KEY,width,height);
    const ctx=texture.getContext();
    // A composição é consolidada uma vez. Só os cinco PNGs autorizados são
    // desenhados; nenhum preenchimento, sombra pintada ou asset complementar.
    const entries=[...this.entries].sort((a,b)=>(a.kind==='leaves'?0:1)-(b.kind==='leaves'?0:1)||a.y-b.y);
    for(const entry of entries){
      const asset=SINISTER_LOW_ROADSIDE_ASSETS[entry.kind];
      ctx.save();ctx.translate(entry.x-x,entry.y-y);ctx.rotate(entry.rotation);
      ctx.scale(entry.flipX?-1:1,1);ctx.globalAlpha=entry.alpha;
      ctx.drawImage(this.scene.textures.get(asset.key).getSourceImage(),...asset.crop,
        -entry.width/2,-entry.height/2,entry.width,entry.height);
      ctx.restore();
    }

    // Limite por pixel, não apenas pelo pivô: protege a estrada inteira e a
    // floresta verde. Usa exclusivamente a cobertura congelada do Round 27.
    const pixels=ctx.getImageData(0,0,width,height),data=pixels.data;
    let visiblePixels=0,minDistance=Infinity,maxDistance=0;
    for(let py=0;py<height;py++)for(let px=0;px<width;px++){
      const i=(py*width+px)*4+3;
      if(!data[i])continue;
      const wx=x+px+.5,wy=y+py+.5,p=this.territory.screenToLogical(wx,wy);
      const nearest=this.distanceToRoad(wx,wy);
      const edge=smooth(ROAD_CLEARANCE,ROAD_CLEARANCE+13,nearest.distance)
        *(1-smooth(OUTER_LIMIT-22,OUTER_LIMIT,nearest.distance))
        *smooth(0,50,nearest.along)*(1-smooth(this.length-42,this.length,nearest.along));
      data[i]=this.extension.isInsideApprovedCoverage(p.u,p.v)?Math.round(data[i]*edge):0;
      if(data[i]){visiblePixels++;minDistance=Math.min(minDistance,nearest.distance);maxDistance=Math.max(maxDistance,nearest.distance)}
    }
    ctx.putImageData(pixels,0,0);texture.refresh();
    this.texture=texture;
    this.image=this.scene.add.image(x,y,TEXTURE_KEY).setOrigin(0,0).setDepth(this.territory.groundDepth(-69.9));
    this.summary={version:'v0.3.1-round31-stage2-from-round27',visualOnly:true,collision:false,
      assets:Object.values(SINISTER_LOW_ROADSIDE_ASSETS).map(a=>a.path),
      count:this.entries.length,webCount:this.entries.filter(e=>e.kind==='web').length,
      roadClearancePx:ROAD_CLEARANCE,outerLimitPx:OUTER_LIMIT,visiblePixels,minDistance,maxDistance,
      path:points.map(p=>({...p})),stage1Unchanged:true,stage3Started:false};
    this.image.setData('sinisterLowRoadside',this.summary);
    this.scene.registry.set('sinisterLowRoadside',this.summary);
  }

  destroy(){
    this.image?.destroy();
    if(this.texture)this.scene.textures.remove(TEXTURE_KEY);
    this.scene.registry.remove('sinisterLowRoadside');
    this.entries=[];
  }
}
