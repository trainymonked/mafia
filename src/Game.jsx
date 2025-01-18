import { useState, useEffect } from 'react'
import { useParams } from 'react-router-dom'

import socket from './socket'
import { SERVER_URI } from './constants'

export default function Game() {
  const { gameId } = useParams()
  const [game, setGame] = useState(null)
  const [player, setPlayer] = useState(null)
  const [players, setPlayers] = useState([])
  const [token, setToken] = useState(localStorage.getItem('game-token') || '')

  const [lastClicked, setLastClicked] = useState(0)

  const [playerName, setPlayerName] = useState('')
  const [inputName, setInputName] = useState('')

  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    const onDisconnect = () => setError('Disconnected from the server')
    const onWSError = error => setError(error)
    const onPlayersUpdate = (players, x) => {
      setPlayers(players)
      setPlayer(players.find(p => p.socket_id === socket.id))
    }
    const onButtonUpdate = ({ clickedBy }) => setLastClicked(clickedBy)
    const onSetToken = newToken => setToken(newToken)

    socket.on('disconnect', onDisconnect)
    socket.on('error', onWSError)
    socket.on('players-update', onPlayersUpdate)
    socket.on('button-update', onButtonUpdate)
    socket.on('set-token', onSetToken)

    return () => {
      socket.off('disconnect', onDisconnect)
      socket.off('error', onWSError)
      socket.off('players-update', onPlayersUpdate)
      socket.off('button-update', onButtonUpdate)
      socket.off('set-token', onSetToken)
    }
  }, [])

  useEffect(() => {
    const fetchGame = async () => {
      try {
        setIsLoading(true)
        setError(null)
        const response = await fetch(`${SERVER_URI}/games/${gameId}`)
        if (!response.ok) throw new Error()
        const data = await response.json()
        if (data.message) setError(data.message)
        else setGame(data)
      } catch {
        setError('Could not connect to the server. Please try again later')
      } finally {
        setIsLoading(false)
      }
    }
    fetchGame()
  }, [gameId])

  useEffect(() => {
    localStorage.setItem('game-token', token)
  }, [token])

  useEffect(() => {
    if (gameId) {
      if (token || playerName) {
        socket.emit('join-game', { gameId, playerName, token })
      }
    }
  }, [gameId, playerName])

  const handleSubmit = () => {
    if (inputName.trim() !== '') {
      setPlayerName(inputName)
    }
  }

  const handleButtonClick = () => {
    socket.emit('button-click', { gameId, playerId: player.id })
  }

  return (
    <div className='flex flex-col items-center justify-center min-h-screen bg-gray-100 p-4'>
      {isLoading && <div className='text-gray-500 text-xl'>Loading...</div>}

      {error && (
        <div className='flex flex-col items-center'>
          <p className='text-red-500 font-semibold text-xl mb-2'>{error}</p>
          <a
            className='text-blue-600 hover:underline'
            href='#/'
          >
            Go to Home page
          </a>
        </div>
      )}

      {isLoading || error ? null : !(player?.name || token) ? (
        <>
          <h2 className='text-3xl mb-4'>Game: {game.name}</h2>

          <div className='text-center mb-6'>
            <h2 className='text-2xl mb-2'>Enter your name:</h2>
            <input
              type='text'
              value={inputName}
              onChange={e => setInputName(e.target.value)}
              className='border border-gray-300 rounded p-2 mt-2'
              placeholder='Enter your name'
            />
            <button
              onClick={handleSubmit}
              className='ml-2 bg-red-500 text-white px-4 py-2 rounded'
            >
              Submit
            </button>
          </div>
        </>
      ) : (
        <div className='text-center'>
          <h3 className='text-xl font-semibold mb-2'>Players:</h3>
          <ul className='list-none space-y-2 mb-4'>
            {players.map(p => (
              <li
                key={p.id}
                className={`text-lg font-semibold ${p.connected ? 'text-green-500' : 'text-red-500'}`}
              >
                {p.id === player?.id ? '[You] ' : null}
                {p.name}
              </li>
            ))}
          </ul>
          <button
            onClick={handleButtonClick}
            className='bg-red-500 text-white p-3 rounded-lg mb-4 hover:bg-red-600 transition'
          >
            Click me!
          </button>
          {!!lastClicked && (
            <p className='text-lg'>
              Button clicked by: {lastClicked === player.id ? '(You)' : players.find(p => p.id === lastClicked).name}
            </p>
          )}
        </div>
      )}
    </div>
  )
}
