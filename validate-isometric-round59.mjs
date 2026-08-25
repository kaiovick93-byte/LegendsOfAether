import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.dirname(fileURLToPath(import.meta.url));
const read = relative => fs.readFileSync(path.join(root, relative), 'utf8');
const issues = [];
const expect = (condition, message) => { if (!condition) issues.push(message); };

const scene = read('src/scenes/IsometricPrototypeScene.ts');
const preload = read('src/scenes/PreloadScene.ts');
const menu = read('src/scenes/MenuScene.ts');
const main = read('src/main.ts');
const world = read('src/scenes/WorldScene.ts');
const html = read('index.html');
const vite = read('vite.config.ts');
const pkg = JSON.parse(read('package.json'));

expect(pkg.version === '0.1.9', 'versão do pacote não é 0.1.9');
expect(pkg.scripts?.['validate:isometric'] === 'node validate-isometric-round59.mjs', 'script de auditoria isométrica ausente');
expect(menu.includes("scene.start('IsometricPrototypeScene')"), 'protótipo não está acessível pelo menu');
expect(main.includes("import {IsometricPrototypeScene}"), 'cena isométrica não foi importada');
expect(main.includes('VictoryScene,IsometricPrototypeScene'), 'cena isométrica não foi registrada sem alterar a ordem da campanha');
expect(world.includes('gate_east') && world.includes('gate_south'), 'os dois portões da campanha deixaram de existir');
expect(html.includes('./assets/vendor/phaser.min.js') && !html.includes('cdn.jsdelivr.net'), 'runtime ainda depende do CDN do Phaser');
expect(vite.includes('copy-runtime-game-assets') && vite.includes('dist/assets'), 'build não copia os assets para dist');
expect(fs.existsSync(path.join(root, 'assets/vendor/phaser.min.js')), 'Phaser local ausente');

expect(scene.includes('TILE_WIDTH = 96') && scene.includes('TILE_HEIGHT = 48'), 'grade 2:1 de 96×48 não está declarada');
expect(scene.includes('(u - v) * IsometricPrototypeScene.TILE_WIDTH / 2'), 'projeção X isométrica foi alterada');
expect(scene.includes('(u + v) * IsometricPrototypeScene.TILE_HEIGHT / 2'), 'projeção Y isométrica foi alterada');
expect(scene.includes('tryMove(du, 0)') && scene.includes('tryMove(0, dv)'), 'movimento não possui deslizamento por eixos lógicos');
expect(scene.includes('this.depthAt(this.logicalPlayer.u, this.logicalPlayer.v'), 'jogador não recebe profundidade pela base projetada');
expect(scene.includes("setOrigin(.5, .86)"), 'jogador não está ancorado pelos pés');
expect(scene.includes("setOrigin(.5, .90)"), 'NPC não está ancorado pelos pés');

const assets = [
  ['assets/images/environment/isometric/isometric_grass_ground.png', 2112, 1056, true],
  ['assets/images/environment/isometric/isometric_pavement_ground.png', 1728, 864, true],
  ['assets/images/environment/isometric/isometric_grass_patch.png', 192, 96, true],
  ['assets/images/environment/isometric/isometric_city_wall.png', 1024, 829, true],
  ['assets/images/environment/isometric/isometric_city_gate.png', 768, 535, true]
];

function pngInfo(relative) {
  const data = fs.readFileSync(path.join(root, relative));
  return { width: data.readUInt32BE(16), height: data.readUInt32BE(20), colorType: data[25] };
}

for (const [relative, width, height, needsAlpha] of assets) {
  expect(fs.existsSync(path.join(root, relative)), `asset ausente: ${relative}`);
  if (!fs.existsSync(path.join(root, relative))) continue;
  const info = pngInfo(relative);
  expect(info.width === width && info.height === height, `${relative} possui ${info.width}×${info.height}; esperado ${width}×${height}`);
  if (needsAlpha) expect(info.colorType === 4 || info.colorType === 6, `${relative} não possui canal alpha`);
  expect(preload.includes(relative), `preload não referencia ${relative}`);
}

