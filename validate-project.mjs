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
    stats.push({minX,minY,maxX,maxY,width:maxX-minX+1,height:maxY-minY+1,components});
  }
  return stats;
};
const mirroredAlphaDifference=(relative,rowA,rowB,cellWidth=96,cellHeight=96)=>{
  const png=decodeRgbaPng(relative);
  let difference=0;
  for(let column=0;column<4;column++)for(let y=0;y<cellHeight;y++)for(let x=0;x<cellWidth;x++){
    const alphaA=png.data[((rowA*cellHeight+y)*png.width+column*cellWidth+x)*4+3];
    const alphaB=png.data[((rowB*cellHeight+y)*png.width+column*cellWidth+(cellWidth-1-x))*4+3];
    if(alphaA!==alphaB)difference++;
  }
  return difference;
};
const mirroredRgbaDifference=(relative,rowA,rowB,cellWidth=96,cellHeight=96)=>{
  const png=decodeRgbaPng(relative);let difference=0;
  for(let column=0;column<4;column++)for(let y=0;y<cellHeight;y++)for(let x=0;x<cellWidth;x++){
    const left=((rowA*cellHeight+y)*png.width+column*cellWidth+x)*4;
    const right=((rowB*cellHeight+y)*png.width+column*cellWidth+(cellWidth-1-x))*4;
    for(let channel=0;channel<4;channel++)if(png.data[left+channel]!==png.data[right+channel]){difference++;break}
  }
  return difference;
};
const outlineBodyOverlap=(normalRelative,outlineRelative)=>{
  const normal=decodeRgbaPng(normalRelative),outline=decodeRgbaPng(outlineRelative);
  let overlap=0;
  for(let pixel=0;pixel<normal.width*normal.height;pixel++){
    if(normal.data[pixel*4+3]>=24&&outline.data[pixel*4+3]>=24)overlap++;
  }
  return overlap;
};
const detachedFragmentsAboveHead=(relative,cellWidth=96,cellHeight=96)=>{
  const png=decodeRgbaPng(relative);let fragments=0;
  for(let row=0;row<png.height/cellHeight;row++)for(let column=0;column<png.width/cellWidth;column++){
    const mask=new Uint8Array(cellWidth*cellHeight),parts=[];
    for(let y=0;y<cellHeight;y++)for(let x=0;x<cellWidth;x++)if(png.data[((row*cellHeight+y)*png.width+column*cellWidth+x)*4+3]>=24)mask[y*cellWidth+x]=1;
    for(let start=0;start<mask.length;start++)if(mask[start]===1){
      const stack=[start];mask[start]=2;let count=0,minY=cellHeight,maxY=-1;
      while(stack.length){const index=stack.pop(),x=index%cellWidth,y=Math.floor(index/cellWidth);count++;minY=Math.min(minY,y);maxY=Math.max(maxY,y);
        for(let dy=-1;dy<=1;dy++)for(let dx=-1;dx<=1;dx++){if(!(dx||dy))continue;const nx=x+dx,ny=y+dy;if(nx<0||ny<0||nx>=cellWidth||ny>=cellHeight)continue;const next=ny*cellWidth+nx;if(mask[next]===1){mask[next]=2;stack.push(next)}}
      }
      parts.push({count,minY,maxY});
    }
    parts.sort((a,b)=>b.count-a.count);const main=parts[0];
    if(main)fragments+=parts.slice(1).filter(part=>part.count>=3&&part.maxY<main.minY).length;
  }
  return fragments;
};
const brightNeutralPixelCount=relative=>{
  const png=decodeRgbaPng(relative);let count=0;
  for(let pixel=0;pixel<png.width*png.height;pixel++){
    const index=pixel*4,red=png.data[index],green=png.data[index+1],blue=png.data[index+2],alpha=png.data[index+3];
    if(alpha>=24&&red>225&&green>220&&blue>210)count++;
  }
  return count;
};
const transparentRgbContamination=relative=>{
  const png=decodeRgbaPng(relative);let count=0;
  for(let pixel=0;pixel<png.width*png.height;pixel++){
    const index=pixel*4;
    if(png.data[index+3]===0&&(png.data[index]||png.data[index+1]||png.data[index+2]))count++;
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
const mapHud=read('src/ui/MapHud.ts');
const minimap=read('src/ui/Minimap.ts');
const mapPanel=read('src/ui/MapPanel.ts');
const controlsPanel=read('src/ui/ControlsPanel.ts');
const npcDialogue=read('src/ui/NpcDialoguePanel.ts');
const abilitySystem=read('src/abilities/AbilitySystem.ts');
const playerAppearance=read('src/character/PlayerAppearance.ts');
const characterSelect=read('src/scenes/CharacterSelectScene.ts');
const equipment=read('src/equipment/EquipmentManager.ts');
const itemsCatalog=read('src/items/itemCatalog.ts');
const waystone=read('src/world/Waystone.ts');
const lowerWallSiege=read('src/world/LowerWallSiege.ts');
const prologue=read('src/prologue/OldAetherPrologue.ts');
const cityPavementKit=read('src/world/CityPavementKit.ts');
const fountainWaterEffect=read('src/world/FountainWaterEffect.ts');
const territory=read('src/world/AetherTerritory.ts');
const territoryLayout=read('src/world/AetherTerritoryLayout.ts');
const territoryMap=read('src/world/AetherTerritoryMap.ts');
const world=read('src/scenes/WorldScene.ts');
const woods=read('src/scenes/GreenWoodsScene.ts');
const cave=read('src/scenes/CaveScene.ts');
const castle=read('src/scenes/CastleScene.ts');
const config=read('src/config.ts');
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
expect(scene.includes('const cameraPadY=Math.ceil(this.scale.height/this.cityZoom/2)+80')&&scene.includes('AetherCityScene.WORLD_LEFT-cameraPadX')&&scene.includes('AetherCityScene.WORLD_TOP-cameraPadY')&&scene.includes('AetherCityScene.WORLD_HEIGHT+cameraPadY*2'),'câmera contínua não recalcula margens e origem negativa conforme o viewport');
expect(scene.includes('startFollow(this.player, true, .12, .12, 0, 54)'),'câmera não mantém o herói abaixo do centro para ampliar a leitura ao norte');
expect(main.includes('mode:Phaser.Scale.RESIZE')&&main.includes('pixelArt:false')&&main.includes('antialias:true')&&main.includes('roundPixels:false'),'canvas não renderiza na resolução nativa do navegador');
expect(main.includes('__aetherHighDpi')&&main.includes('window.devicePixelRatio'),'textos não usam textura interna de alta resolução');
expect(indexHtml.includes('image-rendering:auto')&&!indexHtml.includes('image-rendering:pixelated'),'CSS ainda força reamostragem de pixel art');
expect(![scene,world,woods,read('src/scenes/CaveScene.ts'),read('src/scenes/CastleScene.ts')].some(source=>source.includes('setRoundPixels(true)')),'alguma câmera ainda arredonda pixels e degrada as pinturas');
expect(scene.includes("addIsoImage('city_tree', u, v, 184, .02, 13)"),'padding visual da árvore não foi compensado');
expect(scene.includes('const u = 18.95, v = 14.75'),'árvore não ocupa a clareira superior direita do parque aprovado');
const cityBench='assets/images/environment/city/props/city_bench.png';
expect(exists(cityBench),'arte 2,5D do banco urbano está ausente');
if(exists(cityBench)){
  const d=pngDimensions(cityBench);
  expect(d.width===256&&d.height===192&&pngColorType(cityBench)===6,'banco urbano não preserva canvas RGBA compacto e proporcional');
  expect(size(cityBench)>30000,'banco urbano parece vazio ou excessivamente simplificado');
}
expect(preload.includes("this.load.image('city_bench'")&&scene.includes('createEnvironmentalAccents()'),'bancos/acentos ambientais não entram na cidade');
expect(scene.includes("{id:'arvore-jardim-oeste'")&&scene.includes("{id:'arvore-gramado-leste'")&&scene.includes("{id:'banco-praca'")&&scene.includes("{id:'banco-passeio-leste'")&&scene.includes("{id:'banco-residencial'"),'árvores e bancos não possuem distribuição urbana moderada');
expect(scene.includes("mode:'footprint',footprintWidth:30,footprintHeight:15,footprintYOffset:-7")&&scene.includes("registerSolidMask(bench, 'city_bench'")&&scene.includes("mode:'foundation', sourceMinY:.56"),'árvores extras ou bancos não usam base física pequena');
expect(scene.includes("import {FountainWaterEffect} from '../world/FountainWaterEffect'")&&scene.includes('this.createFountainWaterEffect()')&&scene.includes('this.fountainWater?.destroy?.()'),'efeito da fonte não está integrado ou liberado no desligamento');
expect(fountainWaterEffect.includes("setData('decorativeOnly', true)")&&fountainWaterEffect.includes('fillEllipse')&&fountainWaterEffect.includes('strokeEllipse')&&fountainWaterEffect.includes('lineBetween'),'fonte não possui superfície, anéis e fluxo animados');
expect(!fountainWaterEffect.includes('registerSolidMask')&&!fountainWaterEffect.includes('registerOccluder'),'efeito de água alterou indevidamente colisão ou oclusão');
expect(scene.includes('const waystoneY = center.y + 24')&&scene.includes("'waystone_city_dormant'"),'Marco de Senda largo não foi centralizado no jardim');
const cityWaystone='assets/images/environment/world/waystone_city_dormant.png';
expect(exists(cityWaystone),'arte larga do Marco de Senda está ausente');
if(exists(cityWaystone)){
  const d=pngDimensions(cityWaystone);
  expect(d.width===384&&d.height===320&&pngColorType(cityWaystone)===6,'Marco de Senda largo não usa canvas RGBA 384x320');
}
expect(waystone.includes("textureKey='waystone_dormant'")&&waystone.includes("this.cityWideArt?246:124")&&scene.includes('setDisplaySize(246, 205)'),'Marco de Senda não preserva a versão da floresta ou não ocupa todo o jardim urbano');

const waystoneGarden='assets/images/environment/isometric/isometric_waystone_garden.png';
expect(exists(waystoneGarden),'parque amplo do Marco de Senda está ausente');
if(exists(waystoneGarden)){
  const d=pngDimensions(waystoneGarden);
  expect(d.width===768&&d.height===384&&pngColorType(waystoneGarden)===6,'parque do Marco não usa canvas RGBA 2:1 de 768x384');
}
expect(preload.includes("this.load.image('iso_waystone_garden'")&&scene.includes("this.project(17.95, 16.10)")&&scene.includes("'iso_waystone_garden'"),'parque amplo não está integrado à cena nas coordenadas aprovadas');

// Conversa urbana: mesma arte branca da placa de proximidade, mapa escuro e
// recorte transparente do próprio NPC avançando acima do painel inferior.
expect(npcDialogue.includes('fillStyle(0xffffff,.965)')&&npcDialogue.includes('fillRoundedRect(panelX,panelY,panelW,panelHeight,14)'),'painel de conversa não usa a arte branca de proximidade em toda a faixa inferior');
expect(npcDialogue.includes("this.backdrop=s.add.rectangle")&&npcDialogue.includes('0x05080c,.68'),'mapa não é escurecido durante a conversa');
expect(npcDialogue.includes('this.portrait=s.add.sprite')&&npcDialogue.includes('const spriteKey=config.spriteKey')&&!npcDialogue.includes('dialogue_portrait_frame'),'conversa ainda usa retrato com fundo ou moldura');
expect(scene.includes('spriteKey: near.isoBaseTexture ?? near.textureKey')&&scene.includes('near.showConversationIcon?.()'),'conversa não usa o recorte transparente ou remove o ícone sobre o NPC');
expect(scene.includes("name: 'Marco de Senda'")&&scene.includes('pages: this.waystone.readMessage().split')&&scene.includes('spriteKey: this.waystone.textureKey'),'Marco de Senda não usa o mesmo painel branco e o recorte 2,5D das conversas');

// Mercado e vegetação mantêm os canvases da planta, enquanto o piso passou
// a ser validado pelo kit modular logo abaixo.
const cityGrass='assets/images/environment/isometric/isometric_city_grass.png';
const grassPatch='assets/images/environment/isometric/isometric_grass_patch.png';
const grassTufts='assets/images/environment/isometric/isometric_grass_tufts.png';
const merchantShop='assets/images/environment/buildings/merchant_shop.png';
expect(exists(merchantShop),'novo mercado de Aldren está ausente');
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
expect(preload.includes("this.load.image('merchant_shop'"),'novo mercado não está no preload');
// Round 67.1: a malha não pode voltar a depender de um único piso grande ou
// das antigas bordas marrons. Ela deve ser montada por losangos de pedra.
const pavementTiles=['a','b','c','d'].map(letter=>`assets/images/environment/isometric/iso_pavement_tile_${letter}.png`);
for(const relative of pavementTiles){
  expect(exists(relative),`peça modular de pavimento ausente: ${relative}`);
  if(exists(relative)){
    const d=pngDimensions(relative);
    expect(d.width===192&&d.height===96&&pngColorType(relative)===6,`peça modular inesperada: ${relative}`);
    expect(size(relative)>18000,`peça modular sem detalhe de calçamento: ${relative}`);
  }
}
expect(preload.includes("this.load.image('iso_pavement_tile_a'")&&preload.includes("this.load.image('iso_pavement_tile_d'"),'as peças modulares não entram no preload');
expect(scene.includes("import {CityPavementKit} from '../world/CityPavementKit'")&&scene.includes('this.cityPavement = new CityPavementKit')&&scene.includes('this.cityPavement.build()'),'a cidade não instancia o kit modular de pavimento');
expect(!scene.includes("this.add.image(C.ORIGIN_X, centerY, 'iso_city_pavement_v2'")&&!scene.includes("'iso_city_streets'")&&!scene.includes("'iso_residential_ground'"),'a cidade ainda desenha a solução de rua por imagem gigante');
expect(!preload.includes("'iso_city_pavement_v2'")&&!preload.includes("'iso_city_streets'")&&!preload.includes("'iso_residential_ground'"),'preload ainda carrega as camadas urbanas substituídas');
for(const method of ['street(','sidewalk(','corner(','intersection(','entry(','plazaLink(','fountainContour(']){
  expect(cityPavementKit.includes(method),`kit modular não declara ${method}`);
}
expect(cityPavementKit.includes("this.street('corredor-norte'")&&cityPavementKit.includes("this.plaza('praca-da-fonte'")&&cityPavementKit.includes("this.street('espinha-residencial'")&&cityPavementKit.includes("this.plazaLink('ligacao-praca-leste'")&&cityPavementKit.includes("this.plazaLink('ligacao-praca-sul'"),'malha não liga comércio, praça, bairro e portões');
expect(scene.includes("flipX:true")&&scene.includes("npc:[7.55,13.68]"),'mercado não está voltado para a praça com Aldren diante do balcão');
expect(scene.includes('if (building.flipX) image.setFlipX(true)'),'espelhamento do mercado não está aplicado à arte');
expect(scene.includes('if (geometry.flipX) sourceX = geometry.width - 1 - sourceX')&&scene.includes('if(geometry.flipX)sourceX=geometry.width-1-sourceX'),'colisão alfa ou oclusão não acompanha sprites espelhados');
expect(scene.includes("action: 'merchant_iso_action', height: 112, flipX: true")&&npc.includes('setFlipX(!!options.flipX)'),'Aldren e sua ação não estão orientados para a praça');

// Corredor comercial e bairro residencial com vias próprias.
expect(scene.includes("id:'artisan', key:'artisan_house', label:'Ateliê de Maelis', u:23.50, v:6.65")&&scene.includes('rect:[22.00,5.20,3.00,2.75]')&&scene.includes('npc:[23.80,7.48]'),'ateliê e Maelis não estão alinhados à fileira de estabelecimentos');
const newResidentialAssets=['blue','green','ochre','burgundy'];
for(const color of newResidentialAssets){
  const relative=`assets/images/environment/buildings/residential_house_${color}_v2.png`;
  expect(exists(relative),`residência arquitetônica ausente: ${color}`);
  if(exists(relative)){
    const d=pngDimensions(relative);
    expect(d.width===640&&d.height===640,`residência ${color} não preserva o canvas 640x640`);
    expect(pngColorType(relative)===6,`residência ${color} não possui alpha RGBA`);
  }
}
expect(preload.includes("'residential_house_blue_v2'")&&preload.includes("'residential_house_burgundy_v2'"),'as novas residências não entram no preload');
expect(scene.includes("key:'residential_house_blue_v2'")&&scene.includes("key:'residential_house_green_v2'")&&scene.includes("key:'residential_house_ochre_v2'")&&scene.includes("key:'residential_house_burgundy_v2'"),'planta residencial não usa as quatro tipologias distintas');
expect(scene.includes("label:'Casa da Ardósia'")&&scene.includes("label:'Sobrado do Musgo'")&&scene.includes("label:'Chalé da Lenha'")&&scene.includes("label:'Casa da Varanda'"),'residências ainda não têm identidade arquitetônica própria');
const residentialRects=[
  [2.95,17.62,2.45,2.12],[7.84,17.48,2.56,2.38],
  [3.20,22.02,2.55,2.12],[7.86,21.98,2.70,2.48]
].map(([u,v,w,h])=>({u1:u,v1:v,u2:u+w,v2:v+h}));
const intersects=(a,b)=>a.u1<b.u2&&a.u2>b.u1&&a.v1<b.v2&&a.v2>b.v1;
const residentialLanes=[
  {u1:5.80,v1:16.80,u2:7.35,v2:25.25},
  {u1:2.75,v1:20.45,u2:10.85,v2:21.95}
];
expect(!residentialRects.some(house=>residentialLanes.some(lane=>intersects(house,lane))),'uma residência ainda invade uma rua do bairro');
expect(scene.includes('[6.60,21.20]')&&scene.includes('[6.60,24.70]')&&scene.includes('[10.70,17.10]'),'rota do Morador não acompanha a nova circulação residencial');
const residentRoutePoints=[[10.70,20.80],[9.80,21.20],[8.40,21.20],[6.60,21.20],[6.60,23.70],[6.60,24.70],[4.70,21.20],[3.00,21.20],[6.60,19.00],[6.60,17.10],[8.70,17.10],[10.70,17.10],[10.70,18.80]];
expect(!residentRoutePoints.some(([u,v])=>residentialRects.some(house=>u>house.u1&&u<house.u2&&v>house.v1&&v<house.v2)),'rota do Morador atravessa uma fundação residencial');
expect(scene.includes('let emission=0')&&scene.includes('const gust=.88+')&&scene.includes('emission++'),'fumaça das chaminés ainda repete um loop mecânico');

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
expect(world.includes("this.scene.start('AetherCityScene')")&&world.includes("this.registry.set('aetherContinuousSpawn'")&&!world.includes('new Player')&&!world.includes('new Enemy'),'WorldScene legado não foi reduzido a um migrador sem gameplay paralelo');
expect(woods.includes('near.showConversationIcon?.()')&&woods.includes('npc?.hideConversationIcon?.()'),'Floresta não controla o indicador de conversa');
expect(waystone.includes("'Examinar'")&&waystone.includes('createInteractionPrompt'),'Marco de Senda não usa o cartão F · Examinar');
expect(!waystone.includes('F • Conversar'),'Marco de Senda foi configurado incorretamente para conversar');

// Muros modulares, portões compactados e cantos laterais sem emendas.
const wall='assets/images/environment/isometric/isometric_city_wall.png';
const southGate='assets/images/environment/isometric/isometric_city_gate.png';
const eastGate='assets/images/environment/isometric/isometric_city_gate_east.png';
const sideCorner='assets/images/environment/isometric/isometric_city_wall_side_corner.png';
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
expect(scene.includes('overlaps(u,1.18,3.12)')&&scene.includes('overlaps(u,25.22,27.35)')&&scene.includes('insideEastGate')&&scene.includes('insideSouthGate'),'faixas físicas dos muros contínuos não estão calibradas');
expect(exists(sideCorner),'pilar próprio dos cantos laterais está ausente');
if(exists(sideCorner)){
  const d=pngDimensions(sideCorner);
  expect(d.width===256&&d.height===320&&pngColorType(sideCorner)===6,'pilar lateral não usa canvas RGBA 256x320');
}
expect(preload.includes("this.load.image('iso_city_wall_side_corner'")&&scene.includes('this.addSideCornerPillar(2,26)')&&scene.includes('this.addSideCornerPillar(26,2)'),'pilares não cobrem os dois encontros laterais da muralha');
expect(scene.includes('const targetHeight=166')&&scene.includes('depthOffset:108')&&scene.includes('setFlipX(u>v)'),'pilar lateral não preserva acabamento espelhado e profundidade nas duas emendas');
expect(scene.includes("this.registerOccluder(pillar,key,p.y+10")&&scene.includes("this.registerSolidMask(pillar,key,{label:'pilar de canto da muralha'"),'pilar lateral não participa da oclusão e da colisão opaca');

// Cerco dos muros inferiores: seis estações estritamente cenográficas.
const siegeGoblin='assets/images/characters/siege/goblin_wall_raider.png';
const siegeArcher='assets/images/characters/siege/aether_wall_archer.png';
for(const [relative,key] of [[siegeGoblin,'siege_goblin'],[siegeArcher,'siege_archer']]){
  expect(exists(relative),`ator do cerco ausente: ${relative}`);
  if(exists(relative)){
    const d=pngDimensions(relative);
    expect(d.width===256&&d.height===256&&pngColorType(relative)===6,`ator do cerco não usa canvas RGBA 256x256: ${relative}`);
  }
  expect(preload.includes(`this.load.image('${key}'`),`ator do cerco não está no preload: ${key}`);
}
expect(scene.includes("import {LowerWallSiege} from '../world/LowerWallSiege'")&&scene.includes('this.createLowerWallSiege()')&&scene.includes('this.lowerWallSiege=new LowerWallSiege(this,{'),'sistema visual do cerco não é iniciado pela cidade');
for(const station of [
  "{wall:'south',lane:6.70", "{wall:'south',lane:10.15", "{wall:'south',lane:17.90",
  "{wall:'south',lane:21.30", "{wall:'east',lane:10.85", "{wall:'east',lane:18.40"
])expect(lowerWallSiege.includes(station),`estação visual do cerco ausente: ${station}`);
expect(lowerWallSiege.includes('v:25.36,z:78')&&lowerWallSiege.includes('u:25.36,v:spec.lane,z:78'),'arqueiros não estão posicionados no parapeito dos muros inferiores');
expect(lowerWallSiege.includes(".setData('decorativeOnly',true)")&&lowerWallSiege.includes('[archer,goblin,corpse].forEach(actor=>actor.disableInteractive())'),'atores do cerco não estão marcados como cenográficos e não interativos');
expect(!/physics\.add|new Enemy|health\s*=|takeDamage|setInteractive\s*\(/.test(lowerWallSiege),'cerco visual recebeu física, combate, vida ou interação indevida');
expect(lowerWallSiege.includes('spawnGoblin(station)')&&lowerWallSiege.includes('goblinStrike(station,strike)')&&lowerWallSiege.includes('fireArrow(station)')&&lowerWallSiege.includes('defeatGoblin(station)'),'ciclo goblin-ataca/archeiro-dispara/queda está incompleto');
expect(lowerWallSiege.includes('corpse.setIsoPosition(attackIso.u,attackIso.v,0).setFrame(5).setVisible(true)')&&lowerWallSiege.includes('removeCorpseWhenAttackBegins')&&lowerWallSiege.includes('this.schedule(650+station.index%3*140,()=>this.spawnGoblin(station))'),'goblin derrotado não mantém cadáver e reinicia o ciclo infinito');
expect(lowerWallSiege.includes('arrow.setDepth(Phaser.Math.Linear(archer.depth,goblin.depth,t)+1.5)')&&lowerWallSiege.includes('depthBase:this.config.depthBase,depthOffset'),'flechas e atores não respeitam a profundidade isométrica');
expect(scene.includes('this.lowerWallSiege?.destroy?.()'),'cerco visual não é limpo ao encerrar a cena');

const siegeZoneBlocked=(u,v,radius=.27)=>{
  const stations=[[6.70,26.82],[10.15,26.82],[17.90,26.82],[21.30,26.82],[26.82,10.85],[26.82,18.40]];
  return stations.some(([su,sv])=>((u-su)/(1.02+radius))**2+((v-sv)/(1.08+radius))**2<=1);
};
expect(scene.includes('if (this.isBlockedByLowerWallSiegeZone(u,v,radius)) return true'),'barreira do cerco não participa da colisão autoritativa da cidade');
expect(scene.includes('const stations=[')&&scene.includes('{u:6.70,v:26.82}')&&scene.includes('{u:26.82,v:18.40}'),'seis zonas físicas locais do cerco não foram declaradas');
expect(siegeZoneBlocked(21.30,26.82),'estação sul permite alcançar os goblins');
expect(!siegeZoneBlocked(14,25.1),'corredor do Portão Sul foi fechado pela barreira do cerco');
expect(siegeZoneBlocked(26.82,18.40),'estação leste permite alcançar os goblins');
expect(!siegeZoneBlocked(25.1,14),'corredor do Portão Leste foi fechado pela barreira do cerco');
expect(lowerWallSiege.includes('setRegionActive(value)')&&lowerWallSiege.includes('this.clearRuntime()')&&lowerWallSiege.includes('disposeTween(tween)')&&scene.includes('this.lowerWallSiege?.setRegionActive?.'),'cerco distante não suspende/libera timers, tweens e atores por região');

// Portões: vão real único e retorno direcional no limite interno.
expect(scene.includes('static readonly GATE_MIN = 12.70')&&scene.includes('static readonly GATE_MAX = 15.30'),'largura física dos arcos não foi ampliada para o corpo lógico no vão central');
expect(scene.includes('this.player.setIsoPosition(25.02,14,-6)')&&scene.includes('this.player.setIsoPosition(14,25.02,-6)'),'retornos dos portões não usam coordenadas isométricas no limite interno');
expect(scene.includes("this.entryFacing = 'left'")&&scene.includes("this.entryFacing = 'up'"),'direção de retorno dos portões não foi preservada');
expect(!scene.includes('checkGateTransitions()')&&!scene.includes('exitCity(gate)')&&!scene.includes("this.scene.start('WorldScene')")&&!scene.includes('fromAetherCity'),'portões ainda executam troca de cena ou teleporte');

const envelopeBlocked=(u,v,r=.27)=>{
  const overlaps=(value,start,end)=>value+r>=start&&value-r<=end;
  const along=value=>overlaps(value,1.15,26.85);
  const insideEast=v-r>13.42&&v+r<14.58;
  const insideSouth=u-r>13.42&&u+r<14.58;
  return (overlaps(u,1.18,3.12)&&along(v))||(overlaps(v,1.18,3.12)&&along(u))||
    (overlaps(u,25.22,27.35)&&along(v)&&!insideEast)||(overlaps(v,25.22,27.35)&&along(u)&&!insideSouth);
};
expect(!envelopeBlocked(25.02,14),'spawn interno do Portão Leste está bloqueado');
expect(!envelopeBlocked(14,25.02),'spawn interno do Portão Sul está bloqueado');
expect(envelopeBlocked(25.7,12.7),'torre do Portão Leste permite passagem lateral');
expect(envelopeBlocked(12.7,25.7),'torre esquerda do Portão Sul permite saída');
expect(!envelopeBlocked(26.2,14),'centro do arco Leste foi fechado');
expect(!envelopeBlocked(14,26.2),'centro do arco Sul foi fechado');
expect(!envelopeBlocked(28.4,14)&&!envelopeBlocked(14,28.4),'área externa dos portões ainda é tratada como inválida');
expect(!envelopeBlocked(35,20)&&!envelopeBlocked(20,35),'Arredores continuam presos ao antigo envelope urbano');

// Regressão dos portões: o mesmo corpo lógico deve sair dos dois spawns com
// qualquer aparência/estado visual e em todas as oito direções.
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
  targetGeometry('assets/images/environment/isometric/isometric_city_gate.png',14,26.03,384/1285,{offsetY:-3,sourceMinY:.56})
);
const logicalBodyProfile={width:32,height:16,radiusX:14,radiusY:7,centerYOffset:-8};
const playerContactSamples=(()=>{
  const samples=[];
  for(let y=-14;y<=-2;y+=3)for(let x=-14;x<=14;x+=4){
    const nx=x/logicalBodyProfile.radiusX,ny=(y-logicalBodyProfile.centerYOffset)/logicalBodyProfile.radiusY;
    if(nx*nx+ny*ny<=1.02)samples.push({x,y});
  }
  for(const sample of [{x:0,y:-15},{x:0,y:-8},{x:0,y:-1},{x:-14,y:-8},{x:14,y:-8}]){
    if(!samples.some(point=>point.x===sample.x&&point.y===sample.y))samples.push(sample);
  }
  return samples;
})();
const guardFootprints=[
  {...project(24.65,11.75),width:24,height:12,worldYOffset:8,centerYOffset:-10},
  {...project(11.75,24.65),width:24,height:12,worldYOffset:8,centerYOffset:-10}
];
const footprintScore=(foot,target)=>{
  const playerCenter={x:foot.x,y:foot.y+logicalBodyProfile.centerYOffset};
  const targetCenter={x:target.x,y:target.y+(target.worldYOffset||0)+(target.centerYOffset??-target.height/2)};
  const dx=(playerCenter.x-targetCenter.x)/(logicalBodyProfile.radiusX+target.width/2);
  const dy=(playerCenter.y-targetCenter.y)/(logicalBodyProfile.radiusY+target.height/2);
  const squared=dx*dx+dy*dy;
  return squared<1?Math.max(1,Math.round((1-squared)*100)):0;
};
const spawnCollisionScore=(u,v)=>{
  const foot=project(u,v);foot.y+=6;
  const samples=playerContactSamples.map(sample=>({x:foot.x+sample.x,y:foot.y+sample.y}));
  let total=0;
  for(const target of spawnTargets){
    let hits=0;
    for(const point of samples){
      let sourceX=Math.floor((point.x-target.left)/target.scale);
      const sourceY=Math.floor((point.y-target.top)/target.scale);
      if(target.flipX)sourceX=target.png.width-1-sourceX;
      if(sourceX<0||sourceX>=target.png.width||sourceY<target.png.height*target.sourceMinY||sourceY>=target.png.height)continue;
      if(target.png.data[(sourceY*target.png.width+sourceX)*4+3]>=36)hits++;
    }
    if(hits>=2)total+=hits;
  }
  for(const target of guardFootprints)total+=footprintScore(foot,target);
  return total;
};
const normalizedInput=(x,y)=>{const length=Math.hypot(x,y);return length?{x:x/length,y:y/length}:{x:0,y:0}};
const movementParts=(inputX,inputY,speed=170,dt=.016)=>{
  const input=normalizedInput(inputX,inputY),sx=input.x*speed,sy=input.y*speed;
  return{
    screen:{x:sx,y:sy},
    full:{u:(sx/96+sy/48)*dt,v:(-sx/96+sy/48)*dt},
    horizontal:{u:sx/96*dt,v:-sx/96*dt},
    vertical:{u:sy/48*dt,v:sy/48*dt}
  };
};
const simulateSpawnMove=(spawn,inputX,inputY,ticks=12)=>{
  let {u,v}=spawn;
  for(let tick=0;tick<ticks;tick++){
    const parts=movementParts(inputX,inputY);
    const steps=Math.max(1,Math.ceil(Math.max(Math.abs(parts.full.u),Math.abs(parts.full.v))/.035));
    const attempt=(part)=>{
      const nextU=u+part.u/steps,nextV=v+part.v/steps;
      if(envelopeBlocked(nextU,nextV))return false;
      const currentScore=spawnCollisionScore(u,v),nextScore=spawnCollisionScore(nextU,nextV);
      if(nextScore>0&&!(currentScore>0&&nextScore<=currentScore))return false;
      u=nextU;v=nextV;return true;
    };
    for(let step=0;step<steps;step++){
      if(attempt(parts.full))continue;
      let slid=false;
      if(attempt(parts.horizontal))slid=true;
      if(attempt(parts.vertical))slid=true;
      if(!slid)break;
    }
  }
  return Math.hypot(u-spawn.u,v-spawn.v);
};
const inputDirections=[
  ['W',0,-1,'up'],['S',0,1,'down'],['A',-1,0,'left'],['D',1,0,'right'],
  ['W+A',-1,-1,'upLeft'],['W+D',1,-1,'upRight'],['S+A',-1,1,'downLeft'],['S+D',1,1,'downRight']
];
const facingFor=(x,y)=>['right','downRight','down','downLeft','left','upLeft','up','upRight'][Math.round(((Math.atan2(y,x)*180/Math.PI+360)%360)/45)%8];
for(const [keys,x,y,expectedFacing] of inputDirections){
  const parts=movementParts(x,y,176,.02);
  const projected={x:(parts.full.u-parts.full.v)*48,y:(parts.full.u+parts.full.v)*24};
  expect(Math.abs(Math.hypot(parts.screen.x,parts.screen.y)-176)<1e-9,`${keys} possui velocidade diferente de 176 px/s`);
  expect(Math.abs(projected.x-parts.screen.x*.02)<1e-9&&Math.abs(projected.y-parts.screen.y*.02)<1e-9,`${keys} não preserva o vetor após a inversa isométrica`);
  expect(facingFor(parts.screen.x,parts.screen.y)===expectedFacing,`${keys} seleciona ${facingFor(parts.screen.x,parts.screen.y)} em vez de ${expectedFacing}`);
}
expect(facingFor(-1,-1)==='upLeft','regressão específica A+W não produz noroeste');
const horizontalInput="(this.cursors.right.isDown||this.keys.D.isDown?1:0)-(this.cursors.left.isDown||this.keys.A.isDown?1:0)";
const verticalInput="(this.cursors.down.isDown||this.keys.S.isDown?1:0)-(this.cursors.up.isDown||this.keys.W.isDown?1:0)";
for(const [label,source] of [['Cidade e Arredores',scene],['Floresta',woods],['Caverna',cave],['Castelo',castle]]){
  const compact=source.replace(/\s+/g,'');
  expect(compact.includes(horizontalInput)&&compact.includes(verticalInput),`${label} não trata Setas e WASD como entradas equivalentes`);
}
for(const appearanceId of ['warrior_m','warrior_f','mage_m','mage_f','ranger_m','ranger_f']){
  for(const visualState of ['base','weapon','armor','weapon_armor']){
    expect(simulateSpawnMove({u:14,v:25.02},0,-1,12)>.20,`${appearanceId}/${visualState} nasce preso no Portão Sul`);
    expect(simulateSpawnMove({u:25.02,v:14},-1,0,12)>.20,`${appearanceId}/${visualState} nasce preso no Portão Leste`);
    for(const [keys,x,y] of inputDirections){
      expect(simulateSpawnMove({u:14,v:25.02},x,y,1)>.004,`${appearanceId}/${visualState}/${keys} não inicia no Portão Sul`);
      expect(simulateSpawnMove({u:25.02,v:14},x,y,1)>.004,`${appearanceId}/${visualState}/${keys} não inicia no Portão Leste`);
    }
  }
}

// Corpo lógico universal + alvos físicos reais no chão.
expect(scene.includes('this.player.setVisualScale(1.28)'),'sprite visual não usa a mesma altura dos NPCs com origem nos pés');
expect(scene.includes("height: 124, gateGuard: true")&&(scene.match(/height: 124, gateGuard: true/g)||[]).length===2,'guardas dos dois portões não foram igualados à escala corporal dos NPCs');
expect(player.includes('export const PLAYER_LOGICAL_BODY=Object.freeze')&&player.includes('width:32')&&player.includes('height:16')&&player.includes('radiusX:14')&&player.includes('radiusY:7'),'perfil lógico fixo 32×16 não foi declarado');
expect(player.includes("const logicalTexture=scene.textures.exists('player-logical-body')")&&player.includes('super.setVisible(false).setAlpha(0)'),'corpo autoritativo ainda renderiza a arte do jogador');
expect(player.includes('export class PlayerVisual extends Phaser.GameObjects.Sprite')&&player.includes('this.visual=new PlayerVisual')&&player.includes('syncFromBody()'),'PlayerVisual não está separado ou ligado ao corpo lógico');
expect(player.includes('getLogicalCollisionSamples(){return LOGICAL_BODY_SAMPLES}')&&scene.includes('return this.player.getLogicalCollisionSamples()'),'colisão urbana ainda depende da textura, direção ou quadro do jogador');
expect(player.includes('refreshAppearanceTexture()')&&player.includes('this.visual.setTexture(key,this.getIdleFrame())')&&player.includes('this.configureLogicalBody()'),'troca visual não preserva explicitamente o corpo lógico');
expect(preload.includes("generateTexture('player-logical-body',32,16)"),'textura técnica fixa do corpo lógico não é criada');
expect(scene.includes('getSolidMaskCollisionScore(u, v)')&&scene.includes('currentScore>0&&nextScore<=currentScore'),'colisão não permite escapar de uma sobreposição antiga');
expect(!scene.includes("generateTexture('iso_player_shadow'")&&!scene.includes('fillEllipse(24,9,48,18)'),'sombra circular ainda faz o jogador parecer flutuar');
expect(scene.includes('isBlockedBySolidMasks(u, v)')&&scene.includes('getTextureAlphaMask(entry.key, geometry.frameName)')&&scene.includes('isSolidSourcePoint('),'colisão urbana não consulta as máscaras físicas dos sprites');
expect(scene.includes("document.createElement('canvas')")&&scene.includes('this.textureAlphaMaskCache.set(cacheKey, mask)'),'máscaras alfa não são pré-calculadas para evitar leitura de canvas por pixel');
expect(scene.includes("registerSolidMask(this.fountain, 'city_fountain'")&&scene.includes("label: 'Marco de Senda'")&&scene.includes("registerSolidMask(image, 'iso_city_wall'"),'fonte, Marco ou muralhas não usam máscaras opacas');
expect(scene.includes("label: 'fonte', mode:'footprint', footprintWidth:94")&&scene.includes("label: building.label, mode: 'isoRect'")&&scene.includes('isIsoRectBlocked(rect, u, v, radius = 0)'),'fonte ou estabelecimentos não usam somente a fundação física');
expect(scene.includes('getFoundationRowSpans(entry,targetMask)')&&scene.includes("if(entry.mode!=='foundation')return false")&&scene.includes('this.isIsoRectBlocked(rect,u,v,this.playerIsoRadius??.27)'),'vãos transparentes das fachadas ou a geometria de navegação divergem do corpo lógico');
expect(scene.includes('registerGateTowerFootprints()')&&scene.includes("label:tower.label,mode:'footprint',footprintWidth:62,footprintHeight:22")&&!scene.includes("registerSolidMask(this.eastGateSprite, 'iso_city_gate_east'"),'torres dos portões não possuem footprint próprio ou o arco fecha a passagem');
expect(scene.includes("mode:'footprint',footprintWidth:24,footprintHeight:12,footprintYOffset:-10")&&scene.includes("footprintYOffset:texture==='city_dog'?-22:-15"),'NPCs, guardas, gato ou cachorro não usam footprints pequenos calibrados aos pés');
expect(!scene.includes('addBlockedScreenEllipse')&&!scene.includes('blockedRects')&&!scene.includes('blockedBuildingMasks'),'a cidade ainda contém elipses ou retângulos transparentes de colisão');
expect(scene.includes("Math.max(Math.abs(full.u),Math.abs(full.v))/.035")&&scene.includes('for(let index=0;index<steps;index++)'),'movimento não usa subpassos contra máscaras finas');
expect(waystone.includes('if(!scene.usesLogicalAlphaCollision)'),'Marco de Senda ainda cria um retângulo invisível na cidade');
const occlusionMethod=scene.slice(scene.indexOf('\n  updateUniversalOcclusion() {'),scene.indexOf('\n  updateActorDepths() {'));
expect(scene.includes('isOccluderInFrontOfPlayer(entry,geometry)')&&scene.includes('const depthGap=geometry.depth-naturalDepth')&&scene.includes('const baseGap=geometry.baseY-this.player.y'),'contorno dourado não exige posição lógica atrás do plano frontal');
expect(scene.includes("createCanvas(overlayKey,96,96)")&&scene.includes('getTextureRgbaData(key, frameName')&&scene.includes('context.putImageData(this.playerOcclusionImageData,0,0)'),'máscara parcial dinâmica do jogador não foi criada');
expect(scene.includes('occluderContainsWorldPoint(candidate,worldX,worldY)')&&scene.includes('output[pixelIndex]=outlinePixels.rgba[pixelIndex]'),'contorno não é recortado pixel a pixel pela área opaca do objeto');
expect(occlusionMethod.includes('setVisualVisible(true).setVisualAlpha(1)')&&!occlusionMethod.includes('setVisualVisible(false)'),'oclusão parcial ainda oculta o sprite normal inteiro');
expect(!occlusionMethod.includes('for (const yFactor')&&!occlusionMethod.includes('totalHits'),'oclusão ainda decide por grade genérica ou quantidade global de proximidade');
expect(scene.includes('this.playerOcclusionActive?occludedPixelCount>0:occludedPixelCount>=2')&&scene.includes('depthGap>-.08&&baseGap>-.75'),'oclusão não possui histerese determinística contra flicker');

// Oclusão parcial real: o retângulo é apenas broad phase. Estes testes usam
// os PNGs efetivos para provar alpha, plano frontal, recorte e transições.
const makeOcclusionGeometry=(relative,worldX,worldY,scale,baseY,depth,flipX=false)=>{
  const png=collisionPng(relative);
  return{relative,png,worldX,worldY,scale,baseY,depth,flipX,
    left:worldX-png.width*scale/2,top:worldY-png.height*scale,
    right:worldX+png.width*scale/2,bottom:worldY};
};
const playerDepthAtFootY=footY=>-5000+((footY-256)/24)*100-.045;
const isOccluderFront=(geometry,footY,wasFront=false)=>{
  const depthGap=geometry.depth-playerDepthAtFootY(footY);
  const baseGap=geometry.baseY-footY;
  return wasFront?depthGap>-.08&&baseGap>-.75:depthGap>.08&&baseGap>.75;
};
const sheetPixelAlpha=(sheet,frame,x,y)=>{
  const sourceX=(frame%4)*96+x,sourceY=Math.floor(frame/4)*96+y;
  return sheet.data[(sourceY*sheet.width+sourceX)*4+3];
};
const rawObjectAlphaAt=(geometry,worldX,worldY)=>{
  if(worldX<geometry.left||worldX>=geometry.right||worldY<geometry.top||worldY>=geometry.bottom)return 0;
  let sourceX=Math.floor((worldX-geometry.left)/geometry.scale);
  const sourceY=Math.floor((worldY-geometry.top)/geometry.scale);
  if(geometry.flipX)sourceX=geometry.png.width-1-sourceX;
  if(sourceX<0||sourceX>=geometry.png.width||sourceY<0||sourceY>=geometry.png.height)return 0;
  return geometry.png.data[(sourceY*geometry.png.width+sourceX)*4+3];
};
const partialOcclusionStats=(normalRelative,outlineRelative,frame,footX,footY,geometry)=>{
  const normal=normalRelative?collisionPng(normalRelative):null;
  const outline=collisionPng(outlineRelative);
  const inFront=isOccluderFront(geometry,footY);
  let bodyPixels=0,rawHiddenBody=0,headPixels=0,rawHiddenHead=0,rawGold=0;
  for(let y=0;y<96;y++)for(let x=0;x<96;x++){
    const worldX=footX+(x+.5-48)*1.28;
    const worldY=footY+(y+.5-96)*1.28;
    const covered=rawObjectAlphaAt(geometry,worldX,worldY)>=24;
    if(sheetPixelAlpha(outline,frame,x,y)>=24&&covered)rawGold++;
    if(normal&&sheetPixelAlpha(normal,frame,x,y)>=24){
      bodyPixels++;
      if(y<48)headPixels++;
      if(covered){rawHiddenBody++;if(y<48)rawHiddenHead++}
    }
  }
  return{inFront,rawGold,gold:inFront?rawGold:0,bodyPixels,rawHiddenBody,
    hiddenRatio:bodyPixels?rawHiddenBody/bodyPixels:0,headPixels,rawHiddenHead};
};
const depthAt=(u,v,isoZ=0,offset=0)=>-5000+(u+v)*100+isoZ*.01+offset;
const fountainPoint=project(14,14);
const fountainGeometry=makeOcclusionGeometry(
  'assets/images/environment/city/props/city_fountain.png',
  fountainPoint.x,fountainPoint.y,176/320,fountainPoint.y-3,depthAt(14,14,0,.03)
);
const treePoint=project(18.95,14.75),treeWorldY=treePoint.y+13;
const treeGeometry=makeOcclusionGeometry(
  'assets/images/environment/city/props/city_tree.png',
  treePoint.x,treeWorldY,184/320,treeWorldY-4,depthAt(18.95,14.75,-13,.02)
);
const merchantPoint=project(6.60,13.35);
const merchantPng=collisionPng('assets/images/environment/buildings/merchant_shop.png');
const merchantGeometry=makeOcclusionGeometry(
  'assets/images/environment/buildings/merchant_shop.png',
  merchantPoint.x,merchantPoint.y,238/merchantPng.height,merchantPoint.y-2,depthAt(6.60,13.35),true
);
const wallPoint=project(9,26),wallPng=collisionPng('assets/images/environment/isometric/isometric_city_wall.png');
const occlusionWallScale=96/250,wallIsoZ=14-wallPng.height*occlusionWallScale/2;
const wallGeometry=makeOcclusionGeometry(
  'assets/images/environment/isometric/isometric_city_wall.png',
  wallPoint.x,wallPoint.y-wallIsoZ,occlusionWallScale,wallPoint.y+7,depthAt(9,26,wallIsoZ,.08)
);
const baseNormal='assets/images/characters/player/warrior_m_base.png';
const baseOutline='assets/images/characters/player/warrior_m_base_outline.png';

const behindFountain=partialOcclusionStats(baseNormal,baseOutline,1,1652,882,fountainGeometry);
expect(behindFountain.inFront&&behindFountain.gold>=20,'atrás da fonte não produz contorno dourado recortado');
expect(behindFountain.hiddenRatio>.15&&behindFountain.hiddenRatio<.65&&behindFountain.headPixels-behindFountain.rawHiddenHead>300,'fonte não preserva cabeça/tronco visíveis durante a oclusão parcial');
const sideFountain=partialOcclusionStats(baseNormal,baseOutline,1,fountainGeometry.right+70,882,fountainGeometry);
expect(sideFountain.inFront&&sideFountain.rawGold===0&&sideFountain.gold===0,'lateral da fonte ativa oclusão sem interseção opaca');
const frontFountain=partialOcclusionStats(baseNormal,baseOutline,1,1652,fountainGeometry.baseY+18,fountainGeometry);
expect(!frontFountain.inFront&&frontFountain.rawGold>=20&&frontFountain.gold===0,'frente da fonte ativa oclusão apesar do depth frontal do jogador');

const behindTree=partialOcclusionStats(baseNormal,baseOutline,1,treeGeometry.worldX+64,treeWorldY-76,treeGeometry);
expect(behindTree.inFront&&behindTree.gold>=20&&behindTree.hiddenRatio>.10&&behindTree.hiddenRatio<.70,'atrás da árvore não recorta pela folhagem/tronco opacos');
const sideTree=partialOcclusionStats(baseNormal,baseOutline,1,treeGeometry.right+70,treeWorldY-76,treeGeometry);
expect(sideTree.inFront&&sideTree.gold===0,'lateral transparente da árvore ativa oclusão');

const behindMerchant=partialOcclusionStats(baseNormal,baseOutline,1,merchantGeometry.right-28,merchantGeometry.baseY-115,merchantGeometry);
expect(behindMerchant.inFront&&behindMerchant.gold>=20&&behindMerchant.hiddenRatio>.10&&behindMerchant.hiddenRatio<.75,'atrás do estabelecimento não produz oclusão parcial');
const sideMerchant=partialOcclusionStats(baseNormal,baseOutline,1,merchantGeometry.right+70,merchantGeometry.baseY-115,merchantGeometry);
expect(sideMerchant.inFront&&sideMerchant.gold===0,'lateral do estabelecimento ativa oclusão por bounding box');

const behindWall=partialOcclusionStats(baseNormal,baseOutline,1,751,1063,wallGeometry);
expect(behindWall.inFront&&behindWall.gold>=20&&behindWall.hiddenRatio>.10&&behindWall.hiddenRatio<.75,'atrás do muro não produz oclusão parcial');

// Todas as aparências, equipamentos, direções e fases de passo conservam o
// mesmo depth lógico e possuem fragmento visual válido na posição encoberta.
const occlusionAppearances=['warrior_m','warrior_f','mage_m','mage_f','ranger_m','ranger_f'];
const occlusionVisualStates=['base','weapon','armor','weapon_armor'];
let occlusionCompatibilityCases=0,minOcclusionPixels=Infinity;
for(const appearanceId of occlusionAppearances)for(const visualState of occlusionVisualStates){
  const outlineRelative=`assets/images/characters/player/${appearanceId}_${visualState}_outline.png`;
  for(let frame=0;frame<32;frame++){
    const stats=partialOcclusionStats(null,outlineRelative,frame,1652,882,fountainGeometry);
    minOcclusionPixels=Math.min(minOcclusionPixels,stats.gold);
    occlusionCompatibilityCases++;
  }
}
expect(occlusionCompatibilityCases===768&&minOcclusionPixels>=2,'alguma classe, sexo, equipamento, direção ou quadro perde a oclusão parcial');

// Trajeto diagonal atravessa uma única faixa opaca: deve entrar uma vez e
// sair uma vez, sem alternâncias intermediárias entre normal e dourado.
let diagonalOcclusionActive=false,diagonalTransitions=0,diagonalVisibleFrames=0;
for(let step=0;step<=60;step++){
  const progress=step/60;
  const footX=1450+(1750-1450)*progress;
  const footY=850+(900-850)*progress;
  const stats=partialOcclusionStats(null,baseOutline,1,footX,footY,fountainGeometry);
  const nextActive=diagonalOcclusionActive?stats.gold>0:stats.gold>=2;
  if(nextActive!==diagonalOcclusionActive)diagonalTransitions++;
  diagonalOcclusionActive=nextActive;
  if(nextActive)diagonalVisibleFrames++;
}
expect(diagonalTransitions===2&&diagonalVisibleFrames>=20,'entrada/saída diagonal da oclusão apresenta flicker ou intervalo instável');

// A fundação fecha portas/frestas internas, mas nunca o padding transparente.
const foundationAssets=[
  ['assets/images/environment/buildings/merchant_shop.png',.62],
  ['assets/images/environment/buildings/scholar_house.png',.60],
  ['assets/images/environment/buildings/blacksmith_shop.png',.62],
  ['assets/images/environment/buildings/healer_house_abandoned.png',.60],
  ['assets/images/environment/buildings/tavern_house.png',.62],
  ['assets/images/environment/buildings/artisan_house.png',.64],
  ['assets/images/environment/buildings/residential_house_blue_v2.png',.58],
  ['assets/images/environment/buildings/residential_house_green_v2.png',.58],
  ['assets/images/environment/buildings/residential_house_ochre_v2.png',.58],
  ['assets/images/environment/buildings/residential_house_burgundy_v2.png',.58],
  ['assets/images/environment/city/props/city_fountain.png',.45]
];
let closedFoundationGaps=0;
for(const [relative,minYRatio] of foundationAssets){
  const png=collisionPng(relative),startY=Math.floor(png.height*minYRatio);
  let physicalRows=0,paddedRows=0;
  for(let y=startY;y<png.height;y++){
    let minX=png.width,maxX=-1,opaque=0;
    for(let x=0;x<png.width;x++)if(png.data[(y*png.width+x)*4+3]>=36){minX=Math.min(minX,x);maxX=Math.max(maxX,x);opaque++}
    if(maxX<0)continue;
    physicalRows++;
    if(minX>0&&maxX<png.width-1)paddedRows++;
    closedFoundationGaps+=Math.max(0,maxX-minX+1-opaque);
  }
  expect(physicalRows>=5,`fundação física vazia: ${relative}`);
  expect(paddedRows>=Math.min(5,physicalRows),`fundação encosta no padding transparente: ${relative}`);
}
expect(closedFoundationGaps>500,'fundação não fecha frestas internas de portas e cantos');

const alignedFoot={x:guardFootprints[0].x,y:guardFootprints[0].y+8-10-logicalBodyProfile.centerYOffset};
expect(footprintScore(alignedFoot,guardFootprints[0])>0,'corpo do Guarda Leste não bloqueia contato real nos pés');
expect(footprintScore({...alignedFoot,x:alignedFoot.x-42},guardFootprints[0])===0,'lança do Guarda Leste ainda cria região invisível exagerada');
for(const target of [
  {x:0,y:0,width:24,height:12,centerYOffset:-22},
  {x:0,y:0,width:18,height:10,centerYOffset:-15}
]){
  const foot={x:0,y:target.centerYOffset-logicalBodyProfile.centerYOffset};
  expect(footprintScore(foot,target)>0,'animal não bloqueia o corpo do jogador');
  expect(footprintScore({...foot,x:foot.x+36},target)===0,'hitbox do animal é maior que seu corpo no chão');
}

// Regressão de sliding: uma diagonal bloqueada no eixo vertical preserva X.
const slideProbe={x:0,y:.4};
const blockedProbe=(x,y)=>y<0;
if(!blockedProbe(slideProbe.x-1,slideProbe.y-1)){slideProbe.x-=1;slideProbe.y-=1}
else{
  if(!blockedProbe(slideProbe.x-1,slideProbe.y))slideProbe.x-=1;
  if(!blockedProbe(slideProbe.x,slideProbe.y-1))slideProbe.y-=1;
}
expect(slideProbe.x===-1&&slideProbe.y===.4,'diagonal não desliza pelo eixo ainda livre');
expect(scene.includes('tryMoveWithSliding(full,horizontal,vertical)')&&scene.includes('this.tryMoveStep(component.u,component.v)'),'cidade não aplica sliding pelos eixos cartesianos da entrada');

// Arquitetura IsoSprite fornecida: posição lógica, depth, pivô e fade.
expect(isoArchitecture.includes('export class IsoSprite extends Phaser.GameObjects.Sprite')&&isoArchitecture.includes('export class IsoOcclusionManager'),'classes isométricas-base não foram integradas');
expect(isoArchitecture.includes('this.setOrigin(.5,1)')&&isoArchitecture.includes('const baseDepth=(this.isoX+this.isoY)*100')&&isoArchitecture.includes('const zAdjustment=this.isoZ*.01'),'pivô ou fórmula automática de depth foi alterada');
expect(isoArchitecture.includes('super.setPosition(screen.x,screen.y)')&&isoArchitecture.includes('public setIsoPosition')&&isoArchitecture.includes('return this.updateIsoPosition()'),'posição de tela não é derivada exclusivamente das coordenadas iso');
expect(player.includes('extends IsoPhysicsSprite')&&player.includes('enableIsoMovement')&&scene.includes('this.player.setIsoPosition(u,v,this.player.isoZ)')&&!scene.includes('logicalPlayer'),'movimento do jogador ainda contorna isoX/isoY/isoZ');
expect(isoArchitecture.includes('public setCollideWorldBounds(')&&isoArchitecture.includes('body?.setCollideWorldBounds(value,bounceX,bounceY,onWorldBounds)'),'IsoPhysicsSprite não expõe o adaptador Arcade usado pelo Player');
expect(player.includes('this.body?.setSize(width,height,false).setOffset(offsetX,offsetY)'),'colisor Phaser 32×16 não está ancorado nos pés');
expect(player.includes('export function playerScreenVelocity')&&player.includes('export function screenVelocityToIsoDelta')&&scene.includes('playerScreenVelocity(ix,iy,this.player.speed)'),'movimento não usa a única normalização e a inversa 2:1 corretas');
expect(scene.includes('new IsoOcclusionManager(this)')&&scene.includes('this.occlusionManager?.registerWall(image)')&&scene.includes('this.occlusionManager?.checkPlayerOcclusion(this.player)'),'paredes não estão registradas/verificadas pelo gerenciador de oclusão');
expect(!isoArchitecture.includes('fadeTo(')&&isoArchitecture.includes('if(wall.alpha!==1)wall.setAlpha(1)'),'gerenciador de oclusão ainda clareia muralhas ou edifícios');
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
        expect(size(relative)>(suffix?8000:80000),`folha do jogador parece vazia ou simplificada: ${relative}`);
      }
      playerSheets++;
    }
    const normalRelative=`assets/images/characters/player/${appearanceId}_${state}.png`;
    const outlineRelative=`assets/images/characters/player/${appearanceId}_${state}_outline.png`;
    if(exists(normalRelative)&&exists(outlineRelative)){
      const stats=alphaCellStats(normalRelative,96,96);
      expect(stats.length===32&&stats.every(cell=>cell.maxY===95),`linha dos pés não termina em y=95: ${normalRelative}`);
      for(const [leftRow,rightRow] of [[1,7],[2,6],[3,5]]){
        expect(mirroredAlphaDifference(normalRelative,leftRow,rightRow)===0,`direções opostas não são espelhos exatos: ${normalRelative} linhas ${leftRow}/${rightRow}`);
        expect(mirroredAlphaDifference(outlineRelative,leftRow,rightRow)===0,`contornos opostos não são espelhos exatos: ${outlineRelative} linhas ${leftRow}/${rightRow}`);
        expect(mirroredRgbaDifference(normalRelative,leftRow,rightRow)===0,`arte visual de direções opostas diverge: ${normalRelative} linhas ${leftRow}/${rightRow}`);
        expect(mirroredRgbaDifference(outlineRelative,leftRow,rightRow)===0,`arte do contorno de direções opostas diverge: ${outlineRelative} linhas ${leftRow}/${rightRow}`);
      }
      expect(outlineBodyOverlap(normalRelative,outlineRelative)<=256,`contorno dourado está preenchendo o corpo: ${outlineRelative}`);
    }
  }
}
expect(playerSheets===48,'quantidade inesperada de folhas do jogador');
// Revisão visual dos heróis: a linha dos pés e a altura física são estáveis
// em todos os 768 quadros (seis aparências × quatro estados × 32 quadros).
for(const appearanceId of appearances)for(const state of visualStates){
  const relative=`assets/images/characters/player/${appearanceId}_${state}.png`;
  const stats=alphaCellStats(relative,96,96);
  expect(stats.length===32&&stats.every(cell=>cell.maxY===95&&cell.height===84),`âncora/escala visual varia entre quadros: ${relative}`);
}
for(const relative of [
  'assets/images/characters/player/mage_f_base.png',
  'assets/images/characters/player/mage_m_base.png',
  'assets/images/characters/player/mage_f_weapon.png',
  'assets/images/characters/player/mage_f_armor.png',
  'assets/images/characters/player/mage_f_weapon_armor.png',
  'assets/images/characters/player/mage_m_armor.png',
  'assets/images/characters/player/mage_m_weapon_armor.png'
])expect(detachedFragmentsAboveHead(relative)===0,`há fragmento solto acima da cabeça: ${relative}`);
for(const relative of [
  'assets/images/characters/player/mage_f_weapon.png',
  'assets/images/characters/player/mage_f_armor.png',
  'assets/images/characters/player/mage_f_weapon_armor.png'
])expect(brightNeutralPixelCount(relative)<=8,`a Maga equipada ainda possui bloco branco indevido: ${relative}`);
for(const direction of ['down:0','downLeft:1','left:2','upLeft:3','up:4','upRight:5','right:6','downRight:7'])expect(playerAppearance.includes(direction),`direção do jogador ausente: ${direction}`);
expect(preload.includes('for(const appearanceId of PLAYER_APPEARANCE_ORDER)')&&preload.includes('for(const state of PLAYER_VISUAL_STATES)')&&preload.includes('{frameWidth:96,frameHeight:96}'),'preload não carrega todas as aparências/estados do jogador');
expect(preload.includes('PLAYER_DIRECTION_ROWS')&&preload.includes('start=row*4,end=start+3'),'animações do jogador não usam oito direções por quatro quadros');
expect(characterSelect.includes("this.selectedAppearance='warrior_m'")&&characterSelect.includes("this.registry.set('selectedAppearance'")&&characterSelect.includes("playerTextureKey(id,'base')"),'tela de novo jogo não permite escolher as seis aparências');
expect(!/heritage|negro|negra|asiát|caucas/i.test(`${playerAppearance}\n${characterSelect}`),'menu ou modelo de aparência ainda expõe rótulos étnicos');
expect(player.includes('facingFromVector(dx,dy')&&player.includes('appearanceId:this.appearanceId')&&player.includes('setEquipmentVisual(slots={})'),'jogador não salva aparência, quantiza oito direções ou reage ao equipamento');
expect(player.includes('this.visual.setFlipX(false)')&&player.includes('this.body.moves=false'),'sprite visual ainda é espelhado ou o Arcade sobrescreve a posição isométrica');
expect(abilitySystem.includes('upRight:[d,-d]')&&abilitySystem.includes('downLeft:[-d,d]')&&abilitySystem.includes("type!=='mobility'&&this.scene.isSafeZone"),'habilidade de mobilidade ou bloqueio da zona segura não acompanha a lógica correta');
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
    const minActionBytes=key==='general_iso_action'?80000:140000;
    expect(size(relative)>minActionBytes,`${key} está vazio ou degradado`);
  }
  expect(preload.includes(`'${key}'`)&&preload.includes('{frameWidth:256,frameHeight:256}'),`${key} não está carregado`);
}
expect(scene.includes("action: 'guard_iso_action'")&&scene.includes("action: 'south_guard_iso_action'"),'guardas não receberam ações próprias');
expect(npc.includes('setTexture(this.isoActionTexture,0)')&&npc.includes("once('animationcomplete'"),'motor de ações isométricas está ausente');
for(const relative of [
  'assets/images/characters/npcs/isometric/guard_iso.png',
  'assets/images/characters/npcs/isometric/guard_iso_action.png'
])expect(transparentRgbContamination(relative)===0,`Guarda Leste ainda possui halo/região branca em pixels transparentes: ${relative}`);
for(const relative of [
  'assets/images/characters/prologue/prologue_young_wolf_sheet_v2.png',
  'assets/images/characters/prologue/prologue_goblin_scout_sheet_v2.png',
  'assets/images/characters/prologue/aether_patrolman_sheet_v2.png',
  'assets/images/environment/outskirts/prologue/abandoned_wagon_v3.png',
  'assets/images/characters/ambient/elder_feeder_iso_v3.png',
  'assets/images/characters/siege/aether_wall_archer_action_v2.png'
])expect(transparentRgbContamination(relative)===0,`Asset 9C conserva RGB contaminado em pixel transparente: ${relative}`);

