// @ts-nocheck
import {worldClock} from '../world/WorldClock';

/**
 * Round 79.17 — névoa pseudo-volumétrica WebGL.
 *
 * Objetivos:
 * - abandonar as "faixas" 2D visíveis do renderer anterior;
 * - concentrar a névoa rente ao chão, com queda vertical semelhante a um
 *   Exponential Height Fog adaptado à câmera isométrica;
 * - usar ruído procedural em shader para quebrar bordas e criar volume;
 * - reagir às luzes registradas no WorldLightingSystem;
 * - preservar fallback Canvas para máquinas sem WebGL.
 */

const DEFAULT_TEXTURE_KEY='aether-world-fog-overlay-v1';
const MAX_SHADER_BANDS=7;
const MAX_SHADER_LIGHTS=4;
const clamp01=(value)=>Math.max(0,Math.min(1,value));

const VOLUMETRIC_FOG_FRAGMENT_SHADER=`
precision mediump float;

uniform vec2 resolution;
uniform float uFogTime;
uniform vec2 uCamera;
uniform float uZoom;
uniform float uDensity;
uniform float uCoverage;
uniform vec3 uFogColor;

uniform vec4 uBand0;
uniform vec4 uBand1;
uniform vec4 uBand2;
uniform vec4 uBand3;
uniform vec4 uBand4;
uniform vec4 uBand5;
uniform vec4 uBand6;
uniform vec4 uBandWeightsA;
uniform vec4 uBandWeightsB;
uniform vec4 uBandRotA;
uniform vec4 uBandRotB;

uniform vec4 uLight0;
uniform vec4 uLight1;
uniform vec4 uLight2;
uniform vec4 uLight3;
uniform vec3 uLightColor0;
uniform vec3 uLightColor1;
uniform vec3 uLightColor2;
uniform vec3 uLightColor3;

varying vec2 fragCoord;

float hash21(vec2 p){
  p=fract(p*vec2(123.34,345.45));
  p+=dot(p,p+34.345);
  return fract(p.x*p.y);
}

float noise2(vec2 p){
  vec2 i=floor(p);
  vec2 f=fract(p);
  f=f*f*(3.0-2.0*f);
  float a=hash21(i);
  float b=hash21(i+vec2(1.0,0.0));
  float c=hash21(i+vec2(0.0,1.0));
  float d=hash21(i+vec2(1.0,1.0));
  return mix(mix(a,b,f.x),mix(c,d,f.x),f.y);
}

float fbm(vec2 p){
  float v=0.0;
  v+=noise2(p)*0.56;
  p=p*2.03+vec2(17.1,9.2);
  v+=noise2(p)*0.29;
  p=p*2.01+vec2(-8.4,14.7);
  v+=noise2(p)*0.15;
  return v;
}

float groundBand(vec2 screen,vec4 band,float weight,float rotation){
  if(weight<=0.001||band.z<=0.5||band.w<=0.5)return 0.0;

  vec2 delta=screen-band.xy;
  float cs=cos(rotation);
  float sn=sin(rotation);
  vec2 local=vec2(cs*delta.x+sn*delta.y,-sn*delta.x+cs*delta.y);
  // Acima do ponto de chão a névoa cai muito mais rápido. Abaixo dele ela
  // pode "assentar" alguns pixels e permanecer rente ao terreno.
  float verticalScale=(local.y<0.0)?0.48:1.08;
  vec2 q=vec2(
    local.x/max(1.0,band.z),
    local.y/max(1.0,band.w*verticalScale)
  );
  float d=dot(q,q);
  return (1.0-smoothstep(0.30,1.0,d))*weight;
}

float lightInfluence(vec2 screen,vec4 light){
  if(light.w<=0.001||light.z<=1.0)return 0.0;
  float d=distance(screen,light.xy);
  return (1.0-smoothstep(light.z*0.20,light.z,d))*light.w;
}

void main(){
  // Converter para coordenadas de tela com origem no canto superior esquerdo.
  vec2 screen=vec2(fragCoord.x,resolution.y-fragCoord.y);
  float zoom=max(0.001,uZoom);

  // Posição aproximada no mundo mantém o padrão estável enquanto a câmera anda.
  vec2 worldP=screen/zoom+uCamera;
  vec2 wind=vec2(uFogTime*4.2,-uFogTime*0.75);

  // Ruído anisotrópico: X alongado e Y comprimido -> véus baixos, não nuvens.
  vec2 p=vec2((worldP.x+wind.x)*0.0032,(worldP.y+wind.y)*0.0090);
  float warpA=noise2(p*0.72+vec2(uFogTime*0.012,3.7));
  float warpB=noise2(p*0.61+vec2(-2.4,uFogTime*0.008));
  p+=vec2(warpA-0.5,warpB-0.5)*0.42;

  float broad=fbm(p);
  float detail=noise2(p*2.85+vec2(-uFogTime*0.018,uFogTime*0.006));
  float filament=fbm(vec2(p.x*0.72,p.y*1.92)+vec2(5.3,-2.1));

  float volume=smoothstep(uCoverage,0.90,broad*0.76+detail*0.24);
  float wisps=smoothstep(0.48,0.84,filament);
  volume=clamp(volume*0.82+wisps*0.28,0.0,1.0);

  float field=0.0;
  field=max(field,groundBand(screen,uBand0,uBandWeightsA.x,uBandRotA.x));
  field=max(field,groundBand(screen,uBand1,uBandWeightsA.y,uBandRotA.y));
  field=max(field,groundBand(screen,uBand2,uBandWeightsA.z,uBandRotA.z));
  field=max(field,groundBand(screen,uBand3,uBandWeightsA.w,uBandRotA.w));
  field=max(field,groundBand(screen,uBand4,uBandWeightsB.x,uBandRotB.x));
  field=max(field,groundBand(screen,uBand5,uBandWeightsB.y,uBandRotB.y));
  field=max(field,groundBand(screen,uBand6,uBandWeightsB.z,uBandRotB.z));

  // Pequenos "buracos" internos evitam massas leitosas contínuas.
  float breakup=smoothstep(0.18,0.80,broad+detail*0.18);
  float alpha=uDensity*field*(0.22+0.88*volume)*breakup;

  vec3 color=uFogColor;
  float light0=lightInfluence(screen,uLight0);
  float light1=lightInfluence(screen,uLight1);
  float light2=lightInfluence(screen,uLight2);
  float light3=lightInfluence(screen,uLight3);
  float totalLight=clamp(light0+light1+light2+light3,0.0,1.0);

  if(light0>0.0)color=mix(color,uLightColor0,clamp(light0*0.58,0.0,0.58));
  if(light1>0.0)color=mix(color,uLightColor1,clamp(light1*0.50,0.0,0.50));
  if(light2>0.0)color=mix(color,uLightColor2,clamp(light2*0.50,0.0,0.50));
  if(light3>0.0)color=mix(color,uLightColor3,clamp(light3*0.50,0.0,0.50));

  // Luz pontual torna o vapor um pouco mais aparente e quente, como espalhamento.
  alpha*=1.0+totalLight*0.14;
  color+=vec3(totalLight*0.035);

  alpha=clamp(alpha,0.0,0.38);
  gl_FragColor=vec4(clamp(color,0.0,1.0),alpha);
}
`;

