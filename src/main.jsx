import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
// PrimeReact theme + core — loaded once here so all nodes share the same instance
import 'primereact/resources/themes/lara-dark-cyan/theme.css';
import 'primereact/resources/primereact.min.css';
import 'primeicons/primeicons.css';
import './index.css'
import App from './App.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
