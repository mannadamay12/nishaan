"use client";

import { CloudUpload, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface SyncIndicatorProps {
  queuedCount: number;
  isSyncing: boolean;
  isOnline: boolean;
}

export function SyncIndicator({ queuedCount, isSyncing, isOnline }: SyncIndicatorProps) {
  if (queuedCount === 0) return null;

  return (
    <div
      className={cn(
        "fixed bottom-4 right-4 z-40 flex items-center gap-2 rounded-lg border px-4 py-2 text-sm shadow-lg transition-all",
        isSyncing
          ? "bg-blue-500 text-white border-blue-600"
          : isOnline
          ? "bg-yellow-500 text-yellow-950 border-yellow-600"
          : "bg-muted text-muted-foreground"
      )}
    >
      {isSyncing ? (
        <>
          <Loader2 className="h-4 w-4 animate-spin" />
          <span className="font-medium">Syncing {queuedCount} change{queuedCount !== 1 ? "s" : ""}...</span>
        </>
      ) : (
        <>
          <CloudUpload className="h-4 w-4" />
          <span className="font-medium">
            {queuedCount} change{queuedCount !== 1 ? "s" : ""} pending{!isOnline ? " (offline)" : ""}
          </span>
        </>
      )}
    </div>
  );
}
