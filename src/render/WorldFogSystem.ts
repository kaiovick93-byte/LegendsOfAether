// @ts-nocheck
import {worldClock} from '../world/WorldClock';

/**
 * Round 79.28 — WorldFogSystem reformulado.
 *
 * O renderer anterior usava um grande shader screen-space mascarado pelo
 * polígono da floresta. Visualmente isso revelava a própria geometria do
 * efeito (bordas retas/ovais) e produzia uma superfície leitosa, não névoa.
 *
 * Esta versão troca a arquitetura por volumes 2D de mundo em múltiplas
 * profundidades. Cada volume usa uma textura procedural irregular e:
 * - nasce/dissipa lentamente;
 * - deriva e se deforma em velocidades diferentes;
 * - é depth-sorted com árvores, props e atores;
 * - usa blend NORMAL (nunca SCREEN/ADD global);
 * - permanece abaixo do WorldLightingSystem, recebendo naturalmente o
 *   entardecer/noite e a abertura das luzes locais;
 * - reage às luzes apenas com um leve desvio de tint, sem esbranquiçar.
 *
 * O polígono continua sendo metadado da zona, mas NÃO é mais uma máscara de
 * renderização. Assim não existe borda geométrica capaz de aparecer na tela.
 */

const TEXTURE_PREFIX='aether-fog-wisp-v2';
const FOG_TEXTURE_COUNT=6;
const clamp01=(v)=>Math.max(0,Math.min(1,v));
const lerp=(a,b,t)=>a+(b-a)*t;

function smooth01(value){
  const t=clamp01(value);
  return t*t*(3-2*t);
}

function colorChannels(color){
  return {r:(color>>16)&255,g:(color>>8)&255,b:color&255};
}

function mixColor(a,b,t){
  const ca=colorChannels(a),cb=colorChannels(b),m=clamp01(t);
  const r=Math.round(lerp(ca.r,cb.r,m));
  const g=Math.round(lerp(ca.g,cb.g,m));
  const bl=Math.round(lerp(ca.b,cb.b,m));
  return (r<<16)|(g<<8)|bl;
}

function seededRandom(seed){
  let state=(seed>>>0)||1;
  return ()=>{
    state=(Math.imul(state,1664525)+1013904223)>>>0;
    return state/4294967296;
  };
}

function drawEllipticalGradient(ctx,cx,cy,rx,ry,rotation,alpha){
  if(rx<=1||ry<=1||alpha<=0)return;
  ctx.save();
  ctx.translate(cx,cy);
  ctx.rotate(rotation);
  ctx.scale(rx,ry);
  const gradient=ctx.createRadialGradient(0,0,0,0,0,1);
  gradient.addColorStop(0,`rgba(255,255,255,${alpha})`);
  gradient.addColorStop(.23,`rgba(255,255,255,${alpha*.86})`);
  gradient.addColorStop(.58,`rgba(255,255,255,${alpha*.36})`);
  gradient.addColorStop(.82,`rgba(255,255,255,${alpha*.10})`);
  gradient.addColorStop(1,'rgba(255,255,255,0)');
  ctx.fillStyle=gradient;
  ctx.beginPath();
  ctx.arc(0,0,1,0,Math.PI*2);
  ctx.fill();
  ctx.restore();
}

/** Cria véus quebrados, não uma nuvem oval única. */
function ensureFogTexture(scene,key,seed){
  if(scene.textures.exists(key))return key;
  const width=512,height=192;
  const texture=scene.textures.createCanvas(key,width,height);
  const ctx=texture?.getContext?.();
  if(!ctx)return key;
  const rnd=seededRandom(seed);
  ctx.clearRect(0,0,width,height);

  // Uma espinha levemente sinuosa alonga a névoa no sentido horizontal.
  const lobeCount=14+Math.floor(rnd()*7);
  for(let i=0;i<lobeCount;i++){
    const t=(i+.15+rnd()*.7)/lobeCount;
    const wave=Math.sin(t*Math.PI*2*(.62+rnd()*.22)+seed*.37);
    const cx=width*(.05+t*.90)+(rnd()-.5)*34;
    const cy=height*(.52+wave*.10)+(rnd()-.5)*24;
    const edge=Math.sin(Math.PI*clamp01(t));
    const rx=(34+rnd()*54)*(0.62+edge*.52);
    const ry=15+rnd()*24;
    drawEllipticalGradient(ctx,cx,cy,rx,ry,(rnd()-.5)*.20,.20+rnd()*.18);
  }

  // Filamentos finos que rompem a silhueta principal.
  for(let i=0;i<7;i++){
    const t=.08+rnd()*.84;
    const cx=width*t+(rnd()-.5)*28;
    const cy=height*(.43+(rnd()-.5)*.24);
    drawEllipticalGradient(ctx,cx,cy,44+rnd()*78,7+rnd()*13,(rnd()-.5)*.16,.10+rnd()*.13);
  }

  // Buracos transparentes internos: impede a leitura de "placa branca".
  ctx.globalCompositeOperation='destination-out';
  for(let i=0;i<7;i++){
    const cx=width*(.12+rnd()*.76),cy=height*(.35+rnd()*.30);
    const rx=24+rnd()*62,ry=8+rnd()*20;
    ctx.save();ctx.translate(cx,cy);ctx.scale(rx,ry);
    const g=ctx.createRadialGradient(0,0,0,0,0,1);
    g.addColorStop(0,`rgba(0,0,0,${.18+rnd()*.22})`);
    g.addColorStop(.55,'rgba(0,0,0,.10)');
    g.addColorStop(1,'rgba(0,0,0,0)');
    ctx.fillStyle=g;ctx.beginPath();ctx.arc(0,0,1,0,Math.PI*2);ctx.fill();ctx.restore();
  }
  ctx.globalCompositeOperation='source-over';
  texture.refresh();
  return key;
}

