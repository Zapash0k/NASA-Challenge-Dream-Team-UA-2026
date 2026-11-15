import { createMeasurement } from './measurements';
import { addMeasurements, loadMeasurements } from './storage';
import type { Measurement, MetricId } from './types';
import { METRIC_IDS } from './types';

/** Значення, введені за один день (будь-яка підмножина величин). */
export type DayValues = Partial<Record<MetricId, number>>;

export interface SeriesPoint {
  day: number; // день місії
  label: string; // підпис для осі X
  timestamp: string;
  value: number;
}

/** Номер наступного дня місії: максимум серед збережених + 1 (або 1, якщо даних ще немає). */
export function nextMissionDay(list: Measurement[] = loadMeasurements()): number {
  let max = 0;
  for (const m of list) {
    if (m.missionDay !== undefined && m.missionDay > max) max = m.missionDay;
  }
  return max + 1;
}

/**
 * Зберігає введені дані як НОВИЙ день місії (старі дні не змінюються).
 * Кожна заповнена величина стає окремим записом у localStorage ('ahm.measurements.v1').
 * Повертає номер доданого дня.
 */
export function saveDay(values: DayValues): number {
  const existing = loadMeasurements();
  const day = nextMissionDay(existing);

  // час нового дня не раніше за останній запис, щоб порядок на графіку був правильний
  const last = existing.length > 0 ? new Date(existing[existing.length - 1].timestamp).getTime() : 0;
  const timestamp = new Date(Math.max(Date.now(), last + 1000)).toISOString();

  const items: Measurement[] = [];
  for (const id of METRIC_IDS) {
    const v = values[id];
    if (v !== undefined && Number.isFinite(v)) {
      items.push(createMeasurement(id, v, timestamp, day));
    }
  }
  if (items.length > 0) addMeasurements(...items);
  return day;
}

/** Історія однієї величини: одна точка на день місії, за зростанням дня. */
export function getSeries(metric: MetricId, list: Measurement[] = loadMeasurements()): SeriesPoint[] {
  const byDay = new Map<number, SeriesPoint>();
  list.forEach((m, i) => {
    if (m.type !== metric) return;
    const day = m.missionDay ?? i + 1;
    byDay.set(day, { day, label: `Day ${day}`, timestamp: m.timestamp, value: m.value });
  });
  return [...byDay.values()].sort((a, b) => a.day - b.day);
}
