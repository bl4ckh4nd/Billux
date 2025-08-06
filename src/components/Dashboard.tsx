import React from 'react';
import { 
  Euro, 
  FileText, 
  AlertCircle, 
  TrendingUp, 
  ArrowUpRight,
  ArrowDownRight
} from 'lucide-react';
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer
} from 'recharts';
import { 
  useRevenueAnalytics, 
  useInvoiceAnalytics, 
  useCustomerAnalytics,
  useProjectAnalytics 
} from '../hooks/useAnalytics';
import { useInvoices } from '../hooks/useInvoices';
import { format } from 'date-fns';
import { de } from 'date-fns/locale';
import { useTranslation } from 'react-i18next';
import { useUIStore } from '../stores/uiStore';
import { formatCurrency as formatCurrencyUtil } from '../utils/i18n';

const COLORS = {
  primary: '#3B82F6',
  success: '#10B981',
  warning: '#F59E0B',
  danger: '#EF4444',
  info: '#8B5CF6',
  secondary: '#6B7280'
};

const STATUS_COLORS = {
  paid: COLORS.success,
  pending: COLORS.warning,
  overdue: COLORS.danger,
  draft: COLORS.secondary
};

interface KPICardProps {
  title: string;
  value: string | number;
  icon: React.ElementType;
  trend?: number;
  trendLabel?: string;
  color?: string;
}

