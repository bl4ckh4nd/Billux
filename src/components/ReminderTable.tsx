import React, { useState } from 'react';
import { 
  Send, 
  AlertCircle, 
  Clock,
  ChevronRight,
  Calendar
} from 'lucide-react';
import { format, differenceInDays } from 'date-fns';
import { de } from 'date-fns/locale';
import { Invoice } from '../types/invoice';
import { ReminderLevel } from '../types/reminder';
import { useInvoiceReminders } from '../hooks/useReminders';

interface ReminderTableProps {
  invoices: Invoice[];
  onInvoiceClick?: (invoiceId: string) => void;
  onCreateReminder: (invoiceId: string, level: ReminderLevel) => void;
}

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('de-DE', {
    style: 'currency',
    currency: 'EUR',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
};

const getLevelName = (level: ReminderLevel) => {
  switch (level) {
    case ReminderLevel.FRIENDLY:
      return 'Zahlungserinnerung';
    case ReminderLevel.FIRST_REMINDER:
      return '1. Mahnung';
    case ReminderLevel.SECOND_REMINDER:
      return '2. Mahnung';
    case ReminderLevel.FINAL_NOTICE:
      return 'Letzte Mahnung';
    case ReminderLevel.LEGAL_ACTION:
      return 'Inkasso';
    default:
      return '';
  }
};

const ReminderTableRow: React.FC<{
  invoice: Invoice;
  onInvoiceClick?: (invoiceId: string) => void;
  onCreateReminder: (invoiceId: string, level: ReminderLevel) => void;
}> = ({ invoice, onInvoiceClick, onCreateReminder }) => {
  const [showActions, setShowActions] = useState(false);
  const { nextReminderLevel, canSendReminder, reminderHistory } = useInvoiceReminders(invoice.id);
  
  const daysOverdue = differenceInDays(new Date(), new Date(invoice.dueDate));
  const urgencyColor = daysOverdue > 60 ? '#EF4444' : daysOverdue > 30 ? '#F59E0B' : '#3B82F6';

  return (
    <tr className="hover:bg-gray-50 transition-colors">
      <td className="px-6 py-4">
        <div className="flex items-center gap-3">
          <div 
            className="w-2 h-2 rounded-full"
            style={{ backgroundColor: urgencyColor }}
          />
          <div>
            <button
              onClick={() => onInvoiceClick?.(invoice.id)}
              className="font-medium hover:underline"
              style={{ color: 'var(--text-primary)' }}
            >
              {invoice.number}
            </button>
            <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
              {invoice.customer || invoice.customerName}
            </p>
          </div>
        </div>
      </td>
      
      <td className="px-6 py-4">
        <div>
          <p className="font-medium" style={{ color: 'var(--text-primary)' }}>
            {formatCurrency(invoice.amount)}
          </p>
          {invoice.totalReminderFees && invoice.totalReminderFees > 0 && (
            <p className="text-sm" style={{ color: urgencyColor }}>
              + {formatCurrency(invoice.totalReminderFees)} Gebühren
            </p>
          )}
        </div>
      </td>
      
      <td className="px-6 py-4">
        <div className="flex items-center gap-2">
          <Calendar className="w-4 h-4" style={{ color: 'var(--text-secondary)' }} />
          <span className="text-sm" style={{ color: 'var(--text-primary)' }}>
            {format(new Date(invoice.dueDate), 'dd.MM.yyyy', { locale: de })}
          </span>
        </div>
      </td>
      
      <td className="px-6 py-4">
        <div className="flex items-center gap-2">
          <Clock className="w-4 h-4" style={{ color: urgencyColor }} />
          <span className="font-medium" style={{ color: urgencyColor }}>
            {daysOverdue} Tage
          </span>
        </div>
      </td>
      
      <td className="px-6 py-4">
        {invoice.lastReminderLevel ? (
          <div className="flex items-center gap-2">
            <span 
              className="px-2 py-1 rounded-full text-xs font-medium"
              style={{ 
                backgroundColor: `${urgencyColor}20`,
                color: urgencyColor
              }}
            >
              {getLevelName(invoice.lastReminderLevel)}
            </span>
            {invoice.lastReminderDate && (
              <span className="text-xs" style={{ color: 'var(--text-secondary)' }}>
                {format(new Date(invoice.lastReminderDate), 'dd.MM.', { locale: de })}
              </span>
            )}
          </div>
        ) : (
          <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>
            Keine Mahnung
          </span>
        )}
      </td>
      
      <td className="px-6 py-4">
        <div className="flex items-center gap-2">
          {nextReminderLevel && (
            <div className="relative">
              <button
                onClick={() => setShowActions(!showActions)}
                className="flex items-center gap-2 px-3 py-1.5 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors text-sm"
              >
                <Send className="w-4 h-4" />
                Mahnen
              </button>
              
              {showActions && (
                <div className="absolute right-0 mt-2 w-56 bg-white rounded-lg shadow-lg border z-10"
                     style={{ borderColor: 'var(--border)' }}>
                  <div className="p-2">
                    {[
                      ReminderLevel.FRIENDLY,
                      ReminderLevel.FIRST_REMINDER,
                      ReminderLevel.SECOND_REMINDER,
                      ReminderLevel.FINAL_NOTICE
                    ].map(level => {
                      const isEnabled = canSendReminder(level);
                      const isNext = level === nextReminderLevel;
                      
                      return (
                        <button
                          key={level}
                          onClick={() => {
                            if (isEnabled) {
                              onCreateReminder(invoice.id, level);
                              setShowActions(false);
                            }
                          }}
                          disabled={!isEnabled}
                          className={`w-full text-left px-3 py-2 rounded text-sm transition-colors ${
                            isEnabled 
                              ? 'hover:bg-gray-50' 
                              : 'opacity-50 cursor-not-allowed'
                          } ${isNext ? 'font-medium' : ''}`}
                        >
                          <div className="flex items-center justify-between">
                            <span>{getLevelName(level)}</span>
                            {isNext && (
                              <span className="text-xs px-2 py-0.5 bg-blue-100 text-blue-700 rounded">
                                Empfohlen
                              </span>
                            )}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          )}
          
          <button
            onClick={() => onInvoiceClick?.(invoice.id)}
            className="p-1.5 hover:bg-gray-100 rounded transition-colors"
          >
            <ChevronRight className="w-4 h-4" style={{ color: 'var(--text-secondary)' }} />
          </button>
        </div>
      </td>
    </tr>
  );
};

const ReminderTable: React.FC<ReminderTableProps> = ({ invoices, onInvoiceClick, onCreateReminder }) => {
  const [sortBy, setSortBy] = useState<'dueDate' | 'amount' | 'daysOverdue'>('daysOverdue');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  
  const sortedInvoices = [...invoices].sort((a, b) => {
    let comparison = 0;
    
    switch (sortBy) {
      case 'dueDate':
        comparison = new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
        break;
      case 'amount':
        comparison = a.amount - b.amount;
        break;
      case 'daysOverdue':
        const daysA = differenceInDays(new Date(), new Date(a.dueDate));
        const daysB = differenceInDays(new Date(), new Date(b.dueDate));
        comparison = daysA - daysB;
        break;
    }
    
    return sortOrder === 'asc' ? comparison : -comparison;
  });

  const handleSort = (column: typeof sortBy) => {
    if (sortBy === column) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(column);
      setSortOrder('desc');
    }
  };

  if (invoices.length === 0) {
    return (
      <div className="card p-12 text-center">
        <AlertCircle className="w-12 h-12 mx-auto mb-4" style={{ color: 'var(--text-secondary)' }} />
        <h3 className="text-lg font-medium mb-2" style={{ color: 'var(--text-primary)' }}>
          Keine überfälligen Rechnungen
        </h3>
        <p style={{ color: 'var(--text-secondary)' }}>
          Alle Rechnungen sind bezahlt oder noch nicht fällig.
        </p>
      </div>
    );
  }

  return (
    <div className="card overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider"
                  style={{ color: 'var(--text-secondary)' }}>
                Rechnung
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider cursor-pointer"
                  style={{ color: 'var(--text-secondary)' }}
                  onClick={() => handleSort('amount')}>
                Betrag {sortBy === 'amount' && (sortOrder === 'asc' ? '↑' : '↓')}
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider cursor-pointer"
                  style={{ color: 'var(--text-secondary)' }}
                  onClick={() => handleSort('dueDate')}>
                Fälligkeit {sortBy === 'dueDate' && (sortOrder === 'asc' ? '↑' : '↓')}
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider cursor-pointer"
                  style={{ color: 'var(--text-secondary)' }}
                  onClick={() => handleSort('daysOverdue')}>
                Überfällig {sortBy === 'daysOverdue' && (sortOrder === 'asc' ? '↑' : '↓')}
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider"
                  style={{ color: 'var(--text-secondary)' }}>
                Letzte Mahnung
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider"
                  style={{ color: 'var(--text-secondary)' }}>
                Aktionen
              </th>
            </tr>
          </thead>
          <tbody className="divide-y" style={{ borderColor: 'var(--border)' }}>
            {sortedInvoices.map(invoice => (
              <ReminderTableRow
                key={invoice.id}
                invoice={invoice}
                onInvoiceClick={onInvoiceClick}
                onCreateReminder={onCreateReminder}
              />
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default ReminderTable;