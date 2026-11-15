import { useState } from 'react';
import { Link } from 'react-router-dom';
import thresholdsData from '../content/thresholds.json';
import { useMission } from '../core/missionControler';

type ZoneStatus = 'normal' | 'attention' | 'critical';

interface OrganDef {
  id: string;
  name: string;
  img: string;
  metrics: { key: keyof typeof thresholdsData; label: string; routeId: string }[];
}

const BODY_MODELS = {
  male: {
    img: { href: '/body-silhouette-male.svg', x: '390', y: '25', width: '244', height: '525' },
    zones: {
      head: 'M 486,42 L 538,42 L 540,104 L 531,120 L 493,120 L 484,104 Z',
      torso: 'M 493,120 L 531,120 L 560,136 L 560,210 L 555,270 L 469,270 L 464,210 L 464,136 Z',
      hips: 'M 469,270 L 555,270 L 563,322 L 556,335 L 512,324 L 468,335 L 461,322 Z',
      'right-arm': 'M 464,136 L 464,210 L 456,280 L 452,350 L 428,350 L 430,260 L 442,150 Z',
      'left-arm': 'M 560,136 L 582,150 L 594,260 L 598,350 L 572,350 L 568,280 L 560,210 Z',
      'right-leg': 'M 468,335 L 512,324 L 508,430 L 492,535 L 444,535 L 460,440 Z',
      'left-leg': 'M 512,324 L 556,335 L 564,440 L 580,535 L 532,535 L 516,430 Z',
    },
  },
  female: {
    img: { href: '/body-silhouette-female.svg', x: '390', y: '25', width: '244', height: '525' },
    zones: {
      head: 'M 489,45 L 535,45 L 535,102 L 526,120 L 498,120 L 489,102 Z',
      torso:
        'M 498,120 L 526,120 L 555,135 L 553,185 L 545,232 L 556,266 L 468,266 L 479,232 L 471,185 L 469,135 Z',
      hips: 'M 468,266 L 556,266 L 565,305 L 560,335 L 512,324 L 464,335 L 459,305 Z',
      'right-arm': 'M 469,135 L 471,185 L 462,265 L 456,345 L 436,345 L 438,260 L 449,150 Z',
      'left-arm': 'M 555,135 L 575,150 L 586,260 L 588,345 L 568,345 L 562,265 L 553,185 Z',
      'right-leg': 'M 464,335 L 512,324 L 504,430 L 497,532 L 468,532 L 474,430 Z',
      'left-leg': 'M 512,324 L 560,335 L 550,430 L 556,532 L 527,532 L 520,430 Z',
    },
  },
};

const ZONE_ORGANS: Record<string, OrganDef[]> = {
  head: [
    {
      id: 'brain',
      name: 'Brain & Neuro',
      img: '/organs/brain.svg',
      metrics: [
        { key: 'sleep_hours', label: 'Sleep Duration', routeId: 'sleep_hours' },
        { key: 'mood_score', label: 'Mood & Stress', routeId: 'mood_score' },
        { key: 'blood_glucose', label: 'Blood Glucose', routeId: 'blood_glucose' },
        { key: 'bp_systolic', label: 'Blood Pressure', routeId: 'bp_systolic' },
      ],
    },
    {
      id: 'eyes',
      name: 'Eyes & Optic',
      img: '/organs/eyes.svg',
      metrics: [
        { key: 'bp_systolic', label: 'Blood Pressure', routeId: 'bp_systolic' },
        { key: 'blood_glucose', label: 'Blood Glucose', routeId: 'blood_glucose' },
      ],
    },
  ],
  torso: [
    {
      id: 'heart',
      name: 'Heart & Vessels',
      img: '/organs/heart.svg',
      metrics: [
        { key: 'heart_rate', label: 'Heart Rate', routeId: 'heart_rate' },
        { key: 'bp_systolic', label: 'Systolic BP', routeId: 'bp_systolic' },
        { key: 'bp_diastolic', label: 'Diastolic BP', routeId: 'bp_diastolic' },
      ],
    },
    {
      id: 'lungs',
      name: 'Lungs',
      img: '/organs/lungs.svg',
      metrics: [{ key: 'heart_rate', label: 'Heart Rate', routeId: 'heart_rate' }],
    },
    {
      id: 'liver',
      name: 'Liver',
      img: '/organs/liver.svg',
      metrics: [
        { key: 'blood_glucose', label: 'Blood Glucose', routeId: 'blood_glucose' },
        { key: 'body_temperature', label: 'Body Temperature', routeId: 'body_temperature' },
      ],
    },
    {
      id: 'digestive-system',
      name: 'Digestive System',
      img: '/organs/digestive-system.svg',
      metrics: [{ key: 'blood_glucose', label: 'Blood Glucose', routeId: 'blood_glucose' }],
    },
    {
      id: 'kidneys',
      name: 'Kidneys',
      img: '/organs/kidneys.svg',
      metrics: [{ key: 'bp_systolic', label: 'Blood Pressure', routeId: 'bp_systolic' }],
    },
  ],
  hips: [
    {
      id: 'urinary-system',
      name: 'Urinary System',
      img: '/organs/urinary-system.svg',
      metrics: [{ key: 'body_temperature', label: 'Body Temperature', routeId: 'body_temperature' }],
    },
  ],
  'left-arm': [],
  'right-arm': [],
  'left-leg': [],
  'right-leg': [],
};

