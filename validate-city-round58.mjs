import fs from 'node:fs';

const city={left:80,top:80,right:1480,bottom:1120,plazaX:780,plazaY:600};
const specs=[
 ['Loja de Aldren',220,335,320,320,190,144,36],
 ['Ferraria de Borin',500,335,280,280,185,142,38],
 ['Botica de Elara',1060,335,300,300,190,150,38],
 ['Taverna de Garrick',1330,335,320,320,190,160,40],
 ['Casa de Lysandra',250,745,320,320,200,150,44],
 ['Oficina de Maelis',1310,745,320,320,195,148,40],
 ['Casa vermelha',430,970,288,361,190,120,34],
 ['Casa verde',610,970,320,415,190,112,34],
 ['Casa azul',1030,970,342,386,190,135,35],
 ['Casa laranja',1270,970,400,394,190,145,36]
];

const rect=(x,y,w,h)=>({x,y,w,h,right:x+w,bottom:y+h});
const overlaps=(a,b)=>a.x<b.right&&a.right>b.x&&a.y<b.bottom&&a.bottom>b.y;
const contains=(r,x,y,pad=0)=>x>=r.x-pad&&x<=r.right+pad&&y>=r.y-pad&&y<=r.bottom+pad;
const buildings=specs.map(([name,x,y,sourceW,sourceH,targetHeight,baseW,baseH])=>{
 const scale=targetHeight/sourceH;
 return{
  name,targetHeight,
  visual:rect(x-sourceW*scale*.88/2,y-targetHeight*.90,sourceW*scale*.88,targetHeight*.90),
  base:rect(x-baseW/2,y-baseH-3,baseW,baseH)
 };
});
const issues=[];

for(const b of buildings){
 if(b.base.x<city.left+24||b.base.right>city.right-24||b.base.y<city.top+24||b.base.bottom>city.bottom-24)issues.push(`${b.name}: footprint fora das muralhas`);
}
for(let i=0;i<buildings.length;i++)for(let j=i+1;j<buildings.length;j++){
 if(overlaps(buildings[i].visual,buildings[j].visual))issues.push(`${buildings[i].name} sobrepõe ${buildings[j].name}`);
}

const gatePassages=[rect(1428,462,104,76),rect(736,1068,88,104)];
for(const b of buildings)for(const gate of gatePassages)if(overlaps(b.base,gate))issues.push(`${b.name}: invade corredor de portão`);

const actors=[
 ['Aldren',220,398],['Borin',500,398],['Elara',1060,398],['Garrick',1330,398],
 ['Lysandra',250,812],['Maelis',1310,812],['Mira',1080,680],['Kael',1360,570],['Bren',885,1060],
 ['Tomas',390,900],['Tomas',560,900],['Tomas',670,860],['Tomas',670,760],['Tomas',560,710],
 ['Tomas',470,630],['Tomas',520,540],['Tomas',390,500],['Tomas',390,650],['Tomas',390,800],
 ['Darian',1200,450],['Darian',1050,500],['Darian',1080,580],['Darian',1100,680],
 ['Darian',1080,790],['Darian',970,840],['Darian',900,900],['Darian',1080,900],
 ['Darian',1200,830],['Darian',1200,650],['Darian',1200,520]
];
for(const [name,x,y] of actors)for(const b of buildings)if(contains(b.base,x,y,10))issues.push(`${name} dentro do footprint de ${b.name}`);

const chickenYard=rect(100,815,235,220);
const fauna=[
 ['cão',520,690],['cão',548,742],['cão',620,790],['cão',690,808],['cão',650,764],['cão',570,718],
 ['gato',180,470],['gato',230,470],['gato',290,470],['gato',360,470],
 ['galinha',225,915],['galinha',285,920],['galinha',280,955],['galinha',310,980],['galinha',280,1000],['galinha',305,890],
 ['ancião ambiental',965,755],
 ['rato',1235,410],['rato',1330,426],['rato',1392,416],['rato',1400,436],['rato',1310,438],['rato',1245,390]
];
for(const [name,x,y] of fauna){
 for(const b of buildings)if(contains(b.visual,x,y,6))issues.push(`${name} atravessa a arte de ${b.name}`);
 if(name==='galinha'&&!contains(chickenYard,x,y))issues.push(`${name} fora do terreiro`);
}

const residential=buildings.filter(b=>b.name.startsWith('Casa ')&&!b.name.includes('Lysandra'));
if(new Set(residential.map(b=>b.targetHeight)).size!==1)issues.push('casas residenciais não possuem altura visual uniforme');

