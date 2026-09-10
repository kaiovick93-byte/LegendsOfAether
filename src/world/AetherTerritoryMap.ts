// @ts-nocheck
import {
  AETHER_LOGICAL_BOUNDS,AETHER_OLD_ROAD
} from './AetherTerritoryLayout';

export const AETHER_TERRITORY_MAP_KEY='aether_territory_map_v2';
export const AETHER_TERRITORY_MAP_SIZE={width:1024,height:768};

/** Projeção compartilhada pela pintura, pelo MapPanel e pelo minimapa. */
export function territoryMapNormalized(point={}){
  const u=Number.isFinite(point.u)?point.u:Number.isFinite(point.isoX)?point.isoX:0;
  const v=Number.isFinite(point.v)?point.v:Number.isFinite(point.isoY)?point.isoY:0;
  const span=AETHER_LOGICAL_BOUNDS.maxU-AETHER_LOGICAL_BOUNDS.minU;
  return{
    x:.5+(u-v)/span*.41,
    y:.22+(u+v)/(span*2)*.56
  };
}

function mapPoint(point){
  const normalized=territoryMapNormalized(point);
  return{x:normalized.x*AETHER_TERRITORY_MAP_SIZE.width,y:normalized.y*AETHER_TERRITORY_MAP_SIZE.height};
}

function traceLogicalPath(context,points){
  if(!points?.length)return;
  const first=mapPoint(points[0]);
  context.beginPath();context.moveTo(first.x,first.y);
  for(let index=1;index<points.length;index++){
    const point=mapPoint(points[index]);context.lineTo(point.x,point.y);
  }
}

function drawRoad(context,points,width=10){
  context.save();context.lineCap='round';context.lineJoin='round';
  traceLogicalPath(context,points);context.strokeStyle='rgba(70,49,32,.68)';context.lineWidth=width+5;context.stroke();
  traceLogicalPath(context,points);context.strokeStyle='rgba(183,145,91,.96)';context.lineWidth=width;context.stroke();
  traceLogicalPath(context,points);context.strokeStyle='rgba(221,188,132,.35)';context.lineWidth=Math.max(1,width*.18);context.stroke();
  context.restore();
}

function ellipseFromLogical(context,u,v,radiusU,radiusV,fill,stroke){
  const center=mapPoint({u,v});
  const pu=mapPoint({u:u+radiusU,v}),pv=mapPoint({u,v:v+radiusV});
  const radiusX=Math.max(Math.abs(pu.x-center.x),Math.abs(pv.x-center.x));
  const radiusY=Math.max(Math.abs(pu.y-center.y),Math.abs(pv.y-center.y));
  context.beginPath();context.ellipse(center.x,center.y,radiusX,radiusY,0,0,Math.PI*2);
  if(fill){context.fillStyle=fill;context.fill()}
  if(stroke){context.strokeStyle=stroke;context.lineWidth=2;context.stroke()}
}

function drawDeterministicGround(context){
  const {width,height}=AETHER_TERRITORY_MAP_SIZE;
  const gradient=context.createLinearGradient(0,0,0,height);
  gradient.addColorStop(0,'#223f33');gradient.addColorStop(.58,'#476640');gradient.addColorStop(1,'#344d32');
  context.fillStyle=gradient;context.fillRect(0,0,width,height);
  let seed=0x6a37b4d1;
  const random=()=>{seed=(seed*1664525+1013904223)>>>0;return seed/0xffffffff};
  for(let index=0;index<1550;index++){
    const x=random()*width,y=random()*height,r=.45+random()*1.65;
    context.fillStyle=random()>.5?'rgba(215,218,145,.10)':'rgba(12,43,32,.14)';
    context.beginPath();context.arc(x,y,r,0,Math.PI*2);context.fill();
  }
}

function drawCityPlate(scene,context){
  if(!scene.textures.exists('city_map_exact_2_5d'))return;
  const corners=[mapPoint({u:2,v:2}),mapPoint({u:26,v:2}),mapPoint({u:26,v:26}),mapPoint({u:2,v:26})];
  context.save();context.beginPath();context.moveTo(corners[0].x,corners[0].y);
  for(let index=1;index<corners.length;index++)context.lineTo(corners[index].x,corners[index].y);
  context.closePath();context.clip();
  const minX=Math.min(...corners.map(point=>point.x)),maxX=Math.max(...corners.map(point=>point.x));
  const minY=Math.min(...corners.map(point=>point.y)),maxY=Math.max(...corners.map(point=>point.y));
  const crop={x:72,y:154,width:880,height:448};
  const source=scene.textures.get('city_map_exact_2_5d').getSourceImage();
  const scale=Math.min((maxX-minX)/crop.width,(maxY-minY)/crop.height);
  const width=crop.width*scale,height=crop.height*scale;
  context.drawImage(source,crop.x,crop.y,crop.width,crop.height,(minX+maxX-width)/2,(minY+maxY-height)/2,width,height);
  context.restore();
  context.save();context.strokeStyle='rgba(229,203,145,.68)';context.lineWidth=2;
  context.beginPath();context.moveTo(corners[0].x,corners[0].y);
  for(let index=1;index<corners.length;index++)context.lineTo(corners[index].x,corners[index].y);
  context.closePath();context.stroke();context.restore();
}

function drawTerritoryFeatures(scene,context){
  // Prompt 9D-B3.6A: o mapa completo espelha o reset visual físico. A base
  // já foi desenhada por drawDeterministicGround; apenas a Estrada Velha e a
  // Cidade preservada continuam visíveis nos Arredores durante esta fase.
  drawRoad(context,AETHER_OLD_ROAD,12);
  drawCityPlate(scene,context);
}

export function ensureAetherTerritoryMap(scene){
  if(scene.textures.exists(AETHER_TERRITORY_MAP_KEY))return AETHER_TERRITORY_MAP_KEY;
  const texture=scene.textures.createCanvas(AETHER_TERRITORY_MAP_KEY,AETHER_TERRITORY_MAP_SIZE.width,AETHER_TERRITORY_MAP_SIZE.height);
  const context=texture.getContext();
  drawDeterministicGround(context);
  drawTerritoryFeatures(scene,context);
  texture.refresh();
  return AETHER_TERRITORY_MAP_KEY;
}
