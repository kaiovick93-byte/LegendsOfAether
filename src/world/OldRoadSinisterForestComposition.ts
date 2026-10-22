// @ts-nocheck
import {OLD_ROAD_ANCIENT_FOREST_ASSETS as ART} from './OldRoadAncientForest';

const TILE_SIZE=1024;
const ROAD_CLEARANCE=66;
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
const smooth=(a,b,v)=>{const t=clamp((v-a)/(b-a),0,1);return t*t*(3-2*t)};
const random=seed=>()=>{seed|=0;seed=seed+0x6D2B79F5|0;let t=Math.imul(seed^seed>>>15,1|seed);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296};

// Capturado da montagem efetiva da Ancestral no Round 39. A Ancestral
// é criada depois da extensão; esta tabela preserva suas 100 peças sem mudar
// a ordem de inicialização, os sprites ou os emissores existentes.
const ANCESTRAL_TEMPLATES=Object.freeze([
  ["floor01",0.78,false,-0.07000000000000028,0.72],
  ["thorn01",0.8150000000000001,true,-0.03500000000000014,0.72],
  ["floor02",0.8500000000000001,false,0,0.72],
  ["thorn02",0.885,true,0.03500000000000014,0.72],
  ["under03",0.78,false,0.07000000000000028,0.72],
  ["floor03",0.8150000000000001,true,-0.07000000000000028,0.72],
  ["thorn03",0.8500000000000001,false,-0.03500000000000014,0.72],
  ["floor04",0.885,true,0,0.72],
  ["thorn04",0.78,false,0.03500000000000014,0.72],
  ["floor05",0.8150000000000001,true,0.07000000000000028,0.72],
  ["thorn05",0.8500000000000001,false,-0.07000000000000028,0.72],
  ["floor06",0.885,true,-0.03500000000000014,0.72],
  ["thorn06",0.78,false,0,0.72],
  ["floor07",0.8150000000000001,true,0.03500000000000014,0.72],
  ["thorn07",0.8500000000000001,false,0.07000000000000028,0.72],
  ["floor08",0.885,true,-0.07000000000000028,0.72],
  ["thorn08",0.78,false,-0.03500000000000014,0.72],
  ["floor01",0.8150000000000001,true,0,0.72],
  ["under01",0.8500000000000001,false,0.03500000000000014,0.72],
  ["floor02",0.885,true,0.07000000000000028,0.72],
  ["thorn02",0.78,false,-0.07000000000000028,0.72],
  ["floor03",0.8150000000000001,true,-0.03500000000000014,0.72],
  ["under02",0.8500000000000001,false,0,0.72],
  ["floor04",0.885,true,0.03500000000000014,0.72],
  ["thorn04",0.78,false,0.07000000000000028,0.72],
  ["floor05",0.8150000000000001,true,-0.07000000000000028,0.72],
  ["thorn06",0.8500000000000001,false,-0.03500000000000014,0.72],
  ["floor07",0.885,true,0,0.72],
  ["root01",0.86,false,0,0.8878504672897196],
  ["log01",0.77,true,0,0.9069767441860465],
  ["stump01",0.82,false,0,0.9263803680981595],
  ["root02",0.88,true,0,0.8878504672897196],
  ["log02",0.75,false,0,0.9069767441860465],
  ["root03",0.84,false,0,0.8878504672897196],
  ["wall01",0.86,false,0,0.9245283018867925],
  ["wall02",0.84,true,0,0.9259259259259259],
  ["log03",0.76,true,0,0.9069767441860465],
  ["root04",0.88,false,0,0.8857142857142857],
  ["stump02",0.84,true,0,0.9254658385093167],
  ["root05",0.86,true,0,0.8878504672897196],
  ["log04",0.74,false,0,0.9008264462809917],
  ["root06",0.88,false,0,0.8878504672897196],
  ["wall03",0.84,false,0,0.925],
  ["stump03",0.82,false,0,0.9254658385093167],
  ["log05",0.76,true,0,0.9069767441860465],
  ["under01",0.82,false,0,0.922077922077922],
  ["under02",0.8,true,0,0.9205298013245033],
  ["large01",0.94,false,0,0.9669421487603306],
  ["medium01",0.92,true,0,0.9558823529411765],
  ["large02",0.88,true,0,0.963855421686747],
  ["dead01",0.92,false,0,0.9512195121951219],
  ["large03",0.96,false,0,0.9672131147540983],
  ["medium02",0.9,false,0,0.9565217391304348],
  ["large04",0.9,true,0,0.9672131147540983],
  ["dead02",0.88,true,0,0.9512195121951219],
  ["large05",0.93,false,0,0.9662921348314607],
  ["medium03",0.94,true,0,0.9553903345724907],
  ["large06",0.89,true,0,0.9653179190751445],
  ["dead03",0.9,false,0,0.950207468879668],
  ["medium04",0.96,false,0,0.9553903345724907],
  ["large01",0.87,true,0,0.9669421487603306],
  ["large02",0.91,false,0,0.963855421686747],
  ["medium01",0.89,false,0,0.9558823529411765],
  ["large03",0.92,true,0,0.9672131147540983],
  ["dead01",0.86,true,0,0.9512195121951219],
  ["large04",0.95,false,0,0.9672131147540983],
  ["medium02",0.91,true,0,0.9565217391304348],
  ["large05",0.88,true,0,0.9662921348314607],
  ["dead02",0.89,false,0,0.9512195121951219],
  ["large06",0.93,false,0,0.9653179190751445],
  ["medium03",0.9,false,0,0.9553903345724907],
  ["large01",0.86,false,0,0.9669421487603306],
  ["medium04",0.93,true,0,0.9553903345724907],
  ["thorn07",0.86,false,-0.03999999999999915,0.72],
  ["thorn05",0.84,true,0.02999999999999936,0.72],
  ["thorn08",0.87,false,0,0.72],
  ["under03",0.82,true,0.05000000000000071,0.72],
  ["thorn06",0.86,true,-0.019999999999999574,0.72],
  ["under01",0.84,false,0.019999999999999574,0.72],
  ["thorn07",0.88,false,0.03999999999999915,0.72],
  ["under02",0.82,true,-0.02999999999999936,0.72],
  ["thorn08",0.86,true,0.02999999999999936,0.72],
  ["wall01",0.9,false,0,0.9245283018867925],
  ["root03",0.88,true,0,0.8878504672897196],
  ["wall02",0.87,true,0,0.9259259259259259],
  ["log04",0.78,false,0,0.9008264462809917],
  ["root06",0.9,false,0,0.8878504672897196],
  ["wall03",0.86,false,0,0.925],
  ["root02",0.88,true,0,0.8878504672897196],
  ["wall01",0.88,false,0,0.9245283018867925],
  ["large05",0.98,false,0,0.9662921348314607],
  ["dead03",0.96,true,0,0.950207468879668],
  ["large06",0.95,false,0,0.9653179190751445],
  ["dead02",0.93,true,0,0.9512195121951219],
  ["large03",0.97,false,0,0.9672131147540983],
  ["dead01",0.95,true,0,0.9512195121951219],
  ["large01",0.98,false,0,0.9669421487603306],
  ["dead03",0.96,true,0,0.950207468879668],
  ["large04",0.99,false,0,0.9672131147540983],
  ["dead02",0.95,true,0,0.9512195121951219]
]);