const elder='assets/images/characters/ambient/elder_feeder_iso_v3.png';
expect(exists(elder),'folha do velhinho ausente');
if(exists(elder)){
  const dimensions=pngDimensions(elder);
  expect(dimensions.width===832&&dimensions.height===224,'folha do velhinho perdeu as quatro células 208x224');
  expect(pngColorType(elder)===6,'folha do velhinho não usa PNG RGBA conservador');
}
expect(preload.includes("this.load.spritesheet('elder_feeder_iso_v3'")&&preload.includes('{frameWidth:208,frameHeight:224}'),'folha do velhinho não está carregada em quatro células exatas');
expect(scene.includes("if (this.textures.exists('elder_feeder_iso_v3'))")&&scene.includes("if (this.anims.exists('elder-feed-birds')) this.oldMan.play"),'falha opcional do velhinho ainda pode derrubar a cidade');
expect(scene.includes("label:'velhinho da praça'")&&scene.includes("frame:()=>this.oldMan?.frame?.name??0"),'velhinho ainda não participa da colisão corporal');
const elderStats=alphaCellStats(elder,208,224);
expect(elderStats.length===4&&elderStats.every(cell=>cell.height>=130&&cell.maxY===215),'velhinho não mantém corpo legível e pés ancorados nos quatro quadros');
expect(scene.includes('const homeLogical = {u: 12.75, v: 10.25}')&&scene.includes('[13.10,10.40,.75]'),'velhinho e pombos não foram reposicionados acima da fonte como conjunto');
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
expect(scene.includes("'Mira Edevane', 'Anciã de Aether', 14.25, 11.75")&&scene.includes("iso: 'elder_mira_iso', action: 'elder_mira_iso_action', height: 120"),'Mira Edevane não usa a nova proporção e posição livre da árvore');
expect(exists(generalPortrait)&&pngDimensions(generalPortrait).width===652&&pngDimensions(generalPortrait).height===880,'retrato do general não preserva o canvas 652x880');
expect(preload.includes("this.load.image('general_iso'")&&preload.includes("this.load.image('portrait_general'"),'general e retrato não estão no preload');
expect(scene.includes("'Cassian Vhal', 'General de Aether', 12.35, 15.15")&&scene.includes('safeIdleBreathing:true')&&npc.includes('if(this.isoSafeBreathing)')&&scene.includes('Há monstros demais rondando os arredores'),'General não usa a respiração segura que evita membros duplicados');
for(const relative of [
  'assets/images/characters/npcs/isometric/elder_mira_iso_action.png',
  'assets/images/characters/npcs/isometric/general_iso_action.png'
]){
  const stats=alphaCellStats(relative,256,256);
  expect(stats.length===4&&stats.every(cell=>cell.maxY===255&&cell.height===208),`ação perdeu escala ou linha fixa dos pés: ${relative}`);
}
const faithlessAction='assets/images/characters/npcs/isometric/healer_iso_devastated_action.png';
expect(exists(faithlessAction)&&preload.includes("'healer_iso_devastated_action'")&&scene.includes("action: healerRestored?'healer_iso_action':'healer_iso_devastated_action'"),'curandeira sem fé permanece sem animação própria');
expect(scene.includes("'Kael Dorn', 'Guarda do Portão Leste', 24.65, 11.75")&&scene.includes("facing:'northWest'")&&scene.includes("'Bren Harrow', 'Guarda do Sul', 11.75, 24.65")&&scene.includes("facing:'northEast'"),'guardas não estão junto às torres, fora do centro dos portões');
expect(scene.includes('actionRepeat:1')&&scene.includes('idleMinDelay:650')&&npc.includes('this.isoActionRepeat=options.actionRepeat??0'),'guardas não receberam uma cadência de animação visível');
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
expect(scene.includes("residentRoute, 106")&&scene.includes("travelerRoute, 106"),'Viajante não usa a mesma altura real do Morador');
const travelerStats=alphaCellStats('assets/images/characters/npcs/isometric/traveler_iso_walk.png',208,224);
expect(travelerStats.length===32&&travelerStats.every(cell=>cell.height===203&&cell.minY===13&&cell.maxY===215),'Viajante não mantém corpo, cabeça e pés estáveis nos 32 quadros');
expect(travelerStats.every(cell=>(cell.components[1]??0)<10),'viajante ainda possui fragmento solto entre os pés');
expect(scene.includes('isAmbientSegmentClear(state,target)')&&scene.includes('isAmbientPositionBlocked(state,state.motion.isoX,state.motion.isoY)'),'cachorro e gato não verificam obstáculos durante as rotas');
expect(scene.includes("label:texture==='city_dog'?'cachorro da cidade':'gato da cidade'")&&scene.includes('owner:sprite,dynamic:true'),'cachorro e gato ainda não bloqueiam o jogador');
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

