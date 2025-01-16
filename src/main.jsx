import { createRoot } from 'react-dom/client'
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom'

import './index.css'
import App from './App'
import Game from './Game'

createRoot(document.getElementById('root')).render(
  <HashRouter>
    <Routes>
      <Route
        path='/'
        element={<App />}
      />
      <Route
        path='/games/:gameId'
        element={<Game />}
      />
      <Route
        path='/games'
        element={<Navigate to='/' />}
      />
    </Routes>
  </HashRouter>
)