const world=fs.readFileSync(new URL('./src/scenes/WorldScene.ts',import.meta.url),'utf8');
const npc=fs.readFileSync(new URL('./src/npc/Npc.ts',import.meta.url),'utf8');
const ambient=fs.readFileSync(new URL('./src/world/AmbientCityLife.ts',import.meta.url),'utf8');
const player=fs.readFileSync(new URL('./src/entities/Player.ts',import.meta.url),'utf8');
const preload=fs.readFileSync(new URL('./src/scenes/PreloadScene.ts',import.meta.url),'utf8');
const activeNpcBlock=world.slice(world.indexOf('createNpcsRound58(){'),world.indexOf('createNpcsLegacyRound55(){'));
if(/idleFacing:'(?:left|right|up)'/.test(activeNpcBlock))issues.push('NPC fixo não está olhando para frente');
if(/\bsign\s*\(/.test(world.slice(world.indexOf('drawCityDetailsRound58(){'),world.indexOf('auditCityRound58(){'))))issues.push('placas escritas ainda existem no mapa ativo');
if(!world.includes("this.waystone=new Waystone(this,this.cityLayout.plazaX,this.cityLayout.plazaY"))issues.push('Marco de Senda não está no centro da praça');
if(!world.includes("'city_fountain'"))issues.push('fonte da praça ausente');
if(!world.includes("'city_tree'"))issues.push('árvores urbanas ausentes');
if(!world.includes('step+4')&&!world.includes('step+5'))issues.push('muralhas/cercas não possuem sobreposição anti-vão');
if(world.includes('0x353b3e,1'))issues.push('placa cinza opaca ainda existe atrás das muralhas');
if(!world.includes('wallInset=18,wallThickness=36'))issues.push('colisão das muralhas não está alinhada à face interna');
if(!player.includes('setSize(38,22,false)')||!player.includes('setOffset(29,71)'))issues.push('colisor do jogador não está restrito aos pés');
if(!npc.includes('visualScale=actions.visualScale??.46'))issues.push('escala geral dos NPCs não foi ampliada');
if(/hide:true/.test(ambient.slice(ambient.indexOf('createRats(){'),ambient.indexOf('createOldManAndBirds(){'))))issues.push('ratos ainda desaparecem ao final da rota');
if(!ambient.includes('frameBottom=[109,109,107,109]')||ambient.includes('frameHeightFactor='))issues.push('agachamento do velhinho não está ancorado pelos pés');
const catStart=ambient.indexOf('createCat(){');
const catBlock=ambient.slice(catStart,ambient.indexOf('createRouteAnimal(',catStart));
const catYs=[...catBlock.matchAll(/y:(\d+)/g)].map(m=>Number(m[1]));
if(catYs.length<4||new Set(catYs).size!==1)issues.push('gato ainda percorre uma rota vertical');
if(!world.includes("prop('chicken_coop',175,885,.52")||!world.includes("'city_chicken_fence'"))issues.push('galinheiro ampliado ou cerca urbana ausente');

const pngSize=relative=>{const b=fs.readFileSync(new URL(relative,import.meta.url));return{w:b.readUInt32BE(16),h:b.readUInt32BE(20),colorType:b[25]}};
const pavement=pngSize('./assets/images/environment/city/city_pavement.png');
const grass=pngSize('./assets/images/environment/city/city_grass.png');
const greenHouse=pngSize('./assets/images/environment/buildings/residential_house_green.png');
const eastGate=pngSize('./assets/images/environment/city/gate_east.png');
const wallH=pngSize('./assets/images/environment/city/city_wall_horizontal.png');
const wallV=pngSize('./assets/images/environment/city/city_wall_vertical.png');
if(pavement.w!==1400||pavement.h!==1040||grass.w!==1400||grass.h!==1040)issues.push('texturas contínuas do chão não cobrem toda a cidade');
if(greenHouse.w/greenHouse.h<.70)issues.push('casa verde ainda está estreita/esticada');
if(eastGate.h/eastGate.w<1.8||eastGate.colorType!==6)issues.push('Portão Leste não é um módulo vertical transparente');
if(wallH.w!==119||wallH.h!==64||wallV.w!==64||wallV.h!==119)issues.push('margens transparentes dos módulos de muralha não foram removidas');
const assetNames=fs.readdirSync(new URL('./assets',import.meta.url),{recursive:true}).map(String);
if(assetNames.some(name=>/round\d+/i.test(name)))issues.push('há asset com número de round no nome');
if(/round\d+/i.test(preload))issues.push('preload ainda referencia asset versionado por round');
for(const path of ['city_pavement.png','city_grass.png','residential_house_orange.png','city_fountain.png','city_tree.png','city_chicken_fence.png'])if(!preload.includes(path))issues.push(`preload não referencia ${path}`);

if(issues.length){console.error('CITY_ROUND58_AUDIT_FAILED');for(const issue of issues)console.error(`- ${issue}`);process.exit(1)}
console.log(`CITY_ROUND58_AUDIT_OK buildings=${buildings.length} actors=${actors.length} fauna_points=${fauna.length} gates=2 residential=${residential.length}`);