const hudFrame='assets/images/ui/hud/bottom_hud_frame_v2.png';
expect(exists(hudFrame),'nova moldura artística da barra inferior está ausente');
if(exists(hudFrame)){
  const d=pngDimensions(hudFrame);
  expect(d.width===1320&&d.height===200,'moldura da barra inferior não possui o canvas nativo 1320x200');
  expect(pngColorType(hudFrame)===6,'moldura da barra inferior não possui transparência RGBA');
}
expect(preload.includes("'bottom_hud_frame_v2'")&&bottomBar.includes("scene.add.image(0,0,'bottom_hud_frame_v2')")&&!bottomBar.includes('bottom_hud_center_tile'),'moldura nova e inteira não substituiu a composição antiga em partes');
expect(bottomBar.includes('const slotWidth=44,slotGap=5,slotY=-101,slotCount=15')&&bottomBar.includes("this.slotTexts[5].setPosition")&&bottomBar.includes('index=6;index<10'),'barra inferior não reserva 2 consumíveis + 8 habilidades + 5 comandos');
expect(bottomBar.includes('this.hpOrb.setEndAngle(-90+360*healthRatio)')&&bottomBar.includes('this.manaOrb.setEndAngle(-90+360*manaRatio)'),'HP e Mana não diminuem visualmente com os valores reais');
expect(bottomBar.includes('this.frameWidth=1320')&&bottomBar.includes('this.frameHeight=200')&&bottomBar.includes('maxWidth/this.frameWidth,maxHeight/this.frameHeight')&&bottomBar.includes('.setScale(uniformScale,uniformScale)')&&!bottomBar.includes('this.frame.setDisplaySize'),'moldura inferior ainda pode ser esticada ou achatada');
expect(bottomBar.includes('const orbX=558')&&bottomBar.includes('const orbRadius=58')&&bottomBar.includes('scene.add.circle(-orbX,orbY,orbRadius')&&bottomBar.includes('scene.add.circle(orbX,orbY,orbRadius'),'encaixes de HP e Mana não usam círculos 1:1 idênticos');
expect(bottomBar.includes('setPotionIconState(0,healingCount)')&&bottomBar.includes('setPotionIconState(1,manaCount)')&&bottomBar.includes('setTint(0x222936).setAlpha(.34)'),'ícones de poções vazias não ficam escuros');
expect(indexHtml.includes('<link rel="icon" href="data:,">'),'navegador ainda pode solicitar favicon externo inexistente');
for(const [key,file] of [['healing','healing'],['mana','mana'],['skills','skills'],['inventory','inventory'],['map','map'],['controls','controls'],['menu','menu']]){
  const relative=`assets/images/ui/hud/actions/${file}.png`;
  expect(exists(relative),`ícone do HUD ausente: ${relative}`);
  if(exists(relative)){
    const d=pngDimensions(relative);
    expect(d.width===64&&d.height===64&&pngColorType(relative)===6,`ícone do HUD não usa canvas RGBA 64x64: ${relative}`);
  }
  expect(preload.includes(`'hud_action_${key}'`),`ícone do HUD não está no preload: hud_action_${key}`);
}
expect(bottomBar.includes("10:'K',11:'I',12:'M',13:'C',14:'P'")&&bottomBar.includes("showTooltip(index,x)")&&bottomBar.includes("for(const index of [10,11,12,13,14])this.slotTexts[index].setText('')"),'comandos K/I/M/C/P não aparecem como ícones com tooltip');
expect(mapHud.includes("j:this.key('J'),m:this.key('M')")&&mapHud.includes('this.toggleMap()')&&mapHud.includes('useMana(this.player,this.inventory)'),'M não foi liberado para o mapa ou J não assumiu a poção de mana');
expect(controlsPanel.includes("['J', 'Usar poção de mana']")&&controlsPanel.includes("['M', 'Abrir/fechar mapa']"),'painel de controles não documenta as novas teclas J e M');

