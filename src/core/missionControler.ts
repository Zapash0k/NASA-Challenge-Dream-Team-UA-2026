import { useSyncExternalStore } from 'react';
import { createScenarioPlayer, type PlayerState } from '../data/player';
import { getScenario, scenarios } from '../data/scenarios';
import { saveDay, type DayValues } from './history';
import { clearMeasurements, loadMeasurements, saveMeasurements } from './storage';
import type { Measurement } from './types';

/**
 * Єдине джерело правди для всього сайту.
 *
 * - `measurements` це історія (графіки, тренди); `vitals` це «поточний стан» (Dashboard, Body Map).
 * - Симуляція та ручні вимірювання пишуть ТІЛЬКИ сюди, а сторінки підписуються через `useMission()`.
 * - Стан живе на рівні модуля, тож таймер симуляції не зупиняється при переході між сторінками.
 * - Історія, поточний стан і позиція відтворення зберігаються в localStorage: після перезавантаження
 *   сторінки симуляція відновлюється на паузі з того ж дня.
 */

export const VITALS_STORAGE_KEY = 'orbitwell_vitals';
const MISSION_STORAGE_KEY = 'orbitwell_mission_v1';

/** День, який показується, поки симуляція не запускалась. */
export const NOMINAL_DAY = 187;

export type StoredVitals = {
  heart_rate: number;
  bp_systolic: number;
  bp_diastolic: number;
  body_temperature: number;
  blood_glucose: number;
  sleep_hours: number;
  sleep_quality: number;
  mood_score: number;
  notes: string;
  updatedAt: string;
};

export interface MissionStore {
  selectedId: string;
  playerState: PlayerState;
  vitals: StoredVitals;
  /** Уся історія вимірювань: те, що вже відтворено симуляцією, плюс ручні записи. */
  measurements: Measurement[];
}

const DEFAULT_VITALS: StoredVitals = {
  heart_rate: 72,
  bp_systolic: 118,
  bp_diastolic: 76,
  body_temperature: 36.6,
  blood_glucose: 92,
  sleep_hours: 7.5,
  sleep_quality: 4,
  mood_score: 4,
  notes: '',
  updatedAt: 'Nominal baseline',
};

const IDLE_STATE: PlayerState = {
  running: false,
  scenarioId: null,
  speed: 1,
  index: 0,
  total: 0,
  day: null,
};

// ---------- збереження ----------

interface PersistedMission {
  selectedId: string;
  scenarioId: string | null;
  index: number;
  speed: number;
}

function loadInitialVitals(): StoredVitals {
  try {
    const saved = localStorage.getItem(VITALS_STORAGE_KEY);
    if (saved) return { ...DEFAULT_VITALS, ...(JSON.parse(saved) as Partial<StoredVitals>) };
  } catch {
    // ignore
  }
  return DEFAULT_VITALS;
}

function persistVitals(vitals: StoredVitals) {
  try {
    localStorage.setItem(VITALS_STORAGE_KEY, JSON.stringify(vitals));
  } catch {
    // ignore
  }
}

function loadPersistedMission(): PersistedMission | null {
  try {
    const raw = localStorage.getItem(MISSION_STORAGE_KEY);
    if (!raw) return null;
    const p = JSON.parse(raw) as Partial<PersistedMission>;
    if (typeof p.selectedId !== 'string') return null;
    return {
      selectedId: p.selectedId,
      scenarioId: typeof p.scenarioId === 'string' ? p.scenarioId : null,
      index: typeof p.index === 'number' ? p.index : 0,
      speed: typeof p.speed === 'number' ? p.speed : 1,
    };
  } catch {
    return null;
  }
}

function persistMission() {
  const { selectedId, playerState } = store;
  const data: PersistedMission = {
    selectedId,
    scenarioId: playerState.scenarioId,
    index: playerState.index,
    speed: playerState.speed,
  };
  try {
    localStorage.setItem(MISSION_STORAGE_KEY, JSON.stringify(data));
  } catch {
    // ignore
  }
}

// ---------- store ----------

