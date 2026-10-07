// @ts-nocheck
import {worldClock} from '../world/WorldClock';

/**
 * Round 79.16 — sistema global de névoa do mundo.
 *
 * Princípios:
 * - a névoa é renderizada numa camada própria, acima da iluminação global e
 *   abaixo da HUD;
 * - regiões do mundo apenas registram zonas/polígonos e parâmetros;
 * - a névoa não é um conjunto de sprites escurecidos pelo ciclo noturno;
 * - a textura é procedural em runtime e acompanha a câmera em screen-space.
 */

const DEFAULT_TEXTURE_KEY='aether-world-fog-overlay-v1';
const clamp01=(value)=>Math.max(0,Math.min(1,value));

function colorChannels(color){
  return {r:(color>>16)&255,g:(color>>8)&255,b:color&255};
}

function rgba(color,alpha){
  const {r,g,b}=colorChannels(color);
  return `rgba(${r},${g},${b},${clamp01(alpha)})`;
}

function drawFogLobe(ctx,cx,cy,rx,ry,rotation,color,alpha){
  if(rx<=0||ry<=0||alpha<=0)return;
  ctx.save();
  ctx.translate(cx,cy);
  ctx.rotate(rotation);
  ctx.scale(rx,ry);
  const gradient=ctx.createRadialGradient(0,0,0,0,0,1);
  gradient.addColorStop(0,rgba(color,alpha));
  gradient.addColorStop(.28,rgba(color,alpha*.84));
  gradient.addColorStop(.60,rgba(color,alpha*.42));
  gradient.addColorStop(.82,rgba(color,alpha*.16));
  gradient.addColorStop(1,rgba(color,0));
  ctx.fillStyle=gradient;
  ctx.beginPath();
  ctx.arc(0,0,1,0,Math.PI*2);
  ctx.fill();
  ctx.restore();
}

function drawFogBand(ctx,{cx,cy,rx,ry,rotation,color,alpha,phase,timeSeconds}){
  if(alpha<=0)return;
  const driftA=Math.sin(timeSeconds*.13+phase);
  const driftB=Math.cos(timeSeconds*.09+phase*.73);

  // Véu amplo: dá leitura contínua sem parecer uma elipse sólida.
  drawFogLobe(ctx,cx,cy,rx,ry,rotation,color,alpha*.30);

  // Lóbulos internos com densidades diferentes criam massa orgânica.
  const lobes=[
    [-.30,-.02,.48,.70,.62],
    [-.05,-.11,.56,.78,.78],
    [.24,.03,.50,.68,.70],
    [.42,-.08,.34,.52,.48],
    [-.42,.08,.30,.48,.44]
  ];
  for(let i=0;i<lobes.length;i++){
    const [ox,oy,sx,sy,weight]=lobes[i];
    const wobbleX=(i%2?driftA:driftB)*rx*.025;
    const wobbleY=(i%2?driftB:driftA)*ry*.035;
    drawFogLobe(
      ctx,
      cx+ox*rx+wobbleX,
      cy+oy*ry+wobbleY,
      rx*sx,
      ry*sy,
      rotation+(i-2)*.018,
      color,
      alpha*weight
    );
  }
}

export class WorldFogSystem{
  constructor(scene,{depth=655,renderScale=.5,maxFps=24,textureKey=DEFAULT_TEXTURE_KEY}={}){
    this.scene=scene;
    this.depth=depth;
    this.renderScale=renderScale;
    this.frameInterval=1000/Math.max(1,maxFps);
    this.textureKey=textureKey;
    this.zones=new Map();
    this.lastRenderTime=-Infinity;
    this.lastClockRevision=worldClock.revision;
    this.elapsedMs=0;
    this.surface=null;
    this.texture=null;
    this.ctx=null;
    this.destroyed=false;
    this.createSurface();
    this.scene.registry?.set?.('worldFogSystem',{
      version:'Round79.16',
      renderer:'screen-space-procedural-fog',
      renderScale:this.renderScale,
      maxFps:Math.round(1000/this.frameInterval),
      aboveWorldLighting:true,
      reusableFogZones:true
    });
  }

  viewportSize(){
    return {
      width:this.scene.scale.width||this.scene.scale.gameSize?.width||1280,
      height:this.scene.scale.height||this.scene.scale.gameSize?.height||720
    };
  }

  createSurface(){
    const {width,height}=this.viewportSize();
    const canvasWidth=Math.max(2,Math.ceil(width*this.renderScale));
    const canvasHeight=Math.max(2,Math.ceil(height*this.renderScale));

    this.surface?.destroy?.();
    this.surface=null;
    if(this.scene.textures.exists(this.textureKey))this.scene.textures.remove(this.textureKey);

    this.texture=this.scene.textures.createCanvas(this.textureKey,canvasWidth,canvasHeight);
    this.ctx=this.texture?.getContext?.()??null;
    this.surface=this.scene.add.image(0,0,this.textureKey)
      .setOrigin(0)
      .setScrollFactor(0)
      .setDisplaySize(width,height)
      .setDepth(this.depth);
    this.surface.setName?.('worldFogOverlay');
    this.lastRenderTime=-Infinity;
    this.render(0,true);
  }