function pointInPolygon(x,y,polygon){
  let inside=false;
  for(let i=0,j=polygon.length-1;i<polygon.length;j=i++){
    const a=polygon[i],b=polygon[j];
    const crosses=((a.y>y)!==(b.y>y))&&(x<(b.x-a.x)*(y-a.y)/(b.y-a.y)+a.x);
    if(crosses)inside=!inside;
  }
  return inside;
}

function layerProfile(layer){
  if(layer==='background')return {alpha:.105,depthOffset:-.16,width:.44,height:.76,drift:1.00,formation:.56};
  if(layer==='foreground')return {alpha:.052,depthOffset:.24,width:.23,height:.48,drift:1.34,formation:.92};
  return {alpha:.135,depthOffset:.10,width:.34,height:.62,drift:1.15,formation:.72};
}

export class WorldFogSystem{
  constructor(scene,{depth=655,renderScale=.5,maxFps=24,textureKey=TEXTURE_PREFIX}={}){
    this.scene=scene;
    this.depth=depth; // Mantido por compatibilidade; wisps usam depth do mundo.
    this.renderScale=renderScale;
    this.maxFps=maxFps;
    this.textureKey=textureKey;
    this.zones=new Map();
    this.elapsedMs=0;
    this.destroyed=false;
    this.textureKeys=[];
    this.ensureTextures();

    this.scene.registry?.set?.('worldFogSystem',{
      version:'Round79.28',
      renderer:'world-space-multi-depth-procedural-wisps',
      pseudoVolumetric:true,
      hardPolygonMask:false,
      screenSpaceFullscreenShader:false,
      blendMode:'NORMAL',
      depthLayers:['background','mid','foreground'],
      reactsToWorldLights:true,
      renderedBelowWorldLighting:true,
      proceduralTextures:FOG_TEXTURE_COUNT,
      reusableFogZones:true
    });
  }

  ensureTextures(){
    for(let i=0;i<FOG_TEXTURE_COUNT;i++){
      const key=`${TEXTURE_PREFIX}-${i+1}`;
      ensureFogTexture(this.scene,key,79128+i*193);
      this.textureKeys.push(key);
    }
  }

  resize(){/* World-space sprites acompanham a câmera naturalmente. */}

  registerZone(spec={}){
    if(!spec.id)throw new Error('[WorldFogSystem] zona sem id');
    const polygon=(spec.polygon??[]).map(p=>({x:p.x,y:p.y}));
    if(polygon.length<3)throw new Error(`[WorldFogSystem] zona ${spec.id} sem polígono válido`);

    const zone={
      id:spec.id,
      polygon,
      schedule:spec.schedule??'always',
      enabled:spec.enabled!==false,
      opacity:clamp01(spec.opacity??1),
      density:clamp01(spec.density??.34),
      color:spec.color??0x83908c,
      atmosphereTintStrength:Math.max(0,Math.min(.12,spec.atmosphereTintStrength??0)),
      atmosphereTargets:(spec.atmosphereTargets??[]).map(sprite=>({
        sprite,originalTint:sprite?.tintTopLeft??0xffffff
      })),
      bands:(spec.bands??[]).map((band,index)=>({
        ...band,
        opacity:clamp01(band.opacity??.8),
        driftX:band.driftX??14,
        driftY:band.driftY??3,
        speed:band.speed??.22,
        phase:band.phase??index*.83
      })),
      wisps:[],
      minY:Math.min(...polygon.map(p=>p.y)),
      maxY:Math.max(...polygon.map(p=>p.y))
    };
    this.zones.set(zone.id,zone);
    this.buildZoneWisps(zone);

    return {
      id:zone.id,
      destroy:()=>{this.destroyZone(zone);this.zones.delete(zone.id);},
      setEnabled:(value)=>{zone.enabled=!!value;for(const w of zone.wisps)w.sprite.setVisible(zone.enabled);},
      setOpacity:(value)=>{zone.opacity=clamp01(value);},
      setDensity:(value)=>{zone.density=clamp01(value);}
    };
  }

