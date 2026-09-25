/** One in-game day lasts 72 real minutes (20 game seconds per real second). */
export const REAL_DAY_MS = 72 * 60 * 1000;
export const GAME_DAY_MS = 24 * 60 * 60 * 1000;
const LEGACY_START_TIME_MS = 8 * 60 * 60 * 1000;
const NEW_GAME_START_TIME_MS = 17 * 60 * 60 * 1000;

export interface WorldClockState {
  version: 1;
  day: number;
  /** In-game milliseconds since midnight, including the sub-minute remainder. */
  timeOfDayMs: number;
}

export class WorldClock {
  private currentDay = 1;
  private timeMs = LEGACY_START_TIME_MS;
  /** Changes only when starting/loading a session, never when changing maps. */
  revision = 0;

  get day() { return this.currentDay; }
  get hour() { return Math.floor(this.timeMs / 3600000); }
  get minute() { return Math.floor(this.timeMs / 60000) % 60; }
  get timeOfDayMs() { return this.timeMs; }

  advance(realDeltaMs: number) {
    if (!Number.isFinite(realDeltaMs) || realDeltaMs <= 0) return;
    const next = this.timeMs + realDeltaMs * (GAME_DAY_MS / REAL_DAY_MS);
    if (!Number.isFinite(next)) return;
    this.currentDay += Math.floor(next / GAME_DAY_MS);
    this.timeMs = next % GAME_DAY_MS;
  }

  serialize(): WorldClockState {
    return {version: 1, day: this.currentDay, timeOfDayMs: this.timeMs};
  }

  restore(value?: unknown) {
    const state = value as Partial<WorldClockState> | undefined;
    const valid = state?.version === 1 && Number.isSafeInteger(state.day) && state.day >= 1
      && Number.isFinite(state.timeOfDayMs) && state.timeOfDayMs >= 0 && state.timeOfDayMs < GAME_DAY_MS;
    // Old saves have no clock. They start on day 1 at 08:00, without migration
    // of player data or using savedAt / Date.now() to simulate offline time.
    this.currentDay = valid ? state.day : 1;
    this.timeMs = valid ? state.timeOfDayMs : LEGACY_START_TIME_MS;
    this.revision++;
  }

  reset() {
    // Novo Jogo começa no Dia 1 às 17:00. Mantemos restore(undefined) em
    // 08:00 apenas para compatibilidade com saves antigos sem worldClock.
    this.currentDay = 1;
    this.timeMs = NEW_GAME_START_TIME_MS;
    this.revision++;
  }

  format() {
    return `Dia ${this.day} • ${String(this.hour).padStart(2, '0')}:${String(this.minute).padStart(2, '0')}`;
  }
}

/** Shared by the game loop, every HUD and every SaveManager instance. */
export const worldClock = new WorldClock();
