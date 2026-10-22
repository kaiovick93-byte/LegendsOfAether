// @ts-nocheck
/** The single crossing drawn in the supplied red-marked South Gate reference. */
export const SOUTH_BRIDGE_ASSET = Object.freeze({
  key:'old_stone_bridge_01',
  path:'assets/images/environment/outskirts/south-bridge/old_stone_bridge_01.png'
});

// Coordinates of the two landings, measured against the unchanged gate art.
// The small lateral offset follows the approved road, rather than moving it.
export const SOUTH_BRIDGE = Object.freeze({
  city:{u:13.97,v:27.12}, road:{u:14.27,v:30.12},
  halfWidth:.85, parapetWidth:.34
});

export function bridgeCenterU(v) {
  const b=SOUTH_BRIDGE;
  return b.city.u+(v-b.city.v)*(b.road.u-b.city.u)/(b.road.v-b.city.v);
}

/** Footprint-aware collision, using the SAME curved sections as the water art.
 * Banks stay walkable. Only the water and the new stone parapets are solid.
 */
export class SouthRiverCrossing {
  constructor(sections) {
    this.segments=sections.slice(1).map((p,i)=>{
      const a=sections[i],du=p.u-a.u,dv=p.v-a.v;
      return {a,b:p,du,dv,length2:du*du+dv*dv,
        minU:Math.min(a.u,p.u)-3,maxU:Math.max(a.u,p.u)+3,
        minV:Math.min(a.v,p.v)-3,maxV:Math.max(a.v,p.v)+3};
    });
  }

  waterContact(u,v,radius=0) {
    let nearest=null;
    for(const s of this.segments) {
      if(u<s.minU-radius||u>s.maxU+radius||v<s.minV-radius||v>s.maxV+radius)continue;
      const t=Math.max(0,Math.min(1,((u-s.a.u)*s.du+(v-s.a.v)*s.dv)/s.length2));
      const cu=s.a.u+t*s.du,cv=s.a.v+t*s.dv;
      const distance=Math.hypot(u-cu,v-cv);
      // The material's outer 21% on either side is the existing dry bank.
      const half=(s.a.half+(s.b.half-s.a.half)*t)*.58;
      const clearance=distance-half-radius;
      if(!nearest||clearance<nearest.clearance)nearest={u:cu,v:cv,half,clearance,
        normal:{u:-s.dv/Math.sqrt(s.length2),v:s.du/Math.sqrt(s.length2)}};
    }
    return nearest;
  }

  isPassage(u,v,radius=0) {
    const b=SOUTH_BRIDGE,margin=radius*Math.hypot(1,.1);
    return v>=b.city.v-radius&&v<=b.road.v+radius&&
      Math.abs(u-bridgeCenterU(v))+margin<=b.halfWidth;
  }

  isBlocked(u,v,radius=.27) {
    const b=SOUTH_BRIDGE,margin=radius*Math.hypot(1,.1);
    const lateral=Math.abs(u-bridgeCenterU(v));
    if(v+radius>=b.city.v&&v-radius<=b.road.v&&
      lateral+margin>b.halfWidth&&lateral-margin<b.halfWidth+b.parapetWidth)return true;
    if(this.isPassage(u,v,radius))return false;
    return (this.waterContact(u,v,radius)?.clearance??Infinity)<0;
  }

  /** Older saves could stand in this previously non-solid river. Move only
   * an invalid starting footprint to its nearest reachable dry landing/bank.
   */
  recoverPosition(u,v,radius,isValid) {
    if(!this.isBlocked(u,v,radius))return null;
    const candidates=[],b=SOUTH_BRIDGE,contact=this.waterContact(u,v,radius);
    if(contact)for(const side of [-1,1]) {
      const d=contact.half+radius+.15;
      candidates.push({u:contact.u+contact.normal.u*d*side,v:contact.v+contact.normal.v*d*side});
    }
    for(const v2 of [b.city.v-radius-.15,b.road.v+radius+.15,
      Math.max(b.city.v,Math.min(b.road.v,v))])candidates.push({u:bridgeCenterU(v2),v:v2});
    candidates.sort((a,b)=>Math.hypot(a.u-u,a.v-v)-Math.hypot(b.u-u,b.v-v));
    return candidates.find(p=>!this.isBlocked(p.u,p.v,radius)&&isValid(p.u,p.v))??null;
  }
}