const persisted = loadPersistedMission();

let store: MissionStore = {
  selectedId:
    persisted && getScenario(persisted.selectedId)
      ? persisted.selectedId
      : (scenarios[0]?.id ?? 'normal'),
  playerState: IDLE_STATE,
  vitals: loadInitialVitals(),
  measurements: loadMeasurements(),
};

type Listener = (snapshot: MissionStore) => void;
const listeners = new Set<Listener>();

function emit() {
  const snapshot = store;
  listeners.forEach((fn) => fn(snapshot));
}

/** Переносить значення вимірювань у «поточний стан». */
function applyMeasurements(base: StoredVitals, list: Measurement[], label: string): StoredVitals {
  const next: StoredVitals = { ...base, updatedAt: label };
  for (const m of list) {
    if (m.type in next) {
      (next as unknown as Record<string, number | string>)[m.type] = m.value;
    }
  }
  return next;
}

const player = createScenarioPlayer({
  getScenario,
  onStateChange: (nextState) => {
    store = { ...store, playerState: { ...nextState } };
    persistMission();
    emit();
  },
  onDay: (event) => {
    const vitals = applyMeasurements(
      store.vitals,
      event.measurements,
      `Mission Day ${event.day ?? event.index}`,
    );
    const measurements = [...store.measurements, ...event.measurements];
    saveMeasurements(measurements);
    persistVitals(vitals);
    store = { ...store, vitals, measurements };
    emit();
  },
});

// Відновлення після перезавантаження: той самий день, на паузі.
if (persisted?.scenarioId && getScenario(persisted.scenarioId)) {
  player.restore(persisted.scenarioId, persisted.index, persisted.speed);
}

// ---------- читання ----------

export function getMissionStore(): MissionStore {
  return store;
}

export function subscribeMission(listener: Listener): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

/** Хук для будь-якої сторінки: компонент перемальовується при кожному кроці симуляції. */
export function useMission(): MissionStore {
  return useSyncExternalStore(subscribeMission, getMissionStore, getMissionStore);
}

/** День місії для показу в інтерфейсі. */
export function missionDayOf(state: PlayerState): number {
  return state.day ?? (state.index > 0 ? state.index : NOMINAL_DAY);
}

/** Симуляція запущена або стоїть на паузі посеред сценарію. */
export function isSimulationInProgress(state: PlayerState): boolean {
  return state.index > 0 && state.index < state.total;
}

// ---------- керування ----------

/** Починає сценарій заново: історія й поточний стан очищаються, дані наповнюються кроками. */
function beginScenario(id: string) {
  clearMeasurements();
  persistVitals(DEFAULT_VITALS);
  store = { ...store, selectedId: id, vitals: DEFAULT_VITALS, measurements: [] };
  player.start(id);
}

export function selectScenario(id: string) {
  if (store.playerState.running) {
    beginScenario(id);
  } else {
    store = { ...store, selectedId: id };
    persistMission();
    emit();
  }
}

export function startOrResumeMission() {
  const { selectedId, playerState } = store;
  if (
    playerState.scenarioId === selectedId &&
    !playerState.running &&
    playerState.index > 0 &&
    playerState.index < playerState.total
  ) {
    player.resume();
  } else {
    beginScenario(selectedId);
  }
}

export function pauseMission() {
  player.pause();
}

/** Зупиняє симуляцію й повертає сайт до початкового стану (історія порожня, показники в нормі). */
export function resetMission() {
  clearMeasurements();
  persistVitals(DEFAULT_VITALS);
  store = { ...store, vitals: DEFAULT_VITALS, measurements: [] };
  player.reset();
}

export function setMissionSpeed(speed: number) {
  player.setSpeed(speed);
}

/** Ручне вимірювання з форми: пише і в історію, і в поточний стан. Повертає номер доданого дня. */
export function logManualDay(values: DayValues, vitals: StoredVitals): number {
  const day = saveDay(values);
  persistVitals(vitals);
  store = { ...store, vitals, measurements: loadMeasurements() };
  emit();
  return day;
}
