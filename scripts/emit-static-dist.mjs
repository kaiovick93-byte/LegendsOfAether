/**
 * Emissor estático de contingência para o pacote de testes.
 *
 * O projeto distribuído mantém módulos ESM em dist/src. Quando o toolchain
 * Vite/TypeScript não está instalado na máquina de validação, este script usa
 * o transformador TypeScript do Node para atualizar somente os módulos que
 * mudaram, preservando o restante do dist já produzido pelo build normal.
 */
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {stripTypeScriptTypes} from 'node:module';

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const modules=[
  'src/character/PlayerAppearance.ts',
  'src/entities/Player.ts',
  'src/npc/Npc.ts',
  'src/prologue/OldAetherPrologue.ts',
  'src/scenes/AetherCityScene.ts',
  'src/scenes/PreloadScene.ts',
  'src/ui/MapPanel.ts',
  'src/ui/Minimap.ts',
  'src/world/AetherTerritory.ts',
  'src/world/AetherTerritoryLayout.ts',
  'src/world/LowerWallSiege.ts'
];
const assets=[
  'assets/images/characters/ambient/elder_feeder_iso_v3.png',
  'assets/images/characters/npcs/isometric/traveler_iso_walk_v2.png',
  'assets/images/characters/prologue/aether_patrolman_sheet_v2.png',
  'assets/images/characters/prologue/prologue_goblin_scout_8dir_v3.png',
  'assets/images/characters/prologue/prologue_goblin_scout_sheet_v2.png',
  'assets/images/characters/prologue/prologue_young_wolf_8dir_v3.png',
  'assets/images/characters/prologue/prologue_young_wolf_sheet_v2.png',
  'assets/images/characters/siege/aether_wall_archer_action_v2.png',
  'assets/images/environment/outskirts/prologue/abandoned_wagon_v3.png'
];

function browserSpecifier(specifier){
  if(!specifier.startsWith('.')||path.extname(specifier))return specifier;
  return `${specifier}.js`;
}

function toBrowserEsm(source){
  const stripped=stripTypeScriptTypes(source,{mode:'transform',sourceMap:false});
  return stripped
    .replace(/(\bfrom\s*['"])(\.[^'"]+)(['"])/g,(_,start,specifier,end)=>`${start}${browserSpecifier(specifier)}${end}`)
    .replace(/(\bimport\s*\(\s*['"])(\.[^'"]+)(['"])/g,(_,start,specifier,end)=>`${start}${browserSpecifier(specifier)}${end}`);
}

for(const relative of modules){
  const sourcePath=path.join(root,relative);
  const outputPath=path.join(root,'dist',relative.replace(/\.ts$/,'.js'));
  fs.mkdirSync(path.dirname(outputPath),{recursive:true});
  fs.writeFileSync(outputPath,toBrowserEsm(fs.readFileSync(sourcePath,'utf8')),'utf8');
}
for(const relative of assets){
  const sourcePath=path.join(root,relative);
  const outputPath=path.join(root,'dist',relative);
  fs.mkdirSync(path.dirname(outputPath),{recursive:true});
  fs.copyFileSync(sourcePath,outputPath);
}

console.log(`STATIC_DIST_OK modules=${modules.length} assets=${assets.length}`);
