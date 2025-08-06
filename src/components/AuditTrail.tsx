import React, { useState } from 'react';
import { useAuditLogs } from '../hooks/useAudit';
import { Calendar, User } from 'lucide-react';
import { format } from 'date-fns';

interface AuditTrailProps {
  documentId?: string;
  documentType?: string;
  compact?: boolean;
}

const AuditTrail: React.FC<AuditTrailProps> = ({ 
  documentId, 
  documentType,
  compact = false 
}) => {
  const [dateRange, setDateRange] = useState<{from?: string, to?: string}>({});
  const [userId, setUserId] = useState<string>('');
  
  const { data: auditLogs = [], isLoading } = useAuditLogs({
    documentId,
    documentType,
    userId: userId || undefined,
    fromDate: dateRange.from,
    toDate: dateRange.to
  });

  if (isLoading) {
    return <div className="py-4 text-center text-gray-500">Lade Änderungsverlauf...</div>;
  }
  
  if (!auditLogs || auditLogs.length === 0) {
    return <div className="py-4 text-center text-gray-500">Keine Änderungen gefunden</div>;
  }

  if (compact) {
    return (
      <div className="space-y-2 text-sm">
        {auditLogs.slice(0, 5).map(log => (
          <div key={log.id} className="flex items-center justify-between py-1 border-b border-gray-100">
            <span className="text-gray-600">
              {format(new Date(log.timestamp), 'dd.MM.yyyy HH:mm')}
            </span>
            <span className="px-2 py-0.5 rounded-full text-xs">
              {log.action}
            </span>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-sm p-6">
      <div className="flex flex-wrap gap-4 mb-6">
        <div className="flex-1 min-w-[200px]">
          <div className="flex items-center border border-gray-300 rounded-md p-2">
            <Calendar className="w-5 h-5 text-gray-400 mr-2" />
            <input
              type="date"
              className="flex-1 border-none focus:ring-0"
              onChange={(e) => setDateRange(prev => ({ ...prev, from: e.target.value }))}
            />
            <span className="mx-2 text-gray-400">-</span>
            <input
              type="date"
              className="flex-1 border-none focus:ring-0"
              onChange={(e) => setDateRange(prev => ({ ...prev, to: e.target.value }))}
            />
          </div>
        </div>
        
        <div className="flex-1 min-w-[200px]">
          <div className="flex items-center border border-gray-300 rounded-md p-2">
            <User className="w-5 h-5 text-gray-400 mr-2" />
            <select
              className="flex-1 border-none focus:ring-0"
              value={userId}
              onChange={(e) => setUserId(e.target.value)}
            >
              <option value="">Alle Benutzer</option>
              <option value="user1">Max Mustermann</option>
              <option value="user2">Anna Schmidt</option>
            </select>
          </div>
        </div>
      </div>

      <div className="space-y-4">
        {auditLogs.map(log => (
          <div key={log.id} className="border-l-2 border-gray-200 pl-4">
            <div className="text-sm text-gray-500">
              {format(new Date(log.timestamp), 'dd.MM.yyyy HH:mm')}
            </div>
            <div className="font-medium">{log.action}</div>
            {log.changes && (
              <div className="mt-1 text-sm text-gray-600">
                {log.changes.map((change, i) => (
                  <div key={i}>{change.field}: {change.newValue}</div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default AuditTrail;
