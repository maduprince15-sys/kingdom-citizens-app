const CACHE_NAME = 'kingdom-citizens-v1'

self.addEventListener('install', () => {
  self.skipWaiting()
})

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((key) => key !== CACHE_NAME)
          .map((key) => caches.delete(key))
      )
    )
  )

  self.clients.claim()
})

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') {
    return
  }

  const url = new URL(event.request.url)
  // Never replay a cached authenticated response when the network is unavailable.
  if (event.request.cache === 'no-store' || event.request.mode === 'navigate' ||
      event.request.headers.has('Authorization') || event.request.headers.has('RSC') ||
      url.pathname === '/api' || url.pathname.startsWith('/api/') ||
      url.pathname === '/auth' || url.pathname.startsWith('/auth/')) {
    event.respondWith(fetch(event.request))
    return
  }

  event.respondWith(
    fetch(event.request).catch(() => caches.match(event.request))
  )
})