function colorChannels(color){
  return {r:(color>>16)&255,g:(color>>8)&255,b:color&255};
}

function normalizedColor(color){
  const {r,g,b}=colorChannels(color);
  return {x:r/255,y:g/255,z:b/255};
}

function rgba(color,alpha){
  const {r,g,b}=colorChannels(color);
  return `rgba(${r},${g},${b},${clamp01(alpha)})`;
}

// Fallback Canvas. Em WebGL este desenho NÃO é usado.
function drawFogLobe(ctx,cx,cy,rx,ry,rotation,color,alpha){
  if(rx<=0||ry<=0||alpha<=0)return;
  ctx.save();
  ctx.translate(cx,cy);
  ctx.rotate(rotation);
  ctx.scale(rx,ry);
  const gradient=ctx.createRadialGradient(0,0,0,0,0,1);
  gradient.addColorStop(0,rgba(color,alpha));
  gradient.addColorStop(.32,rgba(color,alpha*.72));
  gradient.addColorStop(.68,rgba(color,alpha*.24));
  gradient.addColorStop(1,rgba(color,0));
  ctx.fillStyle=gradient;
  ctx.beginPath();
  ctx.arc(0,0,1,0,Math.PI*2);
  ctx.fill();
  ctx.restore();
}

function drawFallbackBand(ctx,{cx,cy,rx,ry,rotation,color,alpha,phase,timeSeconds}){
  if(alpha<=0)return;
  const drift=Math.sin(timeSeconds*.12+phase);
  drawFogLobe(ctx,cx,cy+ry*.18,rx,ry*.58,rotation,color,alpha*.55);
  drawFogLobe(ctx,cx-rx*.22+drift*rx*.025,cy+ry*.15,rx*.46,ry*.42,rotation-.02,color,alpha*.62);
  drawFogLobe(ctx,cx+rx*.20-drift*rx*.02,cy+ry*.17,rx*.50,ry*.38,rotation+.02,color,alpha*.58);
}

