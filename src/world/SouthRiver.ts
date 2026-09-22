// @ts-nocheck
/** Shared material and connector geometry for the river marked in RIO VERMELHO.
 * Geometry is projected from the same (u,v) plane as the city, never from UI pixels.
 * The old creek stamps are not used. This class owns only its ground art/current.
 */
export const SOUTH_RIVER_ASSET = Object.freeze({
  key: 'south_river_channel_material_01',
  path: 'assets/images/environment/outskirts/south-river/river_channel_material_01.png'
});

// Outside the SOUTH wall (v=26), then downstream past the front corner tower.
// The blue-marked residential/east side is deliberately outside this footprint.
export const SOUTH_RIVER_ROUTE = Object.freeze([
  {u:-.8,v:28.05,width:4.4}, {u:4,v:28.13,width:4.5},
  {u:9,v:28.25,width:4.5}, {u:14,v:28.43,width:4.2},
  {u:19.5,v:28.56,width:4.6}, {u:24.5,v:28.78,width:4.65},
  {u:28.2,v:29.2,width:4.7}, {u:31.5,v:30.25,width:4.8},
  {u:34.3,v:31.9,width:4.85}, {u:37,v:34,width:4.8}
]);

const lerp=(a,b,t)=>a+(b-a)*t;
const smooth=t=>{t=Math.max(0,Math.min(1,t));return t*t*(3-2*t);};
const cubic=(a,b,c,d,t)=>.5*((2*b)+(-a+c)*t+(2*a-5*b+4*c-d)*t*t+(-a+3*b-3*c+d)*t*t*t);

/** Straight and bend modules share their end cross-sections and material phase. */
export function southRiverSections(project) {
  const centers=[];
  for(let k=0;k<SOUTH_RIVER_ROUTE.length-1;k++) {
    const a=SOUTH_RIVER_ROUTE[Math.max(0,k-1)],b=SOUTH_RIVER_ROUTE[k];
    const c=SOUTH_RIVER_ROUTE[k+1],d=SOUTH_RIVER_ROUTE[Math.min(k+2,SOUTH_RIVER_ROUTE.length-1)];
    const count=Math.ceil(Math.hypot(c.u-b.u,c.v-b.v)*12);
    for(let j=0;j<count;j++) {
      const t=j/count;
      centers.push({u:cubic(a.u,b.u,c.u,d.u,t),v:cubic(a.v,b.v,c.v,d.v,t),width:lerp(b.width,c.width,smooth(t)),module:k});
    }
  }
  centers.push({...SOUTH_RIVER_ROUTE.at(-1),module:SOUTH_RIVER_ROUTE.length-2});
  let distance=0;
  const result=centers.map((p,i)=>{
    const a=centers[Math.max(0,i-1)],b=centers[Math.min(centers.length-1,i+1)];
    const du=b.u-a.u,dv=b.v-a.v,length=Math.hypot(du,dv);
    if(i)distance+=Math.hypot(p.u-centers[i-1].u,p.v-centers[i-1].v);
    const normal={u:-dv/length,v:du/length};
    return {...p,distance,normal,center:project(p.u,p.v)};
  });
  // A rounded terminal shoreline stays inside the end of the marked corridor.
  // Only the final cross-sections close; the water is broad for the whole run.
  const total=result.at(-1).distance;
  return result.map(p=>{
    const cap=Math.min(1,(total-p.distance)/1.75);
    const half=p.width*.5*Math.sqrt(Math.max(.0001,1-(1-cap)**2));
    return {...p,half,top:project(p.u-p.normal.u*half,p.v-p.normal.v*half),bottom:project(p.u+p.normal.u*half,p.v+p.normal.v*half)};
  });
}

/** Fine curved strips share a global UV phase and a subpixel bleed.
 * This avoids the transparent diagonal seams produced by separately clipped
 * triangles in Canvas, while retaining the same projected connectors.
 */
