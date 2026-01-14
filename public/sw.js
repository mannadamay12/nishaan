// Service Worker for nish.aan PWA
// Provides offline support with intelligent caching strategies

const CACHE_VERSION = 'v1';
const STATIC_CACHE = `nishaan-static-${CACHE_VERSION}`;
const DYNAMIC_CACHE = `nishaan-dynamic-${CACHE_VERSION}`;
const OFFLINE_URL = '/offline.html';

// Assets to pre-cache on install
const STATIC_ASSETS = [
  '/',
  '/offline.html',
  '/manifest.json',
  '/icons/icon.svg',
];

// Network timeout for API requests (3 seconds)
const NETWORK_TIMEOUT = 3000;

// Install event - cache static assets
self.addEventListener('install', (event) => {
  console.log('[SW] Installing service worker...');

  event.waitUntil(
    caches.open(STATIC_CACHE)
      .then((cache) => {
        console.log('[SW] Caching static assets');
        return cache.addAll(STATIC_ASSETS);
      })
      .then(() => self.skipWaiting()) // Activate immediately
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  console.log('[SW] Activating service worker...');

  event.waitUntil(
    caches.keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames
            .filter((name) => {
              // Remove old versions of our caches
              return name.startsWith('nishaan-') && name !== STATIC_CACHE && name !== DYNAMIC_CACHE;
            })
            .map((name) => {
              console.log('[SW] Deleting old cache:', name);
              return caches.delete(name);
            })
        );
      })
      .then(() => self.clients.claim()) // Take control of all clients
  );
});

// Fetch event - apply caching strategies
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET requests
  if (request.method !== 'GET') {
    return;
  }

  // Skip chrome-extension and other non-http(s) requests
  if (!url.protocol.startsWith('http')) {
    return;
  }

  event.respondWith(handleFetch(request, url));
});

async function handleFetch(request, url) {
  // Strategy 1: Cache-First for static assets
  if (isStaticAsset(url)) {
    return cacheFirst(request);
  }

  // Strategy 2: Network-First with timeout for API routes
  if (isApiRoute(url)) {
    return networkFirstWithTimeout(request);
  }

  // Strategy 3: Network-First for HTML pages (with offline fallback)
  if (request.headers.get('accept').includes('text/html')) {
    return networkFirstForPages(request);
  }

  // Strategy 4: Cache-First for external resources (favicons, images)
  if (isExternalResource(url)) {
    return cacheFirst(request);
  }

  // Default: Network-only
  return fetch(request);
}

// Check if URL is a static asset
function isStaticAsset(url) {
  return (
    url.pathname.startsWith('/_next/static/') ||
    url.pathname.startsWith('/icons/') ||
    url.pathname.match(/\.(js|css|woff|woff2|ttf|eot)$/)
  );
}

// Check if URL is an API route
function isApiRoute(url) {
  return (
    url.pathname.startsWith('/api/') ||
    url.hostname.includes('supabase.co') ||
    url.hostname.includes('generativelanguage.googleapis.com')
  );
}

// Check if URL is an external resource (favicons, og:images)
function isExternalResource(url) {
  return (
    url.hostname !== self.location.hostname &&
    (url.pathname.match(/\.(png|jpg|jpeg|svg|ico|webp)$/) ||
     url.pathname.includes('favicon'))
  );
}

// Strategy: Cache-First (good for static assets)
async function cacheFirst(request) {
  try {
    const cached = await caches.match(request);
    if (cached) {
      return cached;
    }

    const response = await fetch(request);

    // Cache successful responses
    if (response.ok) {
      const cache = await caches.open(DYNAMIC_CACHE);
      cache.put(request, response.clone());
    }

    return response;
  } catch (error) {
    console.error('[SW] Cache-First failed:', error);
    const cached = await caches.match(request);
    if (cached) return cached;
    throw error;
  }
}

// Strategy: Network-First with timeout (good for API routes)
async function networkFirstWithTimeout(request) {
  try {
    // Race network request against timeout
    const networkPromise = fetch(request);
    const timeoutPromise = new Promise((_, reject) =>
      setTimeout(() => reject(new Error('Network timeout')), NETWORK_TIMEOUT)
    );

    const response = await Promise.race([networkPromise, timeoutPromise]);

    // Cache successful responses for offline fallback
    if (response.ok) {
      const cache = await caches.open(DYNAMIC_CACHE);
      cache.put(request, response.clone());
    }

    return response;
  } catch (error) {
    console.log('[SW] Network failed, trying cache:', request.url);

    // Fallback to cache
    const cached = await caches.match(request);
    if (cached) {
      return cached;
    }

    // If no cache, return error response
    return new Response(
      JSON.stringify({ error: 'Offline', message: 'No cached data available' }),
      {
        status: 503,
        statusText: 'Service Unavailable',
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
}

// Strategy: Network-First for HTML pages
async function networkFirstForPages(request) {
  try {
    const response = await fetch(request);

    // Cache successful page loads
    if (response.ok) {
      const cache = await caches.open(DYNAMIC_CACHE);
      cache.put(request, response.clone());
    }

    return response;
  } catch (error) {
    console.log('[SW] Page load failed, trying cache or offline fallback');

    // Try cached version
    const cached = await caches.match(request);
    if (cached) {
      return cached;
    }

    // Show offline page
    const offlinePage = await caches.match(OFFLINE_URL);
    if (offlinePage) {
      return offlinePage;
    }

    // Last resort: generic offline response
    return new Response(
      '<html><body><h1>Offline</h1><p>You are offline and this page is not cached.</p></body></html>',
      {
        status: 503,
        headers: { 'Content-Type': 'text/html' },
      }
    );
  }
}

// Listen for messages from the client
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }

  if (event.data && event.data.type === 'CACHE_URLS') {
    event.waitUntil(
      caches.open(DYNAMIC_CACHE)
        .then((cache) => cache.addAll(event.data.urls))
    );
  }
});

console.log('[SW] Service worker loaded');
