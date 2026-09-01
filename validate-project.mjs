import fs from 'node:fs';
import path from 'node:path';
import zlib from 'node:zlib';
import {fileURLToPath} from 'node:url';

const root=path.dirname(fileURLToPath(import.meta.url));
const read=relative=>fs.readFileSync(path.join(root,relative),'utf8');
const exists=relative=>fs.existsSync(path.join(root,relative));
const size=relative=>fs.statSync(path.join(root,relative)).size;
const pngDimensions=relative=>{
  const buffer=fs.readFileSync(path.join(root,relative));
  return {width:buffer.readUInt32BE(16),height:buffer.readUInt32BE(20)};
};
const pngColorType=relative=>fs.readFileSync(path.join(root,relative))[25];
const decodeRgbaPng=relative=>{
  const buffer=fs.readFileSync(path.join(root,relative));
  const width=buffer.readUInt32BE(16),height=buffer.readUInt32BE(20);
  if(buffer[24]!==8||buffer[25]!==6||buffer[28]!==0)throw new Error(`PNG RGBA não suportado: ${relative}`);
  const chunks=[];
  for(let offset=8;offset<buffer.length;){
    const length=buffer.readUInt32BE(offset),type=buffer.toString('ascii',offset+4,offset+8);
    if(type==='IDAT')chunks.push(buffer.subarray(offset+8,offset+8+length));
    offset+=12+length;
  }
  const raw=zlib.inflateSync(Buffer.concat(chunks)),stride=width*4,data=Buffer.alloc(height*stride);
  const paeth=(a,b,c)=>{const p=a+b-c,pa=Math.abs(p-a),pb=Math.abs(p-b),pc=Math.abs(p-c);return pa<=pb&&pa<=pc?a:pb<=pc?b:c};
  let source=0;
  for(let y=0;y<height;y++){
    const filter=raw[source++],row=y*stride,previous=(y-1)*stride;
    for(let x=0;x<stride;x++){
      const left=x>=4?data[row+x-4]:0,up=y?data[previous+x]:0,upperLeft=y&&x>=4?data[previous+x-4]:0;
      const predictor=filter===0?0:filter===1?left:filter===2?up:filter===3?Math.floor((left+up)/2):paeth(left,up,upperLeft);
      data[row+x]=(raw[source++]+predictor)&255;
    }
  }
  return{width,height,data};
};
const alphaCellStats=(relative,cellWidth,cellHeight)=>{
  const png=decodeRgbaPng(relative),stats=[];
  for(let row=0;row<png.height/cellHeight;row++)for(let column=0;column<png.width/cellWidth;column++){
    const mask=new Uint8Array(cellWidth*cellHeight);
    let minX=cellWidth,minY=cellHeight,maxX=-1,maxY=-1;
    for(let y=0;y<cellHeight;y++)for(let x=0;x<cellWidth;x++){
      const alpha=png.data[((row*cellHeight+y)*png.width+column*cellWidth+x)*4+3];
      if(alpha>=24){mask[y*cellWidth+x]=1;minX=Math.min(minX,x);minY=Math.min(minY,y);maxX=Math.max(maxX,x);maxY=Math.max(maxY,y)}
    }
    const components=[];
    for(let index=0;index<mask.length;index++)if(mask[index]===1){
      let count=0;const stack=[index];mask[index]=2;
      while(stack.length){const current=stack.pop(),x=current%cellWidth,y=Math.floor(current/cellWidth);count++;
        for(let dy=-1;dy<=1;dy++)for(let dx=-1;dx<=1;dx++){if(!(dx||dy))continue;const nx=x+dx,ny=y+dy;if(nx<0||ny<0||nx>=cellWidth||ny>=cellHeight)continue;const next=ny*cellWidth+nx;if(mask[next]===1){mask[next]=2;stack.push(next)}}
      }
      components.push(count);
    }
    components.sort((a,b)=>b-a);
    stats.push({width:maxX-minX+1,height:maxY-minY+1,components});
  }
  return stats;
};
const neutralWhitePixelCount=relative=>{
  const png=decodeRgbaPng(relative);
  let count=0;
  for(let index=0;index<png.data.length;index+=4){
    const red=png.data[index],green=png.data[index+1],blue=png.data[index+2],alpha=png.data[index+3];
    const high=Math.max(red,green,blue),low=Math.min(red,green,blue);
    if(alpha>=24&&low>=190&&high-low<=60)count++;
  }
  return count;
};
const issues=[];
const expect=(condition,message)=>{if(!condition)issues.push(message)};

const scene=read('src/scenes/AetherCityScene.ts');
const preload=read('src/scenes/PreloadScene.ts');
const main=read('src/main.ts');
const indexHtml=read('index.html');
const isoArchitecture=read('src/isometric/IsoOcclusion.ts');
const menu=read('src/scenes/MenuScene.ts');
const npc=read('src/npc/Npc.ts');
const wandering=read('src/npc/WanderingNpc.ts');
const player=read('src/entities/Player.ts');
const inventoryPanel=read('src/ui/CharacterInventoryPanel.ts');
const bottomBar=read('src/ui/BottomActionBar.ts');
const abilitySystem=read('src/abilities/AbilitySystem.ts');
const playerAppearance=read('src/character/PlayerAppearance.ts');
const characterSelect=read('src/scenes/CharacterSelectScene.ts');
const equipment=read('src/equipment/EquipmentManager.ts');
const itemsCatalog=read('src/items/itemCatalog.ts');
const waystone=read('src/world/Waystone.ts');
const world=read('src/scenes/WorldScene.ts');
const woods=read('src/scenes/GreenWoodsScene.ts');
const pkg=JSON.parse(read('package.json'));

expect(pkg.version==='0.2.7','versão do pacote não é 0.2.7');
expect(pkg.scripts?.validate==='node validate-project.mjs','validador consolidado não está registrado');

// Protótipo do Round 59 removido por completo, sem afetar a cidade oficial.
expect(!exists('src/scenes/IsometricPrototypeScene.ts'),'cena do protótipo isométrico ainda existe');
expect(!exists('validate-isometric-round59.mjs'),'validador do protótipo ainda existe');
expect(!exists('assets/images/environment/isometric/isometric_grass_ground.png'),'chão exclusivo do protótipo ainda existe');
expect(!exists('assets/images/environment/isometric/isometric_pavement_ground.png'),'pavimento exclusivo do protótipo ainda existe');
expect(!main.includes('IsometricPrototypeScene')&&!menu.includes('PROTÓTIPO ISOMÉTRICO'),'menu ou registro ainda referencia o protótipo');
expect(!preload.includes('iso_grass_ground')&&!preload.includes('iso_pavement_ground'),'preload ainda carrega texturas do protótipo');

