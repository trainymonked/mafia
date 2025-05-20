import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'

import { SERVER_URI } from './constants'

export default function App() {
  const [games, setGames] = useState([])
  const navigate = useNavigate()
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(null)

  const [showCreateGameForm, setShowCreateGameForm] = useState(false)
  const [newGameName, setNewGameName] = useState('')
  const [isNewGamePrivate, setIsNewGamePrivate] = useState(false)
  const [newGamePassword, setNewGamePassword] = useState('')
  const [createGameError, setCreateGameError] = useState(null)

  useEffect(() => {
    const fetchGames = async () => {
      try {
        setIsLoading(true)
        setError(null)
        const response = await fetch(`${SERVER_URI}/games`)
        if (!response.ok) {
          const errorData = await response.json().catch(() => ({ message: 'Failed to fetch games' }))
          throw new Error(errorData.message || 'Failed to fetch games')
        }
        const gamesData = await response.json()
        setGames(gamesData)
      } catch (err) {
        setError(err.message || 'Could not connect to the server. Please try again later')
      } finally {
        setIsLoading(false)
      }
    }

    fetchGames()
  }, [])

  const handleInitiateCreateGame = () => {
    setShowCreateGameForm(true)
    setNewGameName('')
    setIsNewGamePrivate(false)
    setNewGamePassword('')
    setCreateGameError(null)
  }

  const handleCreateGameSubmit = async e => {
    e.preventDefault()
    if (isNewGamePrivate && (!newGamePassword || newGamePassword.trim() === '')) {
      setCreateGameError('Password is required for a private game.')
      return
    }

    try {
      setIsLoading(true)
      setCreateGameError(null)

      const gameData = {
        name: newGameName.trim(),
        isPrivate: isNewGamePrivate,
        password: isNewGamePrivate ? newGamePassword.trim() : null,
      }

      const response = await fetch(`${SERVER_URI}/create`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(gameData),
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Failed to create a game' }))
        throw new Error(errorData.error || 'Failed to create a game')
      }
      const data = await response.json()
      setShowCreateGameForm(false)
      navigate(`/games/${data.gameId}`)
    } catch (err) {
      setCreateGameError(err.message || 'Could not create a game. Please try again later')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className='flex flex-col items-center justify-start min-h-screen bg-gray-100'>
      <h1 className='text-4xl font-bold mb-8 mt-40'>Welcome to the Mafia game!</h1>

      {isLoading && <div className='text-gray-500 text-xl'>Loading...</div>}

      {error && <div className='text-red-500 text-xl font-semibold'>{error}</div>}

      {!isLoading && !error && !showCreateGameForm && (
        <button
          className='bg-red-500 text-white p-3 rounded-lg mb-6 hover:bg-red-600 transition font-semibold shadow-md'
          onClick={handleInitiateCreateGame}
        >
          Create New Game
        </button>
      )}

      {showCreateGameForm && (
        <div className='w-full max-w-md bg-white p-6 rounded-lg shadow-xl mb-6'>
          <h2 className='text-2xl font-semibold mb-4 text-gray-700'>Create a New Game</h2>
          <form onSubmit={handleCreateGameSubmit}>
            <div className='mb-4'>
              <label
                htmlFor='gameName'
                className='block text-sm font-medium text-gray-700'
              >
                Game Name (optional):
              </label>
              <input
                type='text'
                id='gameName'
                value={newGameName}
                onChange={e => setNewGameName(e.target.value)}
                className='mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-red-500 focus:border-red-500 sm:text-sm'
                placeholder='Game Name'
              />
            </div>
            <div className='mb-4'>
              <label className='flex items-center'>
                <input
                  type='checkbox'
                  checked={isNewGamePrivate}
                  onChange={e => setIsNewGamePrivate(e.target.checked)}
                  className='h-4 w-4 text-red-600 border-gray-300 rounded focus:ring-red-500'
                />
                <span className='ml-2 text-sm text-gray-700'>Private Game?</span>
              </label>
            </div>
            {isNewGamePrivate && (
              <div className='mb-4'>
                <label
                  htmlFor='gamePassword'
                  className='block text-sm font-medium text-gray-700'
                >
                  Password:
                </label>
                <input
                  type='password'
                  id='gamePassword'
                  value={newGamePassword}
                  onChange={e => setNewGamePassword(e.target.value)}
                  className='mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-red-500 focus:border-red-500 sm:text-sm'
                  required={isNewGamePrivate}
                />
              </div>
            )}
            {createGameError && <div className='text-red-500 text-sm mb-3'>{createGameError}</div>}
            <div className='flex items-center justify-between'>
              <button
                type='submit'
                className='bg-red-500 hover:bg-red-600 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline'
                disabled={isLoading}
              >
                {isLoading ? 'Creating...' : 'Create Game'}
              </button>
              <button
                type='button'
                onClick={() => setShowCreateGameForm(false)}
                className='text-gray-600 hover:text-gray-800 font-medium py-2 px-4 rounded'
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {!isLoading && !error && !showCreateGameForm && (
        <div className='w-full max-w-md'>
          <h3 className='text-xl font-semibold mb-3 text-gray-700 text-center'>Available Games:</h3>
          {games.length > 0 ? (
            <ul className='list-none bg-white p-4 rounded-lg shadow-md space-y-3'>
              {games.map(game => (
                <li
                  key={game.id}
                  className='border-b border-gray-200 pb-2 last:border-b-0'
                >
                  <div className='flex justify-between items-center'>
                    <div>
                      <span className='font-medium text-gray-800'>{game.name}</span>
                      {game.is_private && (
                        <span className='ml-2 text-xs bg-yellow-200 text-yellow-800 px-2 py-0.5 rounded-full'>
                          Private 🔒
                        </span>
                      )}
                      <p className='text-sm text-gray-500'>Players: {game.player_count} | Connected: {game.connected_count}</p>
                    </div>
                    <button
                      onClick={() => navigate(`/games/${game.id}`)}
                      className='text-red-500 hover:text-red-700 font-semibold py-1 px-3 rounded border border-red-300 hover:bg-red-50 transition'
                    >
                      Join
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <p className='text-gray-500 text-center'>No active games yet.</p>
          )}
        </div>
      )}
    </div>
  )
}
