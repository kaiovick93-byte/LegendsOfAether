import {test, after, afterEach} from 'node:test';
import assert from 'node:assert/strict';
import {EventEmitter} from 'node:events';
import {mkdtempSync, mkdirSync, readFileSync, writeFileSync, rmSync, existsSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {dirname, resolve, join} from 'node:path';
import {fileURLToPath, pathToFileURL} from 'node:url';
import ts from 'typescript';

// Compile the real modules into a disposable directory, using the project's
// existing TypeScript dependency. These are lifecycle/unit tests, not a browser.
const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const temporary = mkdtempSync(join(tmpdir(), 'aether-clock-test-'));
const compiled = new Set();
function compile(relative) {
  const destination = join(temporary, relative.replace(/\.ts$/, '.mjs'));
  if (compiled.has(relative)) return destination;
  compiled.add(relative);
  const source = readFileSync(join(root, relative), 'utf8');
  for (const dependency of ts.preProcessFile(source).importedFiles) {
    if (dependency.fileName.startsWith('.')) {
      compile(join(dirname(relative), dependency.fileName + '.ts'));
    }
  }
  const output = ts.transpileModule(source, {compilerOptions: {
    target: ts.ScriptTarget.ES2020, module: ts.ModuleKind.ESNext
  }}).outputText.replace(/from (['"])(\.[^'"]+)\1/g, 'from $1$2.mjs$1');
  mkdirSync(dirname(destination), {recursive: true});
  writeFileSync(destination, output);
  return destination;
}
const load = relative => import(pathToFileURL(compile(relative)).href);
const storage = new Map();
globalThis.localStorage = {
  getItem: key => storage.get(key) ?? null,
  setItem: (key, value) => storage.set(key, value),
  removeItem: key => storage.delete(key)
};
globalThis.document = {hidden: false};
globalThis.Phaser = {
  Scene: class {}, GameObjects: {Sprite: class {}, Container: class {}},
  Physics: {Arcade: {Sprite: class {}}}
};
const {WorldClock, worldClock, REAL_DAY_MS, GAME_DAY_MS} = await load('src/world/WorldClock.ts');
const {installWorldClock} = await load('src/world/WorldClockRuntime.ts');
const {SaveManager} = await load('src/save/SaveManager.ts');
const {Player} = await load('src/entities/Player.ts');
const {MapHud} = await load('src/ui/MapHud.ts');
const {MenuScene} = await load('src/scenes/MenuScene.ts');
const {CaveScene} = await load('src/scenes/CaveScene.ts');
const {PreloadScene} = await load('src/scenes/PreloadScene.ts');
const cleanups = [];
afterEach(() => {
  for (const dispose of cleanups.splice(0)) dispose();
  storage.clear();
  document.hidden = false;
  worldClock.reset();
});
after(() => rmSync(temporary, {recursive: true, force: true}));

function map(key = 'AetherCityScene') {
  const texts = [];
  const scene = {
    active: true, sys: {settings: {key}}, events: new EventEmitter(), texts,
    time: {paused: false, timeScale: 1, delayedCall: () => {}},
    physics: {world: {isPaused: false}},
    add: {text(x, y, text) {
      const label = {x, y, text, destroyed: false,
        setScrollFactor() { return this; }, setDepth() { return this; },
        setText(value) { this.text = value; return this; },
        destroy() { this.destroyed = true; }};
      texts.push(label); return label;
    }}
  };
  const player = Object.create(Player.prototype);
  Object.assign(player, {
    scene, hp: 100, maxHp: 100, mana: 60, maxMana: 60, defense: 0,
    dead: false, isoDriven: false, body: {setVelocity() {}},
    setPosition(x, y) { this.x = x; this.y = y; return this; },
    screenToIso: (x, y) => ({x, y}),
    setVisualTint() { return this; }, clearVisualTint() { return this; },
    setVisualAlpha() { return this; }, setVisualVisible() { return this; },
    configureLogicalBody() {}, syncVisualTransform() {}
  });
  scene.player = player;
  // Exercise the existing modal methods; only drawing and ability IO are stubbed.
  scene.hud = Object.assign(Object.create(MapHud.prototype), {
    modal: false, abilities: {pause() {}, resume() {}},
    hideHud() {}, showHud() {}, closePanels() {},
    controls: {isVisible: () => false}, pause: {isOpen: () => false},
    inventoryPanel: {isVisible: () => false}, skillPanel: {visible: false},
    mapPanel: {isVisible: () => false}
  });
  return scene;
}

function runtime(scenes = [map()]) {
  const game = {
    events: new EventEmitter(), isPaused: false,
    scene: {getScenes: () => scenes.filter(scene => scene.active)}
  };
  const dispose = installWorldClock(game);
  cleanups.push(dispose);
  let elapsed = 0;
  return {game, scenes, dispose, frame(delta = 0, update = () => {}) {
    elapsed += delta;
    update(); // Phaser runs scene updates before the global POST_STEP event.
    game.events.emit('poststep', elapsed, delta);
  }};
}

test('one game minute = 3 real seconds; a full day = 72 real minutes', () => {
  const clock = new WorldClock();
  clock.advance(2999);
  assert.equal(clock.format(), 'Dia 1 • 08:00');
  clock.advance(1);
  assert.equal(clock.format(), 'Dia 1 • 08:01');
  clock.advance(REAL_DAY_MS);
  assert.equal(clock.format(), 'Dia 2 • 08:01');
});

test('midnight carries the exact remainder, including multiple days', () => {
  const clock = new WorldClock();
  clock.restore({version: 1, day: 7, timeOfDayMs: GAME_DAY_MS - 60000});
  clock.advance(2999);
  assert.equal(clock.format(), 'Dia 7 • 23:59');
  clock.advance(1);
  assert.deepEqual(clock.serialize(), {version: 1, day: 8, timeOfDayMs: 0});
  clock.advance(REAL_DAY_MS * 3 + 3000);
  assert.equal(clock.format(), 'Dia 11 • 00:01');
});

test('death and the existing 2-second respawn preserve the exact death timestamp', () => {
  const scene = map('CaveScene');
  const run = runtime([scene]);
  const sm = new SaveManager();
  worldClock.restore({version: 1, day: 4, timeOfDayMs: GAME_DAY_MS - 400});
  run.frame();
  const atDeath = worldClock.serialize();
  const timers = [];
  scene.time.delayedCall = (delay, callback) => { const timer = {delay, callback}; timers.push(timer); return timer; };
  scene.death = {show() {}, hide() {}};
  scene.saveGame = () => sm.save({version: 1, player: {hp: scene.player.hp}});
  run.frame(16, () => scene.player.takeDamage(500));
  assert.equal(scene.player.isDead(), true);
  assert.deepEqual(worldClock.serialize(), atDeath);
  CaveScene.prototype.handleDeath.call(scene);
  run.frame(900);
  // Closing a modal cannot unfreeze a still-dead player.
  scene.hud.closeExternalModal();
  run.frame(900);
  scene.saveGame();
  assert.deepEqual(sm.load().worldClock, atDeath);
  run.frame(200, () => timers.find(timer => timer.delay === 2000).callback());
  assert.equal(scene.player.isDead(), false);
  assert.deepEqual(worldClock.serialize(), atDeath);
  assert.deepEqual(sm.load().worldClock, atDeath);
  run.frame(20);
  assert.equal(worldClock.format(), 'Dia 5 • 00:00');
});

test('save, close and reload preserve fractional time and ignore offline elapsed time', () => {
  const run = runtime();
  run.frame(); run.frame(345678.125);
  const sm = new SaveManager();
  const state = {version: 1, savedAt: 1, player: {hp: 73}, worldFlags: {approved: true}};
  sm.save(state);
  const saved = sm.load();
  assert.deepEqual(saved.player, state.player);
  assert.deepEqual(saved.worldFlags, state.worldFlags);
  assert.equal(state.worldClock, undefined, 'saving must not mutate the caller');
  run.game.events.emit('destroy');
  worldClock.reset();
  const reopened = runtime();
  assert.deepEqual(worldClock.serialize(), saved.worldClock);
  reopened.frame(365 * 24 * 60 * 60 * 1000);
  assert.deepEqual(worldClock.serialize(), saved.worldClock);
  reopened.frame(3000);
  assert.equal(worldClock.serialize().timeOfDayMs, saved.worldClock.timeOfDayMs + 60000);
});

test('CONTINUAR restores the selected save; ordinary load() reads never rewind the clock', () => {
  const run = runtime();
  run.frame(); run.frame(1234.5);
  const sm = new SaveManager();
  sm.save({version: 1, lastScene: 'CaveScene'});
  const saved = sm.load();
  run.frame(9000);
  const beforeRead = worldClock.serialize();
  sm.load(); sm.load();
  assert.deepEqual(worldClock.serialize(), beforeRead);
  let target;
  MenuScene.prototype.startExisting.call({fade: {out: cb => cb()}, scene: {start: key => { target = key; }}}, saved);
  assert.equal(target, 'CaveScene');
  assert.deepEqual(worldClock.serialize(), saved.worldClock);
  run.frame(2000);
  assert.deepEqual(worldClock.serialize(), saved.worldClock);
});

test('legacy saves keep 08:00; a new game starts on day 1 at 17:00', () => {
  localStorage.setItem('legends-of-aether-save', JSON.stringify({version: 1, player: {hp: 88}}));
  const run = runtime();
  assert.equal(worldClock.format(), 'Dia 1 • 08:00');
  assert.equal(new SaveManager().load().player.hp, 88);
  run.frame(); run.frame(500000);
  new SaveManager().clear();
  assert.equal(worldClock.format(), 'Dia 1 • 17:00');
  assert.equal(new SaveManager().load(), null);
});

test('map transitions and repeated installation cannot reset or accelerate the clock', () => {
  const run = runtime();
  run.frame(); run.frame(3000);
  for (const key of ['GreenWoodsScene', 'CaveScene', 'CastleScene', 'HouseInteriorScene', 'AetherCityScene']) {
    const before = worldClock.serialize();
    run.scenes[0].events.emit('shutdown');
    assert.equal(run.scenes[0].texts[0].destroyed, true);
    run.scenes[0] = map(key);
    assert.equal(installWorldClock(run.game), run.dispose);
    assert.equal(run.game.events.listenerCount('poststep'), 1);
    run.frame(90000);
    assert.deepEqual(worldClock.serialize(), before);
    run.frame(3000);
    assert.equal(worldClock.serialize().timeOfDayMs, before.timeOfDayMs + 60000);
    assert.equal(run.scenes[0].texts.length, 1);
    assert.equal(run.scenes[0].texts[0].text, worldClock.format());
  }
  run.game.events.emit('destroy');
  assert.equal(run.game.events.listenerCount('poststep'), 0);
});

test('all existing modal/scene/game pauses stop time without catch-up on resume', () => {
  const scene = map();
  const run = runtime([scene]);
  run.frame(); run.frame(3000);
  const pauses = [
    [() => scene.hud.enterModal(), () => scene.hud.leaveModal()],
    [() => { scene.dialogueOpen = true; }, () => { scene.dialogueOpen = false; }],
    [() => { scene.shop = {visible: true}; }, () => { scene.shop.visible = false; }],
    [() => { scene.active = false; }, () => { scene.active = true; }],
    [() => { scene.time.paused = true; }, () => { scene.time.paused = false; }],
    [() => { scene.time.timeScale = 0; }, () => { scene.time.timeScale = 1; }],
    [() => { scene.physics.world.isPaused = true; }, () => { scene.physics.world.isPaused = false; }],
    [() => run.game.events.emit('pause'), () => run.game.events.emit('resume')],
    [() => { document.hidden = true; }, () => { document.hidden = false; }],
    [() => run.game.events.emit('hidden'), () => run.game.events.emit('visible')],
    [() => run.game.events.emit('blur'), () => run.game.events.emit('focus')]
  ];
  for (const [pause, resume] of pauses) {
    const frozen = worldClock.serialize();
    pause(); run.frame(60000);
    assert.deepEqual(worldClock.serialize(), frozen);
    resume(); run.frame(60000);
    assert.deepEqual(worldClock.serialize(), frozen);
    run.frame(3000);
    assert.equal(worldClock.serialize().timeOfDayMs, frozen.timeOfDayMs + 60000);
  }
});

test('menu/loading scenes never run the world clock; overlapping pauses remain frozen', () => {
  const run = runtime([map('MenuScene')]);
  const frozen = worldClock.serialize();
  run.frame(REAL_DAY_MS); run.frame(REAL_DAY_MS);
  assert.deepEqual(worldClock.serialize(), frozen);
  assert.equal(run.scenes[0].texts.length, 0);
  run.scenes[0] = map(); run.frame();
  run.game.events.emit('blur'); run.game.events.emit('pause'); run.game.events.emit('focus');
  run.frame(60000); run.frame(60000);
  assert.deepEqual(worldClock.serialize(), frozen);
  run.game.events.emit('resume'); run.frame(60000); run.frame(3000);
  assert.equal(worldClock.minute, 1);
});

test('invalid clock payloads fall back without breaking a valid version-1 save', () => {
  for (const invalid of [null, {}, {version: 9}, {version: 1, day: 0, timeOfDayMs: 0},
    {version: 1, day: 1, timeOfDayMs: NaN}, {version: 1, day: 1, timeOfDayMs: GAME_DAY_MS}]) {
    const clock = new WorldClock(); clock.restore(invalid);
    assert.equal(clock.format(), 'Dia 1 • 08:00');
    for (const delta of [0, -1, NaN, Infinity]) clock.advance(delta);
    assert.equal(clock.format(), 'Dia 1 • 08:00');
  }
});

test('the real preloader still resolves every requested image/spritesheet', () => {
  const files = [];
  const graphics = new Proxy({}, {get: (_target, key) => key === 'destroy' ? () => {} : () => graphics});
  const scene = {
    load: {image: (_key, path) => files.push(path), spritesheet: (_key, path) => files.push(path), once() {}},
    add: {graphics: () => graphics}
  };
  PreloadScene.prototype.preload.call(scene);
  assert.ok(files.length > 100);
  for (const file of files) assert.ok(existsSync(join(root, file)), `Missing runtime asset: ${file}`);
});
