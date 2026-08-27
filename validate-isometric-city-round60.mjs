import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

const root = path.dirname(fileURLToPath(import.meta.url));
const read = relative => fs.readFileSync(path.join(root, relative), 'utf8');
const issues = [];
const expect = (condition, message) => { if (!condition) issues.push(message); };

const scene = read('src/scenes/AetherCityScene.ts');
const world = read('src/scenes/WorldScene.ts');
const preload = read('src/scenes/PreloadScene.ts');
const main = read('src/main.ts');
const menu = read('src/scenes/MenuScene.ts');
const select = read('src/scenes/CharacterSelectScene.ts');
const interior = read('src/scenes/HouseInteriorScene.ts');
const pkg = JSON.parse(read('package.json'));

expect(pkg.version === '0.2.0', 'versão do pacote não é 0.2.0');
expect(pkg.scripts?.['validate:isometric-city'] === 'node validate-isometric-city-round60.mjs', 'script de auditoria do Round 60 ausente');
expect(main.includes("import {AetherCityScene}"), 'AetherCityScene não foi importada');
expect(main.includes('CharacterSelectScene,AetherCityScene,WorldScene'), 'AetherCityScene não foi registrada antes dos Arredores');
expect(select.includes("scene.start('AetherCityScene')"), 'novo jogo não inicia na cidade isométrica');
expect(interior.includes("scene.start('AetherCityScene')"), 'interior residencial não retorna à cidade isométrica');
expect(menu.includes("target='AetherCityScene'") && menu.includes('cityRound60Migrated'), 'migração de saves urbanos antigos está ausente');

expect(scene.includes('TILE_WIDTH = 96') && scene.includes('TILE_HEIGHT = 48'), 'grade 2:1 de 96×48 foi alterada');
expect(scene.includes('MAP_SIZE = 28'), 'mapa oficial não possui 28×28 células');
expect(scene.includes('(u - v) * AetherCityScene.TILE_WIDTH / 2'), 'projeção X isométrica foi alterada');
expect(scene.includes('(u + v) * AetherCityScene.TILE_HEIGHT / 2'), 'projeção Y isométrica foi alterada');
expect(scene.includes('new Player(this, spawn.x, spawn.y)'), 'cidade não usa o jogador real da campanha');
expect(scene.includes('this.player.setTexture(texture, frame)') && scene.includes('setVisible(true).setActive(true).setAlpha(1)'), 'sprite do herói não é forçado como visível');
expect(scene.includes('setOrigin(.5, .86).setScale(.78)'), 'herói não está ancorado pelos pés na escala oficial');
expect(scene.includes('this.logicalPlayer = {u: 14, v: 21.40'), 'posição inicial ainda pode ficar encoberta pelo portão');
expect(scene.includes('visualScale: options.scale ?? .60'), 'NPCs fixos não receberam a escala ampliada');
expect(scene.includes("scale: .65") && scene.includes("scale: .66"), 'guardas não receberam escala própria ampliada');
expect(scene.includes("idleFacing: 'down'"), 'NPCs fixos não olham para frente');
expect(scene.includes('frameBottom = [109,109,107,109]'), 'correção de base do velhinho está ausente');
expect(scene.includes('const travelerRoute = [...safeStreetLoop].reverse()'), 'viajante não percorre circuito independente em sentido oposto');
expect(scene.includes('Soma u+v constante'), 'gato não possui rota horizontal documentada');

expect(world.includes('this.cityConverted=true'), 'Arredores não reconhecem a conversão oficial');
expect(world.includes('if(!this.cityConverted)this.drawCityGroundRound58()'), 'cidade plana antiga ainda pode ser desenhada sob a nova');
expect(world.includes("enterConvertedCity(throughEast?'east':'south')"), 'portões externos não entram na nova cidade');
expect(world.includes("this.scene.start('AetherCityScene')"), 'transição dos Arredores para a cidade está ausente');
expect(scene.includes("this.exitCity('east')") && scene.includes("this.exitCity('south')"), 'saídas Leste/Sul da cidade estão incompletas');
expect(scene.includes('cityRound60Migrated: true') && world.includes('cityRound60Migrated:true'), 'flag de migração não é preservada nas duas cenas');