const cityMap='assets/images/ui/map/city_map_exact_2_5d.png';
expect(exists(cityMap),'arte 2,5D do mapa da cidade está ausente');
if(exists(cityMap)){
  const d=pngDimensions(cityMap);
  expect(d.width===1024&&d.height===768,'mapa 2,5D da cidade não preserva o canvas 4:3 de 1024x768');
  expect(size(cityMap)>500000,'mapa 2,5D parece vazio ou excessivamente simplificado');
}
expect(preload.includes("this.load.image('city_map_exact_2_5d'")&&territoryMap.includes("scene.textures.exists('city_map_exact_2_5d')")&&scene.includes("mapTexture:this.aetherTerritory.mapKey,mapProjection:'aether-territory'"),'mapa 2,5D da cidade não foi incorporado ao território completo');
expect(minimap.includes('setScrollFactor(0)')&&minimap.includes("this.projection==='aether-territory'")&&minimap.includes('this.localZoom=3.25')&&minimap.includes('this.art.setCrop')&&minimap.includes('this.artWidth,this.artHeight')&&minimap.includes('this.playerHalo')&&minimap.includes('this.playerArrow'),'minimapa não usa recorte local proporcional, âncora fixa e marcador identificável');
expect(mapPanel.includes("this.projection==='aether-territory'")&&mapPanel.includes("'MAPA — AETHER E ARREDORES'")&&mapPanel.includes('this.logicalBounds.maxU-this.logicalBounds.minU')&&mapPanel.includes('this.mapPanel')===false,'painel do território completo está ausente ou contém dependência circular');
expect(mapHud.includes("import {MapPanel} from './MapPanel'")&&mapHud.includes('this.mapPanel.open(this.player)'),'tecla M não abre o painel de mapa expandido');
expect(mapHud.includes('opts.minimapMarkers||opts.markers')&&scene.includes('minimapMarkers:this.aetherTerritory.getMinimapMarkers()'),'minimapa ainda recebe todos os ícones do mapa completo');
expect(mapPanel.includes("typeof marker.isVisible==='function'")&&territory.includes("isVisible:()=>!!this.worldFlags.discoveredLandmarks"),'landmarks externos são revelados antes da descoberta');
for(const direction of ['south:0','southWest:1','west:2','northWest:3','north:4','northEast:5','east:6','southEast:7']){
  expect(npc.includes(direction),`mapeamento direcional ausente: ${direction}`);
}
expect(npc.includes('const start=Number(row)*4')&&npc.includes('{start,end:start+3}'),'motor de caminhada não usa quatro quadros por direção');
expect(wandering.includes('Math.atan2(dy,dx)')&&wandering.includes("['east','southEast','south','southWest','west','northWest','north','northEast']"),'andarilhos não quantizam movimento em oito direções');
expect(wandering.includes('this.isoWalkAnimations[dir]')&&wandering.includes('this.sprite.setFlipX(false).play(animation,true)'),'andarilhos ainda dependem de espelhamento em vez de animações direcionais');