// Source deck anchors: near-left, near-right and far-left at ground level.
// A single affine projection fits the finished sprite to the real landings.
const ART={nearLeft:{x:113,y:756},nearRight:{x:515,y:1040},farLeft:{x:775,y:337}};
export function bridgeArtTransform(project) {
  const b=SOUTH_BRIDGE,p=project(b.road.u-b.halfWidth,b.road.v);
  const q=project(b.road.u+b.halfWidth,b.road.v),r=project(b.city.u-b.halfWidth,b.city.v);
  const s=ART.nearLeft,wx=ART.nearRight.x-s.x,wy=ART.nearRight.y-s.y;
  const lx=ART.farLeft.x-s.x,ly=ART.farLeft.y-s.y,det=wx*ly-wy*lx;
  const a=((q.x-p.x)*ly-(r.x-p.x)*wy)/det;
  const c=(-(q.x-p.x)*lx+(r.x-p.x)*wx)/det;
  const bb=((q.y-p.y)*ly-(r.y-p.y)*wy)/det;
  const d=(-(q.y-p.y)*lx+(r.y-p.y)*wx)/det;
  return {a,b:bb,c,d,e:p.x-a*s.x-c*s.y,f:p.y-bb*s.x-d*s.y};
}

// Inner coping edge of the near parapet. Only this stone face can cover an
// actor's lower body; the entire bridge is never sorted over the character.
const FRONT_EDGE=[[509,1047],[540,909],[624,853],[689,812],[772,756],
  [854,701],[939,643],[1104,560],[1113,518],[1165,486],[1215,528],
  [1254,700],[1254,1254],[460,1254]];

export class SouthRiverBridge extends SouthRiverCrossing {
  constructor(scene,{project,depthBase,sections}) {
    super(sections);this.scene=scene;this.parts=[];this.keys=[];
    if(!scene.textures.exists(SOUTH_BRIDGE_ASSET.key))throw new Error('South bridge was not preloaded');
    const source=scene.textures.get(SOUTH_BRIDGE_ASSET.key).getSourceImage();
    const m=bridgeArtTransform(project),point=(x,y)=>({x:m.a*x+m.c*y+m.e,y:m.b*x+m.d*y+m.f});
    const corners=[[0,0],[source.width,0],[source.width,source.height],[0,source.height]].map(([x,y])=>point(x,y));
    const x=Math.floor(Math.min(...corners.map(p=>p.x)))-1,y=Math.floor(Math.min(...corners.map(p=>p.y)))-1;
    const width=Math.ceil(Math.max(...corners.map(p=>p.x)))-x+1,height=Math.ceil(Math.max(...corners.map(p=>p.y)))-y+1;
    const density=2,key='south_bridge_ground';
    const texture=this.makeTexture(key,width*density,height*density),ctx=texture.getContext();
    ctx.scale(density,density);ctx.translate(-x,-y);
    ctx.transform(m.a,m.b,m.c,m.d,m.e,m.f);ctx.drawImage(source,0,0);texture.refresh();
    this.addPart(x,y,key,depthBase-53,density);

    // Bake just once, then split on exact raster columns for continuous stone
    // edges and local isometric sorting along the full length of the parapet.
    const front=document.createElement('canvas');front.width=width*density;front.height=height*density;
    const fc=front.getContext('2d');fc.scale(density,density);fc.translate(-x,-y);
    fc.transform(m.a,m.b,m.c,m.d,m.e,m.f);fc.beginPath();
    FRONT_EDGE.forEach(([px,py],i)=>i?fc.lineTo(px,py):fc.moveTo(px,py));
    fc.closePath();fc.clip();fc.drawImage(source,0,0);
    const b=SOUTH_BRIDGE,near=project(b.road.u+b.halfWidth,b.road.v),far=project(b.city.u+b.halfWidth,b.city.v);
    const sliceWidth=16*density;
    for(let sx=0,index=0;sx<front.width;sx+=sliceWidth,index++) {
      const sw=Math.min(sliceWidth,front.width-sx),stripKey=`south_bridge_parapet_${index}`;
      const strip=this.makeTexture(stripKey,sw,front.height);
      strip.getContext().drawImage(front,sx,0,sw,front.height,0,0,sw,front.height);strip.refresh();
      const midX=x+(sx+sw/2)/density,t=Math.max(0,Math.min(1,(midX-near.x)/(far.x-near.x)));
      const u=b.road.u+(b.city.u-b.road.u)*t+b.halfWidth+.12;
      const v=b.road.v+(b.city.v-b.road.v)*t;
      this.addPart(x+sx/density,y,stripKey,depthBase+(u+v)*100+.08,density);
    }
    front.width=front.height=1;
    this.destroy=this.destroy.bind(this);
    scene.events.once(Phaser.Scenes.Events.SHUTDOWN,this.destroy);
  }

  makeTexture(key,width,height) {
    if(this.scene.textures.exists(key))this.scene.textures.remove(key);
    this.keys.push(key);return this.scene.textures.createCanvas(key,width,height);
  }

  addPart(x,y,key,depth,density) {
    const image=this.scene.add.image(x,y,key).setOrigin(0).setScale(1/density).setDepth(depth);
    image.setData('southRiverBridge',true);this.parts.push(image);return image;
  }

  destroy() {
    if(this.destroyed)return;this.destroyed=true;
    this.scene.events.off(Phaser.Scenes.Events.SHUTDOWN,this.destroy);
    this.parts.forEach(p=>p.destroy());this.parts=[];
    this.keys.forEach(key=>this.scene.textures.remove(key));this.keys=[];
  }
}