const requiredAssets = [
  ['assets/images/environment/isometric/isometric_city_grass.png', 2688, 1344],
  ['assets/images/environment/isometric/isometric_city_pavement.png', 2304, 1152],
  ['assets/images/environment/isometric/isometric_grass_patch.png', 192, 96],
  ['assets/images/environment/isometric/isometric_city_wall.png', 1024, 829],
  ['assets/images/environment/isometric/isometric_city_gate.png', 768, 535],
  ['assets/images/environment/isometric/isometric_city_gate_east.png', 800, 724],
  ['assets/images/characters/player.png', 384, 384]
];

function pngInfo(relative) {
  const data = fs.readFileSync(path.join(root, relative));
  return {width: data.readUInt32BE(16), height: data.readUInt32BE(20), colorType: data[25]};
}

for (const [relative, width, height] of requiredAssets) {
  expect(fs.existsSync(path.join(root, relative)), `asset ausente: ${relative}`);
  if (!fs.existsSync(path.join(root, relative))) continue;
  const info = pngInfo(relative);
  expect(info.width === width && info.height === height, `${relative} possui ${info.width}×${info.height}; esperado ${width}×${height}`);
  expect(info.colorType === 4 || info.colorType === 6, `${relative} não possui canal alpha`);
  expect(preload.includes(relative), `preload não referencia ${relative}`);
}

const walkFiles = directory => fs.readdirSync(directory, {withFileTypes: true}).flatMap(entry => {
  const target = path.join(directory, entry.name);
  return entry.isDirectory() ? walkFiles(target) : [target];
});
const assetFiles = walkFiles(path.join(root, 'assets')).map(file => path.relative(path.join(root, 'assets'), file));
expect(!assetFiles.some(file => /round\d+/i.test(file)), 'há asset com número de round no nome');

const buildings = [
  {name:'Loja',u1:3.40,v1:13.65,u2:6.65,v2:16.45},
  {name:'Ferraria',u1:7.65,v1:9.70,u2:10.95,v2:12.55},
  {name:'Botica',u1:12.20,v1:5.75,u2:15.75,v2:8.65},
  {name:'Taverna',u1:17.55,v1:3.35,u2:21.25,v2:6.25},
  {name:'Lysandra',u1:3.15,v1:16.95,u2:6.50,v2:19.90},
  {name:'Oficina',u1:20.35,v1:9.20,u2:23.90,v2:12.20},
  {name:'Casa vermelha',u1:6.55,v1:21.55,u2:9.40,v2:24.40},
  {name:'Casa verde',u1:9.75,v1:21.55,u2:12.60,v2:24.40},
  {name:'Casa azul',u1:16.45,v1:20.75,u2:19.50,v2:23.70},
  {name:'Casa laranja',u1:20.25,v1:17.25,u2:23.80,v2:20.30}
];
const rects = [
  {u1:1.76,v1:1.76,u2:2.24,v2:26.24,name:'muro u2'},
  {u1:1.76,v1:1.76,u2:26.24,v2:2.24,name:'muro v2'},
  {u1:25.76,v1:1.76,u2:26.24,v2:11.91,name:'leste norte'},
  {u1:25.76,v1:16.10,u2:26.24,v2:26.24,name:'leste sul'},
  {u1:25.30,v1:11.72,u2:26.55,v2:12.92,name:'torre leste norte'},
  {u1:25.30,v1:15.08,u2:26.55,v2:16.28,name:'torre leste sul'},
  {u1:1.76,v1:25.76,u2:11.91,v2:26.24,name:'sul oeste'},
  {u1:16.10,v1:25.76,u2:26.24,v2:26.24,name:'sul leste'},
  {u1:11.72,v1:25.30,u2:12.92,v2:26.55,name:'torre sul oeste'},
  {u1:15.08,v1:25.30,u2:16.28,v2:26.55,name:'torre sul leste'},
  ...buildings
];
const circles = [
  {u:14,v:14,radius:.88,name:'Marco'}, {u:17.15,v:14.35,radius:.90,name:'fonte'},
  {u:3.7,v:9.5,radius:.34,name:'árvore'}, {u:8,v:18.7,radius:.34,name:'árvore'},
  {u:19.7,v:15.6,radius:.34,name:'árvore'}, {u:23.8,v:7.2,radius:.34,name:'árvore'},
  {u:23.1,v:22.9,radius:.34,name:'árvore'}
];
const fixedNpcs = [
  [7.35,16.95,'Aldren'], [11.55,13.15,'Borin'], [16.45,9.25,'Elara'], [21.75,7,'Garrick'],
  [7.15,20.65,'Lysandra'], [22.15,13,'Maelis'], [12,17.05,'Mira'], [24.45,11.20,'Kael'], [11.10,24.90,'Bren']
];

