// @ts-nocheck
import {ESCARPMENT_ASSETS,ESCARPMENT_START_GUIDE} from './OldRoadEscarpmentAssets';
import {ESCARPMENT_NATURAL_ASSETS} from './OldRoadEscarpmentNaturalAssets';
const ART={...ESCARPMENT_ASSETS,...ESCARPMENT_NATURAL_ASSETS};

// Right-hand shoulder when travelling from the road start towards the City.
// These stations place only the new barrier. Road anchors remain authoritative.
const STATIONS=[
  ['rocks_medium_01',-2250,.48],['terminal_01',-2160,.66],
  ['short_01',-2040,.66],['medium_02',-1888,.78],
  ['long_01',-1660,.68],['medium_01',-1415,.77],
  ['long_03',-1175,.68],['short_02',-943,.73],
  ['long_02',-730,.68],['medium_03',-480,.73],
  ['long_04',-245,.68],['medium_02',12,.73],
  ['long_01',228,.61],['medium_01',419,.54],
  ['rocks_large_02',512,.43],['terminal_02',578,.30]
];

export class OldRoadEscarpment{
  constructor(territory){
    this.territory=territory;this.scene=territory.scene;
    this.pieces=[];this.footprints=[];
    const road=this.scene.registry.get('oldRoadConnectorTest'),start=road.oldRoad[0];
    this.route=ESCARPMENT_START_GUIDE.map(([x,y])=>({x:start.center.x+x,y:start.center.y+y}));
    for(const module of road.oldRoad.slice(1))this.route.push(module.connectors.south);

    // Clip only the new art at the already-established territory boundary.
    // No ground dimensions, camera bounds or navigation bounds are changed.
    this.maskShape=this.scene.make.graphics({x:0,y:0,add:false});
    this.maskShape.fillStyle(0xffffff,1).beginPath();
    [[0,0],[82,0],[82,82],[0,82]].forEach(([u,v],i)=>{
      const p=territory.project(u,v);
      if(i===0)this.maskShape.moveTo(p.x,p.y);else this.maskShape.lineTo(p.x,p.y);
    });
    this.maskShape.closePath().fillPath();this.mask=this.maskShape.createGeometryMask();

    for(const [id,x,scale] of STATIONS){
      const previous=this.pieces.at(-1);
      const footY=id==='terminal_02'?previous.feet.reduce((sum,f)=>sum+f.y,0)/previous.feet.length:undefined;
      this.place(id,x,scale,{footY});
    }
    const main=[...this.pieces];
    const joins=['rocks_large_01','rocks_medium_02','rocks_large_02','bush_01','rocks_medium_01','roots_01','bush_02'];
    for(let i=1;i<main.length;i++){
      const a=main[i-1],b=main[i];let best=null;
      for(const p of a.feet)for(const q of b.feet){
        const distance=Math.hypot(q.x-p.x,(q.y-p.y)*1.4);
        if(!best||distance<best.distance)best={p,q,distance};
      }
      this.place(joins[(i*3)%joins.length],(best.p.x+best.q.x)/2,i>12?.43:.58,{
        footY:(best.p.y+best.q.y)/2,joining:[a.id,b.id]
      });
    }
    // B4.1E: one ridge, strongest near the start and progressively lower
    // towards the Y. The original front below stays the continuous barrier.
    // Broad ledges replace the two isolated, repeated round towers.
    const formations=[
      ['boulders_01',-2035,.74,2],
      ['ledge_01',-1508,1.12,4],
      ['boulders_02',-1350,.82,5],
      ['ledge_01',-980,.95,7],
      ['boulders_01',-836,.82,8],
      ['ledge_01',-460,.82,9],
      ['talus_01',-304,.77,10],
      ['boulders_02',2,.65,11],
      ['boulders_03',300,.58,12],
      ['talus_01',455,.45,13],
      ['thicket_02',567,.32,14]
    ];
    for(const [id,x,scale,parent] of formations){
      this.place(id,x,scale,{role:'formation',parent:main[parent].id});
      const mass=this.pieces.at(-1),base=main[parent];let nearest=null;
      for(const p of base.feet)for(const q of mass.feet){
        const d=Math.hypot(p.x-q.x,(p.y-q.y)*1.4);
        if(!nearest||d<nearest.d)nearest={p,q,d};
      }
      // Ground the four low joins in their neighbouring rock bases.
      if([4,8,10,14].includes(parent))this.place(parent%2?'boulders_03':'thicket_01',
        (nearest.p.x+nearest.q.x)/2,parent>=12?.42:.66,{
          footY:(nearest.p.y+nearest.q.y)/2,role:'talus',joining:[base.id,mass.id]
        });
    }
    // Reuse the same twelve infill pieces at their existing scale. Their feet
    // are tucked into the rock bases instead of sitting apart on the grass.
    const approved=[...this.pieces];
    const averageFoot=p=>p.feet.reduce((sum,f)=>sum+f.y,0)/p.feet.length;
    const infill=[
      [17,-2080,2348],[21,-1720,2418],[23,-1380,2318],
      [20,-1150,2270],[24,-624,2024],[22,-420,1990],
      [23,-135,1874],[27,193,1738],[28,370,1626],
      [14,603,1540],[30,670,1541],[44,701,1542]
    ];
    for(const [sourceIndex,x,footY] of infill){
      const source=approved[sourceIndex];
      const parent=approved.reduce((best,p)=>
        Math.hypot(p.x-x,averageFoot(p)-footY)<Math.hypot(best.x-x,averageFoot(best)-footY)?p:best);
      this.place(source.asset,x,source.scale,{footY,role:'lateral-extension',parent:parent.id});
    }

    // Overlapping, unequal faces continue the same strata through the
    // saddles. Small integral pines stay in the existing vegetation pockets.
    const faceLinks=[
      ['crown_01',-1880,.96],['long_04',-1230,.74],
      ['crown_01',-682,.76],['ledge_01',-23,.68]
    ];
    for(const [asset,x,scale] of faceLinks){
      const parent=approved.reduce((best,p)=>Math.abs(p.x-x)<Math.abs(best.x-x)?p:best);
      this.place(asset,x,scale,{role:'continuous-face',parent:parent.id});
    }

    // A thin, irregular apron softens the rock/grass join. Anchor it only to
    // the completed ridge so decoration cannot extend subsequent placements
    // into the untouched meadow. Tiny plants and scree remain walkable.
    const support=[...this.footprints];
    const supportedFoot=x=>{
      const column=support.filter(f=>Math.abs(f.x-x)<=f.width/2+8);
      if(!column.length)return null;
      return Math.max(...column.map(f=>f.y+f.height/2));
    };
    const apron=[
      ['rocks_medium_01',-2004,.27,5],['bush_01',-1828,.30,3],
      ['roots_01',-1718,.31,5],['rocks_medium_02',-1604,.26,4],
      ['bush_02',-1460,.29,5],['rocks_medium_01',-1318,.25,4],
      ['bush_01',-1146,.28,5],['roots_01',-1022,.29,4],
      ['rocks_medium_02',-864,.26,5],['bush_02',-736,.26,4],
      ['rocks_medium_01',-587,.24,5],['bush_01',-421,.25,3],
      ['roots_01',-251,.24,4],['rocks_medium_02',-102,.22,3],
      ['bush_02',121,.21,3],['rocks_medium_01',325,.19,2]
    ];
    for(const [asset,x,scale,outset] of apron){
      const footY=supportedFoot(x);
      if(footY!==null)this.place(asset,x,scale,{
        footY:footY+outset,role:'ground-detail',solid:false
      });
    }
    this.scene.registry.set('oldRoadEscarpment',{
      version:'B4.1E-natural',side:'right-towards-city',reference:'ef888e75-2916-4a6a-b7a2-e1a3f543641d (1).png',
      pieces:this.pieces.map(({sprite,...piece})=>piece),footprints:this.footprints,
      roadGuide:this.route,roadModulesPreserved:19,
      collisionMode:'existing-grounded-footprints',looseBlockers:0
    });
  }