/**
 * v0.3.2-round01: montagem da Sinistra com as imagens originais da Ancestral.
 * Não cria/recolore arquivos de arte. Os canvases são apenas lotes de desenho
 * dos PNGs existentes, com escala uniforme e ordenação pela base de cada peça.
 * O polígono e a estrada são consultados; nenhum dado espacial é modificado.
 */
export class OldRoadSinisterForestComposition{
  constructor(forest){
    this.forest=forest;
    this.extension=forest.extension;
    this.territory=forest.territory;
    this.scene=forest.scene;
    this.entries=[];
    this.images=[];
    this.groundImages=[];
    this.textureKeys=[];
    this.samples=new Map();
    this.templates=ANCESTRAL_TEMPLATES.map(([name,scale,flipX,rotation,originY])=>({
      name,scale,flipX,rotation,originY,category:ART[name].category
    }));
    for(const template of this.templates)
      if(!this.scene.textures.exists(ART[template.name].key))
        throw new Error('Asset ancestral obrigatório ausente: '+ART[template.name].path);
    this.compose();
    this.bake();
  }

  add(template,u,v,{ground=false,fit=false}={}){
    if(!this.extension.isInsideApprovedCoverage(u,v))return false;
    const art=ART[template.name],source=this.scene.textures.get(art.key).getSourceImage();
    const p=this.territory.project(u,v),scale=template.scale;
    const entry={...template,u,v,x:p.x,y:p.y,width:source.width*scale,
      height:source.height*scale,ground,rotation:ground?template.rotation:0,
      radius:Math.hypot(source.width,source.height)*scale};
    // Árvores inteiras recuam da estrada: não serrar copas para abrir o caminho.
    // A verificação por alfa considera a silhueta real, não só o pivô.
    if(fit&&!this.fitsSilhouette(entry,source))return false;
    this.entries.push(entry);
    return true;
  }

