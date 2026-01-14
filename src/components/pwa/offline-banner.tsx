"use client";

import { useEffect, useState } from "react";
import { WifiOff, Wifi } from "lucide-react";
import { cn } from "@/lib/utils";

interface OfflineBannerProps {
  isOnline: boolean;
}

export function OfflineBanner({ isOnline }: OfflineBannerProps) {
  const [show, setShow] = useState(!isOnline);
  const [justReconnected, setJustReconnected] = useState(false);

  useEffect(() => {
    if (!isOnline) {
      // Show immediately when going offline
      setShow(true);
      setJustReconnected(false);
    } else {
      // When coming back online, show success message briefly
      if (show) {
        setJustReconnected(true);
        const timer = setTimeout(() => {
          setShow(false);
          setJustReconnected(false);
        }, 3000);
        return () => clearTimeout(timer);
      }
    }
  }, [isOnline, show]);

  if (!show) return null;

  return (
    <div
      className={cn(
        "fixed top-0 left-0 right-0 z-50 px-4 py-3 text-sm font-medium text-center transition-all",
        justReconnected
          ? "bg-green-500 text-white"
          : "bg-yellow-500 text-yellow-950"
      )}
    >
      <div className="flex items-center justify-center gap-2">
        {justReconnected ? (
          <>
            <Wifi className="h-4 w-4" />
            <span>Back online! Your changes will sync now.</span>
          </>
        ) : (
          <>
            <WifiOff className="h-4 w-4" />
            <span>You're offline. Changes will sync when you reconnect.</span>
          </>
        )}
      </div>
    </div>
  );
}