function strip(ctx,image,u0,u1,top0,top1,bottom0) {
  const run=u1-u0;
  if(run<.000001)return;
  const a=(top1.x-top0.x)/run,b=(top1.y-top0.y)/run;
  const c=(bottom0.x-top0.x)/image.height,d=(bottom0.y-top0.y)/image.height;
  const from=Math.max(0,u0-2),to=Math.min(image.width,u1+2);
  ctx.save();ctx.transform(a,b,c,d,top0.x-a*u0,top0.y-b*u0);
  ctx.drawImage(image,from,0,to-from,image.height,from,0,to-from,image.height);
  ctx.restore();
}

/** Same projection/UVs as the approved static art. A positive phase carries
 * water downstream along the route, including its bends and module joins.
 */
function paintMaterial(ctx,material,sections,phase=0) {
  const period=15,scale=material.width/period;
  for(let i=0;i<sections.length-1;i++) {
    const a=sections[i],b=sections[i+1],start=a.distance-phase,end=b.distance-phase;
    const cuts=[start],wrap=(Math.floor(start/period)+1)*period;
    if(wrap<end)cuts.push(wrap);
    cuts.push(end);
    for(let j=0;j<cuts.length-1;j++) {
      const t0=(cuts[j]-start)/(b.distance-a.distance),t1=(cuts[j+1]-start)/(b.distance-a.distance);
      const point=(p,q,t)=>({x:lerp(p.x,q.x,t),y:lerp(p.y,q.y,t)});
      const cycle=Math.floor((cuts[j]+.000001)/period)*period;
      strip(ctx,material,(cuts[j]-cycle)*scale,(cuts[j+1]-cycle)*scale,
        point(a.top,b.top,t0),point(a.top,b.top,t1),point(a.bottom,b.bottom,t0));
    }
  }
}

function canvas(width,height) {
  const result=document.createElement('canvas');result.width=width;result.height=height;return result;
}

/** Extract only the existing blue-green water pixels. The shallow stony
 * edges are deliberately excluded; this canvas is never a replacement asset.
 */
function waterMaterial(material) {
  const water=canvas(material.width,material.height),ctx=water.getContext('2d',{willReadFrequently:true});
  ctx.drawImage(material,0,0);
  const pixels=ctx.getImageData(0,0,water.width,water.height),rgba=pixels.data;
  for(let y=0;y<water.height;y++) {
    const across=y/water.height;
    const channel=smooth((across-.29)/.08)*smooth((.71-across)/.08);
    for(let x=0;x<water.width;x++) {
      const i=(y*water.width+x)*4,r=rgba[i],g=rgba[i+1],b=rgba[i+2];
      const wet=smooth((g-r-5)/14)*smooth((b-r-2)/12);
      rgba[i+3]=Math.round(rgba[i+3]*channel*wet);
    }
  }
  ctx.putImageData(pixels,0,0);
  return water;
}

