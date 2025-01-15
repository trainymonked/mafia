import { io } from 'socket.io-client'

import { SERVER_URI } from './constants'

export default io(SERVER_URI)
