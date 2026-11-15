import { content, thresholds } from './data';
import { INDICATOR_IDS, METRIC_IDS, STATUSES } from './types';

export function validateData(): string[] {
  const problems: string[] = [];

  for (const id of METRIC_IDS) {
    const t = thresholds[id];
    if (!t) {
      problems.push(`thresholds: missing metric "${id}"`);
      continue;
    }
    if (t.validRange.min >= t.validRange.max) {
      problems.push(`thresholds.${id}: validRange.min must be less than validRange.max`);
    }
        t.zones.forEach((zone, i) => {
      if (!STATUSES.includes(zone.status)) {
        problems.push(`thresholds.${id}: unknown status "${zone.status}"`);
      }
      if (i === 0 && zone.min !== undefined) {
        problems.push(
          `thresholds.${id}: the first zone must have no min (it covers everything below)`,
        );
      }
      if (i > 0 && zone.min === undefined) {
        problems.push(`thresholds.${id}: only the first zone may omit min`);
      }
      const prevMin = i > 0 ? t.zones[i - 1].min : undefined;
      if (zone.min !== undefined && prevMin !== undefined && zone.min <= prevMin) {
        problems.push(`thresholds.${id}: zones must be sorted by increasing min`);
      }
      if (zone.min !== undefined && zone.max !== undefined && zone.max < zone.min) {
        problems.push(`thresholds.${id}: zone max is below its min`);
      }
    });
    if (!t.zones.some((zone) => zone.status === 'normal')) {
      problems.push(`thresholds.${id}: no zone with status "normal"`);
    }
  }

  for (const id of INDICATOR_IDS) {
    if (!content[id]) problems.push(`content: missing indicator "${id}"`);
  }

  return problems;
}
