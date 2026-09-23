// @ts-nocheck
// Geometric fitting of the approved broken-wall PNG. No replacement artwork.
const BROKEN_FEET={left:{x:123,y:1076},right:{x:1370,y:651}};
export function brokenWallGroundTransform(project,u,start,end){
  const left=project(u,end),right=project(u,start);
  const p=BROKEN_FEET.left,q=BROKEN_FEET.right;
  // The standing left pier is 640 source pixels tall. Match the ~124px
  // standing piers of the normal wall, independently of the ground slope.
  const d=124/640,a=(right.x-left.x)/(q.x-p.x);
  const b=(right.y-left.y-d*(q.y-p.y))/(q.x-p.x);
  return {a,b,c:0,d,e:left.x-a*p.x,f:left.y-b*p.x-d*p.y};
}

export function createGroundedBrokenWall(scene,project,u,start,end){
  const source=scene.textures.get('iso_city_wall_broken').getSourceImage();
  const key='city_broken_wall_grounded',m=brokenWallGroundTransform(project,u,start,end);
  const point=(x,y)=>({x:m.a*x+m.e,y:m.b*x+m.d*y+m.f});
  const corners=[[0,0],[source.width,0],[0,source.height],[source.width,source.height]].map(([x,y])=>point(x,y));
  const left=Math.floor(Math.min(...corners.map(p=>p.x)))-2;
  const top=Math.floor(Math.min(...corners.map(p=>p.y)))-2;
  const width=Math.ceil(Math.max(...corners.map(p=>p.x)))-left+2;
  const height=Math.ceil(Math.max(...corners.map(p=>p.y)))-top+2;
  if(!scene.textures.exists(key)){
    const resolution=2,texture=scene.textures.createCanvas(key,width*resolution,height*resolution);
    const ctx=texture.getContext();
    ctx.setTransform(m.a*resolution,m.b*resolution,0,m.d*resolution,(m.e-left)*resolution,(m.f-top)*resolution);
    ctx.drawImage(source,0,0);texture.refresh();
    scene.events.once(Phaser.Scenes.Events.SHUTDOWN,()=>scene.textures.remove(key));
  }
  const pivot=project(u,(start+end)/2);
  return {key,originX:(pivot.x-left)/width,originY:(pivot.y-top)/height,scale:.5};
}

/** Hide only the wall pixels already covered by the unchanged gate pier.
 * This gives that small overlap the correct ordering without sorting the
 * entire gate above actors or adding another wall sprite. */
export function southWallJoinTexture(scene,wall,gate){
  const key='city_south_wall_join';
  if(scene.textures.exists(key))return key;
  const source=scene.textures.get('iso_city_wall').getSourceImage();
  const gateSource=scene.textures.get('iso_city_gate').getSourceImage();
  const texture=scene.textures.createCanvas(key,source.width,source.height),ctx=texture.getContext();
  ctx.drawImage(source,0,0);
  const wallLeft=wall.x-source.width*wall.scaleX*wall.originX;
  const wallTop=wall.y-source.height*wall.scaleY*wall.originY;
  const gateLeft=gate.x-gateSource.width*gate.scaleX*gate.originX;
  const gateTop=gate.y-gateSource.height*gate.scaleY*gate.originY;
  const direction=wall.flipX?-1:1;
  const x=(wall.flipX?source.width:0)+direction*(gateLeft-wallLeft)/wall.scaleX;
  ctx.globalCompositeOperation='destination-out';
  ctx.setTransform(direction*gate.scaleX/wall.scaleX,0,0,gate.scaleY/wall.scaleY,x,(gateTop-wallTop)/wall.scaleY);
  ctx.drawImage(gateSource,0,0);
  ctx.globalCompositeOperation='source-over';texture.refresh();
  scene.events.once(Phaser.Scenes.Events.SHUTDOWN,()=>scene.textures.remove(key));
  return key;
}

/** Bottom opaque contour, not the building's tall silhouette. The narrow
 * contact band is behind the visible feet, never beyond them on the grass. */
export function foundationColumns(mask,threshold=100){
  const bottom=new Int32Array(mask.width).fill(-1);
  for(let x=0;x<mask.width;x++)for(let y=mask.height-1;y>=0;y--){
    if(mask.alpha[y*mask.width+x]>=threshold){bottom[x]=y;break;}
  }
  // The arch's underside is overhead masonry, not a ground footprint.
  // This lower envelope is measured in the approved 1152 × 862 gate PNG.
  for(let x=0;x<mask.width;x++)if((x>530&&x<635)||bottom[x]<300+.43*x)bottom[x]=-1;
  return bottom;
}

export function isFoundationContact(columns,x,y,depth){
  const bottom=columns[Math.floor(x)]??-1;
  return bottom>=0&&y<=bottom+1&&y>=bottom-depth;
}