// Documentação consolidada: README, histórico e somente o round atual separado.
const markdown=fs.readdirSync(root).filter(name=>name.endsWith('.md')).sort();
expect(JSON.stringify(markdown)===JSON.stringify(['HISTORICO_E_REFERENCIAS_ATE_ROUND66.md','README.md','ROUND67_CITY_POLISH_PASS.md']),`documentação raiz não está consolidada: ${markdown.join(', ')}`);
expect(read('HISTORICO_E_REFERENCIAS_ATE_ROUND66.md').includes('Documento original: ROUND66_CITY_CONTACT_DEPTH_PASS.md'),'histórico não incorporou o Round 66');

// Câmera e canvas nativos: a área visível cresce sem ampliar as texturas.
expect(scene.includes('const cityZoom = 1')&&scene.includes('this.cameras.main.setZoom(cityZoom)'),'cidade não usa escala nativa 1:1');
expect(scene.includes('const cameraPadY=Math.ceil(this.scale.height/this.cityZoom/2)+80')&&scene.includes('AetherCityScene.WORLD_HEIGHT+cameraPadY*2'),'câmera não recalcula a margem norte conforme o viewport');
expect(scene.includes('startFollow(this.player, true, .12, .12, 0, 54)'),'câmera não mantém o herói abaixo do centro para ampliar a leitura ao norte');
expect(main.includes('mode:Phaser.Scale.RESIZE')&&main.includes('pixelArt:false')&&main.includes('antialias:true')&&main.includes('roundPixels:false'),'canvas não renderiza na resolução nativa do navegador');
expect(main.includes('__aetherHighDpi')&&main.includes('window.devicePixelRatio'),'textos não usam textura interna de alta resolução');
expect(indexHtml.includes('image-rendering:auto')&&!indexHtml.includes('image-rendering:pixelated'),'CSS ainda força reamostragem de pixel art');
expect(![scene,world,woods,read('src/scenes/CaveScene.ts'),read('src/scenes/CastleScene.ts')].some(source=>source.includes('setRoundPixels(true)')),'alguma câmera ainda arredonda pixels e degrada as pinturas');
expect(scene.includes("addIsoImage('city_tree', u, v, 184, .02, 13)"),'padding visual da árvore não foi compensado');
expect(scene.includes('const waystoneY = center.y - 11'),'Marco de Senda não foi centralizado no jardim');

// Piso e mercado mantêm os canvases da planta, mas com arte 2,5D renovada.
const pavement='assets/images/environment/isometric/isometric_city_pavement.png';
const cityGrass='assets/images/environment/isometric/isometric_city_grass.png';
const grassPatch='assets/images/environment/isometric/isometric_grass_patch.png';
const grassTufts='assets/images/environment/isometric/isometric_grass_tufts.png';
const merchantShop='assets/images/environment/buildings/merchant_shop.png';
expect(exists(pavement),'novo piso da cidade está ausente');
expect(exists(merchantShop),'novo mercado de Aldren está ausente');
if(exists(pavement)){
  const dimensions=pngDimensions(pavement);
  expect(dimensions.width===2304&&dimensions.height===1152,'piso não preservou o losango 2304x1152');
  expect(pngColorType(pavement)===6,'piso não possui transparência RGBA real');
  expect(size(pavement)>2500000,'piso parece vazio ou excessivamente simplificado');
}
for(const [relative,width,height,minSize] of [
  [cityGrass,2688,1344,1500000],
  [grassPatch,384,192,80000],
  [grassTufts,384,96,25000]
]){
  expect(exists(relative),`vegetação refinada ausente: ${relative}`);
  if(exists(relative)){
    const d=pngDimensions(relative);
    expect(d.width===width&&d.height===height,`canvas inesperado da vegetação: ${relative}`);
    expect(pngColorType(relative)===6,`vegetação sem transparência RGBA: ${relative}`);
    expect(size(relative)>minSize,`vegetação vazia ou excessivamente simplificada: ${relative}`);
  }
}
expect(preload.includes("this.load.spritesheet('iso_grass_tufts'")&&preload.includes('{frameWidth:96,frameHeight:96}'),'tufos animados não estão no preload');
expect(scene.includes("key: 'city-grass-sway'")&&scene.includes("frames:[0,1,2,3]")&&scene.includes('createAnimatedGrassDetails()'),'movimento de grama em quatro quadros não está integrado');
expect((scene.match(/\[\d+\.\d+,\d+\.\d+\]/g)||[]).length>=16,'distribuição de tufos animados parece incompleta');
if(exists(merchantShop)){
  const dimensions=pngDimensions(merchantShop);
  expect(dimensions.width===528&&dimensions.height===497,'mercado não preservou o canvas 528x497');
  expect(pngColorType(merchantShop)===6,'mercado não possui transparência RGBA real');
  expect(size(merchantShop)>350000,'mercado aberto parece vazio ou degradado');
}
expect(preload.includes("this.load.image('merchant_shop'")&&preload.includes("this.load.image('iso_city_pavement'"),'novas artes não usam as chaves estáveis do preload');
expect(scene.includes("flipX:true")&&scene.includes("npc:[7.55,13.68]"),'mercado não está voltado para a praça com Aldren diante do balcão');
expect(scene.includes('if (building.flipX) image.setFlipX(true)'),'espelhamento do mercado não está aplicado à arte');
expect(scene.includes('if (geometry.flipX) sourceX = geometry.width - 1 - sourceX')&&scene.includes('if (image.flipX) sourceX = source.width - 1 - sourceX'),'colisão alfa ou oclusão não acompanha sprites espelhados');
expect(scene.includes("action: 'merchant_iso_action', height: 112, flipX: true")&&npc.includes('setFlipX(!!options.flipX)'),'Aldren e sua ação não estão orientados para a praça');

