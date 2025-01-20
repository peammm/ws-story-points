const http = require('http')
const WebSocket = require('ws')

const server = http.createServer((req, res) => {
  res.writeHead(200, { 'Content-Type': 'text/plain' })
  res.end('WebSocket server running')
})

const wss = new WebSocket.Server({ server })
const clients = new Set()
const playerNames = new Set()

let gameState = {
  scores: {},
  showResults: false,
  totalPlayers: 0
}

wss.on('connection', (ws) => {
  clients.add(ws)
  gameState.totalPlayers += 1
  console.log(`New client connected. Total players: ${gameState.totalPlayers}`)

  ws.send(JSON.stringify({
    type: 'state',
    data: gameState
  }))

  ws.on('message', (message) => {
    try {
      const data = JSON.parse(message)
      switch (data.type) {
        case 'score':
          gameState.scores[data.name] = data.score
          break
        case 'show_results':
          gameState.showResults = data.show
          break
        case 'reset':
          gameState.scores = {}
          gameState.showResults = false
          break
        case 'total_players':
          gameState.totalPlayers = data.count
          break
        default:
          console.log('Unknown message type:', data.type)
      }

      broadcastGameState()
    } catch (error) {
      console.error('Failed to process message:', error)
    }
  })

  ws.on('close', () => {
    clients.delete(ws)
    gameState.totalPlayers -= 1
    console.log(`Client disconnected. Total players: ${gameState.totalPlayers}`)
  })
})

function broadcastGameState() {
  const message = JSON.stringify({
    type: 'state',
    data: gameState
  });
  for (const client of clients) {
    if (client.readyState === WebSocket.OPEN) {
      client.send(message)
    }
  }
}

const PORT = 3001
server.listen(PORT, () => {
  console.log(`WebSocket server is running on ws://localhost:${PORT}`)
})
