import express from 'express'
import * as Path from 'node:path'

const server = express()
const PORT = process.env.PORT || 3000

// Health check endpoint for Render
server.get('/health', (req, res) => {
  res.status(200).send('OK')
})

// Serve public assets first (manifest, service worker, images)
server.use(express.static(Path.resolve('./public')))

// Serve built assets from dist folder  
server.use(express.static(Path.resolve('./dist')))

// Handle client-side routing - send all requests to index.html
server.get('*', (req, res) => {
  res.sendFile(Path.resolve('./dist/index.html'))
})

server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`)
})