// Corredor comercial e bairro residencial com vias próprias.
expect(scene.includes("id:'artisan', key:'artisan_house', label:'Ateliê de Maelis', u:23.50, v:6.65")&&scene.includes('rect:[22.00,5.20,3.00,2.75]')&&scene.includes('npc:[23.80,7.48]'),'ateliê e Maelis não estão alinhados à fileira de estabelecimentos');
const residentialGround='assets/images/environment/isometric/isometric_residential_ground.png';
expect(exists(residentialGround),'piso próprio do bairro residencial está ausente');
if(exists(residentialGround)){
  const d=pngDimensions(residentialGround);
  expect(d.width===768&&d.height===384,'piso residencial não preserva o losango 2:1 de 768x384');
  expect(pngColorType(residentialGround)===6,'piso residencial não possui alpha RGBA');
  expect(size(residentialGround)>300000,'piso residencial parece vazio ou sem os quatro pátios pavimentados');
}
expect(preload.includes("this.load.image('iso_residential_ground'")&&scene.includes("'iso_residential_ground'"),'piso residencial não está integrado');
expect(scene.includes('this.project(6.60, 21.20)')&&scene.includes('.setOrigin(.5).setDisplaySize(768, 384)'),'bairro residencial não usa o lote único com ruas internas');
for(const color of ['red','green','blue','orange']){
  const relative=`assets/images/environment/buildings/residential_house_${color}.png`;
  expect(exists(relative),`residência isométrica ausente: ${color}`);
  if(exists(relative)){
    const d=pngDimensions(relative);
    expect(d.width===640&&d.height===640,`residência ${color} não preserva o canvas 640x640`);
    expect(pngColorType(relative)===6,`residência ${color} não possui alpha RGBA`);
  }
}
expect(scene.includes('u:4.25, v:18.80, height:180')&&scene.includes('u:8.95, v:18.80, height:180')&&scene.includes('u:4.75, v:23.00, height:180')&&scene.includes('u:8.95, v:23.60, height:180'),'casas não ocupam os quatro lotes fora das ruas ou a casa azul voltou ao canto');
const residentialRects=[
  [3.05,17.70,2.40,2.15],[7.75,17.70,2.40,2.15],
  [3.55,21.95,2.25,2.10],[7.75,22.55,2.40,2.15]
].map(([u,v,w,h])=>({u1:u,v1:v,u2:u+w,v2:v+h}));
const intersects=(a,b)=>a.u1<b.u2&&a.u2>b.u1&&a.v1<b.v2&&a.v2>b.v1;
const residentialLanes=[
  {u1:5.85,v1:17.20,u2:7.35,v2:25.05},
  {u1:2.75,v1:20.45,u2:10.45,v2:21.95}
];
expect(!residentialRects.some(house=>residentialLanes.some(lane=>intersects(house,lane))),'uma residência ainda invade uma rua do bairro');
expect(scene.includes('[6.60,21.20]')&&scene.includes('[6.60,24.70]'),'rota do morador não percorre as ruas residenciais');

// Arquivo baixo e estado inicial/futuro da curandeira.
const scholarHouse='assets/images/environment/buildings/scholar_house.png';
const healerAbandoned='assets/images/environment/buildings/healer_house_abandoned.png';
const healerDevastated='assets/images/characters/npcs/isometric/healer_iso_devastated.png';
const healerPortraitDevastated='assets/images/ui/dialogue/portraits/portrait_elara_devastated.png';
for(const relative of [scholarHouse,healerAbandoned,healerDevastated]){
  expect(exists(relative),`novo asset ausente: ${relative}`);
  if(exists(relative))expect(pngColorType(relative)===6,`novo asset não possui alpha RGBA real: ${relative}`);
}
if(exists(scholarHouse)){
  const d=pngDimensions(scholarHouse);
  expect(d.width<=1024&&d.height<=1024,'Arquivo de Lysandra ainda usa um canvas grande demais');
  expect(d.width/d.height>.85&&d.width/d.height<1.15,'Arquivo de Lysandra não possui silhueta compacta');
}
expect(scene.includes("label:'Arquivo de Lysandra'")&&scene.includes('height:188'),'Arquivo de Lysandra não usa a escala compacta aprovada');
if(exists(healerDevastated)){
  const d=pngDimensions(healerDevastated);
  expect(d.width===208&&d.height===224,'Elara devastada não preserva o canvas 208x224');
}
expect(exists(healerPortraitDevastated)&&pngDimensions(healerPortraitDevastated).width===652&&pngDimensions(healerPortraitDevastated).height===880,'retrato devastado de Elara não preserva o canvas 652x880');
expect(exists('assets/images/environment/buildings/healer_house.png')&&exists('assets/images/characters/npcs/isometric/healer_iso.png')&&exists('assets/images/ui/dialogue/portraits/portrait_elara.png'),'estado futuro restaurado de Elara não foi preservado');
expect(preload.includes("'healer_house_abandoned'")&&preload.includes("'healer_iso_devastated'")&&preload.includes("'portrait_elara_devastated'"),'estados iniciais de Elara não estão no preload');
expect(scene.includes('isHealerFaithRestored()')&&scene.includes('healerFaithRestored'),'flag futura da missão de Elara não está ligada à cidade');
expect(scene.includes("key:healerRestored?'healer_house':'healer_house_abandoned'")&&scene.includes("iso: healerRestored?'healer_iso':'healer_iso_devastated'"),'alternância visual inicial/restaurada de Elara está incompleta');

// Linguagem de interação unificada e indicador de diálogo.
expect(npc.includes('fillStyle(0xffffff,.92).fillRoundedRect(-96,top,192,height,9)')&&npc.includes("makeInteractionRow('F','Conversar',17)"),'nome, função e comando do NPC não compartilham a placa branca');
expect(npc.includes('this.interactionUi=scene.add.container(0,this.interactionAnchorY)')&&npc.includes('this.interactionAnchorY=-(visualHeight+lift)'),'placa de interação não está centralizada diretamente sobre o NPC');
expect(!preload.includes("'npc_prompt_panel'")&&!preload.includes("'npc_icon_talk'")&&!preload.includes("'npc_icon_shop'"),'artes escuras substituídas ainda são carregadas');
expect(npc.includes('showConversationIcon()')&&npc.includes('hideConversationIcon(immediate=false)'),'balão de conversa não possui ciclo próprio');
expect(npc.includes('fillTriangle(-7,13,5,13,-2,22)')&&npc.includes('const dots=[-10,0,10]'),'ícone de reticências não está desenhado');
expect(scene.includes('near.showConversationIcon?.()')&&scene.includes('npc?.hideConversationIcon?.()'),'Cidade de Aether não controla o indicador de conversa');
expect(world.includes('near.showConversationIcon?.()')&&world.includes('npc?.hideConversationIcon?.()'),'Arredores não controlam o indicador de conversa');
expect(woods.includes('near.showConversationIcon?.()')&&woods.includes('npc?.hideConversationIcon?.()'),'Floresta não controla o indicador de conversa');
expect(waystone.includes("'Examinar'")&&waystone.includes('createInteractionPrompt'),'Marco de Senda não usa o cartão F · Examinar');
expect(!waystone.includes('F • Conversar'),'Marco de Senda foi configurado incorretamente para conversar');