function shaderUniforms(){
  const uniforms={
    uFogTime:{type:'1f',value:0},
    uCamera:{type:'2f',value:{x:0,y:0}},
    uZoom:{type:'1f',value:1},
    uDensity:{type:'1f',value:0},
    uCoverage:{type:'1f',value:.47},
    uFogColor:{type:'3f',value:{x:.50,y:.57,z:.54}},
    uBandWeightsA:{type:'4f',value:{x:0,y:0,z:0,w:0}},
    uBandWeightsB:{type:'4f',value:{x:0,y:0,z:0,w:0}},
    uBandRotA:{type:'4f',value:{x:0,y:0,z:0,w:0}},
    uBandRotB:{type:'4f',value:{x:0,y:0,z:0,w:0}}
  };
  for(let i=0;i<MAX_SHADER_BANDS;i++)uniforms[`uBand${i}`]={type:'4f',value:{x:0,y:0,z:1,w:1}};
  for(let i=0;i<MAX_SHADER_LIGHTS;i++){
    uniforms[`uLight${i}`]={type:'4f',value:{x:0,y:0,z:1,w:0}};
    uniforms[`uLightColor${i}`]={type:'3f',value:{x:1,y:1,z:1}};
  }
  return uniforms;
}

function assignVec2(uniform,x,y){
  if(!uniform?.value)return;
  uniform.value.x=x;uniform.value.y=y;
}
function assignVec3(uniform,x,y,z){
  if(!uniform?.value)return;
  uniform.value.x=x;uniform.value.y=y;uniform.value.z=z;
}
function assignVec4(uniform,x,y,z,w){
  if(!uniform?.value)return;
  uniform.value.x=x;uniform.value.y=y;uniform.value.z=z;uniform.value.w=w;
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
    this.webgl=!!this.scene.sys.game.renderer?.gl;
    if(!this.webgl)this.createFallbackSurface();

    this.scene.registry?.set?.('worldFogSystem',{
      version:'Round79.17',
      renderer:this.webgl?'webgl-pseudo-volumetric-height-fog':'canvas-fallback-low-fog',
      pseudoVolumetric:this.webgl,
      exponentialHeightApproximation:this.webgl,
      reactsToWorldLights:this.webgl,
      maxShaderBands:MAX_SHADER_BANDS,
      maxShaderLights:MAX_SHADER_LIGHTS,
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

  createFallbackSurface(){
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
    this.surface.setName?.('worldFogOverlayFallback');
    this.lastRenderTime=-Infinity;
    this.renderFallback(0,true);
  }

  resize(){
    if(this.destroyed)return;
    if(this.webgl){
      for(const zone of this.zones.values()){
        this.destroyZoneShader(zone);
        this.createZoneShader(zone);
      }
    }else this.createFallbackSurface();
  }

  registerZone(spec={}){
    if(!spec.id)throw new Error('[WorldFogSystem] zona sem id');
    const polygon=(spec.polygon??[]).map(point=>({x:point.x,y:point.y}));
    if(polygon.length<3)throw new Error(`[WorldFogSystem] zona ${spec.id} sem polígono válido`);

    const zone={
      id:spec.id,
      polygon,
      bands:(spec.bands??[]).slice(0,MAX_SHADER_BANDS).map((band,index)=>({
        x:band.x??0,
        y:band.y??0,
        width:band.width??280,
        height:band.height??64,
        rotation:band.rotation??0,
        opacity:clamp01(band.opacity??.75),
        driftX:band.driftX??14,
        driftY:band.driftY??3,
        speed:band.speed??.22,
        phase:band.phase??index*.83,
        color:band.color??spec.color??0x809087
      })),
      schedule:spec.schedule??'always',
      enabled:spec.enabled!==false,
      opacity:clamp01(spec.opacity??1),
      density:clamp01(spec.density??.34),
      coverage:clamp01(spec.coverage??.47),
      groundOffsetY:spec.groundOffsetY??14,
      heightScale:Math.max(.1,spec.heightScale??1),
      color:spec.color??0x809087,
      shader:null,
      baseShader:null,
      maskGraphics:null,
      mask:null
    };
    this.zones.set(zone.id,zone);
    if(this.webgl)this.createZoneShader(zone);
    this.lastRenderTime=-Infinity;

    return {
      id:zone.id,
      destroy:()=>{
        this.destroyZoneShader(zone);
        this.zones.delete(zone.id);
        this.lastRenderTime=-Infinity;
      },
      setEnabled:(value)=>{
        zone.enabled=!!value;
        zone.shader?.setVisible?.(zone.enabled);
        this.lastRenderTime=-Infinity;
      },
      setOpacity:(value)=>{zone.opacity=clamp01(value);this.lastRenderTime=-Infinity;},
      setDensity:(value)=>{zone.density=clamp01(value);this.lastRenderTime=-Infinity;}
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

  createZoneShader(zone){
    if(!this.webgl||this.destroyed)return;
    const {width,height}=this.viewportSize();
    const shaderName=`aether-volumetric-fog-${zone.id}`;
    zone.baseShader=new Phaser.Display.BaseShader(
      shaderName,
      VOLUMETRIC_FOG_FRAGMENT_SHADER,
      null,
      shaderUniforms()
    );
    zone.shader=this.scene.add.shader(zone.baseShader,width*.5,height*.5,width,height)
      .setScrollFactor(0)
      .setDepth(this.depth)
      .setVisible(zone.enabled);
    zone.shader.setName?.(`worldFogShader:${zone.id}`);

    zone.maskGraphics=this.scene.make.graphics({x:0,y:0,add:false});
    zone.maskGraphics.setScrollFactor?.(0);
    zone.mask=zone.maskGraphics.createGeometryMask();
    zone.shader.setMask(zone.mask);
    this.updateZoneShader(zone);
  }

  destroyZoneShader(zone){
    zone.shader?.clearMask?.(false);
    zone.mask?.destroy?.();
    zone.maskGraphics?.destroy?.();
    zone.shader?.destroy?.();
    zone.shader=null;
    zone.baseShader=null;
    zone.mask=null;
    zone.maskGraphics=null;
  }

  refreshZoneMask(zone){
    const graphics=zone.maskGraphics;
    if(!graphics)return;
    const screenPolygon=zone.polygon.map(point=>this.worldToScreen(point.x,point.y));
    graphics.clear();
    graphics.fillStyle(0xffffff,1);
    graphics.beginPath();
    screenPolygon.forEach((point,index)=>{
      if(index===0)graphics.moveTo(point.x,point.y);
      else graphics.lineTo(point.x,point.y);
    });
    graphics.closePath();
    graphics.fillPath();
  }

  updateLightUniforms(shader){
    const lighting=this.scene.worldLighting;
    const lights=[];
    if(lighting?.lights){
      for(const light of lighting.lights.values()){
        const intensity=lighting.lightIntensity?.(light)??0;
        if(intensity<=.001)continue;
        const world=lighting.resolveWorldPosition?.(light);
        if(!world)continue;
        const screen=this.worldToScreen(world.x,world.y);
        const radius=Math.max(light.groundRadiusX??96,light.groundRadiusY??56,light.coreRadius??28)*(screen.zoom||1)*1.20;
        lights.push({
          x:screen.x,
          y:screen.y,
          radius,
          intensity:clamp01(intensity*(light.strength??1)),
          color:normalizedColor(light.warmColor??0xffc56f)
        });
        if(lights.length>=MAX_SHADER_LIGHTS)break;
      }
    }

    for(let i=0;i<MAX_SHADER_LIGHTS;i++){
      const light=lights[i];
      if(light){
        assignVec4(shader.uniforms[`uLight${i}`],light.x,light.y,light.radius,light.intensity);
        assignVec3(shader.uniforms[`uLightColor${i}`],light.color.x,light.color.y,light.color.z);
      }else{
        assignVec4(shader.uniforms[`uLight${i}`],0,0,1,0);
        assignVec3(shader.uniforms[`uLightColor${i}`],1,1,1);
      }
    }
  }

  updateZoneShader(zone){
    const shader=zone.shader;
    if(!shader)return;
    this.refreshZoneMask(zone);

    const camera=this.scene.cameras.main;
    const intensity=this.zoneIntensity(zone);
    const fogColor=normalizedColor(zone.color);
    shader.setVisible?.(zone.enabled&&intensity>.001);
    if(intensity<=.001)return;

    shader.uniforms.uFogTime.value=this.elapsedMs/1000;
    assignVec2(shader.uniforms.uCamera,camera.worldView.x,camera.worldView.y);
    shader.uniforms.uZoom.value=camera.zoom||1;
    shader.uniforms.uDensity.value=clamp01(zone.density*zone.opacity*intensity);
    shader.uniforms.uCoverage.value=zone.coverage;
    assignVec3(shader.uniforms.uFogColor,fogColor.x,fogColor.y,fogColor.z);

    const weights=[0,0,0,0,0,0,0];
    const rotations=[0,0,0,0,0,0,0];
    for(let i=0;i<MAX_SHADER_BANDS;i++){
      const band=zone.bands[i];
      if(!band){
        assignVec4(shader.uniforms[`uBand${i}`],0,0,1,1);
        continue;
      }
      const wave=this.elapsedMs/1000*band.speed+band.phase;
      const worldX=band.x+Math.sin(wave)*band.driftX;
      const worldY=band.y+Math.cos(wave*.73)*band.driftY;
      const screen=this.worldToScreen(worldX,worldY);
      const zoom=screen.zoom||1;
      // Centro levemente abaixo do ponto de chão + pouca altura = height fog.
      assignVec4(
        shader.uniforms[`uBand${i}`],
        screen.x,
        screen.y+zone.groundOffsetY*zoom,
        Math.max(2,band.width*.5*zoom),
        Math.max(2,band.height*.5*zoom*zone.heightScale)
      );
      weights[i]=band.opacity;
      rotations[i]=band.rotation;
    }
    assignVec4(shader.uniforms.uBandWeightsA,weights[0],weights[1],weights[2],weights[3]);
    assignVec4(shader.uniforms.uBandWeightsB,weights[4],weights[5],weights[6],0);
    assignVec4(shader.uniforms.uBandRotA,rotations[0],rotations[1],rotations[2],rotations[3]);
    assignVec4(shader.uniforms.uBandRotB,rotations[4],rotations[5],rotations[6],0);
    this.updateLightUniforms(shader);
  }

  update(time,delta=16.67){
    if(this.destroyed)return;
    this.elapsedMs+=Math.min(64,Math.max(0,Number.isFinite(delta)?delta:16.67));

    if(this.webgl){
      // Shader e máscara acompanham a câmera a cada frame para não "deslizarem".
      for(const zone of this.zones.values())this.updateZoneShader(zone);
      this.lastClockRevision=worldClock.revision;
      return;
    }

    if(worldClock.revision!==this.lastClockRevision){
      this.lastClockRevision=worldClock.revision;
      this.lastRenderTime=-Infinity;
    }
    if(time-this.lastRenderTime<this.frameInterval)return;
    this.renderFallback(time,false);
  }

  renderFallback(time=0,force=false){
    if(this.webgl||this.destroyed||!this.ctx||!this.texture)return;
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
        const alpha=clamp01(band.opacity*zone.opacity*zone.density*intensity);
        drawFallbackBand(ctx,{
          cx:screen.x*scale,
          cy:(screen.y+zone.groundOffsetY*zoom)*scale,
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
    for(const zone of this.zones.values())this.destroyZoneShader(zone);
    this.zones.clear();
    this.surface?.destroy?.();
    this.surface=null;
    this.ctx=null;
    this.texture=null;
    if(this.scene?.textures?.exists?.(this.textureKey))this.scene.textures.remove(this.textureKey);
  }
}
