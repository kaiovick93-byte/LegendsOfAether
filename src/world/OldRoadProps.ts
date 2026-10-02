import {worldClock} from './WorldClock';
// @ts-nocheck
// B4.2C: two translations from the supplied red marks; art and scale unchanged.
const asset=(key,originY)=>({key,path:`assets/images/environment/outskirts/old-road-props/${key}.png`,originX:.5,originY});
export const OLD_ROAD_PROP_ASSETS={
  aetherSign:asset('old_road_sign_aether_01',.9303),
  waystone:asset('old_road_waystone_ruined_01',.933),
  junctionSign:asset('old_road_sign_south_gate_junction_01',.94),
  bush:asset('old_road_bush_flowers_01',.9237),
  rocks:asset('old_road_rocks_cluster_01',.9296),
  outcrop:asset('old_road_rock_outcrop_01',.9333),
  log:asset('old_road_log_fallen_moss_01',.9296),
  stump:asset('old_road_stump_moss_01',.9296),
  fence:asset('old_road_fence_rustic_01',.9346),
  brokenFence:asset('old_road_fence_broken_01',.9346),
  signLanternDay:asset('old_road_sign_lantern_day_01',.985),
  signLanternNight:asset('old_road_sign_lantern_night_01',.985)
};

// Hand-spaced pockets with open gaps. Fractions follow the existing road;
// offsets are on its left shoulder while travelling towards the South Gate.
// Visible bases sit 2–6px off the road, accounting for transparent PNG margins.
const DRESSING=[
  ['rocks',.102,38.1,.50],['fence',.139,40.1,.86,false,5],
  ['bush',.179,39.0,.65,true],['log',.213,36.5,.70],
  ['rocks',.240,42.0,.42,true],['bush',.274,43.7,.58],
  ['rocks',.308,41.1,.50],['bush',.373,45.9,.72],
  ['brokenFence',.414,29.2,.82],['outcrop',.455,48.2,.62],
  ['bush',.479,43.9,.53,true],
  ['fence',.551,31.3,.78],['bush',.590,44.6,.69],
  ['rocks',.630,38.5,.56,true],['log',.665,29.1,.74],
  ['bush',.700,42.0,.59,true],['brokenFence',.734,32.1,.72],
  ['stump',.766,39.1,.72],['bush',.800,47.4,.62],
  ['outcrop',.832,46.9,.58,true],['fence',.869,28.4,.76],
  ['bush',.910,40.0,.74,true],['rocks',.944,42.9,.44]
];


function ensureLanternLightTexture(scene,key,{innerColor='rgba(255,255,255,1)',midColor='rgba(255,255,255,0.35)',outerColor='rgba(255,255,255,0)',width=256,height=256,stops=[[0,1],[0.4,0.35],[1,0]],shape='radial'}={}){
  if(scene.textures.exists(key))return key;
  const texture=scene.textures.createCanvas(key,width,height);
  const ctx=texture?.getContext?.();
  if(!ctx)return key;
  ctx.clearRect(0,0,width,height);
  let gradient;
  if(shape==='linear-vertical'){
    gradient=ctx.createLinearGradient(width*.5,0,width*.5,height);
    for(const [offset,alpha] of stops)gradient.addColorStop(offset,midColor.replace(/\d?\.\d+\)$/,''));
  }
  const cx=width*.5, cy=height*.5;
  const rx=width*.5, ry=height*.5;
  // Draw with manual concentric ellipses for predictable feathering.
  for(let i=stops.length-1;i>=0;i--){
    const [offset,alpha]=stops[i];
    const r=1-offset;
    const color=(i===0?innerColor:(i===stops.length-1?outerColor:midColor)).replace(/rgba\(([^,]+),([^,]+),([^,]+),[^\)]+\)/,'rgba($1,$2,$3,'+alpha+')');
    ctx.fillStyle=color;
    ctx.beginPath();
    ctx.ellipse(cx,cy,Math.max(1,rx*r),Math.max(1,ry*r),0,0,Math.PI*2);
    ctx.fill();
  }
  texture.refresh();
  return key;
}

function addSoftLight(scene,key,x,y,width,height,{alpha=1,blend=Phaser.BlendModes.SCREEN,depth=660,rotation=0,originX=.5,originY=.5,tint=0xffffff}={}){
  return scene.add.image(x,y,key)
    .setOrigin(originX,originY)
    .setDisplaySize(width,height)
    .setTint(tint)
    .setAlpha(alpha)
    .setRotation(rotation)
    .setBlendMode(blend)
    .setDepth(depth);
}

