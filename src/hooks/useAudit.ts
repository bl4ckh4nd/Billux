import { useMutation, useQuery } from '@tanstack/react-query';
import { useAuditStore } from '../stores/auditStore';
import type { AuditEntry, AuditLogQuery } from '../types/audit';

const logAuditEvent = async (auditEntry: Omit<AuditEntry, 'id' | 'timestamp'>): Promise<AuditEntry> => {
  // Mock implementation - replace with actual API call
  const newEntry: AuditEntry = {
    ...auditEntry,
    id: Math.random().toString(36).slice(2),
    timestamp: new Date().toISOString()
  };
  return Promise.resolve(newEntry);
};

export const useLogAudit = () => {
  const { addEntry } = useAuditStore();
  
  return useMutation({
    mutationFn: async (auditEntry: Omit<AuditEntry, 'id' | 'timestamp'>) => {
      // Add to local store immediately
      addEntry(auditEntry);
      
      // Then attempt to sync to server
      try {
        const result = await logAuditEvent(auditEntry);
        return result;
      } catch (error) {
        // If server sync fails, entry remains in pending state
        throw error;
      }
    }
  });
};

const getAuditLogs = async (query: AuditLogQuery = {}): Promise<AuditEntry[]> => {
  // Mock implementation - replace with actual API call
  return Promise.resolve([]);
};

export const useAuditLogs = (query: AuditLogQuery = {}) => {
  const { getFilteredEntries, setCachedLogs } = useAuditStore();
  
  return useQuery({
    queryKey: ['auditLogs', query],
    queryFn: async () => {
      const serverLogs = await getAuditLogs(query);
      setCachedLogs(serverLogs);
      return serverLogs;
    },
    initialData: () => {
      // Return filtered entries from store as initial data
      return getFilteredEntries(query);
    },
    select: (data) => {
      // Always return combined data from store (includes local + server data)
      return getFilteredEntries(query);
    }
  });
};
