import express from 'express'
import * as Path from 'node:path'
import { fileURLToPath } from 'url'
import { dirname } from 'path'
import fs from 'fs'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

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
const publicPath = Path.resolve(__dirname, './public')
console.log('Public directory:', publicPath)
server.use(express.static(publicPath))

// Serve built assets from dist folder, but exclude index.html
const distPath = Path.resolve(__dirname, './dist')
console.log('Dist directory:', distPath)

// Check if dist directory exists
if (fs.existsSync(distPath)) {
  console.log('Dist directory exists')
  const files = fs.readdirSync(distPath)
  console.log('Dist contents:', files)
} else {
  console.error('WARNING: Dist directory does not exist!')
}

server.use(
  express.static(distPath, {
    index: false, // Don't serve index.html from static middleware
    setHeaders: (res, path) => {
      // Cache assets with hashes in filename, but not index.html
      if (path.endsWith('.html')) {
        res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate')
        res.setHeader('Pragma', 'no-cache')
        res.setHeader('Expires', '0')
      }
    },
  })
)

// Handle client-side routing - always serve fresh index.html
server.get('*', (req, res) => {
  console.log('Serving index.html for:', req.url)
  const indexPath = Path.resolve(__dirname, './dist/index.html')
  console.log('Index path:', indexPath)
  
  // Check if file exists
  if (!fs.existsSync(indexPath)) {
    console.error('ERROR: index.html not found at', indexPath)
    return res.status(500).send('index.html not found')
  }
  
  // Read and log first line to verify it's the right file
  const content = fs.readFileSync(indexPath, 'utf8')
  const firstScriptMatch = content.match(/src="([^"]+\.js)"/)
  console.log('index.html references JS file:', firstScriptMatch ? firstScriptMatch[1] : 'not found')
  
  res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate')
  res.setHeader('Pragma', 'no-cache')
  res.setHeader('Expires', '0')
  res.sendFile(indexPath)
})

server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`)
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`)
  console.log(`__dirname: ${__dirname}`)
})