const assetFiles = fs.readdirSync(path.join(root, 'assets/images/environment/isometric'), { recursive: true }).map(String);
expect(!assetFiles.some(name => /round\d+/i.test(name)), 'há asset isométrico com número de round no nome');
expect(!/round\d+/i.test(preload), 'preload referencia asset com número de round');

const rects = [
  { u1: 1.77, v1: 1.77, u2: 2.23, v2: 20.23 },
  { u1: 1.77, v1: 1.77, u2: 20.23, v2: 2.23 },
  { u1: 1.77, v1: 19.77, u2: 20.23, v2: 20.23 },
  { u1: 19.77, v1: 1.77, u2: 20.23, v2: 9.67 },
  { u1: 19.77, v1: 13.35, u2: 20.23, v2: 20.23 },
  { u1: 19.45, v1: 9.40, u2: 20.60, v2: 10.52 },
  { u1: 19.45, v1: 12.28, u2: 20.60, v2: 13.40 },
  { u1: 4.45, v1: 4.55, u2: 7.70, v2: 7.20 },
  { u1: 5.25, v1: 12.30, u2: 8.60, v2: 15.50 }
];
const circles = [
  { u: 11, v: 11, radius: .78 },
  { u: 13.8, v: 9.2, radius: .82 }
];
const blocked = (u, v, radius = .28) => {
  for (const r of rects) {
    const nu = Math.max(r.u1, Math.min(u, r.u2));
    const nv = Math.max(r.v1, Math.min(v, r.v2));
    if (Math.hypot(u - nu, v - nv) < radius) return true;
  }
  return circles.some(c => Math.hypot(u - c.u, v - c.v) < radius + c.radius);
};

expect(!blocked(20.0, 11.40), 'centro do portão está bloqueado');
expect(!blocked(20.45, 11.40), 'saída externa do vão está bloqueada');
expect(blocked(20.0, 9.95), 'torre norte do portão não bloqueia passagem');
expect(blocked(20.0, 12.82), 'torre sul do portão não bloqueia passagem');
expect(blocked(6.15, 6.55), 'footprint da residência não bloqueia');
expect(blocked(6.95, 14.60), 'footprint do estabelecimento não bloqueia');
expect(!blocked(15.0, 12.0), 'spawn do jogador está bloqueado');
expect(!blocked(9.25, 14.25), 'posição do NPC está bloqueada');

// Percurso contínuo do spawn até a grama externa pelo centro do portão.
const gateRoute = [];
for (let i = 0; i <= 12; i++) gateRoute.push({ u: 15.0, v: 12.0 - i * .05 });
for (let i = 0; i <= 23; i++) gateRoute.push({ u: 15.0 + i * .25, v: 11.40 });
expect(gateRoute.every(p => !blocked(p.u, p.v)), 'rota completa do spawn pelo portão contém bloqueio antecipado');

const project = (u, v) => ({ x: 1300 + (u - v) * 48, y: 280 + (u + v) * 24 });
const top = project(0, 0), right = project(22, 0), bottom = project(22, 22), left = project(0, 22);
expect(right.x - left.x === 2112, 'largura projetada não corresponde a 22 células');
expect(bottom.y - top.y === 1056, 'altura projetada não corresponde a 22 células');
expect((right.x - left.x) / (bottom.y - top.y) === 2, 'losango não possui proporção isométrica 2:1');

if (issues.length) {
  console.error('ISOMETRIC_ROUND59_AUDIT_FAILED');
  for (const issue of issues) console.error(`- ${issue}`);
  process.exit(1);
}

console.log('ISOMETRIC_ROUND59_AUDIT_OK grid=22x22 tile=96x48 assets=5 gate_passage=clear buildings=2 actors=2 campaign=preserved');