export class OldRoadProps{
  constructor(territory){
    this.territory=territory;this.scene=territory.scene;this.props=[];this.lanterns=[];
    // Read the authoritative guide without moving any road or cliff object.
    const guide=territory.oldRoadEscarpment.route;
    this.segments=[];this.length=0;
    for(let i=1;i<guide.length;i++){
      const a=guide[i-1],b=guide[i],dx=b.x-a.x,dy=b.y-a.y,length=Math.hypot(dx,dy);
      if(length===0)continue;
      this.segments.push({a,b,dx:dx/length,dy:dy/length,length,start:this.length});
      this.length+=length;
    }
    const signRoutePoint=this.roadPoint(.07);
    const signX=signRoutePoint.x+signRoutePoint.dy*27.4;
    const signY=signRoutePoint.y-signRoutePoint.dx*27.4;
    this.place('aetherSign',signX,signY,.60,{role:'start-sign',fraction:.07,offset:27.4,side:'left-towards-city'});

    // Round 76: posicionamento medido diretamente no print de referência.
    // A base visível atual do poste e a marcação amarela foram medidas na mesma
    // captura. O delta de tela resultante foi convertido para pixels do jogo,
    // evitando nova estimativa visual. O conjunto inteiro é movido para a faixa
    // de grama marcada, com a base fora da estrada e sem mudar escala ou arte.
    // Métricas visuais dos PNGs na escala atual:
    // - base visível da placa ≈ (signX + 1.8, signY - 11.4)
    // - base visível do poste da lanterna ≈ (lanternX - 21.3, lanternY - 1.0)
    const signGroundX=signX+1.8;
    const signGroundY=signY-11.4;
    const lanternGroundX=signGroundX-106.3;
    const lanternGroundY=signGroundY-24.3;
    const lanternX=lanternGroundX+21.3;
    const lanternY=lanternGroundY+1.0;
    this.place('signLanternDay',lanternX,lanternY,.085,{
      role:'start-sign-lantern',light:'warm-lantern',side:'left-of-aether-sign'
    });
    this.placeOnShoulder('waystone',1/3,21.5,1.36,{role:'ruined-waystone'});
    for(const [key,fraction,offset,scale,flipX=false,angle=0] of DRESSING)
      this.placeOnShoulder(key,fraction,offset,scale,{flipX,role:'roadside',
        ...(angle?{rotation:angle*Math.PI/180,pivot:{x:38,y:121}}:{})});

    const road=this.scene.registry.get('oldRoadConnectorTest'),j=road.junction;
    // The red vertical mark locates the visible post, not its padded PNG anchor.
    // Position follows the marked grass pocket at the fork.
    // Do not mirror this sprite: its supplied lettering and arrows stay intact.
    this.place('junctionSign',j.center.x-8.4,j.center.y+9.1,.16,{
      role:'junction-sign',side:'junction-inner-grass',directions:{
        Aether:{...road.southGateTransition.connectors.to},
        'Estrada Velha':{...j.connectors.left},
        Arredores:{...j.connectors.right}
      }
    });
    this.scene.registry.set('oldRoadProps',{
      version:'B4.2C',scope:'old-road-immediate-left-edge-and-inner-junction',routeLength:this.length,
      props:this.props.map(({sprite,...p})=>p),
      functionalWaystones:0,addedCollisions:0,generatedAssets:0
    });
  }

  roadPoint(fraction){
    const distance=Math.max(0,Math.min(1,fraction))*this.length;
    const segment=this.segments.find(s=>distance<=s.start+s.length)??this.segments.at(-1);
    const local=distance-segment.start;
    return {x:segment.a.x+segment.dx*local,y:segment.a.y+segment.dy*local,dx:segment.dx,dy:segment.dy};
  }

  placeOnShoulder(key,fraction,offset,scale,options={}){
    const p=this.roadPoint(fraction);
    // Screen Y grows downwards, hence (dy,-dx) is the left normal.
    this.place(key,p.x+p.dy*offset,p.y-p.dx*offset,scale,{
      ...options,fraction,offset,side:'left-towards-city'
    });
  }