// Muros modulares, portões compactados e os quatro cantos naturais.
const wall='assets/images/environment/isometric/isometric_city_wall.png';
const southGate='assets/images/environment/isometric/isometric_city_gate.png';
const eastGate='assets/images/environment/isometric/isometric_city_gate_east.png';
for(const relative of [wall,southGate,eastGate]){
  expect(exists(relative),`limite urbano ausente: ${relative}`);
  if(exists(relative))expect(pngColorType(relative)===6,`limite urbano sem transparência RGBA: ${relative}`);
}
if(exists(wall)){
  const d=pngDimensions(wall);
  expect(d.width===250&&d.height===357,'módulo periódico da muralha não preserva o canvas 250x357');
}
for(const relative of [southGate,eastGate]){
  if(exists(relative)){
    const d=pngDimensions(relative);
    expect(d.width===1285&&d.height===861,`portão desalinhado ou com canvas inesperado: ${relative}`);
  }
}
expect(scene.includes('const tileSpan = 2')&&scene.includes('const tileSourceWidth = 250'),'muralha não usa conectores periódicos fixos');
expect(scene.includes('.setScale(tileScale)'),'módulo da muralha ainda é deformado por largura e altura independentes');
expect(scene.includes("C.CITY_MIN, 12, true")&&scene.includes("C.CITY_MAX, 16, C.CITY_MAX, true")&&scene.includes("C.CITY_MIN, 12, false")&&scene.includes("C.CITY_MAX, 16, C.CITY_MAX, false"),'trechos comuns da muralha não chegam diretamente às torres dos portões');
expect(!scene.includes('addWallGateJoin')&&!preload.includes("iso_city_wall_gate_join"),'conector duplicado do portão ainda está integrado');
expect(!exists('assets/images/environment/isometric/isometric_city_wall_corner.png')&&!preload.includes('iso_city_wall_corner')&&!scene.includes('addWallCorner'),'há uma imagem extra compondo os cantos laterais');
expect(scene.includes("this.registerOccluder(image, 'iso_city_wall', p.y + 7"),'módulos da muralha não possuem oclusão individual');
expect(!scene.includes('visualLength * 22 + 190'),'esticamento vertical gigante da muralha ainda está ativo');
expect(scene.includes('const gateTargetWidth = 384')&&scene.includes('gateTargetWidth/eastGateSource.width')&&scene.includes('gateTargetWidth/southGateSource.width'),'portões não usam escala uniforme compartilhada');
expect(scene.includes('isoZ:3-eastGateSource.height*eastGateScale/2')&&scene.includes('isoZ:3-southGateSource.height*southGateScale/2'),'portões não preservam o apoio visual com origem nos pés');
expect(scene.includes('const innerMin = 3.12')&&scene.includes('const innerMax = 25.35'),'envelope interno dos muros não está calibrado');

// Portões: vão real único e retorno direcional no limite interno.
expect(scene.includes('static readonly GATE_MIN = 13.42')&&scene.includes('static readonly GATE_MAX = 14.58'),'largura física dos arcos não está restrita ao vão central');
expect(scene.includes('this.player.setIsoPosition(25.02,14,-6)')&&scene.includes('this.player.setIsoPosition(14,25.02,-6)'),'retornos dos portões não usam coordenadas isométricas no limite interno');
expect(scene.includes("this.entryFacing = 'left'")&&scene.includes("this.entryFacing = 'up'"),'direção de retorno dos portões não foi preservada');
expect(scene.includes('const min = AetherCityScene.GATE_MIN, max = AetherCityScene.GATE_MAX')&&scene.includes('v > min && v < max')&&scene.includes('u > min && u < max'),'transição ainda aceita as torres como passagem');

const envelopeBlocked=(u,v,r=.27)=>{
  const insideEast=v-r>13.42&&v+r<14.58;
  const insideSouth=u-r>13.42&&u+r<14.58;
  return u-r<3.12||v-r<3.12||(u+r>25.35&&!insideEast)||(v+r>25.35&&!insideSouth);
};
expect(!envelopeBlocked(25.02,14),'spawn interno do Portão Leste está bloqueado');
expect(!envelopeBlocked(14,25.02),'spawn interno do Portão Sul está bloqueado');
expect(envelopeBlocked(25.7,12.7),'torre do Portão Leste permite passagem lateral');
expect(envelopeBlocked(12.7,25.7),'torre esquerda do Portão Sul permite saída');
expect(!envelopeBlocked(26.2,14),'centro do arco Leste foi fechado');
expect(!envelopeBlocked(14,26.2),'centro do arco Sul foi fechado');

// Regressão reproduzida do Round 67: a silhueta inteira do herói se cruzava
// com o guarda no spawn e impedia qualquer primeiro passo. Esta simulação usa
// os PNGs e escalas reais dos dois portões e exige fuga do ponto inicial para
// todas as seis aparências.
const collisionPngCache=new Map();
const collisionPng=relative=>{
  if(!collisionPngCache.has(relative))collisionPngCache.set(relative,decodeRgbaPng(relative));
  return collisionPngCache.get(relative);
};
const project=(u,v)=>({x:1600+(u-v)*48,y:250+(u+v)*24});
const targetGeometry=(relative,u,v,scale,options={})=>{
  const png=collisionPng(relative),position=project(u,v);
  const worldX=position.x+(options.offsetX||0),worldY=position.y+(options.offsetY||0);
  const originX=options.originX??.5,originY=options.originY??.5;
  return{relative,png,worldX,worldY,scale,originX,originY,flipX:!!options.flipX,sourceMinY:options.sourceMinY??0,
    left:worldX-png.width*scale*originX,top:worldY-png.height*scale*originY};
};
const spawnTargets=[];
const wallRelative='assets/images/environment/isometric/isometric_city_wall.png';
const wallScale=96/250;
const addWallRunAudit=(fixedAxis,fixed,start,end,flip)=>{
  const count=Math.round((end-start)/2);
  for(let index=0;index<count;index++){
    const middle=start+2*(index+.5),u=fixedAxis==='u'?fixed:middle,v=fixedAxis==='v'?fixed:middle;
    spawnTargets.push(targetGeometry(wallRelative,u,v,wallScale,{offsetY:-14,flipX:flip}));
  }
};
addWallRunAudit('u',2,2,26,true);addWallRunAudit('v',2,2,26,false);
addWallRunAudit('u',26,2,12,true);addWallRunAudit('u',26,16,26,true);
addWallRunAudit('v',26,2,12,false);addWallRunAudit('v',26,16,26,false);
spawnTargets.push(
  targetGeometry('assets/images/environment/isometric/isometric_city_gate_east.png',26.03,14,384/1285,{offsetY:-3,sourceMinY:.56}),
  targetGeometry('assets/images/environment/isometric/isometric_city_gate.png',14,26.03,384/1285,{offsetY:-3,sourceMinY:.56}),
  targetGeometry('assets/images/characters/npcs/isometric/guard_iso.png',24.20,13.05,124/224,{offsetY:8,originY:1}),
  targetGeometry('assets/images/characters/npcs/isometric/south_guard_iso.png',13.05,24.20,124/224,{offsetY:8,originY:1,flipX:true})
);
const playerContactSamples=(appearanceId,frameNumber)=>{
  const png=collisionPng(`assets/images/characters/player/${appearanceId}_base.png`),samples=[];
  const frameColumn=frameNumber%4,frameRow=Math.floor(frameNumber/4),startY=Math.floor(96*.66);
  for(let y=startY+1;y<96;y+=3)for(let x=1;x<96;x+=3){
    const sourceX=frameColumn*96+x,sourceY=frameRow*96+y;
    if(png.data[(sourceY*png.width+sourceX)*4+3]>=64)samples.push({x:(x+1.5-48)*1.28,y:(y+1.5-96)*1.28});
  }
  return samples;
};
const blockedBySpawnTargets=(appearanceId,frameNumber,u,v)=>{
  const foot=project(u,v);foot.y+=6;
  const samples=playerContactSamples(appearanceId,frameNumber).map(sample=>({x:foot.x+sample.x,y:foot.y+sample.y}));
  for(const target of spawnTargets){
    let hits=0;
    for(const point of samples){
      let sourceX=Math.floor((point.x-target.left)/target.scale);
      const sourceY=Math.floor((point.y-target.top)/target.scale);
      if(target.flipX)sourceX=target.png.width-1-sourceX;
      if(sourceX<0||sourceX>=target.png.width||sourceY<target.png.height*target.sourceMinY||sourceY>=target.png.height)continue;
      if(target.png.data[(sourceY*target.png.width+sourceX)*4+3]>=36&&++hits>=2)return true;
    }
  }
  return false;
};
const simulateSpawnMove=(appearanceId,spawn,frameNumber,du,dv)=>{
  let {u,v}=spawn;
  for(let tick=0;tick<12;tick++){
    for(const [axisU,axisV] of [[du,0],[0,dv]]){
      const steps=Math.max(1,Math.ceil(Math.max(Math.abs(axisU),Math.abs(axisV))/.035));
      for(let step=0;step<steps;step++){
        const nextU=u+axisU/steps,nextV=v+axisV/steps;
        if(envelopeBlocked(nextU,nextV)||blockedBySpawnTargets(appearanceId,frameNumber,nextU,nextV))break;
        u=nextU;v=nextV;
      }
    }
  }
  return Math.hypot(u-spawn.u,v-spawn.v);
};
for(const appearanceId of ['warrior_m','warrior_f','mage_m','mage_f','ranger_m','ranger_f']){
  expect(simulateSpawnMove(appearanceId,{u:14,v:25.02},17,0,-.044)>.20,`${appearanceId} nasce preso no Portão Sul`);
  expect(simulateSpawnMove(appearanceId,{u:25.02,v:14},9,-.044,0)>.20,`${appearanceId} nasce preso no Portão Leste`);
}

