import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App.jsx'
import PhdCommandCenter from './PhdCommandCenter.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
    <PhdCommandCenter />
  </StrictMode>
)
