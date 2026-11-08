import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './theme'          // sets <html data-theme> before the first paint
import './index.css'
import App from './App.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