  zoneIntensity(zone,timeOfDayMs=worldClock.timeOfDayMs){
    if(!zone?.enabled)return 0;
    if(typeof zone.schedule==='function')return clamp01(zone.schedule(timeOfDayMs));
    return zone.schedule==='always'?1:0;
  }

  logicalOffsetFromScreen(dx,dy){
    const tileWidth=this.scene?.aetherTerritory?.config?.tileWidth??96;
    const tileHeight=this.scene?.aetherTerritory?.config?.tileHeight??48;
    return {du:dx/tileWidth+dy/tileHeight,dv:dy/tileHeight-dx/tileWidth};
  }

  depthForWisp(wisp,x,y){
    if(Number.isFinite(wisp.baseU)&&Number.isFinite(wisp.baseV)&&this.scene?.depthAt){
      const offset=this.logicalOffsetFromScreen(x-wisp.bandX,y-wisp.bandY);
      return this.scene.depthAt(wisp.baseU+offset.du,wisp.baseV+offset.dv,wisp.depthOffset);
    }
    // Fallback raro durante bootstrap da cena. Continua muito abaixo do HUD.
    return -20000+y*.5+wisp.depthOffset;
  }

  buildZoneWisps(zone){
    zone.bands.forEach((band,bandIndex)=>{
      const rnd=seededRandom(79000+bandIndex*977+zone.id.length*31);
      const layers=[
        ['background',2],
        ['mid',band.type==='pocket'?2:3],
        ['foreground',(bandIndex%2===0)?1:0]
      ];
      for(const [layer,count] of layers){
        const profile=layerProfile(layer);
        for(let i=0;i<count;i++){
          const localX=(rnd()-.5)*band.width*.58;
          const localY=(rnd()-.5)*Math.max(12,band.height*.34)+(layer==='foreground'?6:0);
          const textureKey=this.textureKeys[Math.floor(rnd()*this.textureKeys.length)%this.textureKeys.length];
          const sprite=this.scene.add.image(band.x+localX,band.y+localY,textureKey)
            .setOrigin(.5)
            .setBlendMode(Phaser.BlendModes.NORMAL)
            .setTint(zone.color)
            .setAlpha(0)
            .setVisible(zone.enabled);

          const displayWidth=Math.max(72,band.width*profile.width*(.78+rnd()*.48));
          const displayHeight=Math.max(18,band.height*profile.height*(.78+rnd()*.46));
          sprite.setDisplaySize(displayWidth,displayHeight);
          const baseScaleX=sprite.scaleX,baseScaleY=sprite.scaleY;
          const logical=this.logicalOffsetFromScreen(localX,localY);
          const wisp={
            sprite,layer,
            bandX:band.x,bandY:band.y,
            baseX:band.x+localX,baseY:band.y+localY,
            baseU:Number.isFinite(band.u)?band.u+logical.du:null,
            baseV:Number.isFinite(band.v)?band.v+logical.dv:null,
            baseScaleX,baseScaleY,
            baseRotation:(band.rotation??0)+(rnd()-.5)*.08,
            baseAlpha:profile.alpha*band.opacity,
            depthOffset:profile.depthOffset,
            driftX:band.driftX*profile.drift*(.62+rnd()*.68),
            driftY:Math.max(2,band.driftY*profile.drift*(.70+rnd()*.65)),
            speed:band.speed*(.70+rnd()*.62),
            phase:band.phase+rnd()*Math.PI*2,
            deformationPhase:rnd()*Math.PI*2,
            formationSpeed:(.075+rnd()*.075)*profile.formation,
            tint:band.color??zone.color
          };
          sprite.setRotation(wisp.baseRotation);
          sprite.setDepth(this.depthForWisp(wisp,sprite.x,sprite.y));
          sprite.setData?.('worldFogWisp',{zone:zone.id,layer,band:bandIndex,round:'79.28'});
          zone.wisps.push(wisp);
        }
      }
    });
  }

  updateAtmosphereTint(zone,intensity){
    if(!zone.atmosphereTintStrength||!zone.atmosphereTargets?.length)return;
    const span=Math.max(1,zone.maxY-zone.minY);
    for(const entry of zone.atmosphereTargets){
      const sprite=entry.sprite;
      if(!sprite?.active||!sprite.setTint)continue;
      // Em isometria desta área, menor Y de tela corresponde visualmente às
      // massas mais distantes. O efeito é propositalmente muito sutil: ele só
      // reduz um pouco a saturação/contraste do fundo, sem "lavar" a arte.
      const nearFactor=clamp01((sprite.y-zone.minY)/span);
      const farFactor=1-nearFactor;
      const strength=zone.atmosphereTintStrength*intensity*farFactor;
      if(strength<=.002){
        if(entry.originalTint===0xffffff)sprite.clearTint?.();
        else sprite.setTint(entry.originalTint);
        continue;
      }
      sprite.setTint(mixColor(entry.originalTint,zone.color,strength));
    }
  }

