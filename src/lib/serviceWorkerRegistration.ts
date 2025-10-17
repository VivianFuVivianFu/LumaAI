/**
 * Service Worker Registration
 * Registers and manages the service worker lifecycle
 */

type Config = {
  onSuccess?: (registration: ServiceWorkerRegistration) => void;
  onUpdate?: (registration: ServiceWorkerRegistration) => void;
  onError?: (error: Error) => void;
};

const isLocalhost = Boolean(
  window.location.hostname === 'localhost' ||
    window.location.hostname === '[::1]' ||
    window.location.hostname.match(/^127(?:\.(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)){3}$/)
);

/**
 * Register the service worker
 */
export function register(config?: Config) {
  // Only enable in production or if explicitly enabled
  const enableSW = import.meta.env.VITE_ENABLE_SERVICE_WORKER === 'true';

  if (!enableSW && import.meta.env.PROD === false) {
    console.log('[SW] Service worker disabled in development');
    return;
  }

  if ('serviceWorker' in navigator) {
    // Wait for the page to load
    window.addEventListener('load', () => {
      const swUrl = '/sw.js';

      if (isLocalhost) {
        checkValidServiceWorker(swUrl, config);
        console.log('[SW] Running on localhost - checking for updates');
      } else {
        registerValidSW(swUrl, config);
      }
    });
  } else {
    console.log('[SW] Service workers not supported in this browser');
  }
}

/**
 * Register a valid service worker
 */
function registerValidSW(swUrl: string, config?: Config) {
  navigator.serviceWorker
    .register(swUrl)
    .then((registration) => {
      console.log('[SW] Service worker registered:', registration);

      registration.onupdatefound = () => {
        const installingWorker = registration.installing;
        if (installingWorker == null) {
          return;
        }

        installingWorker.onstatechange = () => {
          if (installingWorker.state === 'installed') {
            if (navigator.serviceWorker.controller) {
              console.log('[SW] New content available - please refresh');
              if (config?.onUpdate) {
                config.onUpdate(registration);
              }
            } else {
              console.log('[SW] Content cached for offline use');
              if (config?.onSuccess) {
                config.onSuccess(registration);
              }
            }
          }
        };
      };
    })
    .catch((error) => {
      console.error('[SW] Registration failed:', error);
      if (config?.onError) {
        config.onError(error);
      }
    });
}

/**
 * Check if service worker is valid
 */
function checkValidServiceWorker(swUrl: string, config?: Config) {
  fetch(swUrl, {
    headers: { 'Service-Worker': 'script' },
  })
    .then((response) => {
      const contentType = response.headers.get('content-type');
      if (
        response.status === 404 ||
        (contentType != null && contentType.indexOf('javascript') === -1)
      ) {
        console.error('[SW] Service worker not found - unregistering');
        navigator.serviceWorker.ready.then((registration) => {
          registration.unregister().then(() => {
            window.location.reload();
          });
        });
      } else {
        registerValidSW(swUrl, config);
      }
    })
    .catch(() => {
      console.log('[SW] No internet connection - app running in offline mode');
    });
}

/**
 * Unregister the service worker
 */
export function unregister() {
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.ready
      .then((registration) => {
        registration.unregister();
        console.log('[SW] Service worker unregistered');
      })
      .catch((error) => {
        console.error('[SW] Error unregistering service worker:', error);
      });
  }
}

/**
 * Update the service worker
 */
export function updateServiceWorker() {
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.ready
      .then((registration) => {
        registration.update();
        console.log('[SW] Checking for updates...');
      })
      .catch((error) => {
        console.error('[SW] Error updating service worker:', error);
      });
  }
}

/**
 * Skip waiting and activate new service worker immediately
 */
export function skipWaiting() {
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.ready
      .then((registration) => {
        if (registration.waiting) {
          registration.waiting.postMessage({ type: 'SKIP_WAITING' });
        }
      })
      .catch((error) => {
        console.error('[SW] Error skipping waiting:', error);
      });
  }
}