  place(key,x,y,scale,options={}){
    const art=OLD_ROAD_PROP_ASSETS[key],rotation=options.rotation??0;
    if(rotation){
      // Keep the first fence's existing rotation around its left post.
      // Then translate its visible base onto the supplied red line.
      const {width,height}=this.scene.textures.get(art.key).getSourceImage();
      const px=(options.pivot.x-art.originX*width)*scale;
      const py=(options.pivot.y-art.originY*height)*scale;
      const c=Math.cos(rotation),s=Math.sin(rotation);
      x+=px-px*c+py*s+9.6;y+=py-px*s-py*c+13.9;
    }
    const logical=this.territory.screenToLogical(x,y);
    const sprite=this.scene.add.image(x,y,art.key)
      .setOrigin(art.originX,art.originY).setScale(scale).setRotation(rotation)
      .setFlipX(!!options.flipX).setDepth(this.territory.depthAt(logical.u,logical.v,.07));
    const data={id:`old-road-prop-${String(this.props.length+1).padStart(2,'0')}`,
      asset:art.key,role:options.role,side:options.side??'junction-shoulder',light:options.light??null,
      fraction:options.fraction??null,offset:options.offset??null,
      permanent:true,functional:false,directions:options.directions??null};
    sprite.setData('oldRoadProp',data);
    this.territory.track(sprite,logical.u,logical.v,{alwaysActive:true});
    this.territory.config.registerOccluder?.(sprite,art.key,y,{behindMargin:5});
    // These are scenery, including the ruined waystone: no interaction,
    // waypoint registration, quest hooks or additional solid masks.
    const stored={...data,x,y,scale,flipX:!!options.flipX,...(rotation?{rotation}:{}),
      originX:art.originX,originY:art.originY,sprite};
    this.props.push(stored);
    if(options.light==='warm-lantern')this.attachLanternLight(stored);
  }

  lanternIntensity(timeOfDayMs=worldClock.timeOfDayMs){
    const minutes=((timeOfDayMs/60000)%1440+1440)%1440;
    if(minutes>=1200||minutes<270)return 1; // 20:00–04:30 permanece totalmente acesa
    if(minutes>=1155)return Math.max(0,Math.min(1,(minutes-1155)/45)); // 19:15–20:00 acende gradualmente
    if(minutes<360&&minutes>=270)return Math.max(0,Math.min(1,1-(minutes-270)/90)); // 04:30–06:00 apaga gradualmente
    return 0;
  }

