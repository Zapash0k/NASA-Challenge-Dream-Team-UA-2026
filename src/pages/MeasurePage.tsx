import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { type DayValues } from '../core/history';
import { logManualDay } from '../core/missionControler';

export const VITALS_STORAGE_KEY = 'healthySpace_vitals';
//export const VITALS_HISTORY_KEY = 'healthySpace_history';     //тут доробити історію якщо буде час через додаток до функції handleSubmit()

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

export default function MeasurePage() {
  const navigate = useNavigate();

  const [heartRate, setHeartRate] = useState('');
  const [bpSystolic, setBpSystolic] = useState('');
  const [bpDiastolic, setBpDiastolic] = useState('');
  const [bodyTemp, setBodyTemp] = useState('');
  const [bloodGlucose, setBloodGlucose] = useState('');
  const [sleepHours, setSleepHours] = useState('');
  const [sleepQuality, setSleepQuality] = useState(4);
  const [moodScore, setMoodScore] = useState(4);
  const [notes, setNotes] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState(false);
  const [savedDay, setSavedDay] = useState<number | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    // Читаємо попередні значення або дефолтні, якщо заповнили лише частину полів
    const prevRaw = localStorage.getItem(VITALS_STORAGE_KEY);
    const prev: Partial<StoredVitals> = prevRaw ? JSON.parse(prevRaw) : {};

    const payload: StoredVitals = {
      heart_rate: heartRate !== '' ? Number(heartRate) : (prev.heart_rate ?? 72),
      bp_systolic: bpSystolic !== '' ? Number(bpSystolic) : (prev.bp_systolic ?? 118),
      bp_diastolic: bpDiastolic !== '' ? Number(bpDiastolic) : (prev.bp_diastolic ?? 76),
      body_temperature: bodyTemp !== '' ? Number(bodyTemp) : (prev.body_temperature ?? 36.6),
      blood_glucose: bloodGlucose !== '' ? Number(bloodGlucose) : (prev.blood_glucose ?? 92),
      sleep_hours: sleepHours !== '' ? Number(sleepHours) : (prev.sleep_hours ?? 7.5),
      sleep_quality: sleepQuality,
      mood_score: moodScore,
      notes: notes.trim(),
      updatedAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    // Базова перевірка допустимих меж (validRange із thresholds.json)
    if (payload.heart_rate < 20 || payload.heart_rate > 250) {
      setErrorMsg('Heart rate must be between 20 and 250 bpm.');
      return;
    }
    if (payload.bp_systolic < 60 || payload.bp_systolic > 260) {
      setErrorMsg('Systolic pressure must be between 60 and 260 mmHg.');
      return;
    }
    if (payload.bp_diastolic < 30 || payload.bp_diastolic > 160) {
      setErrorMsg('Diastolic pressure must be between 30 and 160 mmHg.');
      return;
    }
    if (payload.body_temperature < 30 || payload.body_temperature > 43) {
      setErrorMsg('Body temperature must be between 30 and 43 °C.');
      return;
    }
    if (payload.blood_glucose < 20 || payload.blood_glucose > 600) {
      setErrorMsg('Blood glucose must be between 20 and 600 mg/dL.');
      return;
    }
    if (payload.sleep_hours < 0 || payload.sleep_hours > 16) {
      setErrorMsg('Sleep duration must be between 0 and 16 hours.');
      return;
    }

    // Новий день в історії: кожне збереження ДОДАЄ запис, а не перезаписує попередній.
    // Порожні поля не записуються (немає точки на графіку), слайдер настрою є завжди.
    const toNum = (s: string) => (s.trim() === '' ? undefined : Number(s));
    const dayValues: DayValues = {
      heart_rate: toNum(heartRate),
      bp_systolic: toNum(bpSystolic),
      bp_diastolic: toNum(bpDiastolic),
      body_temperature: toNum(bodyTemp),
      blood_glucose: toNum(bloodGlucose),
      sleep_hours: toNum(sleepHours),
      mood_score: moodScore,
    };
    setSavedDay(logManualDay(dayValues, payload));

    // Лишаємо «останній стан» для Dashboard / Body Map, які читають цей ключ.
    localStorage.setItem(VITALS_STORAGE_KEY, JSON.stringify(payload));
    setSuccessMsg(true);

    setTimeout(() => {
      navigate('/');
    }, 900);
  };

  return (
    <div className="measure-layout">
      <div className="nasa-white-card">
        <div className="card-header-block">
          <span className="nasa-tag">MANUAL TELEMETRY CHECK</span>
          <h2>Record Astronaut Vitals</h2>
          <p className="card-subtitle">
            Enter current biomedical readings according to mission flight protocol.
          </p>
        </div>

        {errorMsg && (
          <div className="alert-item status-critical" style={{ marginBottom: '1rem' }}>
            ⚠ {errorMsg}
          </div>
        )}

        {successMsg ? (
          <div className="nasa-success-box">
            ✓ Day {savedDay} logged &amp; transmitted to Orbital Core. Returning to Console...
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="nasa-form">
            <div className="vitals-grid-2x2">
              <div className="field-group">
                <label>Heart rate</label>
                <div className="input-with-unit">
                  <input
                    type="number"
                    min={20}
                    max={250}
                    placeholder="72"
                    value={heartRate}
                    onChange={(e) => setHeartRate(e.target.value)}
                  />
                  <span className="unit-label">bpm</span>
                </div>
              </div>

              <div className="field-group">
                <label>Blood Pressure</label>
                <div className="input-with-unit">
                  <input
                    type="number"
                    min={60}
                    max={260}
                    placeholder="120"
                    className="input-compact"
                    value={bpSystolic}
                    onChange={(e) => setBpSystolic(e.target.value)}
                  />
                  <span className="slash-sep">/</span>
                  <input
                    type="number"
                    min={30}
                    max={160}
                    placeholder="80"
                    className="input-compact"
                    value={bpDiastolic}
                    onChange={(e) => setBpDiastolic(e.target.value)}
                  />
                  <span className="unit-label">mmHg</span>
                </div>
              </div>

              <div className="field-group">
                <label>Body temperature</label>
                <div className="input-with-unit">
                  <input
                    type="number"
                    step="0.1"
                    min={30}
                    max={43}
                    placeholder="36.6"
                    value={bodyTemp}
                    onChange={(e) => setBodyTemp(e.target.value)}
                  />
                  <span className="unit-label">°C</span>
                </div>
              </div>

              <div className="field-group">
                <label>Blood glucose</label>
                <div className="input-with-unit">
                  <input
                    type="number"
                    min={20}
                    max={600}
                    placeholder="92"
                    value={bloodGlucose}
                    onChange={(e) => setBloodGlucose(e.target.value)}
                  />
                  <span className="unit-label">mg/dL</span>
                </div>
              </div>
            </div>

            <hr className="nasa-red-divider" />

            <div className="bottom-split-grid">
              <div className="sliders-column">
                <div className="slider-block">
                  <div className="slider-top-row">
                    <label>Sleep</label>
                    <span className="scale-badge">{sleepQuality} / 5</span>
                  </div>
                  <input
                    type="range"
                    min={1}
                    max={5}
                    step={1}
                    value={sleepQuality}
                    onChange={(e) => setSleepQuality(Number(e.target.value))}
                    className="nasa-slider"
                  />
                  <span className="tiny-hint">quality</span>

                  <div className="hours-subinput">
                    <span className="tiny-hint">hours</span>
                    <input
                      type="number"
                      step="0.5"
                      min={0}
                      max={16}
                      placeholder="7.5"
                      value={sleepHours}
                      onChange={(e) => setSleepHours(e.target.value)}
                    />
                  </div>
                </div>

                <div className="slider-block">
                  <div className="slider-top-row">
                    <label>Mood</label>
                    <span className="scale-badge">{moodScore} / 5</span>
                  </div>
                  <input
                    type="range"
                    min={1}
                    max={5}
                    step={1}
                    value={moodScore}
                    onChange={(e) => setMoodScore(Number(e.target.value))}
                    className="nasa-slider"
                  />
                  <span className="tiny-hint">quality</span>
                </div>
              </div>

              <div className="notes-column">
                <div className="field-group">
                  <label>Symptoms / Activity</label>
                  <textarea
                    rows={3}
                    placeholder="e.g. Post-EVA fatigue, normal hydration..."
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                  />
                </div>

                <div className="submit-row">
                  <button
                    type="button"
                    onClick={() => navigate('/')}
                    className="btn-cancel-light"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="btn-nasa-circle"
                    title="Save & Transmit"
                  >
                    →
                  </button>
                </div>
              </div>
            </div>
          </form>
        )}
      </div>

      <div className="measure-side-column">
        <div className="nasa-white-card">
          <span className="nasa-tag">MEASUREMENT GUIDE</span>
          <h3>Standard Protocol</h3>
          <div className="guide-placeholder">
            <p><strong>1. Rest 5 min</strong> before taking Heart Rate &amp; Blood Pressure.</p>
            <p><strong>2. Cuff placement:</strong> Keep arm at heart level in microgravity.</p>
            <p><strong>3. Fasted glucose:</strong> Log pre-meal values when possible.</p>
          </div>
        </div>

        <div className="nasa-glass-note">
          <span className="info-icon">i</span>
          <p>
            Ensure sensor calibration before submitting. Out-of-range values will automatically trigger an Attention or Critical alert on the Console.
          </p>
        </div>
      </div>
    </div>
  );
}