import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'

import { FRONTEND_URI, SERVER_URI } from './constants'

export default function App() {
  const [games, setGames] = useState([])
  const navigate = useNavigate()

  useEffect(() => {
    fetch(`${SERVER_URI}/games`)
      .then(res => res.json())
      .then(setGames)
      .catch(err => console.error('Failed to fetch games:', err))
  }, [])

  const createGame = () => {
    fetch(`${SERVER_URI}/create`, { method: 'POST' })
      .then(res => res.json())
      .then(({ link }) => navigate(link.replace(`${FRONTEND_URI}`, '')))
      .catch(err => console.error('Failed to create game:', err))
  }

  return (
    <div className='flex flex-col items-center justify-center min-h-screen bg-gray-100'>
      <h1 className='text-3xl font-bold mb-4'>Welcome to the Mafia game!</h1>
      <button
        className='bg-red-500 text-white p-3 rounded-lg mb-4 hover:bg-red-600 transition font-semibold'
        onClick={createGame}
      >
        Create Game
      </button>
      <h3 className='text-xl font-semibold mb-2'>Available Games:</h3>
      {games.length > 0 ? (
        <ul className='list-none space-y-2'>
          {games.map(({ gameId }) => (
            <li key={gameId}>
              <a
                href={`#/games/${gameId}`}
                className='text-red-500 hover:text-red-700'
              >
                Game: {gameId}
              </a>
            </li>
          ))}
        </ul>
      ) : (
        <p className='text-gray-500'>No games yet</p>
      )}
    </div>
  )
}