  strongestLightAt(x,y){
    const lighting=this.scene.worldLighting;
    if(!lighting?.lights)return null;
    let strongest=null;
    for(const light of lighting.lights.values()){
      const intensity=lighting.lightIntensity?.(light)??0;
      if(intensity<=.001)continue;
      const p=lighting.resolveWorldPosition?.(light);
      if(!p)continue;
      const rx=Math.max(20,light.groundRadiusX??96),ry=Math.max(16,light.groundRadiusY??56);
      const dx=(x-(p.x+(light.groundOffsetX??0)))/rx;
      const dy=(y-(p.y+(light.groundOffsetY??0)))/ry;
      const d=Math.sqrt(dx*dx+dy*dy);
      if(d>=1)continue;
      const influence=smooth01(1-d)*intensity*(light.strength??1);
      if(!strongest||influence>strongest.influence)strongest={influence,color:light.warmColor??0xffc56f};
    }
    return strongest;
  }

  update(_time,delta=16.67){
    if(this.destroyed)return;
    this.elapsedMs+=Math.min(64,Math.max(0,Number.isFinite(delta)?delta:16.67));
    const seconds=this.elapsedMs/1000;

    for(const zone of this.zones.values()){
      const intensity=this.zoneIntensity(zone);
      this.updateAtmosphereTint(zone,intensity);
      for(const wisp of zone.wisps){
        const sprite=wisp.sprite;
        if(!sprite?.active)continue;
        if(!zone.enabled||intensity<=.001){sprite.setVisible(false);continue;}
        sprite.setVisible(true);

        const t=seconds*wisp.speed+wisp.phase;
        const curl=Math.sin(t*.47+wisp.deformationPhase);
        const x=wisp.baseX+
          Math.sin(t)*wisp.driftX+
          Math.sin(t*.39+wisp.deformationPhase)*wisp.driftX*.32;
        const y=wisp.baseY+
          Math.cos(t*.71)*wisp.driftY+
          Math.sin(t*.23+wisp.deformationPhase)*3.2;
        sprite.setPosition(x,y);

        // Lenta compressão/expansão cria a impressão de massa respirando.
        const deformX=1+Math.sin(t*.31+wisp.deformationPhase)*.075;
        const deformY=1+Math.cos(t*.43+wisp.deformationPhase)*.11;
        sprite.setScale(wisp.baseScaleX*deformX,wisp.baseScaleY*deformY);
        sprite.setRotation(wisp.baseRotation+curl*.035);

        // Nascimento/dissipação contínuos: nenhum volume fica eternamente igual.
        const cycle=.5+.5*Math.sin(seconds*wisp.formationSpeed+wisp.phase*1.73);
        const formation=.18+.82*smooth01(cycle);
        let alpha=wisp.baseAlpha*zone.opacity*zone.density*2.55*intensity*formation;

        // Alguns fios de primeiro plano devem ser raros, nunca uma cortina.
        if(wisp.layer==='foreground')alpha*=.72;

        const light=this.strongestLightAt(x,y);
        if(light){
          const tintMix=Math.min(.18,light.influence*.18);
          sprite.setTint(mixColor(wisp.tint,light.color,tintMix));
          alpha*=1+Math.min(.08,light.influence*.08);
        }else sprite.setTint(wisp.tint);

        sprite.setAlpha(clamp01(Math.min(alpha,wisp.layer==='mid'?.17:wisp.layer==='background'?.12:.075)));
        sprite.setDepth(this.depthForWisp(wisp,x,y));
      }
    }
  }

  destroyZone(zone){
    for(const entry of zone?.atmosphereTargets??[]){
      const sprite=entry.sprite;
      if(!sprite?.active||!sprite.setTint)continue;
      if(entry.originalTint===0xffffff)sprite.clearTint?.();
      else sprite.setTint(entry.originalTint);
    }
    for(const wisp of zone?.wisps??[])wisp.sprite?.destroy?.();
    if(zone?.wisps)zone.wisps.length=0;
  }

  destroy(){
    if(this.destroyed)return;
    this.destroyed=true;
    for(const zone of this.zones.values())this.destroyZone(zone);
    this.zones.clear();
    // Texturas pertencem a este sistema e podem ser reconstruídas no restart.
    for(const key of this.textureKeys){
      if(this.scene?.textures?.exists?.(key))this.scene.textures.remove(key);
    }
    this.textureKeys.length=0;
  }
}
