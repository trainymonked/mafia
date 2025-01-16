const IS_LOCAL = process.env.NODE_ENV === 'development' || false

export const SERVER_URI = IS_LOCAL ? 'http://localhost:3001' : 'https://mafia-backend-5ghu.onrender.com'