  resize(){
    if(this.destroyed)return;
    this.createSurface();
  }

  registerZone(spec={}){
    if(!spec.id)throw new Error('[WorldFogSystem] zona sem id');
    const polygon=(spec.polygon??[]).map(point=>({x:point.x,y:point.y}));
    if(polygon.length<3)throw new Error(`[WorldFogSystem] zona ${spec.id} sem polígono válido`);

    const zone={
      id:spec.id,
      polygon,
      bands:(spec.bands??[]).map((band,index)=>({
        x:band.x??0,
        y:band.y??0,
        width:band.width??280,
        height:band.height??90,
        rotation:band.rotation??0,
        opacity:clamp01(band.opacity??.28),
        driftX:band.driftX??18,
        driftY:band.driftY??4,
        speed:band.speed??.25,
        phase:band.phase??index*.83,
        color:band.color??spec.color??0xcbd5d2
      })),
      schedule:spec.schedule??'always',
      enabled:spec.enabled!==false,
      opacity:clamp01(spec.opacity??1),
      color:spec.color??0xcbd5d2
    };
    this.zones.set(zone.id,zone);
    this.lastRenderTime=-Infinity;

    return {
      id:zone.id,
      destroy:()=>{this.zones.delete(zone.id);this.lastRenderTime=-Infinity;},
      setEnabled:(value)=>{zone.enabled=!!value;this.lastRenderTime=-Infinity;},
      setOpacity:(value)=>{zone.opacity=clamp01(value);this.lastRenderTime=-Infinity;}
    };
  }

  zoneIntensity(zone,timeOfDayMs=worldClock.timeOfDayMs){
    if(!zone?.enabled)return 0;
    if(typeof zone.schedule==='function')return clamp01(zone.schedule(timeOfDayMs));
    return zone.schedule==='always'?1:0;
  }

  worldToScreen(x,y){
    const camera=this.scene.cameras.main;
    const zoom=camera.zoom||1;
    return {
      x:(x-camera.worldView.x)*zoom+(camera.x||0),
      y:(y-camera.worldView.y)*zoom+(camera.y||0),
      zoom
    };
  }

  update(time,delta=16.67){
    if(this.destroyed)return;
    this.elapsedMs+=Math.min(64,Math.max(0,Number.isFinite(delta)?delta:16.67));
    if(worldClock.revision!==this.lastClockRevision){
      this.lastClockRevision=worldClock.revision;
      this.lastRenderTime=-Infinity;
    }
    if(time-this.lastRenderTime<this.frameInterval)return;
    this.render(time,false);
  }

  render(time=0,force=false){
    if(this.destroyed||!this.ctx||!this.texture)return;
    if(!force&&time-this.lastRenderTime<this.frameInterval)return;
    this.lastRenderTime=time;

    const ctx=this.ctx;
    const canvas=this.texture.getSourceImage?.()??this.texture.canvas;
    const width=canvas?.width??Math.ceil(this.viewportSize().width*this.renderScale);
    const height=canvas?.height??Math.ceil(this.viewportSize().height*this.renderScale);
    ctx.globalCompositeOperation='source-over';
    ctx.clearRect(0,0,width,height);

    const scale=this.renderScale;
    const seconds=this.elapsedMs/1000;

    for(const zone of this.zones.values()){
      const intensity=this.zoneIntensity(zone);
      if(intensity<=.001)continue;

      const screenPolygon=zone.polygon.map(point=>this.worldToScreen(point.x,point.y));
      if(!screenPolygon.length)continue;

      ctx.save();
      ctx.beginPath();
      screenPolygon.forEach((point,index)=>{
        const x=point.x*scale,y=point.y*scale;
        if(index===0)ctx.moveTo(x,y); else ctx.lineTo(x,y);
      });
      ctx.closePath();
      ctx.clip();

      for(const band of zone.bands){
        const wave=seconds*band.speed+band.phase;
        const worldX=band.x+Math.sin(wave)*band.driftX;
        const worldY=band.y+Math.cos(wave*.73)*band.driftY;
        const screen=this.worldToScreen(worldX,worldY);
        const zoom=screen.zoom||1;
        const alpha=clamp01(band.opacity*zone.opacity*intensity);
        drawFogBand(ctx,{
          cx:screen.x*scale,
          cy:screen.y*scale,
          rx:band.width*.5*zoom*scale,
          ry:band.height*.5*zoom*scale,
          rotation:band.rotation,
          color:band.color??zone.color,
          alpha,
          phase:band.phase,
          timeSeconds:seconds
        });
      }
      ctx.restore();
    }

    this.texture.refresh();
  }

  destroy(){
    if(this.destroyed)return;
    this.destroyed=true;
    this.zones.clear();
    this.surface?.destroy?.();
    this.surface=null;
    this.ctx=null;
    this.texture=null;
    if(this.scene?.textures?.exists?.(this.textureKey))this.scene.textures.remove(this.textureKey);
  }
}
