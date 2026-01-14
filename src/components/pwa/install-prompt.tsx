"use client";

import { useState, useEffect } from "react";
import { Download, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useInstallPrompt, getInstallInstructions } from "@/lib/pwa/install-prompt";
import { cn } from "@/lib/utils";

interface InstallPromptProps {
  variant?: "banner" | "button";
  onInstall?: () => void;
  onDismiss?: () => void;
}

export function InstallPrompt({
  variant = "banner",
  onInstall,
  onDismiss,
}: InstallPromptProps) {
  const { installable, isInstalled, promptInstall } = useInstallPrompt();
  const [dismissed, setDismissed] = useState(false);
  const [showInstructions, setShowInstructions] = useState(false);
  const instructions = getInstallInstructions();

  // Check if user has previously dismissed
  useEffect(() => {
    if (typeof window === "undefined") return;

    const dismissed = localStorage.getItem("install-prompt-dismissed");
    if (dismissed === "true") {
      setDismissed(true);
    }
  }, []);

  const handleInstall = async () => {
    const accepted = await promptInstall();

    if (accepted) {
      onInstall?.();
    } else {
      // Show platform-specific instructions if prompt fails
      setShowInstructions(true);
    }
  };

  const handleDismiss = () => {
    setDismissed(true);
    localStorage.setItem("install-prompt-dismissed", "true");
    onDismiss?.();
  };

  // Don't show if already installed, dismissed, or not installable
  if (isInstalled || dismissed || (!installable && instructions.platform !== "ios")) {
    return null;
  }

  // Button variant (for settings or dashboard)
  if (variant === "button") {
    return (
      <div className="space-y-2">
        <Button
          onClick={handleInstall}
          variant="outline"
          size="sm"
          className="w-full"
        >
          <Download className="h-4 w-4 mr-2" />
          Install nish.aan
        </Button>
        {showInstructions && (
          <p className="text-xs text-muted-foreground">{instructions.instructions}</p>
        )}
      </div>
    );
  }

  // Banner variant (shown at top or bottom of dashboard)
  return (
    <div
      className={cn(
        "fixed bottom-4 left-4 right-4 z-40 bg-card border rounded-lg shadow-lg p-4 max-w-md mx-auto",
        "animate-in slide-in-from-bottom"
      )}
    >
      <button
        onClick={handleDismiss}
        className="absolute top-2 right-2 text-muted-foreground hover:text-foreground"
      >
        <X className="h-4 w-4" />
      </button>

      <div className="space-y-3">
        <div className="flex items-start gap-3">
          <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
            <Download className="h-5 w-5 text-primary" />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-sm">Install nish.aan</h3>
            <p className="text-xs text-muted-foreground mt-1">
              Access your bookmarks faster and get share menu integration
            </p>
          </div>
        </div>

        {showInstructions ? (
          <p className="text-xs text-muted-foreground pl-[52px]">
            {instructions.instructions}
          </p>
        ) : (
          <div className="flex gap-2 pl-[52px]">
            <Button
              onClick={handleInstall}
              size="sm"
              className="flex-1"
            >
              Install
            </Button>
            <Button
              onClick={handleDismiss}
              variant="ghost"
              size="sm"
            >
              Not now
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
