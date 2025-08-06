export interface Article {
  id: string;
  name: string;
  description: string;
  unit: string;
  basePrice: number;
  category: string;
  // Additional fields
  isActive?: boolean;
  stock?: number;
  minStock?: number;
  taxRate?: number;
  notes?: string;
  createdAt?: string;
  updatedAt?: string;
  // Calculated/enriched fields (populated by hooks)
  usageCount?: number;
  totalRevenue?: number;
  lastUsedDate?: string;
  averageQuantity?: number;
  stockValue?: number;
}

export type CreateArticleDTO = Omit<Article, 'id'>;
export type UpdateArticleDTO = Partial<CreateArticleDTO>;
