import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'

// Polyfill window.storage for browser (non-Electron) dev
if (!window.storage) {
  window.storage = {
    get:    async (key)        => { const v = localStorage.getItem(key); return v ? { key, value: v } : null },
    set:    async (key, value) => { localStorage.setItem(key, value); return { key, value } },
    delete: async (key)        => { localStorage.removeItem(key); return { key, deleted: true } },
    list:   async (prefix)     => {
      const keys = Object.keys(localStorage).filter(k => !prefix || k.startsWith(prefix))
      return { keys }
    },
  }
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode><App /></React.StrictMode>
)
