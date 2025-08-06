export interface AuditEntry {
  id: string;
  timestamp: string;
  userId: string;
  documentId: string;
  documentType: 'Invoice' | 'Article' | 'Customer' | 'Project';
  action: 'Created' | 'Updated' | 'Deleted' | 'Status Changed';
  changes?: {
    field: string;
    oldValue: any;
    newValue: any;
  }[];
  metadata?: Record<string, any>;
}

export interface AuditLogQuery {
  documentId?: string;
  documentType?: string;
  userId?: string;
  fromDate?: string;
  toDate?: string;
}
