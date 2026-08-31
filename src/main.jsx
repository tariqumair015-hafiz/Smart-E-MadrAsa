import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import { SettingsProvider } from './contexts/SettingsContext.jsx'

// 🌟 VIP FIX: Download Provider ko yahan bulaya hai
import { DownloadProvider } from './DownloadContext.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <SettingsProvider>
      {/* 🌟 VIP FIX: App ko Download Provider ke andar pehna diya */}
      <DownloadProvider language="ur">
        <App />
      </DownloadProvider>
    </SettingsProvider>
  </StrictMode>,
)