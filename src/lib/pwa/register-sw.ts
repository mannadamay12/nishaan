/**
 * Service Worker Registration
 * Registers the service worker for PWA functionality
 */

export function registerServiceWorker() {
  // Only register in browser environment
  if (typeof window === 'undefined') {
    return;
  }

  // Check if service workers are supported
  if (!('serviceWorker' in navigator)) {
    console.log('Service workers are not supported in this browser');
    return;
  }

  // Register on page load
  window.addEventListener('load', async () => {
    try {
      const registration = await navigator.serviceWorker.register('/sw.js', {
        scope: '/',
      });

      console.log('Service worker registered successfully:', registration.scope);

      // Check for updates every hour
      setInterval(() => {
        registration.update();
      }, 60 * 60 * 1000);

      // Listen for updates
      registration.addEventListener('updatefound', () => {
        const newWorker = registration.installing;

        if (!newWorker) return;

        newWorker.addEventListener('statechange', () => {
          if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
            // New service worker available
            console.log('New service worker available. Refresh to update.');

            // Optionally show update notification to user
            showUpdateNotification();
          }
        });
      });

    } catch (error) {
      console.error('Service worker registration failed:', error);
    }
  });

  // Handle controller change (new service worker activated)
  navigator.serviceWorker.addEventListener('controllerchange', () => {
    console.log('Service worker controller changed, reloading page...');
    window.location.reload();
  });
}

/**
 * Show update notification when new service worker is available
 * This is a simple implementation - you can enhance with a toast/banner
 */
function showUpdateNotification() {
  if (confirm('A new version of nish.aan is available. Reload to update?')) {
    // Tell the service worker to skip waiting and activate
    if (navigator.serviceWorker.controller) {
      navigator.serviceWorker.controller.postMessage({ type: 'SKIP_WAITING' });
    }
  }
}

/**
 * Unregister service worker (for debugging)
 */
export async function unregisterServiceWorker() {
  if ('serviceWorker' in navigator) {
    const registrations = await navigator.serviceWorker.getRegistrations();
    for (const registration of registrations) {
      await registration.unregister();
    }
    console.log('Service worker unregistered');
  }
}

/**
 * Check if app is running in standalone mode (installed PWA)
 */
export function isStandalone(): boolean {
  if (typeof window === 'undefined') return false;

  return (
    window.matchMedia('(display-mode: standalone)').matches ||
    (window.navigator as any).standalone === true || // iOS Safari
    document.referrer.includes('android-app://') // Android
  );
}

/**
 * Request notification permission (for future use)
 */
export async function requestNotificationPermission(): Promise<NotificationPermission> {
  if (!('Notification' in window)) {
    return 'denied';
  }

  if (Notification.permission === 'granted') {
    return 'granted';
  }

  if (Notification.permission !== 'denied') {
    const permission = await Notification.requestPermission();
    return permission;
  }

  return Notification.permission;
}
