import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'

// Import both CSS files - the active one will be determined by theme context
import './index.css'
import './index.bootstrap.css'

// Log which theme is active
const currentTheme = localStorage.getItem('bycodez_theme') || 'tailwind';
console.log('🎨 Active theme:', currentTheme);

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)


