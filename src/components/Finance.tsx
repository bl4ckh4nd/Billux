import React from 'react';
import { 
  Euro, 
  TrendingUp, 
  Calendar,
  Clock,
  AlertCircle,
  Receipt,
  CreditCard,
  DollarSign,
  BarChart3,
  Activity
} from 'lucide-react';
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend
} from 'recharts';
import { useFinanceAnalytics, usePaymentAnalytics } from '../hooks/useAnalytics';
import { format } from 'date-fns';
import { de } from 'date-fns/locale';

const COLORS = {
  primary: '#3B82F6',
  success: '#10B981',
  warning: '#F59E0B',
  danger: '#EF4444',
  info: '#8B5CF6',
  secondary: '#6B7280'
};

interface FinanceCardProps {
  title: string;
  value: string | number;
  icon: React.ElementType;
  subtitle?: string;
  trend?: number;
  color?: string;
}

const FinanceCard: React.FC<FinanceCardProps> = ({ 
  title, 
  value, 
  icon: Icon, 
  subtitle, 
  trend,
  color = COLORS.primary 
}) => {
  return (
    <div className="card p-6">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-sm font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>
            {title}
          </p>
          <p className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>
            {value}
          </p>
          {subtitle && (
            <p className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>
              {subtitle}
            </p>
          )}
          {trend !== undefined && (
            <p className={`text-sm mt-2 font-medium ${trend >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {trend >= 0 ? '+' : ''}{trend}% vs. Vormonat
            </p>
          )}
        </div>
        <div 
          className="p-3 rounded-lg"
          style={{ backgroundColor: `${color}20` }}
        >
          <Icon className="w-6 h-6" style={{ color }} />
        </div>
      </div>
    </div>
  );
};

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('de-DE', {
    style: 'currency',
    currency: 'EUR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
};

const Finance: React.FC = () => {
  const { 
    cashFlow, 
    taxAnalysis, 
    agingData, 
    paymentVelocity, 
    upcomingPayments 
  } = useFinanceAnalytics();
  
  const { methodDistribution } = usePaymentAnalytics();

  // Calculate current cash balance
  const currentBalance = cashFlow.length > 0 
    ? cashFlow[cashFlow.length - 1].balance 
    : 0;

  // Calculate cash flow trend
  const cashFlowTrend = cashFlow.length >= 2
    ? ((cashFlow[cashFlow.length - 1].inflow - cashFlow[cashFlow.length - 2].inflow) / 
       cashFlow[cashFlow.length - 2].inflow) * 100
    : 0;

  return (
    <div className="p-6 space-y-6" style={{ backgroundColor: 'var(--bg-secondary)' }}>
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold" style={{ color: 'var(--text-primary)' }}>
            Finanzen
          </h1>
          <p className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>
            Detaillierte Finanzanalyse und Cashflow-Management
          </p>
        </div>
        <div className="text-sm" style={{ color: 'var(--text-secondary)' }}>
          {format(new Date(), 'EEEE, d. MMMM yyyy', { locale: de })}
        </div>
      </div>

      {/* Key Financial Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <FinanceCard
          title="Aktueller Kontostand"
          value={formatCurrency(currentBalance)}
          icon={DollarSign}
          subtitle="Basierend auf erfassten Zahlungen"
          color={COLORS.primary}
        />
        <FinanceCard
          title="Durchschn. Zahlungsziel"
          value={`${Math.round(paymentVelocity.averageDaysToPayment)} Tage`}
          icon={Clock}
          subtitle={`Median: ${Math.round(paymentVelocity.medianDaysToPayment)} Tage`}
          color={COLORS.info}
        />
        <FinanceCard
          title="Offene Forderungen"
          value={formatCurrency(agingData.reduce((sum, bucket) => sum + bucket.amount, 0))}
          icon={Receipt}
          subtitle={`${agingData.reduce((sum, bucket) => sum + bucket.count, 0)} Rechnungen`}
          color={COLORS.warning}
        />
        <FinanceCard
          title="MwSt. Verbindlichkeiten"
          value={formatCurrency(taxAnalysis.totalVat)}
          icon={Euro}
          subtitle="Aus bezahlten Rechnungen"
          color={COLORS.secondary}
        />
      </div>

      {/* Cash Flow Analysis */}
      <div className="card p-6">
        <h2 className="text-xl font-semibold mb-4" style={{ color: 'var(--text-primary)' }}>
          Cashflow-Analyse
        </h2>
        <ResponsiveContainer width="100%" height={350}>
          <AreaChart data={cashFlow}>
            <defs>
              <linearGradient id="colorInflow" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={COLORS.success} stopOpacity={0.8}/>
                <stop offset="95%" stopColor={COLORS.success} stopOpacity={0.1}/>
              </linearGradient>
              <linearGradient id="colorBalance" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={COLORS.primary} stopOpacity={0.8}/>
                <stop offset="95%" stopColor={COLORS.primary} stopOpacity={0.1}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
            <XAxis 
              dataKey="month" 
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
            <Legend />
            <Area
              type="monotone"
              dataKey="inflow"
              name="Einnahmen"
              stroke={COLORS.success}
              strokeWidth={2}
              fillOpacity={1}
              fill="url(#colorInflow)"
            />
            <Area
              type="monotone"
              dataKey="balance"
              name="Kontostand"
              stroke={COLORS.primary}
              strokeWidth={2}
              fillOpacity={1}
              fill="url(#colorBalance)"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Tax Analysis */}
        <div className="card p-6">
          <h2 className="text-xl font-semibold mb-4" style={{ color: 'var(--text-primary)' }}>
            Steueranalyse
          </h2>
          <div className="space-y-4">
            <div className="grid grid-cols-3 gap-4">
              <div>
                <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>Brutto</p>
                <p className="text-lg font-semibold" style={{ color: 'var(--text-primary)' }}>
                  {formatCurrency(taxAnalysis.totalGross)}
                </p>
              </div>
              <div>
                <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>Netto</p>
                <p className="text-lg font-semibold" style={{ color: 'var(--text-primary)' }}>
                  {formatCurrency(taxAnalysis.totalNet)}
                </p>
              </div>
              <div>
                <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>MwSt.</p>
                <p className="text-lg font-semibold" style={{ color: 'var(--text-primary)' }}>
                  {formatCurrency(taxAnalysis.totalVat)}
                </p>
              </div>
            </div>
            
            <div className="border-t pt-4" style={{ borderColor: 'var(--border)' }}>
              <h3 className="text-sm font-medium mb-3" style={{ color: 'var(--text-secondary)' }}>
                Quartalsweise Steuerverbindlichkeiten
              </h3>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={taxAnalysis.quarterlyTax}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                  <XAxis 
                    dataKey="quarter" 
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
                  <Bar dataKey="vatAmount" name="MwSt." fill={COLORS.primary} radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Payment Methods */}
        <div className="card p-6">
          <h2 className="text-xl font-semibold mb-4" style={{ color: 'var(--text-primary)' }}>
            Zahlungsmethoden
          </h2>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={methodDistribution}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={100}
                paddingAngle={5}
                dataKey="count"
              >
                {methodDistribution.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={Object.values(COLORS)[index % Object.values(COLORS).length]} />
                ))}
              </Pie>
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: 'var(--bg-primary)',
                  border: '1px solid var(--border)',
                  borderRadius: '8px'
                }}
              />
            </PieChart>
          </ResponsiveContainer>
          <div className="mt-4 space-y-2">
            {methodDistribution.map((method, index) => (
              <div key={index} className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  <div 
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: Object.values(COLORS)[index % Object.values(COLORS).length] }}
                  />
                  <span style={{ color: 'var(--text-secondary)' }}>{method.method}</span>
                </div>
                <span style={{ color: 'var(--text-primary)' }} className="font-medium">
                  {method.count} ({method.percentage.toFixed(1)}%)
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Invoice Aging Analysis */}
      <div className="card p-6">
        <h2 className="text-xl font-semibold mb-4" style={{ color: 'var(--text-primary)' }}>
          Fälligkeitsanalyse
        </h2>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={agingData}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
              <XAxis 
                dataKey="bucket" 
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
              <Bar 
                dataKey="amount" 
                fill={COLORS.warning}
                radius={[4, 4, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
          
          <div className="space-y-3">
            {agingData.map((bucket, index) => (
              <div 
                key={index} 
                className="p-4 rounded-lg"
                style={{ backgroundColor: 'var(--bg-tertiary)' }}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="font-medium" style={{ color: 'var(--text-primary)' }}>
                    {bucket.bucket}
                  </span>
                  <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                    {bucket.count} Rechnungen
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-lg font-semibold" style={{ color: 'var(--text-primary)' }}>
                    {formatCurrency(bucket.amount)}
                  </span>
                  <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                    {bucket.percentage.toFixed(1)}%
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Payment Velocity Trend */}
      <div className="card p-6">
        <h2 className="text-xl font-semibold mb-4" style={{ color: 'var(--text-primary)' }}>
          Zahlungsgeschwindigkeit - Trend
        </h2>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={paymentVelocity.paymentTrend}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
            <XAxis 
              dataKey="month" 
              stroke="var(--text-secondary)"
              fontSize={12}
            />
            <YAxis 
              stroke="var(--text-secondary)"
              fontSize={12}
              label={{ value: 'Tage', angle: -90, position: 'insideLeft' }}
            />
            <Tooltip 
              contentStyle={{ 
                backgroundColor: 'var(--bg-primary)',
                border: '1px solid var(--border)',
                borderRadius: '8px'
              }}
              formatter={(value: number) => `${Math.round(value)} Tage`}
            />
            <Line 
              type="monotone" 
              dataKey="avgDays" 
              name="Durchschn. Zahlungsdauer"
              stroke={COLORS.primary} 
              strokeWidth={2}
              dot={{ fill: COLORS.primary }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Financial Calendar */}
      <div className="card p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold" style={{ color: 'var(--text-primary)' }}>
            Finanzkalender - Kommende Zahlungen
          </h2>
          <Calendar className="w-5 h-5" style={{ color: 'var(--text-secondary)' }} />
        </div>
        {upcomingPayments.length > 0 ? (
          <div className="space-y-3">
            {upcomingPayments.slice(0, 10).map((item) => (
              <div 
                key={item.invoice.id}
                className="flex items-center justify-between p-3 rounded-lg"
                style={{ backgroundColor: 'var(--bg-tertiary)' }}
              >
                <div className="flex-1">
                  <p className="font-medium" style={{ color: 'var(--text-primary)' }}>
                    {item.invoice.number} - {item.invoice.customerName}
                  </p>
                  <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                    Fällig: {format(new Date(item.invoice.dueDate), 'dd.MM.yyyy', { locale: de })}
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-semibold" style={{ color: 'var(--text-primary)' }}>
                    {formatCurrency(item.invoice.total)}
                  </p>
                  <p className={`text-sm ${
                    item.daysUntilDue <= 7 ? 'text-red-600' : 
                    item.daysUntilDue <= 14 ? 'text-yellow-600' : 
                    'text-green-600'
                  }`}>
                    in {item.daysUntilDue} Tagen
                  </p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-center py-8" style={{ color: 'var(--text-secondary)' }}>
            Keine kommenden Zahlungen in den nächsten 30 Tagen
          </p>
        )}
      </div>
    </div>
  );
};

export default Finance;