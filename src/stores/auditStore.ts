import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { AuditEntry, AuditLogQuery } from '../types/audit';

interface AuditBatch {
  id: string;
  entries: AuditEntry[];
  timestamp: string;
  synced: boolean;
}

interface AuditState {
  // In-memory audit entries (before API sync)
  pendingEntries: AuditEntry[];
  
  // Batched entries for efficient API sync
  batches: AuditBatch[];
  
  // Cached audit logs from API
  cachedLogs: AuditEntry[];
  
  // Sync status
  isSyncing: boolean;
  lastSyncTime: string | null;
  syncErrors: string[];
  
  // Auto-sync settings
  autoSyncEnabled: boolean;
  batchSize: number;
  syncInterval: number; // in milliseconds
  
  // Actions - Entry management
  addEntry: (entry: Omit<AuditEntry, 'id' | 'timestamp'>) => void;
  addBatchEntries: (entries: Omit<AuditEntry, 'id' | 'timestamp'>[]) => void;
  removeEntry: (id: string) => void;
  clearPendingEntries: () => void;
  
  // Actions - Batch management
  createBatch: (entries: AuditEntry[]) => string;
  markBatchSynced: (batchId: string) => void;
  removeBatch: (batchId: string) => void;
  clearSyncedBatches: () => void;
  
  // Actions - Cache management
  setCachedLogs: (logs: AuditEntry[]) => void;
  addToCachedLogs: (logs: AuditEntry[]) => void;
  clearCachedLogs: () => void;
  
  // Actions - Sync management
  setSyncing: (syncing: boolean) => void;
  setLastSyncTime: (time: string) => void;
  addSyncError: (error: string) => void;
  clearSyncErrors: () => void;
  
  // Actions - Settings
  setAutoSyncEnabled: (enabled: boolean) => void;
  setBatchSize: (size: number) => void;
  setSyncInterval: (interval: number) => void;
  
  // Utility actions
  getPendingCount: () => number;
  getUnsyncedBatchCount: () => number;
  shouldCreateBatch: () => boolean;
  getAllAuditEntries: () => AuditEntry[];
  getFilteredEntries: (query: AuditLogQuery) => AuditEntry[];
  
  // Computed values
  hasUnsyncedData: () => boolean;
  getNextSyncTime: () => string | null;
}

