// @ts-nocheck
import {worldClock} from '../world/WorldClock';

/**
 * Round 79.10 — sistema global de iluminação do mundo.
 *
 * Princípio:
 * - a noite/entardecer é uma camada ambiental única em screen-space;
 * - fontes locais NÃO desenham manchas brancas sobre o mundo;
 * - cada luz abre suavemente a camada de escuridão e acrescenta apenas um
 *   pequeno tom quente opcional;
 * - UI/HUD permanece acima desta camada (depth padrão 650).
 *
 * O renderer usa um CanvasTexture em meia resolução. Isso mantém gradientes
 * suaves e evita o custo de enviar um canvas full-HD para a GPU a cada frame.
 */

const DEFAULT_TEXTURE_KEY='aether-world-lighting-overlay-v1';

const clamp01=(value)=>Math.max(0,Math.min(1,value));
const lerp=(a,b,t)=>a+(b-a)*t;
const rangeProgress=(value,start,end)=>end<=start?(value>=end?1:0):clamp01((value-start)/(end-start));
const smoothRangeProgress=(value,start,end)=>{
  const t=rangeProgress(value,start,end);
  return t*t*(3-2*t);
};

export function worldLightingProfile(timeOfDayMs=worldClock.timeOfDayMs){
  const minutes=((timeOfDayMs/60000)%1440+1440)%1440;
  let sunsetAlpha=0;
  let nightAlpha=0;

  if(minutes<270){
    sunsetAlpha=.01;
    nightAlpha=.56;
  }else if(minutes<360){
    const t=smoothRangeProgress(minutes,270,360);
    sunsetAlpha=lerp(.03,0,t);
    nightAlpha=lerp(.56,0,t);
  }else if(minutes<1050){
    sunsetAlpha=0;
    nightAlpha=0;
  }else if(minutes<1110){
    const t=smoothRangeProgress(minutes,1050,1110);
    sunsetAlpha=lerp(.01,.12,t);
    nightAlpha=lerp(0,.12,t);
  }else if(minutes<1155){
    const t=smoothRangeProgress(minutes,1110,1155);
    sunsetAlpha=lerp(.12,.07,t);
    nightAlpha=lerp(.12,.34,t);
  }else if(minutes<1200){
    const t=smoothRangeProgress(minutes,1155,1200);
    sunsetAlpha=lerp(.07,.02,t);
    nightAlpha=lerp(.34,.56,t);
  }else{
    sunsetAlpha=.01;
    nightAlpha=.56;
  }

  return {sunsetAlpha,nightAlpha};
}

/** Mesma curva aprovada para lanternas: 19:15→20:00 liga; 04:30→06:00 apaga. */
export function duskToDawnLightIntensity(timeOfDayMs=worldClock.timeOfDayMs){
  const minutes=((timeOfDayMs/60000)%1440+1440)%1440;
  if(minutes>=1200||minutes<270)return 1;
  if(minutes>=1155)return clamp01((minutes-1155)/45);
  if(minutes>=270&&minutes<360)return clamp01(1-(minutes-270)/90);
  return 0;
}

function colorChannels(color){
  return {r:(color>>16)&255,g:(color>>8)&255,b:color&255};
}

function rgba(color,alpha){
  const {r,g,b}=colorChannels(color);
  return `rgba(${r},${g},${b},${clamp01(alpha)})`;
}

function ellipseGradient(ctx,cx,cy,rx,ry,alpha,stops=[0,.28,.64,1]){
  if(rx<=0||ry<=0||alpha<=0)return;
  ctx.save();
  ctx.translate(cx,cy);
  ctx.scale(rx,ry);
  const gradient=ctx.createRadialGradient(0,0,0,0,0,1);
  gradient.addColorStop(stops[0],`rgba(0,0,0,${alpha})`);
  gradient.addColorStop(stops[1],`rgba(0,0,0,${alpha*.82})`);
  gradient.addColorStop(stops[2],`rgba(0,0,0,${alpha*.28})`);
  gradient.addColorStop(stops[3],'rgba(0,0,0,0)');
  ctx.fillStyle=gradient;
  ctx.beginPath();
  ctx.arc(0,0,1,0,Math.PI*2);
  ctx.fill();
  ctx.restore();
}

