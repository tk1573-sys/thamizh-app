import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { registerSW } from 'virtual:pwa-register'
import App from './App.jsx'
import './career-coach.js'

// Register the PWA service worker so the installed mobile app can cache the
// application shell and receive updated deployments automatically.
registerSW({
  immediate: true,
  onOfflineReady() {
    window.dispatchEvent(new CustomEvent('life-cmd-offline-ready'))
  },
  onNeedRefresh() {
    window.dispatchEvent(new CustomEvent('life-cmd-update-ready'))
  },
})

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>
)
