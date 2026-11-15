import { thresholds } from '../core/data';
import type { Measurement, MetricId, Scenario } from '../core/types';

const DAY_MS = 24 * 60 * 60 * 1000;
/** Скільки реального часу триває один день місії при швидкості x1. */
export const BASE_INTERVAL_MS = 1500;

export interface PlayerEvent {
  day: number; // день місії
  index: number; // скільки днів уже відтворено
  total: number;
  measurements: Measurement[];
  done: boolean;
}

export interface PlayerState {
  running: boolean;
  scenarioId: string | null;
  speed: number;
  index: number;
  total: number;
  day: number | null;
}

/** Пакети вимірювань по днях; останній день отримує timestamp «зараз». */
export function scenarioToBatches(scenario: Scenario, endTime = Date.now()): Measurement[][] {
  const n = scenario.days.length;
  return scenario.days.map((d, i) => {
    const timestamp = new Date(endTime - (n - 1 - i) * DAY_MS).toISOString();
    return (Object.entries(d.values) as [MetricId, number][]).map(([type, value]) => ({
      type,
      value,
      unit: thresholds[type]?.unit ?? '',
      timestamp,
      missionDay: d.day,
    }));
  });
}

export interface ScenarioPlayerOptions {
  getScenario: (id: string) => Scenario | undefined;
  onDay: (event: PlayerEvent) => void;
  onStateChange?: (state: PlayerState) => void;
}

export function createScenarioPlayer(options: ScenarioPlayerOptions) {
  let scenario: Scenario | null = null;
  let batches: Measurement[][] = [];
  let index = 0;
  let speed = 1;
  let running = false;
  let timer: ReturnType<typeof setTimeout> | null = null;

  const getState = (): PlayerState => ({
    running,
    scenarioId: scenario?.id ?? null,
    speed,
    index,
    total: batches.length,
    day: index > 0 && scenario ? scenario.days[index - 1].day : null,
  });
  const notify = () => options.onStateChange?.(getState());

  const clearTimer = () => {
    if (timer !== null) {
      clearTimeout(timer);
      timer = null;
    }
  };

  const scheduleNext = () => {
    clearTimer();
    if (running) timer = setTimeout(step, BASE_INTERVAL_MS / speed);
  };

  function step() {
    timer = null;
    if (!scenario || index >= batches.length) {
      running = false;
      notify();
      return;
    }
    const measurements = batches[index];
    const day = scenario.days[index].day;
    index += 1;
    const done = index >= batches.length;
    if (done) running = false;
    options.onDay({ day, index, total: batches.length, measurements, done });
    notify();
    if (!done) scheduleNext();
  }

  return {
    getState,
    /** Запускає сценарій спочатку; перший день відтворюється одразу. */
    start(id: string) {
      const found = options.getScenario(id);
      if (!found) throw new Error(`Unknown scenario: ${id}`);
      clearTimer();
      scenario = found;
      batches = scenarioToBatches(found);
      index = 0;
      running = true;
      step();
    },
    pause() {
      running = false;
      clearTimer();
      notify();
    },
    resume() {
      if (!scenario || running || index >= batches.length) return;
      running = true;
      notify();
      scheduleNext();
    },
    /** Відновлює позицію (наприклад, після перезавантаження сторінки) на паузі; таймер не стартує. */
    restore(id: string, at: number, x = 1) {
      const found = options.getScenario(id);
      if (!found) return;
      clearTimer();
      scenario = found;
      batches = scenarioToBatches(found);
      index = Math.min(batches.length, Math.max(0, Math.floor(at)));
      speed = Math.min(20, Math.max(0.25, x));
      running = false;
      notify();
    },
    reset() {
      clearTimer();
      running = false;
      scenario = null;
      batches = [];
      index = 0;
      notify();
    },
    setSpeed(x: number) {
      speed = Math.min(20, Math.max(0.25, x));
      notify();
      if (running) scheduleNext();
    },
  };
}