  fitsSilhouette(entry,source){
    let samples=this.samples.get(entry.name);
    if(!samples){
      const canvas=document.createElement('canvas');
      canvas.width=source.width;canvas.height=source.height;
      const ctx=canvas.getContext('2d',{willReadFrequently:true});
      ctx.drawImage(source,0,0);
      const data=ctx.getImageData(0,0,source.width,source.height).data;
      samples=[];
      for(let y=12;y<source.height-12;y+=10)for(let x=12;x<source.width-12;x+=10)
        if(data[(y*source.width+x)*4+3]>24)samples.push({x,y});
      this.samples.set(entry.name,samples);
    }
    let outside=0;
    for(const sample of samples){
      const x=entry.x+(sample.x-source.width*.5)*entry.scale*(entry.flipX?-1:1);
      const y=entry.y+(sample.y-source.height*entry.originY)*entry.scale;
      if(this.forest.nearest(x,y).distance<ROAD_CLEARANCE+9)return false;
      const p=this.territory.screenToLogical(x,y);
      if(!this.extension.isInsideApprovedCoverage(p.u,p.v))outside++;
    }
    // A máscara final continua exata; tolera somente folhas de ponta na borda.
    return outside<=samples.length*.015;
  }

  compose(){
    const rng=random(320139),t=this.territory;
    const floors=this.templates.filter(a=>a.name.startsWith('floor'));
    const trees=this.templates.filter(a=>a.category==='tree');
    const medium=trees.filter(a=>a.name.startsWith('medium'));
    const structures=this.templates.filter(a=>a.category==='structure');
    const undergrowth=this.templates.filter(a=>a.category==='ground'&&!a.name.startsWith('floor'));
    // O desenho aprovado é sempre a máscara de inclusão. Esta distribuição
    // apenas compõe o interior; não define nem aproxima nenhuma borda do mapa.
    let row=0,index=0;
    for(let v=49.25;v<100;v+=1.45,row++){
      for(let u=-55.7+(row%2)*.72;u<9.24;u+=1.48){
        const uu=u+(rng()-.5)*.50,vv=v+(rng()-.5)*.46;
        this.add(floors[index++%floors.length],uu,vv,{ground:true});
      }
    }
    row=0;index=0;
    for(let v=49.8;v<100;v+=1.84,row++){
      for(let u=-55.5+(row%2)*.92;u<9.24;u+=1.96){
        const uu=u+(rng()-.5)*.78,vv=v+(rng()-.5)*.72;
        const template=trees[(index++*11+row*3)%trees.length];
        if(!this.add(template,uu,vv,{fit:true}))
          this.add(medium[(index+row)%medium.length],uu,vv,{fit:true});
      }
    }
    row=0;index=0;
    for(let v=49.7;v<100;v+=2.05,row++){
      for(let u=-55.4+(row%2)*.83;u<9.24;u+=2.28){
        const uu=u+(rng()-.5)*.90,vv=v+(rng()-.5)*.84;
        const p=t.project(uu,vv);
        if(this.forest.nearest(p.x,p.y).distance<88)continue;
        this.add(structures[(index++*7+row)%structures.length],uu,vv);
        this.add(undergrowth[(index*5+row)%undergrowth.length],uu+.52,vv+.35,{ground:true});
      }
    }
    // Margem contínua feita de tocos, raízes, espinhos e vegetação DO MESMO KIT.
    // As peças usam as escalas já aprovadas, sem rotação de árvores ou stretch.
    for(const side of [-1,1]){
      let n=0;
      for(let s=8;s<this.forest.length;s+=42+(n%3)*9,n++){
        const f=this.forest.frameAt(s);
        const offset=112+14*Math.sin(s/127+side);
        const p=t.screenToLogical(f.x+f.nx*side*offset,f.y+f.ny*side*offset);
        const template=undergrowth[(n*5+(side>0?2:0))%undergrowth.length];
        this.add(template,p.u,p.v,{ground:true});
        if(n%2===0){
          const q=t.screenToLogical(f.x+f.nx*side*(offset+50),f.y+f.ny*side*(offset+50));
          this.add(structures[(n*3+2)%structures.length],q.u,q.v);
        }
      }
    }
    // Solo abaixo; árvores, troncos e tocos compartilham a ordenação pelos pés.
    this.entries.sort((a,b)=>Number(b.ground)-Number(a.ground)||a.y-b.y||a.x-b.x);
  }

