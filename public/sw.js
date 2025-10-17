/**
 * Service Worker for Luma PWA
 * Handles offline functionality and caching strategies
 */

const CACHE_VERSION = 'luma-v1.0.0';
const STATIC_CACHE = `${CACHE_VERSION}-static`;
const DYNAMIC_CACHE = `${CACHE_VERSION}-dynamic`;
const IMAGE_CACHE = `${CACHE_VERSION}-images`;

// Assets to cache immediately on install
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/luma-icon.svg',
  '/offline.html',
];

// Maximum number of items in dynamic cache
const DYNAMIC_CACHE_LIMIT = 50;
const IMAGE_CACHE_LIMIT = 100;

/**
 * Install Event - Cache static assets
 */
self.addEventListener('install', (event) => {
  console.log('[Service Worker] Installing...');

  event.waitUntil(
    caches.open(STATIC_CACHE)
      .then((cache) => {
        console.log('[Service Worker] Caching static assets');
        return cache.addAll(STATIC_ASSETS);
      })
      .then(() => {
        console.log('[Service Worker] Installation complete');
        return self.skipWaiting(); // Activate immediately
      })
      .catch((error) => {
        console.error('[Service Worker] Installation failed:', error);
      })
  );
});

/**
 * Activate Event - Clean up old caches
 */
self.addEventListener('activate', (event) => {
  console.log('[Service Worker] Activating...');

  event.waitUntil(
    caches.keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames
            .filter((name) => name.startsWith('luma-') && name !== STATIC_CACHE && name !== DYNAMIC_CACHE && name !== IMAGE_CACHE)
            .map((name) => {
              console.log('[Service Worker] Deleting old cache:', name);
              return caches.delete(name);
            })
        );
      })
      .then(() => {
        console.log('[Service Worker] Activation complete');
        return self.clients.claim(); // Take control immediately
      })
  );
});

/**
 * Fetch Event - Serve from cache with network fallback
 */
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip cross-origin requests
  if (url.origin !== location.origin) {
    // Don't cache API requests from different origins
    if (url.pathname.startsWith('/api/')) {
      return;
    }
  }

  // Handle API requests - Network first, then cache
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(networkFirst(request, DYNAMIC_CACHE));
    return;
  }

  // Handle image requests - Cache first, then network
  if (request.destination === 'image') {
    event.respondWith(cacheFirst(request, IMAGE_CACHE, IMAGE_CACHE_LIMIT));
    return;
  }

  // Handle static assets - Cache first, then network
  if (
    request.destination === 'script' ||
    request.destination === 'style' ||
    request.destination === 'font'
  ) {
    event.respondWith(cacheFirst(request, STATIC_CACHE));
    return;
  }

  // Handle HTML pages - Network first, then cache
  if (request.destination === 'document') {
    event.respondWith(networkFirst(request, DYNAMIC_CACHE));
    return;
  }

  // Default: Try cache first, then network
  event.respondWith(cacheFirst(request, DYNAMIC_CACHE, DYNAMIC_CACHE_LIMIT));
});

/**
 * Cache First Strategy
 * Good for: Static assets, images
 */
async function cacheFirst(request, cacheName, cacheLimit) {
  try {
    const cache = await caches.open(cacheName);
    const cachedResponse = await cache.match(request);

    if (cachedResponse) {
      console.log('[Service Worker] Serving from cache:', request.url);
      return cachedResponse;
    }

    console.log('[Service Worker] Fetching from network:', request.url);
    const networkResponse = await fetch(request);

    if (networkResponse.ok) {
      // Clone response before caching
      const responseToCache = networkResponse.clone();

      // Add to cache
      cache.put(request, responseToCache);

      // Limit cache size
      if (cacheLimit) {
        limitCacheSize(cacheName, cacheLimit);
      }
    }

    return networkResponse;
  } catch (error) {
    console.error('[Service Worker] Cache first failed:', error);

    // Return offline page for HTML requests
    if (request.destination === 'document') {
      const cache = await caches.open(STATIC_CACHE);
      return cache.match('/offline.html');
    }

    throw error;
  }
}

/**
 * Network First Strategy
 * Good for: API requests, dynamic content
 */
async function networkFirst(request, cacheName) {
  try {
    console.log('[Service Worker] Fetching from network:', request.url);
    const networkResponse = await fetch(request);

    if (networkResponse.ok) {
      // Clone and cache successful responses
      const cache = await caches.open(cacheName);
      cache.put(request, networkResponse.clone());
    }

    return networkResponse;
  } catch (error) {
    console.log('[Service Worker] Network failed, trying cache:', request.url);

    const cache = await caches.open(cacheName);
    const cachedResponse = await cache.match(request);

    if (cachedResponse) {
      console.log('[Service Worker] Serving stale data from cache');
      return cachedResponse;
    }

    // Return offline page for HTML requests
    if (request.destination === 'document') {
      const staticCache = await caches.open(STATIC_CACHE);
      return staticCache.match('/offline.html');
    }

    throw error;
  }
}

/**
 * Limit cache size to prevent storage quota issues
 */
async function limitCacheSize(cacheName, maxItems) {
  const cache = await caches.open(cacheName);
  const keys = await cache.keys();

  if (keys.length > maxItems) {
    // Delete oldest items
    const deleteCount = keys.length - maxItems;
    for (let i = 0; i < deleteCount; i++) {
      await cache.delete(keys[i]);
    }
    console.log(`[Service Worker] Cleaned ${deleteCount} items from ${cacheName}`);
  }
}

/**
 * Background Sync for offline actions (future enhancement)
 */
self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-offline-actions') {
    console.log('[Service Worker] Background sync triggered');
    event.waitUntil(syncOfflineActions());
  }
});

async function syncOfflineActions() {
  // Implement offline action synchronization
  console.log('[Service Worker] Syncing offline actions...');
}

/**
 * Push notifications (future enhancement)
 */
self.addEventListener('push', (event) => {
  const data = event.data ? event.data.json() : {};

  const options = {
    body: data.body || 'New update from Luma',
    icon: '/android-chrome-192x192.png',
    badge: '/badge-icon.png',
    vibrate: [200, 100, 200],
    data: data,
  };

  event.waitUntil(
    self.registration.showNotification(data.title || 'Luma', options)
  );
});