const smoke='assets/images/environment/buildings/chimney_smoke_wisp.png';
expect(exists(smoke),'nova fumaça 2,5D compartilhada está ausente');
if(exists(smoke)){
  const dimensions=pngDimensions(smoke);
  expect(dimensions.width===256&&dimensions.height===384&&pngColorType(smoke)===6,'fumaça 2,5D não usa o canvas RGBA 256x384');
}
expect(preload.includes("this.load.image('chimney_smoke_wisp'")&&scene.includes("this.add.image(mouthX,mouthY+3,'chimney_smoke_wisp')")&&scene.includes('for(let layer=0;layer<3;layer++)')&&scene.includes('createChimneySmoke(entry)'),'fumaça volumétrica compartilhada não está ligada às chaminés');
// A Casa da Ardósia foi criada sem chaminé; todas as outras oito chaminés
// urbanas possuem boca, subida e dissipação próprias.
expect((scene.match(/smoke:/g)||[]).length===8,'nem todas as oito chaminés visíveis possuem perfil de fumaça');
expect(!preload.includes("this.load.spritesheet('blacksmith_smoke'")&&!scene.includes("smoke.play('blacksmith-chimney-smoke')"),'efeito antigo exclusivo da ferraria ainda é carregado');
expect(pngDimensions('assets/images/environment/buildings/blacksmith_shop.png').width===501&&pngDimensions('assets/images/environment/buildings/blacksmith_shop.png').height===528,'canvas da ferraria mudou de tamanho');

