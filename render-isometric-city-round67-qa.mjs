import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {execFileSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';

const root=path.dirname(fileURLToPath(import.meta.url));
const temp=fs.mkdtempSync(path.join(os.tmpdir(),'aether-round67-'));
const canvas=path.join(temp,'canvas.miff');
const output=path.join(root,'ROUND67_CITY_VISUAL_QA.png');
const detailOutput=path.join(root,'ROUND67_GATE_RESIDENTIAL_QA.png');
const project=(u,v)=>({x:1600+(u-v)*48,y:250+(u+v)*24});
const asset=relative=>path.isAbsolute(relative)?relative:path.join(root,relative);
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
 {id:'merchant',key:'merchant_shop',u:6.60,v:13.35,height:238,rect:[4.95,11.85,3.25,2.90],flip:true},
 {id:'scholar',key:'scholar_house',u:6.40,v:8.35,height:188,rect:[5.05,7.10,2.70,2.35],smoke:{x:650,y:64,size:41}},
 {id:'blacksmith',key:'blacksmith_shop',u:10.00,v:6.30,height:225,rect:[8.30,4.80,3.40,2.90],smoke:{x:352,y:57,size:46}},
 {id:'healer',key:'healer_house_abandoned',u:14.85,v:6.30,height:225,rect:[13.10,4.80,3.50,2.90],smoke:{x:90,y:145,size:41}},
 {id:'tavern',key:'tavern_house',u:19.55,v:6.65,height:238,rect:[17.70,5.10,3.70,3.00],smoke:{x:367,y:51,size:44}},
 {id:'artisan',key:'artisan_house',u:24.55,v:8.45,height:224,rect:[23.00,7.05,3.00,2.75],smoke:{x:392,y:66,size:40}},
 {id:'house_red',key:'residential_house_red',u:4.25,v:18.80,height:180,rect:[3.05,17.70,2.40,2.15],smoke:{x:425,y:116,size:35}},
 {id:'house_green',key:'residential_house_green',u:8.95,v:18.80,height:180,rect:[7.75,17.70,2.40,2.15],smoke:{x:425,y:95,size:35}},
 {id:'house_blue',key:'residential_house_blue',u:4.75,v:23.00,height:180,rect:[3.55,21.95,2.25,2.10],smoke:{x:430,y:103,size:35}},
 {id:'house_orange',key:'residential_house_orange',u:8.95,v:23.60,height:180,rect:[7.75,22.55,2.40,2.15],smoke:{x:425,y:105,size:35}}
];
const residential=project(6.60,21.20);
centered('assets/images/environment/isometric/isometric_residential_ground.png',residential.x,residential.y,768,384,.5);
for(const [u,v,size]of [[17.5,17.8,2.55],[20.6,19.4,1.82]]){
 const p=project(u,v);centered('assets/images/environment/isometric/isometric_grass_patch.png',p.x,p.y,size*96,size*48,.5);
}
const grassFrame=path.join(temp,'grass-frame.png');
run('convert',[asset('assets/images/environment/isometric/isometric_grass_tufts.png'),'-crop','96x96+0+0','+repage',grassFrame]);
for(const [u,v,index]of [
 [1.18,5.8,0],[1.20,11.8,1],[1.22,19.5,2],[5.8,1.18,0],[12.2,1.20,1],[20.0,1.18,2],
 [26.82,6.2,0],[26.80,9.7,1],[26.82,19.1,2],[6.0,26.82,0],[18.7,26.80,1],[22.8,26.82,2],
 [3.35,18.15,0],[9.85,18.20,1],[3.35,24.25,2],[9.80,24.20,3]
]){
 const p=project(u,v),size=56+(index%3)*3;centered(grassFrame,p.x,p.y+5,size,size,1);
}

