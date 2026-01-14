/**
 * Sync Queue Manager
 * Manages offline operation queue and synchronization
 */

import {
  addToQueue,
  getAllQueueItems,
  removeFromQueue,
  updateQueueItem,
  clearQueue,
  getQueueSize,
} from "./indexeddb";
import {
  createBookmark,
  updateBookmark,
  deleteBookmark,
  toggleFavorite,
  archiveBookmark,
  restoreBookmark,
  addTag,
  removeTag,
} from "@/app/actions/bookmarks";
import {
  createGroup,
  updateGroup,
  deleteGroup,
} from "@/app/actions/groups";

export type QueuedOperationType =
  | "CREATE_BOOKMARK"
  | "UPDATE_BOOKMARK"
  | "DELETE_BOOKMARK"
  | "TOGGLE_FAVORITE"
  | "ARCHIVE_BOOKMARK"
  | "RESTORE_BOOKMARK"
  | "ADD_TAG"
  | "REMOVE_TAG"
  | "CREATE_GROUP"
  | "UPDATE_GROUP"
  | "DELETE_GROUP";

export interface QueuedOperation {
  id: string;
  type: QueuedOperationType;
  payload: any;
  timestamp: number;
  retries: number;
}

const MAX_RETRIES = 3;

/**
 * Queue an operation for later execution
 */
export async function queueOperation(
  type: QueuedOperationType,
  payload: any
): Promise<void> {
  const operation: QueuedOperation = {
    id: `${type}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    type,
    payload,
    timestamp: Date.now(),
    retries: 0,
  };

  await addToQueue(operation);
  console.log("[Sync Queue] Queued operation:", operation.type, operation.id);
}

/**
 * Process a single queued operation
 */
async function processOperation(operation: QueuedOperation): Promise<boolean> {
  try {
    console.log("[Sync Queue] Processing:", operation.type, operation.id);

    switch (operation.type) {
      case "CREATE_BOOKMARK":
        await createBookmark(operation.payload.url, operation.payload.groupId);
        break;

      case "UPDATE_BOOKMARK":
        await updateBookmark(operation.payload.id, operation.payload.data);
        break;

      case "DELETE_BOOKMARK":
        await deleteBookmark(operation.payload.id);
        break;

      case "TOGGLE_FAVORITE":
        await toggleFavorite(operation.payload.id, operation.payload.isFavorite);
        break;

      case "ARCHIVE_BOOKMARK":
        await archiveBookmark(operation.payload.id);
        break;

      case "RESTORE_BOOKMARK":
        await restoreBookmark(operation.payload.id);
        break;

      case "ADD_TAG":
        await addTag(operation.payload.id, operation.payload.tag);
        break;

      case "REMOVE_TAG":
        await removeTag(operation.payload.id, operation.payload.tag);
        break;

      case "CREATE_GROUP":
        await createGroup(operation.payload);
        break;

      case "UPDATE_GROUP":
        await updateGroup(operation.payload.id, operation.payload.data);
        break;

      case "DELETE_GROUP":
        await deleteGroup(operation.payload.id);
        break;

      default:
        console.error("[Sync Queue] Unknown operation type:", operation.type);
        return false;
    }

    console.log("[Sync Queue] Success:", operation.type, operation.id);
    return true;
  } catch (error) {
    console.error("[Sync Queue] Failed:", operation.type, operation.id, error);
    return false;
  }
}

/**
 * Process all queued operations
 */
export async function processQueue(): Promise<{
  processed: number;
  failed: number;
  remaining: number;
}> {
  const operations = await getAllQueueItems();

  if (operations.length === 0) {
    console.log("[Sync Queue] Queue is empty");
    return { processed: 0, failed: 0, remaining: 0 };
  }

  console.log(`[Sync Queue] Processing ${operations.length} operations...`);

  let processed = 0;
  let failed = 0;

  for (const operation of operations) {
    const success = await processOperation(operation);

    if (success) {
      await removeFromQueue(operation.id);
      processed++;
    } else {
      // Retry logic
      operation.retries++;

      if (operation.retries >= MAX_RETRIES) {
        console.error(
          `[Sync Queue] Max retries reached for ${operation.type}, removing from queue`
        );
        await removeFromQueue(operation.id);
        failed++;
      } else {
        console.log(
          `[Sync Queue] Retry ${operation.retries}/${MAX_RETRIES} for ${operation.type}`
        );
        await updateQueueItem(operation);
      }
    }
  }

  const remaining = await getQueueSize();

  console.log(
    `[Sync Queue] Complete: ${processed} processed, ${failed} failed, ${remaining} remaining`
  );

  return { processed, failed, remaining };
}

/**
 * Get current queue status
 */
export async function getQueueStatus(): Promise<{
  size: number;
  operations: QueuedOperation[];
}> {
  const size = await getQueueSize();
  const operations = await getAllQueueItems();

  return { size, operations };
}

/**
 * Clear all queued operations (use with caution)
 */
export async function clearAllQueued(): Promise<void> {
  await clearQueue();
  console.log("[Sync Queue] Queue cleared");
}
