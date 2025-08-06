import { useQuery } from '@tanstack/react-query';
import { api } from '../lib/api';
import type { Article } from '../types/article';

interface ArticleUsageStats {
  totalUsage: number;
  totalRevenue: number;
  averageQuantity: number;
  averagePrice: number;
  lastUsedDate: string | null;
  monthlyUsage: Array<{
    month: string;
    count: number;
    revenue: number;
  }>;
  topCustomers: Array<{
    customerName: string;
    usageCount: number;
    totalRevenue: number;
  }>;
  priceHistory: Array<{
    date: string;
    price: number;
    change: number;
  }>;
}

export const useArticleUsageStats = (articleId: string | undefined) => {
  return useQuery<ArticleUsageStats | null, Error>({
    queryKey: ['article-usage-stats', articleId],
    queryFn: async () => {
      if (!articleId) return null;
      
      const article = await api.articles.get(articleId);
      if (!article) return null;
      
      // Simulate usage statistics
      const currentDate = new Date();
      const stats: ArticleUsageStats = {
        totalUsage: article.usageCount || 0,
        totalRevenue: article.totalRevenue || 0,
        averageQuantity: article.averageQuantity || 0,
        averagePrice: article.basePrice,
        lastUsedDate: article.lastUsedDate || null,
        monthlyUsage: [],
        topCustomers: [],
        priceHistory: []
      };
      
      // Generate monthly usage for last 6 months
      for (let i = 5; i >= 0; i--) {
        const month = new Date(currentDate.getFullYear(), currentDate.getMonth() - i, 1);
        const monthStr = month.toLocaleDateString('de-DE', { year: 'numeric', month: 'short' });
        const count = Math.floor(Math.random() * 20);
        const revenue = count * article.basePrice * (0.9 + Math.random() * 0.2);
        
        stats.monthlyUsage.push({
          month: monthStr,
          count,
          revenue
        });
      }
      
      // Generate top customers (mock data)
      const customers = ['Schmidt GmbH', 'Müller & Söhne', 'Bau AG'];
      stats.topCustomers = customers.map(customerName => ({
        customerName,
        usageCount: Math.floor(Math.random() * 10) + 1,
        totalRevenue: (Math.floor(Math.random() * 50) + 10) * article.basePrice
      })).sort((a, b) => b.totalRevenue - a.totalRevenue);
      
      // Generate price history
      let currentPrice = article.basePrice;
      for (let i = 5; i >= 0; i--) {
        const date = new Date(currentDate.getFullYear(), currentDate.getMonth() - i, 1);
        const change = (Math.random() - 0.5) * 5; // -2.5% to +2.5% change
        currentPrice = Math.max(currentPrice * (1 + change / 100), article.basePrice * 0.8);
        
        stats.priceHistory.push({
          date: date.toISOString(),
          price: currentPrice,
          change: i === 5 ? 0 : change
        });
      }
      
      return stats;
    },
    enabled: !!articleId,
    staleTime: 60000, // 1 minute
  });
};