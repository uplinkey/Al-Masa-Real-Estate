import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { initializeGlobalArabicDigitConverter } from './utils/numberUtils';

// Enforce standard English numbers: automatically convert any Arabic-Indic digits typed or pasted
initializeGlobalArabicDigitConverter();

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);

