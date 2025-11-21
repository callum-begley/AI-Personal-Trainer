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

// Serve built assets from dist folder, but exclude index.html
console.log('Dist directory:', Path.resolve('./dist'))
server.use(express.static(Path.resolve('./dist'), {
  index: false, // Don't serve index.html from static middleware
  setHeaders: (res, path) => {
    // Cache assets with hashes in filename, but not index.html
    if (path.endsWith('.html')) {
      res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate')
      res.setHeader('Pragma', 'no-cache')
      res.setHeader('Expires', '0')
    }
  }
}))

// Handle client-side routing - always serve fresh index.html
server.get('*', (req, res) => {
  console.log('Serving index.html for:', req.url)
  const indexPath = Path.resolve('./dist/index.html')
  console.log('Index path:', indexPath)
  res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate')
  res.setHeader('Pragma', 'no-cache')
  res.setHeader('Expires', '0')
  res.sendFile(indexPath)
})

server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`)
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`)
})
