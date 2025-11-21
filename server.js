import express from 'express'
import * as Path from 'node:path'

const server = express()
const PORT = process.env.PORT || 3000

// Disable caching for all static files
server.use((req, res, next) => {
  res.set('Cache-Control', 'no-store, no-cache, must-revalidate, private')
  next()
})

// Serve public assets (manifest, service worker, images)
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