const items=[];
const pushImage=(relative,u,v,height,depthOffset=0,options={})=>{
 const source=execFileSync('identify',['-format','%w %h',asset(relative)],{encoding:'utf8'}).trim().split(/\s+/).map(Number);
 const width=height*source[0]/source[1],p=project(u,v);
 items.push({relative,width,height,x:p.x+(options.xOffset||0),y:p.y+(options.yOffset||0),originY:options.originY??1,flip:!!options.flip,depth:p.y+depthOffset*1000});
};
const addWallRun=(fixedAxis,fixed,start,end,flip)=>{
 const tileSpan=2,tileSourceWidth=250,tileScale=(tileSpan*48)/tileSourceWidth;
 const count=Math.round((end-start)/tileSpan);
 for(let index=0;index<count;index++){
  const middle=start+tileSpan*(index+.5),u=fixedAxis==='u'?fixed:middle,v=fixedAxis==='v'?fixed:middle,p=project(u,v);
  items.push({relative:'assets/images/environment/isometric/isometric_city_wall.png',width:250*tileScale,height:357*tileScale,x:Math.round(p.x),y:Math.round(p.y-14),originY:.5,flip,depth:p.y+80});
 }
};
addWallRun('u',2,2,26,true);addWallRun('v',2,2,26,false);
addWallRun('u',26,2,12,true);addWallRun('u',26,16,26,true);
addWallRun('v',26,2,12,false);addWallRun('v',26,16,26,false);
for(const [u,v]of [[2,26],[26,2]]){
 const p=project(u,v),height=136,width=256*(height/320);
 items.push({relative:'assets/images/environment/isometric/isometric_city_wall_corner.png',width,height,x:Math.round(p.x),y:Math.round(p.y-14),originY:.5,flip:false,depth:p.y+130});
}
const east=project(26.03,14),south=project(14,26.03);
const gateWidth=384,gateHeight=861*(gateWidth/1285);
items.push({relative:'assets/images/environment/isometric/isometric_city_gate_east.png',width:gateWidth,height:gateHeight,x:east.x,y:east.y-3,originY:.5,flip:false,depth:east.y+150});
items.push({relative:'assets/images/environment/isometric/isometric_city_gate.png',width:gateWidth,height:gateHeight,x:south.x,y:south.y-3,originY:.5,flip:false,depth:south.y+150});
for(const b of buildings)pushImage(`assets/images/environment/buildings/${b.key}.png`,b.u,b.v,b.height,0,{flip:!!b.flip});
const smokeFrame=path.join(temp,'smoke-frame.png');
run('convert',[asset('assets/images/environment/buildings/chimney_smoke.png'),'-crop','96x96+0+0','+repage',smokeFrame]);
for(const b of buildings.filter(item=>item.smoke)){
 const source=execFileSync('identify',['-format','%w %h',asset(`assets/images/environment/buildings/${b.key}.png`)],{encoding:'utf8'}).trim().split(/\s+/).map(Number);
 const scale=b.height/source[1],p=project(b.u,b.v),sourceX=b.flip?source[0]-b.smoke.x:b.smoke.x;
 const mouthX=p.x+(sourceX-source[0]/2)*scale,mouthY=p.y-(source[1]-b.smoke.y)*scale,size=b.smoke.size;
 items.push({relative:smokeFrame,width:size,height:size,x:mouthX,y:mouthY+38*size/96,originY:1,flip:false,depth:p.y+4});
}
pushImage('assets/images/environment/city/props/city_fountain.png',14,14,176,30);
pushImage('assets/images/environment/city/props/city_tree.png',20.6,19.4,184,20,{yOffset:13});
pushImage('assets/images/environment/world/waystone_dormant.png',17.5,17.8,150,70,{yOffset:-11,originY:.88});

const npcs=[
 ['merchant_iso',7.55,13.68,112,true],['scholar_iso',7.42,9.02,110,false],['blacksmith_iso',10.71,6.09,114,false],
 ['healer_iso_devastated',14.52,7.13,112,false],['tavernkeeper_iso',19.80,6.90,114,false],['artisan_iso',24.86,9.28,112,false],
 ['elder_mira_iso',16.90,13.05,118,false],['general_iso',12.35,15.15,118,false],['guard_iso',24.20,13.05,116,false],['south_guard_iso',13.05,24.20,116,true]
];
for(const [key,u,v,height,flip]of npcs)pushImage(`assets/images/characters/npcs/isometric/${key}.png`,u,v,height,60,{yOffset:8,flip});

items.sort((a,b)=>a.depth-b.depth);
for(const item of items)centered(item.relative,item.x,item.y,item.width,item.height,item.originY,item.flip);

run('convert',[canvas,'-filter','Lanczos','-resize','1600x950',output]);
const residentialCrop=path.join(temp,'residential-detail.png');
const southGateCrop=path.join(temp,'south-gate-detail.png');
const eastGateCrop=path.join(temp,'east-gate-detail.png');
run('convert',[output,'-crop','650x390+100+270','+repage',residentialCrop]);
run('convert',[output,'-crop','720x400+120+420','+repage',southGateCrop]);
run('convert',[output,'-crop','650x420+930+330','+repage',eastGateCrop]);
run('montage',[residentialCrop,southGateCrop,eastGateCrop,'-tile','3x1','-geometry','720x420+12+12','-background','#0c1717',detailOutput]);
fs.rmSync(temp,{recursive:true,force:true});
console.log(output);
console.log(detailOutput);