// Contato por imagem: o corpo-base consulta exclusivamente a opacidade real.
expect(scene.includes('this.player.setOrigin(.5,1).setScale(1.28)'),'jogador não usa a mesma altura dos NPCs com origem nos pés');
expect(scene.includes("height: 124, gateGuard: true")&&(scene.match(/height: 124, gateGuard: true/g)||[]).length===2,'guardas dos dois portões não foram igualados à escala corporal dos NPCs');
expect(scene.includes('getPlayerCollisionSamples()')&&scene.includes("const key = `player-${this.player.appearanceId}-base`")&&scene.includes('alpha >= 64'),'máscara corporal do jogador não usa a folha-base opaca');
expect(scene.includes('const contactBandStart = Math.floor(height * .66)')&&scene.includes('for (let y = contactBandStart; y < height; y += step)'),'contato do jogador ainda usa cabeça/arma e pode nascer preso ao guarda');
expect(scene.includes('isBlockedBySolidMasks(u, v)')&&scene.includes('getTextureAlphaMask(entry.key, geometry.frameName)')&&scene.includes('targetMask.alpha[sourceY * targetMask.width + sourceX]'),'colisão urbana não consulta a opacidade dos sprites');
expect(scene.includes("document.createElement('canvas')")&&scene.includes('this.textureAlphaMaskCache.set(cacheKey, mask)'),'máscaras alfa não são pré-calculadas para evitar leitura de canvas por pixel');
expect(scene.includes("registerSolidMask(this.fountain, 'city_fountain'")&&scene.includes("label: 'Marco de Senda'")&&scene.includes("registerSolidMask(image, 'iso_city_wall'"),'fonte, Marco ou muralhas não usam máscaras opacas');
expect(scene.includes("registerSolidMask(this.eastGateSprite, 'iso_city_gate_east'")&&scene.includes("registerSolidMask(this.southGateSprite, 'iso_city_gate'")&&scene.includes('sourceMinY: .56'),'pilares dos portões não possuem máscara inferior própria');
expect(scene.includes('registerSolidMask(npc.sprite')&&!scene.includes('fixedNpcLogical'),'NPCs fixos ainda usam círculos lógicos distantes da imagem');
expect(!scene.includes('addBlockedScreenEllipse')&&!scene.includes('blockedRects')&&!scene.includes('blockedBuildingMasks'),'a cidade ainda contém elipses ou retângulos transparentes de colisão');
expect(scene.includes('/ .035')&&scene.includes('for (let index = 0; index < steps; index++)'),'movimento não usa subpassos contra máscaras finas');
expect(waystone.includes('if(!scene.usesLogicalAlphaCollision)'),'Marco de Senda ainda cria um retângulo invisível na cidade');
expect(scene.includes('this.player.y >= occluder.baseY - occluder.behindMargin'),'contorno dourado não exige posição atrás do objeto');
expect(scene.includes('lowestOccluderDepth - .02')&&scene.includes('this.player.getOutlineTextureKey()'),'oclusão universal dourada não acompanha a aparência ativa');

// Arquitetura IsoSprite fornecida: posição lógica, depth, pivô e fade.
expect(isoArchitecture.includes('export class IsoSprite extends Phaser.GameObjects.Sprite')&&isoArchitecture.includes('export class IsoOcclusionManager'),'classes isométricas-base não foram integradas');
expect(isoArchitecture.includes('this.setOrigin(.5,1)')&&isoArchitecture.includes('const baseDepth=(this.isoX+this.isoY)*100')&&isoArchitecture.includes('const zAdjustment=this.isoZ*.01'),'pivô ou fórmula automática de depth foi alterada');
expect(isoArchitecture.includes('super.setPosition(screen.x,screen.y)')&&isoArchitecture.includes('public setIsoPosition')&&isoArchitecture.includes('return this.updateIsoPosition()'),'posição de tela não é derivada exclusivamente das coordenadas iso');
expect(player.includes('extends IsoPhysicsSprite')&&player.includes('enableIsoMovement')&&scene.includes('this.player.setIsoPosition(u,v,this.player.isoZ)')&&!scene.includes('logicalPlayer'),'movimento do jogador ainda contorna isoX/isoY/isoZ');
expect(isoArchitecture.includes('public setCollideWorldBounds(value:boolean=true): this')&&isoArchitecture.includes('body?.setCollideWorldBounds(value)')&&player.includes('setCollideWorldBounds(true)')&&scene.includes('this.player.setCollideWorldBounds(false)'),'API física encadeável do jogador isométrico está ausente ou incompleta');
expect(player.includes('this.body.setSize(32,16,false)')&&player.includes('this.body.setOffset((this.width-32)/2,this.height-16)'),'colisor Phaser 32×16 não está ancorado nos pés');
expect(scene.includes('const sx = (inputX - inputY) * screenSpeed')&&scene.includes('const sy = (inputX + inputY) * (screenSpeed * .5)'),'movimento não aplica a projeção 2:1 do arquivo de colisão enviado');
expect(scene.includes('new IsoOcclusionManager(this)')&&scene.includes('this.occlusionManager?.registerWall(image)')&&scene.includes('this.occlusionManager?.checkPlayerOcclusion(this.player)'),'paredes não estão registradas/verificadas pelo gerenciador de oclusão');
expect(wandering.includes('targets:this.routeState')&&wandering.includes('this.updateIsoPosition()')&&scene.includes('targets:state.motion')&&scene.includes('sprite.setIsoPosition(state.motion.isoX'),'NPCs ou fauna urbana ainda movem x/y nativos');