const blocked = (u, v, radius=.27, includeNpcs=false) => {
  for (const rect of rects) {
    const nu = Math.max(rect.u1, Math.min(u, rect.u2));
    const nv = Math.max(rect.v1, Math.min(v, rect.v2));
    if (Math.hypot(u-nu, v-nv) < radius) return rect.name;
  }
  for (const circle of circles) if (Math.hypot(u-circle.u, v-circle.v) < radius+circle.radius) return circle.name;
  if (includeNpcs) for (const [nu,nv,name] of fixedNpcs) if (Math.hypot(u-nu,v-nv) < radius+.28) return name;
  return null;
};

for (let i=0;i<buildings.length;i++) for (let j=i+1;j<buildings.length;j++) {
  const a=buildings[i], b=buildings[j];
  const overlap = a.u1 < b.u2 && a.u2 > b.u1 && a.v1 < b.v2 && a.v2 > b.v1;
  expect(!overlap, `footprints sobrepostos: ${a.name} / ${b.name}`);
}
for (const [u,v,name] of fixedNpcs) expect(!blocked(u,v,.27), `${name} está dentro ou colado a um footprint`);

const sampleSegment = (a,b,radius=.27,includeNpcs=false) => {
  const distance=Math.hypot(b[0]-a[0],b[1]-a[1]);
  const steps=Math.max(1,Math.ceil(distance/.04));
  for(let i=0;i<=steps;i++){
    const t=i/steps,u=a[0]+(b[0]-a[0])*t,v=a[1]+(b[1]-a[1])*t;
    const hit=blocked(u,v,radius,includeNpcs); if(hit)return {u,v,hit};
  }
  return null;
};
expect(!sampleSegment([14,21.40],[14,26.70]), 'corredor completo do Portão Sul está bloqueado');
expect(!sampleSegment([21.40,14],[26.70,14]), 'corredor completo do Portão Leste está bloqueado');
expect(blocked(12.30,25.85), 'torre do Portão Sul não bloqueia passagem lateral');
expect(blocked(25.85,12.30), 'torre do Portão Leste não bloqueia passagem lateral');

const streetLoop = [[10,15.5],[10,18.3],[13,18.5],[15.5,18.5],[18.5,17.5],[20,17],[21,16.5],[21.5,15],[21,13.5],[18.5,11.5],[16.5,10.5],[13.5,10.5],[12.5,12],[12.5,15.5]];
for(let i=0;i<streetLoop.length;i++){
  const hit=sampleSegment(streetLoop[i],streetLoop[(i+1)%streetLoop.length],.27,true);
  expect(!hit, `circuito dos NPCs bloqueado no trecho ${i}${hit?` por ${hit.hit}`:''}`);
}

const project=(u,v)=>({x:1600+(u-v)*48,y:250+(u+v)*24});
const top=project(0,0),right=project(28,0),bottom=project(28,28),left=project(0,28);
expect(right.x-left.x===2688, 'largura projetada não corresponde a 28 células');
expect(bottom.y-top.y===1344, 'altura projetada não corresponde a 28 células');
expect((right.x-left.x)/(bottom.y-top.y)===2, 'mapa não mantém proporção isométrica 2:1');

if (issues.length) {
  console.error('ISOMETRIC_CITY_ROUND60_AUDIT_FAILED');
  for (const issue of issues) console.error(`- ${issue}`);
  process.exit(1);
}

console.log('ISOMETRIC_CITY_ROUND60_AUDIT_OK grid=28x28 tile=96x48 assets=7 buildings=10 npcs=11 gates=2 routes=2 saves=preserved');
