/**
 * Offline State Management
 * Provides hooks and utilities for detecting and managing offline state
 */

import { useState, useEffect } from "react";

/**
 * Hook to track online/offline status
 * Returns true when online, false when offline
 */
export function useOnlineStatus(): boolean {
  const [isOnline, setIsOnline] = useState(
    typeof window !== "undefined" ? navigator.onLine : true
  );

  useEffect(() => {
    // Only run in browser
    if (typeof window === "undefined") return;

    function handleOnline() {
      setIsOnline(true);
      console.log("[Offline Manager] Connection restored");
    }

    function handleOffline() {
      setIsOnline(false);
      console.log("[Offline Manager] Connection lost");
    }

    // Listen for online/offline events
    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    // Check initial state
    setIsOnline(navigator.onLine);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  return isOnline;
}

/**
 * Check if app is running in standalone mode (installed PWA)
 */
export function isStandalonePWA(): boolean {
  if (typeof window === "undefined") return false;

  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    (window.navigator as any).standalone === true || // iOS Safari
    document.referrer.includes("android-app://") // Android
  );
}

/**
 * Estimate network quality based on connection API (if available)
 */
export function getNetworkQuality(): "slow" | "medium" | "fast" | "unknown" {
  if (typeof window === "undefined" || !("connection" in navigator)) {
    return "unknown";
  }

  const connection = (navigator as any).connection;
  if (!connection) return "unknown";

  // Check effective connection type
  const effectiveType = connection.effectiveType;

  if (effectiveType === "slow-2g" || effectiveType === "2g") return "slow";
  if (effectiveType === "3g") return "medium";
  if (effectiveType === "4g") return "fast";

  return "unknown";
}

/**
 * Get human-readable network status message
 */
export function getNetworkStatusMessage(isOnline: boolean): string {
  if (!isOnline) {
    return "You're offline. Changes will sync when you reconnect.";
  }

  const quality = getNetworkQuality();
  if (quality === "slow") {
    return "Slow connection detected. Some features may be delayed.";
  }

  return "";
}
