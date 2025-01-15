import { useState, useEffect } from 'react'
import { useParams } from 'react-router-dom'

import socket from './socket'

export default function App() {
  const { gameId } = useParams()
  const [players, setPlayers] = useState([])
  const [lastClicked, setLastClicked] = useState(null)
  const [playerName, setPlayerName] = useState('')
  const [inputName, setInputName] = useState('')
  const [gameExists, setGameExists] = useState(null)

  useEffect(() => {
    function onConnect() {
      console.log('Connected to the server via WebSocket:', socket.id)
    }

    function onDisconnect(reason) {
      console.log('Disconnected from socket server:', reason)
    }

    socket.on('connect', onConnect)
    socket.on('disconnect', onDisconnect)

    return () => {
      socket.off('connect', onConnect)
      socket.off('disconnect', onDisconnect)
    }
  }, [])

  useEffect(() => {
    const checkGameExists = async () => {
      try {
        const response = await fetch(`http://localhost:3001/games/${gameId}`)
        const data = await response.json()
        if (Array.isArray(data)) {
          setGameExists(true)
        } else {
          setGameExists(false)
        }
      } catch (error) {
        setGameExists(false)
      }
    }
    checkGameExists()
  }, [gameId])

  useEffect(() => {
    if (gameId && playerName) {
      socket.emit('join-game', { gameId, playerName })
    }

    const onPlayersUpdate = players => setPlayers(players)
    const onButtonUpdate = ({ clickedBy }) => setLastClicked(clickedBy)

    socket.on('players-update', onPlayersUpdate)
    socket.on('button-update', onButtonUpdate)

    return () => {
      socket.off('players-update', onPlayersUpdate)
      socket.off('button-update', onButtonUpdate)
    }
  }, [gameId, playerName])

  const handleSubmit = () => {
    if (inputName.trim() !== '') {
      setPlayerName(inputName)
    }
  }

  const handleButtonClick = () => {
    socket.emit('button-click', { gameId, playerName })
  }

  return (
    <div className='flex flex-col items-center justify-center min-h-screen bg-gray-100 p-4'>
      {gameExists === null ? (
        <h2 className='text-xl text-gray-500'>Loading...</h2>
      ) : gameExists === false ? (
        <h2 className='text-xl text-red-500 font-semibold'>Game not found</h2>
      ) : !playerName ? (
        <div className='text-center mb-6'>
          <h2 className='text-2xl mb-2'>Enter Player Name</h2>
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
          {playerName && (
            <p className='mt-4'>
              Your name: <strong>{playerName}</strong>
            </p>
          )}
        </div>
      ) : (
        <div className='text-center'>
          <h2 className='text-3xl mb-4'>Game: {gameId}</h2>
          <h3 className='text-xl font-semibold mb-2'>Players:</h3>
          <ul className='list-none space-y-2 mb-4'>
            {players.map(player => (
              <li
                key={player.id}
                className='text-lg'
              >
                {player.name}
              </li>
            ))}
          </ul>
          <button
            onClick={handleButtonClick}
            className='bg-red-500 text-white p-3 rounded-lg mb-4 hover:bg-red-600 transition'
          >
            Click Button
          </button>
          {lastClicked && (
            <p className='text-lg'>Button clicked by: {lastClicked === playerName ? '(You)' : lastClicked}</p>
          )}
        </div>
      )}
    </div>
  )
}