  attachLanternLight(prop){
    const sprite=prop?.sprite;
    if(!sprite)return;
    const originX=prop.originX??.5;
    const originY=prop.originY??1;
    const localX=(.765-originX)*sprite.width*prop.scale;
    const localY=(.64-originY)*sprite.height*prop.scale;
    const glowX=sprite.x+localX;
    const glowY=sprite.y+localY;
    const groundX=glowX-6;
    const groundY=sprite.y-4;

    ensureLanternLightTexture(this.scene,'old-road-lantern-ground-soft',{
      width:512,height:320,
      innerColor:'rgba(255,250,236,0.92)',
      midColor:'rgba(255,235,185,0.38)',
      outerColor:'rgba(255,240,205,0)',
      stops:[[0,.92],[.18,.58],[.42,.26],[.72,.09],[1,0]]
    });
    ensureLanternLightTexture(this.scene,'old-road-lantern-ground-warm',{
      width:320,height:200,
      innerColor:'rgba(255,226,150,0.74)',
      midColor:'rgba(255,205,116,0.28)',
      outerColor:'rgba(255,205,116,0)',
      stops:[[0,.74],[.22,.46],[.48,.18],[.82,.05],[1,0]]
    });
    ensureLanternLightTexture(this.scene,'old-road-lantern-sign-bounce',{
      width:220,height:240,
      innerColor:'rgba(255,228,160,0.26)',
      midColor:'rgba(255,220,145,0.12)',
      outerColor:'rgba(255,220,145,0)',
      stops:[[0,.26],[.35,.17],[.68,.07],[1,0]]
    });
    ensureLanternLightTexture(this.scene,'old-road-lantern-lamp-aura',{
      width:128,height:128,
      innerColor:'rgba(255,244,205,0.90)',
      midColor:'rgba(255,227,160,0.26)',
      outerColor:'rgba(255,227,160,0)',
      stops:[[0,.90],[.22,.44],[.55,.12],[1,0]]
    });
    ensureLanternLightTexture(this.scene,'old-road-lantern-core',{
      width:72,height:72,
      innerColor:'rgba(255,252,236,1)',
      midColor:'rgba(255,246,214,0.42)',
      outerColor:'rgba(255,246,214,0)',
      stops:[[0,1],[.28,.48],[.64,.12],[1,0]]
    });

    const lightDepth=660;
    const ambientOuter=addSoftLight(this.scene,'old-road-lantern-ground-soft',groundX-18,groundY+10,330,180,{
      alpha:.30,blend:Phaser.BlendModes.SCREEN,depth:lightDepth,rotation:-.14
    });
    const ambientMid=addSoftLight(this.scene,'old-road-lantern-ground-soft',groundX-4,groundY+4,244,126,{
      alpha:.22,blend:Phaser.BlendModes.SCREEN,depth:lightDepth+.01,rotation:-.14,tint:0xfff6de
    });
    const ambientInner=addSoftLight(this.scene,'old-road-lantern-ground-warm',groundX+14,groundY-1,146,78,{
      alpha:.24,blend:Phaser.BlendModes.SCREEN,depth:lightDepth+.02,rotation:-.14,tint:0xffe3a8
    });
    const warmGround=addSoftLight(this.scene,'old-road-lantern-ground-warm',groundX+18,groundY-3,112,58,{
      alpha:.30,blend:Phaser.BlendModes.ADD,depth:lightDepth+.03,rotation:-.14,tint:0xffcb77
    });
    const signWash=addSoftLight(this.scene,'old-road-lantern-sign-bounce',groundX+22,groundY-32,90,104,{
      alpha:.16,blend:Phaser.BlendModes.SCREEN,depth:lightDepth+.04,rotation:-.06,tint:0xffe1a6
    });
    const lampAura=addSoftLight(this.scene,'old-road-lantern-lamp-aura',glowX,glowY+1,26,24,{
      alpha:.18,blend:Phaser.BlendModes.SCREEN,depth:lightDepth+.05,tint:0xffebba
    });
    const emberCore=addSoftLight(this.scene,'old-road-lantern-core',glowX,glowY,11,11,{
      alpha:.24,blend:Phaser.BlendModes.ADD,depth:lightDepth+.06,tint:0xfff8ea
    });

    for(const light of [ambientOuter,ambientMid,ambientInner,warmGround,signWash,lampAura,emberCore])
      this.territory.track(light,prop.x,prop.y,{alwaysActive:true});
    this.lanterns.push({
      sprite,ambientOuter,ambientMid,ambientInner,warmGround,signWash,lampAura,emberCore,
      dayKey:'old_road_sign_lantern_day_01',nightKey:'old_road_sign_lantern_night_01',isNightTexture:false,
      base:{ambientOuter:.32,ambientMid:.22,ambientInner:.22,warmGround:.28,signWash:.16,lampAura:.18,emberCore:.25}
    });
    this.updateLanterns();
  }

  updateLanterns(){
    const intensity=this.lanternIntensity();
    // O efeito agora privilegia a "abertura" da escuridão em volta da lanterna:
    // a faixa ampla usa SCREEN quase neutro, a área próxima recebe calor âmbar,
    // e só a chama/lâmpada usam um núcleo mais luminoso.
    const ambientLift=intensity<=0?0:Math.min(1,.10+.90*intensity);
    const warmLift=intensity<=0?0:Math.min(1,.08+.92*intensity);
    const coreLift=intensity<=0?0:Math.min(1,.06+.94*intensity);
    for(const lantern of this.lanterns){
      const useNightTexture=intensity>.02;
      if(useNightTexture!==lantern.isNightTexture){
        lantern.sprite.setTexture(useNightTexture?lantern.nightKey:lantern.dayKey);
        lantern.isNightTexture=useNightTexture;
      }
      const visible=intensity>.001;
      for(const key of ['ambientOuter','ambientMid','ambientInner','signWash']){
        const light=lantern[key];
        if(!light)continue;
        light.setVisible(visible).setAlpha(lantern.base[key]*ambientLift);
      }
      for(const key of ['warmGround']){
        const light=lantern[key];
        if(!light)continue;
        light.setVisible(visible).setAlpha(lantern.base[key]*warmLift);
      }
      for(const key of ['lampAura','emberCore']){
        const light=lantern[key];
        if(!light)continue;
        light.setVisible(visible).setAlpha(lantern.base[key]*coreLift);
      }
    }
  }
}

