import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import 'sweetalert2/dist/sweetalert2.min.css'
import './lib/swal-theme.css'
import './index.css'
import App from './App.tsx'
import { clearLegacyAppData } from './lib/storage'

clearLegacyAppData()

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