  draw(ctx,entry,x,y){
    const source=this.scene.textures.get(ART[entry.name].key).getSourceImage();
    ctx.save();ctx.translate(entry.x-x,entry.y-y);
    ctx.rotate(entry.rotation);ctx.scale(entry.flipX?-1:1,1);
    ctx.drawImage(source,-entry.width*.5,-entry.height*entry.originY,entry.width,entry.height);
    ctx.restore();
  }

  bake(){
    const e=this.extension,t=this.territory,points=e.coverageWorldPolygons.flat();
    const minX=Math.floor(Math.min(...points.map(p=>p.x))),minY=Math.floor(Math.min(...points.map(p=>p.y)));
    const maxX=Math.ceil(Math.max(...points.map(p=>p.x))),maxY=Math.ceil(Math.max(...points.map(p=>p.y)));
    const ground=t.groundSurface,groundKeyOriginal='outskirts_ground_b4_surface';
    // TileSprite.texture é um canvas interno gigante; reutilizar diretamente
    // o PNG original mantém a fase e evita duplicar o mapa inteiro por lote.
    const groundSource=this.scene.textures.get(groundKeyOriginal).getSourceImage();
    const groundX=ground.x-ground.width*ground.originX-ground.tilePositionX;
    const groundY=ground.y-ground.height*ground.originY-ground.tilePositionY;
    const floors=this.entries.filter(a=>a.ground),vertical=this.entries.filter(a=>!a.ground);
    let visiblePixels=0,minRoadDistance=Infinity,groundPixels=0;
    for(let y=minY;y<maxY;y+=TILE_SIZE)for(let x=minX;x<maxX;x+=TILE_SIZE){
      const w=Math.min(TILE_SIZE,maxX-x),h=Math.min(TILE_SIZE,maxY-y);
      const suffix=x+'-'+y;
      const groundKey='sinister-ancestral-ground-round01-'+suffix;
      const treeKey='sinister-ancestral-mass-round01-'+suffix;
      const floorTexture=this.scene.textures.createCanvas(groundKey,w,h);
      const treeTexture=this.scene.textures.createCanvas(treeKey,w,h);
      const floorCtx=floorTexture.getContext(),treeCtx=treeTexture.getContext();
      // Mesmo solo contínuo que já sustenta a Ancestral, com a mesma fase.
      floorCtx.save();floorCtx.translate(groundX-x,groundY-y);
      floorCtx.fillStyle=floorCtx.createPattern(groundSource,'repeat');
      floorCtx.fillRect(x-groundX,y-groundY,w,h);floorCtx.restore();
      for(const [ctx,entries] of [[floorCtx,floors],[treeCtx,vertical]])
        for(const a of entries){
          if(a.x+a.radius<x||a.x-a.radius>x+w||a.y+a.radius<y||a.y-a.radius>y+h)continue;
          this.draw(ctx,a,x,y);
        }
      const fp=floorCtx.getImageData(0,0,w,h),tp=treeCtx.getImageData(0,0,w,h);
      let floorCount=0,treeCount=0;
      for(let py=0;py<h;py++)for(let px=0;px<w;px++){
        const i=(py*w+px)*4+3,wx=x+px+.5,wy=y+py+.5,p=t.screenToLogical(wx,wy);
        if(!e.isInsideApprovedCoverage(p.u,p.v)){fp.data[i]=0;tp.data[i]=0;continue;}
        floorCount++;
        if(!tp.data[i])continue;
        const distance=this.forest.nearest(wx,wy).distance;
        const feather=8+4*Math.sin(wx*.039+wy*.019)+3*Math.sin(wx*.011-wy*.027);
        tp.data[i]=Math.round(tp.data[i]*smooth(ROAD_CLEARANCE,ROAD_CLEARANCE+feather,distance));
        if(tp.data[i]){treeCount++;minRoadDistance=Math.min(minRoadDistance,distance);}
      }
      if(floorCount){
        floorCtx.putImageData(fp,0,0);floorTexture.refresh();
        const image=this.scene.add.image(x,y,groundKey).setOrigin(0,0).setDepth(t.groundDepth(-79.7));
        image.setData('aetherRenderClass','ground');image.setData('sinisterAncestralGround',true);
        this.groundImages.push(image);this.textureKeys.push(groundKey);groundPixels+=floorCount;
      }else this.scene.textures.remove(groundKey);
      if(treeCount){
        treeCtx.putImageData(tp,0,0);treeTexture.refresh();
        // Manter este depth preserva EXATAMENTE as três camadas da névoa do R39.
        const image=this.scene.add.image(x,y,treeKey).setOrigin(0,0).setDepth(t.groundDepth(-69.8));
        image.setData('sinisterForestMass',true);this.images.push(image);this.textureKeys.push(treeKey);visiblePixels+=treeCount;
      }else this.scene.textures.remove(treeKey);
    }
    const counts=Object.fromEntries(Object.keys(ART).map(name=>[name,this.entries.filter(a=>a.name===name).length]));
    this.summary={version:'v0.3.2-round01',reference:'Floresta Ancestral original do Round 39',
      visualOnly:true,collision:false,geometrySource:'Round33: approved coverage and visualRoadPath',
      roadClearancePx:ROAD_CLEARANCE,minRoadDistance,visiblePixels,groundPixels,
      assets:Object.keys(counts).filter(k=>counts[k]>0).map(k=>ART[k].path),
      baseGroundKey:groundKeyOriginal,counts,trees:this.entries.filter(a=>a.category==='tree').length,
      structures:this.entries.filter(a=>a.category==='structure').length,groundEntries:floors.length,
      originalScales:true,originalAssetFiles:true,tiles:this.images.length,
      path:e.visualRoadPath.map(p=>({...p}))};
    this.samples.clear();
  }

  destroy(){
    [...this.images,...this.groundImages].forEach(image=>image.destroy());
    this.textureKeys.forEach(key=>this.scene.textures.remove(key));
    this.entries=[];this.images=[];this.groundImages=[];this.textureKeys=[];
  }
}

