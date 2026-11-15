import { beforeEach, describe, expect, it } from 'vitest';
import { evaluate } from './evaluate';
import { createMeasurement, measurementsFromScenario } from './measurements';
import { addMeasurements, clearMeasurements, loadMeasurements } from './storage';
import { validateData } from './validate';
import type { Measurement, MetricId, Scenario } from './types';

const mockProfile = { name: 'Commander Test' };

const day = (n: number) => `2026-01-${String(n).padStart(2, '0')}T08:00:00Z`;
const m = (type: MetricId, value: number, d: number): Measurement =>
  createMeasurement(type, value, day(d));

describe('data', () => {
  it('thresholds are valid', () => expect(validateData()).toEqual([]));
});

describe('evaluate', () => {
  it('no data: everything no-data / normal overall', () => {
    const r = evaluate([], mockProfile);
    expect(r.overall).toBe('normal');
    expect(r.regions.cardiovascular).toBe('no-data');
    expect(r.indicators.sleep.latest).toEqual([]);
  });

  it('zone boundaries: a value belongs to the last zone whose min it reaches', () => {
  const hr = (v: number) =>
    evaluate([m('heart_rate', v, 1)], mockProfile).indicators.heart_rate.status;
  expect(hr(49.9)).toBe('critical'); // «дірка» між 49 і 50 належить нижчій зоні
  expect(hr(50)).toBe('attention');
  expect(hr(60)).toBe('normal');
  expect(hr(100)).toBe('normal');
  expect(hr(100.5)).toBe('normal'); // «дірка» між 100 і 101
  expect(hr(101)).toBe('attention');
  expect(hr(121)).toBe('critical');
  });

  it('blood pressure = worst of systolic and diastolic', () => {
    const r = evaluate([m('bp_systolic', 118, 1), m('bp_diastolic', 105, 1)], mockProfile);
    expect(r.indicators.blood_pressure.status).toBe('critical');
    expect(r.indicators.blood_pressure.reason).toContain('Diastolic');
    expect(r.indicators.blood_pressure.latest).toHaveLength(2);
  });

  it('uses the latest measurement regardless of array order', () => {
    const r = evaluate([m('sleep_hours', 3, 5), m('sleep_hours', 8, 2)], mockProfile);
    expect(r.indicators.sleep.status).toBe('critical');
  });

  it('regions and overall use the worst status; bones_muscles stays no-data', () => {
    const r = evaluate(
      [m('sleep_hours', 5, 1), m('mood_score', 4, 1), m('blood_glucose', 90, 1)],
      mockProfile,
    );
    expect(r.regions.brain_mind).toBe('attention');
    expect(r.regions.metabolism).toBe('normal');
    expect(r.regions.bones_muscles).toBe('no-data');
    expect(r.regions.immune).toBe('no-data');
    expect(r.overall).toBe('attention');
  });

  it('trend: worsening, improving, stable, unknown', () => {
    const s = (vals: number[]) =>
      evaluate(
        vals.map((v, i) => m('sleep_hours', v, i + 1)),
        mockProfile,
      ).indicators.sleep.trend;
    expect(s([7.5])).toBe('unknown');
    expect(s([7.2, 6.1, 5.4])).toBe('worsening');
    expect(s([4.5, 5, 6.5])).toBe('improving');
    expect(s([7, 7.5, 7.2, 7.4])).toBe('stable');
  });

  it('ignores NaN and bad timestamps', () => {
    const bad: Measurement = { ...m('heart_rate', NaN, 1) };
    expect(() => evaluate([bad], mockProfile)).not.toThrow();
  });

  it('scenario expansion', () => {
    const sc: Scenario = {
      id: 'x',
      title: 'x',
      story: '',
      days: [{ day: 10, values: { mood_score: 4 } }],
    };
    expect(measurementsFromScenario(sc)).toHaveLength(1);
  });
});

describe('storage', () => {
  beforeEach(() => clearMeasurements());
  it('saves, loads sorted, clears', () => {
    addMeasurements(m('heart_rate', 60, 2));
    addMeasurements(m('heart_rate', 62, 1));
    const list = loadMeasurements();
    expect(list.map((x) => x.value)).toEqual([62, 60]);
    clearMeasurements();
    expect(loadMeasurements()).toEqual([]);
  });
});
