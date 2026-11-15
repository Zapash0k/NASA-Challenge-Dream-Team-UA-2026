import { useParams, Link } from 'react-router-dom';
import contentData from '../content/content.json';
import thresholdsData from '../content/thresholds.json';
import TrendChart from '../components/TrendChart';
import GlossaryText, { TermTooltip } from '../components/GlossaryText';

type SourceItem = {
  title: string;
  url: string;
};

type ContentEntry = {
  title: string;
  howToMeasure: string;
  whyItMatters: string;
  spaceRisk: string;
  whenToWorry: string;
  actions: string | string[];
  callFlightSurgeon: string;
  source?: SourceItem[];
};

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

const CONTENT_KEY_MAP: Record<string, string> = {
  heart_rate: 'heart_rate',
  bp_systolic: 'blood_pressure',
  bp_diastolic: 'blood_pressure',
  blood_pressure: 'blood_pressure',
  body_temperature: 'body_temperature',
  blood_glucose: 'blood_glucose',
  sleep_hours: 'sleep',
  sleep: 'sleep',
  mood_score: 'mood',
  mood: 'mood',
};

export default function IndicatorPage() {
  const { id } = useParams<{ id: string }>();
  const rawKey = id || 'heart_rate';

  const contentKey = CONTENT_KEY_MAP[rawKey] || rawKey;
  const content = (contentData as unknown as Record<string, ContentEntry>)[contentKey];

  const thresholdKey = rawKey === 'blood_pressure' ? 'bp_systolic' : rawKey;
  const threshold = (thresholdsData as unknown as Record<string, ThresholdEntry>)[thresholdKey];

  if (!content && !threshold) {
    return (
      <div className="nasa-white-card">
        <h2>Indicator not found</h2>
        <p>Unknown parameter: {rawKey}</p>
        <Link to="/" className="nasa-tag">← Back to Dashboard</Link>
      </div>
    );
  }

  const normalZone = threshold?.zones.find((z) => z.status === 'normal');

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      {/* Навігація назад + Заголовок */}
      <div className="nasa-white-card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem' }}>
          <Link to="/" className="nasa-tag">← Back to Console</Link>
          {threshold && (
            <span className="unit-label">
              Unit: <strong><TermTooltip termKey={threshold.unit}>{threshold.unit}</TermTooltip></strong> | Normal: {normalZone?.min ?? '-'}-{normalZone?.max ?? '-'} {threshold.unit}
            </span>
          )}
        </div>

        <h2 style={{ marginTop: '0.5rem' }}>
          {threshold?.label || content?.title || rawKey}
        </h2>

        {/* Швидке перемикання між показниками */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginTop: '0.75rem' }}>
          {Object.entries(thresholdsData).map(([key, item]) => (
            <Link
              key={key}
              to={`/indicator/${key}`}
              style={{
                padding: '0.25rem 0.6rem',
                borderRadius: '6px',
                fontSize: '0.75rem',
                fontFamily: 'var(--mono)',
                border: '1px solid var(--border-light)',
                backgroundColor: key === thresholdKey ? 'var(--nasa-blue)' : '#f8fafc',
                color: key === thresholdKey ? '#ffffff' : 'var(--ink-dark)',
              }}
            >
              {item.label}
            </Link>
          ))}
        </div>
      </div>

      {/* Заглушка під графік (задача C4) */}
      <div className="nasa-white-card">
        <span className="nasa-tag">TREND CHART</span>
        <h3>Telemetry History</h3>
        <TrendChart indicatorKey={thresholdKey} />
      </div>

      {/* Сітка текстових блоків із content.json */}
      {content && (
        <div className="vitals-grid-2x2">
          <div className="nasa-white-card">
            <span className="nasa-tag">PROTOCOL</span>
            <h3>How to Measure</h3>
            <p><GlossaryText text={content.howToMeasure}/></p>
          </div>

          <div className="nasa-white-card">
            <span className="nasa-tag">PHYSIOLOGY</span>
            <h3>Why It Matters</h3>
            <p><GlossaryText text={content.whyItMatters} /></p>
          </div>

          <div className="nasa-white-card">
            <span className="nasa-tag">MICROGRAVITY FACTOR</span>
            <h3>Space Risk</h3>
            <p><GlossaryText text={content.spaceRisk} /></p>
          </div>

          <div className="nasa-white-card">
            <span className="nasa-tag">THRESHOLDS</span>
            <h3>When to Worry</h3>
            <p><GlossaryText text={content.whenToWorry} /></p>
          </div>

          <div className="nasa-white-card">
            <span className="nasa-tag">COUNTERMEASURES</span>
            <h3>What to Do (Actions)</h3>
            {Array.isArray(content.actions) ? (
              <ul>
                {content.actions.map((action, idx) => (
                  <li key={idx}><GlossaryText text={action} /></li>
                ))}
              </ul>
            ) : (
              <p><GlossaryText text={content.actions} /></p>
            )}
          </div>

          <div className="nasa-white-card" style={{ borderTop: '4px solid var(--nasa-red)' }}>
            <span className="nasa-tag" style={{ color: 'var(--nasa-red)', backgroundColor: '#fef2f2' }}>
              FLIGHT SURGEON ALERT
            </span>
            <h3>When to Contact Flight Surgeon</h3>
            <p><GlossaryText text={content.callFlightSurgeon} /></p>
          </div>
        </div>
      )}

      {/* Джерела */}
      <div className="nasa-white-card">
        <span className="nasa-tag">REFERENCES</span>
        <h3>Sources</h3>
        {content?.source && content.source.length > 0 ? (
          <ul>
            {content.source.map((src, idx) => (
              <li key={idx}>
                <a
                  href={src.url}
                  target="_blank"
                  rel="noreferrer"
                  style={{ color: 'var(--nasa-blue)', textDecoration: 'underline' }}
                >
                  {src.title}
                </a>
              </li>
            ))}
          </ul>
        ) : (
          <p className="unit-label">No sources linked yet</p>
        )}
      </div>
    </div>
  );
}