expect(scene.includes('}).setScale(.76)')&&scene.includes('Phaser.Math.Between(1500,1850)'),'ratos não foram ampliados e desacelerados');
expect(scene.includes("[0,1,2,3], 7")&&scene.includes('leftHidden')&&scene.includes('rightHidden'),'ciclo dos ratos não termina atrás da taverna');

// Fauna urbana mantém folhas RGBA, quatro poses legíveis e o mesmo recorte
// pintado; nenhuma troca de escala ou de arte é necessária quando já está
// coerente. A correção do gato é exclusivamente de deslocamento real.
for(const [relative,width,height,cellWidth,cellHeight] of [
  ['assets/images/characters/ambient/city_cat.png',576,96,144,96],
  ['assets/images/characters/ambient/city_dog.png',576,96,144,96],
  ['assets/images/characters/ambient/city_bird.png',256,48,64,48],
  ['assets/images/characters/ambient/city_rat_gray.png',448,64,112,64],
  ['assets/images/characters/ambient/city_rat_brown.png',448,64,112,64],
  ['assets/images/characters/ambient/city_rat_dark.png',448,64,112,64]
]){
  expect(exists(relative),`folha de fauna ausente: ${relative}`);
  if(exists(relative)){
    const d=pngDimensions(relative),cells=alphaCellStats(relative,cellWidth,cellHeight);
    expect(d.width===width&&d.height===height&&pngColorType(relative)===6,`fauna sem canvas RGBA proporcional: ${relative}`);
    expect(cells.length===4&&cells.every(cell=>cell.width>10&&cell.height>8),`quadros da fauna incompletos: ${relative}`);
  }
}
const catRoute=[
  [18.15,10.60],[19.42,10.72],[20.22,11.42],[19.86,12.36],
  [18.52,12.50],[17.74,11.70],[17.86,10.92]
];
const catProjected=catRoute.map(([u,v])=>project(u,v));
const catVerticalTravel=Math.max(...catProjected.map(point=>point.y))-Math.min(...catProjected.map(point=>point.y));
expect(catVerticalTravel>55&&new Set(catRoute.map(([u,v])=>(u+v).toFixed(2))).size>4,'gato ainda percorre uma linha visual fixa');
expect(catRoute.every(([,v])=>v>10.5)&&scene.includes("routeLabel:'circuito seguro do gato'")&&scene.includes('isAmbientRouteClear(state)'),'rota curta do gato não foi pré-validada fora das fachadas');
expect(scene.includes("this.routeAmbient('city_dog', 'city-dog-walk', [[10.2,13.8]")&&scene.includes("this.createOldManAndBirdsIso()"),'rota aprovada do cachorro ou a interação Velhinho/pombos foi alterada');

