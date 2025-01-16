import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'

import { SERVER_URI } from './constants'

export default function App() {
  const [games, setGames] = useState([])
  const navigate = useNavigate()
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    const fetchGames = async () => {
      try {
        setIsLoading(true)
        setError(null)
        const response = await fetch(`${SERVER_URI}/games`)
        if (!response.ok) {
          throw new Error('Failed to fetch games')
        }
        const games = await response.json()
        setGames(games)
      } catch (err) {
        setError('Could not connect to the server. Please try again later')
      } finally {
        setIsLoading(false)
      }
    }

    fetchGames()
  }, [])

  const handleCreateGame = async () => {
    try {
      setIsLoading(true)
      setError(null)
      const response = await fetch(`${SERVER_URI}/create`, { method: 'POST' })
      if (!response.ok) {
        throw new Error('Failed to create a game')
      }
      const data = await response.json()
      navigate(`/games/${data.gameId}`)
    } catch (err) {
      setError('Could not create a game. Please try again later')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className='flex flex-col items-center justify-center min-h-screen bg-gray-100'>
      <h1 className='text-4xl font-bold mb-4'>Welcome to the Mafia game!</h1>

      {isLoading && <div className='text-gray-500 text-xl'>Loading...</div>}

      {error && <div className='text-red-500 text-xl font-semibold'>{error}</div>}

      {isLoading || error ? null : (
        <>
          <button
            className='bg-red-500 text-white p-3 rounded-lg mb-4 hover:bg-red-600 transition font-semibold'
            onClick={handleCreateGame}
          >
            Create Game
          </button>
          <h3 className='text-xl font-semibold mb-2'>Available Games:</h3>
          {games.length > 0 ? (
            <ul className='list-none space-y-2'>
              {games.map(({ gameId, players }) => (
                <li key={gameId}>
                  <a
                    href={`#/games/${gameId}`}
                    className='text-red-500 hover:text-red-700'
                  >
                    Game: {gameId} | Players: {players.length}
                  </a>
                </li>
              ))}
            </ul>
          ) : (
            <p className='text-gray-500'>No games yet</p>
          )}
        </>
      )}
    </div>
  )
}
