// Simple service worker for offline support
// IMPORTANT: Update the version number every time you deploy new changes
const CACHE_VERSION = 'v1.0.3-' + new Date().getTime()
const CACHE_NAME = 'ai-trainer-' + CACHE_VERSION
const urlsToCache = []

self.addEventListener('install', (event) => {
  console.log('Service Worker installing, version:', CACHE_VERSION)
  // Force the waiting service worker to become the active service worker immediately
  self.skipWaiting()
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('Cache opened:', CACHE_NAME)
      return cache.addAll(urlsToCache)
    })
  )
})

self.addEventListener('activate', (event) => {
  console.log('Service Worker activating, version:', CACHE_VERSION)
  // Take control of all pages immediately
  event.waitUntil(
    clients.claim().then(() => {
      // Delete ALL old caches
      return caches.keys().then((cacheNames) => {
        console.log('Existing caches:', cacheNames)
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

self.addEventListener('fetch', (event) => {
  // Don't cache anything - always fetch fresh
  event.respondWith(
    fetch(event.request).catch(() => {
      // On network failure, try cache
      return caches.match(event.request)
    })
  )
})