const STATUS_STYLE: Record<ZoneStatus, { fill: string; stroke: string; label: string; icon: string }> = {
  normal: { fill: 'rgba(16, 185, 129, 0.22)', stroke: '#10b981', label: 'Normal', icon: '✓' },
  attention: { fill: 'rgba(245, 158, 11, 0.28)', stroke: '#f59e0b', label: 'Attention', icon: '⚠' },
  critical: { fill: 'rgba(239, 68, 68, 0.30)', stroke: '#ef4444', label: 'Critical', icon: '!' },
};

const SEVERITY: Record<ZoneStatus, number> = { normal: 0, attention: 1, critical: 2 };

function worstOf(list: ZoneStatus[]): ZoneStatus {
  return list.reduce<ZoneStatus>((a, b) => (SEVERITY[b] > SEVERITY[a] ? b : a), 'normal');
}

function getThresholdStatus(key: keyof typeof thresholdsData, value: number): ZoneStatus {
  const zones = thresholdsData[key]?.zones ?? [];
  let matched: ZoneStatus = 'attention';
  for (const z of zones) {
    const aboveMin = !('min' in z) || z.min === undefined || value >= z.min;
    const belowMax = !('max' in z) || z.max === undefined || value <= z.max;
    if (aboveMin && belowMax) matched = z.status as ZoneStatus;
  }
  return matched;
}


