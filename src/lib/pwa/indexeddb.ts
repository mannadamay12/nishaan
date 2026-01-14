/**
 * IndexedDB Wrapper
 * Provides persistent storage for offline operations queue
 */

import { openDB, DBSchema, IDBPDatabase } from "idb";

interface SyncQueueItem {
  id: string;
  type: string;
  payload: any;
  timestamp: number;
  retries: number;
}

interface NishaanDB extends DBSchema {
  syncQueue: {
    key: string;
    value: SyncQueueItem;
    indexes: { timestamp: number };
  };
}

const DB_NAME = "nishaan-db";
const DB_VERSION = 1;

let dbPromise: Promise<IDBPDatabase<NishaanDB>> | null = null;

/**
 * Initialize and open the database
 */
export async function getDB(): Promise<IDBPDatabase<NishaanDB>> {
  if (dbPromise) return dbPromise;

  dbPromise = openDB<NishaanDB>(DB_NAME, DB_VERSION, {
    upgrade(db) {
      // Create sync queue store
      if (!db.objectStoreNames.contains("syncQueue")) {
        const store = db.createObjectStore("syncQueue", { keyPath: "id" });
        store.createIndex("timestamp", "timestamp");
      }
    },
  });

  return dbPromise;
}

/**
 * Add item to sync queue
 */
export async function addToQueue(item: SyncQueueItem): Promise<void> {
  const db = await getDB();
  await db.add("syncQueue", item);
}

/**
 * Get all items from sync queue (ordered by timestamp)
 */
export async function getAllQueueItems(): Promise<SyncQueueItem[]> {
  const db = await getDB();
  return db.getAllFromIndex("syncQueue", "timestamp");
}

/**
 * Remove item from sync queue
 */
export async function removeFromQueue(id: string): Promise<void> {
  const db = await getDB();
  await db.delete("syncQueue", id);
}

/**
 * Update item in sync queue (for retry tracking)
 */
export async function updateQueueItem(item: SyncQueueItem): Promise<void> {
  const db = await getDB();
  await db.put("syncQueue", item);
}

/**
 * Clear all items from sync queue
 */
export async function clearQueue(): Promise<void> {
  const db = await getDB();
  const tx = db.transaction("syncQueue", "readwrite");
  await tx.store.clear();
  await tx.done;
}

/**
 * Get queue size
 */
export async function getQueueSize(): Promise<number> {
  const db = await getDB();
  return db.count("syncQueue");
}
