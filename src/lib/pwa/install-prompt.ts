/**
 * PWA Install Prompt Management
 * Handles the beforeinstallprompt event and provides install functionality
 */

import { useState, useEffect } from "react";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

let deferredPrompt: BeforeInstallPromptEvent | null = null;

/**
 * Hook to manage PWA install prompt
 */
export function useInstallPrompt() {
  const [installable, setInstallable] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);

  useEffect(() => {
    // Check if already installed
    if (typeof window !== "undefined") {
      const isStandalone =
        window.matchMedia("(display-mode: standalone)").matches ||
        (window.navigator as any).standalone === true ||
        document.referrer.includes("android-app://");

      setIsInstalled(isStandalone);
    }

    // Listen for beforeinstallprompt event
    const handleBeforeInstallPrompt = (e: Event) => {
      // Prevent the mini-infobar from appearing on mobile
      e.preventDefault();

      // Stash the event so it can be triggered later
      deferredPrompt = e as BeforeInstallPromptEvent;
      setInstallable(true);

      console.log("[Install Prompt] PWA install available");
    };

    // Listen for successful installation
    const handleAppInstalled = () => {
      console.log("[Install Prompt] PWA installed successfully");
      setIsInstalled(true);
      setInstallable(false);
      deferredPrompt = null;
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    window.addEventListener("appinstalled", handleAppInstalled);

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
      window.removeEventListener("appinstalled", handleAppInstalled);
    };
  }, []);

  const promptInstall = async (): Promise<boolean> => {
    if (!deferredPrompt) {
      console.log("[Install Prompt] No deferred prompt available");
      return false;
    }

    // Show the install prompt
    await deferredPrompt.prompt();

    // Wait for the user to respond to the prompt
    const { outcome } = await deferredPrompt.userChoice;

    console.log(`[Install Prompt] User choice: ${outcome}`);

    // Clear the deferred prompt
    deferredPrompt = null;
    setInstallable(false);

    return outcome === "accepted";
  };

  return {
    installable: installable && !isInstalled,
    isInstalled,
    promptInstall,
  };
}

/**
 * Get platform-specific install instructions
 */
export function getInstallInstructions(): {
  platform: string;
  instructions: string;
} {
  if (typeof window === "undefined") {
    return { platform: "unknown", instructions: "" };
  }

  const userAgent = window.navigator.userAgent.toLowerCase();

  // iOS Safari
  if (/iphone|ipad|ipod/.test(userAgent) && !/(crios|fxios)/.test(userAgent)) {
    return {
      platform: "ios",
      instructions:
        'Tap the Share button and select "Add to Home Screen" to install nish.aan.',
    };
  }

  // Android Chrome
  if (/android/.test(userAgent) && /chrome/.test(userAgent)) {
    return {
      platform: "android",
      instructions: 'Tap the menu and select "Install app" or "Add to Home Screen".',
    };
  }

  // Desktop Chrome/Edge
  if (/chrome|edg/.test(userAgent) && !/mobile/.test(userAgent)) {
    return {
      platform: "desktop",
      instructions:
        'Click the install icon in the address bar or use the menu to "Install nish.aan".',
    };
  }

  return {
    platform: "other",
    instructions:
      "Look for an install or add to home screen option in your browser menu.",
  };
}
