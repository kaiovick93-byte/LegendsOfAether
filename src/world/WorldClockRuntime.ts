import type {Game, Scene} from 'phaser';
import {SaveManager} from '../save/SaveManager';
import {worldClock} from './WorldClock';
import {WorldClockHud} from '../ui/WorldClockHud';

type ClockScene = Scene & {
  player?: {isDead(): boolean};
  hud?: {isModal(): boolean};
  dialogueOpen?: boolean;
  shop?: {visible: boolean};
  switching?: boolean;
};

const WORLD_SCENES = new Set([
  'AetherCityScene', 'GreenWoodsScene', 'CaveScene', 'CastleScene', 'HouseInteriorScene'
]);
const installations = new WeakMap<Game, () => void>();

/** Installed once on the Game, not on individual scenes or scene timers. */
export function installWorldClock(game: Game) {
  const existing = installations.get(game);
  if (existing) return existing;

  worldClock.restore(new SaveManager().load()?.worldClock);
  let previousScene: ClockScene | undefined;
  let revision = worldClock.revision;
  const suspended = new Set<string>();
  const labels = new Map<ClockScene, {hud: WorldClockHud; remove: () => void}>();

  function showClock(scene: ClockScene) {
    let entry = labels.get(scene);
    if (!entry) {
      const hud = new WorldClockHud(scene);
      const remove = () => {
        scene.events.off('shutdown', remove);
        hud.destroy();
        labels.delete(scene);
        if (previousScene === scene) previousScene = undefined;
      };
      entry = {hud, remove};
      labels.set(scene, entry);
      scene.events.once('shutdown', remove);
    }
    entry.hud.update();
  }

  function step(_time: number, delta: number) {
    const scenes = (game.scene.getScenes(true) as ClockScene[])
      .filter(scene => WORLD_SCENES.has(scene.sys.settings.key));
    const scene = scenes[scenes.length - 1];
    const running = scene && !game.isPaused && !suspended.size
      && !(typeof document !== 'undefined' && document.hidden)
      && !scene.player?.isDead() && !scene.hud?.isModal()
      && !scene.dialogueOpen && !scene.shop?.visible && !scene.switching
      && !scene.time?.paused && scene.time?.timeScale !== 0
      && !scene.physics?.world?.isPaused;

    // POST_STEP observes death/modal changes made during this frame. The
    // first resumed/loaded frame only re-arms the clock: no paused time is
    // added by a respawn timer, browser resume or map-loading delta.
    if (running && previousScene === scene && revision === worldClock.revision) {
      worldClock.advance(delta);
    }
    previousScene = running ? scene : undefined;
    revision = worldClock.revision;
    for (const visibleScene of scenes) showClock(visibleScene);
  }

  const handlers = [
    ['pause', 'game', true], ['resume', 'game', false],
    ['hidden', 'hidden', true], ['visible', 'hidden', false],
    ['blur', 'focus', true], ['focus', 'focus', false]
  ].map(([event, reason, paused]: [string, string, boolean]) => {
    const handler = () => {
      if (paused) suspended.add(reason); else suspended.delete(reason);
      previousScene = undefined;
    };
    game.events.on(event, handler);
    return {event, handler};
  });

  const destroy = () => {
    game.events.off('poststep', step);
    game.events.off('destroy', destroy);
    for (const {event, handler} of handlers) game.events.off(event, handler);
    for (const entry of [...labels.values()]) entry.remove();
    installations.delete(game);
  };
  game.events.on('poststep', step);
  game.events.once('destroy', destroy);
  installations.set(game, destroy);
  return destroy;
}
