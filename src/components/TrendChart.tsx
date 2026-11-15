import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useMission } from '../core/missionControler';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ReferenceLine,
} from 'recharts';
import thresholdsData from '../content/thresholds.json';
import { getSeries } from '../core/history';
import { METRIC_IDS, type MetricId } from '../core/types';

type RangeKey = '7' | '14' | 'all';

type ThresholdZone = {
  status: string;
  min?: number;
  max?: number;
};

type ThresholdEntry = {
  indicator: string;
  label: string;
  unit: string;
  validRange: { min: number; max: number };
  zones: ThresholdZone[];
};

type TrendChartProps = {
  indicatorKey: string;
};

// Маршрути можуть містити ім'я показника, а не величини.
const METRIC_ALIAS: Record<string, MetricId> = {
  blood_pressure: 'bp_systolic',
  sleep: 'sleep_hours',
  mood: 'mood_score',
};

const RANGE_LABELS: Record<RangeKey, string> = {
  '7': 'Last 7 days',
  '14': 'Last 14 days',
  all: 'All days',
};

function resolveMetric(key: string): MetricId | undefined {
  if ((METRIC_IDS as readonly string[]).includes(key)) return key as MetricId;
  return METRIC_ALIAS[key];
}

export default function TrendChart({ indicatorKey }: TrendChartProps) {
    const [range, setRange] = useState<RangeKey>('7');
    const { measurements, playerState } = useMission();

  const metric = resolveMetric(indicatorKey);
  const threshold = metric
    ? (thresholdsData as unknown as Record<string, ThresholdEntry>)[metric]
    : undefined;
  const normalZone = threshold?.zones.find((z) => z.status === 'normal');
  const critHighZone = threshold?.zones.find((z) => z.status === 'critical' && z.min !== undefined);
  const isPressure = metric === 'bp_systolic';

  // Усі дані беруться зі збережених вимірювань (localStorage), а не генеруються.
  const rows = useMemo(() => {
    if (!metric) return [];
    const main = getSeries(metric, measurements);
      const dia = isPressure ? getSeries('bp_diastolic', measurements) : [];
    const diaByDay = new Map(dia.map((p) => [p.day, p.value]));
    const days = new Map(main.map((p) => [p.day, { day: p.day, label: p.label, value: p.value }]));
    for (const p of dia) {
      if (!days.has(p.day)) days.set(p.day, { day: p.day, label: p.label, value: NaN });
    }
    return [...days.values()]
      .sort((a, b) => a.day - b.day)
      .map((r) => ({
        label: r.label,
        value: Number.isNaN(r.value) ? null : r.value,
        value2: diaByDay.get(r.day) ?? null,
      }));
  }, [metric, isPressure, measurements]);

  const chartData = useMemo(() => {
    if (range === 'all') return rows;
    return rows.slice(-Number(range));
  }, [rows, range]);

  const yDomain = useMemo(() => {
    const vals: number[] = [];
    for (const d of chartData) {
      if (d.value !== null) vals.push(d.value);
      if (d.value2 !== null) vals.push(d.value2);
    }
    if (normalZone?.min !== undefined) vals.push(normalZone.min);
    if (normalZone?.max !== undefined) vals.push(normalZone.max);
    if (critHighZone?.min !== undefined) vals.push(critHighZone.min);
    if (vals.length === 0) return [0, 1];

    const minVal = Math.min(...vals);
    const maxVal = Math.max(...vals);
    const pad = (maxVal - minVal) * 0.15 || 2;
    return [Math.floor(minVal - pad), Math.ceil(maxVal + pad)];
  }, [chartData, normalZone, critHighZone]);

  return (
    <div>
      {/* Верхня панель графіка: вибір діапазону + легенда порогів */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '0.75rem',
          marginBottom: '1rem',
        }}
      >
        <div style={{ display: 'flex', gap: '0.4rem' }}>
          {(['7', '14', 'all'] as RangeKey[]).map((r) => (
            <button
              key={r}
              type="button"
              onClick={() => setRange(r)}
              style={{
                padding: '0.35rem 0.85rem',
                borderRadius: '6px',
                fontSize: '0.8rem',
                fontWeight: 700,
                cursor: 'pointer',
                border: '1px solid var(--nasa-blue)',
                backgroundColor: range === r ? 'var(--nasa-blue)' : '#ffffff',
                color: range === r ? '#ffffff' : 'var(--nasa-blue)',
              }}
            >
              {RANGE_LABELS[r]}
            </button>
          ))}
        </div>

        <div style={{ display: 'flex', gap: '1rem', fontSize: '0.75rem', fontFamily: 'var(--mono)' }}>
          {normalZone?.max !== undefined && (
            <span style={{ color: '#15803d', fontWeight: 700 }}>
              --- Normal Max ({normalZone.max} {threshold?.unit})
            </span>
          )}
          {critHighZone?.min !== undefined && (
            <span style={{ color: '#dc2626', fontWeight: 700 }}>
              --- Critical ({critHighZone.min} {threshold?.unit})
            </span>
          )}
        </div>
      </div>

      {chartData.length === 0 ? (
        <div
          style={{
            height: 280,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '0.5rem',
            color: '#475569',
            border: '1px dashed #cbd5e1',
            borderRadius: '8px',
          }}
        >
          <span>No saved readings for this indicator yet.</span>
          <Link to="/measure" className="nasa-tag">
            Log a new day →
          </Link>
        </div>
      ) : (
        <div style={{ width: '100%', height: 280 }}>
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData} margin={{ top: 10, right: 20, left: 0, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis dataKey="label" stroke="#475569" fontSize={12} />
              <YAxis domain={yDomain} stroke="#475569" fontSize={12} />
              <Tooltip
                formatter={(value, name) => [`${value} ${threshold?.unit ?? ''}`, String(name)]}
                contentStyle={{ borderRadius: '8px', borderColor: '#cbd5e1' }}
              />

              {/* Зелена пунктирна лінія верхньої межі норми */}
              {normalZone?.max !== undefined && (
                <ReferenceLine
                  y={normalZone.max}
                  stroke="#14d427"
                  strokeDasharray="5 5"
                  strokeWidth={2}
                />
              )}

              {/* Зелена пунктирна лінія нижньої межі норми */}
              {normalZone?.min !== undefined && (
                <ReferenceLine
                  y={normalZone.min}
                  stroke="#14d427"
                  strokeDasharray="5 5"
                  strokeWidth={2}
                />
              )}

              {/* Червона пунктирна лінія критичного порогу */}
              {critHighZone?.min !== undefined && (
                <ReferenceLine
                  y={critHighZone.min}
                  stroke="#f6270b"
                  strokeDasharray="4 4"
                  strokeWidth={2}
                />
              )}

              <Line
                type="monotone"
                dataKey="value"
                name={isPressure ? 'Systolic' : (threshold?.label ?? 'Value')}
                stroke="#0b3e91"
                strokeWidth={3}
                connectNulls
                isAnimationActive={!playerState.running}
                dot={{ r: 5, fill: '#0b3e91', strokeWidth: 2, stroke: '#ffffff' }}
                activeDot={{ r: 7, fill: '#fc3d21' }}
              />

              {isPressure && (
                <Line
                  type="monotone"
                  dataKey="value2"
                  name="Diastolic"
                  stroke="#64748b"
                  strokeWidth={2}
                  connectNulls
                  isAnimationActive={!playerState.running}
                  dot={{ r: 4, fill: '#64748b', strokeWidth: 2, stroke: '#ffffff' }}
                />
              )}
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}