function warmEllipse(ctx,cx,cy,rx,ry,color,alpha){
  if(rx<=0||ry<=0||alpha<=0)return;
  ctx.save();
  ctx.translate(cx,cy);
  ctx.scale(rx,ry);
  const gradient=ctx.createRadialGradient(0,0,0,0,0,1);
  gradient.addColorStop(0,rgba(color,alpha));
  gradient.addColorStop(.30,rgba(color,alpha*.54));
  gradient.addColorStop(.68,rgba(color,alpha*.16));
  gradient.addColorStop(1,rgba(color,0));
  ctx.fillStyle=gradient;
  ctx.beginPath();
  ctx.arc(0,0,1,0,Math.PI*2);
  ctx.fill();
  ctx.restore();
}

export class WorldLightingSystem{
  constructor(scene,{depth=650,renderScale=.5,maxFps=30,textureKey=DEFAULT_TEXTURE_KEY}={}){
    this.scene=scene;
    this.depth=depth;
    this.renderScale=renderScale;
    this.frameInterval=1000/Math.max(1,maxFps);
    this.textureKey=textureKey;
    this.lights=new Map();
    this.lastRenderTime=-Infinity;
    this.lastClockRevision=worldClock.revision;
    this.surface=null;
    this.texture=null;
    this.ctx=null;
    this.destroyed=false;
    this.createSurface();
    this.scene.registry?.set?.('worldLightingSystem',{
      version:'Round79.10',
      renderer:'screen-space-alpha-cutout',
      renderScale:this.renderScale,
      maxFps:Math.round(1000/this.frameInterval),
      globalAmbient:true,
      reusableLocalLights:true
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
    const surface=this.scene.add.image(0,0,this.textureKey)
      .setOrigin(0)
      .setScrollFactor(0)
      .setDisplaySize(width,height)
      .setDepth(this.depth);
    surface.setName?.('worldLightingOverlay');
    this.surface=surface;
    this.lastRenderTime=-Infinity;
    const now=(typeof performance!=='undefined'&&performance.now)?performance.now():0;
    this.render(now,true);
  }

  resize(){
    if(this.destroyed)return;
    this.createSurface();
  }

  registerLight(spec={}){
    if(!spec.id)throw new Error('[WorldLightingSystem] luz sem id');
    const light={
      id:spec.id,
      source:spec.source??null,
      x:spec.x??0,
      y:spec.y??0,
      offsetX:spec.offsetX??0,
      offsetY:spec.offsetY??0,
      groundOffsetX:spec.groundOffsetX??0,
      groundOffsetY:spec.groundOffsetY??28,
      groundRadiusX:spec.groundRadiusX??96,
      groundRadiusY:spec.groundRadiusY??56,
      coreRadius:spec.coreRadius??28,
      strength:clamp01(spec.strength??.82),
      warmColor:spec.warmColor??0xffc56f,
      warmAlpha:spec.warmAlpha??.075,
      schedule:spec.schedule??'dusk-to-dawn',
      enabled:spec.enabled!==false,
      onIntensityChange:spec.onIntensityChange??null,
      lastIntensity:-1
    };
    this.lights.set(light.id,light);
    const intensity=this.lightIntensity(light);
    light.lastIntensity=intensity;
    light.onIntensityChange?.(intensity);
    this.lastRenderTime=-Infinity;

    return {
      id:light.id,
      destroy:()=>{this.lights.delete(light.id);this.lastRenderTime=-Infinity;},
      setEnabled:(value)=>{light.enabled=!!value;this.lastRenderTime=-Infinity;},
      setPosition:(x,y)=>{light.x=x;light.y=y;this.lastRenderTime=-Infinity;},
      setStrength:(value)=>{light.strength=clamp01(value);this.lastRenderTime=-Infinity;}
    };
  }

  lightIntensity(light,timeOfDayMs=worldClock.timeOfDayMs){
    if(!light?.enabled)return 0;
    if(typeof light.schedule==='function')return clamp01(light.schedule(timeOfDayMs));
    if(light.schedule==='always')return 1;
    return duskToDawnLightIntensity(timeOfDayMs);
  }

  resolveWorldPosition(light){
    const source=light.source;
    if(source){
      if(source.scene!==this.scene||source.active===false||source.visible===false)return null;
      return {x:source.x+light.offsetX,y:source.y+light.offsetY};
    }
    return {x:light.x+light.offsetX,y:light.y+light.offsetY};
  }

  worldToScreen(x,y){
    const camera=this.scene.cameras.main;
    const zoom=camera.zoom||1;
    return {
      x:(x-camera.worldView.x)*zoom+(camera.x||0),
      y:(y-camera.worldView.y)*zoom+(camera.y||0)
    };
  }

  update(time){
    if(this.destroyed)return;
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

    const profile=worldLightingProfile();
    if(profile.sunsetAlpha>0){
      ctx.fillStyle=rgba(0xc67b4d,profile.sunsetAlpha);
      ctx.fillRect(0,0,width,height);
    }
    if(profile.nightAlpha>0){
      ctx.fillStyle=rgba(0x0a1630,profile.nightAlpha);
      ctx.fillRect(0,0,width,height);
    }

    const scale=this.renderScale;
    const viewport=this.viewportSize();
    for(const light of this.lights.values()){
      const intensity=this.lightIntensity(light);
      if(Math.abs(intensity-light.lastIntensity)>.002){
        light.lastIntensity=intensity;
        light.onIntensityChange?.(intensity);
      }
      if(intensity<=.001)continue;

      const world=this.resolveWorldPosition(light);
      if(!world)continue;
      const screen=this.worldToScreen(world.x,world.y);
      const margin=Math.max(light.groundRadiusX,light.coreRadius)+24;
      if(screen.x<-margin||screen.y<-margin||screen.x>viewport.width+margin||screen.y>viewport.height+margin)continue;

      const sx=screen.x*scale;
      const sy=screen.y*scale;
      const strength=intensity*light.strength;

      // A luz é ausência controlada de escuridão — nunca um disco branco.
      ctx.globalCompositeOperation='destination-out';
      ellipseGradient(
        ctx,
        sx+light.groundOffsetX*scale,
        sy+light.groundOffsetY*scale,
        light.groundRadiusX*scale,
        light.groundRadiusY*scale,
        strength*.88
      );
      ellipseGradient(ctx,sx,sy,light.coreRadius*scale,light.coreRadius*scale,strength*.92,[0,.22,.58,1]);

      // Apenas um calor discreto no centro/solo; o clareamento real já veio
      // da abertura da camada noturna acima.
      ctx.globalCompositeOperation='source-over';
      warmEllipse(
        ctx,
        sx+light.groundOffsetX*scale,
        sy+light.groundOffsetY*scale,
        light.groundRadiusX*.62*scale,
        light.groundRadiusY*.62*scale,
        light.warmColor,
        light.warmAlpha*intensity
      );
      warmEllipse(ctx,sx,sy,light.coreRadius*.72*scale,light.coreRadius*.72*scale,light.warmColor,light.warmAlpha*1.55*intensity);
    }

    ctx.globalCompositeOperation='source-over';
    this.texture.refresh();
  }

  destroy(){
    if(this.destroyed)return;
    this.destroyed=true;
    this.lights.clear();
    this.surface?.destroy?.();
    this.surface=null;
    this.ctx=null;
    this.texture=null;
    if(this.scene?.textures?.exists?.(this.textureKey))this.scene.textures.remove(this.textureKey);
  }
}
