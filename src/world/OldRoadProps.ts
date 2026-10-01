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
  ['bush',.479,43.9,.53,true],['stump',.516,43.1,.82],
  ['fence',.551,31.3,.78],['bush',.590,44.6,.69],
  ['rocks',.630,38.5,.56,true],['log',.665,29.1,.74],
  ['bush',.700,42.0,.59,true],['brokenFence',.734,32.1,.72],
  ['stump',.766,39.1,.72],['bush',.800,47.4,.62],
  ['outcrop',.832,46.9,.58,true],['fence',.869,28.4,.76],
  ['bush',.910,40.0,.74,true],['rocks',.944,42.9,.44]
];

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
    const groundX=glowX-8;
    const groundY=sprite.y-4;
    // A camada global de noite fica em depth 650. Estes brilhos locais ficam
    // logo acima dela (e ainda abaixo da HUD), mas agora a maior parte do efeito
    // usa SCREEN em tons quase neutros para "abrir" a escuridão ao redor da
    // lanterna, em vez de simplesmente pintar um círculo amarelo por cima.
    //
    // Estrutura do efeito:
    // - 3 elipses largas e frias/quase neutras levantam a leitura do chão;
    // - 1 núcleo âmbar pequeno aquece somente a área mais próxima da chama;
    // - 1 lavagem discreta ajuda a placa/poste a receber luz;
    // - 2 halos pequenos ficam só no lampião, sem formar orb artificial.
    const lightDepth=660;
    const ambientOuter=this.scene.add.ellipse(groundX-10,groundY+8,330,182,0xf2f6ff,.16)
      .setDepth(lightDepth).setBlendMode(Phaser.BlendModes.SCREEN);
    const ambientMid=this.scene.add.ellipse(groundX-2,groundY+2,236,126,0xffffff,.20)
      .setDepth(lightDepth+.01).setBlendMode(Phaser.BlendModes.SCREEN);
    const ambientInner=this.scene.add.ellipse(groundX+4,groundY-3,150,82,0xfff8e4,.16)
      .setDepth(lightDepth+.02).setBlendMode(Phaser.BlendModes.SCREEN);
    const warmGround=this.scene.add.ellipse(groundX+8,groundY-4,110,62,0xffd387,.18)
      .setDepth(lightDepth+.03).setBlendMode(Phaser.BlendModes.ADD);
    const signWash=this.scene.add.ellipse(groundX+20,groundY-24,88,60,0xffdb9a,.08)
      .setDepth(lightDepth+.04).setBlendMode(Phaser.BlendModes.SCREEN);
    const lampAura=this.scene.add.ellipse(glowX,glowY+1,20,16,0xffe7b2,.08)
      .setDepth(lightDepth+.05).setBlendMode(Phaser.BlendModes.SCREEN);
    const emberCore=this.scene.add.ellipse(glowX,glowY,10,8,0xffffec,.14)
      .setDepth(lightDepth+.06).setBlendMode(Phaser.BlendModes.ADD);
    for(const light of [ambientOuter,ambientMid,ambientInner,warmGround,signWash,lampAura,emberCore])
      this.territory.track(light,prop.x,prop.y,{alwaysActive:true});
    this.lanterns.push({
      sprite,ambientOuter,ambientMid,ambientInner,warmGround,signWash,lampAura,emberCore,
      dayKey:'old_road_sign_lantern_day_01',nightKey:'old_road_sign_lantern_night_01',isNightTexture:false,
      base:{ambientOuter:.18,ambientMid:.20,ambientInner:.16,warmGround:.14,signWash:.08,lampAura:.11,emberCore:.17}
    });
    this.updateLanterns();
  }

  updateLanterns(){
    const intensity=this.lanternIntensity();
    // O efeito agora privilegia a "abertura" da escuridão em volta da lanterna:
    // a faixa ampla usa SCREEN quase neutro, a área próxima recebe calor âmbar,
    // e só a chama/lâmpada usam um núcleo mais luminoso.
    const ambientLift=intensity<=0?0:Math.min(1,.24+.76*intensity);
    const warmLift=intensity<=0?0:Math.min(1,.16+.84*intensity);
    const coreLift=intensity<=0?0:Math.min(1,.12+.88*intensity);
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