export const useAuditStore = create<AuditState>()(
  persist(
    (set, get) => ({
      pendingEntries: [],
      batches: [],
      cachedLogs: [],
      isSyncing: false,
      lastSyncTime: null,
      syncErrors: [],
      autoSyncEnabled: true,
      batchSize: 10,
      syncInterval: 60000, // 1 minute
      
      // Entry management
      addEntry: (entry) => {
        const newEntry: AuditEntry = {
          ...entry,
          id: Math.random().toString(36).slice(2),
          timestamp: new Date().toISOString(),
        };
        
        set((state) => ({
          pendingEntries: [...state.pendingEntries, newEntry],
        }));
        
        // Auto-create batch if threshold reached
        if (get().shouldCreateBatch()) {
          const entries = get().pendingEntries.slice(-get().batchSize);
          get().createBatch(entries);
        }
      },
      
      addBatchEntries: (entries) => {
        const newEntries: AuditEntry[] = entries.map(entry => ({
          ...entry,
          id: Math.random().toString(36).slice(2),
          timestamp: new Date().toISOString(),
        }));
        
        set((state) => ({
          pendingEntries: [...state.pendingEntries, ...newEntries],
        }));
      },
      
      removeEntry: (id) => {
        set((state) => ({
          pendingEntries: state.pendingEntries.filter(entry => entry.id !== id),
        }));
      },
      
      clearPendingEntries: () => {
        set({ pendingEntries: [] });
      },
      
      // Batch management
      createBatch: (entries) => {
        const batchId = Math.random().toString(36).slice(2);
        const newBatch: AuditBatch = {
          id: batchId,
          entries: [...entries],
          timestamp: new Date().toISOString(),
          synced: false,
        };
        
        set((state) => ({
          batches: [...state.batches, newBatch],
          pendingEntries: state.pendingEntries.filter(
            entry => !entries.some(batchEntry => batchEntry.id === entry.id)
          ),
        }));
        
        return batchId;
      },
      
      markBatchSynced: (batchId) => {
        set((state) => ({
          batches: state.batches.map(batch =>
            batch.id === batchId ? { ...batch, synced: true } : batch
          ),
        }));
      },
      
      removeBatch: (batchId) => {
        set((state) => ({
          batches: state.batches.filter(batch => batch.id !== batchId),
        }));
      },
      
      clearSyncedBatches: () => {
        set((state) => ({
          batches: state.batches.filter(batch => !batch.synced),
        }));
      },
      
      // Cache management
      setCachedLogs: (logs) => {
        set({ cachedLogs: logs });
      },
      
      addToCachedLogs: (logs) => {
        set((state) => ({
          cachedLogs: [...state.cachedLogs, ...logs],
        }));
      },
      
      clearCachedLogs: () => {
        set({ cachedLogs: [] });
      },
      
      // Sync management
      setSyncing: (syncing) => {
        set({ isSyncing: syncing });
      },
      
      setLastSyncTime: (time) => {
        set({ lastSyncTime: time });
      },
      
      addSyncError: (error) => {
        set((state) => ({
          syncErrors: [...state.syncErrors, error],
        }));
      },
      
      clearSyncErrors: () => {
        set({ syncErrors: [] });
      },
      
      // Settings
      setAutoSyncEnabled: (enabled) => {
        set({ autoSyncEnabled: enabled });
      },
      
      setBatchSize: (size) => {
        set({ batchSize: Math.max(1, Math.min(100, size)) });
      },
      
      setSyncInterval: (interval) => {
        set({ syncInterval: Math.max(10000, interval) }); // Min 10 seconds
      },
      
      // Utility functions
      getPendingCount: () => {
        return get().pendingEntries.length;
      },
      
      getUnsyncedBatchCount: () => {
        return get().batches.filter(batch => !batch.synced).length;
      },
      
      shouldCreateBatch: () => {
        const state = get();
        return state.pendingEntries.length >= state.batchSize;
      },
      
      getAllAuditEntries: () => {
        const state = get();
        const allEntries = [
          ...state.cachedLogs,
          ...state.pendingEntries,
          ...state.batches.flatMap(batch => batch.entries),
        ];
        
        // Remove duplicates and sort by timestamp
        const uniqueEntries = Array.from(
          new Map(allEntries.map(entry => [entry.id, entry])).values()
        );
        
        return uniqueEntries.sort((a, b) => 
          new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
        );
      },
      
      getFilteredEntries: (query) => {
        const allEntries = get().getAllAuditEntries();
        
        return allEntries.filter(entry => {
          if (query.documentId && entry.documentId !== query.documentId) {
            return false;
          }
          if (query.documentType && entry.documentType !== query.documentType) {
            return false;
          }
          if (query.userId && entry.userId !== query.userId) {
            return false;
          }
          if (query.fromDate && entry.timestamp < query.fromDate) {
            return false;
          }
          if (query.toDate && entry.timestamp > query.toDate) {
            return false;
          }
          return true;
        });
      },
      
      hasUnsyncedData: () => {
        const state = get();
        return state.pendingEntries.length > 0 || 
               state.batches.some(batch => !batch.synced);
      },
      
      getNextSyncTime: () => {
        const state = get();
        if (!state.autoSyncEnabled || !state.lastSyncTime) {
          return null;
        }
        
        const nextSync = new Date(state.lastSyncTime);
        nextSync.setTime(nextSync.getTime() + state.syncInterval);
        return nextSync.toISOString();
      },
    }),
    {
      name: 'audit-store',
      partialize: (state) => ({
        pendingEntries: state.pendingEntries,
        batches: state.batches,
        cachedLogs: state.cachedLogs,
        lastSyncTime: state.lastSyncTime,
        syncErrors: state.syncErrors,
        autoSyncEnabled: state.autoSyncEnabled,
        batchSize: state.batchSize,
        syncInterval: state.syncInterval,
      }),
    }
  )
);