// Seis heróis, equipamentos visuais, oito direções e save compatível.
const appearances=['warrior_m','warrior_f','mage_m','mage_f','ranger_m','ranger_f'];
const visualStates=['base','weapon','armor','weapon_armor'];
let playerSheets=0;
for(const appearanceId of appearances){
  expect(playerAppearance.includes(`${appearanceId}:{id:'${appearanceId}'`),`aparência não registrada: ${appearanceId}`);
  for(const state of visualStates){
    for(const suffix of ['','_outline']){
      const relative=`assets/images/characters/player/${appearanceId}_${state}${suffix}.png`;
      expect(exists(relative),`folha do jogador ausente: ${relative}`);
      if(exists(relative)){
        const d=pngDimensions(relative);
        expect(d.width===384&&d.height===768,`folha do jogador não possui 4x8 células 96x96: ${relative}`);
        expect(pngColorType(relative)===6,`folha do jogador não possui alpha RGBA: ${relative}`);
        expect(size(relative)>(suffix?4000:80000),`folha do jogador parece vazia ou simplificada: ${relative}`);
      }
      playerSheets++;
    }
  }
}
expect(playerSheets===48,'quantidade inesperada de folhas do jogador');
for(const direction of ['down:0','downLeft:1','left:2','upLeft:3','up:4','upRight:5','right:6','downRight:7'])expect(playerAppearance.includes(direction),`direção do jogador ausente: ${direction}`);
expect(preload.includes('for(const appearanceId of PLAYER_APPEARANCE_ORDER)')&&preload.includes('for(const state of PLAYER_VISUAL_STATES)')&&preload.includes('{frameWidth:96,frameHeight:96}'),'preload não carrega todas as aparências/estados do jogador');
expect(preload.includes('PLAYER_DIRECTION_ROWS')&&preload.includes('start=row*4,end=start+3'),'animações do jogador não usam oito direções por quatro quadros');
expect(characterSelect.includes("this.selectedAppearance='warrior_m'")&&characterSelect.includes("this.registry.set('selectedAppearance'")&&characterSelect.includes("playerTextureKey(id,'base')"),'tela de novo jogo não permite escolher as seis aparências');
expect(!/heritage|negro|negra|asiát|caucas/i.test(`${playerAppearance}\n${characterSelect}`),'menu ou modelo de aparência ainda expõe rótulos étnicos');
expect(player.includes('facingFromVector(dx,dy')&&player.includes('appearanceId:this.appearanceId')&&player.includes('setEquipmentVisual(slots={})'),'jogador não salva aparência, quantiza oito direções ou reage ao equipamento');
expect(abilitySystem.includes('upRight:[diagonal,-diagonal]')&&abilitySystem.includes('downLeft:[-diagonal,diagonal]'),'habilidade de mobilidade não acompanha as oito direções do jogador');
expect(inventoryPanel.includes("idleFrameForFacing('down')")&&!inventoryPanel.includes('this.player.getIdleFrame()'),'inventário não fixa o retrato frontal do estado atual');
expect(equipment.includes('item.allowedClass===this.player.characterClass')&&equipment.includes('this.player.setEquipmentVisual?.(this.slots)'),'restrição de arma ou aparência equipada não está ligada ao inventário');
expect(itemsCatalog.includes("iron_sword:{id:'iron_sword'")&&itemsCatalog.includes("allowedClass:'warrior'")&&itemsCatalog.includes("apprentice_staff:{id:'apprentice_staff'")&&itemsCatalog.includes("allowedClass:'mage'")&&itemsCatalog.includes("hunter_bow:{id:'hunter_bow'")&&itemsCatalog.includes("allowedClass:'ranger'"),'espada/cajado/arco não possuem restrições corretas de classe');
for(const appearanceId of appearances){
  const files=visualStates.map(state=>fs.readFileSync(path.join(root,`assets/images/characters/player/${appearanceId}_${state}.png`)));
  expect(new Set(files.map(buffer=>buffer.toString('base64'))).size===4,`estados visuais não são distintos: ${appearanceId}`);
}

// Animações e limpeza de arte.
const sheets=[
  ...['merchant','blacksmith','healer','tavernkeeper','scholar','artisan'].map(role=>`${role}_iso_action`),
  'guard_iso_action','south_guard_iso_action','elder_mira_iso_action','general_iso_action'
];
for(const key of sheets){
  const relative=`assets/images/characters/npcs/isometric/${key}.png`;
  expect(exists(relative),`spritesheet ausente: ${key}`);
  if(exists(relative)){
    const dimensions=pngDimensions(relative);
    expect(dimensions.width===1024&&dimensions.height===256,`${key} não possui quatro células 256x256`);
    expect(size(relative)>140000,`${key} está vazio ou degradado`);
  }
  expect(preload.includes(`'${key}'`)&&preload.includes('{frameWidth:256,frameHeight:256}'),`${key} não está carregado`);
}
expect(scene.includes("action: 'guard_iso_action'")&&scene.includes("action: 'south_guard_iso_action'"),'guardas não receberam ações próprias');
expect(npc.includes('setTexture(this.isoActionTexture,0)')&&npc.includes("once('animationcomplete'"),'motor de ações isométricas está ausente');