export class SouthRiver {
  constructor(scene,{project,depth,groundMask}) {
    this.scene=scene;this.project=project;this.depth=depth;
    this.parts=[];this.keys=[];this.motionModules=[];this.flowTime=0;this.lastFrame=0;
    if(!scene.textures.exists(SOUTH_RIVER_ASSET.key))throw new Error('South River material was not preloaded');
    this.sections=southRiverSections(project);
    const source=scene.textures.get(SOUTH_RIVER_ASSET.key).getSourceImage();
    // Mirror-paired UVs give identical connectors, including shoreline pixels.
    // All modules use a global distance phase, so curves cannot reset the water.
    const material=document.createElement('canvas');material.width=source.width*2;material.height=source.height;
    const ctx=material.getContext('2d');ctx.drawImage(source,0,0);
    ctx.save();ctx.translate(material.width,0);ctx.scale(-1,1);ctx.drawImage(source,0,0);ctx.restore();
    this.flowMaterial=waterMaterial(material);
    const mask=groundMask?.createGeometryMask();
    this.mask=mask;
    for(let k=0;k<SOUTH_RIVER_ROUTE.length-1;k++) {
      const first=this.sections.findIndex(p=>p.module===k);
      const next=this.sections.findIndex(p=>p.module===k+1);
      const sections=this.sections.slice(first,next<0?undefined:next+1);
      this.buildModule(material,sections,k,mask);
    }
    // The approved atlas is oversampled relative to the projected water.
    // Keep the banks/baseline/masks at full resolution; resample only the
    // moving source once, instead of doing that work for every tiny strip.
    const flowCanvas=canvas(this.flowMaterial.width/2,this.flowMaterial.height/2);
    const flowContext=flowCanvas.getContext('2d');flowContext.imageSmoothingQuality='high';
    flowContext.drawImage(this.flowMaterial,0,0,flowCanvas.width,flowCanvas.height);
    this.flowSource=flowCanvas;
    this.flowMaterial.width=this.flowMaterial.height=1;
    // An immutable bitmap avoids repeatedly copying the source canvas while
    // painting the narrow curved strips. Canvas remains the safe fallback.
    if(typeof createImageBitmap==='function')this.flowReady=createImageBitmap(flowCanvas).then(bitmap=>{
      if(this.destroyed){bitmap.close();return;}
      this.flowSource=bitmap;
      flowCanvas.width=flowCanvas.height=1;
    }).catch(()=>{});
    this.update=this.update.bind(this);this.destroy=this.destroy.bind(this);
    scene.events.on(Phaser.Scenes.Events.UPDATE,this.update);
    scene.events.once(Phaser.Scenes.Events.SHUTDOWN,this.destroy);
  }

  buildModule(material,sections,index,mask) {
    const all=sections.flatMap(p=>[p.top,p.bottom]);
    const x=Math.floor(Math.min(...all.map(p=>p.x)))-2,y=Math.floor(Math.min(...all.map(p=>p.y)))-2;
    const w=Math.ceil(Math.max(...all.map(p=>p.x)))-x+2,h=Math.ceil(Math.max(...all.map(p=>p.y)))-y+2;
    const density=2,key=`south_river_module_${index}`;
    if(this.scene.textures.exists(key))this.scene.textures.remove(key);
    const texture=this.scene.textures.createCanvas(key,w*density,h*density),ctx=texture.getContext();
    ctx.scale(density,density);ctx.translate(-x,-y);
    paintMaterial(ctx,material,sections);
    // The alpha is native to the material; no rectangular grass slab is added.
    texture.refresh();this.keys.push(key);
    const part=this.scene.add.image(x,y,key).setOrigin(0).setScale(1/density).setDepth(this.depth);
    part.setData('aetherRenderClass','ground').setData('southRiverModule',{index,from:sections[0].distance,to:sections.at(-1).distance});
    if(mask)part.setMask(mask);this.parts.push(part);

    const baseline=canvas(w*density,h*density),fixedMask=canvas(w*density,h*density);
    baseline.getContext('2d').drawImage(texture.getSourceImage(),0,0);
    const maskContext=fixedMask.getContext('2d');
    maskContext.scale(density,density);maskContext.translate(-x,-y);
    paintMaterial(maskContext,this.flowMaterial,sections);
    // The static silhouette/mask keeps every approved section. Water sampling
    // can interpolate over three of those tiny sections (about 12 screen px),
    // keeping the shared endpoints while reducing per-frame Canvas work.
    const flowSections=sections.filter((_p,i)=>i%3===0||i===sections.length-1);
    const motion={texture,baseline,fixedMask,frame:canvas(w*density,h*density),sections:flowSections,x,y,w,h,density};
    this.motionModules.push(motion);

    if(sections.some(p=>p.u>=11.7&&p.u<=16.4)) {
      const waterKey=`${key}_crossing`,water=this.scene.textures.createCanvas(waterKey,w*density,h*density),wc=water.getContext();
      // Reuse exactly the existing crossing clip, depth and opacity. Only the
      // water pixels inside this same texture change; the road is not edited.
      motion.refreshCrossing=()=>{
      wc.clearRect(0,0,w*density,h*density);
      wc.save();wc.scale(density,density);wc.translate(-x,-y);
      wc.beginPath();
      for(const [i,p] of sections.entries()) {
        const a=this.project(p.u-p.normal.u*p.half*.57,p.v-p.normal.v*p.half*.57);
        if(i===0)wc.moveTo(a.x,a.y);else wc.lineTo(a.x,a.y);
      }
      for(const p of [...sections].reverse()) {const b=this.project(p.u+p.normal.u*p.half*.57,p.v+p.normal.v*p.half*.57);wc.lineTo(b.x,b.y);}
      wc.closePath();wc.clip();wc.setTransform(1,0,0,1,0,0);
      wc.drawImage(texture.getSourceImage(),0,0);wc.restore();
      water.refresh();
      };
      motion.refreshCrossing();this.keys.push(waterKey);
      const surface=this.scene.add.image(x,y,waterKey).setOrigin(0).setScale(1/density).setDepth(this.depth+20.8).setAlpha(.9).setData('aetherRenderClass','ground');
      if(mask)surface.setMask(mask);this.parts.push(surface);
    }
  }

