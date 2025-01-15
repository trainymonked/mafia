import { createRoot } from 'react-dom/client'
import { HashRouter, Routes, Route } from 'react-router-dom'

import './index.css'
import App from './App'
import Join from './Join'

createRoot(document.getElementById('root')).render(
  <HashRouter>
    <Routes>
      <Route
        path='/'
        element={<App />}
      />
      <Route
        path='/games/:gameId'
        element={<Join />}
      />
    </Routes>
  </HashRouter>
)