const elder='assets/images/characters/ambient/elder_feeder_iso.png';
expect(exists(elder),'folha do velhinho ausente');
if(exists(elder)){
  const dimensions=pngDimensions(elder);
  expect(dimensions.width===832&&dimensions.height===224,'folha do velhinho perdeu as quatro células 208x224');
  expect(pngColorType(elder)===6,'folha do velhinho não usa PNG RGBA conservador');
}
expect(preload.includes("this.load.spritesheet('elder_feeder_iso'")&&preload.includes('{frameWidth:208,frameHeight:224}'),'folha do velhinho não está carregada em quatro células exatas');
expect(scene.includes("if (this.textures.exists('elder_feeder_iso'))")&&scene.includes("if (this.anims.exists('elder-feed-birds')) this.oldMan.play"),'falha opcional do velhinho ainda pode derrubar a cidade');
expect(scene.includes('if (!this.textures.exists(texture))')&&scene.includes('return false'),'criação de animações ambiente não verifica a textura');
const mira='assets/images/characters/npcs/isometric/elder_mira_iso.png';
const general='assets/images/characters/npcs/isometric/general_iso.png';
const generalPortrait='assets/images/ui/dialogue/portraits/portrait_general.png';
for(const relative of [mira,general]){
  expect(exists(relative),`NPC isométrico ausente: ${relative}`);
  if(exists(relative)){
    const d=pngDimensions(relative);
    expect(d.width===208&&d.height===224,`NPC não preserva o canvas 208x224: ${relative}`);
    expect(pngColorType(relative)===6,`NPC não possui alpha RGBA: ${relative}`);
  }
}
expect(scene.includes("iso: 'elder_mira_iso', action: 'elder_mira_iso_action', height: 118"),'Mira Edevane não usa a nova proporção e ação 2,5D');
expect(exists(generalPortrait)&&pngDimensions(generalPortrait).width===652&&pngDimensions(generalPortrait).height===880,'retrato do general não preserva o canvas 652x880');
expect(preload.includes("this.load.image('general_iso'")&&preload.includes("this.load.image('portrait_general'"),'general e retrato não estão no preload');
expect(scene.includes("'Cassian Vhal', 'General de Aether', 12.35, 15.15")&&scene.includes("action: 'general_iso_action'")&&scene.includes('Há monstros demais rondando os arredores'),'general, ação própria, posição oposta a Mira ou diálogo sobre a defesa está ausente');
expect(scene.includes("'Kael Dorn', 'Guarda do Portão Leste', 24.20, 13.05")&&scene.includes("facing:'northWest'")&&scene.includes("'Bren Harrow', 'Guarda do Sul', 13.05, 24.20")&&scene.includes("facing:'northEast'"),'guardas não estão nos cantos internos dos portões olhando para a cidade');
const eastGuardSpec=(scene.match(/\['guard', 'Kael Dorn'[^\n]+/)||[''])[0];
expect(eastGuardSpec&&!eastGuardSpec.includes('flipX:true'),'guarda Leste ainda está espelhado para fora da cidade');

// Tomas e Darian possuem oito direções reais, sem espelhamento horizontal.
for(const key of ['resident_iso_walk','traveler_iso_walk']){
  const relative=`assets/images/characters/npcs/isometric/${key}.png`;
  expect(exists(relative),`folha direcional ausente: ${key}`);
  if(exists(relative)){
    const d=pngDimensions(relative);
    expect(d.width===832&&d.height===1792,`${key} não possui 8 linhas x 4 quadros de 208x224`);
    expect(pngColorType(relative)===6,`${key} não possui transparência RGBA`);
  }
  expect(preload.includes(`'${key}'`)&&preload.includes('{frameWidth:208,frameHeight:224}'),`${key} não está carregado em células 208x224`);
}
const residentStats=alphaCellStats('assets/images/characters/npcs/isometric/resident_iso_walk.png',208,224);
expect(residentStats.length===32&&residentStats.every(cell=>cell.height>=198&&cell.height<=206),'morador não mantém altura e baseline consistentes nos 32 quadros');
expect(residentStats.every(cell=>(cell.components[1]??0)<10),'morador ainda possui fragmento desconectado de outro quadro');
expect(scene.includes("residentRoute, 106")&&scene.includes("travelerRoute, 102"),'morador e viajante ainda estão maiores que os NPCs fixos');
for(const relative of [
  'assets/images/characters/player/mage_f_armor.png',
  'assets/images/characters/player/mage_f_weapon.png',
  'assets/images/characters/player/mage_f_weapon_armor.png',
  'assets/images/characters/player/ranger_m_base.png',
  'assets/images/characters/player/ranger_m_armor.png',
  'assets/images/characters/player/ranger_m_weapon.png',
  'assets/images/characters/player/warrior_f_armor.png',
  'assets/images/characters/player/warrior_m_weapon.png'
]){
  const stats=alphaCellStats(relative,96,96);
  expect(stats.length===32&&stats.every(cell=>cell.height>=82&&cell.height<=86),`estado do jogador perdeu escala/baseline: ${relative}`);
  expect(stats.every(cell=>(cell.components[1]??0)<3),`estado do jogador possui halo ou fragmento separado: ${relative}`);
}
for(const relative of [
  'assets/images/characters/player/mage_f_armor.png',
  'assets/images/characters/player/mage_f_weapon.png',
  'assets/images/characters/player/mage_f_weapon_armor.png',
  'assets/images/characters/player/ranger_m_armor.png',
  'assets/images/characters/player/ranger_m_weapon.png'
]){
  expect(neutralWhitePixelCount(relative)===0,`estado do jogador ainda possui flashes/halos brancos: ${relative}`);
}

const hudFrame='assets/images/ui/hud/bottom_hud_frame.png';
expect(exists(hudFrame),'moldura artística da barra inferior está ausente');
if(exists(hudFrame)){
  const d=pngDimensions(hudFrame);
  expect(d.width===960&&d.height===154,'moldura da barra inferior não preserva o canvas 960x154');
  expect(pngColorType(hudFrame)===6,'moldura da barra inferior não possui transparência RGBA');
}
expect(preload.includes("this.load.image('bottom_hud_frame'")&&bottomBar.includes("scene.add.image(0,0,'bottom_hud_frame')"),'arte da barra inferior não está integrada ao preload/Phaser');
expect(bottomBar.includes('for(let index=0;index<8;index++)')&&bottomBar.includes("this.slotTexts[3].setText('ESPAÇO\\nATAQUE\\nBÁSICO')"),'barra inferior não reserva exatamente oito habilidades/comandos');
expect(bottomBar.includes('I  INVENTÁRIO   •   K  SKILLS   •   C  CONTROLES   •   P  MENU'),'barra inferior não informa os quatro atalhos I/K/C/P');
expect(bottomBar.includes('this.hpOrb.setEndAngle(-90+360*healthRatio)')&&bottomBar.includes('this.manaOrb.setEndAngle(-90+360*manaRatio)'),'HP e Mana não diminuem visualmente com os valores reais');
expect(bottomBar.includes('this.frameWidth=960')&&bottomBar.includes('this.root.setPosition(width/2,height).setScale(scale,scale)')&&!bottomBar.includes('setDisplaySize(this.frameWidth,this.frameHeight)'),'moldura inferior ainda é esticada em vez de usar os pixels nativos');
for(const direction of ['south:0','southWest:1','west:2','northWest:3','north:4','northEast:5','east:6','southEast:7']){
  expect(npc.includes(direction),`mapeamento direcional ausente: ${direction}`);
}
expect(npc.includes('const start=Number(row)*4')&&npc.includes('{start,end:start+3}'),'motor de caminhada não usa quatro quadros por direção');
expect(wandering.includes('Math.atan2(dy,dx)')&&wandering.includes("['east','southEast','south','southWest','west','northWest','north','northEast']"),'andarilhos não quantizam movimento em oito direções');
expect(wandering.includes('this.isoWalkAnimations[dir]')&&wandering.includes('this.sprite.setFlipX(false).play(animation,true)'),'andarilhos ainda dependem de espelhamento em vez de animações direcionais');

const smoke='assets/images/environment/buildings/chimney_smoke.png';
expect(exists(smoke),'folha de fumaça compartilhada está ausente');
if(exists(smoke)){
  const dimensions=pngDimensions(smoke);
  expect(dimensions.width===384&&dimensions.height===96,'fumaça não possui quatro células 96x96');
}
expect(preload.includes("this.load.spritesheet('chimney_smoke'")&&scene.includes("smoke.play('city-chimney-smoke')")&&scene.includes('createChimneySmoke(entry)'),'fumaça compartilhada não está ligada às chaminés');
expect((scene.match(/smoke:/g)||[]).length===9,'nem todas as nove chaminés visíveis possuem perfil de fumaça');
expect(!preload.includes("this.load.spritesheet('blacksmith_smoke'")&&!scene.includes("smoke.play('blacksmith-chimney-smoke')"),'efeito antigo exclusivo da ferraria ainda é carregado');
expect(pngDimensions('assets/images/environment/buildings/blacksmith_shop.png').width===501&&pngDimensions('assets/images/environment/buildings/blacksmith_shop.png').height===528,'canvas da ferraria mudou de tamanho');

expect(scene.includes('}).setScale(.76)')&&scene.includes('Phaser.Math.Between(1500,1850)'),'ratos não foram ampliados e desacelerados');
expect(scene.includes("[0,1,2,3], 7")&&scene.includes('leftHidden')&&scene.includes('rightHidden'),'ciclo dos ratos não termina atrás da taverna');

expect(scene.includes('cityRound67Migrated: true')&&world.includes('cityRound67Migrated:true'),'flag de migração do Round 67 não é salva nas duas cenas');
expect(menu.includes('!save.worldFlags?.cityRound67Migrated'),'menu não migra saves anteriores ao Round 67');

const imageFiles=[];
const scan=directory=>{
  for(const entry of fs.readdirSync(directory,{withFileTypes:true})){
    const absolute=path.join(directory,entry.name);
    if(entry.isDirectory())scan(absolute);else imageFiles.push(absolute);
  }
};
scan(path.join(root,'assets/images'));
expect(!imageFiles.some(file=>/round\d+/i.test(path.basename(file))),'há asset com número de Round no nome');

// Limpeza final: somente recursos efetivamente usados permanecem no pacote.
const removedUrban2d=[
  'merchant','blacksmith','healer','scholar','tavernkeeper',
  'elder_mira','artisan','guard','south_guard'
].map(name=>`assets/images/characters/npcs/${name}.png`);
for(const relative of removedUrban2d)expect(!exists(relative),`NPC 2D urbano substituído ainda existe: ${relative}`);
expect(exists('assets/images/characters/npcs/resident.png')&&exists('assets/images/characters/npcs/traveler.png'),'trabalhadores 2D ainda usados nos Arredores foram removidos');
expect(preload.includes("this.load.spritesheet('resident'")&&preload.includes("this.load.spritesheet('traveler'"),'trabalhadores da fazenda não estão no preload');
for(const relative of [
  'assets/images/characters/ambient/elder_feeder.png',
  'assets/images/characters/player.png',
  'assets/images/characters/player_outline_gold.png',
  'assets/images/environment/city/city_grass.png',
  'assets/images/environment/city/city_pavement.png',
  'assets/images/environment/city/city_wall_horizontal.png',
  'assets/images/environment/city/city_wall_vertical.png',
  'assets/images/environment/city/city_tower.png',
  'assets/images/environment/city/gate_east.png',
  'assets/images/environment/city/gate_south.png',
  'assets/images/environment/city/props/city_well.png',
  'assets/images/environment/city/props/city_well_detailed.png',
  'assets/images/environment/buildings/blacksmith_smoke.png',
  'assets/images/environment/isometric/isometric_city_wall_gate_join.png',
  'assets/images/environment/isometric/isometric_city_wall_half_left.png',
  'assets/images/environment/isometric/isometric_city_wall_half_right.png'
])expect(!exists(relative),`asset 2D urbano substituído ainda existe: ${relative}`);
expect(!exists('assets/source'),'pasta assets/source não usada ainda existe');
expect(!exists('ROUND8_MANIFEST.txt'),'manifesto legado do Round 8 ainda existe');
expect(!exists('src/world/AmbientCityLife.ts'),'motor 2D urbano obsoleto ainda existe');
for(const relative of [
  'assets/images/ui/npc_interaction/npc_prompt_panel.png',
  'assets/images/ui/npc_interaction/icon_talk.png',
  'assets/images/ui/npc_interaction/icon_shop.png'
])expect(!exists(relative),`arte substituída de interação ainda existe: ${relative}`);
expect(!/drawCity(?:Ground|Structures|Details)|createNpcsRound58|createNpcsLegacyRound55|updateCityDepthsRound58/.test(world),'código morto da antiga cidade 2D ainda existe em WorldScene');
const rootFiles=fs.readdirSync(root);
expect(!rootFiles.some(name=>/_QA\.png$/i.test(name)),'arquivo de QA ainda existe na raiz');
expect(!rootFiles.some(name=>/^(prepare-round|render-isometric-city|render-player-selection|validate-city-round|validate-isometric-city-round)/.test(name)),'script legado de round ainda existe na raiz');
expect(rootFiles.filter(name=>/^validate.*\.mjs$/.test(name)).join(',')==='validate-project.mjs','há mais de um validador na raiz');

if(issues.length){
  console.error('PROJECT_AUDIT_FAILED');
  for(const issue of issues)console.error(`- ${issue}`);
  process.exit(1);
}

console.log('PROJECT_AUDIT_OK movement=6heroesx2gates contact=opaque-feet iso=authoritative camera=north-margin viewport=native inventory=front npc-prompt=white-unified hud=native+8slots sprites=8clean-states walls=registered gates=center-only occlusion=48outlines assets=runtime-clean');
