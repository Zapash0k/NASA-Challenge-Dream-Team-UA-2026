import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import { validateData } from './core/validate';
import { seedIfEmpty } from './data/seed';
import App from './App.tsx';

if (import.meta.env.DEV) {
  const problems = validateData();
  if (problems.length > 0) console.warn('Data problems:', problems);
}

seedIfEmpty();

createRoot(document.getElementById('root')!).render(<StrictMode><App /></StrictMode>);