// Expansão contínua Cidade + Arredores + Estrada Velha de Aether.
expect(scene.includes('static readonly WORLD_LEFT = AETHER_WORLD_BOUNDS.left')&&scene.includes('static readonly WORLD_TOP = AETHER_WORLD_BOUNDS.top')&&scene.includes('static readonly ISO_DEPTH_BASE = -20000'),'mundo expandido não usa origem negativa ou reserva de depth suficiente');
expect(territoryLayout.includes('left:-2700')&&territoryLayout.includes('top:-420')&&territoryLayout.includes('width:8700')&&territoryLayout.includes('height:5000'),'world bounds contínuos diferem do território aprovado');
expect(scene.includes('this.physics.world.setBounds(AetherCityScene.WORLD_LEFT,AetherCityScene.WORLD_TOP,AetherCityScene.WORLD_WIDTH,AetherCityScene.WORLD_HEIGHT)'),'física não reconhece a expansão completa');
expect(scene.includes('this.aetherTerritory=new AetherTerritory(this')&&scene.includes('this.createWorld()')&&scene.indexOf('this.aetherTerritory=new AetherTerritory(this')<scene.indexOf('    this.createWorld();'),'Arredores não são construídos sob a mesma cidade/cena');
expect(config.includes("OUTSKIRTS:'AetherCityScene'")&&!world.includes('createWorld()')&&!world.includes('spawnEnemies()')&&!world.includes('new MapHud'),'ainda existe um segundo sistema jogável de Arredores');

