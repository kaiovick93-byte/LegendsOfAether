import {test, after} from 'node:test';
import assert from 'node:assert/strict';
import {mkdtempSync, mkdirSync, readFileSync, writeFileSync, rmSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {dirname, resolve, join} from 'node:path';
import {fileURLToPath, pathToFileURL} from 'node:url';
import ts from 'typescript';

const root=resolve(dirname(fileURLToPath(import.meta.url)),'..');
const temporary=mkdtempSync(join(tmpdir(),'aether-tracker-test-'));
const compiled=new Set();
function compile(relative){
  const destination=join(temporary,relative.replace(/\.ts$/,'.mjs'));
  if(compiled.has(relative))return destination;
  compiled.add(relative);
  const source=readFileSync(join(root,relative),'utf8');
  for(const dependency of ts.preProcessFile(source).importedFiles){
    if(dependency.fileName.startsWith('.'))compile(join(dirname(relative),dependency.fileName+'.ts'));
  }
  const output=ts.transpileModule(source,{compilerOptions:{target:ts.ScriptTarget.ES2020,module:ts.ModuleKind.ESNext}})
    .outputText.replace(/from (['"])(\.[^'"]+)\1/g,'from $1$2.mjs$1');
  mkdirSync(dirname(destination),{recursive:true});writeFileSync(destination,output);return destination;
}
const load=relative=>import(pathToFileURL(compile(relative)).href);
globalThis.Phaser={Scene:class{},GameObjects:{Sprite:class{},Container:class{}},Physics:{Arcade:{Sprite:class{}}}};
const {OldAetherPrologue,OLD_AETHER_PROLOGUE_STAGES:S}=await load('src/prologue/OldAetherPrologue.ts');
const {readPrologueTrackedObjective:read}=await load('src/quests/PrologueTrackerState.ts');
const {PROLOGUE_QUEST_METADATA}=await load('src/quests/questData.ts');
after(()=>rmSync(temporary,{recursive:true,force:true}));

function flow(persisted){
  const prologue=Object.create(OldAetherPrologue.prototype);
  prologue.state=prologue.normalizeState(persisted);
  prologue.enabled=true;
  prologue.hud={setObjective:text=>{prologue.view=read(prologue.state,text);},hint(){},hideHint(){}};
  return prologue;
}
function freeze(value){
  if(value&&typeof value==='object'){Object.values(value).forEach(freeze);Object.freeze(value);}
  return value;
}

test('no narrative objective keeps the tracker empty',()=>{
  const p=flow();p.syncObjective();
  assert.equal(p.view,null);
  assert.equal(read(undefined,'text'),null);
});

test('metadata comes from quest data; objective text is passed through unchanged',()=>{
  const p=flow();p.state.stage=S.EXAMINE_ROAD_SIGN;p.syncObjective();
  assert.equal(p.view.questId,PROLOGUE_QUEST_METADATA.id);
  assert.equal(p.view.questName,PROLOGUE_QUEST_METADATA.title);
  assert.equal(p.view.objectiveId,S.EXAMINE_ROAD_SIGN);
  assert.equal(p.view.objectiveText,'Investigue a Placa');
  assert.equal(p.view.completed,false);
  assert.equal(read(p.state,'Texto recebido da fonte atual, sem substituição.').objectiveText,'Texto recebido da fonte atual, sem substituição.');
});

test('legacy save without trackedQuestId derives its active objective without rewriting data',()=>{
  const saved=freeze({version:1,worldFlags:{prologue:{version:2,started:true,
    tutorials:{movementComplete:true,interactionComplete:true,collectionComplete:false,suppliesApproachReached:true},
    encounters:{youngWolf:'defeated'},waystone:{ruinedExamined:true}}},quests:{goblin_ears:{accepted:true,completed:false}}});
  const before=JSON.stringify(saved);
  const p=flow(saved.worldFlags.prologue);
  const normalized=JSON.stringify(p.state);
  freeze(p.state);p.syncObjective();
  assert.equal(p.view.objectiveText,'Colete os Suprimentos');
  assert.equal(p.view.completed,false);
  assert.equal(JSON.stringify(p.state),normalized);
  assert.equal(JSON.stringify(saved),before);
  assert.equal('trackedQuestId' in p.state,false);
});

test('existing collection action alone completes the displayed objective, once',()=>{
  const p=flow();p.state.stage=S.COLLECT_TRAVEL_SUPPLIES;
  let added=0,saves=0;
  p.scene={inv:{add(item,count){assert.equal(item,'healing_potion');added+=count;}},saveGame(){saves++;}};
  p.anchors={travelSupplies:{u:0,v:0}};p.isNear=()=>true;
  p.syncObjective();assert.equal(p.view.completed,false);
  assert.equal(p.tryCollect(),true);
  assert.equal(p.state.stage,S.POTION_HINT_PENDING);
  assert.equal(p.view.objectiveText,'Colete os Suprimentos');
  assert.equal(p.view.completed,true);
  const before=JSON.stringify(p.state);
  for(let i=0;i<10;i++)read(p.state,p.view.objectiveText);
  assert.equal(JSON.stringify(p.state),before);
  assert.equal(added,1);assert.equal(saves,1);
  assert.equal(p.tryCollect(),false);
  assert.equal(added,1);assert.equal(saves,1);
  p.dismissPotionHint();
  assert.equal(p.view.objectiveText,'Investigue o sangue na estrada');
  assert.equal(p.view.completed,false);
});

test('completed prologue does not mark the follow-up instruction as completed',()=>{
  const p=flow();p.state.stage=S.COMPLETED;p.state.completed=true;p.state.waystone.reacted=true;
  p.syncObjective();assert.equal(p.view.objectiveText,'Fale com o General.');
  assert.notEqual(p.view.completed,true);
});

test('reading all existing stages never mutates progress or invents completion',()=>{
  const p=flow();
  for(const stage of Object.values(S)){
    const state=freeze({...p.state,stage});
    const before=JSON.stringify(state);
    const entry=read(state,'Objetivo recebido');
    assert.equal(entry.objectiveId,stage);
    assert.notEqual(entry.completed,true);
    assert.equal(JSON.stringify(state),before);
  }
});
