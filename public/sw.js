// Simple service worker for offline support
// IMPORTANT: Update the version number every time you deploy new changes
const CACHE_NAME = 'ai-trainer-v' + new Date().getTime()
const urlsToCache = ['/', '/index.html']

self.addEventListener('install', (event) => {
  // Force the waiting service worker to become the active service worker
  self.skipWaiting()
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(urlsToCache))
  )
})

self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request).then((response) => {
      // Cache hit - return response
      if (response) {
        return response
      }
      return fetch(event.request)
    })
  )
})

self.addEventListener('activate', (event) => {
  // Take control of all pages immediately
  event.waitUntil(
    clients.claim().then(() => {
      // Delete all old caches
      return caches.keys().then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => {
            if (cacheName !== CACHE_NAME) {
              console.log('Deleting old cache:', cacheName)
              return caches.delete(cacheName)
            }
          })
        )
      })
    })
  )
})