  update(time,delta) {
    if(this.destroyed)return;
    if(!Number.isFinite(delta))delta=this.lastTime===undefined?0:time-this.lastTime;
    this.lastTime=time;
    // Cosmetic flow never jumps after a suspended tab or a long loading frame.
    this.flowTime+=Math.max(0,Math.min(delta,100));
    const frame=Math.floor((this.flowTime+.000001)/(1000/30));
    if(frame===this.lastFrame)return;
    this.lastFrame=frame;
    const phase=(this.flowTime*.00014)%15,view=this.scene.cameras?.main?.worldView;
    for(const module of this.motionModules) {
      if(view?.width>0&&view?.height>0&&(module.x+module.w<view.x||module.x>view.x+view.width||module.y+module.h<view.y||module.y>view.y+view.height))continue;
      this.drawWater(module,phase);
    }
  }

  drawWater(module,phase) {
    const {texture,baseline,fixedMask,frame,sections,x,y,density}=module;
    const moving=frame.getContext('2d');
    moving.clearRect(0,0,frame.width,frame.height);
    moving.save();moving.scale(density,density);moving.translate(-x,-y);
    paintMaterial(moving,this.flowSource,sections,phase);
    moving.restore();
    // A FIXED mask protects every bank/stone pixel, even as source water moves.
    moving.globalCompositeOperation='destination-in';
    moving.drawImage(fixedMask,0,0);
    moving.globalCompositeOperation='source-over';
    const target=texture.getContext();
    target.save();target.setTransform(1,0,0,1,0,0);
    target.clearRect(0,0,frame.width,frame.height);
    target.drawImage(baseline,0,0);
    target.globalAlpha=.86;target.drawImage(frame,0,0);
    target.restore();texture.refresh();
    module.refreshCrossing?.();
  }

  destroy() {
    if(this.destroyed)return;this.destroyed=true;
    this.scene.events.off(Phaser.Scenes.Events.UPDATE,this.update);
    this.scene.events.off(Phaser.Scenes.Events.SHUTDOWN,this.destroy);
    this.parts.forEach(p=>p.destroy());this.mask?.destroy();
    this.keys.forEach(key=>this.scene.textures.remove(key));
    for(const module of this.motionModules)for(const buffer of [module.baseline,module.fixedMask,module.frame])buffer.width=buffer.height=1;
    this.motionModules=[];
    this.flowSource?.close?.();
    if(this.flowSource?.getContext)this.flowSource.width=this.flowSource.height=1;
    if(this.flowMaterial)this.flowMaterial.width=this.flowMaterial.height=1;
  }
}