const KPICard: React.FC<KPICardProps> = ({ title, value, icon: Icon, trend, trendLabel, color = COLORS.primary }) => {
  const isPositiveTrend = trend && trend > 0;
  
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
          {trend !== undefined && (
            <div className="flex items-center gap-1 mt-2">
              {isPositiveTrend ? (
                <ArrowUpRight className="w-4 h-4" style={{ color: COLORS.success }} />
              ) : (
                <ArrowDownRight className="w-4 h-4" style={{ color: COLORS.danger }} />
              )}
              <span 
                className="text-sm font-medium"
                style={{ color: isPositiveTrend ? COLORS.success : COLORS.danger }}
              >
                {Math.abs(trend).toFixed(1)}%
              </span>
              {trendLabel && (
                <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                  {trendLabel}
                </span>
              )}
            </div>
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

const formatCurrency = (value: number, language: string = 'de') => {
  return formatCurrencyUtil(value, { 
    minimumFractionDigits: 0, 
    maximumFractionDigits: 0 
  }, language as 'de' | 'en');
};

interface DashboardProps {
  onNavigate?: (view: string) => void;
  onInvoiceClick?: (invoiceId: string) => void;
}

const Dashboard: React.FC<DashboardProps> = ({ onNavigate, onInvoiceClick }) => {
  const { t } = useTranslation(['analytics', 'common', 'invoice']);
  const { preferences } = useUIStore();
  const { monthlyRevenue, metrics } = useRevenueAnalytics();
  const { statusDistribution } = useInvoiceAnalytics();
  const { topCustomers } = useCustomerAnalytics(5);
  const { projectMetrics } = useProjectAnalytics();
  const { invoices } = useInvoices();

  // Get recent invoices
  const recentInvoices = invoices
    ?.sort((a, b) => b.date.localeCompare(a.date))
    .slice(0, 5) || [];

  // Prepare chart data
  const revenueChartData = monthlyRevenue.slice(-12);
  const statusChartData = statusDistribution.map(item => ({
    name: item.status === 'paid' ? t('invoice:status.Bezahlt') : 
          item.status === 'pending' ? t('invoice:status.Offen') :
          item.status === 'overdue' ? t('invoice:status.Überfällig') : t('invoice:status.Entwurf'),
    value: item.amount,
    count: item.count
  }));

  const topCustomersChartData = topCustomers.map(item => ({
    name: item.customer.name,
    revenue: item.totalRevenue
  }));

  return (
    <div className="p-6 space-y-6" style={{ backgroundColor: 'var(--bg-secondary)' }}>
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold" style={{ color: 'var(--text-primary)' }}>
            {t('analytics:dashboard.title')}
          </h1>
          <p className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>
            {format(new Date(), 'EEEE, d. MMMM yyyy', { locale: preferences.language === 'de' ? de : undefined })}
          </p>
        </div>
        <button 
          onClick={() => onNavigate?.('invoice-new')} 
          className="btn-primary"
        >
          + {t('invoice:actions.create')}
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard
          title={t('analytics:revenue.mrr')}
          value={formatCurrency(metrics.mrr, preferences.language)}
          icon={Euro}
          trend={metrics.mrrGrowth}
          trendLabel={t('analytics:comparison.previousPeriod')}
          color={COLORS.primary}
        />
        <KPICard
          title={t('analytics:revenue.yearlyRevenue')}
          value={formatCurrency(metrics.ytd, preferences.language)}
          icon={TrendingUp}
          trend={metrics.ytdGrowth}
          trendLabel={t('analytics:comparison.samePeriodLastYear')}
          color={COLORS.success}
        />
        <KPICard
          title={t('analytics:invoices.overdueInvoices')}
          value={metrics.overdueInvoices}
          icon={AlertCircle}
          trend={metrics.overdueAmount > 0 ? -100 : 0}
          trendLabel={formatCurrency(metrics.overdueAmount, preferences.language)}
          color={COLORS.danger}
        />
        <KPICard
          title={t('analytics:invoices.collectionEfficiency')}
          value={`${metrics.collectionRate.toFixed(1)}%`}
          icon={FileText}
          color={COLORS.info}
        />
      </div>

      {/* Charts Row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Revenue Trend Chart */}
        <div className="lg:col-span-2 card p-6">
          <h2 className="text-xl font-semibold mb-4" style={{ color: 'var(--text-primary)' }}>
            {t('analytics:revenue.revenueByMonth')}
          </h2>
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={revenueChartData}>
              <defs>
                <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
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
                formatter={(value: number) => formatCurrency(value, preferences.language)}
              />
              <Area
                type="monotone"
                dataKey="revenue"
                stroke={COLORS.primary}
                strokeWidth={2}
                fillOpacity={1}
                fill="url(#colorRevenue)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Invoice Status Distribution */}
        <div className="card p-6">
          <h2 className="text-xl font-semibold mb-4" style={{ color: 'var(--text-primary)' }}>
            {t('analytics:invoices.invoicesByStatus')}
          </h2>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={statusChartData}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={100}
                paddingAngle={5}
                dataKey="value"
              >
                {statusChartData.map((entry, index) => (
                  <Cell 
                    key={`cell-${index}`} 
                    fill={
                      entry.name === 'Bezahlt' ? STATUS_COLORS.paid :
                      entry.name === 'Offen' ? STATUS_COLORS.pending :
                      entry.name === 'Überfällig' ? STATUS_COLORS.overdue :
                      STATUS_COLORS.draft
                    } 
                  />
                ))}
              </Pie>
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: 'var(--bg-primary)',
                  border: '1px solid var(--border)',
                  borderRadius: '8px'
                }}
                formatter={(value: number) => formatCurrency(value, preferences.language)}
              />
            </PieChart>
          </ResponsiveContainer>
          <div className="mt-4 space-y-2">
            {statusChartData.map((item, index) => (
              <div key={index} className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  <div 
                    className="w-3 h-3 rounded-full"
                    style={{ 
                      backgroundColor: 
                        item.name === 'Bezahlt' ? STATUS_COLORS.paid :
                        item.name === 'Offen' ? STATUS_COLORS.pending :
                        item.name === 'Überfällig' ? STATUS_COLORS.overdue :
                        STATUS_COLORS.draft
                    }}
                  />
                  <span style={{ color: 'var(--text-secondary)' }}>{item.name}</span>
                </div>
                <span style={{ color: 'var(--text-primary)' }} className="font-medium">
                  {item.count} ({formatCurrency(item.value, preferences.language)})
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Charts Row 2 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Customers */}
        <div className="card p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold" style={{ color: 'var(--text-primary)' }}>
              {t('analytics:customers.topCustomers')}
            </h2>
            <button 
              onClick={() => onNavigate?.('customers')} 
              className="text-sm hover:underline" 
              style={{ color: COLORS.primary }}
            >
              {t('common:actions.view')} →
            </button>
          </div>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={topCustomersChartData} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
              <XAxis 
                type="number"
                stroke="var(--text-secondary)"
                fontSize={12}
                tickFormatter={(value) => `€${(value / 1000).toFixed(0)}k`}
              />
              <YAxis 
                type="category"
                dataKey="name" 
                stroke="var(--text-secondary)"
                fontSize={12}
                width={120}
              />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: 'var(--bg-primary)',
                  border: '1px solid var(--border)',
                  borderRadius: '8px'
                }}
                formatter={(value: number) => formatCurrency(value, preferences.language)}
              />
              <Bar dataKey="revenue" fill={COLORS.primary} radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Recent Invoices */}
        <div className="card p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold" style={{ color: 'var(--text-primary)' }}>
              {t('analytics:invoices.title')}
            </h2>
            <button 
              onClick={() => onNavigate?.('invoice')} 
              className="text-sm hover:underline" 
              style={{ color: COLORS.primary }}
            >
              {t('common:actions.view')} →
            </button>
          </div>
          <div className="space-y-3">
            {recentInvoices.map((invoice) => (
              <button
                key={invoice.id}
                onClick={() => onInvoiceClick?.(invoice.id)}
                className="block w-full text-left p-3 rounded-lg hover:bg-gray-50 transition-colors"
                style={{ backgroundColor: 'var(--bg-tertiary)' }}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium" style={{ color: 'var(--text-primary)' }}>
                      {invoice.number}
                    </p>
                    <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                      {invoice.customerName}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-medium" style={{ color: 'var(--text-primary)' }}>
                      {formatCurrency(invoice.total, preferences.language)}
                    </p>
                    <span className={`text-sm ${
                      invoice.status === 'paid' ? 'status-paid' :
                      invoice.status === 'overdue' ? 'status-overdue' :
                      invoice.status === 'pending' ? 'status-pending' :
                      'status-draft'
                    }`}>
                      {invoice.status === 'paid' ? t('invoice:status.Bezahlt') :
                       invoice.status === 'pending' ? t('invoice:status.Offen') :
                       invoice.status === 'overdue' ? t('invoice:status.Überfällig') : t('invoice:status.Entwurf')}
                    </span>
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Project Progress */}
      <div className="card p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold" style={{ color: 'var(--text-primary)' }}>
            Projektfortschritt
          </h2>
          <button 
            onClick={() => onNavigate?.('projects')} 
            className="text-sm hover:underline" 
            style={{ color: COLORS.primary }}
          >
            Alle Projekte →
          </button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {projectMetrics.slice(0, 6).map((project) => (
            <div 
              key={project.project.id} 
              className="p-4 rounded-lg"
              style={{ backgroundColor: 'var(--bg-tertiary)' }}
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1">
                  <h3 className="font-medium text-sm" style={{ color: 'var(--text-primary)' }}>
                    {project.project.name}
                  </h3>
                  <p className="text-xs mt-1" style={{ color: 'var(--text-secondary)' }}>
                    {project.project.customerName}
                  </p>
                </div>
                <span 
                  className={`text-xs px-2 py-1 rounded-full ${
                    project.project.status === 'active' ? 'bg-green-100 text-green-800' :
                    project.project.status === 'completed' ? 'bg-blue-100 text-blue-800' :
                    'bg-gray-100 text-gray-800'
                  }`}
                >
                  {project.project.status === 'active' ? 'Aktiv' :
                   project.project.status === 'completed' ? 'Abgeschlossen' : 'Pausiert'}
                </span>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between text-xs">
                  <span style={{ color: 'var(--text-secondary)' }}>Budget</span>
                  <span style={{ color: 'var(--text-primary)' }}>
                    {formatCurrency(project.project.budget)}
                  </span>
                </div>
                <div className="flex justify-between text-xs">
                  <span style={{ color: 'var(--text-secondary)' }}>Abgerechnet</span>
                  <span style={{ color: 'var(--text-primary)' }}>
                    {formatCurrency(project.totalRevenue)}
                  </span>
                </div>
                <div className="w-full rounded-full h-2 mt-2" style={{ backgroundColor: 'var(--bg-secondary)' }}>
                  <div
                    className="h-2 rounded-full transition-all"
                    style={{ 
                      width: `${project.completionRate}%`,
                      backgroundColor: 
                        project.completionRate >= 90 ? COLORS.success :
                        project.completionRate >= 70 ? COLORS.warning :
                        COLORS.primary
                    }}
                  />
                </div>
                <p className="text-xs text-right" style={{ color: 'var(--text-secondary)' }}>
                  {project.completionRate.toFixed(0)}% abgeschlossen
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;