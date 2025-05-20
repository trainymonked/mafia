import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import socket from './socket'
import { SERVER_URI } from './constants'

export default function Game() {
  const { gameId } = useParams()
  const navigate = useNavigate()

  const [game, setGame] = useState(null)
  const [player, setPlayer] = useState(null)
  const [players, setPlayers] = useState([])
  const [token, setToken] = useState(localStorage.getItem(`game-token-${gameId}`) || '')

  const [inputName, setInputName] = useState('')
  const [inputPassword, setInputPassword] = useState('')

  const [error, setError] = useState(null)
  const [isLoading, setIsLoading] = useState(true)

  const [showPasswordPrompt, setShowPasswordPrompt] = useState(false)
  const [showNamePrompt, setShowNamePrompt] = useState(false)

  useEffect(() => {
    localStorage.setItem(`game-token-${gameId}`, token)
  }, [token, gameId])

  useEffect(() => {
    const onDisconnect = reason => setError(`Disconnected: ${reason}.`)

    const resetPromptsAndError = () => {
      setShowPasswordPrompt(false)
      setShowNamePrompt(false)
      setError(null)
    }

    const onPlayersUpdate = updatedPlayers => {
      setPlayers(updatedPlayers)
      const currentPlayer = updatedPlayers.find(p => p.socket_id === socket.id || (token && p.token === token))
      if (currentPlayer) {
        setPlayer(currentPlayer)
        resetPromptsAndError()
        setIsLoading(false)
      }
    }

    const onSetToken = newToken => {
      setToken(newToken)
      if (newToken) {
        resetPromptsAndError()
      } else if (player) {
        setPlayer(null)
      }
    }

    const onGameNotFound = () => {
      setError('Game not found.')
      setIsLoading(false)
      setShowPasswordPrompt(false)
      setShowNamePrompt(false)
    }
    const onPasswordRequired = () => {
      setError(null)
      setShowPasswordPrompt(true)
      setShowNamePrompt(false)
      setIsLoading(false)
    }
    const onInvalidPassword = () => {
      setError('Invalid password.')
      setInputPassword('')
      setShowPasswordPrompt(true)
      setShowNamePrompt(false)
      setIsLoading(false)
    }
    const onNameRequired = () => {
      setError(null)
      setShowNamePrompt(true)
      setShowPasswordPrompt(false)
      setIsLoading(false)
    }
    const onNameTaken = () => {
      setError('Name taken.')
      setInputName('')
      setShowNamePrompt(true)
      setShowPasswordPrompt(false)
      setIsLoading(false)
    }
    const onInvalidToken = () => {
      setError('Invalid session.')
      setToken('')
      setIsLoading(false)
    }
    const onError = msg => {
      setError(msg || 'Server error.')
      setIsLoading(false)
      setShowPasswordPrompt(false)
      setShowNamePrompt(false)
    }

    if (!socket.connected) socket.connect()
    socket.on('disconnect', onDisconnect)
    socket.on('players-update', onPlayersUpdate)
    socket.on('set-token', onSetToken)
    socket.on('game-not-found', onGameNotFound)
    socket.on('password-required', onPasswordRequired)
    socket.on('invalid-password', onInvalidPassword)
    socket.on('name-required', onNameRequired)
    socket.on('name-taken', onNameTaken)
    socket.on('invalid-token', onInvalidToken)
    socket.on('error', onError)

    return () => {
      socket.off('disconnect', onDisconnect)
      socket.off('players-update', onPlayersUpdate)
      socket.off('set-token', onSetToken)
      socket.off('game-not-found', onGameNotFound)
      socket.off('password-required', onPasswordRequired)
      socket.off('invalid-password', onInvalidPassword)
      socket.off('name-required', onNameRequired)
      socket.off('name-taken', onNameTaken)
      socket.off('invalid-token', onInvalidToken)
      socket.off('error', onError)
    }
  }, [token, player])

  useEffect(() => {
    if (!gameId) {
      setError('No Game ID.')
      setIsLoading(false)
      return
    }
    setIsLoading(true)
    fetch(`${SERVER_URI}/games/${gameId}`)
      .then(res => {
        if (!res.ok) throw new Error(res.status === 404 ? 'Game not found' : 'Failed to fetch game')
        return res.json()
      })
      .then(data => {
        setGame(data)
      })
      .catch(err => {
        setError(err.message)
      })
      .finally(() => {
        setIsLoading(false)
      })
  }, [gameId])

  useEffect(() => {
    if (!game || !socket.connected) return
    if (player) {
      setShowPasswordPrompt(false)
      setShowNamePrompt(false)
      setIsLoading(false)
      return
    }

    if (token) {
      setIsLoading(true)
      setError(null)
      socket.emit('join-game', { gameId: game.id, token })
    } else if (game.is_private) {
      setShowPasswordPrompt(true)
      setShowNamePrompt(false)
      setIsLoading(false)
    } else {
      setShowNamePrompt(true)
      setShowPasswordPrompt(false)
      setIsLoading(false)
    }
  }, [game, token, player])

  const handlePasswordSubmit = () => {
    if (!game) return
    const password = inputPassword.trim()

    const payload = { gameId: game.id, password: password }
    if (token) {
      payload.token = token
    }

    setIsLoading(true)
    setError(null)
    socket.emit('join-game', payload)
  }

  const handleNameSubmit = () => {
    if (!game) return
    const name = inputName.trim()

    const payload = { gameId: game.id, playerName: name }
    if (game.is_private) {
      const password = inputPassword.trim()
      if (password) {
        payload.password = password
      }
    }
    setIsLoading(true)
    setError(null)
    socket.emit('join-game', payload)
  }

  if (isLoading && !error && !showPasswordPrompt && !showNamePrompt && !player) {
    return (
      <div className='text-gray-500 text-xl p-4 text-center min-h-screen flex items-center justify-center'>
        Loading...
      </div>
    )
  }

  if (!game && !isLoading) {
    return (
      <div className='flex flex-col items-center justify-center min-h-screen bg-gray-100 p-4'>
        <p className='text-red-500 font-semibold text-xl mb-4'>{error || 'Could not load game.'}</p>
        <button
          onClick={() => navigate('/')}
          className='text-blue-600 hover:underline'
        >
          Home
        </button>
      </div>
    )
  }

  if (showPasswordPrompt && !player && game?.is_private) {
    return (
      <div className='flex flex-col items-center justify-center min-h-screen bg-gray-100 p-4'>
        <h2 className='text-3xl mb-4'>{game.name}</h2>
        <div className='text-center mb-6 bg-white p-6 rounded-lg shadow-md w-full max-w-sm'>
          <h3 className='text-xl mb-3'>Enter Password:</h3>
          <input
            type='password'
            value={inputPassword}
            onChange={e => setInputPassword(e.target.value)}
            className='border border-gray-300 rounded p-2 mb-3 w-full'
            placeholder='Game Password'
            onKeyDown={e => e.key === 'Enter' && handlePasswordSubmit()}
          />
          {error && <p className='text-red-500 text-sm mb-3'>{error}</p>}
          <button
            onClick={handlePasswordSubmit}
            disabled={isLoading}
            className='bg-red-500 text-white px-6 py-2 rounded hover:bg-red-600 w-full disabled:opacity-50'
          >
            {isLoading ? 'Checking...' : 'Submit Password'}
          </button>
        </div>
        <button
          onClick={() => navigate('/')}
          className='text-sm text-blue-600 hover:underline mt-4'
        >
          Back to Games
        </button>
      </div>
    )
  }

  if (showNamePrompt && !player && !token) {
    return (
      <div className='flex flex-col items-center justify-center min-h-screen bg-gray-100 p-4'>
        <h2 className='text-3xl mb-4'>{game?.name || 'Loading...'}</h2>
        <div className='text-center mb-6 bg-white p-6 rounded-lg shadow-md w-full max-w-sm'>
          <h3 className='text-xl mb-2'>Enter Your Name:</h3>
          <input
            type='text'
            value={inputName}
            onChange={e => setInputName(e.target.value)}
            className='border border-gray-300 rounded p-2 mt-2 w-full'
            placeholder='Your Name'
            onKeyDown={e => e.key === 'Enter' && handleNameSubmit()}
          />
          {error && <p className='text-red-500 text-sm mt-2 mb-1'>{error}</p>}
          <button
            onClick={handleNameSubmit}
            disabled={isLoading}
            className='mt-3 bg-red-500 text-white px-6 py-2 rounded hover:bg-red-600 w-full disabled:opacity-50'
          >
            {isLoading ? 'Joining...' : 'Join Game'}
          </button>
        </div>
        <button
          onClick={() => navigate('/')}
          className='text-sm text-blue-600 hover:underline mt-4'
        >
          Back to Games
        </button>
      </div>
    )
  }

  if (player && game) {
    return (
      <div className='flex flex-col items-center justify-center min-h-screen bg-gray-100 p-4 text-center'>
        <h2 className='text-3xl font-bold mb-2 text-gray-800'>{game.name}</h2>
        <div className='my-6 w-full max-w-sm bg-white p-4 rounded-lg shadow-md'>
          <h4 className='text-lg font-semibold mb-3 text-gray-600'>Players in game:</h4>
          {players.length > 0 ? (
            <ul className='list-none space-y-1'>
              {players.map(p => (
                <li
                  key={p.id}
                  className={`text-md p-1 rounded ${p.id === player?.id ? 'font-bold bg-red-100' : ''} ${
                    p.connected ? 'text-green-600' : 'text-gray-400 line-through'
                  }`}
                >
                  {p.name} {!p.connected ? '- disconnected' : ''}
                </li>
              ))}
            </ul>
          ) : (
            <p className='text-gray-500'>Waiting for players...</p>
          )}
        </div>
        <button
          onClick={() => navigate('/')}
          className='text-sm text-blue-600 hover:underline mt-8'
        >
          Go to Home Page
        </button>
      </div>
    )
  }

  if (isLoading) {
    return <div className='text-gray-500 text-xl p-4 text-center'>Connecting...</div>
  }

  return (
    <div className='flex flex-col items-center justify-center min-h-screen bg-gray-100 p-4'>
      <p className='text-orange-500 font-semibold text-xl mb-4'>An unexpected state occurred.</p>
      {error && <p className='text-red-500 text-sm mb-3'>{error}</p>}
      <button
        onClick={() => window.location.reload()}
        className='bg-blue-500 text-white px-4 py-2 rounded mb-2'
      >
        Reload
      </button>
      <button
        onClick={() => navigate('/')}
        className='text-blue-600 hover:underline'
      >
        Home
      </button>
    </div>
  )
}
