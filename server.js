import express from 'express'
import * as Path from 'node:path'

const server = express()
const PORT = process.env.PORT || 3000

// Health check endpoint for Render
server.get('/health', (req, res) => {
  console.log('Health check requested')
  res.status(200).send('OK')
})

// Logging middleware
server.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`)
  next()
})

// Serve public assets first (manifest, service worker, images)
console.log('Public directory:', Path.resolve('./public'))
server.use(express.static(Path.resolve('./public')))

// Serve built assets from dist folder
console.log('Dist directory:', Path.resolve('./dist'))
server.use(express.static(Path.resolve('./dist')))

// Handle client-side routing - send all requests to index.html
server.get('*', (req, res) => {
  console.log('Serving index.html for:', req.url)
  const indexPath = Path.resolve('./dist/index.html')
  console.log('Index path:', indexPath)
  res.sendFile(indexPath)
})

server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`)
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`)
})
