import express from 'express'
import * as Path from 'node:path'

const server = express()
const PORT = process.env.PORT || 3000

// Serve static assets from dist folder
server.use(express.static(Path.resolve('./dist')))

// Handle client-side routing - send all requests to index.html
server.get('*', (req, res) => {
  res.sendFile(Path.resolve('./dist/index.html'))
})

server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`)
})

if (process.env.NODE_ENV === 'production') {
  server.use(express.static(Path.resolve('public')))
  server.use('/assets', express.static(Path.resolve('./dist/assets')))
  server.get('*', (req, res) => {
    res.sendFile(Path.resolve('./dist/index.html'))
  })
}
