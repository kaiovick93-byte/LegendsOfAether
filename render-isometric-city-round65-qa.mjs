import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {execFileSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';

const root=path.dirname(fileURLToPath(import.meta.url));
const temp=fs.mkdtempSync(path.join(os.tmpdir(),'aether-round65-'));
const canvas=path.join(temp,'canvas.miff');
const output=path.join(root,'ROUND65_CITY_VISUAL_QA.png');
const project=(u,v)=>({x:1600+(u-v)*48,y:250+(u+v)*24});
const asset=relative=>path.join(root,relative);
const run=(name,args)=>execFileSync(name,args,{stdio:'ignore'});

run('convert',['-size','3200x1900','xc:#0c1717',canvas]);

let layerIndex=0;
const prepared=new Map();
const prepare=(relative,width,height,flip=false)=>{
 const key=[relative,Math.round(width),Math.round(height),flip].join('|');
 if(prepared.has(key))return prepared.get(key);
 const target=path.join(temp,`asset-${prepared.size}.png`);
 const args=[asset(relative)];
 if(flip)args.push('-flop');
 args.push('-filter','Mitchell','-resize',`${Math.round(width)}x${Math.round(height)}!`,target);
 run('convert',args);prepared.set(key,target);return target;
};
const composite=(source,left,top)=>{
 const next=path.join(temp,`layer-${layerIndex++}.miff`);
 run('composite',['-geometry',`+${Math.round(left)}+${Math.round(top)}`,source,canvas,next]);
 fs.renameSync(next,canvas);
};
const centered=(relative,x,y,width,height,originY=.5,flip=false)=>{
 composite(prepare(relative,width,height,flip),x-width/2,y-height*originY);
};

centered('assets/images/environment/isometric/isometric_city_grass.png',1600,922,2688,1344,.5);
centered('assets/images/environment/isometric/isometric_city_pavement.png',1600,922,2304,1152,.5);

const buildings=[
 {id:'merchant',key:'merchant_shop',u:6.60,v:13.35,height:238,rect:[4.95,11.85,3.25,2.90]},
 {id:'scholar',key:'scholar_house',u:6.40,v:8.35,height:232,rect:[4.75,6.85,3.25,2.90]},
 {id:'blacksmith',key:'blacksmith_shop',u:10.00,v:6.30,height:225,rect:[8.30,4.80,3.40,2.90]},
 {id:'healer',key:'healer_house',u:14.85,v:6.30,height:232,rect:[13.10,4.80,3.50,2.90]},
 {id:'tavern',key:'tavern_house',u:19.55,v:6.65,height:238,rect:[17.70,5.10,3.70,3.00]},
 {id:'artisan',key:'artisan_house',u:17.80,v:11.20,height:230,rect:[16.10,9.65,3.40,3.00]},
 {id:'house_red',key:'residential_house_red',u:4.60,v:19.00,height:218,rect:[3.20,17.45,2.80,2.70]},
 {id:'house_green',key:'residential_house_green',u:7.80,v:19.00,height:218,rect:[6.40,17.45,2.80,2.70]},
 {id:'house_blue',key:'residential_house_blue',u:4.60,v:22.20,height:218,rect:[3.20,20.65,2.80,2.70]},
 {id:'house_orange',key:'residential_house_orange',u:7.80,v:22.20,height:218,rect:[6.40,20.65,2.80,2.70]}
];
for(const building of buildings.filter(item=>item.id.startsWith('house_'))){
 const [u,v,w,h]=building.rect,p=project(u+w/2,v+h/2),logicalSize=Math.max(w,h)+.42;
 centered('assets/images/environment/isometric/isometric_grass_patch.png',p.x,p.y,logicalSize*96,logicalSize*48,.5);
}
for(const [u,v,size]of [[17.5,17.8,2.55],[20.6,19.4,1.82]]){
 const p=project(u,v);centered('assets/images/environment/isometric/isometric_grass_patch.png',p.x,p.y,size*96,size*48,.5);
}

const items=[];
const pushImage=(relative,u,v,height,depthOffset=0,options={})=>{
 const source=execFileSync('identify',['-format','%w %h',asset(relative)],{encoding:'utf8'}).trim().split(/\s+/).map(Number);
 const width=height*source[0]/source[1],p=project(u,v);
 items.push({relative,width,height,x:p.x+(options.xOffset||0),y:p.y+(options.yOffset||0),originY:options.originY??1,flip:!!options.flip,depth:p.y+depthOffset*1000});
};
const addWallRun=(fixedAxis,fixed,start,end,flip)=>{
 const span=3.30;
 for(let cursor=start;cursor<end-.04;cursor+=span){
  const next=Math.min(cursor+span+.12,end),middle=(cursor+next)/2;
  const u=fixedAxis==='u'?fixed:middle,v=fixedAxis==='v'?fixed:middle,p=project(u,v),length=next-cursor;
  items.push({relative:'assets/images/environment/isometric/isometric_city_wall.png',width:length*56+42,height:length*30+126,x:p.x,y:p.y+52,originY:.79,flip,depth:p.y+80});
 }
};
addWallRun('u',2,2,26,true);addWallRun('v',2,2,26,false);
addWallRun('u',26,2,11.85,true);addWallRun('u',26,16.05,26,true);
addWallRun('v',26,2,11.85,false);addWallRun('v',26,16.05,26,false);
const east=project(26.03,14),south=project(14,26.03);
items.push({relative:'assets/images/environment/isometric/isometric_city_gate_east.png',width:400,height:362,x:east.x+12,y:east.y+86,originY:1,flip:false,depth:east.y+150});
items.push({relative:'assets/images/environment/isometric/isometric_city_gate.png',width:366,height:255,x:south.x,y:south.y+70,originY:1,flip:true,depth:south.y+150});
for(const b of buildings)pushImage(`assets/images/environment/buildings/${b.key}.png`,b.u,b.v,b.height);
pushImage('assets/images/environment/city/props/city_fountain.png',14,14,176,30);
pushImage('assets/images/environment/city/props/city_tree.png',20.6,19.4,184,20);
pushImage('assets/images/environment/world/waystone_dormant.png',17.5,17.8,150,70);

const npcs=[
 ['merchant_iso',8.45,15.02,112],['scholar_iso',8.25,10.02,110],['blacksmith_iso',11.95,7.98,114],
 ['healer_iso',16.85,7.98,112],['tavernkeeper_iso',21.65,8.38,114],['artisan_iso',19.75,12.93,112],
 ['elder_mira_iso',12,17.05,112],['guard_iso',22.8,17.1,116],['south_guard_iso',17.8,23.4,116]
];
for(const [key,u,v,height]of npcs)pushImage(`assets/images/characters/npcs/isometric/${key}.png`,u,v,height,60,{yOffset:8});

items.sort((a,b)=>a.depth-b.depth);
for(const item of items)centered(item.relative,item.x,item.y,item.width,item.height,item.originY,item.flip);

run('convert',[canvas,'-filter','Lanczos','-resize','1600x950',output]);
fs.rmSync(temp,{recursive:true,force:true});
console.log(output);