  roadAt(x){
    let a=this.route[0],b=this.route[1];
    for(let i=1;i<this.route.length;i++){
      a=this.route[i-1];b=this.route[i];if(x<=b.x)break;
    }
    const slope=(b.y-a.y)/(b.x-a.x||1);
    return {x,y:a.y+(x-a.x)*slope,slope};
  }

  place(id,x,scale,options={}){
    const asset=ART[id],{width,height,key}=asset;
    let y=-Infinity;
    // Keep even the uppermost visible vegetation off the full road surface.
    for(const [px,py] of asset.upper){
      const wx=x+(width/2-px)*scale,r=this.roadAt(wx);
      y=Math.max(y,r.y+50*Math.sqrt(1+r.slope*r.slope)+(height-py)*scale);
    }
    if(options.footY!==null&&options.footY!==undefined){
      const middle=asset.feet.reduce((sum,f)=>sum+f.y,0)/asset.feet.length;
      y=Math.max(y,options.footY+(height-middle)*scale);
    }
    const logical=this.territory.screenToLogical(x,y);
    const depth=this.territory.depthAt(logical.u,logical.v,.06);
    const sprite=this.scene.add.image(x,y,key).setOrigin(.5,1).setScale(scale)
      .setFlipX(true).setDepth(depth).setMask(this.mask);
    const pieceId=`escarpment-${String(this.pieces.length+1).padStart(2,'0')}`;
    sprite.setData('oldRoadEscarpment',{id:pieceId,asset:id,joining:options.joining??null,
      role:options.role??'approved-front',parent:options.parent??null});
    // A persistent barrier must not lose its collision when culling updates.
    this.territory.track(sprite,logical.u,logical.v,{alwaysActive:true});
    this.territory.config.registerOccluder?.(sprite,key,y,{behindMargin:7});
    const feet=options.solid===false?[]:asset.feet.map(f=>{
      const foot={x:x+(width/2-f.x)*scale,y:y+(f.y-height)*scale,
        width:f.width*scale,height:f.height*scale,asset:id,piece:pieceId};
      this.territory.config.registerSolidMask?.(sprite,key,{
        label:`Escarpa da Estrada Velha: ${pieceId}`,mode:'footprint',
        worldX:foot.x,worldY:foot.y,originY:.5,
        footprintWidth:foot.width,footprintHeight:foot.height,footprintYOffset:0
      });
      this.footprints.push(foot);return foot;
    });
    this.pieces.push({id:pieceId,asset:id,key,x,y,scale,flipX:true,rotation:0,
      depth,width,height,feet,joining:options.joining??null,
      role:options.role??'approved-front',parent:options.parent??null,sprite});
  }

  destroy(){this.maskShape?.destroy();}
}
