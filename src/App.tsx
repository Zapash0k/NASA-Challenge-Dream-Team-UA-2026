import { BrowserRouter, Routes, Route, Link } from 'react-router-dom';
import Navbar from './components/Navbar';
import BodyMapPage from './pages/BodyMapPage';
import MeasurePage from './pages/MeasurePage';
import IndicatorPage from './pages/IndicatorPage';
import thresholdsData from './content/thresholds.json';
import MissionPage from './pages/MissionPage';
import { useMission } from './core/missionControler';

type ZoneStatus = 'normal' | 'attention' | 'critical';

/*function getStatus(val: number, normalMin: number, normalMax: number, critMin: number, critMax: number): ZoneStatus {
  if (val < critMin || val > critMax) return 'critical';
  if (val < normalMin || val > normalMax) return 'attention';
  return 'normal';
}*/

const STATUS_LABELS: Record<ZoneStatus, string> = {
  normal: 'Normal state',
  attention: 'Attention',
  critical: 'Critical state',
};

function Dashboard() {
    const { vitals } = useMission();

  const getThresholdStatus = (key: keyof typeof thresholdsData, value: number): ZoneStatus => {
    const zones = thresholdsData[key]?.zones ?? [];
    let matched: ZoneStatus = 'attention';
    for (const zone of zones) {
      const aboveMin = !('min' in zone) || zone.min === undefined || value >= zone.min;
      const belowMax = !('max' in zone) || zone.max === undefined || value <= zone.max;
      if (aboveMin && belowMax) {
        matched = zone.status as ZoneStatus;
      }
    }
    return matched;
  };

  const hrStatus = getThresholdStatus('heart_rate', vitals.heart_rate);
  const tempStatus = getThresholdStatus('body_temperature', vitals.body_temperature);
  const sysStatus = getThresholdStatus('bp_systolic', vitals.bp_systolic);
  const diaStatus = getThresholdStatus('bp_diastolic', vitals.bp_diastolic);
  const bpStatus: ZoneStatus =
    sysStatus === 'critical' || diaStatus === 'critical'
      ? 'critical'
      : sysStatus === 'attention' || diaStatus === 'attention'
        ? 'attention'
        : 'normal';
  const glucoseStatus = getThresholdStatus('blood_glucose', vitals.blood_glucose);
  const sleepStatus = getThresholdStatus('sleep_hours', vitals.sleep_hours);
  const moodStatus = getThresholdStatus('mood_score', vitals.mood_score);

  const alerts: { label: string; status: ZoneStatus; detail: string }[] = [];
  if (hrStatus !== 'normal') alerts.push({ label: 'Heart Rate', status: hrStatus, detail: `${vitals.heart_rate} bpm` });
  if (bpStatus !== 'normal') alerts.push({ label: 'Blood Pressure', status: bpStatus, detail: `${vitals.bp_systolic}/${vitals.bp_diastolic} mmHg` });
  if (tempStatus !== 'normal') alerts.push({ label: 'Body Temperature', status: tempStatus, detail: `${vitals.body_temperature} °C` });
  if (glucoseStatus !== 'normal') alerts.push({ label: 'Blood Glucose', status: glucoseStatus, detail: `${vitals.blood_glucose} mg/dL` });
  if (sleepStatus !== 'normal') alerts.push({ label: 'Sleep Duration', status: sleepStatus, detail: `${vitals.sleep_hours} hours` });
  if (moodStatus !== 'normal') alerts.push({ label: 'Mood Score', status: moodStatus, detail: `${vitals.mood_score} / 5` });

  return (
    <div className="dashboard-layout">
      {/* ЛІВА КОЛОНКА: 6 карток показників із кольоровими зонами */}
      <div className="vitals-grid-6">
        <Link to="/indicator/heart_rate" className="vital-card">
          <div className="vital-card-top">
            <h2 className="vital-card-title">Heart Rate</h2>
            <span className={`status-pill status-${hrStatus}`}>{STATUS_LABELS[hrStatus]}</span>
          </div>
          <div className="vital-value-row">
            <span className="vital-number">{vitals.heart_rate}</span>
            <span className="vital-unit">bpm</span>
          </div>
          <div className="vital-range-hint">Normal: 60–100 bpm</div>
        </Link>

        <Link to="/indicator/bp_systolic" className="vital-card">
          <div className="vital-card-top">
            <h2 className="vital-card-title">Blood Pressure</h2>
            <span className={`status-pill status-${bpStatus}`}>{STATUS_LABELS[bpStatus]}</span>
          </div>
          <div className="vital-value-row">
            <span className="vital-number">{vitals.bp_systolic}/{vitals.bp_diastolic}</span>
            <span className="vital-unit">mmHg</span>
          </div>
          <div className="vital-range-hint">Normal: 90–119 / 60–79 mmHg</div>
        </Link>

        <Link to="/indicator/body_temperature" className="vital-card">
          <div className="vital-card-top">
            <h2 className="vital-card-title">Body Temperature</h2>
            <span className={`status-pill status-${tempStatus}`}>{STATUS_LABELS[tempStatus]}</span>
          </div>
          <div className="vital-value-row">
            <span className="vital-number">{vitals.body_temperature}</span>
            <span className="vital-unit">°C</span>
          </div>
          <div className="vital-range-hint">Normal: 36.1–37.2 °C</div>
        </Link>

        <Link to="/indicator/blood_glucose" className="vital-card">
          <div className="vital-card-top">
            <h2 className="vital-card-title">Blood Glucose</h2>
            <span className={`status-pill status-${glucoseStatus}`}>{STATUS_LABELS[glucoseStatus]}</span>
          </div>
          <div className="vital-value-row">
            <span className="vital-number">{vitals.blood_glucose}</span>
            <span className="vital-unit">mg/dL</span>
          </div>
          <div className="vital-range-hint">Normal: 70–99 mg/dL</div>
        </Link>

        <Link to="/indicator/sleep_hours" className="vital-card">
          <div className="vital-card-top">
            <h2 className="vital-card-title">Sleep Duration</h2>
            <span className={`status-pill status-${sleepStatus}`}>{STATUS_LABELS[sleepStatus]}</span>
          </div>
          <div className="vital-value-row">
            <span className="vital-number">{vitals.sleep_hours}</span>
            <span className="vital-unit">hours</span>
          </div>
          <div className="vital-range-hint">Normal: 7–10 hours (Quality {vitals.sleep_quality}/5)</div>
        </Link>

        <Link to="/indicator/mood_score" className="vital-card">
          <div className="vital-card-top">
            <h2 className="vital-card-title">Mood &amp; Stress</h2>
            <span className={`status-pill status-${moodStatus}`}>{STATUS_LABELS[moodStatus]}</span>
          </div>
          <div className="vital-value-row">
            <span className="vital-number">{vitals.mood_score}</span>
            <span className="vital-unit">/ 5</span>
          </div>
          <div className="vital-range-hint">Normal: 3–5 score</div>
        </Link>
      </div>

      {/* ПРАВА КОЛОНКА: Зона Alert-ів + Контейнер під 2D-модель тіла */}
      <div className="dashboard-right-col">
        <div className="nasa-white-card">
          <span className="nasa-tag">SYSTEM ALERTS</span>
          <h3>Telemetry Status</h3>
          {alerts.length === 0 ? (
            <div className="alert-item status-normal">
              ✓ All 6 biomedical systems nominal (Last sync: {vitals.updatedAt})
            </div>
          ) : (
            alerts.map((a, idx) => (
              <div key={idx} className={`alert-item status-${a.status}`}>
                ⚠ {a.label}: {a.detail} — {STATUS_LABELS[a.status]}
              </div>
            ))
          )}
        </div>

        <div className="nasa-white-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span className="nasa-tag">BIOMETRIC MAP</span>
            <Link to="/body" className="unit-label" style={{ textDecoration: 'underline' }}>
              Full Body View →
            </Link>
          </div>
          <h3>Astronaut 2D Body Model</h3>
          {/* Контейнер для інтеграції 2D-фігури тіла іншим учасником */}
          <Link to="/body" id="body-map-widget-slot" className="body-placeholder-box">
            <svg viewBox="390 25 244 525" style={{ width: '96px', height: 'auto' }}>
              <image
                href="/body-silhouette-male.svg"
                x="390"
                y="25"
                width="244"
                height="525"
              />
              {(sleepStatus !== 'normal' || moodStatus !== 'normal') && (
                <circle
                  cx="512"
                  cy="78"
                  r="24"
                  fill={
                    sleepStatus === 'critical' || moodStatus === 'critical'
                      ? 'rgba(239, 68, 68, 0.35)'
                      : 'rgba(245, 158, 11, 0.35)'
                  }
                  stroke={
                    sleepStatus === 'critical' || moodStatus === 'critical'
                      ? '#ef4444'
                      : '#f59e0b'
                  }
                  strokeWidth="2"
                />
              )}
              {(hrStatus !== 'normal' || bpStatus !== 'normal' || tempStatus !== 'normal' || glucoseStatus !== 'normal') && (
                <rect
                  x="472"
                  y="138"
                  width="80"
                  height="110"
                  rx="16"
                  fill={
                    hrStatus === 'critical' || bpStatus === 'critical' || tempStatus === 'critical' || glucoseStatus === 'critical'
                      ? 'rgba(239, 68, 68, 0.32)'
                      : 'rgba(245, 158, 11, 0.32)'
                  }
                  stroke={
                    hrStatus === 'critical' || bpStatus === 'critical' || tempStatus === 'critical' || glucoseStatus === 'critical'
                      ? '#ef4444'
                      : '#f59e0b'
                  }
                  strokeWidth="2"
                />
              )}
            </svg>
            <span style={{ marginTop: '0.4rem', fontSize: '0.8rem' }}>
              Click to inspect organ systems &amp; localized telemetry
            </span>
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <div className="min-h-screen text-slate-100 p-6 font-sans">
        <Navbar />
        <div className="max-w-6xl mx-auto">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/body" element={<BodyMapPage />} />
            <Route path="/measure" element={<MeasurePage />} />
            <Route path="/indicator/:id" element={<IndicatorPage />} />
            <Route path="/mission" element={<MissionPage />} />
          </Routes>
          <footer>
            Dream Team UA // OrbitWell Orbital Telemetry Monitoring Interface
          </footer>
        </div>
      </div>
    </BrowserRouter>
  );
}