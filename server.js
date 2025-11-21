import express from 'express'
import * as Path from 'node:path'

const server = express()
const PORT = process.env.PORT || 3000

// Serve public assets first (manifest, service worker, images) - no caching for these
server.use(
  express.static(Path.resolve('./public'), {
    setHeaders: (res) => {
      res.set('Cache-Control', 'no-store, no-cache, must-revalidate, private')
    },
  })
)

// Serve built assets from dist folder
server.use(
  express.static(Path.resolve('./dist'), {
    setHeaders: (res) => {
      res.set('Cache-Control', 'no-store, no-cache, must-revalidate, private')
    },
  })
)

// Handle client-side routing - send all requests to index.html
server.get('*', (req, res) => {
  res.set('Cache-Control', 'no-store, no-cache, must-revalidate, private')
  res.sendFile(Path.resolve('./dist/index.html'))
})

server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`)
})