export default function BodyMapPage() {
  const [gender, setGender] = useState<'male' | 'female'>('male');
  const [zone, setZone] = useState<string | null>('torso');
  const [selectedOrgan, setSelectedOrgan] = useState<string | null>(null);
  const { vitals } = useMission();

  const model = BODY_MODELS[gender];

  const getOrganStatus = (organ: OrganDef): ZoneStatus => {
    if (organ.metrics.length === 0) return 'normal';
    return worstOf(organ.metrics.map((m) => getThresholdStatus(m.key, vitals[m.key])));
  };

  const getZoneStatus = (zoneId: string): ZoneStatus => {
    const organs = ZONE_ORGANS[zoneId] || [];
    if (organs.length === 0) return 'normal';
    return worstOf(organs.map(getOrganStatus));
  };

  const organsInZone = zone ? ZONE_ORGANS[zone] || [] : [];

  return (
    <div className="nasa-white-card">
      <div className="body-card-top">
        <div>
          <span className="nasa-tag">BODY SYSTEMS</span>
          <h2>Interactive Body Map</h2>
          <p className="card-subtitle">
            Full-scale 2D body visualization and system diagnostics module.
          </p>
        </div>

        <div className="body-gender-switch" role="group" aria-label="Body model selection">
          <button
            type="button"
            className={`body-gender-btn ${gender === 'male' ? 'active' : ''}`}
            onClick={() => setGender('male')}
          >
            Male
          </button>
          <button
            type="button"
            className={`body-gender-btn ${gender === 'female' ? 'active' : ''}`}
            onClick={() => setGender('female')}
          >
            Female
          </button>
        </div>
      </div>

      <div className="body-map-workspace">
        <div className="body-silhouette-box">
          <svg viewBox="390 25 244 525" className="body-map-svg">
            <image
              href={model.img.href}
              x={model.img.x}
              y={model.img.y}
              width={model.img.width}
              height={model.img.height}
            />
            {Object.entries(model.zones).map(([zoneId, pathData]) => {
              const zoneStatus = getZoneStatus(zoneId);
              const isSelected = zone === zoneId;
              const showHighlight = isSelected || zoneStatus !== 'normal';
              const colors = STATUS_STYLE[zoneStatus];

              return (
                <path
                  key={zoneId}
                  d={pathData}
                  role="button"
                  tabIndex={0}
                  aria-label={`Inspect ${zoneId} zone (${zoneStatus})`}
                  fill={showHighlight ? colors.fill : 'transparent'}
                  stroke={showHighlight ? colors.stroke : 'transparent'}
                  strokeWidth={isSelected ? 2 : 1.5}
                  onClick={() => {
                    setZone(zoneId);
                    setSelectedOrgan(null);
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      setZone(zoneId);
                      setSelectedOrgan(null);
                    }
                  }}
                  style={{ cursor: 'pointer', transition: 'fill 0.15s ease, stroke 0.15s ease' }}
                />
              );
            })}
          </svg>
        </div>

        <div className="body-panel-col">
          {!zone ? (
            <div className="body-empty-box">Select a body region on the model to inspect organs.</div>
          ) : (
            <div className="body-zone-panel">
              <div className="body-zone-panel-header">
                <div>
                  <span className="nasa-tag">{zone}</span>
                  <span className={`status-pill status-${getZoneStatus(zone)}`} style={{ marginLeft: 8 }}>
                    {STATUS_STYLE[getZoneStatus(zone)].icon} {STATUS_STYLE[getZoneStatus(zone)].label}
                  </span>
                </div>
                <button type="button" className="btn-cancel-light" onClick={() => setZone(null)}>
                  Close
                </button>
              </div>

              {organsInZone.length === 0 ? (
                <div className="body-empty-box">No internal organs mapped to this zone.</div>
              ) : (
                <div className="body-organs-list">
                  {organsInZone.map((organ) => {
                    const organStatus = getOrganStatus(organ);
                    const isOpen = selectedOrgan === organ.id;
                    return (
                      <div
                        key={organ.id}
                        className={`body-organ-card ${isOpen ? 'selected' : ''}`}
                        role="button"
                        tabIndex={0}
                        onClick={() => setSelectedOrgan(isOpen ? null : organ.id)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' || e.key === ' ') {
                            e.preventDefault();
                            setSelectedOrgan(isOpen ? null : organ.id);
                          }
                        }}
                      >
                        <div className="body-organ-row">
                          <img
                            src={organ.img}
                            alt={organ.name}
                            className={`body-organ-img ${organ.id === 'heart' ? 'heart-pulse' : ''}`}
                          />
                          <div className="body-organ-meta">
                            <strong>{organ.name}</strong>
                            <span className={`status-pill status-${organStatus}`}>
                              {STATUS_STYLE[organStatus].icon} {STATUS_STYLE[organStatus].label}
                            </span>
                          </div>
                        </div>

                        {isOpen && (
                          <div className="body-organ-metrics">
                            {organ.metrics.map((m) => {
                              const st = getThresholdStatus(m.key, vitals[m.key]);
                              return (
                                <div key={m.key} className="body-organ-metric-row">
                                  <span>
                                    {STATUS_STYLE[st].icon} {m.label}: <strong>{vitals[m.key]}</strong>{' '}
                                    {thresholdsData[m.key].unit}
                                  </span>
                                  <Link
                                    to={`/indicator/${m.routeId}`}
                                    className="body-detail-link"
                                    onClick={(e) => e.stopPropagation()}
                                  >
                                    Details →
                                  </Link>
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
