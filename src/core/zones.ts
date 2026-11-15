import type { Zone } from './types';

/**
 * Зони йдуть за зростанням `min`. Значення належить ОСТАННІЙ зоні, чий `min` воно досягло;
 * перша зона без `min` ловить усе, що нижче. `max` потрібен лише для показу діапазону людям
 * («норма 60–100»), тому між зонами не виникає «дірок» на кшталт 49.9 чи 100.5.
 */
export function findZone(value: number, zones: Zone[]): Zone | undefined {
  let found: Zone | undefined;
  for (const zone of zones) {
    if (zone.min === undefined || value >= zone.min) found = zone;
  }
  return found;
}