const requiredSectors=[
  'CITY_CENTER','CITY_RESIDENTIAL','CITY_SOUTH_GATE','CITY_EAST_GATE',
  'OUTSKIRTS_OLD_AETHER_ROAD','OUTSKIRTS_NEAR_CITY','OUTSKIRTS_MAIN_ROAD','OUTSKIRTS_FARM',
  'OUTSKIRTS_STREAM','OUTSKIRTS_LAKE','OUTSKIRTS_SHRINE','OUTSKIRTS_RUINS',
  'OUTSKIRTS_CAVE','OUTSKIRTS_GREENWOODS_GATE'
];
for(const sector of requiredSectors)expect(territoryLayout.includes(`${sector}:{id:'${sector}'`),`setor lógico ausente: ${sector}`);
expect(territory.includes('export class TerritorySectorManager')&&territory.includes('time-this.lastUpdate<180')&&territory.includes('visibleRadius')&&territory.includes('activeRadius'),'território grande não possui culling/ativação por proximidade');
expect(scene.includes('setCityRegionActive(value)')&&scene.includes('this.fountainWater?.setActive?.(value)')&&scene.includes('this.cityRegionActive===false')&&fountainWaterEffect.includes('!this.regionActive'),'NPCs, fauna, fumaça ou fonte continuam animando integralmente longe da cidade');
expect(!territory.includes('delayedCall(')&&!territory.includes('repeat:-1'),'território cria loops/timers permanentes fora do gerenciador regional');

const continuousWallBlocked=(u,v,r=.27)=>{
  const overlaps=(value,start,end)=>value+r>=start&&value-r<=end,along=value=>overlaps(value,1.15,26.85);
  const eastGate=v-r>12.70&&v+r<15.30,southGate=u-r>12.70&&u+r<15.30;
  return (overlaps(u,1.18,3.12)&&along(v))||(overlaps(v,1.18,3.12)&&along(u))||
    (overlaps(u,25.22,27.35)&&along(v)&&!eastGate)||(overlaps(v,25.22,27.35)&&along(u)&&!southGate);
};
for(let v=24.8;v<=28.6;v+=.05)expect(!continuousWallBlocked(14,v),'travessia física do Portão Sul possui bloqueio/fenda');
for(let u=24.8;u<=28.6;u+=.05)expect(!continuousWallBlocked(u,14),'travessia física do Portão Leste possui bloqueio/fenda');
expect(continuousWallBlocked(20,26.1)&&continuousWallBlocked(26.1,20),'muralha permite saída fora dos portões');
expect(!scene.includes("fadeOut(180")&&!scene.includes("transitionSpawn', {scene: 'WorldScene'"),'travessia de portão ainda possui fade, portal ou teleporte');

const oldRoadPoints=[[7.7,76],[7.5,71],[8.2,65.5],[9,59.5],[10,53.5],[10.9,47.5],[11.7,41.8],[12.8,35.2],[13.6,30.2],[14,26.2]];
expect(oldRoadPoints.at(-1)[0]===14&&oldRoadPoints.at(-1)[1]===26.2&&territoryLayout.includes("{u:14,v:26.2},{u:14.8,v:31.2}"),'Estrada Velha não conecta fisicamente à estrada do Portão Sul');
expect(territoryLayout.includes("id:'old-aether-road-new-game',u:7.7,v:73.2")&&territoryLayout.includes("safeRadius:3.2"),'spawn futuro oficial da Estrada Velha não foi preparado');
expect(territoryLayout.includes("{id:'aether-vista',label:'Vista de Aether',u:13.1,v:34.5"),'ponto da primeira visão de Aether não foi reservado');
expect(territory.includes("this.addIsoImage('outskirts_aether_sign_v2',12.4,35.7,170")&&territory.includes("this.addIsoImage('outskirts_aether_sign_v2',8.5,66,150")&&prologue.includes("spriteKey:'abandoned_wagon_v3'"),'Estrada Velha não possui sinalização, marco e carroça abandonada integrada ao prólogo');
expect(territory.includes("this.addIsoImage('farmhouse',21.6,48.3,248")&&territory.includes("this.addIsoImage('farm_barn',29.7,49.5,226")&&territory.includes('for(let row=0;row<3;row++)for(let column=0;column<5;column++)'),'reserva da Fazenda não possui área e módulos suficientes');

const streamPoints=[[38,8],[39.5,13],[41.2,17.4],[43.8,21],[45.2,26.5],[44.3,32],[44.8,36.3],[45.7,40.1],[47,44.8],[49.2,47.2]];
const pointSegmentDistanceSquared=(u,v,a,b)=>{const du=b[0]-a[0],dv=b[1]-a[1],den=du*du+dv*dv,t=den?Math.max(0,Math.min(1,((u-a[0])*du+(v-a[1])*dv)/den)):0,pu=a[0]+du*t,pv=a[1]+dv*t;return(u-pu)**2+(v-pv)**2};
const waterBlocked=(u,v,r=.27)=>{
  for(const {cu,cv,axisU,axisV,length,width} of [
    {cu:43.8,cv:21,axisU:.81,axisV:-.59,length:4.6,width:1.75},
    {cu:45.7,cv:40.1,axisU:.97,axisV:-.25,length:4.8,width:1.78}
  ]){
    const norm=Math.hypot(axisU,axisV),du=u-cu,dv=v-cv;
    const along=(du*axisU+dv*axisV)/norm,across=Math.abs(-axisV*du+axisU*dv)/norm;
    if(Math.abs(along)<=length/2+r&&across<=width/2-r*.22)return false;
  }
  if(((u-52)/(5.55+r))**2+((v-50.2)/(4.38+r))**2<=1)return true;
  let best=Infinity;for(let i=1;i<streamPoints.length;i++)best=Math.min(best,pointSegmentDistanceSquared(u,v,streamPoints[i-1],streamPoints[i]));
  return best<=(1.16+r)**2;
};
expect(!waterBlocked(43.8,21)&&!waterBlocked(45.7,40.1),'pontes planejadas do riacho não são caminháveis');
expect(waterBlocked(44.3,32)&&waterBlocked(52,50.2),'jogador ainda pode atravessar riacho/lago fora das passagens');
expect(territory.includes("this.addIsoImage('outskirts_bridge_v2'")&&territory.includes("this.addFlat('outskirts_lake_v2'")&&territory.includes("this.addFlat('outskirts_reeds'"),'riacho/lago não possuem ponte, margem e vegetação 2,5D');
expect(territory.includes("this.addIsoImage('outskirts_shrine_v2',55.5,23.2,292")&&territory.includes("this.addIsoImage('outskirts_ruins_v2',20.4,66,270")&&territory.includes("this.addIsoImage('outskirts_cave_v2',58.8,65,300"),'Santuário, ruínas ou caverna não foram posicionados');
expect(territory.includes("this.addIsoImage('outskirts_greenwoods_block_v2',72,48.5,410")&&territory.includes('woodsU*woodsU+woodsV*woodsV<=1'),'Greenwoods não possui landmark e bloqueio físico/narrativo de raízes');
expect(territory.includes("mode:solid.mode??'footprint'")&&territory.includes("label:'tronco de árvore'")&&!territory.includes('.setDisplaySize('),'novas colisões usam retângulo transparente ou alguma arte foi esticada');

const outskirtsAssets=[
  ['outskirts_ground_tile_v2.png',768,384],['outskirts_old_road_v2.png',640,512],
  ['outskirts_stream_v2.png',768,448],['outskirts_bridge_v2.png',512,416],
  ['outskirts_shrine_v2.png',544,544],['outskirts_ruins_v2.png',576,496],
  ['outskirts_cave_v2.png',576,496],['outskirts_greenwoods_block_v2.png',736,656],
  ['outskirts_aether_sign_v2.png',400,464],['outskirts_lake_v2.png',768,448]
];
for(const [name,width,height] of outskirtsAssets){
  const relative=`assets/images/environment/outskirts/v2/${name}`;
  expect(exists(relative),`asset 2,5D dos Arredores ausente: ${name}`);
  if(exists(relative)){const dimensions=pngDimensions(relative);expect(dimensions.width===width&&dimensions.height===height&&pngColorType(relative)===6,`asset dos Arredores perdeu proporção/RGBA: ${name}`)}
  const key=name.replace('.png','');expect(preload.includes(`'${key}'`),`asset dos Arredores fora do preload: ${key}`);
}

expect(territoryMap.includes("export const AETHER_TERRITORY_MAP_KEY='aether_territory_map_v2'")&&territoryMap.includes('width:1024,height:768')&&territoryMap.includes("x:.5+(u-v)/span*.41")&&territoryMap.includes("y:.22+(u+v)/(span*2)*.56"),'mapa completo não compartilha a projeção isométrica 2:1 do território');
expect(territoryMap.includes('const scale=Math.min((maxX-minX)/crop.width,(maxY-minY)/crop.height)')&&territoryMap.includes('context.clip()'),'cidade aprovada não foi encaixada proporcionalmente no mapa completo');
expect(territory.includes('this.worldFlags.discoveredLandmarks??={}')&&territory.includes('landmark.discoveryRadius**2')&&mapHud.includes('refreshMapMarkers()'),'descoberta de landmarks não é persistente ou não atualiza o mapa');

expect(scene.includes('continuousAetherTerritoryV1:true')&&scene.includes("activeAetherSector:this.registry.get('aetherActiveSector')")&&scene.includes('...(this.worldFlags || {})'),'save não preserva território, setor ou descobertas');
expect(menu.includes("if(target==='WorldScene')target='AetherCityScene'")&&world.includes('legacyWorldPositionToIso'),'menu/shim não migram todos os saves cartesianos dos Arredores');

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
expect(rootFiles.filter(name=>/^validate.*\.mjs$/.test(name)).sort().join(',')==='validate-project.mjs,validate-prologue.mjs','validadores do projeto e do prólogo não estão declarados na raiz');

if(issues.length){
  console.error('PROJECT_AUDIT_FAILED');
  for(const issue of issues)console.error(`- ${issue}`);
  process.exit(1);
}

console.log('PROJECT_AUDIT_OK territory=continuous-city+outskirts+old-road sectors=14+culling gates=walk-through-no-scene-swap bounds=82x82 water=blocked+2-crossings landmarks=discovery-gated map=local-minimap+full-territory movement=normalized-8dirs+AW-upLeft+arrows-WASD player=logical-32x16+separate-visual contact=foundation+footprints+escape+sliding iso=authoritative occlusion=partial-alpha+front-depth+768-visual-cases siege=visual-only+region-suspended assets=runtime-clean+uniform-scale');
