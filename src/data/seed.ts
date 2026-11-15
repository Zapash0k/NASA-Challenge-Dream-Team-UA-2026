import { addMeasurements, loadMeasurements } from '../core/storage';
import type { Scenario } from '../core/types';
import normal from './scenarios/normal.json';
import { scenarioToBatches } from './player';

const SEED_FLAG = 'ahm.seeded.v1';

/**
 * Стартові дані для графіків: при першому запуску додає 30 днів зі сценарію «normal»
 * (дні 185–214, останній день отримує час «зараз»). Виконується лише один раз:
 * якщо дані вже є або прапорець виставлено, нічого не робить.
 */
export function seedIfEmpty(): void {
  try {
    if (localStorage.getItem(SEED_FLAG) !== null) return;
    if (loadMeasurements().length === 0) {
      addMeasurements(...scenarioToBatches(normal as unknown as Scenario).flat());
    }
    localStorage.setItem(SEED_FLAG, '1');
  } catch {
    /* localStorage недоступний: стартові дані пропускаємо */
  }
}
