import React, { useState } from 'react';
import { 
  AlertCircle, 
  Clock, 
  TrendingUp,
  ChevronRight,
  Mail
} from 'lucide-react';
import {
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer
} from 'recharts';
import { format } from 'date-fns';
import { de } from 'date-fns/locale';
import { 
  useOverdueInvoices, 
  useReminderStatistics,
  useReminders,
  useCreateReminder
} from '../hooks/useReminders';
import { ReminderLevel, ReminderStatus } from '../types/reminder';
import ReminderTable from './ReminderTable';

const COLORS = {
  primary: '#10B981',
  warning: '#F59E0B',
  danger: '#EF4444',
  info: '#3B82F6',
  secondary: '#6B7280'
};

const LEVEL_COLORS = {
  [ReminderLevel.FRIENDLY]: COLORS.info,
  [ReminderLevel.FIRST_REMINDER]: COLORS.warning,
  [ReminderLevel.SECOND_REMINDER]: '#F97316',
  [ReminderLevel.FINAL_NOTICE]: COLORS.danger,
  [ReminderLevel.LEGAL_ACTION]: '#7C3AED'
};

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('de-DE', {
    style: 'currency',
    currency: 'EUR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
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

interface RemindersProps {
  onInvoiceClick?: (invoiceId: string) => void;
}

const Reminders: React.FC<RemindersProps> = ({ onInvoiceClick }) => {
  const [selectedTab, setSelectedTab] = useState<'overdue' | 'history'>('overdue');
  
  const { data: overdueInvoices, isLoading: overdueLoading } = useOverdueInvoices();
  const { data: statistics, isLoading: statsLoading } = useReminderStatistics();
  const { data: allReminders } = useReminders();
  
  const createReminder = useCreateReminder();

  if (overdueLoading || statsLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="loading-spinner" />
      </div>
    );
  }

  const stats = statistics || {
    totalOverdue: 0,
    totalAmount: 0,
    byLevel: [],
    byAge: [],
    averageDaysOverdue: 0,
    collectionRate: 0
  };

  // Prepare chart data
  const levelChartData = stats.byLevel
    .filter(item => item.count > 0)
    .map(item => ({
      name: getLevelName(item.level),
      value: item.amount,
      count: item.count
    }));

  const ageChartData = stats.byAge.map(item => ({
    name: item.range + ' Tage',
    amount: item.amount,
    count: item.count
  }));

  return (
    <div className="p-6 space-y-6" style={{ backgroundColor: 'var(--bg-secondary)' }}>
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold" style={{ color: 'var(--text-primary)' }}>
            Mahnwesen
          </h1>
          <p className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>
            {format(new Date(), 'EEEE, d. MMMM yyyy', { locale: de })}
          </p>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="card p-6">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>
                Überfällige Rechnungen
              </p>
              <p className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>
                {stats.totalOverdue}
              </p>
              <p className="text-sm mt-1" style={{ color: COLORS.danger }}>
                {formatCurrency(stats.totalAmount)}
              </p>
            </div>
            <div className="p-3 rounded-lg" style={{ backgroundColor: `${COLORS.danger}20` }}>
              <AlertCircle className="w-6 h-6" style={{ color: COLORS.danger }} />
            </div>
          </div>
        </div>

        <div className="card p-6">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>
                Durchschn. Überfällig
              </p>
              <p className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>
                {Math.round(stats.averageDaysOverdue)} Tage
              </p>
              <p className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>
                seit Fälligkeit
              </p>
            </div>
            <div className="p-3 rounded-lg" style={{ backgroundColor: `${COLORS.warning}20` }}>
              <Clock className="w-6 h-6" style={{ color: COLORS.warning }} />
            </div>
          </div>
        </div>

        <div className="card p-6">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>
                Inkassoquote
              </p>
              <p className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>
                {stats.collectionRate.toFixed(1)}%
              </p>
              <p className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>
                Erfolgsrate
              </p>
            </div>
            <div className="p-3 rounded-lg" style={{ backgroundColor: `${COLORS.primary}20` }}>
              <TrendingUp className="w-6 h-6" style={{ color: COLORS.primary }} />
            </div>
          </div>
        </div>

        <div className="card p-6">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>
                Offene Mahnungen
              </p>
              <p className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>
                {allReminders?.filter(r => r.status === ReminderStatus.SENT).length || 0}
              </p>
              <p className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>
                aktiv
              </p>
            </div>
            <div className="p-3 rounded-lg" style={{ backgroundColor: `${COLORS.info}20` }}>
              <Mail className="w-6 h-6" style={{ color: COLORS.info }} />
            </div>
          </div>
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Reminder Level Distribution */}
        <div className="card p-6">
          <h2 className="text-xl font-semibold mb-4" style={{ color: 'var(--text-primary)' }}>
            Mahnstufen
          </h2>
          {levelChartData.length > 0 ? (
            <>
              <ResponsiveContainer width="100%" height={250}>
                <PieChart>
                  <Pie
                    data={levelChartData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {levelChartData.map((entry, index) => {
                      const level = stats.byLevel[index]?.level || ReminderLevel.FRIENDLY;
                      return (
                        <Cell key={`cell-${index}`} fill={LEVEL_COLORS[level]} />
                      );
                    })}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'var(--bg-primary)',
                      border: '1px solid var(--border)',
                      borderRadius: '8px'
                    }}
                    formatter={(value: number) => formatCurrency(value)}
                  />
                </PieChart>
              </ResponsiveContainer>
              <div className="mt-4 space-y-2">
                {levelChartData.map((item, index) => {
                  const level = stats.byLevel[index]?.level || ReminderLevel.FRIENDLY;
                  return (
                    <div key={index} className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-2">
                        <div 
                          className="w-3 h-3 rounded-full"
                          style={{ backgroundColor: LEVEL_COLORS[level] }}
                        />
                        <span style={{ color: 'var(--text-secondary)' }}>{item.name}</span>
                      </div>
                      <span style={{ color: 'var(--text-primary)' }} className="font-medium">
                        {item.count} ({formatCurrency(item.value)})
                      </span>
                    </div>
                  );
                })}
              </div>
            </>
          ) : (
            <div className="flex items-center justify-center h-64 text-gray-400">
              <p>Keine aktiven Mahnungen</p>
            </div>
          )}
        </div>

        {/* Age Distribution */}
        <div className="card p-6">
          <h2 className="text-xl font-semibold mb-4" style={{ color: 'var(--text-primary)' }}>
            Überfälligkeitsdauer
          </h2>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={ageChartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
              <XAxis 
                dataKey="name" 
                stroke="var(--text-secondary)"
                fontSize={12}
              />
              <YAxis 
                stroke="var(--text-secondary)"
                fontSize={12}
                tickFormatter={(value) => `€${(value / 1000).toFixed(0)}k`}
              />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: 'var(--bg-primary)',
                  border: '1px solid var(--border)',
                  borderRadius: '8px'
                }}
                formatter={(value: number) => formatCurrency(value)}
              />
              <Bar dataKey="amount" fill={COLORS.warning} radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-4 border-b" style={{ borderColor: 'var(--border)' }}>
        <button
          onClick={() => setSelectedTab('overdue')}
          className={`pb-2 px-1 font-medium transition-colors ${
            selectedTab === 'overdue' 
              ? 'border-b-2' 
              : ''
          }`}
          style={{
            color: selectedTab === 'overdue' ? COLORS.primary : 'var(--text-secondary)',
            borderColor: selectedTab === 'overdue' ? COLORS.primary : 'transparent'
          }}
        >
          Überfällige Rechnungen
        </button>
        <button
          onClick={() => setSelectedTab('history')}
          className={`pb-2 px-1 font-medium transition-colors ${
            selectedTab === 'history' 
              ? 'border-b-2' 
              : ''
          }`}
          style={{
            color: selectedTab === 'history' ? COLORS.primary : 'var(--text-secondary)',
            borderColor: selectedTab === 'history' ? COLORS.primary : 'transparent'
          }}
        >
          Mahnhistorie
        </button>
      </div>

      {/* Content based on selected tab */}
      {selectedTab === 'overdue' ? (
        <ReminderTable 
          invoices={overdueInvoices || []}
          onInvoiceClick={onInvoiceClick}
          onCreateReminder={(invoiceId, level) => {
            createReminder.mutate({ invoiceId, level });
          }}
        />
      ) : (
        <div className="card p-6">
          <div className="space-y-4">
            {allReminders?.map((reminder) => (
              <div 
                key={reminder.id}
                className="flex items-center justify-between p-4 rounded-lg"
                style={{ backgroundColor: 'var(--bg-tertiary)' }}
              >
                <div className="flex-1">
                  <div className="flex items-center gap-3">
                    <span 
                      className="px-2 py-1 rounded-full text-xs font-medium"
                      style={{ 
                        backgroundColor: `${LEVEL_COLORS[reminder.level]}20`,
                        color: LEVEL_COLORS[reminder.level]
                      }}
                    >
                      {getLevelName(reminder.level)}
                    </span>
                    <span className="font-medium" style={{ color: 'var(--text-primary)' }}>
                      {reminder.invoiceNumber}
                    </span>
                    <span style={{ color: 'var(--text-secondary)' }}>
                      {reminder.customerName}
                    </span>
                  </div>
                  <div className="flex items-center gap-4 mt-2 text-sm" style={{ color: 'var(--text-secondary)' }}>
                    <span>Gesendet: {format(new Date(reminder.sentDate), 'dd.MM.yyyy', { locale: de })}</span>
                    <span>Betrag: {formatCurrency(reminder.totalAmount)}</span>
                    <span className={`px-2 py-1 rounded text-xs ${
                      reminder.status === ReminderStatus.PAID ? 'bg-green-100 text-green-800' :
                      reminder.status === ReminderStatus.SENT ? 'bg-yellow-100 text-yellow-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {reminder.status === ReminderStatus.PAID ? 'Bezahlt' :
                       reminder.status === ReminderStatus.SENT ? 'Versendet' :
                       reminder.status}
                    </span>
                  </div>
                </div>
                <button
                  onClick={() => onInvoiceClick?.(reminder.invoiceId)}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <ChevronRight className="w-5 h-5" style={{ color: 'var(--text-secondary)' }} />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default Reminders;