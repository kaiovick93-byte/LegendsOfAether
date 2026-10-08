// @ts-nocheck
import {duskToDawnLightIntensity} from '../render/WorldLightingSystem';
// B4.2C: two translations from the supplied red marks; art and scale unchanged.
const asset=(key,originY)=>({key,path:`assets/images/environment/outskirts/old-road-props/${key}.png`,originX:.5,originY});
export const OLD_ROAD_PROP_ASSETS={
  aetherSign:asset('old_road_sign_aether_01',.9303),
  waystone:asset('old_road_waystone_ruined_01',.933),
  waystoneActivatedOverlay:asset('old_road_waystone_ruined_activated_overlay_01',.933),
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



export class OldRoadProps{
  constructor(territory){
    this.territory=territory;this.scene=territory.scene;this.props=[];this.lightHandles=[];this.ruinedWaystoneActivation=null;
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
    const startSign=this.place('aetherSign',signX,signY,.60,{role:'start-sign',fraction:.07,offset:27.4,side:'left-towards-city'});

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
    // Round 79.22 — interação e colisão usam a base REAL da placa, não o
    // centro/padding do PNG. A elipse física cobre somente poste/pedras no solo;
    // a elipse de interação começa logo fora dela, evitando F ao apenas passar
    // lateralmente pelo prop.
    this.configureNarrativePropPhysicalProfile(startSign,{
      groundX:signGroundX,groundY:signGroundY,
      collisionWidth:42,collisionHeight:18,collisionCenterYOffset:-7,
      interactionRadiusX:46,interactionRadiusY:27
    });
    const lanternGroundX=signGroundX-106.3;
    const lanternGroundY=signGroundY-24.3;
    const lanternX=lanternGroundX+21.3;
    const lanternY=lanternGroundY+1.0;
    this.place('signLanternDay',lanternX,lanternY,.085,{
      role:'start-sign-lantern',light:'warm-lantern',side:'left-of-aether-sign'
    });
    const ruinedWaystone=this.placeOnShoulder('waystone',1/3,21.5,1.36,{role:'ruined-waystone'});
    // O alpha útil do marco termina ~22 px acima da origem do PNG; na escala
    // 1.36 isso coloca o contato visual com o solo cerca de 30 px acima do
    // anchor. A colisão cobre a massa de pedras da base, nunca a coluna alta.
    this.configureNarrativePropPhysicalProfile(ruinedWaystone,{
      groundX:ruinedWaystone.x+2,groundY:ruinedWaystone.y-30,
      collisionWidth:132,collisionHeight:40,collisionCenterYOffset:-15,
      interactionRadiusX:94,interactionRadiusY:46
    });
    this.setupRuinedWaystoneActivation(ruinedWaystone);
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
      props:this.props.map(({sprite,solidMask,...p})=>p),
      functionalWaystones:0,addedCollisions:2,generatedAssets:1,ruinedWaystoneActivation:'Round79.20',
      narrativePropInteractionPhysics:'Round79.22'
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
    return this.place(key,p.x+p.dy*offset,p.y-p.dx*offset,scale,{
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
    // Props de estrada não recebem colisão funcional extra aqui. O Marco de
    // Senda destruído continua fora da rede de fast travel; sua ativação visual
    // é sincronizada pelo prólogo apenas quando o checkpoint é investigado.
    const stored={...data,x,y,scale,flipX:!!options.flipX,...(rotation?{rotation}:{}),
      originX:art.originX,originY:art.originY,sprite};
    this.props.push(stored);
    if(options.light==='warm-lantern')this.registerGlobalLanternLight(stored);
    return stored;
  }

  configureNarrativePropPhysicalProfile(prop,profile){
    if(!prop?.sprite||!profile)return null;
    const physical={
      round:'79.22',
      groundX:profile.groundX,groundY:profile.groundY,
      collision:{
        width:profile.collisionWidth,height:profile.collisionHeight,
        centerYOffset:profile.collisionCenterYOffset??0
      },
      interaction:{
        radiusX:profile.interactionRadiusX,radiusY:profile.interactionRadiusY
      }
    };
    prop.physical=physical;
    prop.sprite.setData?.('oldRoadNarrativePhysicalProfile',physical);

    const registerSolidMask=this.territory.config.registerSolidMask;
    if(registerSolidMask){
      prop.solidMask=registerSolidMask(prop.sprite,prop.asset,{
        label:prop.role==='start-sign'?'placa inicial da Estrada Velha':'Marco de Senda destruído',
        mode:'footprint',
        worldX:physical.groundX,worldY:physical.groundY,
        footprintWidth:physical.collision.width,
        footprintHeight:physical.collision.height,
        footprintYOffset:physical.collision.centerYOffset,
        owner:prop.sprite
      });
    }
    return physical;
  }

  setupRuinedWaystoneActivation(prop){
    const sprite=prop?.sprite;
    const art=OLD_ROAD_PROP_ASSETS.waystoneActivatedOverlay;
    if(!sprite||!art)return;

    const logical=this.territory.screenToLogical(sprite.x,sprite.y);
    const overlay=this.scene.add.image(sprite.x,sprite.y,art.key)
      .setOrigin(prop.originX??.5,prop.originY??.933)
      .setScale(prop.scale??1)
      .setDepth(sprite.depth+.018)
      .setAlpha(0)
      .setVisible(false);
    overlay.setName?.('old-road-ruined-waystone-activation-overlay');
    overlay.setData('ruinedWaystoneActivation',{round:'79.20',mode:'partial-emissive-overlay'});
    this.territory.track(overlay,logical.u,logical.v,{alwaysActive:true});

    const lighting=this.scene.worldLighting;
    let lightHandle=null;
    if(lighting?.registerLight){
      const runeOffsetX=(.592-(prop.originX??.5))*sprite.width*(prop.scale??1);
      const runeOffsetY=(.496-(prop.originY??.933))*sprite.height*(prop.scale??1);
      lightHandle=lighting.registerLight({
        id:'old-road-ruined-waystone-magic',
        source:sprite,
        offsetX:runeOffsetX,
        offsetY:runeOffsetY,
        groundOffsetX:-5,
        groundOffsetY:118,
        groundRadiusX:78,
        groundRadiusY:44,
        coreRadius:25,
        strength:.72,
        warmColor:0x55d7ff,
        warmAlpha:.052,
        schedule:(timeOfDayMs)=>.46+.54*duskToDawnLightIntensity(timeOfDayMs),
        enabled:false
      });
      if(lightHandle)this.lightHandles.push(lightHandle);
    }

    this.ruinedWaystoneActivation={prop,overlay,lightHandle,active:false,pulseTween:null};
    sprite.setData('ruinedWaystoneCheckpointVisual',{
      system:'WorldLightingSystem',
      overlay:art.key,
      lightId:'old-road-ruined-waystone-magic',
      round:'79.20',
      fastTravel:false
    });
  }

  setRuinedWaystoneActivated(active,{animate=false}={}){
    const state=this.ruinedWaystoneActivation;
    if(!state?.overlay)return;
    active=!!active;
    if(state.active===active&&state.overlay.visible===active)return;
    state.active=active;

    this.scene.tweens?.killTweensOf?.(state.overlay);
    state.pulseTween=null;
    state.lightHandle?.setEnabled?.(active);

    if(!active){
      state.overlay.setVisible(false).setAlpha(0);
      return;
    }

    const startPulse=()=>{
      if(!state.active||!state.overlay?.active)return;
      state.overlay.setAlpha(.66);
      state.pulseTween=this.scene.tweens.add({
        targets:state.overlay,alpha:{from:.60,to:.74},duration:1850,
        ease:'Sine.InOut',yoyo:true,repeat:-1
      });
    };

    state.overlay.setVisible(true);
    if(animate){
      state.overlay.setAlpha(.04);
      this.scene.tweens.add({
        targets:state.overlay,alpha:.94,duration:520,ease:'Quad.Out',
        yoyo:true,hold:120,repeat:0,onComplete:startPulse
      });
    }else startPulse();
  }

  registerGlobalLanternLight(prop){
    const sprite=prop?.sprite;
    const lighting=this.scene.worldLighting;
    if(!sprite||!lighting?.registerLight)return;

    const originX=prop.originX??.5;
    const originY=prop.originY??1;
    const localX=(.765-originX)*sprite.width*prop.scale;
    const localY=(.64-originY)*sprite.height*prop.scale;
    // Round 79.13 — polimento fino da lanterna.
    // A luz precisa tocar melhor o chão e a placa, sem voltar ao efeito de
    // holofote. Abrir um pouco mais a escuridão e deslocar a influência para
    // baixo/direita cria uma pequena zona segura mais natural.
    const groundOffsetX=18;
    const groundOffsetY=((sprite.y-4)-(sprite.y+localY))+16;
    let isNightTexture=false;

    const handle=lighting.registerLight({
      id:'old-road-start-sign-lantern',
      source:sprite,
      offsetX:localX,
      offsetY:localY,
      groundOffsetX,
      groundOffsetY,
      groundRadiusX:112,
      groundRadiusY:66,
      coreRadius:30,
      strength:.86,
      warmColor:0xffc56f,
      warmAlpha:.092,
      schedule:'dusk-to-dawn',
      onIntensityChange:(intensity)=>{
        // Round 79.15 — a chama não troca para o sprite noturno assim que
        // começa a curva das 19:15. O limiar de 18% coloca a mudança visual
        // por volta de 19:23, mantendo a progressão mais natural.
        const useNightTexture=intensity>.18;
        if(useNightTexture===isNightTexture)return;
        sprite.setTexture(useNightTexture?'old_road_sign_lantern_night_01':'old_road_sign_lantern_day_01');
        isNightTexture=useNightTexture;
      }
    });

    if(handle)this.lightHandles.push(handle);
    sprite.setData('worldLightSource',{
      system:'WorldLightingSystem',
      id:'old-road-start-sign-lantern',
      round:'79.15',
      schedule:'19:15-06:00',
      fullIntensityFrom:'20:00',
      legacyOverlaySpritesRemoved:true
    });
  }

  destroy(){
    const activation=this.ruinedWaystoneActivation;
    if(activation?.overlay){
      this.scene.tweens?.killTweensOf?.(activation.overlay);
      activation.overlay.destroy?.();
    }
    this.ruinedWaystoneActivation=null;
    for(const handle of this.lightHandles)handle?.destroy?.();
    this.lightHandles.length=0;
  }

}

